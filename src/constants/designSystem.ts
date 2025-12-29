/**
 * Design System - Colors, Typography, and Constants
 * Centralized design tokens for the Helsinki 3D Viewer
 */

import * as THREE from 'three'

// Color Palette
export const COLORS = {
  // Day Mode Colors
  day: {
    sky: 0xFFF8F2,         // Cream background
    wireframe: 0x2b0a05,   // Dark brown wireframe
    wireframeOpacity: 0.35, // Day wireframe opacity
  },

  // Night Mode Colors
  night: {
    sky: 0x0a0a15,         // Dark night sky
    wireframe: 0x4a4a52,   // Subtle gray wireframe
    wireframeOpacity: 0.25, // Night wireframe opacity (more subtle)
    stars: 0xffffff,       // White stars
    cityLights: 0xffcc66,  // Warm yellowish city lights
    lightGlow: 0xffee88,   // Light glow spheres
  },

  // Chartogne-Taillet Palette (original inspiration)
  chartogne: {
    creamBg: 0xfdfcf5,
    creamLight: 0xf9f6ee,
    wineRed: 0xc23d2a,
    black: 0x000000,
    warmGray: 0x625e54,
    darkGray: 0x464340,
    midGray: 0xa0a095,
  },
} as const

// Three.js Color Objects
export const THREE_COLORS = {
  day: {
    sky: new THREE.Color(COLORS.day.sky),
    wireframe: new THREE.Color(COLORS.day.wireframe),
  },
  night: {
    sky: new THREE.Color(COLORS.night.sky),
    wireframe: new THREE.Color(COLORS.night.wireframe),
    stars: new THREE.Color(COLORS.night.stars),
    cityLights: new THREE.Color(COLORS.night.cityLights),
    lightGlow: new THREE.Color(COLORS.night.lightGlow),
  },
} as const

// Material Opacity Values
export const OPACITY = {
  wireframe: {
    day: 1.0,
    night: 0.6,
  },
  stars: {
    base: 0.8,
    shimmerMin: 0.6,
    shimmerMax: 0.8,
  },
  cityLights: {
    sphere: 0.7,
  },
} as const

// Scene Configuration
export const SCENE_CONFIG = {
  camera: {
    fov: 60,
    near: 1,
    far: 100000,
    initialPosition: { x: 292, y: 195, z: -173 },  // Hardcoded starting position
  },
  lighting: {
    ambient: {
      color: 0xffffff,
      intensity: 1.3, // BRIGHTNESS: Moderate increase from 1.0 -> 1.3 (was 1.8, too bright)
    },
    directional: {
      color: 0xffffff,
      intensity: 1.4, // BRIGHTNESS: Moderate increase from 1.2 -> 1.4 (was 1.8, too bright)
      position: { x: 500, y: 1000, z: 500 }, // Higher sun position for better lighting angle
      shadow: {
        left: -10000,
        right: 10000,
        top: 10000,
        bottom: -10000,
      },
    },
    hemisphere: {
      skyColor: 0xffffff,
      groundColor: 0x999999, // BRIGHTNESS: Moderate ground color (was 0xbbbbbb, too bright)
      intensity: 0.7, // BRIGHTNESS: Moderate increase from 0.6 -> 0.7 (was 0.9, too bright)
    },
  },
  stars: {
    count: 5000,
    radiusMin: 50000,
    radiusMax: 70000,
    size: 50,
    rotationSpeed: 0.01,
    shimmerSpeed: 2,
  },
  cityLights: {
    color: COLORS.night.cityLights,
    glowColor: COLORS.night.lightGlow,
    sphereRadius: 5,
    maxSphereRadius: 20, // For detection
  },
} as const

// Time Configuration (Helsinki timezone)
export const TIME_CONFIG = {
  timezone: 'Europe/Helsinki',
  dayStart: 8,
  dayEnd: 18,
} as const

export const FOG = {
  near: 400,   // Fog starts at reasonable distance
  far: 1200,   // Fog extends to create depth
  colors: {
    day: 0xFFF8F2,  // Cream fog to match sky
    night: 0x0a0a15,
  },
} as const

export const CITY_LIGHTS = {
  color: 0xfff1c8,
} as const
