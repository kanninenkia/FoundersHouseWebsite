/**
 * useBoxScrollPhases - Manages all scroll phase animations (OBSESSIVE -> AMBITIOUS -> NEXT-GEN -> BUILDERS -> CTA)
 */

import { useEffect, useState } from 'react'
import { EASING } from '../config/animationConfig'

interface AnimationConfig {
  box: { startSize: number; endSize: number }
  imageScale: number
  timing: {
    textImageFadeIn: { start: number; end: number }
    cardsFadeOut: { start: number; end: number }
  }
  scrollPhases: {
    phase1Duration: number
    phase2Duration: number
    pauseDuration: number
    phase3Duration: number
    phase4Duration: number
    phase5Duration: number
  }
  positioning: {
    imageTop: string
    obsessiveBottom: string
    obsessiveLeft: string
  }
}

export const useBoxScrollPhases = (zScrollComplete: boolean, ANIMATION_CONFIG: AnimationConfig) => {
  const [scrollWidth, setScrollWidth] = useState('100%')
  const [scrollHeight, setScrollHeight] = useState('100vh')
  const [imageWidth, setImageWidth] = useState('94.6%')
  const [imageHeight, setImageHeight] = useState('86vh')
  const [boxScrollProgress, setBoxScrollProgress] = useState(0)
  const [boxOpacity, setBoxOpacity] = useState(1)
  const [obsessiveY, setObsessiveY] = useState(100)
  const [obsessiveOpacity, setObsessiveOpacity] = useState(0)
  const [imageOpacity, setImageOpacity] = useState(0)
  const [showDecorations, setShowDecorations] = useState(false)

  // Phase 2 state
  const [elementsOpacity, setElementsOpacity] = useState(1)
  const [boxPositionX, setBoxPositionX] = useState(0)
  const [boxPositionY, setBoxPositionY] = useState(0)
  const [boxRotation, setBoxRotation] = useState(0)
  const [mapOpacity, setMapOpacity] = useState(0)
  const [textRotation, setTextRotation] = useState(0)
  const [textContent, setTextContent] = useState('OBSESSIVE')
  const [textPositionX, setTextPositionX] = useState(0)
  const [textPositionY, setTextPositionY] = useState(0)
  const [newImageOpacity, setNewImageOpacity] = useState(0)
  const [newImagePositionX, setNewImagePositionX] = useState(0)
  const [newImagePositionY, setNewImagePositionY] = useState(0)
  const [newImageScale, setNewImageScale] = useState(0.7)
  const [decorativeOpacity, setDecorativeOpacity] = useState(0)
  const [mapRotation, setMapRotation] = useState(0)
  const [mapPositionX, setMapPositionX] = useState(0)
  const [mapScale, setMapScale] = useState(1.95)
  const [thirdImageOpacity, setThirdImageOpacity] = useState(0)

  // Phase 4 state
  const [fourthImageOpacity, setFourthImageOpacity] = useState(0)

  // Phase 5 state
  const [ctaTextOpacity, setCtaTextOpacity] = useState(0)
  const [horsesOpacity, setHorsesOpacity] = useState(0)
  const [phase4Opacity, setPhase4Opacity] = useState(1)
  const [footerOpacity, setFooterOpacity] = useState(0)
  const [borderHeight, setBorderHeight] = useState(0)
  const [phase5BackgroundColor, setPhase5BackgroundColor] = useState('')
  const [ctaTextY, setCtaTextY] = useState(25) // Start at 25vh (below footer)
  const [horsesY, setHorsesY] = useState(25) // Start at 25vh (below footer)

  useEffect(() => {
    let rafId: number | null = null
    let lastScrollY = -1

    const handleScroll = () => {
      if (rafId !== null) return

      rafId = requestAnimationFrame(() => {
        const scrolled = window.scrollY

        if (Math.abs(scrolled - lastScrollY) > 0.5) {
          lastScrollY = scrolled

          if (zScrollComplete) {
            const maxScroll = window.innerHeight
            const progress = Math.min(scrolled / maxScroll, 1)
            setBoxScrollProgress(progress)

            const { start, end } = ANIMATION_CONFIG.timing.textImageFadeIn
            const linearProgress = Math.max(0, Math.min(1, (progress - start) / (end - start)))
            const easedProgress = EASING.standard(linearProgress)

            // Phase 1: OBSESSIVE reveal
            setObsessiveY((1 - easedProgress) * 100)
            setObsessiveOpacity(easedProgress >= 0.95 ? 1.0 : easedProgress)
            setImageOpacity(easedProgress >= 0.95 ? 1.0 : easedProgress)

            if (easedProgress >= 0.95 && !showDecorations) {
              setShowDecorations(true)
            }

            const boxSizeReduction = ANIMATION_CONFIG.box.startSize - ANIMATION_CONFIG.box.endSize
            const boxSize = ANIMATION_CONFIG.box.startSize - (easedProgress * boxSizeReduction)

            setScrollWidth(`${boxSize}%`)
            setScrollHeight(`${boxSize}vh`)
            setImageWidth(`${boxSize * 1.1 * 0.86 * ANIMATION_CONFIG.imageScale}%`)
            setImageHeight(`${boxSize * 0.86 * ANIMATION_CONFIG.imageScale}vh`)
            setBoxOpacity(1)

            // Phase 2: AMBITIOUS transformation
            const phase2Start = maxScroll * ANIMATION_CONFIG.scrollPhases.phase1Duration
            if (scrolled > phase2Start) {
              const phase2Scroll = scrolled - phase2Start
              const phase2Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase2Duration
              const totalProgress = Math.min(phase2Scroll / phase2Max, 1)

              const transformProgress = EASING.standard(Math.min(totalProgress * 2, 1))
              const translateProgress = EASING.standard(Math.max(0, (totalProgress - 0.5) * 2))

              setElementsOpacity(1 - transformProgress)

              const targetWidth = 75 - (transformProgress * 45)
              const targetHeight = 75 - (transformProgress * 25)
              setScrollWidth(`${targetWidth}%`)
              setScrollHeight(`${targetHeight}vh`)
              setImageWidth(`${targetWidth * 1.1 * 0.86 * ANIMATION_CONFIG.imageScale}%`)
              setImageHeight(`${targetHeight * 0.86 * ANIMATION_CONFIG.imageScale}vh`)

              setBoxPositionX(translateProgress * 91)
              setBoxPositionY(translateProgress * 31)
              setNewImagePositionX(translateProgress * 18)
              setNewImagePositionY(translateProgress * 0)

              const scaleStart = 0.7 * 1.15 * 0.95
              const scaleEnd = 1.2 * 1.15 * 0.95
              setNewImageScale(scaleStart + (translateProgress * (scaleEnd - scaleStart)))

              setBoxRotation(0)
              setTextRotation(translateProgress * -90)
              setTextPositionX(translateProgress * 39)
              setTextPositionY(translateProgress * 2)

              // Text fade transition OBSESSIVE → AMBITIOUS
              if (translateProgress < 0.5) {
                setTextContent('OBSESSIVE')
              } else {
                setTextContent('AMBITIOUS')
              }
              setMapOpacity(translateProgress)
              setNewImageOpacity(EASING.standard(translateProgress))

              const decorativeT = Math.max(0, (translateProgress - 0.5) / 0.5)
              setDecorativeOpacity(EASING.out(decorativeT))

              // Phase 3: NEXT-GEN transformation
              const phase3Start = phase2Start + phase2Max + (maxScroll * ANIMATION_CONFIG.scrollPhases.pauseDuration)

              if (scrolled > phase3Start) {
                const phase3Scroll = scrolled - phase3Start
                const phase3Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase3Duration
                const linearThirdProgress = Math.min(phase3Scroll / phase3Max, 1)
                const thirdProgress = EASING.inOut(linearThirdProgress)

                // Both rotation and movement happen simultaneously throughout the entire phase
                const simultaneousProgress = EASING.out(thirdProgress)

                const fadeOutProgress = EASING.inOut(thirdProgress)
                setNewImageOpacity(EASING.standard(translateProgress) * (1 - fadeOutProgress))
                setBoxOpacity(1 - fadeOutProgress)
                setDecorativeOpacity(EASING.out(decorativeT) * (1 - fadeOutProgress))

                // Map rotates and moves at the same time
                setMapRotation(simultaneousProgress * 126.82)
                setMapScale(1.95 + (simultaneousProgress * 0.5))
                setMapPositionX(simultaneousProgress * 50)
                setTextPositionX(39 - (simultaneousProgress * 5))
                setTextPositionY(-simultaneousProgress * 3)
                setThirdImageOpacity(simultaneousProgress)

                // Text fade transition AMBITIOUS → NEXT-GEN
                if (simultaneousProgress < 0.5) {
                  setTextContent('AMBITIOUS')
                } else {
                  setTextContent('NEXT-GEN')
                }

                // Phase 4: BUILDERS
                const phase4Start = phase3Start + phase3Max
                if (scrolled > phase4Start) {
                  const phase4Scroll = scrolled - phase4Start
                  const phase4Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase4Duration
                  const linearFourthProgress = Math.min(phase4Scroll / phase4Max, 1)
                  const fourthProgress = EASING.out(linearFourthProgress)

                  setMapOpacity(1 - fourthProgress)
                  setThirdImageOpacity(1 - fourthProgress)
                  setTextRotation(-90 + (fourthProgress * 90))
                  setTextPositionX(34 - (fourthProgress * 31))
                  setTextPositionY(-3 - (fourthProgress * 67))

                  // Text fade transition NEXT-GEN → BUILDERS
                  const textTransformProgress = Math.min(fourthProgress / 0.7, 1)
                  if (textTransformProgress < 0.5) {
                    setTextContent('NEXT-GEN')
                  } else {
                    setTextContent('BUILDERS')
                  }
                  setFourthImageOpacity(fourthProgress)

                  // Phase 5: Final CTA
                  const phase5Start = phase4Start + phase4Max
                  if (scrolled > phase5Start) {
                    const phase5Scroll = scrolled - phase5Start
                    const phase5Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase5Duration
                    const linearFifthProgress = Math.min(phase5Scroll / phase5Max, 1)
                    const fifthProgress = EASING.out(linearFifthProgress)

                    const fadeOutProgressPhase5 = Math.min(fifthProgress * 2, 1)
                    setPhase4Opacity(1 - EASING.out(fadeOutProgressPhase5))

                    const borderProgress = Math.max(0, Math.min(1, (fifthProgress - 0.25) / 0.45))
                    setBorderHeight(EASING.inOut(borderProgress) * 75)

                    const r = Math.round(43 + (89 - 43) * fifthProgress)
                    const g = Math.round(10 + (13 - 10) * fifthProgress)
                    const b = Math.round(5 + (15 - 5) * fifthProgress)
                    setPhase5BackgroundColor(`rgb(${r}, ${g}, ${b})`)

                    const ctaProgress = Math.max(0, Math.min(1, (fifthProgress - 0.25) / 0.35))
                    const easedCtaProgress = EASING.out(ctaProgress)
                    setCtaTextOpacity(easedCtaProgress)
                    setCtaTextY(25 - (easedCtaProgress * 23))

                    const horsesProgress = Math.max(0, Math.min(1, (fifthProgress - 0.35) / 0.30))
                    const easedHorsesProgress = EASING.out(horsesProgress)
                    setHorsesOpacity(easedHorsesProgress)
                    setHorsesY(25 - (easedHorsesProgress * 23))

                    const footerStartProgress = 0.70
                    const footerDuration = 0.20
                    const footerProgress = Math.max(0, Math.min(1, (fifthProgress - footerStartProgress) / footerDuration))
                    setFooterOpacity(EASING.out(footerProgress))
                  } else {
                    setPhase4Opacity(1)
                    setPhase5BackgroundColor('')
                    setBorderHeight(0)
                    setCtaTextOpacity(0)
                    setHorsesOpacity(0)
                    setFooterOpacity(0)
                    setCtaTextY(25)
                    setHorsesY(25)
                  }
                } else {
                  setFourthImageOpacity(0)
                }
              } else {
                setMapRotation(0)
                setMapPositionX(0)
                setMapScale(1.95)
                setFourthImageOpacity(0)
              }
            } else {
              setElementsOpacity(1)
              setBoxPositionX(0)
              setBoxPositionY(0)
              setBoxRotation(0)
              setMapOpacity(0)
              setTextRotation(0)
              setTextContent('OBSESSIVE')
              setTextPositionX(0)
              setTextPositionY(0)
              setNewImageOpacity(0)
              setNewImagePositionX(0)
              setNewImagePositionY(0)
              setNewImageScale(0.7)
              setDecorativeOpacity(0)
            }
          } else {
            // Reset all state when not in z-scroll-complete mode
            setBoxScrollProgress(0)
            setScrollWidth('100%')
            setImageWidth('94.6%')
            setScrollHeight('100vh')
            setImageHeight('86vh')
            setBoxOpacity(1)
            setObsessiveY(100)
            setObsessiveOpacity(0)
            setImageOpacity(0)
            setShowDecorations(false)
            setElementsOpacity(1)
            setBoxPositionX(0)
            setBoxPositionY(0)
            setBoxRotation(0)
            setMapOpacity(0)
            setTextRotation(0)
            setTextContent('OBSESSIVE')
            setTextPositionX(0)
            setTextPositionY(0)
            setNewImageOpacity(0)
            setNewImagePositionX(0)
            setNewImagePositionY(0)
            setNewImageScale(0.7)
            setDecorativeOpacity(0)
            setMapRotation(0)
            setMapPositionX(0)
            setMapScale(1.95)
            setFourthImageOpacity(0)
          }
        }

        rafId = null
      })
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [zScrollComplete, showDecorations, ANIMATION_CONFIG])

  return {
    scrollWidth,
    scrollHeight,
    imageWidth,
    imageHeight,
    boxScrollProgress,
    boxOpacity,
    obsessiveY,
    obsessiveOpacity,
    imageOpacity,
    showDecorations,
    elementsOpacity,
    boxPositionX,
    boxPositionY,
    boxRotation,
    mapOpacity,
    textRotation,
    textContent,
    textPositionX,
    textPositionY,
    newImageOpacity,
    newImagePositionX,
    newImagePositionY,
    newImageScale,
    decorativeOpacity,
    mapRotation,
    mapPositionX,
    mapScale,
    thirdImageOpacity,
    fourthImageOpacity,
    ctaTextOpacity,
    horsesOpacity,
    phase4Opacity,
    footerOpacity,
    borderHeight,
    phase5BackgroundColor,
    ctaTextY,
    horsesY,
  }
}
