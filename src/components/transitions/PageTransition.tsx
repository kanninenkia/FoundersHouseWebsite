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
  const setNoiseHidden = (hidden: boolean) => {
    if (typeof document === "undefined") return;
    if (hidden) {
      document.documentElement.classList.add("transition-noise-off");
      document.body.classList.add("transition-noise-off");
    } else {
      document.documentElement.classList.remove("transition-noise-off");
      document.body.classList.remove("transition-noise-off");
    }
  };

  // Handle exit: show pixel cover, then unmount
  useEffect(() => {
    if (isPresent) return;
    clearTimers();
    clearExitRaf();
    setNoiseHidden(true);
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
      setNoiseHidden(false);
      setShowContent(true);
      setShowPixelCover(false);
      setShowPixelReveal(false);
      return;
    }
    clearTimers();
    clearExitRaf();
    setNoiseHidden(true);
    setShowPixelCover(false);
    setShowPixelReveal(false);
    setShowContent(false);

    // Use requestAnimationFrame to ensure state updates are processed correctly on mobile
    requestAnimationFrame(() => {
      const startRevealTimer = window.setTimeout(() => {
        requestAnimationFrame(() => {
          setShowContent(true);
          setShowPixelReveal(true);
        });
        const stopRevealTimer = window.setTimeout(
          () => {
            requestAnimationFrame(() => setShowPixelReveal(false));
          },
          maxDelayMs + TRANSITION_TIMING.overlayFadeMs
        );
        timersRef.current.push(stopRevealTimer);
      }, totalDurationMs + newPageDelayMs + pixelRevealDelayMs);
      timersRef.current.push(startRevealTimer);

      const failSafeTimer = window.setTimeout(() => {
        requestAnimationFrame(() => {
          setShowContent(true);
          setShowPixelCover(false);
          setShowPixelReveal(false);
        });
      }, totalDurationMs + newPageDelayMs + pixelRevealDelayMs + maxDelayMs + TRANSITION_TIMING.overlayFadeMs + 200);
      timersRef.current.push(failSafeTimer);

      const watchdogTimer = window.setTimeout(() => {
        requestAnimationFrame(() => {
          setShowContent(true);
          setShowPixelCover(false);
          setShowPixelReveal(false);
        });
      }, maxTransitionMs);
      timersRef.current.push(watchdogTimer);

      const noiseReleaseTimer = window.setTimeout(() => {
        setNoiseHidden(false);
      }, totalDurationMs + newPageDelayMs + pixelRevealDelayMs + maxDelayMs + TRANSITION_TIMING.overlayFadeMs);
      timersRef.current.push(noiseReleaseTimer);
    });

    return () => {
      clearTimers();
      clearExitRaf();
      setNoiseHidden(false);
    };
  }, [isPresent, totalDurationMs, newPageDelayMs, maxDelayMs, pixelRevealDelayMs, skipEnter]);
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
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{
          duration: pageFadeMs / 1000,
          delay: 0,
          ease: pageFadeEase
        }}
      >
        <Suspense fallback={<div style={{ background: '#590D0F', width: '100vw', height: '100vh' }} />}>
          {children}
        </Suspense>
      </motion.div>
    </>
  );
};

export default PageTransition;
