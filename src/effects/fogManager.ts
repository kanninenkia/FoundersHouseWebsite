/**
 * Fog Manager
 * Handles fog setup and dynamic fog transitions for the Helsinki scene
 */

import * as THREE from 'three'
import { FOG } from '../constants/designSystem'

export interface FogConfig {
  near: number
  far: number
  color: number
}

/**
 * Creates and adds fog to a scene
 */
export function setupSceneFog(
  scene: THREE.Scene,
  isNightMode: boolean
): THREE.Fog {
  const fogColor = isNightMode ? FOG.colors.night : FOG.colors.day
  const fog = new THREE.Fog(fogColor, FOG.near, FOG.far)
  scene.fog = fog
  return fog
}

/**
 * Updates fog color when switching between day/night modes
 */
export function updateFogColor(fog: THREE.Fog | null, isNightMode: boolean): void {
  if (fog && fog instanceof THREE.Fog) {
    fog.color.setHex(isNightMode ? FOG.colors.night : FOG.colors.day)
  }
}
