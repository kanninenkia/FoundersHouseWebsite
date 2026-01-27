/**
 * Helsinki 3D Scene
 * Three.js scene setup with Helsinki GLB model (baked textures) and post-processing effects
 */
import * as THREE from 'three'
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
  private _cleanupClickHandler: (() => void) | null = null
  private enableAutoCentering: boolean = false
  private onHeroTextOpacityChange?: (opacity: number) => void
  private lastInteractionTime: number = Date.now()
  private initialLoadTime: number = Date.now()
  private lastHeroTextOpacity: number = -1
  private suppressAutoCentering: boolean = false
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
      mainMapPath: '/assets/models/fh.glb',
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      isNightMode: this.isNightMode,
      onLoadProgress: config.onLoadProgress,
      onLoadComplete: config.onLoadComplete,
      renderer: this.renderer,
    }).then((result) => {
      this.helsinkiModel = result.mainMap
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

    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.setRenderTarget(null)
      this.renderer.render(this.scene, this.camera)
    }
  }

  /**
   * Auto-centering drift: Smoothly adjusts camera to keep Founders House centered
   * This creates a subtle auto-correction effect when the user is idle
   */
  private updateAutoCentering(): void {
    if (!this.helsinkiModel || this.suppressAutoCentering) return // Don't run until model is loaded

    const screenPos = FOUNDERS_HOUSE_SCREEN_POS.clone()
    screenPos.project(this.camera)

    const viewportX = (screenPos.x + 1) * 50
    const viewportY = (1 - screenPos.y) * 50

    const centerX = 50
    const centerY = 65
    const distanceFromCenterX = Math.abs(viewportX - centerX)
    const distanceFromCenterY = Math.abs(viewportY - centerY)

    const threshold = 13
    const isInCenter = distanceFromCenterX <= threshold && distanceFromCenterY <= threshold

    const opacity = isInCenter ? 1 : 0
    // Only call callback if opacity changed to avoid triggering React re-renders every frame
    if (this.onHeroTextOpacityChange && opacity !== this.lastHeroTextOpacity) {
      this.lastHeroTextOpacity = opacity
      this.onHeroTextOpacityChange(opacity)
    }

    const now = Date.now()
    const timeSinceLastInteraction = now - this.lastInteractionTime
    const timeSinceLoad = now - this.initialLoadTime
    const idleThreshold = 3000
    const initialLoadDelay = 15000

    if (isInCenter && timeSinceLastInteraction >= idleThreshold && timeSinceLoad >= initialLoadDelay) {
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

          const newTarget = currentTarget.add(worldAdjustment)
          this.controls.setTarget(newTarget.x, newTarget.y, newTarget.z)
        }
      }
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
    this.suppressAutoCentering = poiName === 'SILO' || poiName === 'LINEAR'

    // CRITICAL: Stop all camera momentum before starting POI animation
    // This prevents teleportation when clicking "Learn More" while camera is moving
    if (this.controls.syncInternalState) {
      this.controls.syncInternalState()
    }

    if (poiName === 'OURA' && animated) {
      this.poiHighlightManager.clearHighlights()

      if (this.poiAnimation && this.poiAnimation.isActive) {
        interruptSmoothPOIAnimation(this.poiAnimation)
      }

      const currentTarget = this.controls.target ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0)
      const hardcodedCameraPos = new THREE.Vector3(831, 149, -215)
      const hardcodedTarget = new THREE.Vector3(781, -49, -911)

      this.poiAnimation = {
        isActive: true,
        startTime: performance.now() / 1000,
        duration,
        startCameraPosition: this.camera.position.clone(),
        startTargetPosition: currentTarget.clone(),
        endCameraPosition: hardcodedCameraPos,
        endTargetPosition: hardcodedTarget,
        currentVelocity: new THREE.Vector3(),
        currentTargetVelocity: new THREE.Vector3(),
        onComplete: () => {
          this.poiHighlightManager.highlightPOI(poiName)
          this.controls.setTarget(hardcodedTarget.x, hardcodedTarget.y, hardcodedTarget.z)
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
      const clampedPOITarget = this.clampPositionToBoundaries(poi.worldCoords)

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
}
