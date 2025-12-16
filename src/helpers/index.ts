/**
 * Helpers Module
 * Utility functions: geometry operations, time utilities, procedural generation, camera utilities
 */

export {
  collectMeshes,
  computeMeshAreas,
  updateMaterialsInHierarchy,
  isLineSegmentsWithBasicMaterial
} from './geometryHelpers'

export {
  isNightInHelsinki
} from './timeUtils'

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
  logDeviceInfo
} from './deviceDetection'

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
