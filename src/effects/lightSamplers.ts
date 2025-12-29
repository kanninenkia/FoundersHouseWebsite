/**
 * Light Samplers
 * Mesh sampling utilities for placing lights on building surfaces
 */
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { CITY_LIGHTS } from '../constants/designSystem'
import { collectMeshes, computeMeshAreas } from '../helpers'
import { createLightSprite } from './lightSprite'
import {
  cityLightVertexShader,
  cityLightFragmentShader,
  glowVertexShader,
  glowFragmentShader
} from './shaders/cityLightShaders'

/**
 * MEMORY OPTIMIZATION: Cache the light sprite texture globally
 * Creating a new 64x64 texture for every light set wastes 16-32 KB per creation
 * With day/night toggling, this can leak 160+ KB over multiple sessions
 */
let cachedLightSprite: THREE.CanvasTexture | null = null

/**
 * Get or create the cached light sprite texture
 * Reuses the same texture instance to save memory
 */
function getCachedLightSprite(color: number | string): THREE.CanvasTexture {
  if (!cachedLightSprite) {
    cachedLightSprite = createLightSprite(color)
  }
  return cachedLightSprite
}

/**
 * Dispose the cached sprite (call on scene cleanup)
 */
export function disposeCachedLightSprite(): void {
  if (cachedLightSprite) {
    cachedLightSprite.dispose()
    cachedLightSprite = null
  }
}

/**
 * Sample positions on mesh surfaces for light placement
 */
export function sampleLightPositions(
  helsinkiModel: THREE.Group,
  count: number,
  offsetRange: { min: number; max: number } = { min: 0.5, max: 1.0 }
): {
  positions: number[]
  colors: number[]
  placed: number
} {
  const meshes = collectMeshes(helsinkiModel)
  if (meshes.length === 0) {
    return { positions: [], colors: [], placed: 0 }
  }

  const positions: number[] = []
  const colors: number[] = []
  const pos = new THREE.Vector3()
  const normal = new THREE.Vector3()

  const meshAreas = computeMeshAreas(meshes)
  const totalArea = meshAreas.reduce((s, v) => s + v, 0)

  let placed = 0
  for (let m = 0; m < meshes.length; m++) {
    if (placed >= count) break
    const mesh = meshes[m]
    const samplesForMesh = Math.max(1, Math.round((meshAreas[m] / totalArea) * count))

    try {
      mesh.updateMatrixWorld(true)
      const sampler = new MeshSurfaceSampler(mesh as any).build()

      for (let i = 0; i < samplesForMesh; i++) {
        if (placed >= count) break
        sampler.sample(pos, normal)
        mesh.localToWorld(pos)

        const meshNormalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
        normal.applyMatrix3(meshNormalMatrix).normalize()

        const offset = offsetRange.min + Math.random() * (offsetRange.max - offsetRange.min)
        pos.add(normal.clone().multiplyScalar(offset))

        helsinkiModel.worldToLocal(pos)
        positions.push(pos.x, pos.y, pos.z)

        // Random color from palette
        const palette = [0xfff6d0, 0xffdca3, 0xffb86b, 0xffffff, 0xcfe8ff, 0xffc6d1]
        const pick = palette[Math.floor(Math.random() * palette.length)]
        const base = new THREE.Color(pick as any)
        const v = 0.7 + Math.random() * 0.4
        base.multiplyScalar(v)
        colors.push(base.r, base.g, base.b)

        placed++
      }
    } catch (err) {
      continue
    }
  }

  return { positions, colors, placed }
}

/**
 * Initialize flicker state arrays for lights
 */
export function initializeFlickerStates(count: number): {
  flickerStates: Float32Array
  nextFlickerTimes: Float32Array
  flickerDurations: Float32Array
} {
  const flickerStates = new Float32Array(count)
  const nextFlickerTimes = new Float32Array(count)
  const flickerDurations = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    flickerStates[i] = 1.0
    nextFlickerTimes[i] = Math.random() * 15
    flickerDurations[i] = 0
  }

  return { flickerStates, nextFlickerTimes, flickerDurations }
}

/**
 * Create point-based city lights with custom shaders
 */
