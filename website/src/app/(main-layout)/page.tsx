'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Toolbar from '@/components/Toolbar'
import Sidebar from '@/components/Sidebar'
import PlayButton from '@/components/PlayButton'
import LoopSelector from '@/components/LoopSelector'
import Grid from '@/components/FlowGrid/Grid'
import type { LoopInfo, SectionStart } from '@/components/FlowGrid/Grid'
import Timeline from '@/components/FlowGrid/Timeline'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { usePlayhead } from '@/hooks/usePlayhead'
import { useRhymes } from '@/hooks/useRhymes'
import { useSettings, type Settings } from '@/hooks/useSettings'
import { randomSeed } from '@/lib/utils'
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX } from '@/lib/constants'
import { type Preset, generateBarsFromPreset } from '@/lib/rhymes'
import { usePresetAudio } from '@/hooks/usePresetAudio'

export default function Home() {
  const { settings, update, loaded } = useSettings()

  if (!loaded) return null

  return <FlowGrid settings={settings} update={update} />
}

function FlowGrid({ settings, update }: { settings: Settings; update: <K extends keyof Settings>(key: K, value: Settings[K]) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    scheduleTransition,
    cancelTransition,
    setLoopIndex,
  } = useAudioEngine(settings.metronomeEnabled, settings.selectedTrackIndex, settings.metronomeBpm, settings.trackVolume, settings.metronomeVolume)

  const { position, progressRef, playheadLineRef, timelineLineRef, resetPosition, scrollToBar } = usePlayhead(isPlaying, settings.barsPerLine, settings.audioOffset)

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

  const currentTrack = selectedTrackIndex === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[selectedTrackIndex]
  const currentLoop = currentTrack?.loops[currentLoopIndex] ?? null
  const multiLoop = (currentTrack?.loops.length ?? 0) > 1
  const lastSection = sectionStarts[sectionStarts.length - 1]

  function getNextBoundary(currentBar: number, epochBar: number, loopBars: number): number {
    if (loopBars <= 0) return currentBar
    return epochBar + Math.ceil((currentBar - epochBar + 1) / loopBars) * loopBars
  }

  const handleSelectLoop = useCallback((index: number) => {
    if (!currentTrack) return

    if (!isPlaying) {
      setLoopIndex(index)
      setQueuedLoopIndex(null)
      setTransitionBar(null)
      transitionBarRef.current = null
      setSectionStarts([{ bar: 0, loopIndex: index }])
      cancelTransition()
      return
    }

    if (index === currentLoopIndex && queuedLoopIndex !== null) {
      // Clicking current loop clears the queue — remove the pending section entry
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

    const boundary = getNextBoundary(position.bar, lastSection.bar, currentLoop.bars)
    // Add the section to sectionStarts immediately (so the header is always stable in the DOM)
    // If re-queuing, replace the pending entry; otherwise append
    const base = queuedLoopIndex !== null ? sectionStarts.slice(0, -1) : sectionStarts
    setSectionStarts([...base, { bar: boundary, loopIndex: index }])
    setQueuedLoopIndex(index)
    setTransitionBar(boundary)
    transitionBarRef.current = boundary
    scheduleTransition(index, boundary)
  }, [currentTrack, currentLoop, currentLoopIndex, isPlaying, position.bar, lastSection, sectionStarts, queuedLoopIndex, scheduleTransition, cancelTransition, setLoopIndex])

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

  const handleTrackChange = (index: number) => {
    changeTrack(index)
    update('selectedTrackIndex', index)
    setSectionStarts([{ bar: 0, loopIndex: 0 }])
    setQueuedLoopIndex(null)
    setTransitionBar(null)
    transitionBarRef.current = null
  }

  const handleWordListChange = (id: string) => {
    changeWordList(id)
    update('selectedListId', id)
  }

  const handleStop = () => {
    stop()
    resetPosition()
    regenerate()
    setSectionStarts([{ bar: 0, loopIndex: currentLoopIndex }])
    setQueuedLoopIndex(null)
    setTransitionBar(null)
    transitionBarRef.current = null
  }

  const loopInfo: LoopInfo | null = currentTrack ? {
    sectionStarts,
    loops: currentTrack.loops,
  } : null

  return (
    <>
      <Toolbar
        metronomeEnabled={settings.metronomeEnabled}
        onMetronomeChange={(v) => update('metronomeEnabled', v)}
        onOpenSettings={() => setSidebarOpen(true)}
        onRandomizeSeed={() => update('seed', randomSeed())}
      />
      <Timeline currentBeat={position.beat} currentBar={position.bar} barsPerLine={settings.barsPerLine} lineRef={timelineLineRef} progressRef={progressRef} isPlaying={isPlaying} />
      <Grid
        bars={presetBars ?? bars}
        position={position}
        isPlaying={isPlaying}
        playheadLineRef={playheadLineRef}
        barsPerLine={settings.barsPerLine}
        introBars={settings.introBars}
        scrollToBar={scrollToBar}
        loopInfo={loopInfo}
      />
      {multiLoop && currentTrack && (
        <LoopSelector
          loops={currentTrack.loops}
          currentLoopIndex={currentLoopIndex}
          queuedLoopIndex={queuedLoopIndex}
          onSelectLoop={handleSelectLoop}
        />
      )}
      <PlayButton
        isPlaying={isPlaying}
        onToggle={togglePlay}
        onStop={handleStop}
        selectedTrackIndex={selectedTrackIndex}
        onTrackChange={handleTrackChange}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedTrackIndex={selectedTrackIndex}
        wordLists={wordLists}
        selectedListId={selectedListId}
        onWordListChange={handleWordListChange}
        barsPerLine={settings.barsPerLine}
        onBarsPerLineChange={(v) => update('barsPerLine', v)}
        rhymePattern={settings.rhymePattern}
        onRhymePatternChange={(v) => update('rhymePattern', v)}
        fillMode={settings.fillMode}
        onFillModeChange={(v) => update('fillMode', v)}
        introBars={settings.introBars}
        onIntroBarsChange={(v) => update('introBars', v)}
        metronomeBpm={settings.metronomeBpm}
        onMetronomeBpmChange={(v) => update('metronomeBpm', v)}
        seed={settings.seed}
        onSeedChange={(v) => update('seed', v)}
        trackVolume={settings.trackVolume}
        onTrackVolumeChange={(v) => update('trackVolume', v)}
        metronomeVolume={settings.metronomeVolume}
        onMetronomeVolumeChange={(v) => update('metronomeVolume', v)}
        audioOffset={settings.audioOffset}
        onAudioOffsetChange={(v) => update('audioOffset', v)}
      />
    </>
  )
}
