import { useState, useEffect, useRef } from 'react'
import { POINTS_OF_INTEREST, type PointOfInterest } from '../constants/poi'
import './POINavigator.css'

interface POINavigatorProps {
  onPOISelect?: (poi: PointOfInterest) => void
  initialPOI?: string
}

export const POINavigator = ({ onPOISelect, initialPOI = 'FOUNDERS_HOUSE' }: POINavigatorProps) => {
  const [selectedPOI, setSelectedPOI] = useState<string>(initialPOI)

  // Convert POI object to array for easier mapping
  const poiList = Object.entries(POINTS_OF_INTEREST).map(([key, poi]) => ({
    key,
    ...poi
  }))

  const handlePOIClick = (poiKey: string, poi: PointOfInterest) => {
    setSelectedPOI(poiKey)
    onPOISelect?.(poi)
  }

  // Calculate the selected index for the vector path
  const selectedIndex = poiList.findIndex(poi => poi.key === selectedPOI)

  return (
    <div className="poi-navigator">
      <div className="poi-list">
        {poiList.map((poi) => (
          <button
            key={poi.key}
            className={`poi-item ${selectedPOI === poi.key ? 'active' : ''}`}
            onClick={() => handlePOIClick(poi.key, poi)}
          >
            {poi.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Vector path component - peaks at the highlighted POI */}
      <VectorPath selectedIndex={selectedIndex} totalItems={poiList.length} />
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
