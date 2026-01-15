import { useState, useRef, useEffect } from 'react';
import { LoadingScreen } from '../components/LoadingScreen';

export default function MainPage() {
  const isInitialMount = useRef(true);
  const [scrollProgress, setScrollProgress] = useState(() => {
    if (performance.navigation.type !== 1) {
      const saved = sessionStorage.getItem('scrollProgress');
      return saved ? parseFloat(saved) : 0;
    }
    sessionStorage.removeItem('scrollProgress');
    sessionStorage.removeItem('animationStage');
    return 0;
  });

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    sessionStorage.setItem('scrollProgress', scrollProgress.toString());
  }, [scrollProgress]);

  return (
    <LoadingScreen
      onComplete={() => {}}
      duration={6000}
      scrollProgress={scrollProgress}
      onScrollProgressChange={setScrollProgress}
    />
  );
}
