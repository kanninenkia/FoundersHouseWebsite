/**
 * Drag Controls
 * Handles hybrid drag behavior (rotation + pan) and momentum
 */
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { clampToMapBounds } from '../../constants/mapBoundaries'
import { easeOutQuart } from './BoundaryEasing'

export interface DragConfig {
  enabled: boolean
  panSensitivity: number
  rotateSensitivity: number
  friction: number
  velocityThreshold: number
  rotationThreshold: number
  smoothingFactor: number
  maxVelocity?: number
  maxRotationVelocity?: number
}

export class DragControls {
  public enabled: boolean = true
  public isDragging: boolean = false

  private panSensitivity: number = 0.5      // Reduced default sensitivity
  private rotateSensitivity: number = 0.002  // Reduced default rotation sensitivity
  private friction: number = 0.92            // Reduced default friction (more stopping power)
  private velocityThreshold: number = 0.005  // Increased threshold (stops sooner)
  private rotationThreshold: number = 0.0001 // Increased threshold (stops rotation sooner)
  private smoothingFactor: number = 0.25     // Increased damping
  private maxVelocity: number = 15           // Maximum velocity to prevent excessive swinging
  private maxRotationVelocity: number = 0.1  // Maximum rotation velocity

  private velocity: THREE.Vector3 = new THREE.Vector3()
  private rotationVelocity: number = 0
  private lastForward: THREE.Vector3 = new THREE.Vector3()
  private lastMouseX: number = 0
  private lastMouseY: number = 0
  private dragTargetPosition: THREE.Vector3 = new THREE.Vector3()

  private camera: THREE.PerspectiveCamera
  private orbit: OrbitControls | null
  private boundingBox: THREE.Box3 | null = null

  constructor(camera: THREE.PerspectiveCamera, orbit: OrbitControls | null, config?: Partial<DragConfig>) {
    this.camera = camera
    this.orbit = orbit

    if (config) {
      this.enabled = config.enabled ?? true
      this.panSensitivity = config.panSensitivity ?? 0.4
      this.rotateSensitivity = config.rotateSensitivity ?? 0.002
      this.friction = config.friction ?? 0.85
      this.velocityThreshold = config.velocityThreshold ?? 0.005
      this.rotationThreshold = config.rotationThreshold ?? 0.0001
      this.smoothingFactor = config.smoothingFactor ?? 0.25
      this.maxVelocity = config.maxVelocity ?? 15
      this.maxRotationVelocity = config.maxRotationVelocity ?? 0.1
    }

    this.dragTargetPosition.copy(camera.position)
  }

  /**
   * Set orbit controls reference
   */
  public setOrbit(orbit: OrbitControls): void {
    this.orbit = orbit
  }

  /**
   * Set bounding box for drag limits
   */
  public setBoundingBox(box: THREE.Box3 | null): void {
    this.boundingBox = box
  }

  /**
   * Update last mouse position
   */
  public updateMousePosition(x: number, y: number): void {
    this.lastMouseX = x
    this.lastMouseY = y
  }

