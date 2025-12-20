import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { clampToMapBounds } from '../constants/mapBoundaries'

/**
 * Super smooth ease-out using quartic (power of 4)
 * Provides very gentle deceleration near boundaries
 */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Thin wrapper that dynamically upgrades OrbitControls to camera-controls when available.
 * Keeps a stable API used by HelsinkiScene: update(delta?), target, dispose, setLookAt, fitToBox, flyTo
 */
export class HelsinkiCameraController {
  // --- Parallax drag-release freeze/ease-in state ---
  private parallaxFreezeActive = false;
  private parallaxFreezeStart = 0;
  private parallaxFreezeDuration = 0; // ms (no freeze, only ease-in)
  private parallaxEaseInActive = false;
  private parallaxEaseInStart = 0;
  private parallaxEaseInDuration = 600; // ms (ease-in duration)
    // Optional bounding box for camera limits
    private boundingBox: THREE.Box3 | null = null

    /**
     * Set the bounding box for camera movement limits
     */
    public setBoundingBox(box: THREE.Box3) {
      this.boundingBox = box.clone()
    }
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private orbit: OrbitControls | null = null
  private cameraControls: any = null
  private installedAdvanced = false
  public parallax: THREE.Vector2 = new THREE.Vector2()

  // Proxyable properties
  public enableDamping: boolean = true
  public dampingFactor: number = 0.05
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
  private userInteracting: boolean = false

  // Soft boundary easing settings
  private softBoundaryEnabled: boolean = true
  private softBoundaryZone: number = 0.20 // 20% of range near edges gets easing
  
  // Store base speeds for easing calculations
  private baseZoomSpeed: number = 1.0
  private baseRotateSpeed: number = 1.0
  
  // Hybrid drag settings (rotation + pan)
  private horizontalDragEnabled: boolean = true
  private isDragging: boolean = false
  private panSensitivity: number = 0.28 // Lower = slower, smoother up/down drag
  private rotateSensitivity: number = 0.0012 // Lower = slower, smoother left/right drag
  
  // Momentum/inertia settings for smooth easing
  private velocity: THREE.Vector3 = new THREE.Vector3()
  private rotationVelocity: number = 0 // Angular velocity for rotation momentum
  private friction: number = 0.96 // Higher = more easing, smoother stop
  private velocityThreshold: number = 0.008 // Slightly lower for more subtle stop
  private rotationThreshold: number = 0.00008 // Slightly lower for more subtle stop
  private smoothingFactor: number = 0.32 // Higher = more smoothing/easing

  // --- Parallax effect state ---
  private mouseNormalizedX = 0;
  private mouseNormalizedY = 0;
  private parallaxOffsetX = 0;
  private parallaxOffsetY = 0;
  private parallaxStrength = 30; // units
  private parallaxEasing = 0.04;
  private baseCameraPosition: THREE.Vector3 = new THREE.Vector3();

  // --- Smoothed camera state ---
  private cameraTargetPosition: THREE.Vector3 = new THREE.Vector3();
  private desiredCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private cameraLerpAlpha: number = 0.08; // Lower = smoother

  // internal clock for delta when needed
  private _last = performance.now()

  // Add a new property for the drag target position
  private dragTargetPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement
    
    // Initialize base camera position from actual camera position
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
    
    // Disable OrbitControls rotation - we'll handle horizontal panning ourselves
    if (this.horizontalDragEnabled) {
      this.orbit.enableRotate = false
      this.orbit.enablePan = false // We handle panning manually
    }

    // Listen for user interaction events
    this.setupInteractionListeners()
    
    // Store base speeds
    this.baseZoomSpeed = this.zoomSpeed
    this.baseRotateSpeed = this.rotateSpeed

