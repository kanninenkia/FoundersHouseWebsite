# Founders House Website

> An immersive 3D web experience featuring a cinematic intro animation with interactive map exploration, multi-page navigation, and dynamic content management.

Built with React, TypeScript, Three.js, and Framer Motion, this project showcases advanced rendering techniques including custom GLSL shaders, post-processing effects, smooth page transitions, and a content-first architecture for easy editing.

---

## ✨ Features

### Core Experience
- **Interactive 3D Map** - High-detail Helsinki GLB model with DRACO compression
- **Cinematic Intro Animation** - Smooth camera journey with cubic-bezier easing
- **Multi-Page Navigation** - Home, About, Join, and Events pages with smooth transitions
- **Content Management System** - Centralized content files for easy text editing
- **Pixelated Page Transitions** - Smooth wipe animations between pages
- **Custom Post-Processing** - Edge detection and organic noise textures

### Visual Effects
- **Loading Animations** - Smooth pixel reveal and progress tracking
- **Dynamic Lighting** - Day/night mode with adaptive color schemes
- **Parallax Motion** - Mouse-responsive depth effects throughout
- **Smooth Scroll** - Lenis-powered smooth scrolling on all pages
- **Animated Text Reveals** - Red wipe effects and text shuffle animations
- **Responsive Design** - Adapts to all screen sizes with mobile-specific layouts

### Pages
- **Map Intro (/)** - 3D Helsinki map with interactive POI navigation
- **Home (/home)** - Hero section with floating elements and quote cards
- **About (/about)** - Team profiles with hover interactions
- **Join (/join)** - Membership types (Resident & Member) with application info
- **Events (/events)** - Horizontal scrolling event cards with shuffle text

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Modern browser with WebGL 2 support

### Installation

```bash
# Clone the repository
git clone https://github.com/abdirizaqali01/foundershouse1.git
cd foundershouse1

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📝 Content Editing

**Non-developers can easily edit text content** without touching any code!

All editable content is centralized in these files:

- **Home Page**: `src/home/home-content.ts`
- **About Page**: `src/about/about-content.ts`
- **Join Page**: `src/join/join-content.ts`
- **Events Page**: `src/events/hooks/events-data.ts`

**See [CONTENT_EDITING_GUIDE.md](CONTENT_EDITING_GUIDE.md) for detailed instructions.**

### Quick Example

```typescript
// src/home/home-content.ts
export const homeContent = {
  hero: {
    line1: "WE BRING EXCEPTIONAL YOUNG",  // ← Edit this text
    line2: "TALENT UNDER ONE ROOF,",      // ← Or this
  },
  // ... more content
}
```

---

## 🏗️ Architecture

### Project Structure

```
foundershouse1/
├── src/
│   ├── about/              # About page
│   │   ├── about-content.ts      # ← EDIT: About page text
│   │   ├── page.tsx              # About page component
│   │   └── page.css              # Styles
│   ├── animation/          # 3D camera animation system
│   │   ├── smoothPOIAnimation.ts # POI camera transitions
│   │   └── index.ts
│   ├── components/         # Reusable UI components
│   │   ├── layout/               # NavBar, Footer, Menu
│   │   ├── map/                  # 3D map components
│   │   ├── transitions/          # Page transition effects
│   │   └── ui/                   # Buttons, animations
│   ├── constants/          # Design system & configuration
│   │   ├── designSystem.ts       # Colors, fonts
│   │   ├── poi.ts                # Points of Interest data
│   │   └── cameraConfig.ts       # Camera presets
│   ├── core/              # Core 3D scene management
│   │   ├── HelsinkiScene.ts      # Main scene orchestrator
│   │   ├── HelsinkiCameraController.ts
│   │   └── managers/             # Scene managers
│   ├── effects/           # Visual effects
│   │   ├── fogManager.ts         # Fog control
│   │   ├── GridDistortion.tsx    # Grid distortion effect
│   │   └── ParallaxMotion.tsx    # Parallax motion wrapper
│   ├── events/            # Events page
│   │   ├── hooks/
│   │   │   └── events-data.ts    # ← EDIT: Events content
│   │   ├── page.tsx
│   │   └── page.css
│   ├── helpers/           # Utility functions
│   │   ├── cameraUtils.ts        # Camera math helpers
│   │   ├── geometryHelpers.ts    # Mesh utilities
│   │   └── pageMeta.ts           # SEO metadata
│   ├── home/              # Home page
│   │   ├── home-content.ts       # ← EDIT: Home page text
│   │   ├── Home.tsx
│   │   ├── components/           # Hero components
│   │   └── styles/               # Page styles
│   ├── join/              # Join page
│   │   ├── join-content.ts       # ← EDIT: Join page text
│   │   ├── page.tsx
│   │   └── page.css
│   ├── loaders/           # 3D model loading
│   │   └── dualModelLoader.ts    # GLB loader with DRACO
│   ├── rendering/         # Rendering pipeline
│   │   ├── lighting.ts           # Scene lighting setup
│   │   └── postProcessing.ts     # Shader post-processing
│   ├── shaders/           # GLSL shader programs
│   │   ├── postProcessFragment.glsl
│   │   └── postProcessVertex.glsl
│   ├── App.tsx            # Root component with routing
│   ├── main.tsx           # Application entry point
│   └── App.css            # Global styles
├── public/                # Static assets
│   ├── models/
│   │   └── fh.glb         # Helsinki 3D model
│   └── assets/            # Images, logos, icons
├── CONTENT_EDITING_GUIDE.md  # ← Content editing instructions
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 19.0.0 |
| **TypeScript** | Type safety | 5.6.2 |
| **Three.js** | 3D rendering | 0.160.0 |
| **Framer Motion** | Animations | 11.15.0 |
| **React Router** | Page navigation | 7.1.1 |
| **Lenis** | Smooth scrolling | 1.1.17 |
| **Vite** | Build tooling | 7.2.4 |
| **GLSL** | Custom shaders | ES 3.00 |

