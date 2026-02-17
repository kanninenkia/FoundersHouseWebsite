import React, { Suspense, useEffect, useRef, useState } from "react";
import { motion, usePresence } from "framer-motion";
import { TransitionOverlay, TRANSITION_TIMING, pageFadeEase } from "./index";

interface PageTransitionProps {
  children: React.ReactNode;
  skipEnter?: boolean;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, skipEnter = false }) => {
  const [isPresent, safeToRemove] = usePresence();
  const [showPixelCover, setShowPixelCover] = useState(false);
  const [showPixelReveal, setShowPixelReveal] = useState(false);
  const [showContent, setShowContent] = useState(skipEnter);
  const [suspenseResolved, setSuspenseResolved] = useState(false);
  const timersRef = useRef<number[]>([]);
  const exitRafRef = useRef<number | null>(null);

  const {
    maxDelayMs,
    pixelHoldMs,
    pixelRevealDelayMs,
    newPageDelayMs,
    pageFadeMs,
    maxTransitionMs,
  } = TRANSITION_TIMING;
  const totalDurationMs = maxDelayMs + pixelHoldMs;
  const clearTimers = () => {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current = [];
  };
  const clearExitRaf = () => {
    if (exitRafRef.current !== null) {
      cancelAnimationFrame(exitRafRef.current);
      exitRafRef.current = null;
    }
  };

  // Handle exit: show pixel cover, then unmount
  useEffect(() => {
    if (isPresent) return;
    clearTimers();
    clearExitRaf();
    setShowPixelCover(true);
    setShowPixelReveal(false);
    const timer = window.setTimeout(() => safeToRemove(), totalDurationMs);
    timersRef.current.push(timer);
    const start = performance.now();
    const tick = (now: number) => {
      if (now - start >= totalDurationMs + 50) {
        safeToRemove();
        return;
      }
      exitRafRef.current = requestAnimationFrame(tick);
    };
    exitRafRef.current = requestAnimationFrame(tick);
    return () => clearTimers();
  }, [isPresent, safeToRemove, totalDurationMs]);

  // Handle enter: reveal new page after pixel cover, then uncover pixels
  useEffect(() => {
    if (!isPresent) return;
    if (skipEnter) {
      clearTimers();
      clearExitRaf();
      setShowContent(true);
      setShowPixelCover(false);
      setShowPixelReveal(false);
      setSuspenseResolved(true);
      return;
    }
    clearTimers();
    clearExitRaf();
    setShowPixelCover(false);
    setShowPixelReveal(false);
    setShowContent(false);
    setSuspenseResolved(false);
  }, [isPresent, skipEnter]);

  // When Suspense resolves (new page is ready), trigger pixel-in
  useEffect(() => {
    if (!suspenseResolved || skipEnter) return;
    // Show content and pixel-in overlay
    setShowContent(true);
    setShowPixelReveal(true);
    // Hide pixel-in overlay after animation
    const stopRevealTimer = window.setTimeout(() => {
      setShowPixelReveal(false);
    }, maxDelayMs + TRANSITION_TIMING.overlayFadeMs);
    timersRef.current.push(stopRevealTimer);
    // Failsafe: hide overlays if something goes wrong
    const failSafeTimer = window.setTimeout(() => {
      setShowPixelReveal(false);
      setShowPixelCover(false);
    }, maxDelayMs + TRANSITION_TIMING.overlayFadeMs + 400);
    timersRef.current.push(failSafeTimer);
    return () => clearTimeout(stopRevealTimer);
  }, [suspenseResolved, skipEnter, maxDelayMs]);
  return (
    <>
      {/* Pixel cover on exit - progressively takes over the screen */}
      <TransitionOverlay
        isActive={showPixelCover}
        mode="out"
        maxDelayMs={maxDelayMs}
      />
      <TransitionOverlay
        isActive={showPixelReveal}
        mode="in"
        maxDelayMs={maxDelayMs}
      />

      {/* Page content appears after pixels have fully covered previous page */}
      <motion.div
        style={{
          minHeight: "100vh"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showPixelCover ? 1 : (showContent ? 1 : 0) }}
        transition={{
          duration: showContent ? pageFadeMs / 1000 : 0,
          delay: 0,
          ease: pageFadeEase
        }}
      >
        <Suspense
          fallback={
            <div
              style={{ background: 'transparent', width: '100vw', height: '100vh' }}
              ref={el => {
                if (el && !suspenseResolved) setSuspenseResolved(false);
              }}
            />
          }
        >
          <PageTransitionContent onReady={() => setSuspenseResolved(true)}>{children}</PageTransitionContent>
        </Suspense>
      </motion.div>
    </>
  );
};

export default PageTransition;
