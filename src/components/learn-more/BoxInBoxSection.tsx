import { motion, MotionValue } from 'framer-motion'

interface BoxInBoxSectionProps {
  zScrollComplete: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  scrollWidth: string
  scrollHeight: string
  boxParallaxX: MotionValue<number>
  boxParallaxY: MotionValue<number>
  boxOpacity: number
  imageOpacity: number
  imageWidth: string
  imageHeight: string
  placeholderParallaxX: MotionValue<number>
  placeholderParallaxY: MotionValue<number>
  decorativeBoxParallaxX: MotionValue<number>
  decorativeBoxParallaxY: MotionValue<number>
  decorativeTextParallaxX: MotionValue<number>
  decorativeTextParallaxY: MotionValue<number>
  showDecorations: boolean
  obsessiveParallaxX: MotionValue<number>
  obsessiveParallaxY: MotionValue<number>
  obsessiveY: number
  obsessiveOpacity: number
  imageTop: string
  obsessiveBottom: string
  obsessiveLeft: string
  elementsOpacity: number
  boxPositionX: number
  boxPositionY: number
  boxRotation: number
  mapOpacity: number
  mapParallaxX: MotionValue<number>
  mapParallaxY: MotionValue<number>
  textRotation: number
  textContent: string
  textPositionX: number
  textPositionY: number
  newImageOpacity: number
  newImageParallaxX: MotionValue<number>
  newImageParallaxY: MotionValue<number>
  newImagePositionX: number
  newImagePositionY: number
  newImageScale: number
  decorativeOpacity: number
  mapRotation: number
  mapPositionX: number
  mapScale: number
  thirdImageOpacity: number
  thirdImageParallaxX: MotionValue<number>
  thirdImageParallaxY: MotionValue<number>
  thirdImageTextParallaxX: MotionValue<number>
  thirdImageTextParallaxY: MotionValue<number>
  fourthImageOpacity: number
  fourthImageParallaxX: MotionValue<number>
  fourthImageParallaxY: MotionValue<number>
  fourthImageBoxParallaxX: MotionValue<number>
  fourthImageBoxParallaxY: MotionValue<number>
  buildersTextParallaxX: MotionValue<number>
  buildersTextParallaxY: MotionValue<number>
  fourthDecorativeBoxParallaxX: MotionValue<number>
  fourthDecorativeBoxParallaxY: MotionValue<number>
  fourthDecorativeTextParallaxX: MotionValue<number>
  fourthDecorativeTextParallaxY: MotionValue<number>
  phase4Opacity: number
}

