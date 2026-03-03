'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { BarData } from '@/lib/rhymes'
import type { PlayheadPosition } from '@/hooks/usePlayhead'
import { BEATS_PER_BAR, type BarsPerLine } from '@/lib/constants'
import Bar from './Bar'

type GridProps = {
  bars: BarData[]
  position: PlayheadPosition
  isPlaying: boolean
  playheadLineRef: RefObject<HTMLDivElement | null>
  barsPerLine: BarsPerLine
  introBars: number
}

function smoothScrollTo(el: HTMLElement, target: number, duration = 250) {
  const start = el.scrollTop
  const delta = target - start
  if (Math.abs(delta) < 1) return
  const startTime = performance.now()
  const step = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1)
    const ease = t * (2 - t) // ease-out quad
    el.scrollTop = start + delta * ease
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export default function Grid({ bars, position, isPlaying, playheadLineRef, barsPerLine, introBars }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const barRefsMap = useRef<Map<number, HTMLDivElement>>(new Map())

  // Position the playhead line over the current bar
  // Depends on bars too — when old bars are removed, offsets shift
  useEffect(() => {
    const barEl = barRefsMap.current.get(position.bar)
    const line = playheadLineRef.current
    if (!barEl || !line) return

    line.style.top = `${barEl.offsetTop}px`
    line.style.height = `${barEl.offsetHeight}px`
    line.style.display = 'block'

    // Match rhyme color when over the rhyme cell (last beat of last bar in row)
    const isLastBarInRow = position.bar % barsPerLine === barsPerLine - 1
    const isLastBeat = position.beat === BEATS_PER_BAR - 1
    const currentBar = bars.find((b) => b.index === position.bar)
    const isOnRhyme = isLastBarInRow && isLastBeat && currentBar && currentBar.index >= introBars
    if (isOnRhyme) {
      const c = currentBar.rhymeColor.activeBorder
      line.style.backgroundColor = c
      line.style.boxShadow = `0 0 8px ${c}`
    } else {
      line.style.backgroundColor = ''
      line.style.boxShadow = '0 0 8px var(--color-accent)'
    }
  }, [position.bar, position.beat, isPlaying, playheadLineRef, bars, introBars, barsPerLine])

  // Auto-scroll to keep current bar at the top
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const barEl = barRefsMap.current.get(position.bar)
    const scrollTarget = barEl ? barEl.offsetTop : 0
    smoothScrollTo(container, Math.max(0, scrollTarget))
  }, [position.bar])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-hidden px-2 sm:px-3 pt-0 pb-2 space-y-1 sm:space-y-1.5 relative"
    >
      {/* Playhead track — inset to match container padding so left% aligns with timeline */}
      <div className="absolute inset-y-0 left-2 right-2 sm:left-3 sm:right-3 pointer-events-none z-10">
        <div
          ref={playheadLineRef}
          className="absolute w-0.5 bg-accent rounded-full"
          style={{
            left: '0%',
            top: 0,
            height: 0,
            boxShadow: '0 0 8px var(--color-accent)',
            display: 'none',
          }}
        />
      </div>

      {barsPerLine === 2
        ? Array.from({ length: Math.ceil(bars.length / 2) }).map((_, rowIdx) => {
            const pair = bars.slice(rowIdx * 2, rowIdx * 2 + 2)
            const firstBar = pair[0]
            return (
              <div
                key={firstBar.id}
                ref={(el) => {
                  for (const b of pair) {
                    if (el) barRefsMap.current.set(b.index, el)
                    else barRefsMap.current.delete(b.index)
                  }
                }}
                className="relative grid grid-cols-2 gap-1 sm:gap-1.5"
              >
                {pair.map((bar, i) => (
                  <Bar
                    key={bar.id}
                    bar={bar}
                    currentBeat={position.bar === bar.index ? position.beat : null}
                    isLastInLine={i === pair.length - 1}
                    isIntro={bar.index < introBars}
                  />
                ))}
              </div>
            )
          })
        : bars.map((bar) => (
            <div
              key={bar.id}
              ref={(el) => {
                if (el) barRefsMap.current.set(bar.index, el)
                else barRefsMap.current.delete(bar.index)
              }}
              className="relative"
            >
              <Bar
                bar={bar}
                currentBeat={position.bar === bar.index ? position.beat : null}
                isIntro={bar.index < introBars}
              />
            </div>
          ))}
    </div>
  )
}
