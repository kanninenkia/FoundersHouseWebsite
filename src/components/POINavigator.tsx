import { useState, useEffect, useRef } from 'react'
import { POINTS_OF_INTEREST, type PointOfInterest } from '../constants/poi'
import './POINavigator.css'

interface POINavigatorProps {
  onPOISelect?: (poi: PointOfInterest) => void
  initialPOI?: string
}

export const POINavigator = ({ onPOISelect, initialPOI = 'FOUNDERS_HOUSE' }: POINavigatorProps) => {
  const [selectedPOI, setSelectedPOI] = useState<string>(initialPOI)
  const [focusedIndex, setFocusedIndex] = useState(5) // Start at Founders House (center)

  // Convert POI object to array for easier mapping
  const poiList = Object.entries(POINTS_OF_INTEREST).map(([key, poi]) => ({
    key,
    ...poi
  }))

  const handlePOIClick = (poiKey: string, poi: PointOfInterest) => {
    setSelectedPOI(poiKey)
    onPOISelect?.(poi)
  }

  // Silent keyboard navigation - discoverable easter egg
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, poiList.length - 1)
            return next
          })
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0)
            return next
          })
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          const focusedPOI = poiList[focusedIndex]
          if (focusedPOI) {
            handlePOIClick(focusedPOI.key, focusedPOI)
          }
          break
        case 'Escape':
          e.preventDefault()
          // Reset to Founders House
          const foundersHouse = poiList.find(p => p.key === 'FOUNDERS_HOUSE')
          if (foundersHouse) {
            handlePOIClick(foundersHouse.key, foundersHouse)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, poiList])

  // Calculate the selected index for the vector path
  const selectedIndex = poiList.findIndex(poi => poi.key === selectedPOI)

  // Calculate expansion offset from center (Founders House is center at index 5)
  const centerIndex = 5 // FOUNDERS_HOUSE position

  const getStaggerDelay = (index: number): number => {
    // Founders House appears first (0ms delay)
    // All other POIs expand simultaneously after Founders House (200ms delay)
    return index === centerIndex ? 0 : 200
  }

  const getPullDistance = (index: number): string => {
    if (index === centerIndex) return '0px' // Founders House doesn't move

    // Items are placed by CSS Grid in their natural positions
    // We need them to START at center, then animate OUT to their natural position
    // Animation goes: translateX(pull-distance) at 0% -> translateX(0) at 100%

    const distanceFromCenter = Math.abs(index - centerIndex)

    // Each grid item is roughly separated by button width + gap
    const pixelsPerStep = 120
    const totalDistance = distanceFromCenter * pixelsPerStep

    // Items on LEFT of center (index < 5):
    // Natural position is LEFT of center, so to start at center they need translateX(+distance)
    // Items on RIGHT of center (index > 5):
    // Natural position is RIGHT of center, so to start at center they need translateX(-distance)
    const direction = index < centerIndex ? 1 : -1

    return `${direction * totalDistance}px`
  }

  return (
    <div className="poi-navigator" role="navigation" aria-label="Points of interest">
      <div className="poi-list" role="tablist">
        {poiList.map((poi, index) => (
          <button
            key={poi.key}
            className={`poi-item poi-item-stagger ${selectedPOI === poi.key ? 'active' : ''} ${index === focusedIndex ? 'keyboard-focused' : ''}`}
            onClick={() => handlePOIClick(poi.key, poi)}
            role="tab"
            aria-selected={selectedPOI === poi.key}
            aria-label={`Point of interest: ${poi.name}`}
            tabIndex={0}
            style={{
              animationDelay: `${getStaggerDelay(index)}ms`,
              '--pull-distance': getPullDistance(index)
            } as React.CSSProperties}
          >
            {poi.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Vector path component - peaks at the highlighted POI */}
      <VectorPath selectedIndex={selectedIndex} totalItems={poiList.length} />

      {/* Gradual blur overlay */}
      <div className="gradient-blur">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div className="gradient-blur-overlay"></div>
      </div>
    </div>
  )
}

interface VectorPathProps {
  selectedIndex: number
  totalItems: number
}

const VectorPath = ({ selectedIndex, totalItems }: VectorPathProps) => {
  const [path, setPath] = useState<string>('')
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const updatePath = () => {
      const buttons = document.querySelectorAll('.poi-item')
      const svg = svgRef.current
      if (!buttons.length || !svg) return

      const selectedButton = buttons[selectedIndex]
      if (!selectedButton) return

      const svgRect = svg.getBoundingClientRect()
      const buttonRect = selectedButton.getBoundingClientRect()

      const buttonCenterX = buttonRect.left + buttonRect.width / 2
      const svgLeft = svgRect.left
      const relativePosition = (buttonCenterX - svgLeft) / svgRect.width
      const targetPeakX = relativePosition * 398

      const originalPeakX = 199
      const poiWidth = 398 / totalItems
      const curveWidthFactor = 3
      const desiredCurveWidth = curveWidthFactor * poiWidth
      const horizontalScale = desiredCurveWidth / 398

      const scaleX = (x: number) => targetPeakX + (x - originalPeakX) * horizontalScale

      const pathData = `
        M ${scaleX(0.015625)} 24.5635
        L ${scaleX(59.5563)} 22.7638
        C ${scaleX(85.9141)} 21.967 ${scaleX(112.052)} 17.6986 ${scaleX(137.294)} 10.0688
        L ${scaleX(140.648)} 9.05496
        C ${scaleX(178.383)} -2.35118 ${scaleX(218.648)} -2.3512 ${scaleX(256.383)} 9.05495
        L ${scaleX(259.737)} 10.0688
        C ${scaleX(284.979)} 17.6986 ${scaleX(311.117)} 21.967 ${scaleX(337.475)} 22.7638
        L ${scaleX(397.016)} 24.5635
      `

      setPath(pathData.trim().replace(/\s+/g, ' '))
    }

    // Delay to ensure CSS has been applied before calculating positions
    const timeoutId = setTimeout(updatePath, 50)
    updatePath()
    window.addEventListener('resize', updatePath)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePath)
    }
  }, [selectedIndex, totalItems])

  return (
    <svg
      ref={svgRef}
      className="vector-path"
      viewBox="0 0 398 23"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        fill="none"
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  )
}

export default POINavigator
