import { useState, useEffect } from 'react'

/**
 * Hook to calculate responsive scaling factors based on viewport size
 * This ensures BoxInBoxSection elements scale appropriately across different screens
 */
export const useResponsiveScale = () => {
  const [scale, setScale] = useState({
    base: 1, // Overall scale factor
    vw: 1, // vw unit multiplier
    vh: 1, // vh unit multiplier
    fontSize: 1, // Font size multiplier
    spacing: 1, // Spacing multiplier
  })

  useEffect(() => {
    const calculateScale = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const aspectRatio = width / height

      // Reference size: 1920x1080 (16:9)
      const referenceWidth = 1920

      // Calculate base scale relative to reference width
      let baseScale = width / referenceWidth

      // Adjust for different aspect ratios
      if (aspectRatio < 1.5) {
        // Tall screens (tablets in portrait, etc.)
        baseScale *= 0.9
      } else if (aspectRatio > 2) {
        // Ultra-wide screens
        baseScale *= 1.1
      }

      // Clamp base scale between 0.6 and 1.3
      baseScale = Math.max(0.6, Math.min(1.3, baseScale))

      // vw scaling: adjust if viewport is significantly different
      const vwScale = width < 1024 ? 0.85 : width < 1440 ? 0.92 : 1

      // vh scaling: maintain aspect ratio considerations
      const vhScale = height < 768 ? 0.9 : height < 900 ? 0.95 : 1

      // Font scaling: slightly less aggressive than base scale
      const fontScale = 0.8 + (baseScale * 0.2)

      // Spacing scaling: preserve relative spacing
      const spacingScale = baseScale

      setScale({
        base: baseScale,
        vw: vwScale,
        vh: vhScale,
        fontSize: fontScale,
        spacing: spacingScale,
      })
    }

    calculateScale()

    const handleResize = () => {
      calculateScale()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Utility functions to apply scaling
  const scaleVw = (value: number) => value * scale.vw
  const scaleVh = (value: number) => value * scale.vh
  const scalePx = (value: number) => value * scale.base
  const scaleFontSize = (value: string) => {
    // Extract number from clamp or other CSS value
    const match = value.match(/(\d+\.?\d*)/)
    if (match) {
      const num = parseFloat(match[1])
      return value.replace(match[1], String(num * scale.fontSize))
    }
    return value
  }

  return {
    scale,
    scaleVw,
    scaleVh,
    scalePx,
    scaleFontSize,
  }
}
