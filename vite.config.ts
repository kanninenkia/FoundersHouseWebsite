import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logos/*.svg', 'icons/*.svg', 'models/*.glb'],
      manifest: {
        name: 'Founders House',
        short_name: 'Founders House',
        description: 'Built for the obsessed. Built for the exceptional. Premium community space in Helsinki.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/logos/logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,glb,jpg,jpeg,woff,woff2}'],
        // Allow caching the 7.2 MB GLB file
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  assetsInclude: ['**/*.glsl', '**/*.glb'],
  publicDir: 'public',
  server: {
    // Increase max file size for large GLB files
    hmr: {
      overlay: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split Three.js core
          if (id.includes('node_modules/three/build')) {
            return 'three-core'
          }
          // Split Three.js examples/addons
          if (id.includes('node_modules/three/examples')) {
            return 'three-addons'
          }
          // Split camera-controls
          if (id.includes('node_modules/camera-controls')) {
            return 'three-addons'
          }
          // Split React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          // Split scheduler (React dependency)
          if (id.includes('node_modules/scheduler')) {
            return 'react-vendor'
          }
        },
      },
    },
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Increase chunk size limit to 1000 KB to suppress warning for Three.js
    chunkSizeWarningLimit: 1000,
    // Source map for production debugging (can disable to save more size)
    sourcemap: false,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller builds
    target: 'es2020',
  },
})
