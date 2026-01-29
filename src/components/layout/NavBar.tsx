/**
 * NavBar - Unified navigation component
 * Logo on left, Hamburger menu on right
 * Used across all pages for consistent navigation
 */

import { useState } from 'react'
import { AnimatedHamburger } from '../ui'
import { FullScreenMenu } from './FullScreenMenu'
import './NavBar.css'

interface NavBarProps {
  logoColor?: 'light' | 'dark' // 'light' = logo.svg (red), 'dark' = logoWhite.png
  hamburgerColor?: string
  className?: string
  style?: React.CSSProperties
  opacity?: number // Control visibility with smooth transition
  onMenuChange?: (isOpen: boolean) => void // Callback when menu state changes
}

export const NavBar = ({ 
  logoColor = 'light', 
  hamburgerColor = '#D82E11',
  className = '',
  style = {},
  opacity = 1,
  onMenuChange
}: NavBarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    const newState = !isMenuOpen
    setIsMenuOpen(newState)
    onMenuChange?.(newState)
  }

  const logoSrc = logoColor === 'light' 
    ? '/assets/logos/FH_Helsinki_Logo.webp' 
    : '/assets/logos/FH_Helsinki_Logo_Light.webp'

  return (
    <>
      <nav className={`navbar ${className}`} style={style}>
        {/* Logo - Top Left */}
        <div 
          className="navbar-logo-container"
          style={{
            opacity,
            transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: opacity > 0 ? 'auto' : 'none'
          }}
        >
          <img src={logoSrc} alt="Founders House Logo" className="navbar-logo" />
        </div>

        {/* Hamburger Menu - Top Right */}
        <div 
          className="navbar-hamburger"
          style={{
            opacity,
            transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: opacity > 0 ? 'auto' : 'none'
          }}
        >
          <AnimatedHamburger
            isOpen={isMenuOpen}
            onClick={handleMenuToggle}
            color={hamburgerColor}
          />
        </div>
      </nav>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => {
        setIsMenuOpen(false)
        onMenuChange?.(false)
      }} />
    </>
  )
}