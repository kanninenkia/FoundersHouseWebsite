/**
 * Points of Interest (POI) Configuration
 * Centralized location definitions for the entire site
 *
 * USAGE - Smooth Camera Transitions to POIs:
 *
 * From browser console:
 *   window.helsinkiScene.focusPOI('FOUNDERS_HOUSE')           // Fly to Founders House (2s animation)
 *   window.helsinkiScene.focusPOI('OURA', 600, 45, 12, 1.5)   // Fly to Oura, custom distance/angle/duration
 *   window.helsinkiScene.focusPOI('WOLT', 800)                 // Fly to Wolt at 800m distance
 *
 * Parameters:
 *   - poiName: POI key (e.g., 'FOUNDERS_HOUSE', 'OURA', 'WOLT')
 *   - distance: Camera distance from POI in meters (default: 700)
 *   - azimuth: Horizontal viewing angle in degrees (default: 90)
 *   - elevation: Vertical viewing angle in degrees (default: 15)
 *   - duration: Animation duration in seconds (default: 2.0)
 *   - animated: Whether to animate or jump instantly (default: true)
 *
 * Features:
 *   - Smooth ease-in-out animation
 *   - User can interrupt by clicking/dragging
 *   - Callback on arrival
 */

import * as THREE from 'three'

export interface PointOfInterest {
  id: string
  name: string
  description: string
  mapCoords: {
    x: number   // Map X: positive = right, negative = left
    y: number   // Map Y: positive = north, negative = south
  }
  worldCoords: {
    x: number   // World X
    y: number   // World Y (height)
    z: number   // World Z (note: z = -mapY due to model rotation)
  }
  cameraView?: {
    distance?: number
    azimuth?: number
    elevation?: number
  }
}

/**
 * Primary POI - Founders House
 * The main focal point of the experience
 * Returns to exact initial page load position
 */
export const FOUNDERS_HOUSE_POI: PointOfInterest = {
  id: 'founders-house',
  name: 'Founders House',
  description: 'The heart of innovation and entrepreneurship',
  mapCoords: {
    x: 30.77,
    y: 533.42
  },
  worldCoords: {
    x: 30.77,    // Badge position (restored to original)
    y: -20.14,
    z: -533.42
  },
  cameraView: {
    distance: 807,   // Distance from initial target to camera
    azimuth: 55.1,   // Horizontal angle to position camera
    elevation: 15.8  // Vertical angle to position camera
  }
}

/**
 * Founders House Screen Tracking Position
 * Used for auto-centering drift and hero text visibility
 * Points to badge position (where the marker actually appears)
 */
export const FOUNDERS_HOUSE_SCREEN_POS = new THREE.Vector3(30.77, -20.14, -533.42)

/**
 * Oura Ring HQ
 */
export const OURA_POI: PointOfInterest = {
  id: 'oura',
  name: 'Oura',
  description: 'Oura Ring - Health technology and wearables',
  mapCoords: {
    x: 778.20,
    y: 517.65
  },
  worldCoords: {
    x: 778.20,
    y: -49.46,
    z: -517.65
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Supercell
 */
export const SUPERCELL_POI: PointOfInterest = {
  id: 'supercell',
  name: 'Supercell',
  description: 'Supercell - Mobile game developer',
  mapCoords: {
    x: -530.54,
    y: -295.63
  },
  worldCoords: {
    x: -530.54,
    y: -49.53,
    z: 295.63
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Relex
 * Note: Relex is not on the map - using placeholder coordinates
 */
export const RELEX_POI: PointOfInterest = {
  id: 'relex',
  name: 'Relex',
  description: 'Relex - Supply chain and retail planning',
  mapCoords: {
    x: -250,
    y: 400
  },
  worldCoords: {
    x: -250,
    y: -42,
    z: -400
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Silo
 */
export const SILO_POI: PointOfInterest = {
  id: 'silo',
  name: 'Silo',
  description: 'Silo - Technology and innovation',
  mapCoords: {
    x: 65.16,
    y: 371.43
  },
  worldCoords: {
    x: 65.16,
    y: -51.58,
    z: -371.43
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Wolt
 */
export const WOLT_POI: PointOfInterest = {
  id: 'wolt',
  name: 'Wolt',
  description: 'Wolt - Food delivery and retail technology',
  mapCoords: {
    x: -107.40,
    y: 774.90
  },
  worldCoords: {
    x: -107.40,
    y: -38.01,
    z: -774.90
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Lifeline Ventures
 */
export const LIFELINE_VENTURES_POI: PointOfInterest = {
  id: 'lifeline-ventures',
  name: 'Lifeline Ventures',
  description: 'Lifeline Ventures - Venture capital firm',
  mapCoords: {
    x: 218.08,
    y: -594.14
  },
  worldCoords: {
    x: 218.08,
    y: -44.56,
    z: 594.14
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Swappie
 */
export const SWAPPIE_POI: PointOfInterest = {
  id: 'swappie',
  name: 'Swappie',
  description: 'Swappie - Refurbished smartphone marketplace',
  mapCoords: {
    x: -622.55,
    y: 107.02
  },
  worldCoords: {
    x: -622.55,
    y: -56.12,
    z: -107.02
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Linear
 */
export const LINEAR_POI: PointOfInterest = {
  id: 'linear',
  name: 'Linear',
  description: 'Linear - Project management and issue tracking',
  mapCoords: {
    x: 163.29,
    y: 289.33
  },
  worldCoords: {
    x: 163.29,
    y: -36.12,
    z: -289.33
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Smartly
 */
export const SMARTLY_POI: PointOfInterest = {
  id: 'smartly',
  name: 'Smartly',
  description: 'Smartly - Social media advertising automation',
  mapCoords: {
    x: 432.35,
    y: 1003.46
  },
  worldCoords: {
    x: 432.35,
    y: -30.42,
    z: -1003.46
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * Illusian
 */
export const ILLUSIAN_POI: PointOfInterest = {
  id: 'illusian',
  name: 'Illusian',
  description: 'Illusian - Technology and innovation',
  mapCoords: {
    x: 948.37,
    y: 664.52
  },
  worldCoords: {
    x: 948.37,
    y: -40.69,
    z: -664.52
  },
  cameraView: {
    distance: 450,
    azimuth: 90,
    elevation: 30
  }
}

/**
 * All Points of Interest
 * Add new locations here as the site expands
 * Order matches the landing page navigation (left to right)
 */
export const POINTS_OF_INTEREST: Record<string, PointOfInterest> = {
  LIFELINE_VENTURES: LIFELINE_VENTURES_POI,
  RELEX: RELEX_POI,
  SUPERCELL: SUPERCELL_POI,
  WOLT: WOLT_POI,
  OURA: OURA_POI,
  FOUNDERS_HOUSE: FOUNDERS_HOUSE_POI,
  LINEAR: LINEAR_POI,
  SILO: SILO_POI,
  SWAPPIE: SWAPPIE_POI,
  SMARTLY: SMARTLY_POI,
  ILLUSIAN: ILLUSIAN_POI,
}
