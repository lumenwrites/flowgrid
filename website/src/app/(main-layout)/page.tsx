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
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX, type LoopInfo, type SectionStart, type Loop, mixUrl } from '@/lib/constants'
import { type Preset, generateBarsFromPreset, buildDisplayBars } from '@/lib/rhymes'
import { usePresetAudio } from '@/hooks/usePresetAudio'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false)
  const [preset, setPreset] = useState<Preset | null>(null)

  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get('preset')
    if (!name) return
    fetch(`/presets/${name}.json`)
      .then(r => r.json())
      .then((data: Preset) => setPreset(data))
      .catch(console.error)
  }, [])

  const presetBars = useMemo(() => {
    if (!preset) return null
    return generateBarsFromPreset(preset, settings.barsPerLine, settings.fillMode, settings.introBars)
  }, [preset, settings.barsPerLine, settings.fillMode, settings.introBars])

  usePresetAudio(preset?.audio ?? null)

  const {
    isPlaying,
    selectedTrackIndex,
    currentLoopIndex,
    togglePlay,
    changeTrack,
    stop,
    seekToBar: seekToBarAudio,
    scheduleTransition,
    cancelTransition,
    setLoopIndex,
    loadMix,
  } = useAudioEngine(settings.metronomeEnabled, settings.selectedTrackIndex, settings.metronomeBpm, settings.trackVolume, settings.metronomeVolume, settings.trackBpm)

  const { position, progressRef, playheadLineRef, timelineLineRef, resetPosition, seekTo, scrollToBar } = usePlayhead(isPlaying, settings.barsPerLine, settings.audioOffset)

  const {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  } = useRhymes(settings.rhymePattern, settings.barsPerLine, settings.selectedListId, settings.fillMode, settings.seed, settings.introBars)

  // Loop state — sectionStarts grows as transitions complete, so past headers stay in DOM
  const [sectionStarts, setSectionStarts] = useState<SectionStart[]>([{ bar: 0, loopIndex: 0 }])
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
    let bar = 0
    for (const section of activeMix.sections) {
      starts.push({ bar, loopIndex: fakeLoops.length })
      fakeLoops.push({ name: section.name, file: '', bars: section.bars, instrumental: section.instrumental })
      bar += section.bars
    }
    return { sectionStarts: starts, loops: fakeLoops }
  }, [activeMix])

  // For mixes, the rhyme pool should only cover non-instrumental bars.
  // buildDisplayBars will then expand this back to the full bar count by
  // inserting blank bars at instrumental positions.
  const mixNonInstrumentalBars = activeMix
    ? activeMix.sections.filter(s => !s.instrumental).reduce((sum, s) => sum + s.bars, 0)
    : 0

  const mixBars = useMemo(() => {
    if (!activeMix) return null
    if (activeMix.rhymes) {
      return generateBarsFromPreset(
        { words: activeMix.rhymes, pattern: settings.rhymePattern },
        settings.barsPerLine, settings.fillMode, 0,
      )
    }
    return bars.slice(0, mixNonInstrumentalBars)
  }, [activeMix, mixNonInstrumentalBars, bars, settings.rhymePattern, settings.barsPerLine, settings.fillMode])

  const resetLoopState = useCallback((loopIndex: number) => {
    setSectionStarts([{ bar: 0, loopIndex }])
    setQueuedLoopIndex(null)
    setTransitionBar(null)
    transitionBarRef.current = null
  }, [])

  const handleExitMix = useCallback(async () => {
    setActiveMixIndex(null)
    stop()
    resetPosition()
    regenerate()
    resetLoopState(0)
    await changeTrack(settings.selectedTrackIndex)
  }, [stop, resetPosition, regenerate, resetLoopState, changeTrack, settings.selectedTrackIndex])

  const handleSelectMix = useCallback(async (index: number) => {
    if (!currentTrack?.mixes) return
    if (index === activeMixIndex) return
    const mix = currentTrack.mixes[index]
    if (!mix) return
    setActiveMixIndex(index)
    resetLoopState(0)
    resetPosition()
    await loadMix(mixUrl(currentTrack, mix))
  }, [currentTrack, activeMixIndex, resetLoopState, resetPosition, loadMix])

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
    extendBars(position.bar)
  }, [position.bar, extendBars])

  // Stop playback when we run out of preset bars
  useEffect(() => {
    if (!isPlaying) return
    if (presetBars && position.bar >= presetBars.length) {
      stop()
      resetPosition()
      regenerate()
    }
  }, [position.bar, presetBars, isPlaying, stop, resetPosition, regenerate])

  // Auto-stop when mix finishes (keep mix active so user can replay)
  useEffect(() => {
    if (!isPlaying || !activeMix) return
    if (position.bar >= mixTotalBars) {
      stop()
      resetPosition()
    }
  }, [position.bar, isPlaying, activeMix, mixTotalBars, stop, resetPosition])

  // Variant BPM change reloads audio from bar 0 — reset grid to match
  useEffect(() => {
    if (!currentTrack?.bpmVariants) return
    resetLoopState(currentLoopIndex)
    resetPosition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.trackBpm])

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
    if (track?.barsPerLine) update('barsPerLine', track.barsPerLine)
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
  // bars/mixBars = rhyme pool; loopInfo/mixLoopInfo = section structure.
  const displayBars = useMemo(() => {
    if (mixBars) return buildDisplayBars(mixBars, mixLoopInfo)
    if (presetBars) return presetBars
    return buildDisplayBars(bars, loopInfo)
  }, [mixBars, mixLoopInfo, presetBars, bars, loopInfo])

  return (
    <>
      <Toolbar
        onOpenSettings={() => setSidebarOpen(true)}
        onOpenDictionary={() => setDictionaryModalOpen(true)}
        onRandomizeSeed={() => update('seed', randomSeed())}
      />
      <Timeline currentBeat={position.beat} currentBar={position.bar} barsPerLine={settings.barsPerLine} lineRef={timelineLineRef} progressRef={progressRef} isPlaying={isPlaying} />
      <Grid
        bars={displayBars}
        position={position}
        isPlaying={isPlaying}
        playheadLineRef={playheadLineRef}
        barsPerLine={settings.barsPerLine}
        introBars={activeMix ? 0 : settings.introBars}
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
        metronomeEnabled={settings.metronomeEnabled}
        metronomeTicking={isPlaying && settings.metronomeEnabled}
        beat={position.beat}
        onMetronomeChange={(v) => update('metronomeEnabled', v)}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedTrackIndex={selectedTrackIndex}
        barsPerLine={settings.barsPerLine}
        onBarsPerLineChange={(v) => update('barsPerLine', v)}
        introBars={settings.introBars}
        onIntroBarsChange={(v) => update('introBars', v)}
        trackBpm={settings.trackBpm}
        nativeBpm={currentTrack?.bpm ?? settings.metronomeBpm}
        bpmVariants={currentTrack?.bpmVariants}
        onTrackBpmChange={(v) => update('trackBpm', v)}
        metronomeBpm={settings.metronomeBpm}
        onMetronomeBpmChange={(v) => update('metronomeBpm', v)}
        trackVolume={settings.trackVolume}
        onTrackVolumeChange={(v) => update('trackVolume', v)}
        metronomeVolume={settings.metronomeVolume}
        onMetronomeVolumeChange={(v) => update('metronomeVolume', v)}
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
