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
  renderer?: THREE.WebGLRenderer
}

export interface DualLoadResult {
  mainMap: THREE.Group
}

/**
 * Load a single GLB file with progress tracking
 * Uses idle callbacks to prevent blocking animations
 */
async function loadSingleGLB(
  path: string,
  loader: GLTFLoader,
  onProgress?: (loaded: number, total: number) => void
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    // Step 1: Load file data (this is async and won't block)
    fetch(path)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const total = parseInt(response.headers.get('content-length') || '0')
        let loaded = 0
        
        const reader = response.body?.getReader()
        const chunks: Uint8Array[] = []
        
        function read(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) return Promise.resolve()
            
            if (value) {
              loaded += value.length
              chunks.push(value)
              if (onProgress && total) {
                onProgress(loaded, total)
              }
            }
            
            // Use idle callback to read next chunk (won't block animations)
            return new Promise<void>((resolveRead) => {
              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                  read().then(resolveRead)
                }, { timeout: 50 })
              } else {
                setTimeout(() => {
                  read().then(resolveRead)
                }, 0)
              }
            })
          })
        }
        
        return read().then(() => {
          // Concatenate all chunks
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
          const arrayBuffer = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of chunks) {
            arrayBuffer.set(chunk, offset)
            offset += chunk.length
          }
          return arrayBuffer.buffer
        })
      })
      .then(arrayBuffer => {
        // Step 2: Parse GLB in idle callback (won't block animations)
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            loader.parse(
              arrayBuffer,
              '',
              (gltf) => {
                resolve(gltf.scene)
              },
              (error) => {
                reject(error)
              }
            )
          }, { timeout: 100 })
        } else {
          // Fallback: use setTimeout to yield control
          setTimeout(() => {
            loader.parse(
              arrayBuffer,
              '',
              (gltf) => {
                resolve(gltf.scene)
              },
              (error) => {
                reject(error)
              }
            )
          }, 0)
        }
      })
      .catch(error => {
        reject(error)
      })
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
  
  // Edge fade parameters - bring it in a bit more from the edge
  const fadeStartDistance = maxRadius * 0.94  // Start fading at 94% from center
  const fadeEndDistance = maxRadius * 0.98   // Fully transparent at 98%
  

  let processedMeshes = 0
  let skippedBuildings = 0
  let texturedMeshes = 0

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const box = new THREE.Box3().setFromObject(child)
      const meshSize = box.getSize(new THREE.Vector3())
      const isBuilding = meshSize.y > 10
      
      
      // DON'T skip buildings for now - apply to ALL meshes to test
      // if (isBuilding) {
      //   skippedBuildings++
      //   return
      // }
      
      if (isBuilding) {
        skippedBuildings++
      }
      
      // Apply to ALL meshes (for now, to debug)
      processedMeshes++
      
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      
      materials.forEach((mat: any) => {
        if (mat) {
          // Check if material has textures
          const hasTextures = !!(mat.map || mat.emissiveMap || mat.normalMap || mat.aoMap || mat.roughnessMap || mat.metalnessMap)
          if (hasTextures) {
            texturedMeshes++
          }
          
          // Store original values
          mat.userData = mat.userData || {}
          mat.userData.edgeFadeCenter = center.clone()
          mat.userData.edgeFadeStart = fadeStartDistance
          mat.userData.edgeFadeEnd = fadeEndDistance
          mat.userData.hasEdgeFade = true
          
          // Enable transparency for fade
          mat.transparent = true
          mat.depthWrite = true
          
          // Use onBeforeCompile to inject fade shader code
          if (!mat.userData.edgeFadeCompiled) {
            mat.onBeforeCompile = (shader: any) => {
              // Skip if already processed
              if (shader.uniforms.fadeCenter) {
                return
              }
              
              
              // Add uniforms
              shader.uniforms.fadeCenter = { value: center.clone() }
              shader.uniforms.fadeStart = { value: fadeStartDistance }
              shader.uniforms.fadeEnd = { value: fadeEndDistance }

              // Inject into vertex shader
              shader.vertexShader = `
varying vec3 vWorldPosition;
${shader.vertexShader}
`.replace(
                '#include <project_vertex>',
                `#include <project_vertex>
vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
              )

              // Inject into fragment shader with ULTRA SMOOTH fade curve
              shader.fragmentShader = `
varying vec3 vWorldPosition;
uniform vec3 fadeCenter;
uniform float fadeStart;
uniform float fadeEnd;
${shader.fragmentShader}
`.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
float dist = distance(vWorldPosition.xz, fadeCenter.xz);
// Ultra smooth fade with cubic easing
float fadeRange = fadeEnd - fadeStart;
float fadeProgress = clamp((dist - fadeStart) / fadeRange, 0.0, 1.0);
float fadeFactor = 1.0 - (fadeProgress * fadeProgress * fadeProgress); // cubic ease
gl_FragColor.a *= fadeFactor;`
              )
            }

            mat.userData.edgeFadeCompiled = true
          }

          // Force material update
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
  isNightMode: boolean,
  renderer?: THREE.WebGLRenderer,
  scene?: THREE.Scene
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

  // Pre-compile all shaders to prevent stuttering on first rotation (if renderer available)
  if (renderer && scene) {
    
    // Force immediate material updates before compilation
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat: any) => {
          if (mat) {
            mat.needsUpdate = true
          }
        })
      }
    })
    
    // Pre-compile with multiple camera angles
    preCompileShaders(camera, renderer, scene)
  }
}

/**
 * Pre-compile all shaders to prevent stuttering on first camera rotation
 * Force-render the scene from multiple angles to trigger all shader variants
 */
function preCompileShaders(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene
): void {
  // Store original camera settings
  const originalPosition = camera.position.clone()
  const originalRotation = camera.rotation.clone()
  
  // Save render target
  const currentRenderTarget = renderer.getRenderTarget()
  
  // Force geometry buffer uploads to GPU
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      // Force Three.js to upload geometry to GPU
      child.geometry.computeBoundingSphere()
      if (child.geometry.attributes.position) {
        child.geometry.attributes.position.needsUpdate = true
      }
    }
  })
  
  // Render from multiple angles to compile all shader variations
  const testPositions = [
    new THREE.Vector3(0, 250, 1000),
    new THREE.Vector3(1000, 250, 0),
    new THREE.Vector3(0, 250, -1000),
    new THREE.Vector3(-1000, 250, 0),
    new THREE.Vector3(707, 250, 707),
    new THREE.Vector3(-707, 250, 707),
  ]
  
  testPositions.forEach(pos => {
    camera.position.copy(pos)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld(true)
    renderer.render(scene, camera)
  })
  
  // Use Three.js's built-in compile method as well
  renderer.compile(scene, camera)
  
  // Restore original camera settings
  camera.position.copy(originalPosition)
  camera.rotation.copy(originalRotation)
  camera.updateMatrixWorld(true)
  
  // Restore render target
  renderer.setRenderTarget(currentRenderTarget)
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
    renderer,
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


    // Process main map (includes edge fade and shader pre-compilation)
    processMainMap(mainMapModel, camera, isNightMode, renderer, scene)

    // Debug main map position
    const mainBBox = new THREE.Box3().setFromObject(mainMapModel)

    // Add to scene
    scene.add(mainMapModel)

    // CRITICAL: Wait one frame before calling onLoadComplete
    // This ensures all WebGL resources are uploaded before the render loop starts
    requestAnimationFrame(() => {
      if (onLoadComplete) {
        onLoadComplete()
      }
    })

    return {
      mainMap: mainMapModel,
    }
  } catch (error) {
    throw error
  }
}
