'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { type WordList, type BarData, loadWordLists, generateBars } from '@/lib/rhymes'
import { BARS_AHEAD, BARS_BUFFER, type RhymePattern, type BarsPerLine } from '@/lib/constants'

export function useRhymes(rhymePattern: RhymePattern = 'AABB', barsPerLine: BarsPerLine = 1) {
  const rhymePatternRef = useRef(rhymePattern)
  rhymePatternRef.current = rhymePattern
  const barsPerLineRef = useRef(barsPerLine)
  barsPerLineRef.current = barsPerLine
  const [wordLists, setWordLists] = useState<WordList[]>([])
  const [selectedListId, setSelectedListId] = useState<string>('elementary')
  const [bars, setBars] = useState<BarData[]>([])
  const selectedListRef = useRef<WordList | undefined>(undefined)

  // Keep ref in sync
  const selectedList = wordLists.find((l) => l.id === selectedListId)
  selectedListRef.current = selectedList

  useEffect(() => {
    let cancelled = false
    loadWordLists().then((lists) => {
      if (!cancelled) setWordLists(lists)
    })
    return () => { cancelled = true }
  }, [])

  // Generate initial bars when word list or rhyme pattern changes
  useEffect(() => {
    if (!selectedList) return
    const newBars = generateBars(selectedList, BARS_AHEAD, 0, rhymePattern, barsPerLine)
    setBars(newBars)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListId, wordLists, rhymePattern, barsPerLine])

  const extendBars = useCallback(
    (currentBar: number) => {
      const list = selectedListRef.current
      if (!list) return
      setBars((prev) => {
        // Add more bars ahead if running low
        const lastBar = prev[prev.length - 1]
        const remaining = lastBar ? lastBar.index - currentBar + 1 : 0
        if (remaining < BARS_BUFFER) {
          const startIdx = lastBar ? lastBar.index + 1 : currentBar
          const newBars = generateBars(list, BARS_AHEAD, startIdx, rhymePatternRef.current, barsPerLineRef.current)
          return [...prev, ...newBars]
        }

        return prev
      })
    },
    []
  )

  const changeWordList = useCallback((listId: string) => {
    setSelectedListId(listId)
  }, [])

  const regenerate = useCallback(() => {
    const list = selectedListRef.current
    if (!list) return
    const newBars = generateBars(list, BARS_AHEAD, 0, rhymePatternRef.current, barsPerLineRef.current)
    setBars(newBars)
  }, [])

  return {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  }
}
