/**
 * POI Transition Animation Controller
 * Handles smooth camera transitions between Points of Interest
 */

import * as THREE from 'three'

/**
 * Cubic bezier easing function for smooth animations
 * Uses ease-in-out curve for natural motion
 */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * POI Transition State
 * Manages animation state for smooth camera movement to POIs
 */
export interface POITransitionState {
  isAnimating: boolean
  startTime: number
  duration: number
  startPosition: THREE.Vector3
  startTarget: THREE.Vector3
  targetPosition: THREE.Vector3
  targetLookAt: THREE.Vector3
  onComplete?: () => void
}

/**
 * Create a POI transition animation
 * 
 * @param camera - Camera to animate
 * @param currentTarget - Current camera look-at target
 * @param poiWorldCoords - POI world coordinates { x, y, z }
 * @param distance - Distance from POI (default: 500)
 * @param azimuth - Horizontal angle in degrees (default: 90)
 * @param elevation - Vertical angle in degrees (default: 15)
 * @param duration - Animation duration in seconds (default: 2.0)
 * @param onComplete - Optional callback when animation completes
 */
export function createPOITransition(
  camera: THREE.PerspectiveCamera,
  currentTarget: THREE.Vector3,
  poiWorldCoords: { x: number; y: number; z: number },
  distance: number = 500,
  azimuth: number = 90,
  elevation: number = 15,
  duration: number = 2.0,
  onComplete?: () => void,
  currentTime?: number
): POITransitionState {
  // Convert angles to radians
  const azimuthRad = THREE.MathUtils.degToRad(azimuth)
  const elevationRad = THREE.MathUtils.degToRad(elevation)
  
  // Calculate target camera position using spherical coordinates
  const horizontalDistance = distance * Math.cos(elevationRad)
  const targetX = poiWorldCoords.x + horizontalDistance * Math.cos(azimuthRad)
  const targetZ = poiWorldCoords.z + horizontalDistance * Math.sin(azimuthRad)
  const targetY = poiWorldCoords.y + distance * Math.sin(elevationRad)
  
  return {
    isAnimating: true,
    startTime: currentTime ?? (performance.now() / 1000),
    duration,
    startPosition: camera.position.clone(),
    startTarget: currentTarget.clone(),
    targetPosition: new THREE.Vector3(targetX, targetY, targetZ),
    targetLookAt: new THREE.Vector3(poiWorldCoords.x, poiWorldCoords.y, poiWorldCoords.z),
    onComplete
  }
}

/**
 * Update POI transition animation
 * Call this in your render loop when a transition is active
 *
 * @param transition - Transition state
 * @param camera - Camera to animate
 * @param controls - Camera controls (to update target)
 * @param currentTime - Current time in seconds
 * @returns true if still animating, false if complete
 */
export function updatePOITransition(
  transition: POITransitionState,
  camera: THREE.PerspectiveCamera,
  controls: any,
  currentTime: number
): boolean {
  if (!transition.isAnimating) return false

  // Calculate progress (0 to 1)
  const elapsed = currentTime - transition.startTime
  const progress = Math.min(elapsed / transition.duration, 1.0)

  // Apply easing
  const easedProgress = easeInOutCubic(progress)

  // Interpolate camera position
  camera.position.lerpVectors(
    transition.startPosition,
    transition.targetPosition,
    easedProgress
  )

  // Interpolate look-at target
  const currentTarget = new THREE.Vector3()
  currentTarget.lerpVectors(
    transition.startTarget,
    transition.targetLookAt,
    easedProgress
  )

  // Update controls target
  if (controls.target) {
    controls.target.copy(currentTarget)
  }

  // Make camera look at the interpolated target
  camera.lookAt(currentTarget)

  // Check if animation is complete
  if (progress >= 1.0) {
    // Ensure we're EXACTLY at final position
    camera.position.copy(transition.targetPosition)
    if (controls.setTarget) {
      controls.setTarget(transition.targetLookAt.x, transition.targetLookAt.y, transition.targetLookAt.z)
    } else if (controls.target) {
      controls.target.copy(transition.targetLookAt)
    }
    camera.lookAt(transition.targetLookAt)

    transition.isAnimating = false
    if (transition.onComplete) {
      transition.onComplete()
    }
    return false
  }

  return true
}

/**
 * Cancel an active POI transition
 * @param transition - Transition state to cancel
 */
export function cancelPOITransition(transition: POITransitionState | null): void {
  if (transition) {
    transition.isAnimating = false
  }
}
