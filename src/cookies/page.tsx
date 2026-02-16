import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar, Footer } from '../components/layout';
import { 
  getCookiePreferences, 
  saveCookiePreferences, 
  type CookiePreferences 
} from '../helpers/cookieManager';
import '../privacy-policy/page.css';
import './page.css';

export default function CookiesPage() {
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    const saved = getCookiePreferences();
    return saved || {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    };
  });

  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Cookie Settings — Founders House';
  }, []);

  const handleToggle = (category: 'analytics' | 'marketing') => {
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSave = () => {
    const updatedPreferences: CookiePreferences = {
      ...preferences,
      timestamp: Date.now()
    };
    saveCookiePreferences(updatedPreferences);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    };
    setPreferences(allAccepted);
    saveCookiePreferences(allAccepted);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleRejectAll = () => {
    const allRejected: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    };
    setPreferences(allRejected);
    saveCookiePreferences(allRejected);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <div className="legal-page cookies-page">
      <NavBar logoColor="dark" hamburgerColor="#fff" streakColor="#D82E11" />
      
      <main className="legal-content">
        <div className="legal-container">
          <h1>Cookie Settings</h1>
          <p className="last-updated">Last Updated: February 26th, 2026</p>

          <section>
            <h2>About Cookies</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our site.
            </p>
          </section>

          <section className="cookie-controls">
            <h2>Manage Your Cookie Preferences</h2>
            <p>
              You can customize your cookie preferences below. Note that disabling certain cookies 
              may impact your experience on our website.
            </p>

            {showSaved && (
              <div className="save-notification">
                ✓ Your preferences have been saved
              </div>
            )}

            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-info">
                  <h3>Necessary Cookies</h3>
                  <span className="cookie-badge">Always Active</span>
                </div>
                <div className="toggle-switch disabled">
                  <input 
                    type="checkbox" 
                    checked={true}
                    disabled
                    readOnly
                  />
                  <span className="slider"></span>
                </div>
              </div>
              <p>
                These cookies are essential for the website to function properly. They enable basic 
                functions like page navigation and access to secure areas. The website cannot function 
                properly without these cookies.
              </p>
              <div className="cookie-details">
                <strong>Used for:</strong>
                <ul>
                  <li>Remembering your cookie preferences</li>
                  <li>Session management</li>
                  <li>Security features</li>
                </ul>
              </div>
            </div>

            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-info">
                  <h3>Analytics Cookies</h3>
                  <span className="cookie-badge optional">Optional</span>
                </div>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={preferences.analytics}
                    onChange={() => handleToggle('analytics')}
                    id="analytics-toggle"
                  />
                  <label htmlFor="analytics-toggle" className="slider"></label>
                </div>
              </div>
              <p>
                These cookies help us understand how visitors interact with our website by collecting 
                and reporting information anonymously. This data helps us improve our website and services.
              </p>
              <div className="cookie-details">
                <strong>Services used:</strong>
                <ul>
                  <li><strong>Google Analytics:</strong> Tracks page views, user behavior, and traffic sources</li>
                  <li><strong>Hotjar:</strong> Records user interactions and provides heatmaps for UX improvements</li>
                </ul>
                <strong>Data collected:</strong>
                <ul>
                  <li>Pages visited and time spent on each page</li>
                  <li>Click patterns and navigation behavior</li>
                  <li>Device and browser information</li>
                  <li>Anonymized IP addresses</li>
                </ul>
              </div>
            </div>

            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-info">
                  <h3>Marketing Cookies</h3>
                  <span className="cookie-badge optional">Optional</span>
                </div>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={preferences.marketing}
                    onChange={() => handleToggle('marketing')}
                    id="marketing-toggle"
                  />
                  <label htmlFor="marketing-toggle" className="slider"></label>
                </div>
              </div>
              <p>
                These cookies are used to track visitors across websites. They are used to display 
                ads that are relevant and engaging for individual users, making them more valuable 
                for publishers and third-party advertisers.
              </p>
              <div className="cookie-details">
                <strong>Used for:</strong>
                <ul>
                  <li>Delivering targeted advertising</li>
                  <li>Measuring ad campaign effectiveness</li>
                  <li>Retargeting and remarketing</li>
                  <li>Social media integration</li>
                </ul>
              </div>
            </div>

            <div className="cookie-actions">
              <button className="cookie-save-btn primary" onClick={handleSave}>
                Save Preferences
              </button>
              <button className="cookie-save-btn secondary" onClick={handleAcceptAll}>
                Accept All
              </button>
              <button className="cookie-save-btn secondary" onClick={handleRejectAll}>
                Reject All
              </button>
            </div>
          </section>

          <section>
            <h2>How to Manage Cookies in Your Browser</h2>
            <p>
              Most web browsers allow you to control cookies through their settings. You can usually 
              find these settings in the "Options" or "Preferences" menu of your browser. Here are 
              links to cookie settings for popular browsers:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>
            <p>
              Please note that blocking all cookies may prevent you from using certain features of our website.
            </p>
          </section>

          <section>
            <h2>Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we use various third-party services that may set cookies 
              on your device. These third parties have their own privacy policies:
            </p>
            <ul>
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
              <li><a href="https://www.hotjar.com/legal/policies/privacy/" target="_blank" rel="noopener noreferrer">Hotjar Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at 
              team@foundershouse.fi or visit our <Link to="/privacy-policy">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
