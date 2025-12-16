/**
 * Model Loader
 * Responsible for loading the Helsinki GLB and positioning it in the scene.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { COLORS } from '../constants/designSystem'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export type RenderMode = 'wireframe' | 'textured' | 'textured-red' | 'no-texture-red' | 'faint-buildings'

export interface LoadParams {
  modelPath: string
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: any
  isNightMode?: boolean
  renderMode?: RenderMode
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export async function loadHelsinkiModel(params: LoadParams): Promise<THREE.Group | null> {
  const { modelPath, scene, camera, controls, isNightMode = false, renderMode = 'textured', onLoadProgress, onLoadComplete } = params
  // Quick existence check: try a HEAD request with timeout to fail fast if the GLB isn't available
  const checkResourceExists = async (url: string, timeoutMs = 8000): Promise<boolean> => {
    if (typeof fetch === 'undefined') return true // runtime doesn't support fetch (unlikely in browser)
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

  return new Promise(async (resolve, reject) => {
    const exists = await checkResourceExists(modelPath)
    if (!exists) {
      const err = new Error(`Model not found or unreachable at path: ${modelPath}`)
      reject(err)
      return
    }
    const loader = new GLTFLoader()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    dracoLoader.setDecoderConfig({ type: 'js' })
    loader.setDRACOLoader(dracoLoader)

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene

        // Apply rendering mode
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            // Detect if this mesh is a building (heuristic: vertical meshes or named objects)
            // Buildings typically have height (Y-axis in rotated model)
            const box = new THREE.Box3().setFromObject(child)
            const size = box.getSize(new THREE.Vector3())
            const isBuilding = size.y > 10 // Buildings have vertical height > 10 units

            const isRedMode = renderMode === 'textured-red' || renderMode === 'no-texture-red'
            const buildingOpacity = isRedMode ? 0.98 : 0.98 // 65% opacity

            if (renderMode === 'wireframe') {
              // Wireframe mode - buildings with heavily reduced edge lines only
              if (isBuilding) {
                // Make building surfaces invisible/very faint
                try {
                  const mat = (child as any).material
                  if (Array.isArray(mat)) {
                    mat.forEach((m: any) => {
                      if (m) {
                        m.transparent = true
                        m.opacity = 0.05 // Almost invisible
                        m.depthWrite = true
                      }
                    })
                  } else if (mat) {
                    mat.transparent = true
                    mat.opacity = 0.05 // Almost invisible
                    mat.depthWrite = true
                  }
                } catch (e) {
                  // Non-fatal
                }

                // Add heavily reduced edge lines (very high threshold = very few lines)
                const edges = new THREE.EdgesGeometry(child.geometry, 45) // Very high threshold for minimal lines
                const lineMaterial = new THREE.LineBasicMaterial({
                  color: isNightMode ? COLORS.night.wireframe : COLORS.day.wireframe,
                  transparent: false,
                  opacity: 1.0,
                  linewidth: 1,
                  depthTest: true,
                  depthWrite: false,
                })
                ;(lineMaterial as any).polygonOffset = true
                ;(lineMaterial as any).polygonOffsetFactor = 1
                ;(lineMaterial as any).polygonOffsetUnits = 1

                const lineSegments = new THREE.LineSegments(edges, lineMaterial)
                lineSegments.frustumCulled = false
                if (child.parent) {
                  child.parent.add(lineSegments)
                }
              }
              // Non-buildings keep original materials
            } else if (renderMode === 'faint-buildings') {
              // Faint buildings mode - buildings with reduced edge lines
              if (isBuilding) {
                // Use original material but make it subtle
                try {
                  const mat = (child as any).material
                  if (Array.isArray(mat)) {
                    mat.forEach((m: any) => {
                      if (m) {
                        m.transparent = true
                        m.opacity = 0.1 // Very faint buildings
                        m.depthWrite = true
                      }
                    })
                  } else if (mat) {
                    mat.transparent = true
                    mat.opacity = 0.1 // Very faint buildings
                    mat.depthWrite = true
                  }
                } catch (e) {
                  // Non-fatal
                }

                // Add heavily reduced edge lines (very high threshold = very few lines)
                const edges = new THREE.EdgesGeometry(child.geometry, 45) // Very high threshold for minimal lines
                const lineMaterial = new THREE.LineBasicMaterial({
                  color: isNightMode ? COLORS.night.wireframe : COLORS.day.wireframe,
                  transparent: false,
                  opacity: 1.0,
                  linewidth: 1,
                  depthTest: true,
                  depthWrite: false,
                })
                ;(lineMaterial as any).polygonOffset = true
                ;(lineMaterial as any).polygonOffsetFactor = 1
                ;(lineMaterial as any).polygonOffsetUnits = 1

                const lineSegments = new THREE.LineSegments(edges, lineMaterial)
                lineSegments.frustumCulled = false
                if (child.parent) {
                  child.parent.add(lineSegments)
                }
              }
              // Non-buildings keep original materials
            } else if (renderMode === 'no-texture-red') {
              // No texture mode - apply to buildings only
              if (isBuilding) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffffff, // White so CSS filter can tint it
                  transparent: true,
                  opacity: buildingOpacity,
                  depthWrite: true,
                  roughness: 0.8,
                  metalness: 0.2,
                })
                child.visible = true
                child.frustumCulled = false

                // Add edge lines to buildings
                const edges = new THREE.EdgesGeometry(child.geometry, 15)
                const lineMaterial = new THREE.LineBasicMaterial({
                  color: isNightMode ? COLORS.night.wireframe : COLORS.day.wireframe,
                  transparent: false,
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
                if (child.parent) {
                  child.parent.add(lineSegments)
                }
              }
              // Non-buildings keep original materials
            } else {
              // Textured modes (textured or textured-red)
              // Apply transparency/opacity only to buildings
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
                if (child.parent) {
                  child.parent.add(lineSegments)
                }
              }
              // Non-buildings keep their original materials untouched
            }
          }
        })

        // Compute bounding box and position model
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

          // Set camera to specific view configuration
          camera.position.set(386.81, 160.28, -272.85)
          controls.target.set(-209.85, 0.00, -866.04)
          camera.lookAt(-209.85, 0.00, -866.04)
        }

        scene.add(model)

        // Defer city light placement to the caller after the model is assigned

        if (onLoadComplete) onLoadComplete()
        resolve(model)
      },
      (xhr) => {
        if (xhr && xhr.total && onLoadProgress) {
          const progress = (xhr.loaded / xhr.total) * 100
          onLoadProgress(progress)
        }
      },
      (err) => {
        // loader error
        reject(err)
      }
    )
  })
}
