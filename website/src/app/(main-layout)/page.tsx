'use client'

import { useState, useEffect, useMemo } from 'react'
import Toolbar from '@/components/Toolbar'
import Sidebar from '@/components/Sidebar'
import PlayButton from '@/components/PlayButton'
import Grid from '@/components/FlowGrid/Grid'
import Timeline from '@/components/FlowGrid/Timeline'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { usePlayhead } from '@/hooks/usePlayhead'
import { useRhymes } from '@/hooks/useRhymes'
import { useSettings, type Settings } from '@/hooks/useSettings'
import { randomSeed } from '@/lib/utils'
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
    selectedBeatIndex,
    togglePlay,
    changeBeat,
    stop,
  } = useAudioEngine(settings.metronomeEnabled, settings.selectedBeatIndex, settings.metronomeBpm, settings.beatVolume, settings.metronomeVolume)

  const { position, progressRef, playheadLineRef, timelineLineRef, resetPosition, scrollToBar } = usePlayhead(isPlaying, settings.barsPerLine, settings.audioOffset)

  const {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  } = useRhymes(settings.rhymePattern, settings.barsPerLine, settings.barCount, settings.selectedListId, settings.fillMode, settings.seed, settings.introBars)

  // Extend bars as playhead progresses
  useEffect(() => {
    extendBars(position.bar)
  }, [position.bar, extendBars])

  // Stop playback when we run out of bars (preset or fixed bar count)
  useEffect(() => {
    if (!isPlaying) return
    const barLimit = presetBars
      ? presetBars.length
      : settings.barCount !== 0 ? bars.length : null
    if (barLimit !== null && position.bar >= barLimit) {
      stop()
      resetPosition()
      regenerate()
    }
  }, [position.bar, presetBars, bars.length, settings.barCount, isPlaying, stop, resetPosition, regenerate])

  const handleBeatChange = (index: number) => {
    changeBeat(index)
    update('selectedBeatIndex', index)
  }

  const handleWordListChange = (id: string) => {
    changeWordList(id)
    update('selectedListId', id)
  }

  const handleStop = () => {
    stop()
    resetPosition()
    regenerate()
  }

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
      />
      <PlayButton
        isPlaying={isPlaying}
        onToggle={togglePlay}
        onStop={handleStop}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedBeatIndex={selectedBeatIndex}
        onBeatChange={handleBeatChange}
        wordLists={wordLists}
        selectedListId={selectedListId}
        onWordListChange={handleWordListChange}
        barsPerLine={settings.barsPerLine}
        onBarsPerLineChange={(v) => update('barsPerLine', v)}
        rhymePattern={settings.rhymePattern}
        onRhymePatternChange={(v) => update('rhymePattern', v)}
        barCount={settings.barCount}
        onBarCountChange={(v) => update('barCount', v)}
        fillMode={settings.fillMode}
        onFillModeChange={(v) => update('fillMode', v)}
        introBars={settings.introBars}
        onIntroBarsChange={(v) => update('introBars', v)}
        metronomeBpm={settings.metronomeBpm}
        onMetronomeBpmChange={(v) => update('metronomeBpm', v)}
        seed={settings.seed}
        onSeedChange={(v) => update('seed', v)}
        beatVolume={settings.beatVolume}
        onBeatVolumeChange={(v) => update('beatVolume', v)}
        metronomeVolume={settings.metronomeVolume}
        onMetronomeVolumeChange={(v) => update('metronomeVolume', v)}
        audioOffset={settings.audioOffset}
        onAudioOffsetChange={(v) => update('audioOffset', v)}
      />
    </>
  )
}
