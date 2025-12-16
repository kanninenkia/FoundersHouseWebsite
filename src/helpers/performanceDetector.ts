/**
 * Performance Detection Utility
 * Detects device capabilities and recommends quality settings
 */

interface PerformanceProfile {
  tier: 'low' | 'medium' | 'high'
  pixelRatio: number
  antialias: boolean
  shadowsEnabled: boolean
  postProcessing: boolean
  bloomEnabled: boolean
  maxLights: number
}

/**
 * Detect device performance tier based on various factors
 */
export function detectPerformanceTier(): PerformanceProfile {
  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  // Check GPU info if available
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null

  let gpuTier: 'low' | 'medium' | 'high' = 'medium'

  if (gl && gl instanceof WebGLRenderingContext) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string

      // Check for known low-end GPUs
      if (
        /Intel HD Graphics [3-5]\d{3}/i.test(renderer) ||
        /Mali-[34]\d{2}/i.test(renderer) ||
        /Adreno \(TM\) [3-4]\d{2}/i.test(renderer)
      ) {
        gpuTier = 'low'
      }
      // Check for known high-end GPUs
      else if (
        /RTX|GTX 1[0-9]|RX [5-7]\d{3}|Apple M[1-9]/i.test(renderer)
      ) {
        gpuTier = 'high'
      }
    }
  }

  // Check memory
  const memory = (performance as any).memory
  const lowMemory = memory && memory.jsHeapSizeLimit < 1000000000 // Less than 1GB

  // Check device cores
  const cores = navigator.hardwareConcurrency || 2
  const lowCores = cores <= 2

  // Determine tier
  let tier: 'low' | 'medium' | 'high' = gpuTier

  if (isMobile || lowMemory || lowCores) {
    tier = 'low'
  } else if (gpuTier === 'low' || lowMemory) {
    tier = 'medium'
  }

  // Return performance profile based on tier
  const profiles: Record<string, PerformanceProfile> = {
    low: {
      tier: 'low',
      pixelRatio: Math.min(window.devicePixelRatio, 1), // Max 1x
      antialias: false,
      shadowsEnabled: false,
      postProcessing: false,
      bloomEnabled: false,
      maxLights: 2,
    },
    medium: {
      tier: 'medium',
      pixelRatio: Math.min(window.devicePixelRatio, 1.5), // Max 1.5x
      antialias: true,
      shadowsEnabled: false,
      postProcessing: true,
      bloomEnabled: true,
      maxLights: 4,
    },
    high: {
      tier: 'high',
      pixelRatio: Math.min(window.devicePixelRatio, 2), // Max 2x
      antialias: true,
      shadowsEnabled: true,
      postProcessing: true,
      bloomEnabled: true,
      maxLights: 8,
    },
  }

  return profiles[tier]
}
