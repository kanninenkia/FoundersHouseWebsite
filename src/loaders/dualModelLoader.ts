/**
 * Dual Model Loader
 * Loads main map and fog tiles simultaneously with combined progress
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { COLORS } from '../constants/designSystem'

export interface DualLoadParams {
  mainMapPath: string
  fogTilesPath: string
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: any
  isNightMode?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export interface DualLoadResult {
  mainMap: THREE.Group
  fogTiles: THREE.Group
}

/**
 * Load a single GLB file with progress tracking
 */
async function loadSingleGLB(
  path: string,
  loader: GLTFLoader,
  onProgress?: (loaded: number, total: number) => void
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        console.log(`✓ Loaded: ${path}`)
        resolve(gltf.scene)
      },
      (xhr) => {
        if (onProgress && xhr.total) {
          onProgress(xhr.loaded, xhr.total)
        }
      },
      (error) => {
        console.error(`✗ Failed to load: ${path}`, error)
        reject(error)
      }
    )
  })
}

/**
 * Check if a resource exists via HEAD request
 */
async function checkResourceExists(url: string, timeoutMs = 8000): Promise<boolean> {
  if (typeof fetch === 'undefined') return true
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(id)
    return res.ok
  } catch (e) {
    clearTimeout(id)
    return false
  }
}

// Fog material application removed - loading raw fog tiles only

/**
 * Process and position the main map model
 */
function processMainMap(
  model: THREE.Group,
  camera: THREE.PerspectiveCamera,
  isNightMode: boolean
): void {
  console.log('Processing main map...')

  const edgeGeometries: THREE.EdgesGeometry[] = []
  const edgeMaterials: THREE.LineBasicMaterial[] = []

  // Apply building treatments (same as original loader)
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const box = new THREE.Box3().setFromObject(child)
      const size = box.getSize(new THREE.Vector3())
      const isBuilding = size.y > 10

      const buildingOpacity = 0.98

      if (isBuilding) {
        try {
          const mat = (child as any).material
          if (Array.isArray(mat)) {
            mat.forEach((m: any) => {
              if (m) {
                m.transparent = true
                m.opacity = buildingOpacity
                m.depthWrite = true
              }
            })
          } else if (mat) {
            mat.transparent = true
            mat.opacity = buildingOpacity
            mat.depthWrite = true
          }
        } catch (e) {
          // Non-fatal
        }

        // Add edge lines to buildings
        const edges = new THREE.EdgesGeometry(child.geometry, 15)
        const lineMaterial = new THREE.LineBasicMaterial({
          color: isNightMode ? COLORS.night.wireframe : COLORS.day.wireframe,
          transparent: true,
          opacity: isNightMode ? COLORS.night.wireframeOpacity : COLORS.day.wireframeOpacity,
          linewidth: 1,
          depthTest: true,
          depthWrite: false,
        })
        ;(lineMaterial as any).polygonOffset = true
        ;(lineMaterial as any).polygonOffsetFactor = 1
        ;(lineMaterial as any).polygonOffsetUnits = 1

        const lineSegments = new THREE.LineSegments(edges, lineMaterial)
        lineSegments.frustumCulled = false

        edgeGeometries.push(edges)
        edgeMaterials.push(lineMaterial)

        if (child.parent) {
          child.parent.add(lineSegments)
        }
      }
    }
  })

  // Store for cleanup
  ;(model as any).__edgeGeometries = edgeGeometries
  ;(model as any).__edgeMaterials = edgeMaterials

  // Position model
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())

  if (!isFinite(size.x) || !isFinite(size.y) || !isFinite(size.z) || size.x === 0 || size.y === 0 || size.z === 0) {
    camera.position.set(0, 2000, 5000)
    camera.lookAt(0, 0, 0)
  } else {
    model.rotation.x = -Math.PI / 2
    model.scale.set(1, 1, 1)
    model.updateMatrixWorld(true)
    const rotatedBox = new THREE.Box3().setFromObject(model)
    const rotatedCenter = rotatedBox.getCenter(new THREE.Vector3())

    model.position.set(-rotatedCenter.x, -rotatedCenter.y, -rotatedCenter.z)
  }

  console.log('Main map processed')
}

// Fog tiles processing removed - loading raw fog tiles only

/**
 * Load main map and fog tiles simultaneously
 */
