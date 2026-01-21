/**
 * Animation Configuration and Easing Functions
 * Centralized config for all LearnMore animations
 */

export const EASING = {
  // Standard ease for most animations - smooth and natural
  standard: (t: number) => {
    // cubic-bezier(0.4, 0, 0.2, 1)
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  },

  // Smooth ease out for fades and reveals
  out: (t: number) => {
    // cubic-bezier(0.22, 1, 0.36, 1)
    return 1 - Math.pow(1 - t, 3)
  },

  // Gentle ease in-out for continuous movements
  inOut: (t: number) => {
    // cubic-bezier(0.65, 0, 0.35, 1)
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  },

  // For framer-motion components
  bezier: {
    standard: [0.4, 0, 0.2, 1] as const,
    out: [0.22, 1, 0.36, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
  }
}

export const ANIMATION_CONFIG = {
  spring: { damping: 35, stiffness: 80, mass: 0.5 },
  virtualScrollSpring: { stiffness: 100, damping: 25, mass: 0.8, restDelta: 0.001, restSpeed: 0.001 },

  maxVirtualScroll: 1.5,
  boxScrollHeight: 3,

  timing: {
    cardsFadeOut: { start: 0, end: 0.35 },  // Reduced window for faster, complete fade out
    textImageFadeIn: { start: 0.55, end: 0.90 },
    cardsFadeIn: { threshold: 0.7 },
  },

  // Narrative-driven scroll phases - each phase gets equal attention
  scrollPhases: {
    // Phase 1: Box-in-box reveal with OBSESSIVE text (1.5x viewport)
    phase1Duration: 1.5,

    // Phase 2: Transform to rectangle + translate + AMBITIOUS text (2.0x viewport)
    // Sub-phase 2a: Transform elements (first half)
    // Sub-phase 2b: Translate + reveal place2 (second half)
    phase2Duration: 2.0,

    // Pause: Let AMBITIOUS breathe before next transformation (0.2x viewport)
    pauseDuration: 0.2,

    // Phase 3: Rotate map + transform to NEXT-GEN + reveal place3 (2.0x viewport)
    // Sub-phase 3a: Rotate & zoom map in place (first half)
    // Sub-phase 3b: Move map + text transformation (second half)
    phase3Duration: 2.0,

    // Phase 4: Sticky BUILDERS + reveal place4 (2.0x viewport)
    // Fade out map & place3, rotate text to horizontal, stick it high, reveal place4
    phase4Duration: 2.0,

    // Phase 5: Final CTA (2.0x viewport)
    // Fade out everything, background to dark red, fade in CTA text and horses image
    phase5Duration: 2.0,
  },

  box: { startSize: 100, endSize: 75 },
  imageScale: 1.15,

  parallax: {
    obsessiveText: { x: [-20, 20], y: [-20, 20] },
    image: { x: [-12, 12], y: [-12, 12] },
    box: { x: [-5, 5], y: [-5, 5] },
    text: { x: [-3, 3], y: [-3, 3] },
  },

  quoteCards: {
    fadeInSpeed: 1.8,  // Reduced from 3.0 for smoother fade-in
    fadeOutSpeed: 2.5,  // Faster fade out to ensure complete disappearance
    staggerIn: 0.12,    // Slightly increased for better pacing
    staggerOut: 0.08,   // Reduced for tighter fade out sequence
  },

  decorativeSquares: {
    parallaxBase: 15,
    opacityIndices: [1, 3, 4, 7, 9, 11],
    opacityDim: 0.4,
    opacityFull: 1.0,
  },

  positioning: {
    obsessiveBottom: '2%',
    obsessiveLeft: '8%',
    imageTop: '55%',
  },
}