---

## 🎨 3D Map System

### Scene Management

The 3D Helsinki map is powered by a sophisticated scene management system:

**HelsinkiScene.ts** - Core scene orchestrator
- Model loading with DRACO compression
- Material setup and optimization
- Lighting configuration (day/night modes)
- Camera controller integration
- Resource cleanup on unmount

**Camera System**
- **Cinematic Intro** - 5-second camera sweep from aerial view to street level
- **POI Navigation** - Smooth transitions between Points of Interest
- **Interactive Controls** - OrbitControls with boundary constraints
- **Auto-Tour Mode** - Automated POI cycling with smooth animations

**Loading & Caching**
- Model cached after first load for instant subsequent visits
- Shader compilation cached by WebGL
- Cleanup/dispose pattern prevents memory leaks
- Progress tracking during initial load

### Points of Interest (POI)

Interactive locations on the map with:
- Custom marker rendering
- Smooth camera animations between POIs
- Hover effects and click interactions
- Auto-tour functionality with configurable timing

### Visual Effects

**Post-Processing Pipeline**
- Custom GLSL fragment/vertex shaders
- Edge detection for stylized look
- Organic noise texture overlay
- Performance optimizations

**Dynamic Effects**
- Volumetric fog with depth-based falloff
- Day/night lighting transitions
- Parallax motion based on mouse position
- Smooth scroll-based animations

---

## 🎯 Page Transitions

### Pixel Block Animation

Pages transition using a sophisticated pixel block reveal system:

**TransitionOverlay.tsx** - Main transition controller
- Generates grid of animated blocks (30x17 on desktop)
- Cubic-bezier easing for smooth motion
- Staggered timing creates wave effect
- Configurable colors per transition

**How It Works:**
1. User clicks navigation link
2. Pixel blocks animate in to cover screen
3. Route changes while screen is covered
4. Blocks animate out revealing new page
5. Animation state cleaned up

**Performance:**
- Hardware-accelerated CSS transforms
- Framer Motion's optimized animation engine
- No layout thrashing or reflows
- Smooth 60fps transitions

---

## 🎬 Animations

### Camera Animations

**Intro Sequence** (`animation/index.ts`)
- Cubic-bezier easing (0.4, 0.0, 0.2, 1.0)
- 5-second duration from sky to ground level
- Smooth POI approach with focal point targeting

**POI Transitions** (`animation/smoothPOIAnimation.ts`)
- Dynamic duration based on distance
- Quaternion-based rotation interpolation
- Smooth deceleration curves

### Text Animations

**Red Wipe Effect** - Used throughout for text reveals
- Left-to-right red bar sweep
- Text fades in after wipe
- CSS animation with `@keyframes`

**Text Shuffle** (`events/hooks/events-data.ts`)
- Animated character scramble effect
- Used in events page for dynamic feel
- Configurable timing and character sets

