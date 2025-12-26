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
 * Log click point for POI setup - simple coordinate logging
 */
function logClickPoint(intersection: THREE.Intersection): void {
  const clickPoint = intersection.point

  // Console log for easy copy-paste to POI config
  console.log('\n📍 ═══════════════════════════════════════════════════')
  console.log('🗺️  AREA/TILE CLICKED - POI Configuration Data')
  console.log('════════════════════════════════════════════════════\n')

  console.log('📌 Click Position (use this for POI position):')
  console.log(`   x: ${clickPoint.x.toFixed(2)}`)
  console.log(`   y: ${clickPoint.y.toFixed(2)}`)
  console.log(`   z: ${clickPoint.z.toFixed(2)}`)

  console.log('\n📋 Copy-Paste POI Config:')
  console.log('─────────────────────────────────────────────────────')
  console.log(`export const YOUR_POI_NAME: PointOfInterest = {
  id: 'your-poi-id',
  name: 'Your Area/Section Name',
  description: 'Description here',
  position: {
    x: ${clickPoint.x.toFixed(2)},
    y: ${clickPoint.y.toFixed(2)},
    z: ${clickPoint.z.toFixed(2)}
  },
  cameraDistance: 250,
  cameraHeight: 100,
  cameraAngle: -45
}`)
  console.log('─────────────────────────────────────────────────────\n')

  // Store for window access
  ;(window as any).__clickPoint = {
    x: clickPoint.x.toFixed(2),
    y: clickPoint.y.toFixed(2),
    z: clickPoint.z.toFixed(2)
  }
}
