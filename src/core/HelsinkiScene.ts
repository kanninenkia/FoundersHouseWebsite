/**
 * Helsinki 3D Scene
 * Three.js scene setup with Helsinki GLB model and pencil shader effect
 * Based on Chartogne-Taillet visual style
 */
import * as THREE from 'three'
import HelsinkiCameraController from './HelsinkiCameraController'
import { loadDualModels } from '../loaders'
import { setupPostProcessing, setupComposer, setupSceneLighting } from '../rendering'
import { addCityLightsPoints, animateCityLights, removeCityLights, updateCityLightsFog, createStarfield, animateStars, setupSceneFog, updateFogColor, disposeCachedLightSprite } from '../effects'
import { createSmoothPOIAnimation, updateSmoothPOIAnimation, interruptSmoothPOIAnimation, type SmoothPOIAnimation } from '../animation'
import {
  PerlinNoiseGenerator,
  isNightInHelsinki,
  updateMaterialsInHierarchy,
  isLineSegmentsWithBasicMaterial,
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
import { COLORS, CITY_LIGHTS } from '../constants/designSystem'
import { POINTS_OF_INTEREST } from '../constants/poi'

export interface SceneConfig {
  container: HTMLElement
  helsinkiCenter: { lat: number; lng: number }
  radius: number // km
  isNightMode?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export class HelsinkiScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: HelsinkiCameraController
  private helsinkiModel: THREE.Group | null = null
  private fogTilesModel: THREE.Group | null = null
  private cityLights: THREE.Object3D | null = null
  private perlinTexture: THREE.DataTexture
  private postProcessMaterial: THREE.ShaderMaterial
  private composer: any | null = null
  private renderTarget: THREE.WebGLRenderTarget
  private clock: THREE.Clock
  private container: HTMLElement
  private stars: THREE.Group | THREE.Points | null = null
  private isNightMode: boolean
  private poiAnimation: SmoothPOIAnimation | null = null
  private fog: THREE.Fog | null = null

  // Managers
  private autoTourManager: AutoTourManager
  private poiHighlightManager: POIHighlightManager
  private foundersHouseMarker: FoundersHouseMarker

  // Cleanup functions
  private _cleanupClickHandler: (() => void) | null = null

  public revealProgress: number = 0
  public pencilStrength: number = 1.0

  constructor(config: SceneConfig) {
    this.container = config.container
    this.clock = new THREE.Clock()
    this.isNightMode = config.isNightMode !== undefined ? config.isNightMode : isNightInHelsinki()

    // Initialize scene
    this.scene = new THREE.Scene()
    this.scene.background = this.isNightMode
      ? new THREE.Color(COLORS.night.sky)
      : new THREE.Color(COLORS.day.sky)

    // Create camera using helper
    this.camera = createCamera()

    // Create renderer using helper
    this.renderer = createRenderer(config.container)

    // Setup controls
    this.controls = new HelsinkiCameraController(this.camera, this.renderer.domElement)
    configureCameraControls(this.controls)

    // Create render target using helper
    this.renderTarget = createRenderTarget()

    // Generate Perlin texture
    this.perlinTexture = this.generatePerlinTexture()

    // Setup post-processing
    const { material: ppMaterial } = setupPostProcessing(this.renderTarget, this.perlinTexture)
    this.postProcessMaterial = ppMaterial
    const composerResult = setupComposer(this.renderer, this.scene, this.camera, this.postProcessMaterial)
    this.composer = composerResult.composer

    setupSceneLighting(this.scene)

    // Setup fog
    this.fog = setupSceneFog(this.scene, this.isNightMode)

    // Add stars for night mode
    if (this.isNightMode) {
      this.stars = createStarfield()
      this.scene.add(this.stars)
    }

    // Initialize managers (model will be set after loading)
    this.poiHighlightManager = new POIHighlightManager(this.camera)

    this.autoTourManager = new AutoTourManager()

    this.foundersHouseMarker = new FoundersHouseMarker()

    // Setup interaction event listeners
    this.setupInteractionListeners()

    // Load models (main map + fog tiles)
    loadDualModels({
      mainMapPath: '/map.glb',
      fogTilesPath: '/fogtiles.glb',
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      isNightMode: this.isNightMode,
      onLoadProgress: config.onLoadProgress,
      onLoadComplete: config.onLoadComplete,
    }).then((result) => {
      this.helsinkiModel = result.mainMap
      this.fogTilesModel = result.fogTiles

      console.log('✓ Main map loaded')
      console.log('✓ Fog tiles loaded')

      // (Tram logic removed)
      this.poiHighlightManager.setModel(result.mainMap)
      this.foundersHouseMarker.setModel(result.mainMap, this.camera)

      if (this.isNightMode) {
        try {
          // MEMORY: Reduced from 800 -> 500 -> 400 for better memory usage
          // 400 lights = ~17 KB (positions + colors + flicker state)
          this.addCityLightsPoints(400)
        } catch (e) {
          // Failed to add city lights
        }
      }

  // (Tram logic removed)
    }).catch((error) => {
      console.error('Failed to load models:', error)
    })

    // Setup click handler for debugging (model accessed via getter closure)
    this._cleanupClickHandler = setupClickHandler(this.renderer, this.camera, () => this.helsinkiModel)

    // Setup window resize handler
    window.addEventListener('resize', this.onWindowResize)
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

  // Store event handler references for cleanup
  private _handlePointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return
    this.autoTourManager.recordInteraction()
  }

  private _handleTouchStart = () => {
    this.autoTourManager.recordInteraction()
  }

  private _handleWheel = () => {
    this.autoTourManager.recordInteraction()
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

    // Calculate bounding box of the model
    const boundingBox = new THREE.Box3().setFromObject(this.helsinkiModel)
    const min = boundingBox.min
    const max = boundingBox.max

    // Calculate approximate radius (largest horizontal extent)
    const sizeX = max.x - min.x
    const sizeZ = max.z - min.z
    const radius = Math.max(sizeX, sizeZ) / 2

    return { min, max, radius }
  }

  /**
   * Clamp a position to camera boundaries
   * Returns a new clamped position object
   */
  private clampPositionToBoundaries(position: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    if (!this.helsinkiModel) return position

    const bounds = this.getMapBounds()
    if (!bounds) return position

    // Define safe zone - allow camera all the way to edges (100% of map bounds)
    const safetyMargin = 1.0
    const maxX = bounds.max.x * safetyMargin
    const minX = bounds.min.x * safetyMargin
    const maxZ = bounds.max.z * safetyMargin
    const minZ = bounds.min.z * safetyMargin

    // Clamp position to boundaries
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

    // Define safe zone - allow camera all the way to edges (100% of map bounds)
    const safetyMargin = 1.0
    const maxX = bounds.max.x * safetyMargin
    const minX = bounds.min.x * safetyMargin
    const maxZ = bounds.max.z * safetyMargin
    const minZ = bounds.min.z * safetyMargin

    // Clamp camera target to boundaries
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

    // CRITICAL: Enforce camera height constraints (220-300)
    if (this.camera.position.y < 220) {
      this.camera.position.y = 220
      clamped = true
    }
    if (this.camera.position.y > 300) {
      this.camera.position.y = 300
      clamped = true
    }

    // Update controls target if clamped
    if (clamped) {
      this.controls.setTarget(cameraTarget.x, cameraTarget.y, cameraTarget.z)
    }
  }


  public update(): void {
    const elapsed = this.clock.getElapsedTime()
    const delta = this.clock.getDelta()

    // Enforce camera boundaries (keep camera within map bounds)
    this.enforceCameraBoundaries()

    // ==========================================
    // SMOOTH POI ANIMATION SYSTEM
    // ==========================================

    // Check for user interruption - this allows seamless handoff at ANY moment
    if (this.controls.isUserInteracting()) {
      const wasAnimating = (this.poiAnimation && this.poiAnimation.isActive) || this.autoTourManager.isWaiting()

      if (wasAnimating) {
        // Store velocity before interrupting (for smooth deceleration)
        const currentVelocity = this.poiAnimation?.currentVelocity?.clone() || new THREE.Vector3()

        // Interrupt animation smoothly
        if (this.poiAnimation && this.poiAnimation.isActive) {
          interruptSmoothPOIAnimation(this.poiAnimation)
          this.poiAnimation = null
        }

        // Stop auto-tour and clear highlights
        this.autoTourManager.setWaiting(false)
        this.autoTourManager.stop()
        this.poiHighlightManager.clearHighlights()

        // Calculate smooth handoff target based on current camera direction
        const currentTarget = this.controls.target || new THREE.Vector3(0, 0, 0)
        const currentDistance = this.camera.position.distanceTo(currentTarget)
        const direction = new THREE.Vector3()
        this.camera.getWorldDirection(direction)
        const newTarget = this.camera.position.clone().add(direction.multiplyScalar(currentDistance))
        newTarget.y = Math.max(newTarget.y, 10)

        // Hand off control to user with smooth deceleration
        this.controls.setTarget(newTarget.x, newTarget.y, newTarget.z)

        // Apply velocity for smooth slowdown (instead of instant stop)
        if (this.controls.applyHandoffVelocity && currentVelocity.length() > 0) {
          this.controls.applyHandoffVelocity(currentVelocity)
        }
      }

      this.controls.resetInteractionFlag()
      this.autoTourManager.recordInteraction()
    }

    // Update smooth POI animation if active
    let currentCameraTarget = this.controls.target || new THREE.Vector3(0, 0, 0)

    if (this.poiAnimation && this.poiAnimation.isActive) {
      const result = updateSmoothPOIAnimation(this.poiAnimation, this.camera, elapsed, delta)
      currentCameraTarget = result.currentTarget

      if (!result.stillAnimating) {
        this.poiAnimation = null
      }
    }

    // Update controls
    // During POI animation: DON'T call controls.update() to avoid fighting with animation
    // After POI animation: Resume normal controls
    const isPOIAnimating = this.poiAnimation && this.poiAnimation.isActive

    if (!isPOIAnimating) {
      // Normal controls operation
      this.controls.update(delta)
    } else {
      // During animation: sync controls target without updating (prevents fighting)
      if (this.controls.target) {
        this.controls.target.copy(currentCameraTarget)
      }
    }

    // Animate city lights
    if (this.cityLights) {
      animateCityLights(this.cityLights, elapsed)
      updateCityLightsFog(this.cityLights, this.scene)
    }

    if (this.stars) {
      animateStars(this.stars, elapsed)
    }

  // (Tram update removed)

    this.postProcessMaterial.uniforms.uTime.value = elapsed
    this.postProcessMaterial.uniforms.uPencilStrength.value = this.pencilStrength

    // Render scene with post-processing effects (warm tint, film grain, bloom, etc.)
    if (this.composer) {
      this.composer.render()
    } else {
      // Fallback if composer setup failed
      this.renderer.setRenderTarget(null)
      this.renderer.render(this.scene, this.camera)
    }
  }

  private flyToNextPOI(): void {
    if (!this.autoTourManager.enabled) {
      this.autoTourManager.setWaiting(false)
      return
    }

    if (this.autoTourManager.isComplete()) {
      this.autoTourManager.handleCompletion(() => this.flyToNextPOI())
      return
    }

    const poiName = this.autoTourManager.getNextPOI()
    if (!poiName) return

    this.focusPOI(poiName, undefined, undefined, undefined, 4.0, true, () => {
      this.autoTourManager.advance()

      if (this.autoTourManager.enabled && !this.autoTourManager.isComplete()) {
        this.autoTourManager.scheduleNext(() => this.flyToNextPOI(), 1500)
      } else if (this.autoTourManager.enabled) {
        this.autoTourManager.setWaiting(false)
        this.flyToNextPOI()
      }
    })
  }

  public stopAutoTour(): void {
    this.autoTourManager.stop()
  }

  public dispose(): void {
    this.autoTourManager.dispose()
    this.poiHighlightManager.dispose()
    this.foundersHouseMarker.dispose()

    // Remove all event listeners
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

    // Dispose post-processing
    if (this.postProcessMaterial) {
      this.postProcessMaterial.dispose()
    }
    if (this.composer) {
      this.composer.dispose()
    }

    // Dispose helsinki model and edge geometries/materials
    if (this.helsinkiModel) {
      // Dispose edge geometries and materials created in modelLoader
      const edgeGeometries = (this.helsinkiModel as any).__edgeGeometries as THREE.EdgesGeometry[] | undefined
      const edgeMaterials = (this.helsinkiModel as any).__edgeMaterials as THREE.LineBasicMaterial[] | undefined

      if (edgeGeometries) {
        edgeGeometries.forEach(geom => geom.dispose())
      }
      if (edgeMaterials) {
        edgeMaterials.forEach(mat => mat.dispose())
      }

      this.scene.remove(this.helsinkiModel)
    }

    // Dispose fog tiles
    if (this.fogTilesModel) {
      this.fogTilesModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      this.scene.remove(this.fogTilesModel)
      this.fogTilesModel = null
    }

    // Dispose stars
    if (this.stars) {
      this.stars.traverse((child) => {
        if (child instanceof THREE.Points || child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      this.scene.remove(this.stars)
      this.stars = null
    }

    this.removeCityLights()

    // MEMORY: Dispose cached light sprite texture
    disposeCachedLightSprite()

    this.container.removeChild(this.renderer.domElement)
  }

  // Getters
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

  public setPencilStrength(strength: number) {
    this.pencilStrength = Math.max(0, Math.min(1, strength))
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
    onComplete?: () => void
  ): void {
    const poi = POINTS_OF_INTEREST[poiName]
    if (!poi) return

    // HARDCODED: Oura POI endpoint (exact camera position)
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
          this.poiHighlightManager.highlightPOI(poiName, 200)
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

    // Get desired values from parameters or POI config
    const desiredDistance = distance ?? poi.cameraView?.distance ?? 300
    const desiredAzimuth = azimuth ?? poi.cameraView?.azimuth ?? 90
    const desiredElevation = elevation ?? poi.cameraView?.elevation ?? 40

    // Clamp distance to allow close POI views while preventing seeing model imperfections
    // Distance: Allow 200-900 range (closer than general camera restrictions for POI close-ups)
    const finalDistance = Math.max(200, Math.min(900, desiredDistance))
    // Azimuth: Allow full 360° rotation for POI viewing (no restriction)
    const finalAzimuth = desiredAzimuth
    // Elevation: Clamp to restriction range (8-15° range)
    const finalElevation = Math.max(8, Math.min(15, desiredElevation))

    if (animated) {
      // Clear existing highlights
      this.poiHighlightManager.clearHighlights()

      // Cancel any existing animation
      if (this.poiAnimation && this.poiAnimation.isActive) {
        interruptSmoothPOIAnimation(this.poiAnimation)
      }

      // Get current camera target
      const currentTarget = this.controls.target ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0)

      // Clamp POI target to camera boundaries to prevent snap-back
      const clampedPOITarget = this.clampPositionToBoundaries(poi.worldCoords)

      // Create smooth POI animation
      this.poiAnimation = createSmoothPOIAnimation(
        this.camera,
        currentTarget,
        clampedPOITarget,
        finalDistance,
        finalAzimuth,
        finalElevation,
        duration,
        () => {
          // On complete: highlight POI
          this.poiHighlightManager.highlightPOI(poiName, 200)

          // CRITICAL: Set controls to EXACT final position (prevents drift)
          // Use clamped target to stay within boundaries
          this.controls.setTarget(clampedPOITarget.x, clampedPOITarget.y, clampedPOITarget.z)

          // CRITICAL: Restore camera constraints after POI animation
          // Reset minDistance to respect camera constraints (700 minimum)
          this.controls.minDistance = 700

          // Sync all internal camera state to prevent any movement
          if (this.controls.syncInternalState) {
            this.controls.syncInternalState()
          }

          if (onComplete) {
            onComplete()
          }
        },
        () => {
          // On interrupt: clear highlights
          this.poiHighlightManager.clearHighlights()
        }
      )
    } else {
      // Instant teleport (no animation)
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

    this.postProcessMaterial.uniforms.uBottomFogColor.value.setHex(
      this.isNightMode ? COLORS.night.sky : COLORS.day.sky
    )

    if (this.helsinkiModel) {
      updateMaterialsInHierarchy(
        this.helsinkiModel,
        isLineSegmentsWithBasicMaterial,
        (lineSegments) => {
          if (this.isNightMode) {
            lineSegments.material.color.setHex(COLORS.night.wireframe)
            lineSegments.material.transparent = true
            lineSegments.material.opacity = COLORS.night.wireframeOpacity
          } else {
            lineSegments.material.color.setHex(COLORS.day.wireframe)
            lineSegments.material.transparent = true
            lineSegments.material.opacity = COLORS.day.wireframeOpacity
          }
          lineSegments.material.depthTest = true
          lineSegments.material.depthWrite = false
          lineSegments.material.needsUpdate = true
        }
      )
    }

    if (this.stars) {
      this.stars.visible = this.isNightMode
    } else if (this.isNightMode) {
      this.stars = createStarfield()
      this.scene.add(this.stars)
    }

    if (this.isNightMode) {
      if (!this.cityLights && this.helsinkiModel) {
        // MEMORY: Reduced from 1200 -> 600 -> 450 for better memory usage
        // 450 lights = ~19 KB (positions + colors + flicker state)
        this.addCityLightsPoints(450)
      }
      if (this.cityLights) {
        this.cityLights.visible = true
      }
    } else {
      if (this.cityLights) {
        this.cityLights.visible = false
      }
    }

    this.scene.traverse((child) => {
      if (child instanceof THREE.PointLight) {
        child.visible = this.isNightMode
      }
      if (child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshBasicMaterial &&
          child.geometry instanceof THREE.SphereGeometry) {
        const sphere = child.geometry
        // @ts-ignore
        if (sphere.parameters && sphere.parameters.radius < 20) {
          child.visible = this.isNightMode
        }
      }
    })
  }

  public removeCityLights() {
    if (!this.cityLights) return
    if (this.cityLights.parent) this.cityLights.parent.remove(this.cityLights)
    try {
      removeCityLights(this.cityLights)
    } catch (err) {
      // ignore
    }
    this.cityLights = null
  }

  public setCityLightsDensity(count: number) {
    this.addCityLightsPoints(Math.max(0, Math.floor(count)))
  }

  public setCityLightsEnabled(enabled: boolean) {
    if (this.cityLights) this.cityLights.visible = enabled
  }

  public addCityLightsPoints(count = 3000, color: number | string = CITY_LIGHTS.color) {
    if (!this.helsinkiModel) return
    this.removeCityLights()
    const group = addCityLightsPoints(this.helsinkiModel, count, color)
    if (group) this.cityLights = group as any
  }

  public highlightPOI(poiName: keyof typeof POINTS_OF_INTEREST, maxMeshes: number = 20): void {
    this.poiHighlightManager.highlightPOI(poiName, maxMeshes)
  }

  public clearHighlights(): void {
    this.poiHighlightManager.clearHighlights()
  }

  public getHighlightedPOI(): string | null {
    return this.poiHighlightManager.getHighlightedPOI()
  }

  /**
   * Enable or disable camera parallax effect
   */
  public setParallaxEnabled(enabled: boolean): void {
    if (this.controls && typeof this.controls.setParallaxEnabled === 'function') {
      this.controls.setParallaxEnabled(enabled)
    }
  }

  // (No-op: removed obsolete single-tram public API methods)
}
