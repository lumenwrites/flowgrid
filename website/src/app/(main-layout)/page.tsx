'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Toolbar from '@/components/Toolbar'
import Sidebar from '@/components/Sidebar'
import DictionaryModal from '@/components/DictionaryModal'
import PlaybackToolbar from '@/components/PlaybackToolbar'
import LoopSelector from '@/components/LoopSelector'
import Grid from '@/components/FlowGrid/Grid'
import Timeline from '@/components/FlowGrid/Timeline'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { usePlayhead } from '@/hooks/usePlayhead'
import { useRhymes } from '@/hooks/useRhymes'
import { useSettings, type Settings } from '@/hooks/useSettings'
import { randomSeed } from '@/lib/utils'
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX, type LoopInfo, type SectionStart, type Loop, getFileForBpm, mixFileUrl, getBpmVariants } from '@/lib/constants'
import { type BarData, type RhymeColor, generateBarsFromGrid, buildDisplayBars } from '@/lib/rhymes'
import { parseGrid } from '@/lib/grid-format'

function getNextBoundary(currentBar: number, epochBar: number, loopBars: number): number {
  if (loopBars <= 0) return currentBar
  return epochBar + Math.ceil((currentBar - epochBar + 1) / loopBars) * loopBars
}

export default function Home() {
  const { settings, update, loaded } = useSettings()

  if (!loaded) return null

  return <FlowGrid settings={settings} update={update} />
}

