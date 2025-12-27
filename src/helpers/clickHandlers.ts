/**
 * Click Handlers
 * Debug utilities for clicking on map areas/tiles to get POI coordinates
 */
import * as THREE from 'three'

/**
 * Setup click handler for getting POI coordinates
 * Click on any area/tile to get its coordinates for POI configuration
 */
export function setupClickHandler(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  getModel: () => THREE.Group | null
): void {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const onClick = (event: MouseEvent) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    // Update the raycaster with camera and mouse position
    raycaster.setFromCamera(mouse, camera)

    // Check for intersections with the Helsinki model
    const helsinkiModel = getModel()
    if (helsinkiModel) {
      const intersects = raycaster.intersectObject(helsinkiModel, true)

      if (intersects.length > 0) {
        const intersection = intersects[0]

        // Log the click point coordinates for POI setup
        logClickPoint(intersection)
      }
    }
  }

  renderer.domElement.addEventListener('click', onClick)
}

/**
 * Log click point for POI setup - disabled for production
 */
function logClickPoint(_intersection: THREE.Intersection): void {
  // Debug logging removed
}
