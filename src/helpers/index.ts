/**
 * Helpers Module
 * Utility functions: geometry operations, time utilities, procedural generation, camera utilities
 */

export {
  collectMeshes,
  computeMeshAreas
} from './geometryHelpers'


export {
  PerlinNoiseGenerator
} from './perlinNoise'

export {
  type CameraConfig,
  CAMERA_PRESETS,
  applyCameraConfig,
  getCurrentCameraConfig
} from './cameraUtils'

export {
  detectPerformanceTier
} from './performanceDetector'

export {
  setupClickHandler
} from './clickHandlers'

export {
  createCamera,
  createRenderer,
  configureCameraControls,
  createRenderTarget,
  handleResize
} from './sceneSetup'

export {
  type CookieCategory,
  type CookiePreferences,
  getCookiePreferences,
  saveCookiePreferences,
  hasConsented,
  acceptAllCookies,
  rejectAllCookies,
  applyCookiePreferences,
  clearCookiePreferences,
  isCategoryEnabled,
  initializeCookieManager
} from './cookieManager'