export function createPointLights(
  positions: Float32Array,
  colors: Float32Array,
  flickerStates: Float32Array,
  nextFlickerTimes: Float32Array,
  flickerDurations: Float32Array,
  color: number | string = CITY_LIGHTS.color
): { corePoints: THREE.Points; glowPoints: THREE.Points } {
  // Use cached sprite texture to save memory (16 KB saved per call)
  const sprite = getCachedLightSprite(color)

  // MEMORY OPTIMIZATION: Create shared buffer attributes to avoid duplication
  // Without sharing, we'd waste ~20 KB per light set (positions + flicker states duplicated)
  const sharedPositionAttr = new THREE.Float32BufferAttribute(positions, 3)
  const sharedFlickerAttr = new THREE.Float32BufferAttribute(flickerStates, 1)

  // Core lights geometry
  const coreGeom = new THREE.BufferGeometry()
  coreGeom.setAttribute('position', sharedPositionAttr)
  coreGeom.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3))
  coreGeom.setAttribute('flickerState', sharedFlickerAttr)

  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: sprite },
      fogColor: { value: new THREE.Color() },
      fogNear: { value: 0 },
      fogFar: { value: 0 }
    },
    vertexShader: cityLightVertexShader,
    fragmentShader: cityLightFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    fog: true,
  })

  const corePoints = new THREE.Points(coreGeom, coreMaterial)
  corePoints.frustumCulled = false
  corePoints.userData.nextFlickerTimes = nextFlickerTimes
  corePoints.userData.flickerDurations = flickerDurations

  // Glow layer - SHARE position and flicker attributes with core layer
  const glowGeom = new THREE.BufferGeometry()
  glowGeom.setAttribute('position', sharedPositionAttr)
  glowGeom.setAttribute('flickerState', sharedFlickerAttr)

  const avgColor = new THREE.Color(color as any)
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: sprite },
      color: { value: avgColor },
      fogColor: { value: new THREE.Color() },
      fogNear: { value: 0 },
      fogFar: { value: 0 }
    },
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    fog: true,
  })

  const glowPoints = new THREE.Points(glowGeom, glowMaterial)
  glowPoints.frustumCulled = false
  glowPoints.userData.nextFlickerTimes = nextFlickerTimes
  glowPoints.userData.flickerDurations = flickerDurations

  return { corePoints, glowPoints }
}

/**
 * Create instanced mesh-based city lights (alternative approach)
 */
export function createInstancedLights(
  helsinkiModel: THREE.Group,
  count: number,
  color: number | string = CITY_LIGHTS.color,
  size: number = 6
): THREE.InstancedMesh | null {
  const meshes = collectMeshes(helsinkiModel)
  if (meshes.length === 0) return null

  const geometry = new THREE.SphereGeometry(size * 0.25, 4, 4)
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color as any),
    blending: THREE.NormalBlending,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    vertexColors: true,
    fog: true,
  })

  const inst = new THREE.InstancedMesh(geometry, mat, count)
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  const instanceColors = new Float32Array(count * 3)
  const pos = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const quat = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  const matrix = new THREE.Matrix4()

  let placed = 0
  helsinkiModel.updateMatrixWorld(true)

  const modelInvMatrix = new THREE.Matrix4().copy(helsinkiModel.matrixWorld).invert()
  const modelNormalMatrix = new THREE.Matrix3().getNormalMatrix(modelInvMatrix)
  const meshAreas = computeMeshAreas(meshes)
  const totalArea = meshAreas.reduce((s, v) => s + v, 0)

  for (let m = 0; m < meshes.length; m++) {
    if (placed >= count) break
    const mesh = meshes[m]
    const area = meshAreas[m]
    const samplesForMesh = Math.max(1, Math.round((area / totalArea) * count))

    try {
      mesh.updateMatrixWorld(true)
      const sampler = new MeshSurfaceSampler(mesh as any).build()

      for (let i = 0; i < samplesForMesh; i++) {
        if (placed >= count) break
        sampler.sample(pos, normal)
        mesh.localToWorld(pos)

        const meshNormalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
        normal.applyMatrix3(meshNormalMatrix).normalize()
        pos.add(normal.clone().multiplyScalar(0.5 + Math.random() * 1.0))

        helsinkiModel.worldToLocal(pos)
        normal.applyMatrix3(modelNormalMatrix).normalize()

        const s = 0.15 + Math.random() * 0.35
        scale.set(s, s, s)
        quat.setFromUnitVectors(up, normal.clone().normalize())
        matrix.compose(pos.clone(), quat, scale)
        inst.setMatrixAt(placed, matrix)

        const base = new THREE.Color(color as any)
        const v = 0.7 + Math.random() * 0.35
        base.multiplyScalar(v)
        instanceColors[placed * 3] = base.r
        instanceColors[placed * 3 + 1] = base.g
        instanceColors[placed * 3 + 2] = base.b
        placed++
      }
    } catch (err) {
      continue
    }
  }

  if (placed === 0) {
    geometry.dispose()
    mat.dispose()
    return null
  }

  if (placed < count) inst.count = placed

  inst.instanceColor = new THREE.InstancedBufferAttribute(instanceColors, 3)
  inst.instanceMatrix.needsUpdate = true
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  inst.frustumCulled = false
  inst.visible = false

  return inst
}
