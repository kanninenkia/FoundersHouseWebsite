import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
          <Link 
            to="/cookies" 
            className="cookie-btn cookie-btn-customize"
          >
            Customize
          </Link>
          <button 
            className="cookie-btn cookie-btn-accept" 
            onClick={handleAcceptAll}
          >
            Accept All
          </button>
        </div>
        <div className="cookie-banner-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span className="separator">•</span>
          <Link to="/cookies">Cookie Settings</Link>
        </div>
      </div>
    </div>
  );
}
