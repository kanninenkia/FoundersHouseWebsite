/**
 * Helsinki Camera Controller (Refactored)
 * Thin wrapper that dynamically upgrades OrbitControls to camera-controls when available
 * Uses extracted modules for boundary easing, drag controls, and interaction handling
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BoundaryEasing, DragControls, CameraInteractionListeners } from './camera'

export class HelsinkiCameraController {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  public orbit: OrbitControls | null = null
  private cameraControls: any = null
  private installedAdvanced = false
  public parallax: THREE.Vector2 = new THREE.Vector2()

  // Proxyable properties
  public enableDamping: boolean = true
  public dampingFactor: number = 0.12  // Increased from 0.08 (more damping = less swing)
  public screenSpacePanning: boolean = false
  public minDistance: number = 100
  public maxDistance: number = 50000
  public maxPolarAngle: number = Math.PI / 2
  public minPolarAngle: number = 0
  public minAzimuthAngle: number = -Infinity
  public maxAzimuthAngle: number = Infinity
  public rotateSpeed: number = 1.0
  public zoomSpeed: number = 1.0
  public panSpeed: number = 1.0
  public target: THREE.Vector3 = new THREE.Vector3(0, 0, 0)

  // Optional bounding box for camera limits
  private boundingBox: THREE.Box3 | null = null

  // Parallax hover effect state
  private mouseNormalizedX = 0
  private mouseNormalizedY = 0
  private parallaxOffsetX = 0
  private parallaxOffsetY = 0
  private parallaxStrength = 30 // units
  private parallaxEasing = 0.04

  // Smoothed camera state for parallax
  private baseCameraPosition: THREE.Vector3 = new THREE.Vector3()
  private cameraTargetPosition: THREE.Vector3 = new THREE.Vector3()
  private cameraLerpAlpha: number = 0.08 // Lower = smoother

  // Modular components
  private boundaryEasing: BoundaryEasing
  private dragControls: DragControls
  private interactionListeners: CameraInteractionListeners

  private _last = performance.now()

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement

    // Start with OrbitControls as a safe default
    this.orbit = new OrbitControls(this.camera, this.domElement)
    this.orbit.enableDamping = this.enableDamping
    this.orbit.dampingFactor = this.dampingFactor
    this.orbit.screenSpacePanning = this.screenSpacePanning
    this.orbit.minDistance = this.minDistance
    this.orbit.maxDistance = this.maxDistance
    this.orbit.maxPolarAngle = this.maxPolarAngle
    this.orbit.minPolarAngle = this.minPolarAngle
    this.orbit.minAzimuthAngle = this.minAzimuthAngle
    this.orbit.maxAzimuthAngle = this.maxAzimuthAngle
    this.orbit.rotateSpeed = this.rotateSpeed
    this.orbit.zoomSpeed = this.zoomSpeed
    this.orbit.panSpeed = this.panSpeed
    this.orbit.target.copy(this.target)

    // Disable OrbitControls rotation - we handle it with drag controls
    this.orbit.enableRotate = false
    this.orbit.enablePan = false

    // Initialize modular components
    this.boundaryEasing = new BoundaryEasing({
      enabled: true,
      softBoundaryZone: 0.20,
      baseZoomSpeed: this.zoomSpeed,
      baseRotateSpeed: this.rotateSpeed
    })

    this.dragControls = new DragControls(this.camera, this.orbit, {
      enabled: true,
      panSensitivity: 0.4,        // Reduced from 0.5
      rotateSensitivity: 0.002,   // Reduced from 0.003 (less sensitive to fast movements)
      friction: 0.85,             // Reduced from 0.98 (more friction = less momentum)
      velocityThreshold: 0.005,   // Increased from 0.001 (stops momentum sooner)
      rotationThreshold: 0.0001,  // Increased from 0.00001 (stops rotation sooner)
      smoothingFactor: 0.25,      // Increased from 0.15 (more damping)
      maxVelocity: 12,            // Limit maximum pan velocity
      maxRotationVelocity: 0.08   // Limit maximum rotation velocity
    })

    this.interactionListeners = new CameraInteractionListeners(
      this.domElement,
      this.dragControls,
      {
        onWheel: (event) => this.handleWheel(event)
      }
    )

    // Initialize parallax camera positions
    this.baseCameraPosition.copy(camera.position)
    this.cameraTargetPosition.copy(camera.position)

    // Setup parallax mouse listeners
    this.domElement.addEventListener('mousemove', this.handleParallaxMouseMove)
    this.domElement.addEventListener('mouseleave', this.handleParallaxMouseLeave)
  }

  /**
   * Log camera state for debugging (throttled)
   */
  private logCameraState(): void {
    // Logging disabled
  }

  /**
   * Handle mouse move for parallax hover effect
   */
  private handleParallaxMouseMove = (event: MouseEvent): void => {
    const rect = this.domElement.getBoundingClientRect()
    this.mouseNormalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouseNormalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1
  }

  /**
   * Handle mouse leave - keep last offset for smooth transition
   */
  private handleParallaxMouseLeave = (): void => {
    // Do not reset, keep last offset for smooth transition
  }

  /**
   * Apply parallax offset based on mouse position
   */
  private applyMouseParallax(): void {
    // Always ease offset toward target
    const targetX = this.mouseNormalizedX * this.parallaxStrength
    const targetY = this.mouseNormalizedY * this.parallaxStrength * 0.6
    this.parallaxOffsetX += (targetX - this.parallaxOffsetX) * this.parallaxEasing
    this.parallaxOffsetY += (targetY - this.parallaxOffsetY) * this.parallaxEasing
  }

  /**
   * Set the bounding box for camera limits
   */
  public setBoundingBox(box: THREE.Box3) {
    this.boundingBox = box.clone()
    this.dragControls.setBoundingBox(this.boundingBox)
  }

  /**
   * Handle wheel events with boundary easing
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.orbit) return

    const zoomingIn = event.deltaY > 0
    const easingFactor = this.boundaryEasing.calculateZoomEasing(
      this.camera,
      this.orbit.target,
      this.minDistance,
      this.maxDistance,
      zoomingIn
    )

    this.orbit.zoomSpeed = this.boundaryEasing['baseZoomSpeed'] * easingFactor
  }

  /**
   * Check if user is currently interacting
   */
  public isUserInteracting(): boolean {
    return this.interactionListeners.isUserInteracting()
  }

  /**
   * Reset interaction flag
   */
  public resetInteractionFlag(): void {
    this.interactionListeners.resetInteractionFlag()
  }

  /**
   * Sync properties from this controller to the underlying OrbitControls
   */
  private syncPropertiesToOrbit(): void {
    if (this.orbit) {
      this.orbit.enableDamping = this.enableDamping
      this.orbit.dampingFactor = this.dampingFactor
      this.orbit.screenSpacePanning = this.screenSpacePanning

      this.orbit.rotateSpeed = this.rotateSpeed
      this.orbit.zoomSpeed = this.zoomSpeed
      this.orbit.panSpeed = this.panSpeed

      this.orbit.minDistance = this.minDistance
      this.orbit.maxDistance = this.maxDistance

      this.orbit.maxPolarAngle = this.maxPolarAngle
      this.orbit.minPolarAngle = this.minPolarAngle

      this.orbit.minAzimuthAngle = -Infinity
      this.orbit.maxAzimuthAngle = Infinity

      // Update boundary easing base speeds
      this.boundaryEasing.setBaseSpeeds(this.zoomSpeed, this.rotateSpeed)
    }
  }

  /**
   * Set the target point and sync to OrbitControls
   */
  public setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z)
    if (this.orbit) {
      this.orbit.target.set(x, y, z)
    }
  }

  /**
   * Try to dynamically import and switch to camera-controls
   */
  public async enableAdvanced(): Promise<boolean> {
    if (this.installedAdvanced) return true
    try {
      const mod = await import('camera-controls')
      const CameraControls = (mod && (mod.default || mod)) as any
      CameraControls.install({ THREE })

      this.cameraControls = new CameraControls(this.camera, this.domElement)
      const pos = this.camera.position.clone()
      const tgt = this.orbit ? this.orbit.target.clone() : this.target.clone()

      this.cameraControls.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, 0)

      if (this.orbit) {
        this.orbit.dispose()
        this.orbit = null
      }
      this.installedAdvanced = true
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Update controls
   */
  public update(deltaSeconds?: number) {
    if (this.cameraControls) {
      const raw = typeof deltaSeconds === 'number' ? deltaSeconds : ((performance.now() - this._last) / 1000)
      let dt = Number(raw)
      this._last = performance.now()

      // Clamp delta time to prevent large jumps that cause choppy motion
      dt = Math.min(dt, 1 / 30) // Max 30fps minimum for smooth motion

      if (!Number.isFinite(dt) || dt <= 0) {
        try {
          this.cameraControls.update(1 / 60)
        } catch (err) {
          try {
            if (this.cameraControls && this.cameraControls.dispose) this.cameraControls.dispose()
          } catch (e) {}
          this.cameraControls = null
          if (!this.orbit) {
            this.orbit = new OrbitControls(this.camera, this.domElement)
          }
        }
      } else {
        try {
          this.cameraControls.update(dt)
        } catch (err) {
          try {
            if (this.cameraControls && this.cameraControls.dispose) this.cameraControls.dispose()
          } catch (e) {}
          this.cameraControls = null
          if (!this.orbit) {
            this.orbit = new OrbitControls(this.camera, this.domElement)
          }
        }
      }
    } else if (this.orbit) {
      try {
        this.syncPropertiesToOrbit()
        this.orbit.update()

        // Apply momentum from drag controls
        this.dragControls.applyMomentum()

        // Log camera state (throttled to avoid console spam)
        this.logCameraState()
      } catch (err) {
        // ignore orbit update errors
      }
    }

    // Always update parallax offset
    this.applyMouseParallax()

    // Determine base position (update base when user is actively controlling)
    if (this.dragControls.isDragging ||
        this.dragControls.getVelocity().length() > this.dragControls.getVelocityThreshold() ||
        Math.abs(this.dragControls.getRotationVelocity()) > this.dragControls.getRotationThreshold()) {
      this.baseCameraPosition.copy(this.camera.position)
    }

    // Calculate intended camera position in local camera space (parallax effect)
    const right = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    this.camera.getWorldDirection(right)
    right.crossVectors(up, right).normalize()

    const offset = new THREE.Vector3()
    offset.addScaledVector(right, this.parallaxOffsetX)
    offset.addScaledVector(up, this.parallaxOffsetY)

    const intended = this.baseCameraPosition.clone().add(offset)

    // Smooth interpolation to intended position (creates the "bop" effect)
    this.cameraTargetPosition.x += (intended.x - this.cameraTargetPosition.x) * this.cameraLerpAlpha
    this.cameraTargetPosition.y += (intended.y - this.cameraTargetPosition.y) * this.cameraLerpAlpha
    this.cameraTargetPosition.z += (intended.z - this.cameraTargetPosition.z) * this.cameraLerpAlpha

    this.camera.position.copy(this.cameraTargetPosition)

    // Update target proxy
    if (this.orbit) this.target.copy(this.orbit.target)
  }

  public setLookAt(px: number, py: number, pz: number, tx: number, ty: number, tz: number, enableTransition = true) {
    if (this.cameraControls) {
      this.cameraControls.setLookAt(px, py, pz, tx, ty, tz, enableTransition ? 1.0 : 0)
    } else if (this.orbit) {
      this.camera.position.set(px, py, pz)
      this.orbit.target.set(tx, ty, tz)
      this.orbit.update()
    }
  }

  public fitToBox(box: THREE.Box3, immediate = false, options: any = {}) {
    if (this.cameraControls) {
      try {
        this.cameraControls.fitToBox(box, immediate, options)
      } catch (e) {
        // ignore
      }
    } else if (this.orbit) {
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = this.camera.fov * (Math.PI / 180)
      const distance = maxDim / (2 * Math.tan(fov / 2))
      this.camera.position.set(center.x, center.y + distance * 1.2, center.z + distance * 0.3)
      this.orbit.target.copy(center)
      this.orbit.update()
    }
  }

  public async flyTo(params: any) {
    if (this.cameraControls) {
      try {
        await this.cameraControls.moveTo(params.position || this.camera.position, params.target || this.target, true)
      } catch (e) {
        // ignore
      }
    } else if (this.orbit) {
      if (params.position) this.camera.position.copy(params.position)
      if (params.target) this.orbit.target.copy(params.target)
      this.orbit.update()
    }
  }

  public dispose() {
    if (this.cameraControls && this.cameraControls.dispose) {
      try { this.cameraControls.dispose() } catch (e) { }
      this.cameraControls = null
    }
    if (this.orbit) {
      try { this.orbit.dispose() } catch (e) { }
      this.orbit = null
    }
    this.interactionListeners.dispose()

    // Remove parallax mouse listeners
    this.domElement.removeEventListener('mousemove', this.handleParallaxMouseMove)
    this.domElement.removeEventListener('mouseleave', this.handleParallaxMouseLeave)
  }
}

export default HelsinkiCameraController