export const BoxInBoxSection = ({
  zScrollComplete,
  scrollContainerRef,
  scrollWidth,
  scrollHeight,
  boxParallaxX,
  boxParallaxY,
  boxOpacity,
  imageOpacity,
  imageWidth,
  imageHeight,
  placeholderParallaxX,
  placeholderParallaxY,
  decorativeBoxParallaxX,
  decorativeBoxParallaxY,
  decorativeTextParallaxX,
  decorativeTextParallaxY,
  showDecorations,
  obsessiveParallaxX,
  obsessiveParallaxY,
  obsessiveY,
  obsessiveOpacity,
  imageTop,
  obsessiveBottom,
  obsessiveLeft,
  elementsOpacity,
  boxPositionX,
  boxPositionY,
  boxRotation,
  mapOpacity,
  mapParallaxX,
  mapParallaxY,
  textRotation,
  textContent,
  textPositionX,
  textPositionY,
  newImageOpacity,
  newImageParallaxX,
  newImageParallaxY,
  newImagePositionX,
  newImagePositionY,
  newImageScale,
  decorativeOpacity,
  mapRotation,
  mapPositionX,
  mapScale,
  thirdImageOpacity,
  thirdImageParallaxX,
  thirdImageParallaxY,
  thirdImageTextParallaxX,
  thirdImageTextParallaxY,
  fourthImageOpacity,
  fourthImageParallaxX,
  fourthImageParallaxY,
  fourthImageBoxParallaxX,
  fourthImageBoxParallaxY,
  buildersTextParallaxX,
  buildersTextParallaxY,
  fourthDecorativeBoxParallaxX,
  fourthDecorativeBoxParallaxY,
  fourthDecorativeTextParallaxX,
  fourthDecorativeTextParallaxY,
  phase4Opacity,
}: BoxInBoxSectionProps) => {
  if (!zScrollComplete) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: '#2B0A05',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: scrollWidth,
            height: scrollHeight,
            x: boxParallaxX,
            y: boxParallaxY,
            translateX: `calc(-50% + ${boxPositionX}%)`,
            translateY: `calc(-50% + ${boxPositionY}%)`,
            rotate: boxRotation,
            background: '#590D0F',
            opacity: boxOpacity,
            transition: 'width 0.3s cubic-bezier(0.22, 1, 0.36, 1), height 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      <div
        ref={scrollContainerRef}
        style={{
          position: 'relative',
          minHeight: '1050vh', // 9.7vh for all animations (1.5 + 2.0 + 0.2 + 2.0 + 2.0 + 2.0) + extra scroll room
          background: 'transparent',
          zIndex: 1,
        }}
      />

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
          src="/models/birdseyemaps.webp"
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
          src="/models/radar.svg"
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
        src="/images/place2.webp"
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
        src="/icons/rectangle.svg"
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

      <motion.img
        src="/images/placeholder.webp"
        alt=""
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: placeholderParallaxX,
          y: placeholderParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: imageOpacity * elementsOpacity,
          zIndex: 12,
          width: imageWidth,
          height: imageHeight,
          objectFit: 'cover',
          objectPosition: 'center center',
          clipPath: 'inset(0 0 0 0)',
          pointerEvents: 'none',
        }}
      />
      
      {/* First box (back) - separate layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDecorations ? imageOpacity * elementsOpacity : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: decorativeBoxParallaxX,
          y: decorativeBoxParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 13,
          pointerEvents: 'none',
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <img
          src="/icons/box.svg"
          alt=""
          style={{
            position: 'absolute',
            top: '33%',
            left: '38%',
            width: '20%',
            height: 'auto',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
      
      {/* Second box (front) - separate layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDecorations ? imageOpacity * elementsOpacity : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: decorativeBoxParallaxX,
          y: decorativeBoxParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 14,
          pointerEvents: 'none',
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <img
          src="/icons/box.svg"
          alt=""
          style={{
            position: 'absolute',
            top: '36%',
            left: '42%',
            width: '20%',
            height: 'auto',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
      
      {/* Bottom right text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDecorations ? imageOpacity * elementsOpacity : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: decorativeTextParallaxX,
          y: decorativeTextParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 14,
          pointerEvents: 'none',
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            right: '6%',
            fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
            fontWeight: 400,
            color: '#FFFFFF',
            textAlign: 'right',
            lineHeight: 1.4,
            pointerEvents: 'none',
          }}
        >
          For those who outwork<br />
          and outthink the rest.
        </div>
      </motion.div>
      
      <motion.div
        style={{
          position: 'fixed',
          bottom: obsessiveBottom,
          left: obsessiveLeft,
          x: textContent === 'BUILDERS' ? buildersTextParallaxX : obsessiveParallaxX,
          y: textContent === 'BUILDERS' ? buildersTextParallaxY : obsessiveParallaxY,
          translateX: `calc(${textPositionX}vw + 3%)`,
          translateY: `calc(${obsessiveY}% + ${textPositionY}vh)`,
          opacity: textContent === 'BUILDERS' ? obsessiveOpacity * phase4Opacity : obsessiveOpacity,
          rotate: textRotation,
          scale: 1.09, // Increased by 15% from 0.95 (0.95 * 1.15 = 1.0925)
          transformOrigin: 'left center',
          zIndex: 15,
          pointerEvents: 'none',
          fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 'clamp(4rem, 10vw, 8rem)',
          fontWeight: 700,
          color: '#D82E11',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          maxHeight: '85vh',
        }}
      >
        {textContent}
      </motion.div>

      {/* Third image (place3.webp) - Left side */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% + 6vh)',
          left: 'calc(20% + 3%)',
          opacity: thirdImageOpacity,
          x: thirdImageParallaxX,
          y: thirdImageParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 13,
          pointerEvents: 'none',
        }}
      >
        <img
          src="/images/place3.webp"
          alt="Place 3"
          style={{
            width: 'clamp(414px, 48.3vw, 690px)',
            height: 'auto',
            display: 'block',
          }}
        />
      </motion.div>

      {/* Decorative rectangle on place3 image - top left */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% + 6vh - 4vh)',
          left: 'calc(20% + 3% - 2%)',
          opacity: thirdImageOpacity,
          x: thirdImageTextParallaxX,
          y: thirdImageTextParallaxY,
          zIndex: 14,
          pointerEvents: 'none',
        }}
      >
        <img
          src="/icons/rectangle.svg"
          alt=""
          style={{
            width: '12vw',
            height: 'auto',
            transform: 'translate(-100%, -100%) rotate(90deg) scale(0.7)',
            display: 'block',
          }}
        />
      </motion.div>

      {/* Text overlay on place3 image - bottom left */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% + 6vh)',
          left: 'calc(20% + 3%)',
          opacity: thirdImageOpacity,
          zIndex: 14,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          style={{
            x: thirdImageTextParallaxX,
            y: thirdImageTextParallaxY,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(-15vw - 5vh)',
              left: '-17.5vw',
              fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 'clamp(0.9rem, 1.2vw, 1.2rem)',
              fontWeight: 400,
              color: '#FFFFFF',
              textAlign: 'left',
              lineHeight: 1.4,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
            dangerouslySetInnerHTML={{
              __html: 'For the ones moving faster<br />than everyone else.'
            }}
          />
        </motion.div>
      </motion.div>

      {/* Fourth image - place4.webp - below sticky BUILDERS text */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% - 30vh)',
          left: 'calc(50% - 41vw)',
          transform: 'translate(-50%, -50%)',
          x: fourthImageParallaxX,
          y: fourthImageParallaxY,
          opacity: fourthImageOpacity * phase4Opacity,
          zIndex: 13,
          pointerEvents: 'none',
        }}
      >
        {/* Background box behind place4 image - fades in */}
        {fourthImageOpacity > 0 && (
          <motion.div
            style={{
              position: 'absolute',
              top: '5%',
              left: '50%',
              translateX: '-50%',
              x: fourthImageBoxParallaxX,
              y: fourthImageBoxParallaxY,
              width: '69.3vw', // 90% of 77vw
              height: '100%',
              background: '#FFF8F2',
              zIndex: -1,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: fourthImageOpacity
            }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1]
            }}
          />
        )}
        <motion.img
          src="/images/place4.webp"
          alt=""
          style={{
            width: '77vw',
            height: 'auto',
            display: 'block',
            position: 'relative',
            zIndex: 1,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: fourthImageOpacity }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
          }}
        />

        {/* Box.svg in center of place4 image */}
        {fourthImageOpacity > 0 && (
          <motion.div
            style={{
              position: 'absolute',
              top: 'calc(50% - 2%)', // Moved up by 2%
              left: 'calc(50% + 2%)', // Moved right by 2%
              translateX: '-50%',
              translateY: '-50%',
              x: fourthDecorativeBoxParallaxX,
              y: fourthDecorativeBoxParallaxY,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            <motion.img
              src="/icons/minirect.svg"
              alt=""
              style={{
                width: '14vw',
                height: 'auto',
                display: 'block',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: fourthImageOpacity }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Decorative text for place4 - top right */}
      {fourthImageOpacity > 0 && (
        <motion.div
          style={{
            position: 'fixed',
            top: 'calc(50% - 30vh - 10vh + 14%)', // Moved down by 7%
            left: 'calc(50% - 41vw + 77vw - 5vw - 11%)', // Moved left by 7%
            opacity: phase4Opacity,
            zIndex: 14,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            style={{
              x: fourthDecorativeTextParallaxX,
              y: fourthDecorativeTextParallaxY,
            }}
          >
            <motion.div
              style={{
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 'clamp(0.9rem, 1.2vw, 1.2rem)',
                fontWeight: 400,
                color: '#FFFFFF',
                textAlign: 'left',
                lineHeight: 1.4,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: fourthImageOpacity }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              For those who outpace<br />
              their own ambition.
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
