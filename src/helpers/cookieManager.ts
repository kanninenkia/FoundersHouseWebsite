/**
 * Cookie Consent Manager for GDPR Compliance
 * Manages user cookie preferences for Founders House Ry
 */

export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = 'fh_cookie_consent';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get current cookie preferences from localStorage
 */
export function getCookiePreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading cookie preferences:', error);
  }
  return null;
}

/**
 * Save cookie preferences to localStorage
 */
export function saveCookiePreferences(preferences: CookiePreferences): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    applyCookiePreferences(preferences);
  } catch (error) {
    console.error('Error saving cookie preferences:', error);
  }
}

/**
 * Check if user has made a cookie choice
 */
export function hasConsented(): boolean {
  const preferences = getCookiePreferences();
  return preferences !== null;
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  const preferences: CookiePreferences = {
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: Date.now()
  };
  saveCookiePreferences(preferences);
}

/**
 * Reject all non-necessary cookies
 */
export function rejectAllCookies(): void {
  const preferences: CookiePreferences = {
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now()
  };
  saveCookiePreferences(preferences);
}

/**
 * Apply cookie preferences - initialize/block tracking scripts
 */
export function applyCookiePreferences(preferences: CookiePreferences): void {
  // Analytics cookies (Google Analytics, Hotjar)
  if (preferences.analytics) {
    initializeAnalytics();
  } else {
    blockAnalytics();
  }

  // Marketing cookies
  if (preferences.marketing) {
    initializeMarketing();
  } else {
    blockMarketing();
  }
}

/**
 * Initialize Google Analytics and Hotjar
 */
function initializeAnalytics(): void {
  // Google Analytics
  if (typeof window !== 'undefined' && !(window as any).gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-R1WCS12085'; // Replace with actual GA ID
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function() {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', 'G-R1WCS12085'); // Replace with actual GA ID
  }

  // Hotjar
  if (typeof window !== 'undefined' && !(window as any).hj) {
    (function(h: any, o: any, t: string, j: string, a?: any, r?: any) {
      h.hj = h.hj || function() { (h.hj.q = h.hj.q || []).push(arguments); };
      h._hjSettings = { hjid: 'HOTJAR_ID', hjsv: 6 }; // Replace with actual Hotjar ID
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }
}

/**
 * Block analytics scripts
 */
function blockAnalytics(): void {
  // Disable Google Analytics
  if (typeof window !== 'undefined') {
    (window as any)['ga-disable-G-R1WCS12085'] = true; // Replace with actual GA ID
  }
  
  // Remove Hotjar
  if (typeof window !== 'undefined' && (window as any).hj) {
    delete (window as any).hj;
    delete (window as any)._hjSettings;
  }
}

/**
 * Initialize marketing scripts
 */
function initializeMarketing(): void {
  // Add marketing scripts here (e.g., Facebook Pixel, LinkedIn Insight Tag, etc.)
  // console.log('Marketing cookies enabled');
}

/**
 * Block marketing scripts
 */
function blockMarketing(): void {
  // Block marketing scripts
  // console.log('Marketing cookies disabled');
}

/**
 * Clear all cookie preferences
 */
export function clearCookiePreferences(): void {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch (error) {
    console.error('Error clearing cookie preferences:', error);
  }
}

/**
 * Check if specific category is enabled
 */
export function isCategoryEnabled(category: CookieCategory): boolean {
  const preferences = getCookiePreferences();
  if (!preferences) return false;
  return preferences[category];
}

/**
 * Initialize on page load
 */
export function initializeCookieManager(): void {
  const preferences = getCookiePreferences();
  if (preferences) {
    applyCookiePreferences(preferences);
  }
}
