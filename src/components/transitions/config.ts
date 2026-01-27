export const TRANSITION_TIMING = {
  maxDelayMs: 600,
  pixelHoldMs: 150,
  pixelRevealDelayMs: 50,
  newPageDelayMs: 150,
  overlayFadeMs: 200,
  pageFadeMs: 400,
  maxTransitionMs: 1800,
} as const;

export const pageFadeEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