function FlowGrid({ settings, update }: { settings: Settings; update: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  const barsPerLine = settings.selectedTrackIndex !== NONE_TRACK_INDEX
    ? (AVAILABLE_TRACKS[settings.selectedTrackIndex]?.barsPerLine ?? 1)
    : 1
  const countdownBars = settings.countdownLines * barsPerLine
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === 'true') setIsAdmin(true)
  }, [])

  const {
    isPlaying,
    selectedTrackIndex,
    currentLoopIndex,
    play,
    togglePlay,
    changeTrack,
    stop,
    seekToBar: seekToBarAudio,
    scheduleTransition,
    cancelTransition,
    setLoopIndex,
    loadMix,
    adjustBpm,
  } = useAudioEngine(settings.metronomeEnabled, settings.selectedTrackIndex, settings.metronomeBpm, settings.trackVolume, settings.metronomeVolume, settings.trackBpm, countdownBars)

  const { position, progressRef, playheadLineRef, timelineLineRef, resetPosition, seekTo, scrollToBar } = usePlayhead(isPlaying, barsPerLine, settings.audioOffset, countdownBars)

  const {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  } = useRhymes(settings.rhymePattern, barsPerLine, settings.selectedListId, settings.fillMode, settings.seed)

  // Loop state — sectionStarts grows as transitions complete, so past headers stay in DOM
  const [sectionStarts, setSectionStarts] = useState<SectionStart[]>([{ bar: countdownBars, loopIndex: 0 }])
  const prevCountdownBarsRef = useRef(countdownBars)
  const [queuedLoopIndex, setQueuedLoopIndex] = useState<number | null>(null)
  const [transitionBar, setTransitionBar] = useState<number | null>(null)
  const transitionBarRef = useRef<number | null>(null)

  const [activeMixIndex, setActiveMixIndex] = useState<number | null>(null)

  const currentTrack = selectedTrackIndex === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[selectedTrackIndex]
  const currentLoop = currentTrack?.loops[currentLoopIndex] ?? null
  const multiLoop = (currentTrack?.loops.length ?? 0) > 1
  const hasMixes = (currentTrack?.mixes?.length ?? 0) > 0

  const activeMix = activeMixIndex !== null ? currentTrack?.mixes?.[activeMixIndex] ?? null : null
  const mixTotalBars = activeMix ? activeMix.sections.reduce((sum, s) => sum + s.bars, 0) : 0

  const mixLoopInfo: LoopInfo | null = useMemo(() => {
    if (!activeMix) return null
    const starts: SectionStart[] = []
    const fakeLoops: Loop[] = []
    let bar = countdownBars
    for (const section of activeMix.sections) {
      starts.push({ bar, loopIndex: fakeLoops.length })
      fakeLoops.push({ name: section.name, files: [], bars: section.bars, instrumental: section.instrumental })
      bar += section.bars
    }
    return { sectionStarts: starts, loops: fakeLoops }
  }, [activeMix, countdownBars])

  // For mixes, the rhyme pool should only cover non-instrumental bars.
  // buildDisplayBars will then expand this back to the full bar count by
  // inserting blank bars at instrumental positions.
  const mixNonInstrumentalBars = activeMix
    ? activeMix.sections.filter(s => !s.instrumental).reduce((sum, s) => sum + s.bars, 0)
    : 0

  const mixBars = useMemo(() => {
    if (!activeMix) return null
    if (activeMix.grid) {
      const gridText = Array.isArray(activeMix.grid) ? activeMix.grid.join('\n') : activeMix.grid
      return generateBarsFromGrid(parseGrid(gridText), settings.fillMode)
    }
    return bars.slice(0, mixNonInstrumentalBars)
  }, [activeMix, mixNonInstrumentalBars, bars, settings.fillMode])

  // Stop and reset when countdown setting changes
  useEffect(() => {
    if (prevCountdownBarsRef.current === countdownBars) return
    prevCountdownBarsRef.current = countdownBars
    stop()
    resetPosition()
    regenerate()
    setSectionStarts([{ bar: countdownBars, loopIndex: 0 }])
    setQueuedLoopIndex(null)
    setTransitionBar(null)
    transitionBarRef.current = null
  }, [countdownBars, stop, resetPosition, regenerate])

  const resetLoopState = useCallback((loopIndex: number) => {
    setSectionStarts([{ bar: countdownBars, loopIndex }])
    setQueuedLoopIndex(null)
    setTransitionBar(null)
    transitionBarRef.current = null
  }, [countdownBars])

  const handleExitMix = useCallback(async () => {
    setActiveMixIndex(null)
    stop()
    resetPosition()
    regenerate()
    resetLoopState(0)
    const loop = currentTrack?.loops[0]
    if (loop) {
      const audioFile = getFileForBpm(loop.files, settings.trackBpm)
      if (audioFile.bpm !== settings.trackBpm) update('trackBpm', audioFile.bpm)
    }
    await changeTrack(settings.selectedTrackIndex)
  }, [stop, resetPosition, regenerate, resetLoopState, changeTrack, settings.selectedTrackIndex, currentTrack, settings.trackBpm, update])

  const handleSelectMix = useCallback(async (index: number) => {
    if (!currentTrack?.mixes) return
    if (index === activeMixIndex) return
    const mix = currentTrack.mixes[index]
    if (!mix) return
    const audioFile = getFileForBpm(mix.files, settings.trackBpm)
    if (audioFile.bpm !== settings.trackBpm) update('trackBpm', audioFile.bpm)
    setActiveMixIndex(index)
    resetLoopState(0)
    resetPosition()
    await loadMix(mixFileUrl(currentTrack, audioFile), audioFile.bpm)
  }, [currentTrack, activeMixIndex, resetLoopState, resetPosition, loadMix, settings.trackBpm, update])

  const handleSelectLoop = useCallback((index: number) => {
    if (!currentTrack) return

    if (activeMixIndex !== null) {
      handleExitMix()
      return
    }

    if (!isPlaying) {
      setLoopIndex(index)
      resetLoopState(index)
      cancelTransition()
      return
    }

    if (index === currentLoopIndex && queuedLoopIndex !== null) {
      setSectionStarts(prev => prev.slice(0, -1))
      setQueuedLoopIndex(null)
      setTransitionBar(null)
      transitionBarRef.current = null
      cancelTransition()
      return
    }

    if (index === currentLoopIndex) return

    const nextLoop = currentTrack.loops[index]
    if (!nextLoop || !currentLoop) return

    // Use the committed (currently playing) section as epoch, not the pending one
    // All bar references are in transport coordinates
    const committedSection = queuedLoopIndex !== null
      ? sectionStarts[sectionStarts.length - 2]
      : sectionStarts[sectionStarts.length - 1]
    const boundary = getNextBoundary(position.bar, committedSection.bar, currentLoop.bars)
    const base = queuedLoopIndex !== null ? sectionStarts.slice(0, -1) : sectionStarts
    setSectionStarts([...base, { bar: boundary, loopIndex: index }])
    setQueuedLoopIndex(index)
    setTransitionBar(boundary)
    transitionBarRef.current = boundary
    scheduleTransition(index, boundary)
  }, [currentTrack, currentLoop, currentLoopIndex, isPlaying, position.bar, sectionStarts, queuedLoopIndex, scheduleTransition, cancelTransition, setLoopIndex, resetLoopState, activeMixIndex, handleExitMix])

  // When playhead crosses the transition boundary, just clear the queue (section already in sectionStarts)
  useEffect(() => {
    if (transitionBarRef.current === null || queuedLoopIndex === null) return
    if (position.bar >= transitionBarRef.current) {
      setQueuedLoopIndex(null)
      setTransitionBar(null)
      transitionBarRef.current = null
    }
  }, [position.bar, queuedLoopIndex])

  // Extend bars as playhead progresses
  useEffect(() => {
    if (position.contentBar >= 0) extendBars(position.contentBar)
  }, [position.contentBar, extendBars])

  // Auto-stop when mix finishes (keep mix active so user can replay)
  useEffect(() => {
    if (!isPlaying || !activeMix) return
    if (position.contentBar >= mixTotalBars) {
      stop()
      resetPosition()
    }
  }, [position.bar, isPlaying, activeMix, mixTotalBars, stop, resetPosition])

  const handleBpmChange = useCallback(async (newBpm: number) => {
    update('trackBpm', newBpm)
    if (!currentTrack) return

    if (activeMix) {
      // Variant mix: reload with new file
      if (activeMix.files.length > 1) {
        const audioFile = getFileForBpm(activeMix.files, newBpm)
        const wasPlaying = isPlaying
        resetLoopState(0)
        resetPosition()
        await loadMix(mixFileUrl(currentTrack, audioFile), audioFile.bpm)
        if (wasPlaying) await play()
      } else {
        // Single-file mix: live rate adjustment
        adjustBpm(newBpm, activeMix.files[0].bpm)
      }
      return
    }

    // Variant loops: reload track with new files
    if ((currentTrack.loops[0]?.files.length ?? 0) > 1) {
      resetLoopState(currentLoopIndex)
      resetPosition()
      await changeTrack(settings.selectedTrackIndex, newBpm)
    } else {
      // Single-file loops: live rate adjustment
      adjustBpm(newBpm, currentTrack.bpm)
    }
  }, [currentTrack, activeMix, currentLoopIndex, isPlaying, settings.selectedTrackIndex, update, resetLoopState, resetPosition, loadMix, play, adjustBpm, changeTrack])

  const handleTrackChange = (index: number) => {
    const track = index === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[index]
    const newBpm = track ? track.bpm : settings.metronomeBpm
    setActiveMixIndex(null)
    stop()
    changeTrack(index, newBpm)
    update('selectedTrackIndex', index)
    update('trackBpm', newBpm)
    resetPosition()
    regenerate()
    resetLoopState(0)
  }

  const handleWordListChange = (id: string) => {
    changeWordList(id)
    update('selectedListId', id)
  }

  const handleStop = () => {
    stop()
    resetPosition()
    if (activeMixIndex === null) {
      regenerate()
      resetLoopState(currentLoopIndex)
    }
  }

  const loopInfo: LoopInfo | null = useMemo(() => {
    if (!currentTrack) return null
    return { sectionStarts, loops: currentTrack.loops }
  }, [currentTrack, sectionStarts])

  const activeLoopInfo = mixLoopInfo ?? loopInfo

  const handleBeatClick = useCallback((barIndex: number, beat: number) => {
    const info = activeLoopInfo
    let sectionStartBar = 0
    let targetLoopIndex = currentLoopIndex
    if (info) {
      for (const s of info.sectionStarts) {
        if (s.bar <= barIndex) { sectionStartBar = s.bar; targetLoopIndex = s.loopIndex }
        else break
      }
    }

    if (activeMixIndex !== null) {
      seekToBarAudio(barIndex, beat)
    } else if (currentTrack) {
      seekToBarAudio(barIndex, beat, targetLoopIndex, sectionStartBar)
      // When seeking to a different section: clear transition state but keep section
      // headers visible (don't trim sectionStarts)
      if (targetLoopIndex !== currentLoopIndex) {
        setQueuedLoopIndex(null)
        setTransitionBar(null)
        transitionBarRef.current = null
      }
    } else {
      seekToBarAudio(barIndex, beat)
    }

    seekTo(barIndex, beat)
  }, [activeLoopInfo, currentLoopIndex, activeMixIndex, currentTrack, seekToBarAudio, seekTo])

  // Remap the flat rhyme pool so instrumental sections get blank bars and
  // non-instrumental sections pull rhymes sequentially (preserving pair alignment).
  // Then prepend countdown bars so Grid renders everything in transport coordinates.
  const BLANK_COLOR: RhymeColor = { bg: 'transparent', border: 'transparent', activeBg: 'transparent', activeBorder: 'transparent' }
  const displayBars = useMemo(() => {
    let contentBars: BarData[]
    if (mixBars) contentBars = buildDisplayBars(mixBars, mixLoopInfo)
    else contentBars = buildDisplayBars(bars, loopInfo)

    const countdown = countdownBars
    if (countdown === 0) return contentBars

    const countdownEntries: BarData[] = Array.from({ length: countdown }, (_, i) => ({
      id: `countdown-${i}`, index: i, rhymeWord: '', rhymeColor: BLANK_COLOR, familyId: -1, rhymeHidden: false,
    }))
    const reindexed = contentBars.map(bar => ({ ...bar, index: bar.index + countdown }))
    return [...countdownEntries, ...reindexed]
  }, [mixBars, mixLoopInfo, bars, loopInfo, countdownBars])

  return (
    <>
      <Toolbar
        onOpenSettings={() => setSidebarOpen(true)}
        onOpenDictionary={() => setDictionaryModalOpen(true)}
        onRandomizeSeed={() => update('seed', randomSeed())}
      />
      <Timeline currentBeat={position.beat} currentBar={position.bar} barsPerLine={barsPerLine} lineRef={timelineLineRef} progressRef={progressRef} isPlaying={isPlaying} />
      <Grid
        bars={displayBars}
        position={position}
        isPlaying={isPlaying}
        playheadLineRef={playheadLineRef}
        barsPerLine={barsPerLine}
        scrollToBar={scrollToBar}
        loopInfo={activeLoopInfo}
        onBeatClick={handleBeatClick}
      />
      {currentTrack && (multiLoop || hasMixes) && (
        <LoopSelector
          loops={currentTrack.loops}
          currentLoopIndex={currentLoopIndex}
          queuedLoopIndex={queuedLoopIndex}
          onSelectLoop={handleSelectLoop}
          mixes={currentTrack.mixes}
          activeMixIndex={activeMixIndex}
          onSelectMix={handleSelectMix}
        />
      )}
      <PlaybackToolbar
        isPlaying={isPlaying}
        onToggle={togglePlay}
        onStop={handleStop}
        selectedTrackIndex={selectedTrackIndex}
        onTrackChange={handleTrackChange}
        isAdmin={isAdmin}
        metronomeEnabled={settings.metronomeEnabled}
        metronomeTicking={isPlaying && (settings.metronomeEnabled || position.contentBar < 0)}
        beat={position.beat}
        onMetronomeChange={(v) => update('metronomeEnabled', v)}
        trackBpm={settings.trackBpm}
        nativeBpm={currentTrack?.bpm ?? settings.metronomeBpm}
        bpmVariants={activeMix ? getBpmVariants(activeMix) : currentLoop ? getBpmVariants(currentLoop) : undefined}
        onTrackBpmChange={handleBpmChange}
        metronomeBpm={settings.metronomeBpm}
        onMetronomeBpmChange={(v) => update('metronomeBpm', v)}
        trackVolume={settings.trackVolume}
        onTrackVolumeChange={(v) => update('trackVolume', v)}
        metronomeVolume={settings.metronomeVolume}
        onMetronomeVolumeChange={(v) => update('metronomeVolume', v)}
        countdownLines={settings.countdownLines}
        onCountdownLinesChange={(v) => update('countdownLines', v)}
        trackModalTab={settings.trackModalTab}
        onTrackModalTabChange={(v) => update('trackModalTab', v)}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        audioOffset={settings.audioOffset}
        onAudioOffsetChange={(v) => update('audioOffset', v)}
      />
      <DictionaryModal
        open={dictionaryModalOpen}
        onClose={() => setDictionaryModalOpen(false)}
        wordLists={wordLists}
        selectedListId={selectedListId}
        onWordListChange={handleWordListChange}
        rhymePattern={settings.rhymePattern}
        onRhymePatternChange={(v) => update('rhymePattern', v)}
        fillMode={settings.fillMode}
        onFillModeChange={(v) => update('fillMode', v)}
        seed={settings.seed}
        onSeedChange={(v) => update('seed', v)}
      />
    </>
  )
}
