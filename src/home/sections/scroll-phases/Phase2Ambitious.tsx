/**
 * Phase2Ambitious - Map, radar, AMBITIOUS text, and place2.webp image
 * EXACT COPY from original BoxInBoxSection lines 176-327
 */

import { motion, MotionValue } from 'framer-motion'

interface Phase2Props {
  mapOpacity: number
  mapRotation: number
  mapPositionX: number
  mapScale: number
  mapParallaxX: MotionValue<number>
  mapParallaxY: MotionValue<number>
  newImageOpacity: number
  newImageScale: number
  newImagePositionX: number
  newImagePositionY: number
  newImageParallaxX: MotionValue<number>
  newImageParallaxY: MotionValue<number>
  decorativeOpacity: number
  decorativeBoxParallaxX: MotionValue<number>
  decorativeBoxParallaxY: MotionValue<number>
  decorativeTextParallaxX: MotionValue<number>
  decorativeTextParallaxY: MotionValue<number>
}

export const Phase2Ambitious = ({
  mapOpacity,
  mapRotation,
  mapPositionX,
  mapScale,
  mapParallaxX,
  mapParallaxY,
  newImageOpacity,
  newImageScale,
  newImagePositionX,
  newImagePositionY,
  newImageParallaxX,
  newImageParallaxY,
  decorativeOpacity,
  decorativeBoxParallaxX,
  decorativeBoxParallaxY,
  decorativeTextParallaxX,
  decorativeTextParallaxY,
}: Phase2Props) => {
  return (
    <>
      {/* Birds eye view map on the left */}
      <motion.div
        style={{
          position: 'fixed',
          top: '47%',
          left: `${mapPositionX}%`,
          transform: 'translate(-50%, -50%)',
          x: mapParallaxX,
          y: mapParallaxY,
          opacity: mapOpacity,
          rotate: mapRotation,
          zIndex: 11,
          width: '40vw',
          height: '40vw',
          pointerEvents: 'none',
          overflow: 'hidden',
          mixBlendMode: 'multiply',
        }}
      >
        <motion.img
          src="/assets/models/birdseyemaps.webp"
          alt="Map"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            scale: mapScale,
            maskImage: 'radial-gradient(circle, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 75%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 75%)',
          }}
        />
      </motion.div>

      {/* Radar icon to highlight building on map */}
      <motion.div
        style={{
          position: 'fixed',
          top: '47%',
          left: `${mapPositionX}%`,
          transform: 'translate(-50%, -50%)',
          x: mapParallaxX,
          y: mapParallaxY,
          rotate: mapRotation,
          zIndex: 12,
          width: '40vw',
          height: '40vw',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <motion.img
          src="/assets/models/radar.webp"
          alt="Location marker"
          animate={{
            opacity: [mapOpacity * 0.5, mapOpacity, mapOpacity * 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: [0.65, 0, 0.35, 1],
          }}
          style={{
            position: 'absolute',
            top: '-3%',
            left: '5%',
            width: '75%',
            height: 'auto',
            scale: mapScale,
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      {/* New place2.webp image above box */}
      <motion.img
        src="/assets/images/general/place2.webp"
        alt=""
        style={{
          position: 'fixed',
          top: `calc(50% + ${newImagePositionY}%)`,
          left: `calc(50% + ${newImagePositionX}%)`,
          x: newImageParallaxX,
          y: newImageParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: newImageOpacity,
          scale: newImageScale,
          zIndex: 13,
          width: '34.5vw', // Increased by 15% from 30vw
          height: 'auto',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative rectangle on place2 image */}
      <motion.img
        src="/assets/icons/rectangle.svg"
        alt=""
        style={{
          position: 'fixed',
          top: `calc(50% + ${newImagePositionY}% - 3%)`,
          left: `calc(50% + ${newImagePositionX}% - 2%)`,
          x: decorativeBoxParallaxX,
          y: decorativeBoxParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: decorativeOpacity,
          scale: newImageScale,
          zIndex: 14,
          width: '12vw',
          height: 'auto',
          pointerEvents: 'none',
        }}
      />

      {/* Text overlay on place2 image - bottom right */}
      <motion.div
        style={{
          position: 'fixed',
          top: `calc(50% + ${newImagePositionY}% + 17.25vw - 3% + 2%)`,
          left: `calc(50% + ${newImagePositionX}% + 17.25vw - 3% + 4% + 2% + 3%)`,
          opacity: decorativeOpacity,
          scale: newImageScale,
          zIndex: 15,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          style={{
            x: decorativeTextParallaxX,
            y: decorativeTextParallaxY,
          }}
        >
          <div
            style={{
              fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 'clamp(0.9rem, 1.2vw, 1.2rem)',
              fontWeight: 400,
              color: '#FFFFFF',
              textAlign: 'left',
              lineHeight: 1.4,
              pointerEvents: 'none',
              transform: 'translateX(-100%)',
              whiteSpace: 'nowrap',
            }}
          >
            A space built for the rare few<br />
            who operate at the 0.1% level.
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
