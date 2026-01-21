/**
 * useVirtualScroll - Manages virtual scroll and depth transition
 * Handles the initial z-axis scroll effect and depth transition
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion'
import { ANIMATION_CONFIG } from '../config/animationConfig'

export interface VirtualScrollValues {
  // Virtual scroll state
  virtualScrollTarget: MotionValue<number>
  virtualScroll: MotionValue<number>
  scrollProgress: number
  zScrollComplete: boolean

  // Depth transition values
  depthTransitionProgress: MotionValue<number>
  depthOpacity: MotionValue<number>
  finalDepthOpacity: MotionValue<number>
  openingSectionOpacity: MotionValue<number>
  cardsInteractive: boolean

  // Background color
  backgroundColor: MotionValue<string>
}

interface UseVirtualScrollProps {
  hasEnteredFromTransition: boolean
  hasSettled: boolean
}

export const useVirtualScroll = ({
  hasEnteredFromTransition,
  hasSettled,
}: UseVirtualScrollProps): VirtualScrollValues => {
  const virtualScrollTarget = useMotionValue(0)
  const virtualScroll = useSpring(virtualScrollTarget, ANIMATION_CONFIG.virtualScrollSpring)
  const depthTransitionProgressRaw = useMotionValue(0)
  const depthTransitionProgress = useSpring(depthTransitionProgressRaw, {
    stiffness: 150,
    damping: 28,
    mass: 0.3,
    restDelta: 0.0001,
    restSpeed: 0.0001
  })

  const [scrollProgress, setScrollProgress] = useState(0)
  const [zScrollComplete, setZScrollComplete] = useState(false)

  const accumulatedScroll = useRef(0)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | undefined>(undefined)

  const maxVirtualScroll = window.innerHeight * ANIMATION_CONFIG.maxVirtualScroll

  // Initialize scroll values
  useEffect(() => {
    virtualScrollTarget.set(0)
    virtualScroll.set(0)
    depthTransitionProgressRaw.set(0)
    depthTransitionProgress.set(0)
    accumulatedScroll.current = 0
  }, [])

  // Handle virtual scroll (wheel events)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const atTheEnd = accumulatedScroll.current >= maxVirtualScroll
      const scrollingUp = e.deltaY < 0
      const atTop = window.scrollY <= 5 // Small threshold to account for rounding
      const shouldHijack = !atTheEnd || (scrollingUp && atTop)

      if (shouldHijack) {
        e.preventDefault()

        const scrollDelta = e.deltaY * 1.2
        accumulatedScroll.current = Math.max(0, Math.min(maxVirtualScroll, accumulatedScroll.current + scrollDelta))

        const progress = Math.max(0, Math.min(1, accumulatedScroll.current / maxVirtualScroll))
        setScrollProgress(progress)
        virtualScrollTarget.set(accumulatedScroll.current)

        isScrollingRef.current = true
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = window.setTimeout(() => {
          isScrollingRef.current = false
        }, 150)

        setZScrollComplete(progress >= 0.98)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [virtualScrollTarget, maxVirtualScroll])

  // Sync depth transition progress with virtual scroll - spring-based for smoothness
  useEffect(() => {
    const unsubscribe = virtualScroll.on('change', (latest) => {
      const depthProgress = Math.max(0, Math.min(1, latest / maxVirtualScroll))
      depthTransitionProgressRaw.set(depthProgress)
    })
    // Initialize on mount to prevent lag
    const initialProgress = Math.max(0, Math.min(1, virtualScroll.get() / maxVirtualScroll))
    depthTransitionProgressRaw.set(initialProgress)
    return unsubscribe
  }, [virtualScroll, depthTransitionProgressRaw, maxVirtualScroll])

  // Depth opacity (fades out opening section) - faster fade to avoid jittery low-opacity rendering
  const depthOpacity = useTransform(depthTransitionProgress, [0, 0.15, 0.3], [1, 0.3, 0])
  const settledOpacity = useMotionValue(1)
  const finalDepthOpacity = useMemo(
    () => (hasSettled ? settledOpacity : depthOpacity),
    [hasSettled, settledOpacity, depthOpacity]
  )

  // Opening section opacity (separate fade for entire section) - completes earlier
  const openingSectionOpacity = useTransform(depthTransitionProgress, [0, 0.3, 0.5], [1, 0.2, 0])

  // Cards interactive state
  const cardsInteractive = scrollProgress > ANIMATION_CONFIG.timing.cardsFadeIn.threshold

  // Background color for depth transition (header to quotes section) - DO NOT TOUCH
  const backgroundColor = useTransform(depthTransitionProgress, (progress) => {
    // Interpolate from #9E1B1E (158, 27, 30) to #590D0F (89, 13, 15)
    const r = Math.round(158 - (158 - 89) * progress)
    const g = Math.round(27 - (27 - 13) * progress)
    const b = Math.round(30 - (30 - 15) * progress)
    return `rgb(${r}, ${g}, ${b})`
  })

  return {
    virtualScrollTarget,
    virtualScroll,
    scrollProgress,
    zScrollComplete,
    depthTransitionProgress,
    depthOpacity,
    finalDepthOpacity,
    openingSectionOpacity,
    cardsInteractive,
    backgroundColor,
  }
}
