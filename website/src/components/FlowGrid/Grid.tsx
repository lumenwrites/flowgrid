'use client'

import { useEffect, useRef, useMemo, type RefObject } from 'react'
import type { BarData } from '@/lib/rhymes'
import type { PlayheadPosition } from '@/hooks/usePlayhead'
import { BEATS_PER_BAR, type BarsPerLine, type Loop } from '@/lib/constants'
import Bar from './Bar'

export type SectionStart = { bar: number; loopIndex: number }

export type LoopInfo = {
  sectionStarts: SectionStart[]
  loops: Loop[]
}

type BarSeparator = { type: 'header'; name: string } | { type: 'divider' } | null

function getBarSeparator(barIdx: number, loopInfo: LoopInfo | null): BarSeparator {
  if (!loopInfo) return null
  const { sectionStarts, loops } = loopInfo
  const multiLoop = loops.length > 1

  // Section headers at each section boundary
  if (multiLoop) {
    for (const s of sectionStarts) {
      if (barIdx === s.bar) return { type: 'header', name: loops[s.loopIndex].name }
    }
  }

  // Find which section this bar belongs to (last section starting at or before barIdx)
  let sectionBar = 0
  let sectionLoopIndex = 0
  for (const s of sectionStarts) {
    if (s.bar <= barIdx) { sectionBar = s.bar; sectionLoopIndex = s.loopIndex }
    else break
  }

  const loop = loops[sectionLoopIndex]
  if (loop.bars > 1 && barIdx > sectionBar && (barIdx - sectionBar) % loop.bars === 0) {
    return { type: 'divider' }
  }

  return null
}

type GridProps = {
  bars: BarData[]
  position: PlayheadPosition
  isPlaying: boolean
  playheadLineRef: RefObject<HTMLDivElement | null>
  barsPerLine: BarsPerLine
  introBars: number
  scrollToBar: number
  loopInfo: LoopInfo | null
}

let scrollRafId: number | null = null
function smoothScrollTo(el: HTMLElement, target: number, duration = 250) {
  if (scrollRafId !== null) cancelAnimationFrame(scrollRafId)
  const start = el.scrollTop
  const delta = target - start
  if (Math.abs(delta) < 1) { scrollRafId = null; return }
  const startTime = performance.now()
  const step = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1)
    const ease = t * (2 - t) // ease-out quad
    el.scrollTop = start + delta * ease
    if (t < 1) { scrollRafId = requestAnimationFrame(step) }
    else { scrollRafId = null }
  }
  scrollRafId = requestAnimationFrame(step)
}

const SEPARATOR_CLASS = 'flex items-center px-1 h-5'

function SectionHeader({ name }: { name: string }) {
  return (
    <div className={`${SEPARATOR_CLASS} gap-2`}>
      <span className="text-xs font-semibold text-accent uppercase tracking-wide">{name}</span>
      <div className="flex-1 border-t border-accent/40" />
    </div>
  )
}

function LoopDivider() {
  return (
    <div className={SEPARATOR_CLASS}>
      <div className="flex-1 border-t border-dashed border-border" />
    </div>
  )
}

function SeparatorElement({ separator }: { separator: BarSeparator }) {
  if (!separator) return null
  if (separator.type === 'header') return <SectionHeader name={separator.name} />
  return <LoopDivider />
}

// Given a wrapper element, find the bar content element inside it (last child).
// Scroll targets use the wrapper (includes separator), playhead uses the bar content.
function getBarContent(wrapper: HTMLElement): HTMLElement {
  return (wrapper.lastElementChild as HTMLElement) ?? wrapper
}

export default function Grid({ bars, position, isPlaying, playheadLineRef, barsPerLine, introBars, scrollToBar, loopInfo }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Single ref map: bar index → outer wrapper element (contains separator + bar content)
  const wrapperRefsMap = useRef<Map<number, HTMLDivElement>>(new Map())

  // Pre-compute separators for visible bars
  const separatorMap = useMemo(() => {
    const map = new Map<number, BarSeparator>()
    for (const bar of bars) {
      const sep = getBarSeparator(bar.index, loopInfo)
      if (sep) map.set(bar.index, sep)
    }
    return map
  }, [bars, loopInfo])

  // Position the playhead line over the bar content (not the separator)
  // Depends on separatorMap so it repositions immediately when separators change
  useEffect(() => {
    const wrapper = wrapperRefsMap.current.get(position.bar)
    const line = playheadLineRef.current
    if (!wrapper || !line) return

    const barEl = getBarContent(wrapper)
    line.style.top = `${barEl.offsetTop}px`
    line.style.height = `${barEl.offsetHeight}px`
    line.style.display = 'block'

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
  }, [position.bar, position.beat, isPlaying, playheadLineRef, bars, introBars, barsPerLine, separatorMap])

  // Auto-scroll — targets the wrapper so separator + bar are both visible
  useEffect(() => {
    if (scrollToBar < 0) return
    const container = containerRef.current
    if (!container) return
    const wrapper = wrapperRefsMap.current.get(scrollToBar)
    const scrollTarget = wrapper ? wrapper.offsetTop : 0
    smoothScrollTo(container, Math.max(0, scrollTarget))
  }, [scrollToBar])

  // Reset scroll on stop
  useEffect(() => {
    if (position.bar === 0 && position.beat === 0) {
      const container = containerRef.current
      if (container) container.scrollTop = 0
    }
  }, [position.bar, position.beat])

  function setRefs(barIndices: number[], el: HTMLDivElement | null) {
    for (const idx of barIndices) {
      if (el) wrapperRefsMap.current.set(idx, el)
      else wrapperRefsMap.current.delete(idx)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-hidden px-2 sm:px-3 pt-0 pb-2 relative"
    >
      {/* Playhead track */}
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
            const separator = separatorMap.get(firstBar.index) ?? null
            return (
              <div
                key={firstBar.id}
                ref={(el) => setRefs(pair.map(b => b.index), el)}
                className={separator ? '' : 'mt-1 sm:mt-1.5'}
              >
                <SeparatorElement separator={separator} />
                <div className="relative grid grid-cols-2 gap-1 sm:gap-1.5">
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
              </div>
            )
          })
        : bars.map((bar) => {
            const separator = separatorMap.get(bar.index) ?? null
            return (
              <div
                key={bar.id}
                ref={(el) => setRefs([bar.index], el)}
                className={separator ? '' : 'mt-1 sm:mt-1.5'}
              >
                <SeparatorElement separator={separator} />
                <div className="relative">
                  <Bar
                    bar={bar}
                    currentBeat={position.bar === bar.index ? position.beat : null}
                    isIntro={bar.index < introBars}
                  />
                </div>
              </div>
            )
          })}
    </div>
  )
}
