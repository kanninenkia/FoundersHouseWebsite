import { useEffect, useState } from 'react'
import './LoadingScreen.css'

interface LoadingScreenProps {
  onComplete: () => void
  duration?: number
}

interface Block {
  id: number
  x: number
  y: number
  width: number
  height: number
  delay: number
}

type Stage = 'logo' | 'image' | 'pixel-out-to-text1' | 'text1' | 'pixel-out-to-text2' | 'text2' | 'complete'

export const LoadingScreen = ({ onComplete, duration = 3500 }: LoadingScreenProps) => {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [stage, setStage] = useState<Stage>('logo')

  useEffect(() => {
    // Generate random blocks with truly random delays
    const generatedBlocks: Block[] = []
    const cols = 4
    const rows = 4
    const blockWidth = 100 / cols
    const blockHeight = 100 / rows

    // Create blocks with random appearance order
    const blockPositions: Block[] = []
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        blockPositions.push({
          id: i * rows + j,
          x: i * blockWidth,
          y: j * blockHeight,
          width: blockWidth,
          height: blockHeight,
          delay: 0
        })
      }
    }

    // Shuffle blocks and assign random delays
    const shuffled = blockPositions.sort(() => Math.random() - 0.5)
    shuffled.forEach((block, index) => {
      generatedBlocks.push({
        ...block,
        delay: index * 50 // Stagger by 50ms for each block
      })
    })

    setBlocks(generatedBlocks)

    // Stage 1: Logo + loading bar (3.5s)
    const logoTimer = setTimeout(() => {
      setStage('image')
    }, duration)

    // Stage 2: Show image fullscreen (1.5s)
    const imageTimer = setTimeout(() => {
      setStage('pixel-out-to-text1')
    }, duration + 1500)

    // Stage 3: Pixel out image + show first text (1.5s pixel animation)
    const text1Timer = setTimeout(() => {
      setStage('text1')
    }, duration + 3000)

    // Stage 4: Show first text (2s)
    const text1HoldTimer = setTimeout(() => {
      setStage('pixel-out-to-text2')
    }, duration + 5000)

    // Stage 5: Pixel out text1 + show second text (1.5s pixel animation)
    const text2Timer = setTimeout(() => {
      setStage('text2')
    }, duration + 6500)

    // Stage 6: Show second text for 1.5s, then it slides up while map enters from below
    const completeTimer = setTimeout(() => {
      setStage('complete')
      onComplete()
    }, duration + 8000) // Text visible for 1.5s before sliding up

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(imageTimer)
      clearTimeout(text1Timer)
      clearTimeout(text1HoldTimer)
      clearTimeout(text2Timer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  const showImage = stage === 'image' || stage === 'pixel-out-to-text1'
  const showPixelTransition = stage === 'pixel-out-to-text1'
  const showText1 = stage === 'image' || stage === 'pixel-out-to-text1' || stage === 'text1' || stage === 'pixel-out-to-text2'
  const showText2 = stage === 'text2'

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Stage 1: Logo + Loading Bar */}
        {stage === 'logo' && (
          <>
            <div className="loading-logo">
              <img src="/fhlogo_horizontal.png" alt="Founders House" />
            </div>
            <div className="loading-bar-container">
              <div className="loading-bar" style={{ animationDuration: `${duration}ms` }} />
            </div>
          </>
        )}

        {/* Text 1: Behind the image, will be revealed by pixels */}
        {showText1 && (
          <div className="loading-text text-phase-1">
            <div className="text-top-left">
              <span className="text-normal">THE </span>
              <span className="text-emphasis">NEXT GENERATION</span>
            </div>
            <div className="text-bottom-right">
              <span className="text-normal">OF </span>
              <span className="text-emphasis">OBSESSED BUILDERS</span>
            </div>
          </div>
        )}

        {/* Stage 2: Fullscreen image (on top of text) */}
        {showImage && (
          <div className="loading-image visible">
            <img src="/LoadInImage.png" alt="Founders House" />
          </div>
        )}

        {/* Cream blocks that reveal text underneath by covering the image */}
        {showPixelTransition && (
          <div className="blocks-container">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="block pixel-reveal"
                style={{
                  left: `${block.x}%`,
                  top: `${block.y}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                  animationDelay: `${block.delay}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Second text: "where ambition concentrates talent multiplies" */}
        {showText2 && (
          <div className="loading-text text-phase-2">
            <div className="text-top-left">
              <span className="tagline-line">WHERE </span>
              <span className="tagline-emphasis">AMBITION CONCENTRATES</span>
            </div>
            <div className="text-bottom-right">
              <span className="tagline-emphasis">TALENT MULTIPLIES</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
