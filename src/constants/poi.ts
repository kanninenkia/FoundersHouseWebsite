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
 */
export const FOUNDERS_HOUSE_POI: PointOfInterest = {
  id: 'founders-house',
  name: 'Founders House',
  description: 'The heart of innovation and entrepreneurship',
  mapCoords: {
    x: 164,
    y: 804
  },
  worldCoords: {
    x: 164,
    y: 0,
    z: -804
  },
  cameraView: {
    distance: 1007,
    azimuth: -136,
    elevation: 10
  }
}

/**
 * Oura Ring HQ
 * TODO: Click on the actual Oura building to get correct coordinates
 */
export const OURA_POI: PointOfInterest = {
  id: 'oura',
  name: 'Oura',
  description: 'Oura Ring - Health technology and wearables',
  mapCoords: {
    x: 804,
    y: 520
  },
  worldCoords: {
    x: 804,
    y: -47,
    z: -520
  },
  cameraView: {
    distance: 280,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * Supercell
 * TODO: Click on the actual Supercell building to get correct coordinates
 */
export const SUPERCELL_POI: PointOfInterest = {
  id: 'supercell',
  name: 'Supercell',
  description: 'Supercell - Mobile game developer',
  mapCoords: {
    x: -400,
    y: 200
  },
  worldCoords: {
    x: -400,
    y: -40,
    z: -200
  },
  cameraView: {
    distance: 320,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * Relex
 * TODO: Click on the actual Relex building to get correct coordinates
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
    distance: 300,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * TOM (The Orthopedic Marketplace)
 * TODO: Click on the actual TOM building to get correct coordinates
 */
export const TOM_POI: PointOfInterest = {
  id: 'tom',
  name: 'TOM',
  description: 'TOM - The Orthopedic Marketplace',
  mapCoords: {
    x: -100,
    y: 600
  },
  worldCoords: {
    x: -100,
    y: -38,
    z: -600
  },
  cameraView: {
    distance: 290,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * Metacore
 * TODO: Click on the actual Metacore building to get correct coordinates
 */
export const METACORE_POI: PointOfInterest = {
  id: 'metacore',
  name: 'Metacore',
  description: 'Metacore - Mobile game developer',
  mapCoords: {
    x: 0,
    y: 700
  },
  worldCoords: {
    x: 0,
    y: -35,
    z: -700
  },
  cameraView: {
    distance: 310,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * IXI
 * TODO: Click on the actual IXI building to get correct coordinates
 */
export const IXI_POI: PointOfInterest = {
  id: 'ixi',
  name: 'IXI',
  description: 'IXI - Innovation and investment',
  mapCoords: {
    x: 100,
    y: 750
  },
  worldCoords: {
    x: 100,
    y: -36,
    z: -750
  },
  cameraView: {
    distance: 300,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * Varjo
 * TODO: Click on the actual Varjo building to get correct coordinates
 */
export const VARJO_POI: PointOfInterest = {
  id: 'varjo',
  name: 'Varjo',
  description: 'Varjo - Professional VR/XR headsets',
  mapCoords: {
    x: 600,
    y: 400
  },
  worldCoords: {
    x: 600,
    y: -45,
    z: -400
  },
  cameraView: {
    distance: 295,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * Linear
 * TODO: Click on the actual Linear building to get correct coordinates
 */
export const LINEAR_POI: PointOfInterest = {
  id: 'linear',
  name: 'Linear',
  description: 'Linear - Project management and issue tracking',
  mapCoords: {
    x: 300,
    y: -400
  },
  worldCoords: {
    x: 300,
    y: -44,
    z: 400
  },
  cameraView: {
    distance: 305,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * Distance
 * TODO: Click on the actual Distance building to get correct coordinates
 */
export const DISTANCE_POI: PointOfInterest = {
  id: 'distance',
  name: 'Distance',
  description: 'Distance - Technology and innovation',
  mapCoords: {
    x: 100,
    y: -600
  },
  worldCoords: {
    x: 100,
    y: -46,
    z: 600
  },
  cameraView: {
    distance: 315,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * Swarmia
 * TODO: Click on the actual Swarmia building to get correct coordinates
 */
export const SWARMIA_POI: PointOfInterest = {
  id: 'swarmia',
  name: 'Swarmia',
  description: 'Swarmia - Engineering analytics and insights',
  mapCoords: {
    x: -100,
    y: -700
  },
  worldCoords: {
    x: -100,
    y: -47,
    z: 700
  },
  cameraView: {
    distance: 300,
    azimuth: 90,
    elevation: 40
  }
}

/**
 * All Points of Interest
 * Add new locations here as the site expands
 * Order matches the landing page navigation (left to right)
 */
export const POINTS_OF_INTEREST: Record<string, PointOfInterest> = {
  SUPERCELL: SUPERCELL_POI,
  RELEX: RELEX_POI,
  TOM: TOM_POI,
  METACORE: METACORE_POI,
  IXI: IXI_POI,
  FOUNDERS_HOUSE: FOUNDERS_HOUSE_POI,
  VARJO: VARJO_POI,
  OURA: OURA_POI,
  LINEAR: LINEAR_POI,
  DISTANCE: DISTANCE_POI,
  SWARMIA: SWARMIA_POI,
}
