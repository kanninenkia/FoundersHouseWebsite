import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { clampToMapBounds } from '../constants/mapBoundaries'

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export class HelsinkiCameraController {
  private boundingBox: THREE.Box3 | null = null

  public setBoundingBox(box: THREE.Box3) {
      this.boundingBox = box.clone()
    }
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private orbit: OrbitControls | null = null
  private cameraControls: any = null
  private installedAdvanced = false
  public parallax: THREE.Vector2 = new THREE.Vector2()

  public enableDamping: boolean = true
  public dampingFactor: number = 0.05
  public screenSpacePanning: boolean = false
  public minDistance: number = 700
  public maxDistance: number = 50000
  public maxPolarAngle: number = Math.PI / 2
  public minPolarAngle: number = 0
  public minAzimuthAngle: number = -Infinity
  public maxAzimuthAngle: number = Infinity
  public rotateSpeed: number = 1.0
  public zoomSpeed: number = 1.0
  public panSpeed: number = 1.0
  public target: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  private userInteracting: boolean = false
  private softBoundaryEnabled: boolean = true
  private softBoundaryZone: number = 0.20
  private baseZoomSpeed: number = 1.0
  private baseRotateSpeed: number = 1.0
  private horizontalDragEnabled: boolean = true
  private isDragging: boolean = false
  private panSensitivity: number = 0.28
  private rotateSensitivity: number = 0.0012
  private velocity: THREE.Vector3 = new THREE.Vector3()
  private rotationVelocity: number = 0
  private friction: number = 0.96
  private velocityThreshold: number = 0.008
  private rotationThreshold: number = 0.00008
  private smoothingFactor: number = 0.32
  private mouseNormalizedX = 0;
  private mouseNormalizedY = 0;
  private parallaxOffsetX = 0;
  private parallaxOffsetY = 0;
  private parallaxStrength = 30;
  // CHROME FIX: Increase parallax easing for smoother interpolation
  private parallaxEasing = 0.2;
  private baseCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private parallaxEnabled = true;
  private cameraTargetPosition: THREE.Vector3 = new THREE.Vector3();
  private desiredCameraPosition: THREE.Vector3 = new THREE.Vector3();
  // CHROME FIX: Increase lerp alpha for snappier response
  private cameraLerpAlpha: number = 0.15;
  private _last = performance.now()
  private dragTargetPosition: THREE.Vector3 = new THREE.Vector3();
  private _tempSpherical: THREE.Spherical = new THREE.Spherical();
  private _tempVector3: THREE.Vector3 = new THREE.Vector3();
  private _tempVector3_2: THREE.Vector3 = new THREE.Vector3();
  private _tempVector3_3: THREE.Vector3 = new THREE.Vector3();
  private lookAtTargetBlend: number = 0; // 0 = free camera, 1 = locked to target
  private lookAtTargetBlendSpeed: number = 0.05; // How fast to blend in/out (slower = smoother)
  private lookAtTargetBlendTimeout: number = 0; // Time when lookAt should start fading (milliseconds)
  private lookAtTargetHoldDuration: number = 800; // How long to hold lookAt after POI animation (ms)

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, mouseMoveOnly: boolean = false) {
    this.camera = camera
    this.domElement = domElement

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

    // Disable OrbitControls rotation - we'll handle horizontal panning ourselves
    if (this.horizontalDragEnabled) {
      this.orbit.enableRotate = false
      this.orbit.enablePan = false // We handle panning manually
    }

    if (!mouseMoveOnly) {
      this.setupInteractionListeners()
    }
    this.baseZoomSpeed = this.zoomSpeed
    this.baseRotateSpeed = this.rotateSpeed
    this.baseCameraPosition.copy(camera.position);
    this.domElement.addEventListener('mousemove', this._handleParallaxMouseMove);
    this.domElement.addEventListener('mouseleave', this._handleParallaxMouseLeave);
    this.dragTargetPosition.copy(this.camera.position);
    this.desiredCameraPosition.copy(this.camera.position);
  }

  private calculateBoundaryEasingGeneric(
    currentValue: number, 
    minValue: number, 
    maxValue: number, 
    movingTowardsMin: boolean
  ): number {
    const range = maxValue - minValue
    if (range <= 0) return 1.0
    
    const softZoneSize = range * this.softBoundaryZone

    if (movingTowardsMin) {
      const distanceFromMin = currentValue - minValue
      if (distanceFromMin < softZoneSize && distanceFromMin >= 0) {
        const t = distanceFromMin / softZoneSize
        return easeOutQuart(t)
      }
    } else {
      const distanceFromMax = maxValue - currentValue
      if (distanceFromMax < softZoneSize && distanceFromMax >= 0) {
        const t = distanceFromMax / softZoneSize
        return easeOutQuart(t)
      }
    }

    return 1.0
  }

  private calculateZoomEasing(zoomingIn: boolean): number {
    if (!this.orbit) return 1.0
    const currentDistance = this.camera.position.distanceTo(this.orbit.target)
    return this.calculateBoundaryEasingGeneric(
      currentDistance,
      this.minDistance,
      this.maxDistance,
      zoomingIn
    )
  }

  private calculatePolarEasing(movingUp: boolean): number {
    if (!this.orbit) return 1.0
    this._tempVector3.copy(this.camera.position).sub(this.orbit.target)
    this._tempSpherical.setFromVector3(this._tempVector3)
    const currentPolar = this._tempSpherical.phi

    return this.calculateBoundaryEasingGeneric(
      currentPolar,
      this.minPolarAngle,
      this.maxPolarAngle,
      movingUp
    )
  }

  private calculateAzimuthEasing(movingLeft: boolean): number {
    if (!this.orbit) return 1.0
    if (this.minAzimuthAngle === -Infinity || this.maxAzimuthAngle === Infinity) {
      return 1.0
    }

    this._tempVector3.copy(this.camera.position).sub(this.orbit.target)
    this._tempSpherical.setFromVector3(this._tempVector3)
    const currentAzimuth = this._tempSpherical.theta

    return this.calculateBoundaryEasingGeneric(
      currentAzimuth,
      this.minAzimuthAngle,
      this.maxAzimuthAngle,
      movingLeft
    )
  }

  private applyBoundaryEasing(deltaX: number, deltaY: number, deltaZoom: number): void {
    if (!this.softBoundaryEnabled || !this.orbit) return

    const zoomEasing = deltaZoom !== 0
      ? this.calculateZoomEasing(deltaZoom > 0)
      : 1.0

    const polarEasing = deltaY !== 0
      ? this.calculatePolarEasing(deltaY < 0)
      : 1.0

    const azimuthEasing = deltaX !== 0
      ? this.calculateAzimuthEasing(deltaX < 0)
      : 1.0

    const rotationEasing = Math.min(polarEasing, azimuthEasing)
    
    this.orbit.zoomSpeed = this.baseZoomSpeed * zoomEasing
    this.orbit.rotateSpeed = this.baseRotateSpeed * rotationEasing
  }

  private handleWheelWithEasing = (event: WheelEvent): void => {
    if (!this.softBoundaryEnabled || !this.orbit) return

    // Don't instantly disable - let it fade out in update loop

    const zoomingIn = event.deltaY > 0 // Scroll down = zoom in (closer)

    // Calculate easing factor using new method
    const easingFactor = this.calculateZoomEasing(zoomingIn)

    // Apply eased zoom speed
    this.orbit.zoomSpeed = this.baseZoomSpeed * easingFactor
  }

  private lastMouseX: number = 0
  private lastMouseY: number = 0
  
  // Store direction vectors for momentum continuation
  private lastForward: THREE.Vector3 = new THREE.Vector3()

  /**
   * Handle hybrid drag: horizontal = rotate, vertical = pan
   * - Left/right drag rotates around the target (orbiting)
   * - Up/down drag pans forward/backward
   * Both have smooth momentum/easing
   */
  private handlePointerMoveWithEasing = (event: PointerEvent): void => {
    if (!this.orbit) return;
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    if (this.isDragging && event.buttons === 1 && this.horizontalDragEnabled) {
      // Get camera direction vectors for panning (reuse temp vectors)
      this.camera.getWorldDirection(this._tempVector3)

      // Get the forward vector (camera direction projected onto XZ plane, reuse vector)
      this._tempVector3_2.set(this._tempVector3.x, 0, this._tempVector3.z).normalize()

      // Store for momentum continuation
      this.lastForward.copy(this._tempVector3_2)
      
      // === ROTATION (horizontal drag) ===
      // Calculate target rotation velocity
      // Positive deltaX (drag right) should rotate clockwise (negative angle around Y)
      let rotationEasing = 1.0
      let panEasing = 1.0
      if (this.boundingBox) {
        // Easing for rotation: slow down as camera approaches bounding box edge (X/Z)
        const margin = 40 // units for soft edge
        const box = this.boundingBox
        // For X axis
        const distToMinX = Math.abs(this.camera.position.x - box.min.x)
        const distToMaxX = Math.abs(this.camera.position.x - box.max.x)
        const tX = Math.min(distToMinX, distToMaxX) / margin
        // For Z axis
        const distToMinZ = Math.abs(this.camera.position.z - box.min.z)
        const distToMaxZ = Math.abs(this.camera.position.z - box.max.z)
        const tZ = Math.min(distToMinZ, distToMaxZ) / margin
        // Use the minimum t for strongest edge effect
        const t = Math.max(0, Math.min(1, Math.min(tX, tZ)))
        panEasing = easeOutQuart(t)
        rotationEasing = easeOutQuart(t)
      }

      // Apply easing to rotation and pan
      const targetRotationVelocity = deltaX * this.rotateSensitivity * rotationEasing
      this.rotationVelocity = this.rotationVelocity + (targetRotationVelocity - this.rotationVelocity) * this.smoothingFactor

      // Rotate camera in place - pivot around camera position, not target (reuse vectors)
      this._tempVector3_3.copy(this.orbit.target).sub(this.camera.position)
      this._tempVector3.set(0, 1, 0)
      this._tempVector3_3.applyAxisAngle(this._tempVector3, this.rotationVelocity)
      this.orbit.target.copy(this.camera.position).add(this._tempVector3_3)
      this.target.copy(this.orbit.target)
      this.camera.lookAt(this.orbit.target)

      // === PAN (vertical drag) ===
      const targetPanZ = deltaY * this.panSensitivity * panEasing
      // Reuse temp vector for target velocity
      this._tempVector3.set(0, 0, 0)
      // Only move along the XZ plane (no Y/height adjustment, reuse _tempVector3_2 as forward)
      this._tempVector3_2.setY(0).normalize()
      this._tempVector3.addScaledVector(this._tempVector3_2, targetPanZ)
      this.velocity.lerp(this._tempVector3, this.smoothingFactor)
      this.dragTargetPosition.add(this.velocity)
      this.orbit.target.add(this.velocity)
      this.target.copy(this.orbit.target)
      
      // Update base position during drag (without parallax)
      this.baseCameraPosition.add(this.velocity)

      // Clamp camera position to map boundaries
      this.clampToMapBoundaries()
    } else if (event.buttons > 0 && this.softBoundaryEnabled) {
      // Apply boundary easing for other controls
      this.applyBoundaryEasing(deltaX, deltaY, 0)
    }
  }
  
  /**
   * Apply momentum/inertia - call this in the update loop
   * Continues movement after drag release with smooth deceleration
   * Handles both pan momentum and rotation momentum
   */
  public applyMomentum(): void {
    if (!this.orbit || this.isDragging) return

    // === ROTATION MOMENTUM ===
    if (Math.abs(this.rotationVelocity) > this.rotationThreshold) {
      // Rotate camera in place - pivot around camera position, not target
      // Get offset from camera to target
      const offsetToTarget = this.orbit.target.clone().sub(this.camera.position)

      // Rotate the target around the camera (Y axis)
      offsetToTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVelocity)

      // Apply new target position (camera stays in place)
      this.orbit.target.copy(this.camera.position).add(offsetToTarget)
      this.target.copy(this.orbit.target)
      this.camera.lookAt(this.orbit.target)

      // Apply friction to rotation
      this.rotationVelocity *= this.friction
    } else {
      this.rotationVelocity = 0
    }
    
    // === PAN MOMENTUM ===
    if (this.velocity.length() > this.velocityThreshold) {
      // Apply velocity to base position and target (not camera.position directly)
      this.baseCameraPosition.add(this.velocity)
      this.orbit.target.add(this.velocity)
      this.target.copy(this.orbit.target)

      // Apply friction (ease out)
      this.velocity.multiplyScalar(this.friction)
    } else {
      // Stop completely when below threshold
      this.velocity.set(0, 0, 0)
    }
    
    // Clamp camera to map boundaries
    this.clampToMapBoundaries()
  }

  /**
   * Clamp camera and target positions to map boundaries
   */
  private clampToMapBoundaries(): void {
    if (!this.orbit) return

    // Use bounding box if set, otherwise fallback to static map boundaries
    const box = this.boundingBox
    if (box) {
      // Clamp camera position
      this.camera.position.x = Math.max(box.min.x, Math.min(box.max.x, this.camera.position.x))
      this.camera.position.z = Math.max(box.min.z, Math.min(box.max.z, this.camera.position.z))

      // Clamp target position
      this.orbit.target.x = Math.max(box.min.x, Math.min(box.max.x, this.orbit.target.x))
      this.orbit.target.z = Math.max(box.min.z, Math.min(box.max.z, this.orbit.target.z))
      this.target.copy(this.orbit.target)

      // Update base camera position if clamping occurred (for parallax)
      // (Removed baseCameraPosition logic)
    } else {
      // Fallback to static map boundaries
      const clampedCamera = clampToMapBounds(this.camera.position.x, this.camera.position.z)
      this.camera.position.x = clampedCamera.x
      this.camera.position.z = clampedCamera.z
      const clampedTarget = clampToMapBounds(this.orbit.target.x, this.orbit.target.z)
      this.orbit.target.x = clampedTarget.x
      this.orbit.target.z = clampedTarget.z
      this.target.copy(this.orbit.target)
      // (Removed baseCameraPosition logic)
    }
  }

  private handlePointerDown = (event: PointerEvent): void => {
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
    this.userInteracting = true

    // Don't instantly disable - let it fade out in update loop

    // Start dragging on left mouse button
    if (event.button === 0) {
      this.isDragging = true
      // Don't reset velocity immediately - allow smooth transition
    }
  }

  private handlePointerUp = (): void => {
    this.isDragging = false
  }

  // Store handler references for cleanup
  private _wheelInteractionHandler = () => { this.userInteracting = true }
  private _touchStartHandler = () => { this.userInteracting = true }
  private _pointerLeaveHandler = () => { this.handlePointerUp() }

  private setupInteractionListeners(): void {
    // Mouse/touch events with easing
    this.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.domElement.addEventListener('pointermove', this.handlePointerMoveWithEasing)
    this.domElement.addEventListener('pointerup', this.handlePointerUp)
    this.domElement.addEventListener('pointerleave', this._pointerLeaveHandler)
    this.domElement.addEventListener('wheel', this.handleWheelWithEasing, { passive: true })
    this.domElement.addEventListener('wheel', this._wheelInteractionHandler, { passive: true })

    // Also listen to touchstart for mobile
    this.domElement.addEventListener('touchstart', this._touchStartHandler, { passive: true })
    this.domElement.addEventListener('touchend', this.handlePointerUp, { passive: true })
  }

  public isUserInteracting(): boolean {
    return this.userInteracting
  }

  public resetInteractionFlag(): void {
    this.userInteracting = false
  }

  /**
   * Sync properties from this controller to the underlying OrbitControls
   * Call this after changing any camera restriction properties
   */
  private syncPropertiesToOrbit(): void {
    if (this.orbit) {
      // Basic properties
      this.orbit.enableDamping = this.enableDamping
      this.orbit.dampingFactor = this.dampingFactor
      this.orbit.screenSpacePanning = this.screenSpacePanning
      
      // Speed limits - prevents spinning too fast
      this.orbit.rotateSpeed = this.rotateSpeed
      this.orbit.zoomSpeed = this.zoomSpeed
      this.orbit.panSpeed = this.panSpeed
      
      // Distance constraints (zoom)
      this.orbit.minDistance = this.minDistance
      this.orbit.maxDistance = this.maxDistance
      
      // Vertical angle constraints (elevation) - prevents looking too far up or down
      this.orbit.maxPolarAngle = this.maxPolarAngle
      this.orbit.minPolarAngle = this.minPolarAngle
      
      // NO horizontal angle constraints - allow full 360° rotation
      this.orbit.minAzimuthAngle = -Infinity
      this.orbit.maxAzimuthAngle = Infinity
    }
  }

  /**
   * Set the target point and sync to OrbitControls
   * Use this to set the initial target or update it programmatically
   */
  public setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z)
    if (this.orbit) {
      this.orbit.target.set(x, y, z)
    }
  }

  /**
   * Try to dynamically import and switch to camera-controls. Falls back to OrbitControls on failure.
   */
  public async enableAdvanced(): Promise<boolean> {
    if (this.installedAdvanced) return true
    try {
      const mod = await import('camera-controls')
      const CameraControls = (mod && (mod.default || mod)) as any
      CameraControls.install({ THREE })
      // create camera-controls instance
      this.cameraControls = new CameraControls(this.camera, this.domElement)
      // copy current orbit state: camera position and target
      const pos = this.camera.position.clone()
      const tgt = this.orbit ? this.orbit.target.clone() : this.target.clone()
      // immediately set camera-controls to current state
      this.cameraControls.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, 0)
      // dispose orbit
      if (this.orbit) {
        this.orbit.dispose()
        this.orbit = null
      }
      this.installedAdvanced = true
      return true
    } catch (err) {
      // dynamic import failed or not installed — keep orbit
      // console.warn('camera-controls not available, using OrbitControls')
      return false
    }
  }

  public setLookAt(px: number, py: number, pz: number, tx: number, ty: number, tz: number, enableTransition = true) {
    if (this.cameraControls) {
      // camera-controls accepts a transition duration in seconds as last param
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
      // naive fit: place camera above center at distance based on box size
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
      // simple immediate set for fallback
      if (params.position) this.camera.position.copy(params.position)
      if (params.target) this.orbit.target.copy(params.target)
      this.orbit.update()
    }
  }

  public dispose() {
    // Remove all event listeners
    this.removeInteractionListeners()
    this.domElement.removeEventListener('mousemove', this._handleParallaxMouseMove)
    this.domElement.removeEventListener('mouseleave', this._handleParallaxMouseLeave)

    if (this.cameraControls && this.cameraControls.dispose) {
      try { this.cameraControls.dispose() } catch (e) { }
      this.cameraControls = null
    }
    if (this.orbit) {
      try { this.orbit.dispose() } catch (e) { }
      this.orbit = null
    }
  }

  private removeInteractionListeners(): void {
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.domElement.removeEventListener('pointermove', this.handlePointerMoveWithEasing)
    this.domElement.removeEventListener('pointerup', this.handlePointerUp)
    this.domElement.removeEventListener('pointerleave', this._pointerLeaveHandler)
    this.domElement.removeEventListener('wheel', this.handleWheelWithEasing)
    this.domElement.removeEventListener('wheel', this._wheelInteractionHandler)
    this.domElement.removeEventListener('touchstart', this._touchStartHandler)
    this.domElement.removeEventListener('touchend', this.handlePointerUp)
  }

  private _handleParallaxMouseMove = (event: MouseEvent) => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouseNormalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNormalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };

  private _handleParallaxMouseLeave = () => {
    // Do not reset, keep last offset
  };

  // Unified update method
  public update(deltaSeconds?: number) {
    if (this.cameraControls) {
      // compute delta (seconds) and ensure it's a finite positive number
      const raw = typeof deltaSeconds === 'number' ? deltaSeconds : ((performance.now() - this._last) / 1000)
      const dt = Number(raw)
      this._last = performance.now()
      if (!Number.isFinite(dt) || dt <= 0) {
        try { this.cameraControls.update(1 / 60) } catch (err) { this.cameraControls = null }
      } else {
        try { this.cameraControls.update(dt) } catch (err) { this.cameraControls = null }
      }
    } else if (this.orbit) {
      try {
        this.syncPropertiesToOrbit()
        this.orbit.update()
        this.applyMomentum()
      } catch (err) {}
    }
    this._applyMouseParallax();
    // Note: baseCameraPosition is now updated directly by momentum/drag logic
    // We no longer copy from camera.position to avoid parallax feedback loop
    
    // Calculate intended camera position in local camera space
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    this.camera.getWorldDirection(right);
    right.crossVectors(up, right).normalize();
    const offset = new THREE.Vector3();
    // Invert the parallax directions
    offset.addScaledVector(right, -this.parallaxOffsetX);
    offset.addScaledVector(up, -this.parallaxOffsetY);
    const intended = this.baseCameraPosition.clone().add(offset);
    this.cameraTargetPosition.x += (intended.x - this.cameraTargetPosition.x) * this.cameraLerpAlpha;
    this.cameraTargetPosition.y += (intended.y - this.cameraTargetPosition.y) * this.cameraLerpAlpha;
    this.cameraTargetPosition.z += (intended.z - this.cameraTargetPosition.z) * this.cameraLerpAlpha;
    this.camera.position.copy(this.cameraTargetPosition);

    // CRITICAL: Enforce camera height boundaries - NEVER allow camera to drop below minimum
    const MIN_CAMERA_HEIGHT = 210
    const MAX_CAMERA_HEIGHT = 300

    if (this.camera.position.y < MIN_CAMERA_HEIGHT) {
      this.camera.position.y = MIN_CAMERA_HEIGHT
      this.cameraTargetPosition.y = MIN_CAMERA_HEIGHT
      this.baseCameraPosition.y = MIN_CAMERA_HEIGHT
    }
    if (this.camera.position.y > MAX_CAMERA_HEIGHT) {
      this.camera.position.y = MAX_CAMERA_HEIGHT
      this.cameraTargetPosition.y = MAX_CAMERA_HEIGHT
      this.baseCameraPosition.y = MAX_CAMERA_HEIGHT
    }

    // SMOOTH BLEND: Gradually fade out lookAt behavior when user interacts OR after timeout
    // If user is interacting (dragging/zooming), fade out the blend immediately
    if (this.isDragging || this.velocity.length() > this.velocityThreshold || Math.abs(this.rotationVelocity) > this.rotationThreshold) {
      // Fade out - smoothly reduce blend toward 0
      this.lookAtTargetBlend = Math.max(0, this.lookAtTargetBlend - this.lookAtTargetBlendSpeed)
      // Reset timeout so it doesn't interfere
      this.lookAtTargetBlendTimeout = 0
    } else if (this.lookAtTargetBlendTimeout > 0 && performance.now() >= this.lookAtTargetBlendTimeout) {
      // Auto fade-out after timeout (no user interaction needed)
      this.lookAtTargetBlend = Math.max(0, this.lookAtTargetBlend - this.lookAtTargetBlendSpeed * 0.5)

      // Once fully faded, reset timeout
      if (this.lookAtTargetBlend <= 0.001) {
        this.lookAtTargetBlendTimeout = 0
      }
    }

    // CRITICAL FIX: Smoothly blend between lookAt (POI mode) and free camera (user control)
    // This prevents snap when transitioning from POI to user control
    if (this.lookAtTargetBlend > 0.001 && this.orbit && this.orbit.target) {
      // Store current rotation
      const currentRotation = this.camera.quaternion.clone()

      // Calculate desired rotation (looking at target)
      this.camera.lookAt(this.orbit.target)
      const targetRotation = this.camera.quaternion.clone()

      // Blend between current and target rotation
      currentRotation.slerp(targetRotation, this.lookAtTargetBlend)
      this.camera.quaternion.copy(currentRotation)
    }

    // update target proxy
    if (this.orbit) this.target.copy(this.orbit.target)
  }

  // Unified _applyMouseParallax method
  private _applyMouseParallax() {
    if (!this.parallaxEnabled) {
      // When disabled, reset offsets to 0
      this.parallaxOffsetX *= 0.9; // Gradually fade out
      this.parallaxOffsetY *= 0.9;
      return;
    }

    // Parallax and momentum are completely independent
    // Parallax always follows mouse position, regardless of drag/momentum state
    const targetX = this.mouseNormalizedX * this.parallaxStrength;
    const targetY = this.mouseNormalizedY * this.parallaxStrength * 0.6;
    
    // Smoothly interpolate to target offset
    this.parallaxOffsetX += (targetX - this.parallaxOffsetX) * this.parallaxEasing;
    this.parallaxOffsetY += (targetY - this.parallaxOffsetY) * this.parallaxEasing;
  }

  /**
   * Enable or disable parallax effect
   */
  public setParallaxEnabled(enabled: boolean) {
    this.parallaxEnabled = enabled;
    if (!enabled) {
      // Reset mouse positions when disabling
      this.mouseNormalizedX = 0;
      this.mouseNormalizedY = 0;
    }
  }

  /**
   * Sync all internal camera state after programmatic camera movement (e.g., POI transitions)
   * Call this when you manually set camera.position and controls.target to prevent snap-back
   */
  public syncInternalState(): void {
    // Sync all internal position tracking to current camera state
    this.baseCameraPosition.copy(this.camera.position)
    this.dragTargetPosition.copy(this.camera.position)
    this.desiredCameraPosition.copy(this.camera.position)
    this.cameraTargetPosition.copy(this.camera.position)

    // Reset all velocities and momentum
    this.velocity.set(0, 0, 0)
    this.rotationVelocity = 0

    // CRITICAL: Reset parallax offsets to prevent snap after POI animation
    // When animation hands off, parallax should start from zero
    this.parallaxOffsetX = 0
    this.parallaxOffsetY = 0

    // Enable lookAt behavior after POI handoff - set to full blend
    this.lookAtTargetBlend = 1.0

    // Set timeout for automatic fade-out to prevent continuous camera drift
    this.lookAtTargetBlendTimeout = performance.now() + this.lookAtTargetHoldDuration

    // Sync orbit controls target
    if (this.orbit && this.orbit.target) {
      this.target.copy(this.orbit.target)
    }
  }

  /**
   * Apply initial velocity for smooth handoff (e.g., when interrupting POI animation)
   * The velocity will naturally decelerate via existing momentum system
   */
  public applyHandoffVelocity(velocity: THREE.Vector3): void {
    // Scale down velocity for smoother handoff (reduce by 30%)
    this.velocity.copy(velocity).multiplyScalar(0.3)

    // Sync internal state
    this.baseCameraPosition.copy(this.camera.position)
    this.dragTargetPosition.copy(this.camera.position)
    this.desiredCameraPosition.copy(this.camera.position)
    this.cameraTargetPosition.copy(this.camera.position)
  }
}

export default HelsinkiCameraController
