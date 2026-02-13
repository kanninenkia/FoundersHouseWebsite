# Privacy & Cookie Management Implementation

This implementation adds GDPR-compliant privacy policy and cookie management features to the Founders House website.

## Files Created

### Core Functionality
- **`src/helpers/cookieManager.ts`**: Cookie consent management utility with GDPR compliance
  - Handles user preferences for necessary, analytics, and marketing cookies
  - Integrates with Google Analytics and Hotjar
  - Provides localStorage-based persistence

### Components
- **`src/components/ui/CookieBanner.tsx`**: Cookie consent banner component
  - Appears on first visit to inform users about cookies
  - Provides Accept All, Reject All, and Customize options
  - Links to Privacy Policy and Cookie Settings pages

### Pages
- **`src/privacy-policy/page.tsx`**: Comprehensive privacy policy page
  - GDPR-compliant privacy policy
  - Information about data collection and usage
  - User rights under GDPR
  - Contact information for privacy inquiries

- **`src/cookies/page.tsx`**: Interactive cookie settings page
  - Toggle switches for analytics and marketing cookies
  - Detailed explanations of each cookie category
  - Save preferences functionality
  - Accept/Reject all options

### Styling
- **`src/components/ui/CookieBanner.css`**: Cookie banner styles
- **`src/privacy-policy/page.css`**: Legal page styles (shared with cookies page)
- **`src/cookies/page.css`**: Cookie settings specific styles

## Configuration Required

Before deploying to production, update the following placeholders in `src/helpers/cookieManager.ts`:

1. **Google Analytics ID**: Replace `'GA_MEASUREMENT_ID'` with your actual Google Analytics tracking ID
2. **Hotjar ID**: Replace `'HOTJAR_ID'` with your actual Hotjar site ID

Example:
```typescript
// Line ~98
script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
// Change to:
script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';

// Line ~105
(window as any).gtag('config', 'GA_MEASUREMENT_ID');
// Change to:
(window as any).gtag('config', 'G-XXXXXXXXXX');

// Line ~113
h._hjSettings = { hjid: 'HOTJAR_ID', hjsv: 6 };
// Change to:
h._hjSettings = { hjid: 1234567, hjsv: 6 };
```

## Features

### Cookie Banner
- Appears automatically on first visit
- Shows at the bottom of the screen with a slide-up animation
- Z-index of 10000 ensures it's always visible
- Dismisses after user makes a choice
- Persists choice in localStorage

### Cookie Categories

1. **Necessary Cookies** (Always active)
   - Essential for website functionality
   - Cannot be disabled
   - Used for session management and security

2. **Analytics Cookies** (Optional)
   - Google Analytics
   - Hotjar
   - Helps improve user experience

3. **Marketing Cookies** (Optional)
   - For targeted advertising
   - Social media integration
   - Retargeting capabilities

### GDPR Compliance

The implementation includes:
- Clear cookie consent banner
- Granular cookie preferences
- Easy opt-out mechanism
- Privacy policy detailing data usage
- Information about user rights (access, rectification, erasure, etc.)
- Contact information for privacy inquiries

## Routes Added

- `/privacy-policy` - Privacy Policy page
- `/cookies` - Cookie Settings page

Both routes are integrated into:
- App.tsx routing
- Footer navigation links

## Testing

To test the cookie management:

1. **First Visit**: Cookie banner should appear after 1 second
2. **Accept All**: Should save preferences and hide banner
3. **Reject All**: Should only enable necessary cookies
4. **Customize**: Should navigate to /cookies page
5. **Cookie Settings Page**: Toggle switches should work and persist choices
6. **Return Visit**: Banner should not appear if choice was made

Check browser console for cookie initialization messages.

## Legal Notes

This implementation provides a foundation for GDPR compliance. However, you should:

1. Review the privacy policy with legal counsel
2. Ensure all data collection practices are accurately described
3. Update contact information (currently placeholder: privacy@foundershouse.fi)
4. Add actual company address and registration details
5. Consider additional compliance for other jurisdictions (CCPA, etc.)

## Future Enhancements

Potential improvements:
- Add cookie audit trail
- Implement server-side consent management
- Add A/B testing for cookie banner designs
- Integrate with Consent Management Platform (CMP)
- Add more detailed cookie tables with expiry information
