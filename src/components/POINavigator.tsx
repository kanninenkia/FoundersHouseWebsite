import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { POINTS_OF_INTEREST, type PointOfInterest } from '../constants/poi'
import './POINavigator.css'

interface POINavigatorProps {
  onPOISelect?: (poi: PointOfInterest) => void
  initialPOI?: string
}

export const POINavigator = ({ onPOISelect, initialPOI = 'FOUNDERS_HOUSE' }: POINavigatorProps) => {
  const [selectedPOI, setSelectedPOI] = useState<string>(initialPOI)
  const [focusedIndex, setFocusedIndex] = useState(5)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isInitialAnimationComplete, setIsInitialAnimationComplete] = useState(false)

  const poiList = Object.entries(POINTS_OF_INTEREST).map(([key, poi]) => ({
    key,
    ...poi
  }))

  const handlePOIClick = (poiKey: string, poi: PointOfInterest) => {
    setSelectedPOI(poiKey)
    onPOISelect?.(poi)
  }

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

  const getInitialX = (index: number): number => {
    if (index === centerIndex) return 0

    const distanceFromCenter = Math.abs(index - centerIndex)
    const pixelsPerStep = 120
    const totalDistance = distanceFromCenter * pixelsPerStep

    // Items on LEFT start to the right (positive), items on RIGHT start to the left (negative)
    const direction = index < centerIndex ? 1 : -1
    return direction * totalDistance
  }

  return (
    <motion.div
      className="poi-navigator"
      role="navigation"
      aria-label="Points of interest"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <div className="poi-list" role="tablist">
        {poiList.map((poi, index) => {
          const isActive = selectedPOI === poi.key
          const isFocused = index === focusedIndex
          const isHovered = hoveredIndex === index
          const isCenter = index === centerIndex

          return (
            <POIButton
              key={poi.key}
              poi={poi}
              index={index}
              isActive={isActive}
              isFocused={isFocused}
              isHovered={isHovered}
              isCenter={isCenter}
              hoveredIndex={hoveredIndex}
              centerIndex={centerIndex}
              initialX={getInitialX(index)}
              onClick={() => handlePOIClick(poi.key, poi)}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              onAnimationComplete={() => {
                if (!isInitialAnimationComplete) {
                  setIsInitialAnimationComplete(true)
                }
              }}
            />
          )
        })}
      </div>

      {/* Vector path component - peaks at the highlighted POI */}
      <VectorPath
        selectedIndex={selectedIndex}
        totalItems={poiList.length}
        isReady={isInitialAnimationComplete}
      />

      <motion.div
        className="gradient-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          delay: 0.2, 
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div className="gradient-blur-overlay"></div>
      </motion.div>
    </motion.div>
  )
}

interface POIButtonProps {
  poi: { key: string; name: string }
  index: number
  isActive: boolean
  isFocused: boolean
  isHovered: boolean
  isCenter: boolean
  hoveredIndex: number | null
  centerIndex: number
  initialX: number
  onClick: () => void
  onHoverStart: () => void
  onHoverEnd: () => void
  onAnimationComplete: () => void
}

const POIButton = ({
  poi,
  isActive,
  isFocused,
  isCenter,
  initialX,
  onClick,
  onHoverStart,
  onHoverEnd,
  onAnimationComplete
}: POIButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 28, stiffness: 400, mass: 0.5 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    const maxDistance = 100
    const strength = Math.max(0, 1 - distance / maxDistance)

    mouseX.set(distanceX * 0.2 * strength)
    mouseY.set(distanceY * 0.2 * strength)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    onHoverEnd()
  }

  const delay = isCenter ? 0 : 0.2

  return (
    <motion.button
      ref={buttonRef}
      className={`poi-item ${isActive ? 'active' : ''} ${isFocused ? 'keyboard-focused' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={onHoverStart}
      onMouseLeave={handleMouseLeave}
      role="tab"
      aria-selected={isActive}
      aria-label={`Point of interest: ${poi.name}`}
      tabIndex={0}
      initial={{
        opacity: 0,
        x: initialX,
        scale: 0.4
      }}
      animate={{
        opacity: isActive ? 1 : 0.6,
        x: 0,
        scale: 1
      }}
      transition={{
        opacity: { duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] },
        x: { duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }
      }}
      whileHover={{
        scale: 1.05,
        y: -2,
        transition: { 
          type: 'spring', 
          stiffness: 400, 
          damping: 28,
          mass: 0.5
        }
      }}
      whileTap={{
        scale: 0.95,
        transition: { 
          type: 'spring', 
          stiffness: 600, 
          damping: 30,
          mass: 0.3
        }
      }}
      onAnimationComplete={onAnimationComplete}
      style={{
        x,
        y,
        cursor: 'pointer'
      }}
    >
      {poi.name.toUpperCase()}
    </motion.button>
  )
}

interface VectorPathProps {
  selectedIndex: number
  totalItems: number
  isReady: boolean
}

const VectorPath = ({ selectedIndex, totalItems, isReady }: VectorPathProps) => {
  const [path, setPath] = useState<string>('')
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!isReady) return

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

    updatePath()

    window.addEventListener('resize', updatePath)
    return () => {
      window.removeEventListener('resize', updatePath)
    }
  }, [selectedIndex, totalItems, isReady])

  return (
    <motion.svg
      ref={svgRef}
      className="vector-path"
      viewBox="0 0 398 23"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: isReady ? 1 : 0 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <motion.path
        d={path}
        fill="none"
        stroke="white"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isReady ? 1 : 0 }}
        transition={{
          delay: 0.15,
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1]
        }}
      />
    </motion.svg>
  )
}

export default POINavigator
