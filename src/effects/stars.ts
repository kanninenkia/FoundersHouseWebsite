/**
 * Starfield Creation Utility
 * Generate and manage the night sky stars with constellations and Milky Way
 */

import * as THREE from 'three'
import { SCENE_CONFIG, OPACITY } from '../constants/designSystem'

/**
 * Create an enhanced starfield with random blinking, constellations, and Milky Way
 * @returns THREE.Group containing multiple star layers
 */
export function createStarfield(): THREE.Group {
  const starGroup = new THREE.Group()

  // Layer 1: Background stars - REDUCED for memory optimization (was 15000)
  const backgroundStars = createBackgroundStars(8000)
  starGroup.add(backgroundStars)

  // Layer 2: Milky Way - REDUCED for memory optimization (was 8000)
  const milkyWay = createMilkyWay(4000)
  starGroup.add(milkyWay)

  // Layer 3: Prominent stars - kept small count (was 500)
  const prominentStars = createProminentStars(500)
  starGroup.add(prominentStars)

  return starGroup
}

/**
 * Create background stars with random blink offsets
 */
function createBackgroundStars(count: number): THREE.Points {
  const { radiusMin, radiusMax } = SCENE_CONFIG.stars
  const positions = new Float32Array(count * 3)
  const blinkOffsets = new Float32Array(count) // Random offset for each star's blink
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)

    // Random blink offset (0-10) for staggered blinking
    blinkOffsets[i] = Math.random() * 10

    // Random sizes for variation
    sizes[i] = 1 + Math.random() * 2
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('blinkOffset', new THREE.BufferAttribute(blinkOffsets, 1))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.44, // 2 * 1.22 = 2.44 (22% bigger)
    transparent: true,
    opacity: 0.732, // 0.6 * 1.22 = 0.732 (22% brighter)
    sizeAttenuation: true,
    fog: false, // Stars should not be affected by fog
  })

  return new THREE.Points(geometry, material)
}

/**
 * Create enhanced Milky Way galaxy with beautiful star clusters
 * Creates a dense, visible band with multiple layers and nebula-like regions
 */
function createMilkyWay(count: number): THREE.Group {
  const milkyWayGroup = new THREE.Group()
  const { radiusMin, radiusMax } = SCENE_CONFIG.stars

  // Main Milky Way band (dense core)
  const coreCount = Math.floor(count * 0.6)
  const corePositions = new Float32Array(coreCount * 3)
  const coreColors = new Float32Array(coreCount * 3)
  const coreSizes = new Float32Array(coreCount)

  for (let i = 0; i < coreCount; i++) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin)

    // Create a diagonal band across the sky (more dramatic than horizontal)
    const theta = Math.random() * Math.PI * 2
    const phi = (Math.PI / 2) + (Math.random() - 0.5) * 0.6 // Wider band

    // Add some clustering (denser in center of band)
    const clusterBias = Math.random()
    const phiAdjust = clusterBias > 0.7 ? (Math.random() - 0.5) * 0.1 : 0

    corePositions[i * 3] = radius * Math.sin(phi + phiAdjust) * Math.cos(theta)
    corePositions[i * 3 + 1] = radius * Math.sin(phi + phiAdjust) * Math.sin(theta)
    corePositions[i * 3 + 2] = radius * Math.cos(phi + phiAdjust)

    // Rich color variation for galactic dust and stars
    const colorVariation = Math.random()
    if (colorVariation > 0.85) {
      // Bright blue-white (hot stars)
      coreColors[i * 3] = 0.8
      coreColors[i * 3 + 1] = 0.9
      coreColors[i * 3 + 2] = 1.0
    } else if (colorVariation > 0.7) {
      // Pale cyan
      coreColors[i * 3] = 0.85
      coreColors[i * 3 + 1] = 1.0
      coreColors[i * 3 + 2] = 0.95
    } else if (colorVariation > 0.4) {
      // Pure white
      coreColors[i * 3] = 1.0
      coreColors[i * 3 + 1] = 1.0
      coreColors[i * 3 + 2] = 1.0
    } else if (colorVariation > 0.2) {
      // Warm yellow
      coreColors[i * 3] = 1.0
      coreColors[i * 3 + 1] = 0.95
      coreColors[i * 3 + 2] = 0.85
    } else {
      // Soft pink (nebula regions)
      coreColors[i * 3] = 1.0
      coreColors[i * 3 + 1] = 0.9
      coreColors[i * 3 + 2] = 0.95
    }

    coreSizes[i] = 1.5 + Math.random() * 2.5 // Larger, more visible stars
  }

  const coreGeometry = new THREE.BufferGeometry()
  coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3))
  coreGeometry.setAttribute('color', new THREE.BufferAttribute(coreColors, 3))
  coreGeometry.setAttribute('size', new THREE.BufferAttribute(coreSizes, 1))

  const coreMaterial = new THREE.PointsMaterial({
    vertexColors: true,
    size: 3.05, // 2.5 * 1.22 = 3.05 (22% bigger)
    transparent: true,
    opacity: 0.915, // 0.75 * 1.22 = 0.915 (22% brighter)
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    fog: false, // Stars should not be affected by fog
  })

  const corePoints = new THREE.Points(coreGeometry, coreMaterial)
  milkyWayGroup.add(corePoints)

  // Add nebula-like star clusters (2-3 bright regions)
  for (let cluster = 0; cluster < 3; cluster++) {
    const clusterSize = 1500
    const clusterPositions = new Float32Array(clusterSize * 3)
    const clusterColors = new Float32Array(clusterSize * 3)

    // Random position along the Milky Way band
    const centerTheta = Math.random() * Math.PI * 2
    const centerPhi = (Math.PI / 2) + (Math.random() - 0.5) * 0.5
    const centerRadius = radiusMin + Math.random() * (radiusMax - radiusMin)

    for (let i = 0; i < clusterSize; i++) {
      // Gaussian distribution around cluster center
      const spread = 0.15
      const r = centerRadius + (Math.random() - 0.5) * 20
      const theta = centerTheta + (Math.random() - 0.5) * spread
      const phi = centerPhi + (Math.random() - 0.5) * spread

      clusterPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      clusterPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      clusterPositions[i * 3 + 2] = r * Math.cos(phi)

      // Nebula colors (pinks, blues, purples)
      const nebulaColor = cluster
      if (nebulaColor === 0) {
        // Pink nebula
        clusterColors[i * 3] = 1.0
        clusterColors[i * 3 + 1] = 0.6 + Math.random() * 0.3
        clusterColors[i * 3 + 2] = 0.8 + Math.random() * 0.2
      } else if (nebulaColor === 1) {
        // Blue nebula
        clusterColors[i * 3] = 0.6 + Math.random() * 0.2
        clusterColors[i * 3 + 1] = 0.8 + Math.random() * 0.2
        clusterColors[i * 3 + 2] = 1.0
      } else {
        // Purple nebula
        clusterColors[i * 3] = 0.8 + Math.random() * 0.2
        clusterColors[i * 3 + 1] = 0.6 + Math.random() * 0.2
        clusterColors[i * 3 + 2] = 1.0
      }
    }

    const clusterGeometry = new THREE.BufferGeometry()
    clusterGeometry.setAttribute('position', new THREE.BufferAttribute(clusterPositions, 3))
    clusterGeometry.setAttribute('color', new THREE.BufferAttribute(clusterColors, 3))

    const clusterMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 2.44, // 2 * 1.22 = 2.44 (22% bigger)
      transparent: true,
      opacity: 0.732, // 0.6 * 1.22 = 0.732 (22% brighter)
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      fog: false, // Stars should not be affected by fog
    })

    const clusterPoints = new THREE.Points(clusterGeometry, clusterMaterial)
    milkyWayGroup.add(clusterPoints)
  }

  return milkyWayGroup
}

