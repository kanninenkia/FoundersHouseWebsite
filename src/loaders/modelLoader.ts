/**
 * Model Loader
 * Responsible for loading the Helsinki GLB and positioning it in the scene.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { COLORS } from '../constants/designSystem'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export interface LoadParams {
  modelPath: string
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: any
  isNightMode?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export async function loadHelsinkiModel(params: LoadParams): Promise<THREE.Group | null> {
  const { modelPath, scene, camera, isNightMode = false, onLoadProgress, onLoadComplete } = params
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
        // Store geometries and materials for proper disposal later
        const edgeGeometries: THREE.EdgesGeometry[] = []
        const edgeMaterials: THREE.LineBasicMaterial[] = []

        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            // Detect if this mesh is a building (heuristic: vertical meshes or named objects)
            // Buildings typically have height (Y-axis in rotated model)
            const box = new THREE.Box3().setFromObject(child)
            const size = box.getSize(new THREE.Vector3())
            const isBuilding = size.y > 10 // Buildings have vertical height > 10 units

            const buildingOpacity = 0.98

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

              // Store for disposal
              edgeGeometries.push(edges)
              edgeMaterials.push(lineMaterial)

              if (child.parent) {
                child.parent.add(lineSegments)
              }
            }
            // Non-buildings keep their original materials untouched
          }
        })

        // Store disposal arrays on the model for cleanup
        ;(model as any).__edgeGeometries = edgeGeometries
        ;(model as any).__edgeMaterials = edgeMaterials

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

          // Camera position is already set in CAMERA_BASE constants - no need to move it here
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
