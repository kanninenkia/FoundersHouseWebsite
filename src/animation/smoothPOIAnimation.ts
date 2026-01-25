/**
 * Smooth POI Camera Animation System
 *
 * Clean implementation that:
 * - Smoothly flies camera to POI with proper deceleration
 * - Allows seamless user handoff at any moment
 * - No snapping, no jerkiness
 * - Uses cubic bezier easing for natural motion
 */

import * as THREE from 'three'

/**
 * Smooth ease-out using cubic bezier curve
 * Creates natural deceleration that feels smooth
 */
function smoothEaseOut(t: number): number {
  // Cubic ease-out: starts fast, ends slow
  return 1 - Math.pow(1 - t, 3)
}

/**
 * State for smooth POI camera animation
 */
export interface SmoothPOIAnimation {
  isActive: boolean
  startTime: number
  duration: number

  // Start state
  startCameraPosition: THREE.Vector3
  startTargetPosition: THREE.Vector3

  // End state
  endCameraPosition: THREE.Vector3
  endTargetPosition: THREE.Vector3

  // Current velocity (for smooth handoff)
  currentVelocity: THREE.Vector3
  currentTargetVelocity: THREE.Vector3

  // Callback when animation completes
  onComplete?: () => void

  // Callback when animation is interrupted by user
  onInterrupt?: () => void
}

/**
 * Create a smooth POI camera animation
 *
 * @param camera - Camera to animate
 * @param currentTarget - Current camera look-at target
 * @param poiPosition - POI world position {x, y, z}
 * @param distance - Distance from POI
 * @param azimuth - Horizontal angle in degrees
 * @param elevation - Vertical angle in degrees
 * @param duration - Animation duration in seconds
 * @param onComplete - Callback when animation completes
 * @param onInterrupt - Callback when user interrupts
 */
export function createSmoothPOIAnimation(
  camera: THREE.PerspectiveCamera,
  currentTarget: THREE.Vector3,
  poiPosition: { x: number; y: number; z: number },
  distance: number = 500,
  azimuth: number = 90,
  elevation: number = 15,
  duration: number = 2.5,
  onComplete?: () => void,
  onInterrupt?: () => void,
  startTimeSeconds?: number
): SmoothPOIAnimation {
  // Use the requested distance directly
  let adjustedDistance = distance
  adjustedDistance = Math.max(50, Math.min(900, adjustedDistance))

  // Convert angles to radians - use elevation as requested without clamping
  const azimuthRad = THREE.MathUtils.degToRad(azimuth)
  const elevationRad = THREE.MathUtils.degToRad(elevation)

  // Calculate end camera position using spherical coordinates
  const horizontalDistance = adjustedDistance * Math.cos(elevationRad)
  const endCameraX = poiPosition.x + horizontalDistance * Math.cos(azimuthRad)
  const endCameraZ = poiPosition.z + horizontalDistance * Math.sin(azimuthRad)
  // Calculate camera height based on elevation angle
  const calculatedCameraY = poiPosition.y + adjustedDistance * Math.sin(elevationRad)

  // CRITICAL: Clamp camera height to match controller boundaries (210-300)
  // This prevents the snap that occurs when animation ends and controller enforces limits
  const MIN_CAMERA_HEIGHT = 210
  const MAX_CAMERA_HEIGHT = 300
  const endCameraY = Math.max(MIN_CAMERA_HEIGHT, Math.min(MAX_CAMERA_HEIGHT, calculatedCameraY))

  return {
    isActive: true,
    startTime: startTimeSeconds ?? (performance.now() / 1000),
    duration,

    startCameraPosition: camera.position.clone(),
    startTargetPosition: currentTarget.clone(),

    endCameraPosition: new THREE.Vector3(endCameraX, endCameraY, endCameraZ),
    endTargetPosition: new THREE.Vector3(poiPosition.x, poiPosition.y, poiPosition.z),

    currentVelocity: new THREE.Vector3(),
    currentTargetVelocity: new THREE.Vector3(),

    onComplete,
    onInterrupt
  }
}

/**
 * Update smooth POI animation
 * Call this every frame when animation is active
 *
 * @param animation - Animation state
 * @param camera - Camera to update
 * @param currentTime - Current time in seconds
 * @param deltaTime - Time since last frame in seconds
 * @returns Animation state
 */
export function updateSmoothPOIAnimation(
  animation: SmoothPOIAnimation,
  camera: THREE.PerspectiveCamera,
  currentTime: number,
  deltaTime: number = 1/60
): { stillAnimating: boolean; currentTarget: THREE.Vector3; isSettling: boolean } {
  if (!animation.isActive) {
    return {
      stillAnimating: false,
      currentTarget: animation.endTargetPosition.clone(),
      isSettling: false
    }
  }

  // Calculate progress
  let elapsed = currentTime - animation.startTime
  if (elapsed < 0) {
    // Guard against timebase skew; reset start to current time.
    animation.startTime = currentTime
    elapsed = 0
  }
  const rawProgress = Math.min(Math.max(elapsed / animation.duration, 0.0), 1.0)

  // Add a "settling" phase at the end (last 5% of animation)
  const SETTLING_THRESHOLD = 0.95
  const isSettling = rawProgress >= SETTLING_THRESHOLD

  // Apply smooth ease-out
  const progress = smoothEaseOut(rawProgress)

  // Store previous positions for velocity calculation
  const prevCameraPosition = camera.position.clone()

  // Interpolate camera position
  const newCameraPosition = new THREE.Vector3()
  newCameraPosition.lerpVectors(
    animation.startCameraPosition,
    animation.endCameraPosition,
    progress
  )

  // Interpolate target position
  const newTargetPosition = new THREE.Vector3()
  newTargetPosition.lerpVectors(
    animation.startTargetPosition,
    animation.endTargetPosition,
    progress
  )

  // Calculate current velocity (for smooth handoff)
  if (deltaTime > 0) {
    animation.currentVelocity.copy(newCameraPosition).sub(prevCameraPosition).divideScalar(deltaTime)
  }

  // Update camera
  camera.position.copy(newCameraPosition)
  camera.lookAt(newTargetPosition)

  // Check if complete
  if (rawProgress >= 1.0) {
    // Animation complete - ensure exact final position
    camera.position.copy(animation.endCameraPosition)
    camera.lookAt(animation.endTargetPosition)

    animation.isActive = false
    if (animation.onComplete) {
      animation.onComplete()
    }
    return { stillAnimating: false, currentTarget: animation.endTargetPosition, isSettling: false }
  }

  return { stillAnimating: true, currentTarget: newTargetPosition, isSettling }
}

/**
 * Interrupt/cancel smooth POI animation
 * Call this when user takes control
 *
 * @param animation - Animation to interrupt
 */
export function interruptSmoothPOIAnimation(animation: SmoothPOIAnimation): void {
  if (animation.isActive) {
    animation.isActive = false
    if (animation.onInterrupt) {
      animation.onInterrupt()
    }
  }
}
