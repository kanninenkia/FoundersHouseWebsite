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
import { createPOITransition, updatePOITransition, cancelPOITransition, type POITransitionState } from '../animation'
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
  private poiTransition: POITransitionState | null = null
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
   */
  private handleUserInterrupt(): void {
    const wasAnimating = this.interactionManager.handleAnimationInterrupt(
      null,
      this.poiTransition,
      this.autoTourManager.isWaiting(),
      () => this.poiHighlightManager.clearHighlights()
    )

    if (wasAnimating) {
      this.autoTourManager.stop()
      this.autoTourManager.startInactivityTimer(() => this.flyToNextPOI())
    }

    this.autoTourManager.recordInteraction()
    this.autoTourManager.startInactivityTimer(() => this.flyToNextPOI())
  }

  public update(): void {
    const elapsed = this.clock.getElapsedTime()
    const delta = this.clock.getDelta()

    // Check for user interruption during animations
    if (this.controls.isUserInteracting()) {
      const wasAnimating =
        (this.poiTransition && this.poiTransition.isAnimating) ||
        this.autoTourManager.isWaiting()

      if (wasAnimating) {
        if (this.poiTransition && this.poiTransition.isAnimating) {
          cancelPOITransition(this.poiTransition)
          this.poiTransition = null
        }

        this.autoTourManager.setWaiting(false)
        this.autoTourManager.stop()
        this.poiHighlightManager.clearHighlights()

        const currentTarget = this.controls.target || new THREE.Vector3(0, 0, 0)
        const currentDistance = this.camera.position.distanceTo(currentTarget)
        const direction = new THREE.Vector3()
        this.camera.getWorldDirection(direction)
        const newTarget = this.camera.position.clone().add(direction.multiplyScalar(currentDistance))
        newTarget.y = Math.max(newTarget.y, 10)

        this.controls.setTarget(newTarget.x, newTarget.y, newTarget.z)
      }

      this.controls.resetInteractionFlag()
      this.autoTourManager.recordInteraction()
      this.autoTourManager.startInactivityTimer(() => this.flyToNextPOI())
    }

    // Update POI transition animation
    if (this.poiTransition && this.poiTransition.isAnimating) {
      const stillAnimating = updatePOITransition(
        this.poiTransition,
        this.camera,
        this.controls,
        elapsed
      )

      if (!stillAnimating) {
        this.poiTransition = null
      }
    }

    // Determine if any animation is active
    const isPOITransitioning = this.poiTransition && this.poiTransition.isAnimating
    const isAnyAnimationActive = isPOITransitioning || this.autoTourManager.isWaiting()

    // Update controls - adjust damping during animations for smoother motion
    if (isAnyAnimationActive) {
      // Temporarily adjust damping factor during animations
      const originalDamping = this.controls.dampingFactor
      this.controls.dampingFactor = 0.02 // Lower damping during animations
      this.controls.update(delta)
      this.controls.dampingFactor = originalDamping
    } else {
      this.controls.update(delta)
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

    // Render scene
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)
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
    duration: number = 2.0,
    animated: boolean = true,
    onComplete?: () => void
  ): void {
    const poi = POINTS_OF_INTEREST[poiName]
    if (!poi) return

    const finalDistance = distance ?? poi.cameraView?.distance ?? 300
    const finalAzimuth = azimuth ?? poi.cameraView?.azimuth ?? 90
    const finalElevation = elevation ?? poi.cameraView?.elevation ?? 40

    if (animated) {
      this.poiHighlightManager.clearHighlights()

      if (this.poiTransition) {
        cancelPOITransition(this.poiTransition)
      }

      const currentTarget = this.controls.target ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0)
      const currentTime = this.clock.getElapsedTime()

      this.poiTransition = createPOITransition(
        this.camera,
        currentTarget,
        poi.worldCoords,
        finalDistance,
        finalAzimuth,
        finalElevation,
        duration,
        () => {
          this.poiHighlightManager.highlightPOI(poiName, 200)

          if (onComplete) {
            onComplete()
          }
        },
        currentTime
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

  // (No-op: removed obsolete single-tram public API methods)
}
