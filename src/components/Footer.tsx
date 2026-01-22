import React from 'react'
import './Footer.css'
import { MagneticElement } from './MagneticElement'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
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
            src="/logos/companyLogos/Mask group-2.svg"
            alt="Supercell"
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
            <MagneticElement strength={0.3} range={80}>
              <a href="/" className="footer-link footer-heading">MAP</a>
            </MagneticElement>
            <MagneticElement strength={0.3} range={80}>
              <a href="/home" className="footer-link">HOME</a>
            </MagneticElement>
          </div>

          {/* Column 2: About */}
          <div className="footer-column">
            <MagneticElement strength={0.3} range={80}>
              <a href="/about" className="footer-link footer-heading">ABOUT</a>
            </MagneticElement>
            <MagneticElement strength={0.3} range={80}>
              <a href="/events" className="footer-link">EVENTS</a>
            </MagneticElement>
          </div>

          {/* Column 3: News */}
          <div className="footer-column">
            <MagneticElement strength={0.3} range={80}>
              <a href="/join" className="footer-link footer-heading">JOIN</a>
            </MagneticElement>
            <MagneticElement strength={0.3} range={80}>
              <a href="/privacy" className="footer-link">PRIVACY POLICIES</a>
            </MagneticElement>
          </div>
        </div>

        {/* Right Column: Contact Info */}
        <div className="footer-contact">
          <MagneticElement strength={0.3} range={80}>
            <a href="mailto:contact@founders-house.com" className="footer-link">
              CONTACT@FOUNDERS-HOUSE.COM
            </a>
          </MagneticElement>
          <MagneticElement strength={0.3} range={80}>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              LINKEDIN
            </a>
          </MagneticElement>
          <p className="footer-address">SÄHKÖTALO, 00100 HELSINKI</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
