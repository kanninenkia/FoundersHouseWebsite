import React from 'react'
import { TransitionLink } from '../ui/TransitionLink'
import './Footer.css'
import { MagneticElement } from '../ui'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      {/* Section 1: Sponsor / Partner Logos Row */}
      <div className="footer-sponsors">
        <div className="sponsor-logos">
          <img
            src="/assets/logos/partners/Mask group.svg"
            alt="SLUSH"
            className="sponsor-logo"
          />
          <img
            src="/assets/logos/partners/Mask group-1.svg"
            alt="Yksityisyrittäjäin Säätiö"
            className="sponsor-logo"
          />
          <img
            src="/assets/logos/partners/Mask group-3.svg"
            alt="LifeLine Ventures"
            className="sponsor-logo"
          />
          <img
            src="/assets/logos/partners/illusian_logo 1.svg"
            alt="Illusian"
            className="sponsor-logo"
          />
          <img
            src="/assets/logos/partners/Mask group-4.svg"
            alt="Sitra"
            className="sponsor-logo"
          />
          <img
            src="/assets/logos/partners/Mask group-5.svg"
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
          <TransitionLink to="/">
            <img
              src="/assets/logos/FHLOGO-footer.svg"
              alt="Founders House"
              className="footer-logo"
            />
          </TransitionLink>
        </div>

        {/* Center: Footer Navigation Links */}
        <div className="footer-links">
          {/* Column 1: Map */}
          <div className="footer-column">
            <MagneticElement strength={0.3} range={80}>
              <TransitionLink to="/" className="footer-link footer-heading">MAP</TransitionLink>
            </MagneticElement>
            <MagneticElement strength={0.3} range={80}>
              <TransitionLink to="/home" className="footer-link">HOME</TransitionLink>
            </MagneticElement>
          </div>

          {/* Column 2: About */}
          <div className="footer-column">
            <MagneticElement strength={0.3} range={80}>
              <TransitionLink to="/about" className="footer-link footer-heading">ABOUT</TransitionLink>
            </MagneticElement>
            <MagneticElement strength={0.3} range={80}>
              <TransitionLink to="/events" className="footer-link">EVENTS</TransitionLink>
            </MagneticElement>
          </div>

          {/* Column 3: Join & Legal */}
          <div className="footer-column">
            <MagneticElement strength={0.3} range={80}>
              <TransitionLink to="/join" className="footer-link footer-heading">JOIN</TransitionLink>
            </MagneticElement>
            <MagneticElement strength={0.3} range={80}>
              <TransitionLink to="/privacy-policy" className="footer-link">PRIVACY POLICY</TransitionLink>
            </MagneticElement>
            <MagneticElement strength={0.3} range={80}>
              <TransitionLink to="/cookies" className="footer-link">COOKIES</TransitionLink>
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
              href="https://www.linkedin.com/company/founders-house-helsinki/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              LINKEDIN
            </a>
          </MagneticElement>
          <MagneticElement strength={0.3} range={80}>
            <a
              href="https://www.instagram.com/foundershousehelsinki/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              INSTAGRAM
            </a>
          </MagneticElement>
          <p className="footer-address">SÄHKÖTALO, 00100 HELSINKI</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
