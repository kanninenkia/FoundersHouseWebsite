/**
 * Founders House Marker
 * Highlights the Founders House building in red and adds an arrow marker above it
 */
import * as THREE from 'three'
import { WAVE_VENTURES_POI } from '../../constants/poi'

export class FoundersHouseMarker {
  private helsinkiModel: THREE.Group | null = null
  private highlightedMeshes: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map()
  private camera: THREE.PerspectiveCamera | null = null
  private arrowOverlay: HTMLImageElement | null = null
  private searchRadius: number = 50
  private arrowHeight: number = 20
  private arrowSize: number = 80

  constructor() {

    // Expose controls to console
    ;(window as any).adjustFoundersHouseMarker = {
      setSearchRadius: (radius: number) => {
        this.searchRadius = radius
        this.clearHighlight()
        this.highlightFoundersHouse()
      },
      setArrowHeight: (height: number) => {
        this.arrowHeight = height
      },
      setArrowSize: (size: number) => {
        this.arrowSize = size
        if (this.arrowOverlay) {
          this.arrowOverlay.style.width = `${size}px`
          this.arrowOverlay.style.height = `${size}px`
        }
      }
    }
  }

  /**
   * Set the Helsinki model reference
   */
  public setModel(model: THREE.Group | null, camera?: THREE.PerspectiveCamera): void {
    this.helsinkiModel = model
    if (camera) {
      this.camera = camera
    }
    if (model) {
      this.highlightFoundersHouse()
      this.addArrowMarker() // Enabled: show floating HTML arrow overlay
    }
  }

  /**
   * Highlight the Founders House building in red
   */
  private highlightFoundersHouse(): void {
    if (!this.helsinkiModel) return

    const poi = WAVE_VENTURES_POI

    // Create red material for highlighting
    const redMaterial = new THREE.MeshStandardMaterial({
      color: 0xAD1013, // Founders House red
      emissive: 0xAD1013,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.98,
      fog: true
    })

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

          // Apply red highlight
          child.material = redMaterial
        }
      }
    })
  }

  /**
   * Add an HTML overlay arrow above the Founders House (to avoid B&W filter)
   */
  private addArrowMarker(): void {
    // Remove any existing arrows first
    this.removeArrow()

    // Create HTML image overlay
    this.arrowOverlay = document.createElement('img')
    this.arrowOverlay.src = '/fharrow.png'
    this.arrowOverlay.style.position = 'fixed'
    this.arrowOverlay.style.pointerEvents = 'none'
    this.arrowOverlay.style.zIndex = '5'
    this.arrowOverlay.style.width = `${this.arrowSize}px`
    this.arrowOverlay.style.height = `${this.arrowSize}px`
    this.arrowOverlay.style.transformOrigin = 'center center'

    // Add to document
    document.body.appendChild(this.arrowOverlay)

    // Start animation loop to update position
    this.animateArrow()
  }

  /**
   * Animate the arrow marker with a gentle bobbing motion
   */
  private animateArrow(): void {
    if (!this.arrowOverlay || !this.camera) return

    const poi = WAVE_VENTURES_POI
    const worldPosition = new THREE.Vector3(
      poi.worldCoords.x,
      this.arrowHeight,
      poi.worldCoords.z
    )

    const amplitude = 3 // Reduced bounce - subtle movement
    const speed = 0.001 // Slower animation speed
    const startTime = Date.now()

    const animate = () => {
      if (!this.arrowOverlay || !this.camera) return

      // Calculate bobbing offset
      const time = (Date.now() - startTime) * speed
      const yOffset = Math.sin(time) * amplitude

      // Update world position with bob
      worldPosition.y = this.arrowHeight + yOffset

      // Project 3D position to 2D screen coordinates
      const screenPosition = worldPosition.clone()
      screenPosition.project(this.camera)

      // Convert to screen pixels
      const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth
      const y = (-(screenPosition.y * 0.5) + 0.5) * window.innerHeight

      // Update arrow position
      this.arrowOverlay.style.left = `${x - this.arrowSize / 2}px`
      this.arrowOverlay.style.top = `${y - this.arrowSize / 2}px`

      // Hide if behind camera
      if (screenPosition.z > 1) {
        this.arrowOverlay.style.display = 'none'
      } else {
        this.arrowOverlay.style.display = 'block'
      }

      requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * Remove the arrow marker
   */
  public removeArrow(): void {
    // Remove our tracked arrow
    if (this.arrowOverlay && this.arrowOverlay.parentElement) {
      this.arrowOverlay.parentElement.removeChild(this.arrowOverlay)
      this.arrowOverlay = null
    }

    // Also remove any stale arrows from previous instances (e.g., hot reload)
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
  }
}
