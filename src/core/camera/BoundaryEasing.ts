/**
 * Boundary Easing Utilities
 * Smooth easing calculations for camera boundaries
 */

/**
 * Super smooth ease-out using quartic (power of 4)
 * Provides very gentle deceleration near boundaries
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
