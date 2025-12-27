/**
 * POI Highlight Manager
 * Manages building highlighting for Points of Interest
 */
import * as THREE from 'three'
import { POINTS_OF_INTEREST } from '../../constants/poi'

export class POIHighlightManager {
  private highlightedMeshes: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map()
  private highlightedPOI: string | null = null
  private helsinkiModel: THREE.Group | null = null
  private camera: THREE.PerspectiveCamera
  private highlightMaterial: THREE.MeshStandardMaterial

  constructor(camera: THREE.PerspectiveCamera, helsinkiModel: THREE.Group | null = null) {
    this.camera = camera
    this.helsinkiModel = helsinkiModel

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
   * Set the Helsinki model reference
   */
  public setModel(model: THREE.Group | null): void {
    this.helsinkiModel = model
  }

  /**
   * Highlight buildings near a POI by changing their color to red
   * Uses raycasting from camera to find meshes at the POI location
   */
  public highlightPOI(poiName: string, maxIntersections: number = 20): void {
    // First, remove any existing highlights
    this.clearHighlights()

    if (!this.helsinkiModel) {
      return
    }

    const poi = POINTS_OF_INTEREST[poiName as keyof typeof POINTS_OF_INTEREST]
    if (!poi) {
      return
    }

    // Use raycasting from camera towards POI to find the building
    const raycaster = new THREE.Raycaster()
    const cameraDirection = new THREE.Vector3()

    // Calculate direction from camera to POI world coordinates
    const poiWorldPos = new THREE.Vector3(
      poi.worldCoords.x,
      poi.worldCoords.y,
      poi.worldCoords.z
    )

    cameraDirection.subVectors(poiWorldPos, this.camera.position).normalize()
    raycaster.set(this.camera.position, cameraDirection)

    // Find all intersections with the model
    const intersects = raycaster.intersectObject(this.helsinkiModel, true)

    const highlightedObjects = new Set<THREE.Mesh>()

    if (intersects.length > 0) {
      // Highlight the meshes that were hit by the raycast
      const intersectionsToHighlight = intersects.slice(0, maxIntersections)

      for (const intersection of intersectionsToHighlight) {
        const mesh = intersection.object
        if (mesh instanceof THREE.Mesh && !highlightedObjects.has(mesh)) {
          // Store original material
          this.highlightedMeshes.set(mesh, mesh.material)

          // Apply red highlight material (reuse single material instance)
          mesh.material = this.highlightMaterial
          highlightedObjects.add(mesh)
        }
      }
    }

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
