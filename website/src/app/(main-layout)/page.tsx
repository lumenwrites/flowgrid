'use client'

import { useEffect } from 'react'
import Toolbar from '@/components/Toolbar'
import PlayButton from '@/components/PlayButton'
import Grid from '@/components/FlowGrid/Grid'
import Timeline from '@/components/FlowGrid/Timeline'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { usePlayhead } from '@/hooks/usePlayhead'
import { useRhymes } from '@/hooks/useRhymes'

export default function Home() {
  const {
    isPlaying,
    selectedBeatIndex,
    togglePlay,
    changeBeat,
    stop,
  } = useAudioEngine()

  const { position, playheadLineRef, timelineLineRef, resetPosition } = usePlayhead(isPlaying)

  const {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  } = useRhymes()

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
        selectedBeatIndex={selectedBeatIndex}
        onBeatChange={changeBeat}
        wordLists={wordLists}
        selectedListId={selectedListId}
        onWordListChange={changeWordList}
      />
      <Timeline currentBeat={position.beat} lineRef={timelineLineRef} />
      <Grid
        bars={bars}
        position={position}
        isPlaying={isPlaying}
        playheadLineRef={playheadLineRef}
      />
      <PlayButton
        isPlaying={isPlaying}
        onToggle={togglePlay}
        onStop={handleStop}
      />
    </>
  )
}
