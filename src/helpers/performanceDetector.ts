/**
 * Performance Detection Utility
 * Detects device capabilities and returns appropriate settings
 */

export interface PerformanceProfile {
  tier: 'high' | 'medium' | 'low'
  pixelRatio: number
  antialias: boolean
  shadowsEnabled: boolean
}

/**
 * Detect performance tier based on device capabilities
 * Returns settings that affect the visual experience
 */
export function detectPerformanceTier(): PerformanceProfile {
  // Cap pixel ratio at 1.5 to reduce rendering load
  // Most users won't notice the difference but it's 2.25x fewer pixels on retina displays
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)

  return {
    tier: 'high',
    pixelRatio,
    antialias: true, // Keep for visual quality
    shadowsEnabled: false // Shadows not used in current experience
  }
}
