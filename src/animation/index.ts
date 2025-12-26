/**
 * Animation Module
 * Camera animations, transitions, and motion controllers
 */

export {
  createPOITransition,
  updatePOITransition,
  cancelPOITransition,
  type POITransitionState
} from './poiTransition'

export {
  createSmoothPOIAnimation,
  updateSmoothPOIAnimation,
  interruptSmoothPOIAnimation,
  type SmoothPOIAnimation
} from './smoothPOIAnimation'
