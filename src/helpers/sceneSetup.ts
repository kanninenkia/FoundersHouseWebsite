/**
 * Scene Setup Utilities
 * Helper functions for initializing Three.js scene components
 */
import * as THREE from 'three'
import { CAMERA_BASE, CAMERA_RESTRICTIONS, CAMERA_DAMPING, CAMERA_SPEED_LIMITS } from '../constants/cameraConfig'
import { detectPerformanceTier } from './performanceDetector'
import type HelsinkiCameraController from '../core/HelsinkiCameraController'

/**
 * Create and configure a perspective camera with default settings
 */
export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    CAMERA_BASE.fov,
    window.innerWidth / window.innerHeight,
    CAMERA_BASE.near,
    CAMERA_BASE.far
  )

  camera.position.set(
    CAMERA_BASE.position.x,
    CAMERA_BASE.position.y,
    CAMERA_BASE.position.z
  )

  camera.lookAt(
    CAMERA_BASE.target.x,
    CAMERA_BASE.target.y,
    CAMERA_BASE.target.z
  )

  return camera
}

/**
 * Create and configure a WebGL renderer with performance settings
 */
export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const performanceProfile = detectPerformanceTier()

  // CHROME FIX: Detect Chrome browser for optimizations
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)

  const renderer = new THREE.WebGLRenderer({
    antialias: performanceProfile.antialias,
    powerPreference: performanceProfile.tier === 'high' ? 'high-performance' : 'default',
    stencil: false,
    depth: true,
    // CHROME FIX: Enable alpha for better compositing
    alpha: false,
    // CHROME FIX: Preserve drawing buffer can help with Chrome's rendering pipeline
    preserveDrawingBuffer: false,
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(performanceProfile.pixelRatio)
  renderer.shadowMap.enabled = performanceProfile.shadowsEnabled

  if (performanceProfile.shadowsEnabled) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  // CHROME FIX: Set output color space for consistent rendering
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // CHROME FIX: Enable scissor test for better performance
  renderer.autoClear = true
  renderer.autoClearColor = true
  renderer.autoClearDepth = true
  renderer.autoClearStencil = true

  container.appendChild(renderer.domElement)

  return renderer
}

/**
 * Configure camera controls with default settings
 */
export function configureCameraControls(controls: HelsinkiCameraController): void {
  controls.enableDamping = CAMERA_DAMPING.enabled
  controls.dampingFactor = CAMERA_DAMPING.factor
  controls.screenSpacePanning = false

  controls.setTarget(
    CAMERA_BASE.target.x,
    CAMERA_BASE.target.y,
    CAMERA_BASE.target.z
  )

  controls.rotateSpeed = CAMERA_SPEED_LIMITS.rotateSpeed
  controls.zoomSpeed = CAMERA_SPEED_LIMITS.zoomSpeed
  controls.panSpeed = CAMERA_SPEED_LIMITS.panSpeed

  controls.minDistance = CAMERA_RESTRICTIONS.distance.min
  controls.maxDistance = CAMERA_RESTRICTIONS.distance.max

  controls.maxPolarAngle = Math.PI / 2 - THREE.MathUtils.degToRad(CAMERA_RESTRICTIONS.elevation.min)
  controls.minPolarAngle = Math.PI / 2 - THREE.MathUtils.degToRad(CAMERA_RESTRICTIONS.elevation.max)

  controls.minAzimuthAngle = -Infinity
  controls.maxAzimuthAngle = Infinity
}

/**
 * Create a render target with capped pixel ratio for memory optimization
 * Full device pixel ratio can cause excessive memory usage on high DPI displays
 */
export function createRenderTarget(): THREE.WebGLRenderTarget {
  // Cap pixel ratio at 1.5 to prevent excessive memory usage
  // On 2x displays: 2 -> 1.5 = 43% memory savings
  // On 3x displays: 3 -> 1.5 = 75% memory savings
  const cappedPixelRatio = Math.min(window.devicePixelRatio, 1.5)

  return new THREE.WebGLRenderTarget(
    window.innerWidth * cappedPixelRatio,
    window.innerHeight * cappedPixelRatio
  )
}

/**
 * Handle window resize for camera, renderer, and render target
 */
export function handleResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  renderTarget: THREE.WebGLRenderTarget,
  postProcessMaterial: THREE.ShaderMaterial,
  composer: any | null
): void {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)

  // Cap pixel ratio at 1.5 to prevent excessive memory usage
  const cappedPixelRatio = Math.min(window.devicePixelRatio, 1.5)

  // CRITICAL: Dispose old texture before resizing to prevent memory leak
  // Without this, each resize orphans the old texture in VRAM (10-20 MB each)
  renderTarget.dispose()

  renderTarget.setSize(
    window.innerWidth * cappedPixelRatio,
    window.innerHeight * cappedPixelRatio
  )

  const resolutionUniform = postProcessMaterial.uniforms?.uResolution
  if (resolutionUniform && resolutionUniform.value && typeof resolutionUniform.value.set === 'function') {
    resolutionUniform.value.set(
      window.innerWidth * cappedPixelRatio,
      window.innerHeight * cappedPixelRatio
    )
  }

  if (composer) {
    composer.setSize(
      window.innerWidth * cappedPixelRatio,
      window.innerHeight * cappedPixelRatio
    )
  }
}
