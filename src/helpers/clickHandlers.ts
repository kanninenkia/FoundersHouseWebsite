/**
 * Click Handlers
 * Debug utilities for clicking buildings and highlighting faces
 */
import * as THREE from 'three'

// Store all highlighted meshes for a building
let currentHighlights: Array<{
  mesh: THREE.Mesh
  originalMaterial: THREE.Material | THREE.Material[]
}> = []

// Configuration for building detection
const BUILDING_DETECTION_CONFIG = {
  proximityRadius: 20, // How far to search for connected meshes (in world units) - reduced to prevent selecting adjacent buildings
  minBuildingHeight: 10, // Minimum height to be considered a building
  minHeightThreshold: 3, // Minimum Y position (height above ground) to be considered part of building
  maxMeshesToHighlight: 100, // Safety limit
}

/**
 * Adjust building detection settings from the console
 * Usage: window.setBuildingDetectionRadius(100) - to make it detect larger buildings
 * Usage: window.setHeightThreshold(5) - to only select meshes above this height
 */
;(window as any).setBuildingDetectionRadius = (radius: number) => {
  BUILDING_DETECTION_CONFIG.proximityRadius = radius
}
;(window as any).setBuildingMinHeight = (height: number) => {
  BUILDING_DETECTION_CONFIG.minBuildingHeight = height
}
;(window as any).setHeightThreshold = (height: number) => {
  BUILDING_DETECTION_CONFIG.minHeightThreshold = height
}

/**
 * Setup click handler for debugging building locations
 * Click on any building to highlight the entire building
 * The system will automatically detect connected meshes
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

        // Highlight the entire building
        highlightClickedFace(intersection)

        // Store building info for debugging
        storeBuildingInfo(intersection)
      }
    }
  }

  renderer.domElement.addEventListener('click', onClick)
}

/**
 * Store building information for debugging
 */
function storeBuildingInfo(intersection: THREE.Intersection): void {
  const highlightedMeshes = (window as any).__highlightedMeshes as THREE.Mesh[] | undefined

  if (!highlightedMeshes || highlightedMeshes.length === 0) return

  // Calculate bounding box of the entire building
  const buildingBox = new THREE.Box3()
  for (const mesh of highlightedMeshes) {
    const meshBox = new THREE.Box3().setFromObject(mesh)
    buildingBox.union(meshBox)
  }

  const center = buildingBox.getCenter(new THREE.Vector3())
  const size = buildingBox.getSize(new THREE.Vector3())

  const buildingInfo = {
    clickPoint: {
      x: Math.round(intersection.point.x * 100) / 100,
      y: Math.round(intersection.point.y * 100) / 100,
      z: Math.round(intersection.point.z * 100) / 100
    },
    center: {
      x: Math.round(center.x * 100) / 100,
      y: Math.round(center.y * 100) / 100,
      z: Math.round(center.z * 100) / 100
    },
    size: {
      x: Math.round(size.x * 100) / 100,
      y: Math.round(size.y * 100) / 100,
      z: Math.round(size.z * 100) / 100
    },
    meshCount: highlightedMeshes.length,
    meshes: highlightedMeshes
  }

  ;(window as any).__buildingInfo = buildingInfo
}

/**
 * Highlight an entire building by finding all connected meshes
 */
function highlightClickedFace(intersection: THREE.Intersection): void {
  // Remove previous highlights
  clearHighlights()

  // Only highlight if it's a mesh
  if (!(intersection.object instanceof THREE.Mesh)) {
    return
  }

  const clickedMesh = intersection.object as THREE.Mesh

  // Find all meshes that belong to the same building
  const buildingMeshes = findBuildingMeshes(clickedMesh)

  // Highlight all found meshes
  highlightMeshes(buildingMeshes)
}

/**
 * Find all meshes that belong to the same building using height-based detection
 */
