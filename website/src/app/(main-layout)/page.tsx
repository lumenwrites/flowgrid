'use client'

import { useState, useEffect } from 'react'
import Toolbar from '@/components/Toolbar'
import Sidebar from '@/components/Sidebar'
import PlayButton from '@/components/PlayButton'
import Grid from '@/components/FlowGrid/Grid'
import Timeline from '@/components/FlowGrid/Timeline'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { usePlayhead } from '@/hooks/usePlayhead'
import { useRhymes } from '@/hooks/useRhymes'
import { useSettings } from '@/hooks/useSettings'

export default function Home() {
  const { settings, update, loaded } = useSettings()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    isPlaying,
    selectedBeatIndex,
    togglePlay,
    changeBeat,
    stop,
  } = useAudioEngine(settings.metronomeEnabled, settings.selectedBeatIndex)

  const { position, playheadLineRef, timelineLineRef, resetPosition } = usePlayhead(isPlaying, settings.barsPerLine)

  const {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  } = useRhymes(settings.rhymePattern, settings.barsPerLine, settings.barCount, settings.selectedListId)

  // Extend bars as playhead progresses
  useEffect(() => {
    extendBars(position.bar)
  }, [position.bar, extendBars])

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

  if (!loaded) return null

  return (
    <>
      <Toolbar
        metronomeEnabled={settings.metronomeEnabled}
        onMetronomeChange={(v) => update('metronomeEnabled', v)}
        onOpenSettings={() => setSidebarOpen(true)}
      />
      <Timeline currentBeat={position.beat} currentBar={position.bar} barsPerLine={settings.barsPerLine} lineRef={timelineLineRef} />
      <Grid
        bars={bars}
        position={position}
        isPlaying={isPlaying}
        playheadLineRef={playheadLineRef}
        barsPerLine={settings.barsPerLine}
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
      />
    </>
  )
}
