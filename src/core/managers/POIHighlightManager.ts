/**
 * POI Highlight Manager
 * Manages building highlighting for Points of Interest
 */
import * as THREE from 'three'

export class POIHighlightManager {
  private highlightedMeshes: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map()
  private highlightedPOI: string | null = null
  private highlightMaterial: THREE.MeshStandardMaterial

  constructor() {
    // Create a single reusable highlight material
    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xAD1013,
      emissive: 0xAD1013,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.7,
      fog: true
    })
  }

  /**
   * Highlight buildings near a POI by changing their color to red
   * Uses raycasting from camera to find meshes at the POI location
   * DISABLED: No highlighting applied
   */
  public highlightPOI(poiName: string): void {
    // Highlighting disabled - do nothing
    this.highlightedPOI = poiName
  }

  /**
   * Remove all POI building highlights and restore original materials
   */
  public clearHighlights(): void {
    if (this.highlightedMeshes.size === 0) return

    // Restore original materials
    this.highlightedMeshes.forEach((originalMaterial, mesh) => {
      mesh.material = originalMaterial
    })

    this.highlightedMeshes.clear()
    this.highlightedPOI = null
  }

  /**
   * Get the currently highlighted POI name
   */
  public getHighlightedPOI(): string | null {
    return this.highlightedPOI
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.clearHighlights()
    // Dispose the shared highlight material
    this.highlightMaterial.dispose()
  }
}
