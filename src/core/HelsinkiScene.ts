/**
 * Helsinki 3D Scene
 * Three.js scene setup with Helsinki GLB model (baked textures) and post-processing effects
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import HelsinkiCameraController from './HelsinkiCameraController'
import { loadDualModels } from '../loaders'
import { setupPostProcessing, setupComposer, setupSceneLighting } from '../rendering'
import { setupSceneFog, updateFogColor } from '../effects'
import { createSmoothPOIAnimation, updateSmoothPOIAnimation, interruptSmoothPOIAnimation, type SmoothPOIAnimation } from '../animation'
import {
  PerlinNoiseGenerator,
  applyCameraConfig,
  getCurrentCameraConfig,
  CAMERA_PRESETS,
  type CameraConfig,
  createCamera,
  createRenderer,
  configureCameraControls,
  createRenderTarget,
  handleResize,
  setupClickHandler
} from '../helpers'
import { AutoTourManager, POIHighlightManager, FoundersHouseMarker } from './managers'
import { COLORS } from '../constants/designSystem'
import { POINTS_OF_INTEREST, FOUNDERS_HOUSE_SCREEN_POS } from '../constants/poi'
import { MAP_BOUNDARIES } from '../constants/mapBoundaries'

export interface SceneConfig {
  container: HTMLElement
  helsinkiCenter: { lat: number; lng: number }
  radius: number
  isNightMode?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
  staticMode?: boolean
  environmentColor?: string
  enableAutoCentering?: boolean
  onHeroTextOpacityChange?: (opacity: number) => void
}

export class HelsinkiScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: HelsinkiCameraController
  private helsinkiModel: THREE.Group | null = null
  private perlinTexture: THREE.DataTexture
  private postProcessMaterial: THREE.ShaderMaterial
  private composer: any | null = null
  private renderTarget: THREE.WebGLRenderTarget
  private clock: THREE.Clock
  private container: HTMLElement
  private isNightMode: boolean
  private poiAnimation: SmoothPOIAnimation | null = null
  private fog: THREE.Fog | null = null
  private autoTourManager: AutoTourManager
  private poiHighlightManager: POIHighlightManager
  private foundersHouseMarker: FoundersHouseMarker
  private foundersHouseOverlay: THREE.Group | null = null
  private foundersHouseOverlayMaterial: THREE.MeshStandardMaterial | null = null
  private _cleanupClickHandler: (() => void) | null = null
  private enableAutoCentering: boolean = false
  private onHeroTextOpacityChange?: (opacity: number) => void
  private lastInteractionTime: number = Date.now()
  private initialLoadTime: number = Date.now()
  private lastHeroTextOpacity: number = -1
  private suppressAutoCentering: boolean = false
  private isAtFoundersHouseInitialPosition: boolean = false
  private originalMinPolarAngle: number | null = null
  private originalMaxPolarAngle: number | null = null
  private angleRestoreAnimation: {
    active: boolean
    startTime: number
    duration: number
    startPolarAngle: number
    endPolarAngle: number
    startHeight: number
    endHeight: number
  } | null = null

  // Separate renderer and scene for sähkötalo (renders without greyscale)
  private sahkotaloRenderer: THREE.WebGLRenderer | null = null
  private sahkotaloScene: THREE.Scene | null = null

  private particleGroup: THREE.Group | null = null
  private particles: Array<{ mesh: THREE.Mesh, swayPhase: number }> = []
  private particleDensity: number = 1 / 5 // 1 particle per 5 cubic meters
  private particleArea: number = 2000 * 2000 // Default area (2km x 2km)
  private particleColor: number = 0xff0000 // Red for visibility
  private particleSize: number = 40 // 5x bigger

  public revealProgress: number = 0

  constructor(config: SceneConfig) {
    this.container = config.container
    this.clock = new THREE.Clock()
    this.isNightMode = config.isNightMode !== undefined ? config.isNightMode : false
    this.enableAutoCentering = config.enableAutoCentering ?? false
    this.onHeroTextOpacityChange = config.onHeroTextOpacityChange

    this.scene = new THREE.Scene()
    this.scene.background = this.isNightMode
      ? new THREE.Color(COLORS.night.sky)
      : new THREE.Color(COLORS.day.sky)

    this.camera = createCamera()
    this.renderer = createRenderer(config.container)

    // Create second renderer for sähkötalo (full color, no greyscale)
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
    this.sahkotaloRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile, // Disable antialias on mobile for performance
      powerPreference: 'high-performance'
    })
    // Use window dimensions (not container) to match main renderer and camera aspect ratio
    this.sahkotaloRenderer.setSize(window.innerWidth, window.innerHeight)
    // Mobile devices: limit to 1.25x pixel ratio to prevent memory overflow
    const maxPixelRatio = isMobile ? 1.25 : 2;
    this.sahkotaloRenderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
    this.sahkotaloRenderer.domElement.classList.add('sahkotalo-canvas')
    this.sahkotaloRenderer.domElement.style.position = 'absolute'
    this.sahkotaloRenderer.domElement.style.pointerEvents = 'none'
    config.container.appendChild(this.sahkotaloRenderer.domElement)

    // Create separate scene for sähkötalo (transparent background)
    this.sahkotaloScene = new THREE.Scene()
    // Add same lighting to sähkötalo scene
    setupSceneLighting(this.sahkotaloScene)

    this.controls = new HelsinkiCameraController(this.camera, this.renderer.domElement, config.staticMode)
    if (!config.staticMode) {
      configureCameraControls(this.controls)
      // Store original polar angle constraints to restore after POI animations
      this.originalMinPolarAngle = this.controls.minPolarAngle
      this.originalMaxPolarAngle = this.controls.maxPolarAngle
    }
    this.renderTarget = createRenderTarget()
    this.perlinTexture = this.generatePerlinTexture()

    const { material: ppMaterial } = setupPostProcessing(this.renderTarget)
    this.postProcessMaterial = ppMaterial
    const composerResult = setupComposer(this.renderer, this.scene, this.camera, this.postProcessMaterial)
    this.composer = composerResult.composer

    setupSceneLighting(this.scene)
    this.fog = setupSceneFog(this.scene, this.isNightMode)
    this.poiHighlightManager = new POIHighlightManager()

    this.autoTourManager = new AutoTourManager()

    this.foundersHouseMarker = new FoundersHouseMarker()
    if (!config.staticMode) {
      this.setupInteractionListeners()
    }

    // Add boundary wireframe box
    this.createBoundaryWireframe()

    loadDualModels({
      mainMapPath: '/models/fh.glb',
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      isNightMode: this.isNightMode,
      onLoadProgress: config.onLoadProgress,
      onLoadComplete: config.onLoadComplete,
      renderer: this.renderer,
    }).then((result) => {
      this.helsinkiModel = result.mainMap
      // Wire up the actual model AABB as camera boundaries (replaces static MAP_BOUNDARIES)
      const modelBox = new THREE.Box3().setFromObject(this.helsinkiModel)
      this.controls.setBoundingBox(modelBox)
      this.loadFoundersHouseOverlay()
      // Create particles after model loads
      this.createFloatingParticles();
      // console.log('createFloatingParticles called:', this.particles.length, 'particles');
    }).catch(() => {
    })

    this._cleanupClickHandler = setupClickHandler(this.renderer, this.camera, () => this.helsinkiModel)
    window.addEventListener('resize', this.onWindowResize)
  }

  private createBoundaryWireframe(): void {
    // Create a wireframe box at the map boundaries
    const sizeX = MAP_BOUNDARIES.x.max - MAP_BOUNDARIES.x.min
    const sizeZ = MAP_BOUNDARIES.z.max - MAP_BOUNDARIES.z.min
    const height = 400  // Height of the wireframe walls

    const geometry = new THREE.BoxGeometry(sizeX, height, sizeZ)
    const edges = new THREE.EdgesGeometry(geometry)
    const material = new THREE.LineBasicMaterial({
      color: this.isNightMode ? 0x4a5568 : 0x94a3b8,
      transparent: true,
      opacity: 0.3
    })
    const wireframe = new THREE.LineSegments(edges, material)

    // Position the box at ground level
    wireframe.position.set(0, height / 2 - 50, 0)

    this.scene.add(wireframe)
  }

  private generatePerlinTexture(): THREE.DataTexture {
    const generator = new PerlinNoiseGenerator(512)
    const data = generator.generate()

    const texture = new THREE.DataTexture(data, 512, 512, THREE.RedFormat)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.needsUpdate = true

    return texture
  }

  private onWindowResize = (): void => {
    handleResize(
      this.camera,
      this.renderer,
      this.renderTarget,
      this.postProcessMaterial,
      this.composer
    )

    // Also resize sähkötalo renderer - use window dimensions to match main renderer
    if (this.sahkotaloRenderer) {
      const width = window.innerWidth
      const height = window.innerHeight
      this.sahkotaloRenderer.setSize(width, height)
      // Apply same mobile pixel ratio cap as initial setup to prevent memory pressure on resize/rotation
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
      const maxPixelRatio = isMobile ? 1.25 : 2;
      this.sahkotaloRenderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
    }
  }

  private _handlePointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return
    this.autoTourManager.recordInteraction()
    this.lastInteractionTime = Date.now()
  }

  private _handleTouchStart = () => {
    this.autoTourManager.recordInteraction()
    this.lastInteractionTime = Date.now()
  }

  private _handleWheel = () => {
    this.autoTourManager.recordInteraction()
    this.lastInteractionTime = Date.now()
  }

  /**
   * Setup interaction event listeners for auto-tour
   */
  private setupInteractionListeners(): void {
    this.renderer.domElement.addEventListener('pointerdown', this._handlePointerDown, { passive: true })
    this.renderer.domElement.addEventListener('touchstart', this._handleTouchStart, { passive: true })
    this.renderer.domElement.addEventListener('wheel', this._handleWheel, { passive: true })
  }

  private removeInteractionListeners(): void {
    this.renderer.domElement.removeEventListener('pointerdown', this._handlePointerDown)
    this.renderer.domElement.removeEventListener('touchstart', this._handleTouchStart)
    this.renderer.domElement.removeEventListener('wheel', this._handleWheel)
  }

  private getMapBounds(): { min: THREE.Vector3; max: THREE.Vector3; radius: number } | null {
    if (!this.helsinkiModel) return null

    const boundingBox = new THREE.Box3().setFromObject(this.helsinkiModel)
    const min = boundingBox.min
    const max = boundingBox.max

    const sizeX = max.x - min.x
    const sizeZ = max.z - min.z
    const radius = Math.max(sizeX, sizeZ) / 2

    return { min, max, radius }
  }

  private clampPositionToBoundaries(position: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    if (!this.helsinkiModel) return position

    const bounds = this.getMapBounds()
    if (!bounds) return position

    const safetyMargin = 1.0
    const maxX = bounds.max.x * safetyMargin
    const minX = bounds.min.x * safetyMargin
    const maxZ = bounds.max.z * safetyMargin
    const minZ = bounds.min.z * safetyMargin

    return {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: position.y,
      z: Math.max(minZ, Math.min(maxZ, position.z))
    }
  }

  private enforceCameraBoundaries(): void {
    if (!this.controls || !this.helsinkiModel) return

    const bounds = this.getMapBounds()
    if (!bounds) return

    const cameraTarget = this.controls.target || new THREE.Vector3(0, 0, 0)

    const safetyMargin = 1.0
    const maxX = bounds.max.x * safetyMargin
    const minX = bounds.min.x * safetyMargin
    const maxZ = bounds.max.z * safetyMargin
    const minZ = bounds.min.z * safetyMargin

    let clamped = false
    if (cameraTarget.x > maxX) {
      cameraTarget.x = maxX
      clamped = true
    }
    if (cameraTarget.x < minX) {
      cameraTarget.x = minX
      clamped = true
    }
    if (cameraTarget.z > maxZ) {
      cameraTarget.z = maxZ
      clamped = true
    }
    if (cameraTarget.z < minZ) {
      cameraTarget.z = minZ
      clamped = true
    }

    // Maintain reasonable camera height when user is in control
    if (this.camera.position.y < 210) {
      this.camera.position.y = 210
      clamped = true
    }
    if (this.camera.position.y > 300) {
      this.camera.position.y = 300
      clamped = true
    }

    if (clamped) {
      this.controls.setTarget(cameraTarget.x, cameraTarget.y, cameraTarget.z)
    }
  }


  public update(): void {
    const elapsed = this.clock.getElapsedTime()
    const delta = this.clock.getDelta()

    // CHROME FIX: Clamp delta to prevent jitter from frame rate spikes
    // Cap at 20fps minimum (1/20 = 0.05s) to allow animations to progress even during lag
    const clampedDelta = Math.min(delta, 0.05)

    // Smooth POI animation system - DISABLE interruptions during POI animations
    const isPOIAnimating = this.poiAnimation && this.poiAnimation.isActive

    // Only enforce camera boundaries when NOT animating to a POI
    if (!isPOIAnimating) {
      this.enforceCameraBoundaries()
    }

    if (this.controls.isUserInteracting() && !isPOIAnimating) {
      // Cancel angle restoration if user interacts during it
      if (this.angleRestoreAnimation && this.angleRestoreAnimation.active) {
        this.angleRestoreAnimation.active = false
        this.angleRestoreAnimation = null
      }

      // When the user drags away after clicking the FH badge, let the normal
      // distance-based opacity logic take over again instead of forcing text visible.
      this.isAtFoundersHouseInitialPosition = false

      this.controls.resetInteractionFlag()
      // Auto-tour manager disabled - no longer using inactivity timers
    }

    // Handle angle restoration animation
    if (this.angleRestoreAnimation && this.angleRestoreAnimation.active) {
      const currentTime = performance.now() / 1000
      const elapsed = currentTime - this.angleRestoreAnimation.startTime
      const t = Math.min(elapsed / this.angleRestoreAnimation.duration, 1.0)

      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3)

      const currentTarget = this.controls.target || new THREE.Vector3(0, 0, 0)
      const currentDistance = this.camera.position.distanceTo(currentTarget)

      // Interpolate polar angle
      const newPolarAngle = THREE.MathUtils.lerp(
        this.angleRestoreAnimation.startPolarAngle,
        this.angleRestoreAnimation.endPolarAngle,
        eased
      )

      // Get current azimuth
      const cameraToTarget = new THREE.Vector3().subVectors(this.camera.position, currentTarget)
      const currentSpherical = new THREE.Spherical().setFromVector3(cameraToTarget)

      // Set camera position with interpolated polar angle
      const newSpherical = new THREE.Spherical(currentDistance, newPolarAngle, currentSpherical.theta)
      const offset = new THREE.Vector3().setFromSpherical(newSpherical)
      this.camera.position.copy(currentTarget).add(offset)

      // Interpolate height
      const targetHeight = THREE.MathUtils.lerp(
        this.angleRestoreAnimation.startHeight,
        this.angleRestoreAnimation.endHeight,
        eased
      )
      this.camera.position.y = targetHeight

      this.camera.lookAt(currentTarget)

      // Animation complete
      if (t >= 1.0) {
        this.angleRestoreAnimation.active = false
        this.angleRestoreAnimation = null

        // Restore original polar angle constraints
        if (this.originalMinPolarAngle !== null && this.originalMaxPolarAngle !== null) {
          this.controls.minPolarAngle = this.originalMinPolarAngle
          this.controls.maxPolarAngle = this.originalMaxPolarAngle

          if (this.controls.syncInternalState) {
            this.controls.syncInternalState()
          }
        }
      }
    }

    let currentCameraTarget = this.controls.target || new THREE.Vector3(0, 0, 0)

    if (isPOIAnimating && this.poiAnimation) {
      const result = updateSmoothPOIAnimation(this.poiAnimation, this.camera, elapsed, clampedDelta)
      currentCameraTarget = result.currentTarget

      // SMOOTH HANDOFF: During settling phase, pre-sync controller state
      // This prevents snap by ensuring controller is ready before animation ends
      if (result.isSettling && this.controls.syncInternalState) {
        // Gradually sync internal state during the last 5% of animation
        // This ensures baseCameraPosition, cameraTargetPosition etc are in sync
        this.controls.syncInternalState()
      }

      if (!result.stillAnimating) {
        this.poiAnimation = null
      }
    }

    const isAngleRestoring = this.angleRestoreAnimation && this.angleRestoreAnimation.active

    if (!isPOIAnimating && !isAngleRestoring) {
      // CHROME FIX: Use clamped delta for smoother control updates
      this.controls.update(clampedDelta)
    } else if (!isPOIAnimating && isAngleRestoring) {
      // During angle restoration, keep target in sync but don't update controls
      if (this.controls.target) {
        this.controls.target.copy(currentCameraTarget)
      }
    } else if (isPOIAnimating) {
      // During POI animation, avoid control updates that can move the camera.
      if (this.controls.target) {
        this.controls.target.copy(currentCameraTarget)
      }
    } else {
      // CHROME FIX: Use clamped delta for smoother control updates
      this.controls.update(clampedDelta)

      if (this.controls.target) {
        this.controls.target.copy(currentCameraTarget)
      }
    }

    // Auto-centering drift logic for Founders House
    if (this.enableAutoCentering) {
      this.updateAutoCentering()
    }

    // Animate floating particles with wind-like motion
    this.updateFloatingParticles(elapsed)

    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.setRenderTarget(null)
      this.renderer.render(this.scene, this.camera)
    }

    // Render sähkötalo on separate canvas (no greyscale)
    if (this.sahkotaloRenderer && this.sahkotaloScene) {
      this.sahkotaloRenderer.render(this.sahkotaloScene, this.camera)
    }
  }

  /**
   * Auto-centering drift: Smoothly adjusts camera to keep Founders House centered
   * This creates a subtle auto-correction effect when the user is idle
   */
  private updateAutoCentering(): void {
    if (!this.helsinkiModel) return // Don't run until model is loaded

    const screenPos = FOUNDERS_HOUSE_SCREEN_POS.clone()
    screenPos.project(this.camera)

    const viewportX = (screenPos.x + 1) * 50
    const viewportY = (1 - screenPos.y) * 50

    const centerX = 50
    const centerY = 65
    const distanceFromCenterX = Math.abs(viewportX - centerX)
    const distanceFromCenterY = Math.abs(viewportY - centerY)
    
    // Use radial distance for consistent fade-out in all directions
    const radialDistance = Math.sqrt(distanceFromCenterX * distanceFromCenterX + distanceFromCenterY * distanceFromCenterY)

    const threshold = 13
    const isInCenter = radialDistance <= threshold

    const now = Date.now()
    const timeSinceLastInteraction = now - this.lastInteractionTime
    const timeSinceLoad = now - this.initialLoadTime
    const idleThreshold = 3000
    const initialLoadDelay = 15000

    // CRITICAL: Allow immediate auto-centering if lastInteractionTime was reset (e.g., FH POI focus)
    const allowImmediateCenter = this.lastInteractionTime === 0

    // Check if Founders House is reasonably close to screen center
    // Use generous threshold when we're looking at Founders House area, regardless of exact camera position
    const isLookingAtFoundersHouse = radialDistance <= 30

    // CRITICAL: Keep hero text visible with generous threshold
    // More lenient when looking at Founders House area
    // BUT hide text completely when focused on other POIs (suppressAutoCentering indicates other POI focus)
    const effectiveThreshold = isLookingAtFoundersHouse ? 20 : (allowImmediateCenter ? 30 : threshold)
    const isEffectivelyInCenter = radialDistance <= effectiveThreshold

    // Hide hero text when viewing other POIs (when suppressAutoCentering is true, we're at Silo/Linear)
    // BUT show text when at Founders House initial position
    const opacity = (isEffectivelyInCenter && !this.suppressAutoCentering) || this.isAtFoundersHouseInitialPosition ? 1 : 0
    // Only call callback if opacity changed to avoid triggering React re-renders every frame
    if (this.onHeroTextOpacityChange && opacity !== this.lastHeroTextOpacity) {
      this.lastHeroTextOpacity = opacity
      this.onHeroTextOpacityChange(opacity)
    }

    // Suppress drift when at Founders House initial position OR when viewing other POIs
    if (this.suppressAutoCentering || this.isAtFoundersHouseInitialPosition) return

    // When immediate centering is allowed, don't require isInCenter check
    const shouldAutoCenter = allowImmediateCenter || (isInCenter && timeSinceLastInteraction >= idleThreshold && timeSinceLoad >= initialLoadDelay)

    if (shouldAutoCenter) {
      const offsetX = viewportX - centerX
      const offsetY = viewportY - centerY

      const maxSafeOffset = 20
      if ((Math.abs(offsetX) > 2 || Math.abs(offsetY) > 2) &&
          Math.abs(offsetX) < maxSafeOffset && Math.abs(offsetY) < maxSafeOffset) {
        if (this.controls && this.controls.target) {
          const currentTarget = this.controls.target.clone()

          const right = new THREE.Vector3()
          const worldUp = new THREE.Vector3(0, 1, 0)
          this.camera.getWorldDirection(right)
          right.crossVectors(worldUp, right).normalize()

          const cameraUp = new THREE.Vector3()
          cameraUp.crossVectors(right, this.camera.getWorldDirection(new THREE.Vector3())).normalize()

          const driftSpeed = 0.3
          const worldAdjustment = new THREE.Vector3()
          worldAdjustment.addScaledVector(right, -offsetX * driftSpeed)
          worldAdjustment.addScaledVector(cameraUp, offsetY * driftSpeed)
          // Prevent vertical drift that can tilt the camera down over time
          worldAdjustment.y = 0

          const newTarget = currentTarget.add(worldAdjustment)
          this.controls.setTarget(newTarget.x, newTarget.y, newTarget.z)

          // If we're in immediate center mode (lastInteractionTime === 0), reset it after first adjustment
          // This prevents infinite centering and allows normal idle threshold to apply
          if (allowImmediateCenter) {
            this.lastInteractionTime = now
          }
        }
      }
    }
  }

  /**
   * Animate floating particles with wind-like motion
   * Creates idle movement using sine waves for natural floating effect
   */
  private updateFloatingParticles(elapsed: number): void {
    if (!this.particles || this.particles.length === 0) return

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      const { mesh, swayPhase } = particle

      // Store original position on first update
      if (!mesh.userData.originalPosition) {
        mesh.userData.originalPosition = mesh.position.clone()
      }

      const originalPos = mesh.userData.originalPosition

      // Wind parameters - create natural, varied movement
      const windSpeed = 0.4 // Lower = slower movement
      const windStrengthX = 5.0 // Horizontal drift distance
      const windStrengthZ = 3.5 // Depth variation
      const verticalBob = 2.5 // Vertical bobbing distance
      
      // Use different frequencies for each axis to avoid synchronized movement
      const timeX = elapsed * windSpeed + swayPhase
      const timeY = elapsed * windSpeed * 0.7 + swayPhase * 1.3
      const timeZ = elapsed * windSpeed * 0.5 + swayPhase * 0.8

      // Apply sine wave motion on each axis
      const offsetX = Math.sin(timeX) * windStrengthX
      const offsetY = Math.sin(timeY) * verticalBob
      const offsetZ = Math.sin(timeZ) * windStrengthZ

      // Update position with floating motion
      mesh.position.x = originalPos.x + offsetX
      mesh.position.y = originalPos.y + offsetY
      mesh.position.z = originalPos.z + offsetZ

      // Subtle rotation for added realism
      mesh.rotation.z = Math.sin(timeX * 0.5) * 0.3
    }
  }

  public stopAutoTour(): void {
    this.autoTourManager.stop()
  }

  public dispose(): void {
    this.autoTourManager.dispose()
    this.poiHighlightManager.dispose()
    this.foundersHouseMarker.dispose()

    window.removeEventListener('resize', this.onWindowResize)
    this.removeInteractionListeners()
    if (this._cleanupClickHandler) {
      this._cleanupClickHandler()
      this._cleanupClickHandler = null
    }

    this.controls.dispose()
    this.renderer.dispose()
    this.renderTarget.dispose()
    this.perlinTexture.dispose()

    if (this.postProcessMaterial) {
      this.postProcessMaterial.dispose()
    }
    if (this.composer) {
      this.composer.dispose()
    }

    if (this.helsinkiModel) {
      this.scene.remove(this.helsinkiModel)
    }
    this.disposeFoundersHouseOverlay()

    // Dispose sähkötalo renderer
    if (this.sahkotaloRenderer) {
      this.sahkotaloRenderer.dispose()
      if (this.sahkotaloRenderer.domElement.parentNode) {
        this.sahkotaloRenderer.domElement.parentNode.removeChild(this.sahkotaloRenderer.domElement)
      }
      this.sahkotaloRenderer = null
    }
    this.sahkotaloScene = null

    this.container.removeChild(this.renderer.domElement)
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  public getModel(): THREE.Group | null {
    return this.helsinkiModel
  }

  private loadFoundersHouseOverlay(): void {
    if (!this.helsinkiModel) return

    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    dracoLoader.setDecoderConfig({ type: 'js' })
    loader.setDRACOLoader(dracoLoader)

    const modelPath = '/models/sahkotalo.glb'
    loader.load(
      encodeURI(modelPath),
      (gltf) => {
        if (!this.helsinkiModel) return

        const overlay = gltf.scene

        overlay.rotation.copy(this.helsinkiModel.rotation)
        overlay.position.copy(this.helsinkiModel.position)
        overlay.scale.copy(this.helsinkiModel.scale)
        overlay.position.y += 0.2
        overlay.updateMatrixWorld(true)

        const redMaterial = new THREE.MeshStandardMaterial({
          color: 0xF02820,
          emissive: 0xF02820,
          emissiveIntensity: 0.3,
          metalness: 0.99,
          roughness: 0.99,
          transparent: true,
          opacity: 0.9,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
          depthWrite: true,
          fog: true,
        })

        overlay.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const originalMaterial = child.material
            child.material = redMaterial
            if (Array.isArray(originalMaterial)) {
              originalMaterial.forEach((mat) => mat.dispose())
            } else {
              originalMaterial?.dispose()
            }
            child.renderOrder = 2
          }
        })

        this.foundersHouseOverlay = overlay
        this.foundersHouseOverlayMaterial = redMaterial
        // Add to separate scene so it renders without greyscale
        if (this.sahkotaloScene) {
          this.sahkotaloScene.add(overlay)
        }
      },
      undefined,
      () => {
        // Silent fail to avoid blocking scene if overlay can't load.
      }
    )
  }

  private disposeFoundersHouseOverlay(): void {
    if (this.foundersHouseOverlay) {
      if (this.sahkotaloScene) {
        this.sahkotaloScene.remove(this.foundersHouseOverlay)
      }
      this.foundersHouseOverlay.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
        }
      })
      this.foundersHouseOverlay = null
    }
    if (this.foundersHouseOverlayMaterial) {
      this.foundersHouseOverlayMaterial.dispose()
      this.foundersHouseOverlayMaterial = null
    }
  }

  public getControls(): any {
    return this.controls
  }

  public async enableAdvancedCamera(): Promise<boolean> {
    if (!this.controls) return false
    try {
      const ok = await this.controls.enableAdvanced()
      return !!ok
    } catch (e) {
      return false
    }
  }

  public setCameraConfig(config: CameraConfig): void {
    applyCameraConfig(this.camera, this.controls, config)
  }

  public applyCameraPreset(presetName: keyof typeof CAMERA_PRESETS): void {
    const preset = CAMERA_PRESETS[presetName]
    if (preset) {
      applyCameraConfig(this.camera, this.controls, preset)
    }
  }

  public getCameraConfig(): CameraConfig {
    return getCurrentCameraConfig(this.camera, this.controls)
  }

  public getPOIs(): typeof POINTS_OF_INTEREST {
    return POINTS_OF_INTEREST
  }

  public getCameraPresets(): typeof CAMERA_PRESETS {
    return CAMERA_PRESETS
  }

  public focusPOI(
    poiName: keyof typeof POINTS_OF_INTEREST,
    distance?: number,
    azimuth?: number,
    elevation?: number,
    duration: number = 2.5,
    animated: boolean = true,
    onComplete?: () => void,
    directZoom: boolean = false
  ): void {
    const poi = POINTS_OF_INTEREST[poiName]
    if (!poi) return

    // Suppress auto-centering when focusing nearby POIs to avoid recentering FH.
    // CRITICAL: For FOUNDERS_HOUSE, use special flag to show text but suppress drift
    // For SILO/LINEAR, suppress to hide text
    if (poiName === 'FOUNDERS_HOUSE') {
      this.suppressAutoCentering = false  // Don't suppress text visibility
      this.isAtFoundersHouseInitialPosition = true  // But suppress drift
      // Camera animation places it at exact initial position - no drift needed
    } else {
      this.suppressAutoCentering = poiName === 'SILO' || poiName === 'LINEAR'
      this.isAtFoundersHouseInitialPosition = false
    }

    // CRITICAL: Stop all camera momentum before starting POI animation
    // This prevents teleportation when clicking POI while camera is moving
    // Don't use syncInternalState() as it activates lookAt blend which causes snap
    this.controls.velocity.set(0, 0, 0)
    this.controls.rotationVelocity = 0
    this.controls.lookAtTargetBlend = 0
    this.controls.lookAtTargetBlendTimeout = 0

    const desiredDistance = distance ?? poi.cameraView?.distance ?? 300
    const desiredAzimuth = azimuth ?? poi.cameraView?.azimuth ?? 90
    const desiredElevation = elevation ?? poi.cameraView?.elevation ?? 40

    // Use requested values with reasonable bounds
    const finalDistance = Math.max(400, Math.min(900, desiredDistance))
    const finalAzimuth = desiredAzimuth
    const finalElevation = Math.max(20, Math.min(45, desiredElevation))

    if (animated) {
      this.poiHighlightManager.clearHighlights()

      if (this.poiAnimation && this.poiAnimation.isActive) {
        interruptSmoothPOIAnimation(this.poiAnimation)
      }

      const currentTarget = this.controls.target ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0)
      
      // SPECIAL CASE: Founders House returns to exact initial camera position
      // Use hardcoded initial position instead of calculating from polar coordinates
      let targetPosition = poi.worldCoords
      let endCameraPosition: THREE.Vector3 | null = null
      
      if (poiName === 'FOUNDERS_HOUSE') {
        targetPosition = { x: -152, y: 0, z: -810 } // Initial camera target
        endCameraPosition = new THREE.Vector3(292, 220, -173) // Initial camera position
      }
      
      const clampedPOITarget = this.clampPositionToBoundaries(targetPosition)

      if (directZoom) {
        const poiVec = new THREE.Vector3(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)
        const currentDistance = this.camera.position.distanceTo(poiVec)

        if (finalDistance < currentDistance) {
          const currentCameraPos = this.camera.position.clone()
          const directionFromPOI = new THREE.Vector3().subVectors(currentCameraPos, poiVec).normalize()
          const endCameraPosition = new THREE.Vector3().addVectors(
            poiVec,
            directionFromPOI.multiplyScalar(finalDistance)
          )

          this.poiAnimation = {
            isActive: true,
            startTime: performance.now() / 1000,
            duration,
            startCameraPosition: this.camera.position.clone(),
            startTargetPosition: currentTarget.clone(),
            endCameraPosition: endCameraPosition,
            endTargetPosition: poiVec,
            currentVelocity: new THREE.Vector3(),
            currentTargetVelocity: new THREE.Vector3(),
            onComplete: () => {
              this.poiHighlightManager.highlightPOI(poiName)
              this.controls.setTarget(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)
              this.controls.minDistance = 700
              if (this.controls.syncInternalState) {
                this.controls.syncInternalState()
              }
              if (onComplete) onComplete()
            },
            onInterrupt: () => {
              this.poiHighlightManager.clearHighlights()
            }
          }
          return
        }
      }
      
      // Create animation - use hardcoded position for Founders House, otherwise calculate
      if (endCameraPosition) {
        // Direct position specified (Founders House case)
        this.poiAnimation = {
          isActive: true,
          startTime: this.clock.getElapsedTime(),
          duration,
          startCameraPosition: this.camera.position.clone(),
          startTargetPosition: currentTarget.clone(),
          startCameraQuaternion: this.camera.quaternion.clone(),
          endCameraPosition: endCameraPosition,
          endTargetPosition: new THREE.Vector3(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z),
          currentVelocity: new THREE.Vector3(),
          currentTargetVelocity: new THREE.Vector3(),
          onComplete: () => {
            this.poiHighlightManager.highlightPOI(poiName)
            this.controls.setTarget(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)
            this.camera.lookAt(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)
            const currentDistance = this.camera.position.distanceTo(new THREE.Vector3(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z))
            this.controls.minDistance = currentDistance * 0.8
            this.controls.maxDistance = currentDistance * 1.5
            if (this.originalMinPolarAngle !== null && this.originalMaxPolarAngle !== null) {
              this.controls.minPolarAngle = this.originalMinPolarAngle
              this.controls.maxPolarAngle = this.originalMaxPolarAngle
            }
            if (this.controls.syncInternalState) {
              this.controls.syncInternalState()
            }
            if (onComplete) {
              onComplete()
            }
          },
          onInterrupt: () => {
            this.poiHighlightManager.clearHighlights()
          }
        }
        // Calculate end quaternion manually
        const tempCamera = this.camera.clone()
        tempCamera.position.copy(endCameraPosition)
        tempCamera.lookAt(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)
        this.poiAnimation.endCameraQuaternion = tempCamera.quaternion.clone()
      } else {
        // Standard POI animation using polar coordinates
        this.poiAnimation = createSmoothPOIAnimation(
          this.camera,
          currentTarget,
          clampedPOITarget,
          finalDistance,
          finalAzimuth,
          finalElevation,
          duration,
          () => {
            this.poiHighlightManager.highlightPOI(poiName)

            // CRITICAL FIX: Use setTarget() method to properly sync orbit controls
            // Then make camera look at target to prevent OrbitControls from recalculating
            this.controls.setTarget(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)
            this.camera.lookAt(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)

            // Set camera distance constraints to maintain zoom level after handoff
            const currentDistance = this.camera.position.distanceTo(new THREE.Vector3(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z))
            this.controls.minDistance = currentDistance * 0.8
            this.controls.maxDistance = currentDistance * 1.5

            // Restore original polar angle constraints
            if (this.originalMinPolarAngle !== null && this.originalMaxPolarAngle !== null) {
              this.controls.minPolarAngle = this.originalMinPolarAngle
              this.controls.maxPolarAngle = this.originalMaxPolarAngle
            }

            // Sync all internal state to current camera position
            if (this.controls.syncInternalState) {
              this.controls.syncInternalState()
            }

            if (onComplete) {
              onComplete()
            }
          },
          () => {
            this.poiHighlightManager.clearHighlights()
          },
          this.clock.getElapsedTime()
        )
      }
    } else {
      const config: CameraConfig = {
        targetX: poi.worldCoords.x,
        targetY: poi.worldCoords.y,
        targetZ: poi.worldCoords.z,
        polar: { distance: finalDistance, azimuth: finalAzimuth, elevation: finalElevation }
      }
      applyCameraConfig(this.camera, this.controls, config)

      if (onComplete) {
        onComplete()
      }
    }
  }

  public toggleDayNightMode(forceNightMode: boolean) {
    this.isNightMode = forceNightMode

    this.scene.background = this.isNightMode
      ? new THREE.Color(COLORS.night.sky)
      : new THREE.Color(COLORS.day.sky)

    updateFogColor(this.fog, this.isNightMode)

    this.scene.traverse((child) => {
      if (child instanceof THREE.PointLight) {
        child.visible = this.isNightMode
      }
      if (child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshBasicMaterial &&
          child.geometry instanceof THREE.SphereGeometry) {
        const sphere = child.geometry
        if (sphere.parameters && sphere.parameters.radius < 20) {
          child.visible = this.isNightMode
        }
      }
    })
  }

  public highlightPOI(poiName: keyof typeof POINTS_OF_INTEREST): void {
    this.poiHighlightManager.highlightPOI(poiName)
  }

  public clearHighlights(): void {
    this.poiHighlightManager.clearHighlights()
  }

  public getHighlightedPOI(): string | null {
    return this.poiHighlightManager.getHighlightedPOI()
  }

  public setParallaxEnabled(enabled: boolean): void {
    if (this.controls && typeof this.controls.setParallaxEnabled === 'function') {
      this.controls.setParallaxEnabled(enabled)
    }
  }

  public setAutoCenteringEnabled(enabled: boolean): void {
    this.enableAutoCentering = enabled
  }

  /**
   * Zoom directly into Founders House for "Learn More" transition
   * Always zooms to the same endpoint for consistency
   */
  public zoomToFoundersHouse(onComplete?: () => void): void {
    // Stop all momentum
    if (this.controls.syncInternalState) {
      this.controls.syncInternalState()
    }

    // Target: Founders House building
    const targetPos = new THREE.Vector3(30.77, -20.14, -533.42)

    // Camera end position: Respect controller height constraints to avoid a clamp snap
    const cameraEndPos = new THREE.Vector3(30.77, 210, -300)

    const startPos = this.camera.position.clone()
    const startTarget = this.controls.target ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0)

    // Create direct zoom animation
    // CRITICAL: Use this.clock.getElapsedTime() not performance.now() to match update loop
    this.poiAnimation = {
      isActive: true,
      startTime: this.clock.getElapsedTime(),
      duration: 1.2,
      startCameraPosition: startPos,
      startTargetPosition: startTarget,
      endCameraPosition: cameraEndPos,
      endTargetPosition: targetPos,
      currentVelocity: new THREE.Vector3(),
      currentTargetVelocity: new THREE.Vector3(),
      onComplete: () => {
        if (this.controls.setTarget) {
          this.controls.setTarget(targetPos.x, targetPos.y, targetPos.z)
        }
        if (this.controls.syncInternalState) {
          this.controls.syncInternalState()
        }
        if (onComplete) {
          onComplete()
        }
      },
      onInterrupt: () => {}
    }
  }

  private createFloatingParticles(): void {
    // Remove previous group if exists
    if (this.particleGroup) {
      this.scene.remove(this.particleGroup);
    }
    this.particleGroup = new THREE.Group();
    this.particles = [];
    // Get map center from helsinkiModel
    let centerX = 0, centerZ = 0;
    if (this.helsinkiModel) {
      const boundingBox = new THREE.Box3().setFromObject(this.helsinkiModel);
      centerX = (boundingBox.max.x + boundingBox.min.x) / 2;
      centerZ = (boundingBox.max.z + boundingBox.min.z) / 2;
      const mapWidth = boundingBox.max.x - boundingBox.min.x;
      const mapDepth = boundingBox.max.z - boundingBox.min.z;
      const mapHeight = boundingBox.max.y - boundingBox.min.y;
      // Calculate volume in cubic meters (assuming 1 unit = 1 meter)
      const volume = mapWidth * mapDepth * mapHeight;
      const density = 1 / 5; // 1 particle per 5 cubic meters
      // Mobile devices can't handle 1000 particles - drastically reduce for mobile
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
      const count = isMobile ? 150 : 1000; // 150 on mobile, 1000 on desktop
      // Set particle size to 1/2000th of map width
      const size = Math.min(mapWidth, mapDepth) / 2000;
      // console.log('Creating', count, 'particles at', centerX, centerZ, 'size', size);
      for (let i = 0; i < count; i++) {
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshBasicMaterial({
          color: 0xbababa,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        // Spread particles randomly within map bounds
        const x = centerX + (Math.random() - 0.5) * mapWidth;
        // Random y between original (50) and ceiling (150)
        const y = 50 + Math.random() * (300 - 50);
        const z = centerZ + (Math.random() - 0.5) * mapDepth;
        mesh.position.set(x, y, z);
        mesh.rotation.z = Math.random() * Math.PI;
        // Sway phase for side-to-side motion
        const swayPhase = Math.random() * Math.PI * 2;
        this.particles.push({ mesh, swayPhase });
        this.particleGroup.add(mesh);
      }
      this.scene.add(this.particleGroup);
      return;
    }
  }
}