/**
 * Prominent stars (larger, brighter)
 */
function createProminentStars(count: number): THREE.Points {
  const { radiusMin, radiusMax } = SCENE_CONFIG.stars
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const blinkOffsets = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)

    // Larger sizes for prominent stars
    sizes[i] = 3 + Math.random() * 4
    blinkOffsets[i] = Math.random() * 10
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('blinkOffset', new THREE.BufferAttribute(blinkOffsets, 1))

  const material = new THREE.PointsMaterial({
    color: 0xffffee,
    size: 6.1, // 5 * 1.22 = 6.1 (22% bigger)
    transparent: true,
    opacity: 1.0, // 0.9 * 1.22 = 1.098, clamped to 1.0 (22% brighter, maxed at 100%)
    sizeAttenuation: true,
    fog: false, // Stars should not be affected by fog
  })

  return new THREE.Points(geometry, material)
}

/**
 * Animate stars with random individual blinking
 * @param starGroup - The star group object
 * @param elapsed - Elapsed time in seconds
 */
export function animateStars(starGroup: THREE.Group | THREE.Points, elapsed: number): void {
  // Handle both Group (new multi-layer) and Points (legacy single layer)
  if (starGroup instanceof THREE.Group) {
    starGroup.children.forEach((child) => {
      if (child instanceof THREE.Points) {
        animateStarLayer(child, elapsed)
      } else if (child instanceof THREE.Group) {
        // Handle nested groups (like Milky Way)
        child.children.forEach((nestedChild) => {
          if (nestedChild instanceof THREE.Points) {
            animateStarLayer(nestedChild, elapsed)
          }
        })
      }
    })

    // Slow rotation of entire sky
    starGroup.rotation.y = elapsed * 0.01
  } else if (starGroup instanceof THREE.Points) {
    // Legacy single layer support
    if (starGroup.material instanceof THREE.PointsMaterial) {
      const { shimmerMin, shimmerMax } = OPACITY.stars
      const { shimmerSpeed } = SCENE_CONFIG.stars

      starGroup.material.opacity =
        shimmerMin + Math.sin(elapsed * shimmerSpeed) * (shimmerMax - shimmerMin)

      starGroup.rotation.y = elapsed * 0.01
    }
  }
}

/**
 * Animate individual star layer with discrete random blinking
 * Updated to prevent all stars from blinking simultaneously
 */
function animateStarLayer(points: THREE.Points, elapsed: number): void {
  if (!(points.material instanceof THREE.PointsMaterial)) return

  // Instead of blinking the entire layer, use a subtle shimmer effect
  // This prevents the jarring "all stars blink at once" issue
  const { shimmerMin, shimmerMax } = OPACITY.stars
  const { shimmerSpeed } = SCENE_CONFIG.stars

  // Very gentle shimmer using sine wave (much more subtle than blinking)
  const shimmerAmount = Math.sin(elapsed * shimmerSpeed * 0.5) * 0.5 + 0.5 // 0-1
  points.material.opacity = shimmerMin + shimmerAmount * (shimmerMax - shimmerMin)

  // Note: Individual star blinking would require a custom shader
  // The current approach with PointsMaterial applies opacity to all points uniformly
}

