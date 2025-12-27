/**
 * Founders House Marker
 * Highlights the Founders House building in red
 */
import * as THREE from 'three'
import { FOUNDERS_HOUSE_POI } from '../../constants/poi'

export class FoundersHouseMarker {
  private helsinkiModel: THREE.Group | null = null
  private highlightedMeshes: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map()
  private searchRadius: number = 50
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
   * Set the Helsinki model reference
   */
  public setModel(model: THREE.Group | null, _camera?: THREE.PerspectiveCamera): void {
    this.helsinkiModel = model
    if (model) {
      this.highlightFoundersHouse()
    }
  }

  /**
   * Highlight the Founders House building in red
   */
  private highlightFoundersHouse(): void {
    if (!this.helsinkiModel) return

    const poi = FOUNDERS_HOUSE_POI

    // Find all meshes near the Founders House coordinates
    this.helsinkiModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const box = new THREE.Box3().setFromObject(child)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        // Calculate distance from Founders House coordinates (horizontal only)
        const distance = Math.sqrt(
          Math.pow(center.x - poi.worldCoords.x, 2) +
          Math.pow(center.z - poi.worldCoords.z, 2)
        )

        // Check if mesh is within radius and has sufficient height (is a building)
        if (distance < this.searchRadius && size.y > 10) {
          // Store original material
          this.highlightedMeshes.set(child, child.material)

          // Apply red highlight (reuse single material instance)
          child.material = this.redMaterial
        }
      }
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
