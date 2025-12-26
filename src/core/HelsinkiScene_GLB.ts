/**
 * Helsinki 3D Scene - GLB Version (Refactored)
 * Three.js scene setup with Helsinki GLB model and pencil shader effect
 * Based on Chartogne-Taillet visual style
 */
import * as THREE from 'three'
import HelsinkiCameraController from './HelsinkiCameraController'
import { loadHelsinkiModel as loadModel, type RenderMode } from '../loaders'
import { setupPostProcessing, setupComposer, setupSceneLighting } from '../rendering'
import { addCityLightsPoints, animateCityLights, removeCityLights, updateCityLightsFog, createStarfield, animateStars, setupSceneFog, updateFogColor } from '../effects'
import { createPOITransition, updatePOITransition, cancelPOITransition, type POITransitionState, createSmoothPOIAnimation, updateSmoothPOIAnimation, interruptSmoothPOIAnimation, type SmoothPOIAnimation } from '../animation'
import { PerlinNoiseGenerator, isNightInHelsinki, updateMaterialsInHierarchy, isLineSegmentsWithBasicMaterial, applyCameraConfig, getCurrentCameraConfig, CAMERA_PRESETS, type CameraConfig, logDeviceInfo } from '../helpers'
import { createCamera, createRenderer, configureCameraControls, createRenderTarget, handleResize, setupClickHandler } from '../helpers'
import { AutoTourManager, POIHighlightManager, InteractionManager, FoundersHouseMarker } from './managers'
import { COLORS, CITY_LIGHTS } from '../constants/designSystem'
import { POINTS_OF_INTEREST } from '../constants/poi'

export interface SceneConfig {
  container: HTMLElement
  helsinkiCenter: { lat: number; lng: number }
  radius: number // km
  renderMode?: RenderMode
  isNightMode?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export class HelsinkiScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: any
  private helsinkiModel: THREE.Group | null = null
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
  private interactionManager: InteractionManager
  private foundersHouseMarker: FoundersHouseMarker


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

    this.interactionManager = new InteractionManager(
      this.renderer.domElement,
      this.camera,
      this.controls,
      {
        onInterrupt: () => this.handleUserInterrupt()
      }
    )

    this.foundersHouseMarker = new FoundersHouseMarker()



    logDeviceInfo()

    // Load model
    const modelPath = '/draft.glb'
    loadModel({
      modelPath: modelPath,
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      isNightMode: this.isNightMode,
      renderMode: config.renderMode || 'textured',
      onLoadProgress: config.onLoadProgress,
      onLoadComplete: config.onLoadComplete,
    }).then((model) => {
      this.helsinkiModel = model

      // (Tram logic removed)
      this.poiHighlightManager.setModel(model)
      this.foundersHouseMarker.setModel(model, this.camera)

      if (this.isNightMode) {
        try {
          this.addCityLightsPoints(800)
        } catch (e) {
          // Failed to add city lights
        }
      }

  // (Tram logic removed)
    }).catch(() => {
      // Helsinki model loading failed
    })

    // Setup click handler for debugging (model accessed via getter closure)
    setupClickHandler(this.renderer, this.camera, () => this.helsinkiModel)

    // Make scene available globally
    ;(window as any).helsinkiScene = this
    
    // (Tram debug controls removed)

    // Setup window resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this))
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

  private onWindowResize(): void {
    handleResize(
      this.camera,
      this.renderer,
      this.renderTarget,
      this.postProcessMaterial,
      this.composer
    )
  }

  /**
   * Handle user interruption of animations
   * NOTE: User interruption is now handled directly in the update() loop
   * This method is kept for compatibility but does minimal work
   */
  private handleUserInterrupt(): void {
    // User interruption is handled in update() loop now
    // This just records the interaction for auto-tour
    this.autoTourManager.recordInteraction()
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

    // Define safe zone - keep camera within 90% of map bounds (10% from edge)
    const safetyMargin = 0.90
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

    // Define safe zone - keep camera within 90% of map bounds (10% from edge)
    const safetyMargin = 0.90
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

    // Update controls target if clamped
    if (clamped) {
      this.controls.setTarget(cameraTarget.x, cameraTarget.y, cameraTarget.z)
    }
  }

  private updateDynamicFog(): void {
    if (!this.fog || !this.camera || !this.helsinkiModel) return

    const bounds = this.getMapBounds()
    if (!bounds) return

    // Get camera position (controls.target is the look-at point)
    const cameraTarget = this.controls.target || new THREE.Vector3(0, 0, 0)
    const camX = cameraTarget.x
    const camZ = cameraTarget.z

    // Use actual map radius from model bounds
    const mapRadius = bounds.radius
    const edgeThreshold = mapRadius * 0.7 // Start tightening fog at 70% of radius

    // Calculate distance from center
    const distFromCenter = Math.sqrt(camX * camX + camZ * camZ)

    // Calculate how close we are to the edge (0 = center, 1 = at edge)
    const edgeProximity = Math.max(0, (distFromCenter - edgeThreshold) / (mapRadius - edgeThreshold))

    // Dynamic fog values based on edge proximity
    const baseFogNear = 300
    const baseFogFar = 1200

    // When approaching edge, tighten fog dramatically
    // At edge: near and far converge to create thick fog wall
    const fogNear = baseFogNear - (edgeProximity * 250) // Tighten near fog
    const fogFar = baseFogFar - (edgeProximity * 600)   // Pull far fog closer

    // Apply to Three.js fog
    this.fog.near = Math.max(50, fogNear)
    this.fog.far = Math.max(fogNear + 100, fogFar) // Ensure far > near
  }

  public update(): void {
    const elapsed = this.clock.getElapsedTime()
    const delta = this.clock.getDelta()

    // Enforce camera boundaries (keep camera within map bounds)
    this.enforceCameraBoundaries()

    // Update dynamic fog based on camera position
    this.updateDynamicFog()

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
    this.interactionManager.dispose()

    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.controls.dispose()
    this.renderer.dispose()
    this.renderTarget.dispose()
    this.perlinTexture.dispose()

    if (this.helsinkiModel) {
      this.scene.remove(this.helsinkiModel)
    }

    this.removeCityLights()
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

    // Get desired values from parameters or POI config
    const desiredDistance = distance ?? poi.cameraView?.distance ?? 300
    const desiredAzimuth = azimuth ?? poi.cameraView?.azimuth ?? 90
    const desiredElevation = elevation ?? poi.cameraView?.elevation ?? 40

    // Clamp to safe ranges for POI viewing (more lenient than base camera restrictions)
    // Distance: Allow closer for POI close-ups, but not too close (200-900 range)
    const finalDistance = Math.max(200, Math.min(900, desiredDistance))
    // Azimuth: Allow full 360° rotation for POI viewing (no restriction)
    const finalAzimuth = desiredAzimuth
    // Elevation: Clamp to restriction range to prevent bird's eye view (8-15° range)
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

          // CRITICAL: Adjust minDistance to allow close POI views (prevents zoom-out on click)
          // Set minDistance to slightly below current distance to lock it in place
          this.controls.minDistance = Math.max(50, finalDistance * 0.9)

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
        this.addCityLightsPoints(1200)
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
