import { useRef, useState, useEffect } from 'react';
import { useMotionValue } from 'framer-motion';
import { ScrollPhasesContainer } from './sections/scroll-phases/ScrollPhasesContainer';
import { useBoxScrollPhases } from './hooks/useBoxScrollPhases';
import { useMouseParallax } from './hooks/useMouseParallax';
import { useResponsiveScale } from './hooks/useResponsiveScale';
import { ANIMATION_CONFIG } from './config/animationConfig';

// This wrapper triggers zScrollComplete when it enters the viewport
const ScrollPhasesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [zScrollComplete, setZScrollComplete] = useState(false);

  // Intersection observer to trigger zScrollComplete
  useEffect(() => {
    const ref = sectionRef.current;
    if (!ref) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setZScrollComplete(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, []);

  // Responsive scale (optional, can be used for sizing)
  const scale = useResponsiveScale();
  // Mouse parallax (optional, can be used for parallax props)
  const parallax = useMouseParallax();
  // Phase logic
  const phases = useBoxScrollPhases(zScrollComplete, ANIMATION_CONFIG);

  // Pass all required props to ScrollPhasesContainer
  // (You will need to map phases/parallax/scale to the correct props)
  return (
    <div ref={sectionRef} style={{ minHeight: '100vh', position: 'relative', width: '100%' }}>
      <ScrollPhasesContainer
        zScrollComplete={zScrollComplete}
        scrollContainerRef={sectionRef}
        scrollWidth={phases.scrollWidth || '100%'}
        scrollHeight={phases.scrollHeight || '100vh'}
        boxParallaxX={parallax.boxParallaxX || useMotionValue(0)}
        boxParallaxY={parallax.boxParallaxY || useMotionValue(0)}
        boxOpacity={phases.boxOpacity || 1}
        boxPositionX={phases.boxPositionX || 0}
        boxPositionY={phases.boxPositionY || 0}
        boxRotation={phases.boxRotation || 0}
        imageOpacity={phases.imageOpacity || 0}
        imageWidth={phases.imageWidth || '100%'}
        imageHeight={phases.imageHeight || '100vh'}
        placeholderParallaxX={parallax.placeholderParallaxX || useMotionValue(0)}
        placeholderParallaxY={parallax.placeholderParallaxY || useMotionValue(0)}
        showDecorations={phases.showDecorations || false}
        imageTop={phases.imageTop || '0%'}
        elementsOpacity={phases.elementsOpacity || 1}
        mapOpacity={phases.mapOpacity || 0}
        mapRotation={phases.mapRotation || 0}
        mapPositionX={phases.mapPositionX || 0}
        mapScale={phases.mapScale || 1}
        mapParallaxX={parallax.mapParallaxX || useMotionValue(0)}
        mapParallaxY={parallax.mapParallaxY || useMotionValue(0)}
        newImageOpacity={phases.newImageOpacity || 0}
        newImageScale={phases.newImageScale || 1}
        newImagePositionX={phases.newImagePositionX || 0}
        newImagePositionY={phases.newImagePositionY || 0}
        newImageParallaxX={parallax.newImageParallaxX || useMotionValue(0)}
        newImageParallaxY={parallax.newImageParallaxY || useMotionValue(0)}
        decorativeOpacity={phases.decorativeOpacity || 0}
        thirdImageOpacity={phases.thirdImageOpacity || 0}
        thirdImageParallaxX={parallax.thirdImageParallaxX || useMotionValue(0)}
        thirdImageParallaxY={parallax.thirdImageParallaxY || useMotionValue(0)}
        thirdImageTextParallaxX={parallax.thirdImageTextParallaxX || useMotionValue(0)}
        thirdImageTextParallaxY={parallax.thirdImageTextParallaxY || useMotionValue(0)}
        fourthImageOpacity={phases.fourthImageOpacity || 0}
        fourthImageParallaxX={parallax.fourthImageParallaxX || useMotionValue(0)}
        fourthImageParallaxY={parallax.fourthImageParallaxY || useMotionValue(0)}
        fourthImageBoxParallaxX={parallax.fourthImageBoxParallaxX || useMotionValue(0)}
        fourthImageBoxParallaxY={parallax.fourthImageBoxParallaxY || useMotionValue(0)}
        fourthDecorativeBoxParallaxX={parallax.fourthDecorativeBoxParallaxX || useMotionValue(0)}
        fourthDecorativeBoxParallaxY={parallax.fourthDecorativeBoxParallaxY || useMotionValue(0)}
        fourthDecorativeTextParallaxX={parallax.fourthDecorativeTextParallaxX || useMotionValue(0)}
        fourthDecorativeTextParallaxY={parallax.fourthDecorativeTextParallaxY || useMotionValue(0)}
        phase4Opacity={phases.phase4Opacity || 0}
        decorativeBoxParallaxX={parallax.decorativeBoxParallaxX || useMotionValue(0)}
        decorativeBoxParallaxY={parallax.decorativeBoxParallaxY || useMotionValue(0)}
        decorativeTextParallaxX={parallax.decorativeTextParallaxX || useMotionValue(0)}
        decorativeTextParallaxY={parallax.decorativeTextParallaxY || useMotionValue(0)}
        textContent={phases.textContent || ''}
        obsessiveY={phases.obsessiveY || 0}
        obsessiveOpacity={phases.obsessiveOpacity || 0}
        obsessiveBottom={phases.obsessiveBottom || '0%'}
        obsessiveLeft={phases.obsessiveLeft || '0%'}
        textPositionX={phases.textPositionX || 0}
        textPositionY={phases.textPositionY || 0}
        textRotation={phases.textRotation || 0}
        obsessiveParallaxX={parallax.obsessiveParallaxX || useMotionValue(0)}
        obsessiveParallaxY={parallax.obsessiveParallaxY || useMotionValue(0)}
        buildersTextParallaxX={parallax.buildersTextParallaxX || useMotionValue(0)}
        buildersTextParallaxY={parallax.buildersTextParallaxY || useMotionValue(0)}
      />
    </div>
  );
};

export default ScrollPhasesSection;