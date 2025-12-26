/**
 * Interaction Manager
 * Handles user interaction events and interruption of animations
 */
import * as THREE from 'three'
import type HelsinkiCameraController from '../HelsinkiCameraController'
import type { POITransitionState } from '../../animation'
import { cancelPOITransition } from '../../animation'

export interface InteractionCallbacks {
  onInterrupt?: () => void
  onInactivity?: () => void
}

export class InteractionManager {
  private domElement: HTMLElement
  private controls: HelsinkiCameraController
  private camera: THREE.PerspectiveCamera
  private callbacks: InteractionCallbacks

  constructor(
    domElement: HTMLElement,
    camera: THREE.PerspectiveCamera,
    controls: HelsinkiCameraController,
    callbacks: InteractionCallbacks = {}
  ) {
    this.domElement = domElement
    this.camera = camera
    this.controls = controls
    this.callbacks = callbacks

    this.setupEventListeners()
  }

  /**
   * Setup event listeners for user interruption
   */
  private setupEventListeners(): void {
    const handleInteraction = this.createInteractionHandler()

    this.domElement.addEventListener('pointerdown', (ev: PointerEvent) => {
      if (ev.button !== 0) return
      handleInteraction()
    }, { passive: true })

    this.domElement.addEventListener('touchstart', () => {
      handleInteraction()
    }, { passive: true })

    this.domElement.addEventListener('wheel', () => {
      handleInteraction()
    }, { passive: true })
  }

  /**
   * Create interaction handler that triggers callbacks
   */
  private createInteractionHandler() {
    return () => {
      if (this.callbacks.onInterrupt) {
        this.callbacks.onInterrupt()
      }
    }
  }

  /**
   * Handle smooth handoff from animation to user control
   */
  public handleAnimationInterrupt(
    _cinematicAnimation: null,
    poiTransition: POITransitionState | null,
    isWaitingForNextPOI: boolean,
    onClearHighlights: () => void
  ): boolean {
    const wasAnimating =
      (poiTransition && poiTransition.isAnimating) ||
      isWaitingForNextPOI

    if (!wasAnimating) {
      return false
    }

    // Cancel POI transition
    if (poiTransition && poiTransition.isAnimating) {
      cancelPOITransition(poiTransition)
    }

    // Clear highlights
    onClearHighlights()

    // Calculate smooth handoff target from current camera position/direction
    const currentTarget = this.controls.target || new THREE.Vector3(0, 0, 0)
    const currentDistance = this.camera.position.distanceTo(currentTarget)
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)
    const newTarget = this.camera.position.clone().add(direction.multiplyScalar(currentDistance))
    newTarget.y = Math.max(newTarget.y, 10)

    // Hand off to user control with current camera state
    this.controls.setTarget(newTarget.x, newTarget.y, newTarget.z)

    return true
  }

  /**
   * Update callbacks
   */
  public setCallbacks(callbacks: InteractionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Clean up event listeners
   */
  public dispose(): void {
    // Event listeners are added with { passive: true }, no need to explicitly remove
  }
}
