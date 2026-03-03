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
import { DEFAULT_BAR_COUNT, type RhymePattern, type BarsPerLine } from '@/lib/constants'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [barsPerLine, setBarsPerLine] = useState<BarsPerLine>(1)
  const [rhymePattern, setRhymePattern] = useState<RhymePattern>('AABB')
  const [barCount, setBarCount] = useState(DEFAULT_BAR_COUNT)

  const {
    isPlaying,
    selectedBeatIndex,
    togglePlay,
    changeBeat,
    stop,
  } = useAudioEngine(metronomeEnabled)

  const { position, playheadLineRef, timelineLineRef, resetPosition } = usePlayhead(isPlaying, barsPerLine)

  const {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  } = useRhymes(rhymePattern, barsPerLine, barCount)

  // Extend bars as playhead progresses
  useEffect(() => {
    extendBars(position.bar)
  }, [position.bar, extendBars])

  const handleStop = () => {
    stop()
    resetPosition()
    regenerate()
  }

  return (
    <>
      <Toolbar
        metronomeEnabled={metronomeEnabled}
        onMetronomeChange={setMetronomeEnabled}
        onOpenSettings={() => setSidebarOpen(true)}
      />
      <Timeline currentBeat={position.beat} currentBar={position.bar} barsPerLine={barsPerLine} lineRef={timelineLineRef} />
      <Grid
        bars={bars}
        position={position}
        isPlaying={isPlaying}
        playheadLineRef={playheadLineRef}
        barsPerLine={barsPerLine}
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
        onBeatChange={changeBeat}
        wordLists={wordLists}
        selectedListId={selectedListId}
        onWordListChange={changeWordList}
        barsPerLine={barsPerLine}
        onBarsPerLineChange={setBarsPerLine}
        rhymePattern={rhymePattern}
        onRhymePatternChange={setRhymePattern}
        barCount={barCount}
        onBarCountChange={setBarCount}
      />
    </>
  )
}