function findBuildingMeshes(clickedMesh: THREE.Mesh): THREE.Mesh[] {
  // First, check if the clicked mesh is above the height threshold
  const clickedBox = new THREE.Box3().setFromObject(clickedMesh)
  const clickedMinHeight = clickedBox.min.y

  // If clicked mesh is too low (ground/floor), don't select anything
  if (clickedMinHeight < BUILDING_DETECTION_CONFIG.minHeightThreshold) {
    return []
  }

  const buildingMeshes: THREE.Mesh[] = [clickedMesh]
  const meshesToCheck: THREE.Mesh[] = [clickedMesh]
  const checkedMeshes = new Set<THREE.Mesh>([clickedMesh])

  // Get the root model
  let root = clickedMesh.parent
  while (root && root.parent && root.parent.type !== 'Scene') {
    root = root.parent
  }

  if (!root) return buildingMeshes

  // Get the bounding box of the clicked mesh to establish building footprint
  const clickedCenter = clickedBox.getCenter(new THREE.Vector3())

  // Collect all meshes in the model that meet height requirements
  const allMeshes: THREE.Mesh[] = []
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && isBuilding(child)) {
      // Check if this mesh is above the height threshold
      const meshBox = new THREE.Box3().setFromObject(child)
      if (meshBox.min.y >= BUILDING_DETECTION_CONFIG.minHeightThreshold) {
        allMeshes.push(child)
      }
    }
  })

  // Flood fill algorithm with height-based filtering
  while (meshesToCheck.length > 0 && buildingMeshes.length < BUILDING_DETECTION_CONFIG.maxMeshesToHighlight) {
    const currentMesh = meshesToCheck.shift()!
    const currentBox = new THREE.Box3().setFromObject(currentMesh)
    const currentCenter = currentBox.getCenter(new THREE.Vector3())

    // Check all other meshes for proximity
    for (const mesh of allMeshes) {
      if (checkedMeshes.has(mesh)) continue

      const meshBox = new THREE.Box3().setFromObject(mesh)
      const meshCenter = meshBox.getCenter(new THREE.Vector3())

      // CRITICAL: Stop if mesh is below height threshold
      if (meshBox.min.y < BUILDING_DETECTION_CONFIG.minHeightThreshold) {
        continue
      }

      // Calculate horizontal distance only (ignore Y axis)
      const horizontalDistance = Math.sqrt(
        Math.pow(currentCenter.x - meshCenter.x, 2) +
        Math.pow(currentCenter.z - meshCenter.z, 2)
      )

      // Check if meshes overlap vertically (same building should share Y range)
      const verticalOverlap = !(meshBox.max.y < currentBox.min.y || meshBox.min.y > currentBox.max.y)

      // More strict criteria: must be close horizontally AND overlap vertically
      if (horizontalDistance < BUILDING_DETECTION_CONFIG.proximityRadius && verticalOverlap) {
        // Additional check: must be within reasonable distance from original click
        const distanceFromClick = Math.sqrt(
          Math.pow(clickedCenter.x - meshCenter.x, 2) +
          Math.pow(clickedCenter.z - meshCenter.z, 2)
        )

        // Only add if it's within 2x the proximity radius from the original click
        if (distanceFromClick < BUILDING_DETECTION_CONFIG.proximityRadius * 2) {
          buildingMeshes.push(mesh)
          meshesToCheck.push(mesh)
          checkedMeshes.add(mesh)
        }
      }
    }
  }

  return buildingMeshes
}

/**
 * Check if a mesh is a building (has sufficient height)
 */
function isBuilding(mesh: THREE.Mesh): boolean {
  const box = new THREE.Box3().setFromObject(mesh)
  const size = box.getSize(new THREE.Vector3())
  return size.y > BUILDING_DETECTION_CONFIG.minBuildingHeight
}

/**
 * Highlight multiple meshes with pink overlay
 */
function highlightMeshes(meshes: THREE.Mesh[]): void {
  const pinkMaterial = new THREE.MeshBasicMaterial({
    color: 0xff69b4, // Hot pink
    transparent: true,
    opacity: 0.6,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide
  })

  for (const mesh of meshes) {
    // Store original material
    currentHighlights.push({
      mesh: mesh,
      originalMaterial: mesh.material
    })

    // Apply pink highlight
    mesh.material = pinkMaterial
  }

  // Store reference for debugging
  ;(window as any).__highlightedMeshes = meshes
  ;(window as any).__highlightedBuildingCount = meshes.length
}

/**
 * Clear all current highlights
 */
function clearHighlights(): void {
  for (const highlight of currentHighlights) {
    highlight.mesh.material = highlight.originalMaterial
  }
  currentHighlights = []
}
