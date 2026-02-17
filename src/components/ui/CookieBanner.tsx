import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TransitionLink } from './TransitionLink';
import { hasConsented, acceptAllCookies, rejectAllCookies } from '../../helpers/cookieManager';
import './CookieBanner.css';

interface CookieBannerProps {
  onChoice?: () => void;
}

export default function CookieBanner({ onChoice }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user has already made a choice
    if (!hasConsented()) {
      // Show banner after a short delay
      setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setIsVisible(false);
    onChoice?.();
  };

  const handleRejectAll = () => {
    rejectAllCookies();
    setIsVisible(false);
    onChoice?.();
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-content">
        <div className="cookie-banner-text">
          <h3>Cookie Consent</h3>
          <p>
            We use cookies for analytics, optimization, and marketing.
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button
            className="cookie-btn cookie-btn-reject"
            onClick={handleRejectAll}
          >
            Reject All
          </button>
          <TransitionLink
            to="/cookies"
            className="cookie-btn cookie-btn-customize"
          >
            Customize
          </TransitionLink>
          <button
            className="cookie-btn cookie-btn-accept"
            onClick={handleAcceptAll}
          >
            Accept All
          </button>
        </div>
        <div className="cookie-banner-links">
          <TransitionLink to="/privacy-policy">Privacy Policy</TransitionLink>
          <span className="separator">•</span>
          <TransitionLink to="/cookies">Cookie Settings</TransitionLink>
        </div>
      </div>
    </div>
  );
}
