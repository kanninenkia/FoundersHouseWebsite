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
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: any
  isNightMode?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export interface DualLoadResult {
  mainMap: THREE.Group
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
        resolve(gltf.scene)
      },
      (xhr) => {
        if (onProgress && xhr.total) {
          onProgress(xhr.loaded, xhr.total)
        }
      },
      (error) => {
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

/**
 * Apply edge fade-out to map meshes
 * Creates smooth radial fade at the edges to prevent cliff-off
 */
function applyMapEdgeFade(model: THREE.Group): void {
  // Calculate bounding box to determine center and extent
  model.updateMatrixWorld(true)

  const bbox = new THREE.Box3().setFromObject(model)
  const center = bbox.getCenter(new THREE.Vector3())
  const size = bbox.getSize(new THREE.Vector3())
  const maxRadius = Math.max(size.x, size.z) * 0.5

  // Fade parameters - minimal fade at edges only
  const fadeStartDistance = maxRadius * 0.90  // Start fading at 90% from center
  const fadeEndDistance = maxRadius * 0.98    // Fully transparent at 98% (very close to edge)

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      
      materials.forEach((mat: any) => {
        if (mat) {
          // Store original values
          mat.userData = mat.userData || {}
          mat.userData.edgeFadeCenter = center.clone()
          mat.userData.edgeFadeStart = fadeStartDistance
          mat.userData.edgeFadeEnd = fadeEndDistance
          mat.userData.hasEdgeFade = true
          
          // Enable transparency for fade
          mat.transparent = true
          mat.depthWrite = true
          mat.needsUpdate = true
          
          // Use onBeforeCompile to inject fade shader code
          // Store reference to prevent multiple bindings
          if (!mat.userData.edgeFadeCompiled) {
            const originalOnBeforeCompile = mat.onBeforeCompile

            mat.onBeforeCompile = (shader: any) => {
              // Call original if it exists
              if (originalOnBeforeCompile && typeof originalOnBeforeCompile === 'function') {
                originalOnBeforeCompile.call(mat, shader)
              }

              // Skip if already modified
              if (shader.uniforms.fadeCenter) {
                return
              }

              try {
                // Add uniforms
                shader.uniforms.fadeCenter = { value: center.clone() }
                shader.uniforms.fadeStart = { value: fadeStartDistance }
                shader.uniforms.fadeEnd = { value: fadeEndDistance }

                // Modify vertex shader - add varying declaration and assignment
                shader.vertexShader = shader.vertexShader.replace(
                  '#include <common>',
                  `#include <common>\nvarying vec3 vWorldPosition;`
                )

                shader.vertexShader = shader.vertexShader.replace(
                  '#include <project_vertex>',
                  `#include <project_vertex>\nvWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
                )

                // Modify fragment shader - add varying and uniforms
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <common>',
                  `#include <common>\nvarying vec3 vWorldPosition;\nuniform vec3 fadeCenter;\nuniform float fadeStart;\nuniform float fadeEnd;`
                )

                // Apply fade effect
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <dithering_fragment>',
                  `#include <dithering_fragment>\nvec2 posXZ = vWorldPosition.xz;\nvec2 centerXZ = fadeCenter.xz;\nfloat dist = distance(posXZ, centerXZ);\nfloat fadeFactor = 1.0 - smoothstep(fadeStart, fadeEnd, dist);\ngl_FragColor.a *= fadeFactor;`
                )
              } catch (error) {
                // Shader modification error - silently continue
              }
            }

            // Provide unique cache key to prevent shader conflicts
            mat.customProgramCacheKey = () => {
              return `edgeFade_${mat.type}_${mat.uuid}`
            }

            mat.userData.edgeFadeCompiled = true
          }

          // Mark material as needing recompile
          mat.needsUpdate = true
        }
      })
    }
  })
}

/**
 * Process and position the main map model
 */
function processMainMap(
  model: THREE.Group,
  camera: THREE.PerspectiveCamera,
  isNightMode: boolean
): void {
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

  // Apply edge fade to prevent cliff-off at map edges
  applyMapEdgeFade(model)
}

/**
 * Load main map model
 */
export async function loadDualModels(params: DualLoadParams): Promise<DualLoadResult> {
  const {
    mainMapPath,
    scene,
    camera,
    isNightMode = false,
    onLoadProgress,
    onLoadComplete,
  } = params

  // Check if file exists
  const mainExists = await checkResourceExists(mainMapPath)

  if (!mainExists) {
    throw new Error(`Main map not found: ${mainMapPath}`)
  }

  // Setup GLTF loader with DRACO
  const loader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  dracoLoader.setDecoderConfig({ type: 'js' })
  loader.setDRACOLoader(dracoLoader)

  // Track loading progress
  let mainMapLoaded = 0
  let mainMapTotal = 0

  const updateProgress = () => {
    if (onLoadProgress && mainMapTotal > 0) {
      const progress = (mainMapLoaded / mainMapTotal) * 100
      onLoadProgress(progress)
    }
  }

  // Load main map
  try {
    const mainMapModel = await loadSingleGLB(mainMapPath, loader, (loaded, total) => {
      mainMapLoaded = loaded
      mainMapTotal = total
      updateProgress()
    })

    // Process main map (includes edge fade)
    processMainMap(mainMapModel, camera, isNightMode)

    // Add to scene
    scene.add(mainMapModel)

    if (onLoadComplete) {
      onLoadComplete()
    }

    return {
      mainMap: mainMapModel,
    }
  } catch (error) {
    throw error
  }
}