    // Add mousemove listener for parallax effect (only once)
    this.baseCameraPosition.copy(camera.position);
    this.domElement.addEventListener('mousemove', this._handleParallaxMouseMove);
    this.domElement.addEventListener('mouseleave', this._handleParallaxMouseLeave);
    // In constructor, initialize dragTargetPosition
    this.dragTargetPosition.copy(this.camera.position);
    // In constructor, initialize desiredCameraPosition
    this.desiredCameraPosition.copy(this.camera.position);
  }

  /**
   * Calculate easing factor for any boundary using smooth bezier ease-out
   * @param currentValue - Current value
   * @param minValue - Minimum boundary
   * @param maxValue - Maximum boundary
   * @param movingTowardsMin - Whether movement is towards the minimum
   * @returns Easing factor 0-1 (0 = at boundary, 1 = full speed)
   */
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
      // Moving towards minimum boundary
      const distanceFromMin = currentValue - minValue
      if (distanceFromMin < softZoneSize && distanceFromMin >= 0) {
        const t = distanceFromMin / softZoneSize
        return easeOutQuart(t) // Super smooth ease-out
      }
    } else {
      // Moving towards maximum boundary
      const distanceFromMax = maxValue - currentValue
      if (distanceFromMax < softZoneSize && distanceFromMax >= 0) {
        const t = distanceFromMax / softZoneSize
        return easeOutQuart(t) // Super smooth ease-out
      }
    }
    
    return 1.0 // Full speed when not near boundaries
  }

  /**
   * Calculate combined easing for zoom (distance)
   */
  private calculateZoomEasing(zoomingIn: boolean): number {
    if (!this.orbit) return 1.0
    const currentDistance = this.camera.position.distanceTo(this.orbit.target)
    return this.calculateBoundaryEasingGeneric(
      currentDistance,
      this.minDistance,
      this.maxDistance,
      zoomingIn // zoomingIn means moving towards minDistance
    )
  }

  /**
   * Calculate combined easing for polar angle (vertical rotation / elevation)
   */
  private calculatePolarEasing(movingUp: boolean): number {
    if (!this.orbit) return 1.0
    // Get current polar angle from OrbitControls
    const spherical = new THREE.Spherical()
    const offset = this.camera.position.clone().sub(this.orbit.target)
    spherical.setFromVector3(offset)
    const currentPolar = spherical.phi
    
    // movingUp means decreasing polar angle (towards minPolarAngle)
    return this.calculateBoundaryEasingGeneric(
      currentPolar,
      this.minPolarAngle,
      this.maxPolarAngle,
      movingUp
    )
  }

  /**
   * Calculate combined easing for azimuth angle (horizontal rotation)
   * Only applies if azimuth is constrained (not -Infinity to Infinity)
   */
  private calculateAzimuthEasing(movingLeft: boolean): number {
    if (!this.orbit) return 1.0
    if (this.minAzimuthAngle === -Infinity || this.maxAzimuthAngle === Infinity) {
      return 1.0 // No easing for unconstrained rotation
    }
    
    const spherical = new THREE.Spherical()
    const offset = this.camera.position.clone().sub(this.orbit.target)
    spherical.setFromVector3(offset)
    const currentAzimuth = spherical.theta
    
    return this.calculateBoundaryEasingGeneric(
      currentAzimuth,
      this.minAzimuthAngle,
      this.maxAzimuthAngle,
      movingLeft
    )
  }

  /**
   * Apply all boundary easing based on current movement
   */
  private applyBoundaryEasing(deltaX: number, deltaY: number, deltaZoom: number): void {
    if (!this.softBoundaryEnabled || !this.orbit) return

    // Calculate easing factors for each constraint
    const zoomEasing = deltaZoom !== 0
      ? this.calculateZoomEasing(deltaZoom > 0)
      : 1.0
    
    const polarEasing = deltaY !== 0 
      ? this.calculatePolarEasing(deltaY < 0) // negative deltaY = moving up
      : 1.0
    
    const azimuthEasing = deltaX !== 0 
      ? this.calculateAzimuthEasing(deltaX < 0) // negative deltaX = moving left
      : 1.0
    
    // Apply combined easing to speeds
    // Use minimum easing factor to ensure smooth stopping at any boundary
    const rotationEasing = Math.min(polarEasing, azimuthEasing)
    
    this.orbit.zoomSpeed = this.baseZoomSpeed * zoomEasing
    this.orbit.rotateSpeed = this.baseRotateSpeed * rotationEasing
  }

  private handleWheelWithEasing = (event: WheelEvent): void => {
    if (!this.softBoundaryEnabled || !this.orbit) return
    
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
      // Get camera direction vectors for panning
      const cameraDirection = new THREE.Vector3()
      this.camera.getWorldDirection(cameraDirection)
      
      // Get the forward vector (camera direction projected onto XZ plane)
      const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize()
      
      // Store for momentum continuation
      this.lastForward.copy(forward)
      
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

      // Rotate camera in place - pivot around camera position, not target
      const offsetToTarget = this.orbit.target.clone().sub(this.camera.position)
      offsetToTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVelocity)
      this.orbit.target.copy(this.camera.position).add(offsetToTarget)
      this.target.copy(this.orbit.target)
      this.camera.lookAt(this.orbit.target)

      // === PAN (vertical drag) ===
      const targetPanZ = deltaY * this.panSensitivity * panEasing
      const targetVelocity = new THREE.Vector3()
      // Only move along the XZ plane (no Y/height adjustment)
      targetVelocity.addScaledVector(forward.setY(0).normalize(), targetPanZ)
      this.velocity.lerp(targetVelocity, this.smoothingFactor)
      this.dragTargetPosition.add(this.velocity)
      this.orbit.target.add(this.velocity)
      this.target.copy(this.orbit.target)

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

    // Debug: log momentum state
    if (window && (window as any).DEBUG_PARALLAX) {
      console.log('[Momentum] rotationVelocity:', this.rotationVelocity, 'rotationThreshold:', this.rotationThreshold, 'velocity:', this.velocity.length(), 'velocityThreshold:', this.velocityThreshold);
    }

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
      // Apply velocity to camera and target
      this.camera.position.add(this.velocity)
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
    
    // Start dragging on left mouse button
    if (event.button === 0) {
      this.isDragging = true
      // Don't reset velocity immediately - allow smooth transition
    }
  }

  private handlePointerUp = (): void => {
    this.isDragging = false
    // Start parallax freeze
    this.parallaxFreezeActive = true;
    this.parallaxFreezeStart = performance.now();
    this.parallaxEaseInActive = false;
  }

  private setupInteractionListeners(): void {
    // Mouse/touch events with easing
    this.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.domElement.addEventListener('pointermove', this.handlePointerMoveWithEasing)
    this.domElement.addEventListener('pointerup', this.handlePointerUp)
    this.domElement.addEventListener('pointerleave', () => {
      this.handlePointerUp()
    })
    this.domElement.addEventListener('wheel', this.handleWheelWithEasing, { passive: true })
    this.domElement.addEventListener('wheel', () => { this.userInteracting = true }, { passive: true })
    
    // Also listen to touchstart for mobile
    this.domElement.addEventListener('touchstart', () => { this.userInteracting = true }, { passive: true })
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
    if (this.cameraControls && this.cameraControls.dispose) {
      try { this.cameraControls.dispose() } catch (e) { }
      this.cameraControls = null
    }
    if (this.orbit) {
      try { this.orbit.dispose() } catch (e) { }
      this.orbit = null
    }
  }

  private _handleParallaxMouseMove = (event: MouseEvent) => {
    // Always update the latest mouse position, but only use it after freeze
    const rect = this.domElement.getBoundingClientRect();
    this._latestMouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._latestMouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    // Only update the actual parallax target if not frozen
    if (!this.parallaxFreezeActive && !this.parallaxEaseInActive) {
      this.mouseNormalizedX = this._latestMouseX;
      this.mouseNormalizedY = this._latestMouseY;
    }
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
    // Determine base position
    if (this.isDragging || this.velocity.length() > this.velocityThreshold || Math.abs(this.rotationVelocity) > this.rotationThreshold) {
      this.baseCameraPosition.copy(this.camera.position);
    }
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

    // update target proxy
    if (this.orbit) this.target.copy(this.orbit.target)
  }

  // Unified _applyMouseParallax method
  private _latestMouseX = 0;
  private _latestMouseY = 0;
  private _applyMouseParallax() {
    const now = performance.now();
    // Handle freeze after drag release
    if (this.parallaxFreezeActive) {
      if (now - this.parallaxFreezeStart < this.parallaxFreezeDuration) {
        // During freeze, do not update mouseNormalizedX/Y (parallax is frozen)
        return;
      } else {
        // Start ease-in
        this.parallaxFreezeActive = false;
        this.parallaxEaseInActive = true;
        this.parallaxEaseInStart = now;
      }
    }
    // Handle ease-in after freeze
    if (this.parallaxEaseInActive) {
      const t = Math.min(1, (now - this.parallaxEaseInStart) / this.parallaxEaseInDuration);
      // Interpolate mouseNormalizedX/Y from current to latest
      this.mouseNormalizedX += (this._latestMouseX - this.mouseNormalizedX) * t;
      this.mouseNormalizedY += (this._latestMouseY - this.mouseNormalizedY) * t;
      if (t >= 1) {
        this.mouseNormalizedX = this._latestMouseX;
        this.mouseNormalizedY = this._latestMouseY;
        this.parallaxEaseInActive = false;
      }
    } else {
      // Normal operation: always follow latest
      this.mouseNormalizedX = this._latestMouseX;
      this.mouseNormalizedY = this._latestMouseY;
    }
    // Always ease offset toward target
    const targetX = this.mouseNormalizedX * this.parallaxStrength;
    const targetY = this.mouseNormalizedY * this.parallaxStrength * 0.6;
    this.parallaxOffsetX += (targetX - this.parallaxOffsetX) * this.parallaxEasing;
    this.parallaxOffsetY += (targetY - this.parallaxOffsetY) * this.parallaxEasing;
  }
}

export default HelsinkiCameraController
