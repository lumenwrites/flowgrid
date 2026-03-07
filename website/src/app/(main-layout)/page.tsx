'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Toolbar from '@/components/Toolbar'
import Sidebar from '@/components/Sidebar'
import PlaybackToolbar from '@/components/PlaybackToolbar'
import LoopSelector from '@/components/LoopSelector'
import Grid from '@/components/FlowGrid/Grid'
import Timeline from '@/components/FlowGrid/Timeline'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { usePlayhead } from '@/hooks/usePlayhead'
import { useRhymes } from '@/hooks/useRhymes'
import { useSettings, type Settings } from '@/hooks/useSettings'
import { randomSeed } from '@/lib/utils'
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX, type LoopInfo, type SectionStart, type Loop } from '@/lib/constants'
import { type Preset, generateBarsFromPreset } from '@/lib/rhymes'
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
    loadExample,
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

  const [activeExampleIndex, setActiveExampleIndex] = useState<number | null>(null)

  const currentTrack = selectedTrackIndex === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[selectedTrackIndex]
  const currentLoop = currentTrack?.loops[currentLoopIndex] ?? null
  const multiLoop = (currentTrack?.loops.length ?? 0) > 1
  const hasExamples = (currentTrack?.examples?.length ?? 0) > 0

  const activeExample = activeExampleIndex !== null ? currentTrack?.examples?.[activeExampleIndex] ?? null : null
  const exampleTotalBars = activeExample ? activeExample.sections.reduce((sum, s) => sum + s.bars, 0) : 0

  const exampleBars = useMemo(() => {
    if (!activeExample) return null
    if (activeExample.rhymes) {
      return generateBarsFromPreset(
        { words: activeExample.rhymes, pattern: settings.rhymePattern },
        settings.barsPerLine, settings.fillMode, 0,
      )
    }
    return bars.slice(0, exampleTotalBars)
  }, [activeExample, exampleTotalBars, bars, settings.rhymePattern, settings.barsPerLine, settings.fillMode])

  const exampleLoopInfo: LoopInfo | null = useMemo(() => {
    if (!activeExample) return null
    const starts: SectionStart[] = []
    const fakeLoops: Loop[] = []
    let bar = 0
    for (const section of activeExample.sections) {
      starts.push({ bar, loopIndex: fakeLoops.length })
      fakeLoops.push({ name: section.name, file: '', bars: section.bars })
      bar += section.bars
    }
    return { sectionStarts: starts, loops: fakeLoops }
  }, [activeExample])

  const resetLoopState = useCallback((loopIndex: number) => {
    setSectionStarts([{ bar: 0, loopIndex }])
    setQueuedLoopIndex(null)
    setTransitionBar(null)
    transitionBarRef.current = null
  }, [])

  const handleExitExample = useCallback(async () => {
    setActiveExampleIndex(null)
    stop()
    resetPosition()
    regenerate()
    resetLoopState(0)
    await changeTrack(settings.selectedTrackIndex)
  }, [stop, resetPosition, regenerate, resetLoopState, changeTrack, settings.selectedTrackIndex])

  const handleSelectExample = useCallback(async (index: number) => {
    if (!currentTrack?.examples) return
    if (index === activeExampleIndex) return
    const example = currentTrack.examples[index]
    if (!example) return
    setActiveExampleIndex(index)
    resetLoopState(0)
    resetPosition()
    await loadExample(example.file)
  }, [currentTrack, activeExampleIndex, resetLoopState, resetPosition, loadExample])

  const handleSelectLoop = useCallback((index: number) => {
    if (!currentTrack) return

    if (activeExampleIndex !== null) {
      handleExitExample()
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
  }, [currentTrack, currentLoop, currentLoopIndex, isPlaying, position.bar, sectionStarts, queuedLoopIndex, scheduleTransition, cancelTransition, setLoopIndex, resetLoopState, activeExampleIndex, handleExitExample])

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

  // Auto-stop when example finishes (keep example active so user can replay)
  useEffect(() => {
    if (!isPlaying || !activeExample) return
    if (position.bar >= exampleTotalBars) {
      stop()
      resetPosition()
    }
  }, [position.bar, isPlaying, activeExample, exampleTotalBars, stop, resetPosition])

  const handleTrackChange = (index: number) => {
    setActiveExampleIndex(null)
    changeTrack(index)
    update('selectedTrackIndex', index)
    resetLoopState(0)
  }

  const handleWordListChange = (id: string) => {
    changeWordList(id)
    update('selectedListId', id)
  }

  const handleStop = () => {
    stop()
    resetPosition()
    if (activeExampleIndex === null) {
      regenerate()
      resetLoopState(currentLoopIndex)
    }
  }

  const loopInfo: LoopInfo | null = useMemo(() => {
    if (!currentTrack) return null
    return { sectionStarts, loops: currentTrack.loops }
  }, [currentTrack, sectionStarts])

  return (
    <>
      <Toolbar
        metronomeEnabled={settings.metronomeEnabled}
        metronomeTicking={isPlaying && settings.metronomeEnabled}
        beat={position.beat}
        onMetronomeChange={(v) => update('metronomeEnabled', v)}
        onOpenSettings={() => setSidebarOpen(true)}
        onRandomizeSeed={() => update('seed', randomSeed())}
      />
      <Timeline currentBeat={position.beat} currentBar={position.bar} barsPerLine={settings.barsPerLine} lineRef={timelineLineRef} progressRef={progressRef} isPlaying={isPlaying} />
      <Grid
        bars={exampleBars ?? presetBars ?? bars}
        position={position}
        isPlaying={isPlaying}
        playheadLineRef={playheadLineRef}
        barsPerLine={settings.barsPerLine}
        introBars={activeExample ? 0 : settings.introBars}
        scrollToBar={scrollToBar}
        loopInfo={exampleLoopInfo ?? loopInfo}
      />
      {currentTrack && (multiLoop || hasExamples) && (
        <LoopSelector
          loops={currentTrack.loops}
          currentLoopIndex={currentLoopIndex}
          queuedLoopIndex={queuedLoopIndex}
          onSelectLoop={handleSelectLoop}
          examples={currentTrack.examples}
          activeExampleIndex={activeExampleIndex}
          onSelectExample={handleSelectExample}
        />
      )}
      <PlaybackToolbar
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
