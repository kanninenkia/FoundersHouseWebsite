import React from 'react'
import './Footer.css'
import { motion } from 'framer-motion'

interface FooterProps {
  footerOpacity?: number
}

const Footer: React.FC<FooterProps> = ({ footerOpacity = 1 }) => {
  if (footerOpacity === 0) return null

  return (
    <motion.footer
      className="footer"
      style={{
        opacity: footerOpacity,
        pointerEvents: footerOpacity > 0 ? 'auto' : 'none',
      }}
    >
      {/* Section 1: Sponsor / Partner Logos Row */}
      <div className="footer-sponsors">
        <div className="sponsor-logos">
          <img
            src="/logos/companyLogos/Mask group.svg"
            alt="SLUSH"
            className="sponsor-logo"
          />
          <img
            src="/logos/companyLogos/Mask group-1.svg"
            alt="Yksityisyrittäjäin Säätiö"
            className="sponsor-logo"
          />
          <img
            src="/logos/companyLogos/Mask group-3.svg"
            alt="LifeLine Ventures"
            className="sponsor-logo"
          />
          <img
            src="/logos/companyLogos/illusian_logo 1.svg"
            alt="Illusian"
            className="sponsor-logo"
          />
          <img
            src="/logos/companyLogos/Mask group-4.svg"
            alt="Sitra"
            className="sponsor-logo"
          />
          <img
            src="/logos/companyLogos/Mask group-5.svg"
            alt="Helsinki"
            className="sponsor-logo"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="footer-divider" />

      {/* Section 2: Footer Content Area */}
      <div className="footer-content">
        {/* Left Column: Brand Logo */}
        <div className="footer-brand">
          <a href="/">
            <img
              src="/logos/FHLOGO-footer.svg"
              alt="Founders House"
              className="footer-logo"
            />
          </a>
        </div>

        {/* Center: Footer Navigation Links */}
        <div className="footer-links">
          {/* Column 1: Map */}
          <div className="footer-column">
            <a href="/" className="footer-link footer-heading">MAP</a>
            <a href="/home" className="footer-link">HOME</a>
          </div>

          {/* Column 2: About */}
          <div className="footer-column">
            <a href="/about" className="footer-link footer-heading">ABOUT</a>
            <a href="/events" className="footer-link">EVENTS</a>
          </div>

          {/* Column 3: News */}
          <div className="footer-column">
            <a href="/news" className="footer-link footer-heading">NEWS</a>
            <a href="/privacy" className="footer-link">PRIVACY POLICIES</a>
          </div>
        </div>

        {/* Right Column: Contact Info */}
        <div className="footer-contact">
          <a href="mailto:contact@founders-house.com" className="footer-link">
            CONTACT@FOUNDERS-HOUSE.COM
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            LINKEDIN
          </a>
          <p className="footer-address">SÄHKÖTALO, 00100 HELSINKI</p>
        </div>
      </div>
    </motion.footer>
  )
}

export default Footer