### UI Animations

**Magnetic Elements** - Interactive hover effects
- Mouse position tracking
- Smooth spring physics
- Used on buttons and links

**Parallax Motion** - Depth-based movement
- Mouse-responsive positioning
- Multiple layers with different speeds
- Adds dimensionality to flat sections

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev        # Start development server (port 5173)
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

### Adding New Content

To add or edit page content:

1. Locate the content file for your page:
   - Home: `src/home/home-content.ts`
   - About: `src/about/about-content.ts`
   - Join: `src/join/join-content.ts`
   - Events: `src/events/hooks/events-data.ts`

2. Edit the text strings (keep quotes intact)
3. Save the file - changes appear instantly in dev mode
4. See [CONTENT_EDITING_GUIDE.md](CONTENT_EDITING_GUIDE.md) for detailed instructions

### Adding New Pages

1. Create folder in `src/`: `src/mypage/`
2. Add content file: `src/mypage/mypage-content.ts`
3. Create component: `src/mypage/page.tsx`
4. Add route in `src/App.tsx`
5. Add navigation link in `src/components/layout/NavBar.tsx`

### Customizing Colors & Styles

**Design System** - `src/constants/designSystem.ts`
```typescript
export const COLORS = {
  primary: '#FF0000',     // Brand red
  background: '#0A0A0A',  // Dark background
  // ... more colors
}
```

**Global Styles** - `src/App.css` and `src/index.css`

---

## 📱 Responsive Design

The site adapts to all screen sizes with specific mobile layouts:

- **Mobile Navigation** - Fullscreen hamburger menu
- **Mobile Map** - Touch-optimized controls
- **Mobile Layouts** - Dedicated `.css` files for mobile (e.g., `pageMobile.css`)
- **Breakpoints** - Configured in design system

Mobile-specific files use `@media` queries targeting screens < 768px.

---

## 🚀 Performance

### Optimization Techniques

**3D Rendering**
- DRACO compression reduces model size by 60-70%
- Geometry instancing for repeated elements
- Efficient material reuse
- Frustum culling built into Three.js

**Code Splitting**
- React Router lazy loading for pages
- Dynamic imports for heavy components
- Vite's automatic code splitting

**Asset Loading**
- Progressive model loading with feedback
- Cached resources after first load
- Optimized image formats (WebP fallbacks)

**Animation Performance**
- Hardware-accelerated CSS transforms
- RequestAnimationFrame for smooth updates
- Debounced resize handlers
- Framer Motion's optimized renderer

---

## 🐛 Debugging

### Debug Tools

**React DevTools** - Component inspection
```bash
# Install browser extension
# Chrome: React Developer Tools
# Firefox: React Developer Tools
```

**Three.js Inspector** - 3D scene debugging
```typescript
// Add to HelsinkiScene.ts temporarily
console.log(scene)  // Inspect scene graph
console.log(renderer.info)  // Render stats
```

**Performance Monitoring**
```typescript
// Check FPS in browser console
const stats = renderer.info.render
console.log(`Triangles: ${stats.triangles}, Calls: ${stats.calls}`)
```

### Common Issues

**Model not loading**
- Check browser console for errors
- Verify `public/models/fh.glb` exists
- Ensure DRACO decoder is accessible

**Low FPS**
- Check GPU usage in browser task manager
- Reduce post-processing effects
- Lower model polycount if needed

**Transitions stuttering**
- Disable browser extensions
- Check for memory leaks with DevTools
- Ensure hardware acceleration enabled

---

## 📦 Deployment

### Production Build

```bash
# Build optimized production bundle
npm run build

# Output location: dist/
# Deploy the dist/ folder to your hosting service
```

### Hosting Options

**Static Hosting** (Recommended)
- Vercel - Automatic deployments from Git
- Netlify - Drag & drop or Git integration
- GitHub Pages - Free for public repos

**Configuration**

For Vercel, add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

For Netlify, add `public/_redirects`:
```
/*    /index.html   200
```

---

## 📄 License

This project is proprietary software developed for Founders House.

---

## 🤝 Contributing

For content changes, see [CONTENT_EDITING_GUIDE.md](CONTENT_EDITING_GUIDE.md).

For code contributions, please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

---

## 📬 Contact

For questions or support:
- Website: [foundershouse.fi](https://foundershouse.fi)
- Email: info@foundershouse.fi

---

Built with ❤️ by the Founders House team
