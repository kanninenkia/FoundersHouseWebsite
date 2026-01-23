/**
 * Map Boundary Constants
 * Define the explorable area limits to prevent users from going outside the map
 * 
 * Map Setup: 2.025km x 2.025km area centered at map origin (0,0)
 * Total coverage: 2025m x 2025m
 * 
 * Coordinates are in world space (x, z) - Y is height
 * Units are in meters (Three.js world units = meters)
 */

/**
 * Map Boundaries
 * 2.025km x 2.025km area centered around the map origin (0,0)
 * ±1012.5m from center in all directions (50% increase from 675m)
 */
export const MAP_BOUNDARIES = {
  // X-axis boundaries (east-west): ±1012.5m from origin
  x: {
    min: -2012.5,       // Western boundary (-1012.5m)
    max: 2012.5,        // Eastern boundary (+1012.5m)
  },

  // Z-axis boundaries (north-south): ±1012.5m from origin
  z: {
    min: -2012.5,       // Southern boundary (-1012.5m)
    max: 2012.5,        // Northern boundary (+1012.5m)
  }
} as const

/**
 * Check if a position is within map boundaries
 */
export function isWithinMapBounds(x: number, z: number): boolean {
  return (
    x >= MAP_BOUNDARIES.x.min &&
    x <= MAP_BOUNDARIES.x.max &&
    z >= MAP_BOUNDARIES.z.min &&
    z <= MAP_BOUNDARIES.z.max
  )
}

/**
 * Clamp a position to map boundaries
 */
export function clampToMapBounds(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.max(MAP_BOUNDARIES.x.min, Math.min(MAP_BOUNDARIES.x.max, x)),
    z: Math.max(MAP_BOUNDARIES.z.min, Math.min(MAP_BOUNDARIES.z.max, z))
  }
}