  /**
   * Handle pointer move with hybrid drag behavior
   */
  public handlePointerMove(event: PointerEvent): void {
    if (!this.orbit || !this.enabled) return

    const deltaX = event.clientX - this.lastMouseX
    const deltaY = event.clientY - this.lastMouseY
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    if (this.isDragging && event.buttons === 1) {
      // Get camera direction vectors for panning
      const cameraDirection = new THREE.Vector3()
      this.camera.getWorldDirection(cameraDirection)

      // Forward vector (camera direction projected onto XZ plane)
      const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize()
      this.lastForward.copy(forward)

      // Calculate easing based on bounding box proximity
      let rotationEasing = 1.0
      let panEasing = 1.0

      if (this.boundingBox) {
        const margin = 40
        const box = this.boundingBox

        const distToMinX = Math.abs(this.camera.position.x - box.min.x)
        const distToMaxX = Math.abs(this.camera.position.x - box.max.x)
        const tX = Math.min(distToMinX, distToMaxX) / margin

        const distToMinZ = Math.abs(this.camera.position.z - box.min.z)
        const distToMaxZ = Math.abs(this.camera.position.z - box.max.z)
        const tZ = Math.min(distToMinZ, distToMaxZ) / margin

        const t = Math.max(0, Math.min(1, Math.min(tX, tZ)))
        panEasing = easeOutQuart(t)
        rotationEasing = easeOutQuart(t)
      }

      // ROTATION (horizontal drag)
      const targetRotationVelocity = deltaX * this.rotateSensitivity * rotationEasing
      // Clamp rotation velocity to prevent excessive swinging
      this.rotationVelocity = Math.max(-this.maxRotationVelocity, Math.min(this.maxRotationVelocity, targetRotationVelocity))

      // Rotate camera in place
      const offsetToTarget = this.orbit.target.clone().sub(this.camera.position)
      offsetToTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVelocity)

      this.orbit.target.copy(this.camera.position).add(offsetToTarget)
      this.camera.lookAt(this.orbit.target)

      // PAN (vertical drag)
      const targetPanZ = deltaY * this.panSensitivity * panEasing
      const targetVelocity = new THREE.Vector3()
      targetVelocity.addScaledVector(forward, targetPanZ)
      
      // Clamp velocity to prevent excessive swinging
      if (targetVelocity.length() > this.maxVelocity) {
        targetVelocity.normalize().multiplyScalar(this.maxVelocity)
      }
      
      this.velocity.lerp(targetVelocity, this.smoothingFactor)

      this.dragTargetPosition.add(this.velocity)
      this.orbit.target.add(this.velocity)

      this.clampToMapBoundaries()
    }
  }

  /**
   * Start dragging
   */
  public startDrag(x: number, y: number): void {
    this.isDragging = true
    this.lastMouseX = x
    this.lastMouseY = y
  }

  /**
   * Stop dragging
   */
  public stopDrag(): void {
    this.isDragging = false
  }

  /**
   * Apply momentum/inertia after drag release
   */
  public applyMomentum(): void {
    if (!this.orbit || this.isDragging) return

    // Rotation momentum
    if (Math.abs(this.rotationVelocity) > this.rotationThreshold) {
      const offsetToTarget = this.orbit.target.clone().sub(this.camera.position)
      offsetToTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVelocity)

      const newTarget = this.camera.position.clone().add(offsetToTarget)
      this.orbit.target.lerp(newTarget, 0.1)
      this.camera.lookAt(this.orbit.target)

      this.rotationVelocity *= this.friction

      if (Math.abs(this.rotationVelocity) < this.rotationThreshold * 0.1) {
        this.rotationVelocity = 0
      }
    } else {
      this.rotationVelocity = 0
    }

    // Pan momentum
    if (this.velocity.length() > this.velocityThreshold) {
      this.camera.position.add(this.velocity)
      this.orbit.target.add(this.velocity)

      this.velocity.multiplyScalar(this.friction)

      if (this.velocity.length() < this.velocityThreshold * 0.1) {
        this.velocity.set(0, 0, 0)
      }
    } else {
      this.velocity.set(0, 0, 0)
    }

    this.clampToMapBoundaries()
  }

  /**
   * Clamp camera and target to map boundaries
   */
  private clampToMapBoundaries(): void {
    if (!this.orbit) return

    if (this.boundingBox) {
      const box = this.boundingBox

      this.camera.position.x = Math.max(box.min.x, Math.min(box.max.x, this.camera.position.x))
      this.camera.position.z = Math.max(box.min.z, Math.min(box.max.z, this.camera.position.z))

      this.orbit.target.x = Math.max(box.min.x, Math.min(box.max.x, this.orbit.target.x))
      this.orbit.target.z = Math.max(box.min.z, Math.min(box.max.z, this.orbit.target.z))
    } else {
      const clampedCamera = clampToMapBounds(this.camera.position.x, this.camera.position.z)
      this.camera.position.x = clampedCamera.x
      this.camera.position.z = clampedCamera.z

      const clampedTarget = clampToMapBounds(this.orbit.target.x, this.orbit.target.z)
      this.orbit.target.x = clampedTarget.x
      this.orbit.target.z = clampedTarget.z
    }
  }

  /**
   * Reset velocity
   */
  public resetVelocity(): void {
    this.velocity.set(0, 0, 0)
    this.rotationVelocity = 0
  }

  /**
   * Get current velocity for external checks
   */
  public getVelocity(): THREE.Vector3 {
    return this.velocity
  }

  /**
   * Get current rotation velocity for external checks
   */
  public getRotationVelocity(): number {
    return this.rotationVelocity
  }

  /**
   * Get velocity threshold for external checks
   */
  public getVelocityThreshold(): number {
    return this.velocityThreshold
  }

  /**
   * Get rotation threshold for external checks
   */
  public getRotationThreshold(): number {
    return this.rotationThreshold
  }
}