export async function loadDualModels(params: DualLoadParams): Promise<DualLoadResult> {
  const {
    mainMapPath,
    fogTilesPath,
    scene,
    camera,
    isNightMode = false,
    onLoadProgress,
    onLoadComplete,
  } = params

  console.log('Starting dual model loading...')
  console.log(`Main map: ${mainMapPath}`)
  console.log(`Fog tiles: ${fogTilesPath}`)

  // Check if files exist
  console.log('Checking if resources exist...')
  const [mainExists, fogExists] = await Promise.all([
    checkResourceExists(mainMapPath),
    checkResourceExists(fogTilesPath),
  ])

  console.log(`Main map exists: ${mainExists}`)
  console.log(`Fog tiles exist: ${fogExists}`)

  if (!mainExists) {
    throw new Error(`Main map not found: ${mainMapPath}`)
  }
  if (!fogExists) {
    console.warn(`Fog tiles not found: ${fogTilesPath}, continuing without fog tiles...`)
  } else {
    console.log('Fog tiles found, will load them...')
  }

  // Setup GLTF loader with DRACO
  const loader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  dracoLoader.setDecoderConfig({ type: 'js' })
  loader.setDRACOLoader(dracoLoader)

  // Track loading progress for both files
  let mainMapLoaded = 0
  let mainMapTotal = 0
  let fogTilesLoaded = 0
  let fogTilesTotal = 0

  const updateCombinedProgress = () => {
    if (onLoadProgress) {
      const totalLoaded = mainMapLoaded + fogTilesLoaded
      const totalSize = mainMapTotal + fogTilesTotal

      if (totalSize > 0) {
        const progress = (totalLoaded / totalSize) * 100
        onLoadProgress(progress)
      }
    }
  }

  // Load both files in parallel
  const loadPromises: Promise<THREE.Group>[] = [
    loadSingleGLB(mainMapPath, loader, (loaded, total) => {
      mainMapLoaded = loaded
      mainMapTotal = total
      updateCombinedProgress()
    }),
  ]

  // Only load fog tiles if they exist
  if (fogExists) {
    loadPromises.push(
      loadSingleGLB(fogTilesPath, loader, (loaded, total) => {
        fogTilesLoaded = loaded
        fogTilesTotal = total
        updateCombinedProgress()
      })
    )
  }

  try {
    const results = await Promise.all(loadPromises)
    const mainMapModel = results[0]
    const fogTilesModel = fogExists ? results[1] : new THREE.Group()

    console.log(`Loaded ${results.length} model(s) successfully!`)
    console.log(`Main map model has ${mainMapModel.children.length} children`)
    if (fogExists) {
      console.log(`Fog tiles model has ${fogTilesModel.children.length} children`)
    }

    // Process main map
    processMainMap(mainMapModel, camera, isNightMode)

    // Debug main map position first
    console.log('=== MAIN MAP DEBUG ===')
    const mainBBox = new THREE.Box3().setFromObject(mainMapModel)
    console.log(`Main map BBox min: (${mainBBox.min.x.toFixed(1)}, ${mainBBox.min.y.toFixed(1)}, ${mainBBox.min.z.toFixed(1)})`)
    console.log(`Main map BBox max: (${mainBBox.max.x.toFixed(1)}, ${mainBBox.max.y.toFixed(1)}, ${mainBBox.max.z.toFixed(1)})`)
    console.log(`Main map position: (${mainMapModel.position.x}, ${mainMapModel.position.y}, ${mainMapModel.position.z})`)
    console.log(`Main map rotation: (${mainMapModel.rotation.x}, ${mainMapModel.rotation.y}, ${mainMapModel.rotation.z})`)

    // Add both to scene
    scene.add(mainMapModel)
    if (fogExists && fogTilesModel) {
      // Match fog tiles position and rotation to main map
      fogTilesModel.position.copy(mainMapModel.position)
      fogTilesModel.rotation.copy(mainMapModel.rotation)
      fogTilesModel.scale.copy(mainMapModel.scale)

      console.log('=== FOG TILES ===')
      console.log('Matched position/rotation/scale to main map')
      console.log(`Position: (${fogTilesModel.position.x.toFixed(1)}, ${fogTilesModel.position.y.toFixed(1)}, ${fogTilesModel.position.z.toFixed(1)})`)
      console.log(`Rotation: (${fogTilesModel.rotation.x.toFixed(2)}, ${fogTilesModel.rotation.y.toFixed(2)}, ${fogTilesModel.rotation.z.toFixed(2)})`)
      console.log('NO MATERIAL CHANGES - using original materials from GLB')

      scene.add(fogTilesModel)
      console.log('✓ Fog tiles added to scene')
    }

    if (onLoadComplete) {
      onLoadComplete()
    }

    return {
      mainMap: mainMapModel,
      fogTiles: fogTilesModel,
    }
  } catch (error) {
    console.error('Error loading models:', error)
    throw error
  }
}
