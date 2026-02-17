/**
 * TransitionOverlay - Pixelation transition overlay
 * Matches LoadingScreen's pixel-reveal behavior:
 * - Blocks instantly appear at staggered delays (not gradual fade)
 * - Creates "pixel takeover" effect
 */

import { useMemo } from 'react'
import './TransitionOverlay.css'
import { TRANSITION_TIMING } from './config'

type TransitionMode = 'in' | 'out'

interface TransitionOverlayProps {
  isActive: boolean
  mode?: TransitionMode
  maxDelayMs?: number
  cols?: number
  rows?: number
}

interface PixelBlock {
  id: number
  x: number
  y: number
  width: number
  height: number
  delay: number
}

// Seeded random number generator for consistent patterns
const seededRandom = (seed: number) => {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

const generateBlocks = (cols: number, rows: number, maxDelayMs: number) => {
  const blockWidth = 100 / cols
  const blockHeight = 100 / rows
  const overlap = 0.15
  const positions: PixelBlock[] = []

  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      positions.push({
        id: i * rows + j,
        x: i * blockWidth,
        y: j * blockHeight,
        width: i === cols - 1 ? 100 - i * blockWidth : blockWidth + overlap,
        height: j === rows - 1 ? 100 - j * blockHeight : blockHeight + overlap,
        delay: 0,
      })
    }
  }

  // Use seeded random for consistent shuffle pattern across all devices
  const random = seededRandom(42069)
  const shuffled = positions.sort(() => random() - 0.5)

  return shuffled.map((block) => ({
    ...block,
    delay: random() * maxDelayMs,
  }))
}

export const TransitionOverlay = ({
  isActive,
  mode = 'out',
  maxDelayMs = TRANSITION_TIMING.maxDelayMs,
  cols = 18,
  rows = 10,
}: TransitionOverlayProps) => {
  // Reduce grid size on mobile to prevent "funky" overcrowded pixels
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1
  const adjustedCols = isMobile ? 10 : cols
  const adjustedRows = isMobile
    ? Math.max(1, Math.ceil(adjustedCols * (viewportHeight / viewportWidth)))
    : rows

  const blocks = useMemo(() => generateBlocks(adjustedCols, adjustedRows, maxDelayMs), [adjustedCols, adjustedRows, maxDelayMs])
  const isReveal = mode === 'in'

  if (!isActive) return null

  return (
    <div
      key={`overlay-${mode}`}
      className={`transition-overlay pixel-transition ${isReveal ? 'pixel-in' : 'pixel-out'}`}
    >
      {blocks.map((block) => {
        const delay = isReveal ? maxDelayMs - block.delay : block.delay
        return (
          <div
            key={`pixel-block-${block.id}`}
            className="pixel-block"
            style={{
              left: `${block.x}%`,
              top: `${block.y}%`,
              width: `${block.width}%`,
              height: `${block.height}%`,
              animationDelay: `${delay}ms`,
            }}
          />
        )
      })}
    </div>
  )
}
