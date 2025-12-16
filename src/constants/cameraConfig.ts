/**
 * Camera Configuration Constants
 * Centralized camera control settings for the entire site
 * 
 * These values define the "ideal" camera view and restrict user controls
 * to maintain narrative control and hide imperfections.
 */

/**
 * Base Camera Settings
 * Derived from the ideal view: Distance ~856.49, Azimuth 45.17°, Elevation 79.21°, Height 160.28
 */
export const CAMERA_BASE = {
  // Target point (what we're looking at)
  target: {
    x: -209.85,
    y: 0.00,
    z: -866.04
  },

  // Ideal camera position
  position: {
    x: 386.81,
    y: 160.28,
    z: -272.85
  },

  // Polar coordinates (easier to work with for restrictions)
  polar: {
    distance: 856.49,    // Distance from target
    azimuth: 45.17,      // Horizontal angle (45.17° = northeast view)
    elevation: 79.21,    // Vertical angle (79.21° polar angle)
  },

  // Camera properties
  fov: 60,              // Field of view
  near: 1,              // Near clipping plane
  far: 100000           // Far clipping plane
} as const

/**
 * Camera Control Restrictions
 * Define allowed variance from base settings to control what users can see
 */
export const CAMERA_RESTRICTIONS = {
  // Distance constraints (zoom)
  distance: {
    min: 700,           // Closest zoom (70% of base) - prevents seeing too much detail
    max: 900,          // Furthest zoom (150% of base) - keeps focal point visible
    default: 900       // Base distance
  },

  // Azimuth (horizontal rotation) constraints
  azimuth: {
    min: -180,          // Allow 44° left from base (-136° - 44° = -180°)
    max: -90,           // Allow 46° right from base (-136° + 46° = -90°)
    default: -136       // Base angle (southwest view)
  },

  // Elevation (vertical angle) constraints - TIGHT control for narrative
  elevation: {
    min: 8,             // Minimum angle (8° looking down) - only 2° variance down from base (10°)
    max: 15,            // Maximum angle (15° looking down) - only 5° variance up from base (10°)
    default: 10         // Base angle
  },

  // Height constraints (Y position) - TIGHT control for narrative
  height: {
    min: 220,           // Minimum height
    max: 300,           // Maximum height
    default: 250        // Base height (raised)
  },

  // FOV constraints
  fov: {
    min: 50,            // Narrower FOV (telephoto feel)
    max: 70,            // Wider FOV (more panoramic)
    default: 60         // Base FOV
  }
} as const

/**
 * Camera Movement Speed Limits
 * Controls how fast users can rotate, zoom, and pan
 */
export const CAMERA_SPEED_LIMITS = {
  rotateSpeed: 1.0,     // Rotation velocity limit (higher = faster rotation, tighter turning)
  zoomSpeed: 1.0,       // Zoom speed (normal speed)
  panSpeed: 0.3         // Pan speed
} as const

/**
 * Damping settings for smooth camera movement
 */
export const CAMERA_DAMPING = {
  enabled: true,
  factor: 0.08,         // Balanced damping for smooth movement
  rotationSpeed: 0.5,   // Slower rotation for deliberate feel
  zoomSpeed: 0.7,       // Moderate zoom speed
  panSpeed: 0.5         // Slower panning
} as const
