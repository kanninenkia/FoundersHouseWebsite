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
  // Mobile devices: limit to 1.25x to prevent memory crashes
  // Desktop: cap at 1.5x to reduce rendering load
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
  const maxPixelRatio = isMobile ? 1.25 : 1.5;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)

  return {
    tier: 'high',
    pixelRatio,
    antialias: !isMobile, // Disable antialiasing on mobile for better performance
    shadowsEnabled: false // Shadows not used in current experience
  }
}
