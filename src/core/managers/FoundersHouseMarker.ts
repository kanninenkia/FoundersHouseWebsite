/**
 * Founders House Marker
 * Highlights the Founders House building in red
 */
import * as THREE from 'three'

export class FoundersHouseMarker {
  private highlightedMeshes: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map()
  private redMaterial: THREE.MeshStandardMaterial

  constructor() {
    // Create a single reusable red material
    this.redMaterial = new THREE.MeshStandardMaterial({
      color: 0xAD1013, // Founders House red
      emissive: 0xAD1013,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.98,
      fog: true
    })
  }

  /**
   * Remove legacy arrow markers (cleanup method for backward compatibility)
   */
  public removeArrow(): void {
    // Remove any stale arrows from previous instances (e.g., hot reload, legacy code)
    const allArrows = document.querySelectorAll('img[src="/fharrow.png"]')
    allArrows.forEach(arrow => {
      if (arrow.parentElement) {
        arrow.parentElement.removeChild(arrow)
      }
    })
  }

  /**
   * Remove the red highlight
   */
  public clearHighlight(): void {
    this.highlightedMeshes.forEach((originalMaterial, mesh) => {
      mesh.material = originalMaterial
    })
    this.highlightedMeshes.clear()
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.removeArrow()
    this.clearHighlight()
    // Dispose the shared red material
    this.redMaterial.dispose()
  }
}
