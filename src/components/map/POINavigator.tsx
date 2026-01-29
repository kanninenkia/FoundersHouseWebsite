import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { POINTS_OF_INTEREST, type PointOfInterest } from '../../constants/poi'
import './POINavigator.css'
import './POINavigatorMobile.css'

interface POINavigatorProps {
  onPOISelect?: (poi: PointOfInterest) => void
  initialPOI?: string
}

export const POINavigator = ({ onPOISelect, initialPOI = 'FOUNDERS_HOUSE' }: POINavigatorProps) => {
  const [selectedPOI, setSelectedPOI] = useState<string>(initialPOI)
  const [focusedIndex, setFocusedIndex] = useState(5)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isInitialAnimationComplete, setIsInitialAnimationComplete] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [fanMaxRise, setFanMaxRise] = useState(160)

  const poiList = Object.entries(POINTS_OF_INTEREST).map(([key, poi]) => ({
    key,
    ...poi
  }))

  const handlePOIClick = (poiKey: string, poi: PointOfInterest) => {
    setSelectedPOI(poiKey)
    onPOISelect?.(poi)
    setIsMobileMenuOpen(false)
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

  useEffect(() => {
    const updateFanRise = () => {
      const target = Math.round(window.innerHeight * 0.15)
      const minGap = 30
      const minRise = Math.max(0, poiList.length - 1) * minGap
      const desiredRise = Math.max(minRise, target)
      const clamped = Math.max(120, Math.min(360, desiredRise))
      setFanMaxRise(clamped)
    }

    updateFanRise()
    window.addEventListener('resize', updateFanRise)
    return () => window.removeEventListener('resize', updateFanRise)
  }, [poiList.length])

  // Calculate the selected index for the vector path
  const selectedIndex = poiList.findIndex(poi => poi.key === selectedPOI)

  // Calculate expansion offset from center (Founders House is center at index 5)
  const centerIndex = 5 // FOUNDERS_HOUSE position
  const fanCenterIndex = Math.floor(poiList.length / 2)
  const foundersHouseIndex = poiList.findIndex((poi) => poi.key === 'FOUNDERS_HOUSE')
  const leadClosedX = 0

  const getFanOffset = (index: number) => {
    const distanceFromCenter = Math.abs(index - fanCenterIndex)
    const maxDistance = Math.max(1, fanCenterIndex)

    const rank = maxDistance - distanceFromCenter
    const stepY = fanMaxRise / Math.max(1, poiList.length - 1)
    const y = -(index * stepY)

    const baseX = 14
    const stepX = 28
    const magnitude = maxDistance - Math.abs(index - fanCenterIndex)
    const x = -(baseX + magnitude * stepX)
    return { x, y }
  }

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
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
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

      <div className={`poi-fan ${isMobileMenuOpen ? 'open' : ''}`} aria-hidden={!isMobileMenuOpen}>
        {poiList
          .filter((poi) => poi.key !== 'FOUNDERS_HOUSE')
          .map((poi, index) => {
            const isActive = selectedPOI === poi.key
            const offset = getFanOffset(index >= foundersHouseIndex ? index + 1 : index)
            return (
              <motion.button
                key={`fan-${poi.key}`}
                className={`poi-fan-item ${isActive ? 'active' : ''}`}
                onClick={() => handlePOIClick(poi.key, poi)}
                aria-label={`Point of interest: ${poi.name}`}
                initial={false}
                animate={{
                  opacity: isMobileMenuOpen ? 1 : 0,
                  x: isMobileMenuOpen ? offset.x : leadClosedX,
                  y: isMobileMenuOpen ? offset.y : 0,
                  scale: isMobileMenuOpen ? 1 : 0.9
                }}
                transition={{
                  duration: 0.45,
                  delay: isMobileMenuOpen ? index * 0.04 : 0,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                {poi.name.toUpperCase()}
              </motion.button>
            )
          })}

        {foundersHouseIndex >= 0 && (
          <motion.button
            className={`poi-fan-lead ${selectedPOI === 'FOUNDERS_HOUSE' ? 'active' : ''}`}
            onClick={() => handlePOIClick('FOUNDERS_HOUSE', poiList[foundersHouseIndex])}
            aria-label="Point of interest: Founders House"
            initial={false}
            animate={{
              x: isMobileMenuOpen ? getFanOffset(foundersHouseIndex).x : leadClosedX,
              y: isMobileMenuOpen ? getFanOffset(foundersHouseIndex).y : 0
            }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            FOUNDERS HOUSE
          </motion.button>
        )}

        <button
          className="poi-fan-toggle"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close points of interest' : 'Open points of interest'}
        >
          <span className="poi-fan-toggle-icon" />
        </button>
      </div>

      <motion.div
        className="gradient-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
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

  const handleMouseLeave = () => {
    onHoverEnd()
  }

  const delay = isCenter ? 0 : 0.2

  return (
    <motion.button
      ref={buttonRef}
      className={`poi-item ${isActive ? 'active' : ''} ${isFocused ? 'keyboard-focused' : ''}`}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={handleMouseLeave}
      role="tab"
      aria-selected={isActive}
      aria-label={`Point of interest: ${poi.name}`}
      tabIndex={0}
      initial={{
        opacity: 0,
        x: initialX,
        scale: 0.8
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
      if (!buttons.length || !svg || totalItems <= 0 || selectedIndex < 0) return

      const selectedButton = buttons[selectedIndex]
      if (!selectedButton) return

      const svgRect = svg.getBoundingClientRect()
      if (svgRect.width === 0) return
      const buttonRect = selectedButton.getBoundingClientRect()

      const buttonCenterX = buttonRect.left + buttonRect.width / 2
      const svgLeft = svgRect.left
      const relativePosition = (buttonCenterX - svgLeft) / svgRect.width
      if (!Number.isFinite(relativePosition)) return
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