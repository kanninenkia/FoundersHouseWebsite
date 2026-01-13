/**
 * ScrollPhasesContainer - Clean orchestrator for all scroll phases
 * Manages background, scroll spacer, and delegates to phase components
 */

import { motion, MotionValue } from 'framer-motion'
import { Phase1Obsessive } from './Phase1Obsessive'
import { Phase2Ambitious } from './Phase2Ambitious'
import { Phase3NextGen } from './Phase3NextGen'
import { Phase4Builders } from './Phase4Builders'
import { SharedTextElement } from './SharedTextElement'

interface ScrollPhasesContainerProps {
  zScrollComplete: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  scrollWidth: string
  scrollHeight: string
  boxParallaxX: MotionValue<number>
  boxParallaxY: MotionValue<number>
  boxOpacity: number
  boxPositionX: number
  boxPositionY: number
  boxRotation: number

  // Phase 1 props
  imageOpacity: number
  imageWidth: string
  imageHeight: string
  placeholderParallaxX: MotionValue<number>
  placeholderParallaxY: MotionValue<number>
  showDecorations: boolean
  imageTop: string
  elementsOpacity: number

  // Phase 2 props
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

  // Phase 3 props
  thirdImageOpacity: number
  thirdImageParallaxX: MotionValue<number>
  thirdImageParallaxY: MotionValue<number>
  thirdImageTextParallaxX: MotionValue<number>
  thirdImageTextParallaxY: MotionValue<number>

  // Phase 4 props
  fourthImageOpacity: number
  fourthImageParallaxX: MotionValue<number>
  fourthImageParallaxY: MotionValue<number>
  fourthImageBoxParallaxX: MotionValue<number>
  fourthImageBoxParallaxY: MotionValue<number>
  fourthDecorativeBoxParallaxX: MotionValue<number>
  fourthDecorativeBoxParallaxY: MotionValue<number>
  fourthDecorativeTextParallaxX: MotionValue<number>
  fourthDecorativeTextParallaxY: MotionValue<number>
  phase4Opacity: number

  // Shared props
  decorativeBoxParallaxX: MotionValue<number>
  decorativeBoxParallaxY: MotionValue<number>
  decorativeTextParallaxX: MotionValue<number>
  decorativeTextParallaxY: MotionValue<number>

  // Shared text props
  textContent: string
  obsessiveY: number
  obsessiveOpacity: number
  obsessiveBottom: string
  obsessiveLeft: string
  textPositionX: number
  textPositionY: number
  textRotation: number
  obsessiveParallaxX: MotionValue<number>
  obsessiveParallaxY: MotionValue<number>
  buildersTextParallaxX: MotionValue<number>
  buildersTextParallaxY: MotionValue<number>
}

export const ScrollPhasesContainer = (props: ScrollPhasesContainerProps) => {
  if (!props.zScrollComplete) return null

  return (
    <>
      {/* Background and animated box */}
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
            width: props.scrollWidth,
            height: props.scrollHeight,
            x: props.boxParallaxX,
            y: props.boxParallaxY,
            translateX: `calc(-50% + ${props.boxPositionX}%)`,
            translateY: `calc(-50% + ${props.boxPositionY}%)`,
            rotate: props.boxRotation,
            background: '#590D0F',
            opacity: props.boxOpacity,
            transition: 'width 0.3s cubic-bezier(0.22, 1, 0.36, 1), height 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>

      {/* Scroll spacer */}
      <div
        ref={props.scrollContainerRef}
        style={{
          position: 'relative',
          minHeight: '1050vh',
          background: 'transparent',
          zIndex: 1,
        }}
      />

      {/* Phase 2: AMBITIOUS - Map and place2 (renders first because it's behind) */}
      <Phase2Ambitious
        mapOpacity={props.mapOpacity}
        mapRotation={props.mapRotation}
        mapPositionX={props.mapPositionX}
        mapScale={props.mapScale}
        mapParallaxX={props.mapParallaxX}
        mapParallaxY={props.mapParallaxY}
        newImageOpacity={props.newImageOpacity}
        newImageScale={props.newImageScale}
        newImagePositionX={props.newImagePositionX}
        newImagePositionY={props.newImagePositionY}
        newImageParallaxX={props.newImageParallaxX}
        newImageParallaxY={props.newImageParallaxY}
        decorativeOpacity={props.decorativeOpacity}
        decorativeBoxParallaxX={props.decorativeBoxParallaxX}
        decorativeBoxParallaxY={props.decorativeBoxParallaxY}
        decorativeTextParallaxX={props.decorativeTextParallaxX}
        decorativeTextParallaxY={props.decorativeTextParallaxY}
      />

      {/* Phase 1: OBSESSIVE - Placeholder image and decorations */}
      <Phase1Obsessive
        imageOpacity={props.imageOpacity}
        imageWidth={props.imageWidth}
        imageHeight={props.imageHeight}
        imageTop={props.imageTop}
        placeholderParallaxX={props.placeholderParallaxX}
        placeholderParallaxY={props.placeholderParallaxY}
        elementsOpacity={props.elementsOpacity}
        showDecorations={props.showDecorations}
        decorativeBoxParallaxX={props.decorativeBoxParallaxX}
        decorativeBoxParallaxY={props.decorativeBoxParallaxY}
        decorativeTextParallaxX={props.decorativeTextParallaxX}
        decorativeTextParallaxY={props.decorativeTextParallaxY}
        boxPositionX={props.boxPositionX}
      />

      {/* Phase 3: NEXT-GEN - place3 image */}
      <Phase3NextGen
        thirdImageOpacity={props.thirdImageOpacity}
        thirdImageParallaxX={props.thirdImageParallaxX}
        thirdImageParallaxY={props.thirdImageParallaxY}
        thirdImageTextParallaxX={props.thirdImageTextParallaxX}
        thirdImageTextParallaxY={props.thirdImageTextParallaxY}
      />

      {/* Shared text element that transforms through all phases */}
      <SharedTextElement
        textContent={props.textContent}
        obsessiveY={props.obsessiveY}
        obsessiveOpacity={props.obsessiveOpacity}
        obsessiveBottom={props.obsessiveBottom}
        obsessiveLeft={props.obsessiveLeft}
        textPositionX={props.textPositionX}
        textPositionY={props.textPositionY}
        textRotation={props.textRotation}
        obsessiveParallaxX={props.obsessiveParallaxX}
        obsessiveParallaxY={props.obsessiveParallaxY}
        buildersTextParallaxX={props.buildersTextParallaxX}
        buildersTextParallaxY={props.buildersTextParallaxY}
        phase4Opacity={props.phase4Opacity}
      />

      {/* Phase 4: BUILDERS - place4 image */}
      <Phase4Builders
        fourthImageOpacity={props.fourthImageOpacity}
        fourthImageParallaxX={props.fourthImageParallaxX}
        fourthImageParallaxY={props.fourthImageParallaxY}
        fourthImageBoxParallaxX={props.fourthImageBoxParallaxX}
        fourthImageBoxParallaxY={props.fourthImageBoxParallaxY}
        fourthDecorativeBoxParallaxX={props.fourthDecorativeBoxParallaxX}
        fourthDecorativeBoxParallaxY={props.fourthDecorativeBoxParallaxY}
        fourthDecorativeTextParallaxX={props.fourthDecorativeTextParallaxX}
        fourthDecorativeTextParallaxY={props.fourthDecorativeTextParallaxY}
        phase4Opacity={props.phase4Opacity}
      />
    </>
  )
}
