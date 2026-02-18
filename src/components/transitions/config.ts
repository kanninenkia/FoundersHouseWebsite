export const TRANSITION_TIMING = {
  maxDelayMs: 600,
  pixelHoldMs: 250,
  pixelRevealDelayMs: 150,
  newPageDelayMs: 150,
  overlayFadeMs: 300,
  pageFadeMs: 400,
  maxTransitionMs: 2600,        // covering-phase watchdog (stuck CSS animations)
  routeCommitWatchdogMs: 15000, // route-commit watchdog (slow/failed page loads)
} as const;

export const pageFadeEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
