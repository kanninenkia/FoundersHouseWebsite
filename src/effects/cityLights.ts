/**
 * City Lights - Main Module
 * Orchestrates city light creation, animation, and management
 */
import * as THREE from 'three'
import { CITY_LIGHTS } from '../constants/designSystem'
import {
  sampleLightPositions,
  initializeFlickerStates,
  createPointLights,
  createInstancedLights
} from './lightSamplers'

export { createLightSprite } from './lightSprite'

/**
 * Add city lights using instanced meshes
 */
export function addCityLights(
  helsinkiModel: THREE.Group | null,
  count = 1000,
  color: number | string = CITY_LIGHTS.color,
  size = 6
): THREE.InstancedMesh | null {
  if (!helsinkiModel) return null

  const inst = createInstancedLights(helsinkiModel, count, color, size)
  if (inst) {
    helsinkiModel.add(inst)
  }
  return inst
}

/**
 * Add city lights using point-based rendering with custom shaders
 */
export function addCityLightsPoints(
  helsinkiModel: THREE.Group | null,
  count = 3000,
  color: number | string = CITY_LIGHTS.color
): THREE.Group | null {
  if (!helsinkiModel) return null

  const { positions, colors, placed } = sampleLightPositions(helsinkiModel, count)
  if (placed === 0) return null

  const finalPositions = new Float32Array(positions.slice(0, placed * 3))
  const finalColors = new Float32Array(colors.slice(0, placed * 3))

  const { flickerStates, nextFlickerTimes, flickerDurations } = initializeFlickerStates(placed)

  const { corePoints, glowPoints } = createPointLights(
    finalPositions,
    finalColors,
    flickerStates,
    nextFlickerTimes,
    flickerDurations,
    color
  )

  const group = new THREE.Group()
  group.add(corePoints)
  group.add(glowPoints)
  group.visible = false

  helsinkiModel.add(group)
  return group
}

/**
 * Animate city lights with per-point discrete random flickering
 * Optimized: only update lights that need state changes
 */
export function animateCityLights(cityLights: THREE.Object3D, elapsed: number): void {
  if (!cityLights) return

  cityLights.traverse((child) => {
    if (child instanceof THREE.Points) {
      const geometry = child.geometry
      const flickerStateAttr = geometry.getAttribute('flickerState')

      if (!flickerStateAttr || !child.userData.nextFlickerTimes) return

      const nextFlickerTimes = child.userData.nextFlickerTimes
      const flickerDurations = child.userData.flickerDurations
      const flickerStates = flickerStateAttr.array as Float32Array

      let needsUpdate = false

      for (let i = 0; i < flickerStates.length; i++) {
        if (elapsed >= nextFlickerTimes[i]) {
          needsUpdate = true

          if (flickerStates[i] > 0.5) {
            // Currently on - flicker off
            flickerStates[i] = 0.2 + Math.random() * 0.2
            flickerDurations[i] = 0.05 + Math.random() * 0.25
            nextFlickerTimes[i] = elapsed + flickerDurations[i]
          } else {
            // Currently off - turn back on
            flickerStates[i] = 1.0
            const waitTime = 2.0 + Math.random() * 10.0
            nextFlickerTimes[i] = elapsed + waitTime
          }
        }
      }

      if (needsUpdate) {
        flickerStateAttr.needsUpdate = true
      }
    }
  })
}

/**
 * Update fog uniforms for city lights shader materials
 */
export function updateCityLightsFog(cityLights: THREE.Object3D, scene: THREE.Scene): void {
  if (!cityLights || !scene.fog) return

  const fog = scene.fog as THREE.Fog
  const fogColor = fog.color
  const fogNear = fog.near
  const fogFar = fog.far

  cityLights.traverse((child) => {
    if (child instanceof THREE.Points) {
      const material = child.material as THREE.ShaderMaterial
      if (material.uniforms) {
        if (material.uniforms.fogColor) material.uniforms.fogColor.value.copy(fogColor)
        if (material.uniforms.fogNear) material.uniforms.fogNear.value = fogNear
        if (material.uniforms.fogFar) material.uniforms.fogFar.value = fogFar
      }
    }
  })
}

/**
 * Remove and dispose city lights
 */
export function removeCityLights(cityLights: any): void {
  if (!cityLights) return
  try {
    if (cityLights.geometry) cityLights.geometry.dispose()
    const mat = cityLights.material
    if (mat) {
      if (Array.isArray(mat)) mat.forEach((m: any) => m.dispose())
      else mat.dispose()
    }
  } catch (err) {
    // ignore
  }
}
