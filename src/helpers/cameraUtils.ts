/**
 * Camera Utilities
 * Helpers for setting camera positions, angles, and configurations
 * 
 * Note: POI definitions have been moved to src/constants/poi.ts
 */

import * as THREE from 'three'

/**
 * Camera Configuration
 * Defines all parameters for positioning and orienting the camera
 */
export interface CameraConfig {
  // Target/Focus Point
  targetX: number
  targetY: number
  targetZ: number
  
  // Camera Position (can be set directly OR calculated from polar coordinates)
  position?: {
    x: number
    y: number
    z: number
  }
  
  // OR use polar coordinates (relative to target)
  polar?: {
    distance: number      // Distance from target
    azimuth: number       // Horizontal angle in degrees (0° = east, 90° = north, 180° = west, 270° = south)
    elevation: number     // Vertical angle in degrees (positive = looking down, negative = looking up)
  }
  
  // Camera settings
  fov?: number           // Field of view in degrees (default: 60)
  near?: number          // Near clipping plane (default: 1)
  far?: number           // Far clipping plane (default: 100000)
}

/**
 * Calculate camera position from polar coordinates
 * @param target - The point the camera is looking at
 * @param distance - Distance from target
 * @param azimuthDeg - Horizontal angle in degrees (0° = east, 90° = north, etc.)
 * @param elevationDeg - Vertical angle in degrees (positive = above target)
 */
function polarToCartesian(
  target: THREE.Vector3,
  distance: number,
  azimuthDeg: number,
  elevationDeg: number
): THREE.Vector3 {
  const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg)
  const elevationRad = THREE.MathUtils.degToRad(elevationDeg)

  // Calculate position in spherical coordinates
  const horizontalDistance = distance * Math.cos(elevationRad)
  const x = target.x + horizontalDistance * Math.cos(azimuthRad)
  const z = target.z + horizontalDistance * Math.sin(azimuthRad)
  const y = target.y + distance * Math.sin(elevationRad)

  return new THREE.Vector3(x, y, z)
}

/**
 * Calculate polar coordinates from camera position and target
 */
function cartesianToPolar(
  cameraPos: THREE.Vector3,
  target: THREE.Vector3
): { distance: number; azimuthDeg: number; elevationDeg: number } {
  const dx = cameraPos.x - target.x
  const dy = cameraPos.y - target.y
  const dz = cameraPos.z - target.z

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const horizontalDistance = Math.sqrt(dx * dx + dz * dz)

  const azimuthRad = Math.atan2(dz, dx)
  const elevationRad = Math.atan2(dy, horizontalDistance)

  return {
    distance,
    azimuthDeg: THREE.MathUtils.radToDeg(azimuthRad),
    elevationDeg: THREE.MathUtils.radToDeg(elevationRad)
  }
}

/**
 * Apply camera configuration to a Three.js camera
 * @param camera - The camera to configure
 * @param controls - Camera controls (for setting target)
 * @param config - Camera configuration object
 */
export function applyCameraConfig(
  camera: THREE.PerspectiveCamera,
  controls: any,
  config: CameraConfig
): void {
  const target = new THREE.Vector3(config.targetX, config.targetY, config.targetZ)
  
  // Set camera position
  if (config.position) {
    // Direct position
    camera.position.set(config.position.x, config.position.y, config.position.z)
  } else if (config.polar) {
    // Calculate position from polar coordinates
    const pos = polarToCartesian(
      target,
      config.polar.distance,
      config.polar.azimuth,
      config.polar.elevation
    )
    camera.position.copy(pos)
  }
  
  // Set camera parameters
  if (config.fov !== undefined) {
    camera.fov = config.fov
  }
  if (config.near !== undefined) {
    camera.near = config.near
  }
  if (config.far !== undefined) {
    camera.far = config.far
  }
  
  // Update projection matrix after changing FOV/near/far
  camera.updateProjectionMatrix()
  
  // Point camera at target
  camera.lookAt(target)
  
  // Update controls target
  if (controls && controls.target) {
    controls.target.copy(target)
  }
}

/**
 * Predefined Camera Configurations
 * Add your favorite camera angles here
 */
export const CAMERA_PRESETS: Record<string, CameraConfig> = {
  // Cinematic intro end position
  CINEMATIC_END: {
    targetX: 164,
    targetY: 50,
    targetZ: -804,
    polar: {
      distance: 380,
      azimuth: 90,    // Looking from east
      elevation: 5    // Slight downward angle
    },
    fov: 60
  },
  
  // Bird's eye view
  BIRDS_EYE: {
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    polar: {
      distance: 5000,
      azimuth: 45,
      elevation: 60   // High angle looking down
    },
    fov: 60
  },
  
  // Wide establishing shot
  WIDE_SHOT: {
    targetX: 164,
    targetY: 0,
    targetZ: -804,
    polar: {
      distance: 2000,
      azimuth: 135,
      elevation: 20
    },
    fov: 60
  },
  
  // Close-up view
  CLOSE_UP: {
    targetX: 164,
    targetY: 50,
    targetZ: -804,
    polar: {
      distance: 200,
      azimuth: 90,
      elevation: 10
    },
    fov: 50    // Narrower FOV for close-up
  },
  
  // Add your own presets here
}

/**
 * Get current camera state as a config object
 * Useful for saving current view
 */
export function getCurrentCameraConfig(
  camera: THREE.PerspectiveCamera,
  controls: any
): CameraConfig {
  const target = controls?.target || new THREE.Vector3(0, 0, 0)
  const polar = cartesianToPolar(camera.position, target)
  
  return {
    targetX: target.x,
    targetY: target.y,
    targetZ: target.z,
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    },
    polar: {
      distance: polar.distance,
      azimuth: polar.azimuthDeg,
      elevation: polar.elevationDeg
    },
    fov: camera.fov,
    near: camera.near,
    far: camera.far
  }
}
