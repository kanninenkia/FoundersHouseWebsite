import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { HelsinkiScene } from '../../core'
import { FOUNDERS_HOUSE_POI, POINTS_OF_INTEREST, type PointOfInterest } from '../../constants/poi'
import { FOG } from '../../constants/designSystem'
import './POILayer.css'

interface POILayerProps {
  sceneRef: MutableRefObject<HelsinkiScene | null>
  visible?: boolean
  planeOffset?: number
  activePOIKey?: string | null
  isCameraFlying?: boolean
  onPOISelect?: (poi: PointOfInterest) => void
}

const BASE_OPACITY = 1
const DEFAULT_PLANE_OFFSET = 45
const BASE_SCALE = 1.7

const getDisplayName = (poi: PointOfInterest): string => poi.name

const POILayer = ({
  sceneRef,
  visible = true,
  planeOffset = DEFAULT_PLANE_OFFSET,
  activePOIKey = null,
  isCameraFlying = false,
  onPOISelect,
}: POILayerProps) => {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const poiList = useMemo(
    () =>
      Object.entries(POINTS_OF_INTEREST).map(([key, poi]) => ({
        key,
        poi,
        label: getDisplayName(poi),
      })),
    []
  )

  useEffect(() => {
    if (!visible) {
      Object.values(itemRefs.current).forEach((el) => {
        if (el) el.style.opacity = '0'
      })
      return
    }

    const vector = new THREE.Vector3()
    const distanceVec = new THREE.Vector3()
    const size = new THREE.Vector2()
    let rafId = 0

    const update = () => {
      const scene = sceneRef.current
      if (!scene) {
        rafId = requestAnimationFrame(update)
        return
      }

      const camera = scene.getCamera()
      const renderer = scene.getRenderer()
      renderer.getSize(size)

      poiList.forEach(({ key, poi }) => {
        const el = itemRefs.current[key]
        if (!el) return

        distanceVec.set(poi.worldCoords.x, poi.worldCoords.y + planeOffset, poi.worldCoords.z)
        const distance = camera.position.distanceTo(distanceVec)
        const isDistant = distance >= FOG.far

        el.classList.toggle('is-distant', isDistant)

        vector.copy(distanceVec).project(camera)

        const isOnscreen =
          vector.z > -1 &&
          vector.z < 1 &&
          Math.abs(vector.x) <= 1.15 &&
          Math.abs(vector.y) <= 1.15

        if (!isOnscreen) {
          // Don't update transform - let it freeze at last position and just fade out
          el.style.opacity = '0'
          return
        }

        const x = (vector.x * 0.5 + 0.5) * size.x
        const y = (-vector.y * 0.5 + 0.5) * size.y
        const scale = activePOIKey === key ? BASE_SCALE * 1.25 : BASE_SCALE

        // Only update transform when visible to avoid jitter during fade-out
        if (el.style.opacity !== '0') {
          el.style.setProperty('--poi-x', `${x}px`)
          el.style.setProperty('--poi-y', `${y}px`)
          el.style.setProperty('--poi-scale', String(scale))
        }
        el.style.opacity = '1'
      })

      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [activePOIKey, isCameraFlying, poiList, planeOffset, sceneRef, visible])

  return (
    <div className="poi-layer" aria-hidden="true">
      {poiList.map(({ key, label, poi }) => (
        <div
          key={key}
          ref={(el) => {
            itemRefs.current[key] = el
          }}
          className={`poi-layer-item ${key !== 'FOUNDERS_HOUSE' ? 'poi-gray' : ''}`}
          data-poi={key}
          role="button"
          tabIndex={0}
          onClick={() => onPOISelect?.(poi)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onPOISelect?.(poi)
            }
          }}
        >
          <span className="poi-dot" />
          <span className="poi-label-text">{label}</span>
        </div>
      ))}
    </div>
  )
}

export default POILayer
