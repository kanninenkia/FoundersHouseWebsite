/**
 * useMouseParallax - Mouse tracking and parallax motion values
 * Manages all mouse-based parallax effects for the LearnMore page
 */

import { useEffect } from 'react'
import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion'
import { ANIMATION_CONFIG } from '../config/animationConfig'

export interface MouseParallaxValues {
  // Raw mouse position values
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  smoothMouseX: MotionValue<number>
  smoothMouseY: MotionValue<number>

  // Text parallax (for header text)
  textParallaxX: MotionValue<number>
  textParallaxY: MotionValue<number>

  // OBSESSIVE text parallax
  obsessiveParallaxX: MotionValue<number>
  obsessiveParallaxY: MotionValue<number>

  // Placeholder image parallax (Phase 1)
  placeholderParallaxX: MotionValue<number>
  placeholderParallaxY: MotionValue<number>

  // Box parallax
  boxParallaxX: MotionValue<number>
  boxParallaxY: MotionValue<number>

  // Decorative elements parallax (boxes and text)
  decorativeBoxParallaxX: MotionValue<number>
  decorativeBoxParallaxY: MotionValue<number>
  decorativeTextParallaxX: MotionValue<number>
  decorativeTextParallaxY: MotionValue<number>

  // Map parallax (Phase 2)
  mapParallaxX: MotionValue<number>
  mapParallaxY: MotionValue<number>

  // New image parallax (place2 - Phase 2)
  newImageParallaxX: MotionValue<number>
  newImageParallaxY: MotionValue<number>

  // Third image parallax (place3 - Phase 3)
  thirdImageParallaxX: MotionValue<number>
  thirdImageParallaxY: MotionValue<number>
  thirdImageTextParallaxX: MotionValue<number>
  thirdImageTextParallaxY: MotionValue<number>

  // Fourth image parallax (place4 - Phase 4)
  fourthImageBoxParallaxX: MotionValue<number>
  fourthImageBoxParallaxY: MotionValue<number>
  fourthImageParallaxX: MotionValue<number>
  fourthImageParallaxY: MotionValue<number>
  buildersTextParallaxX: MotionValue<number>
  buildersTextParallaxY: MotionValue<number>
  fourthDecorativeBoxParallaxX: MotionValue<number>
  fourthDecorativeBoxParallaxY: MotionValue<number>
  fourthDecorativeTextParallaxX: MotionValue<number>
  fourthDecorativeTextParallaxY: MotionValue<number>
}

export const useMouseParallax = (): MouseParallaxValues => {
  // Raw mouse position (-1 to 1)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smoothed mouse position
  const smoothMouseX = useSpring(mouseX, ANIMATION_CONFIG.spring)
  const smoothMouseY = useSpring(mouseY, ANIMATION_CONFIG.spring)

  // Setup mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      mouseX.set(x)
      mouseY.set(y)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Text parallax (for header text)
  const textParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.text.x)
  const textParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.text.y)

  // OBSESSIVE text parallax
  const obsessiveParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.obsessiveText.x)
  const obsessiveParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.obsessiveText.y)

  // Placeholder image parallax (Phase 1)
  const placeholderParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.image.x)
  const placeholderParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.image.y)

  // Box parallax
  const boxParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.box.x)
  const boxParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.box.y)

  // Decorative elements between image and obsessive text: [-16, 16] (halfway between -12 and -20)
  const decorativeBoxParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16])
  const decorativeBoxParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])
  const decorativeTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16])
  const decorativeTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])

  // Map parallax - subtle movement
  const mapParallaxX = useTransform(smoothMouseX, [-1, 1], [-8, 8])
  const mapParallaxY = useTransform(smoothMouseY, [-1, 1], [-8, 8])

  // New image parallax - similar to placeholder image
  const newImageParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.image.x)
  const newImageParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.image.y)

  // Third image parallax - similar to other images
  const thirdImageParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.image.x)
  const thirdImageParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.image.y)
  const thirdImageTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16])
  const thirdImageTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])

  // Fourth image parallax - matching AMBITIOUS phase pattern
  const fourthImageBoxParallaxX = useTransform(smoothMouseX, [-1, 1], [-5, 5]) // Box speed (same as AMBITIOUS box)
  const fourthImageBoxParallaxY = useTransform(smoothMouseY, [-1, 1], [-5, 5])
  const fourthImageParallaxX = useTransform(smoothMouseX, [-1, 1], [-12, 12]) // Image speed (same as place2)
  const fourthImageParallaxY = useTransform(smoothMouseY, [-1, 1], [-12, 12])
  const buildersTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-20, 20]) // Text speed (same as AMBITIOUS text)
  const buildersTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-20, 20])
  const fourthDecorativeBoxParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16]) // Decorative box speed
  const fourthDecorativeBoxParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])
  const fourthDecorativeTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16]) // Decorative text speed
  const fourthDecorativeTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])

  return {
    mouseX,
    mouseY,
    smoothMouseX,
    smoothMouseY,
    textParallaxX,
    textParallaxY,
    obsessiveParallaxX,
    obsessiveParallaxY,
    placeholderParallaxX,
    placeholderParallaxY,
    boxParallaxX,
    boxParallaxY,
    decorativeBoxParallaxX,
    decorativeBoxParallaxY,
    decorativeTextParallaxX,
    decorativeTextParallaxY,
    mapParallaxX,
    mapParallaxY,
    newImageParallaxX,
    newImageParallaxY,
    thirdImageParallaxX,
    thirdImageParallaxY,
    thirdImageTextParallaxX,
    thirdImageTextParallaxY,
    fourthImageBoxParallaxX,
    fourthImageBoxParallaxY,
    fourthImageParallaxX,
    fourthImageParallaxY,
    buildersTextParallaxX,
    buildersTextParallaxY,
    fourthDecorativeBoxParallaxX,
    fourthDecorativeBoxParallaxY,
    fourthDecorativeTextParallaxX,
    fourthDecorativeTextParallaxY,
  }
}
