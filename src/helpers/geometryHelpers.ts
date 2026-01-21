/**
 * Geometry Helper Functions
 * Centralized utilities for common geometry operations to avoid code duplication
 */

import * as THREE from 'three'

/**
 * Collects all meshes from a Three.js object hierarchy
 * @param object - The root object to traverse
 * @returns Array of all meshes found
 */
export function collectMeshes(object: THREE.Object3D | null): THREE.Mesh[] {
  if (!object) return []
  
  const meshes: THREE.Mesh[] = []
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      meshes.push(child as THREE.Mesh)
    }
  })
  
  return meshes
}

/**
 * Computes the total surface area of a buffer geometry
 * @param geometry - The buffer geometry to analyze
 * @returns Total surface area in square units
 */
export function computeSurfaceArea(geometry: THREE.BufferGeometry): number {
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
  const idx = geometry.getIndex()
  let area = 0
  
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  
  if (idx) {
    // Indexed geometry
    for (let i = 0; i < idx.count; i += 3) {
      a.fromBufferAttribute(posAttr, idx.getX(i))
      b.fromBufferAttribute(posAttr, idx.getX(i + 1))
      c.fromBufferAttribute(posAttr, idx.getX(i + 2))
      area += new THREE.Triangle(a, b, c).getArea()
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < posAttr.count; i += 3) {
      a.fromBufferAttribute(posAttr, i)
      b.fromBufferAttribute(posAttr, i + 1)
      c.fromBufferAttribute(posAttr, i + 2)
      area += new THREE.Triangle(a, b, c).getArea()
    }
  }
  
  return area
}

/**
 * Computes surface area for each mesh with error handling
 * @param meshes - Array of meshes to analyze
 * @returns Array of surface areas (same length as input)
 */
export function computeMeshAreas(meshes: THREE.Mesh[]): number[] {
  return meshes.map((mesh) => {
    try {
      const area = computeSurfaceArea(mesh.geometry as THREE.BufferGeometry)
      return Math.max(0.000001, area) // Prevent zero division
    } catch (err) {
      return 0.000001
    }
  })
}

