import React, { useEffect, useState } from "react";
import { motion, usePresence } from "framer-motion";
import { TransitionOverlay } from "./transition";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const [isPresent, safeToRemove] = usePresence();
  const [showPixelCover, setShowPixelCover] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Consistent timing constants (in ms)
  const maxDelayMs = 600; // Time for all pixels to appear
  const pixelHoldMs = 150; // Hold with full pixel coverage before unmounting old page
  const newPageDelayMs = 150; // Additional delay before new page fades in
  const totalDurationMs = maxDelayMs + pixelHoldMs;

  // Handle exit: show pixel cover, then unmount
  useEffect(() => {
    if (isPresent) return;
    setShowPixelCover(true);
    const timer = setTimeout(() => safeToRemove(), totalDurationMs);
    return () => clearTimeout(timer);
  }, [isPresent, safeToRemove, totalDurationMs]);

  // Handle enter: delay content appearance until pixels have fully covered previous page
  useEffect(() => {
    if (!isPresent) return;
    // Wait for pixels to fully cover + hold + additional delay before showing new page
    const timer = setTimeout(() => setShowContent(true), totalDurationMs + newPageDelayMs);
    return () => clearTimeout(timer);
  }, [isPresent, totalDurationMs, newPageDelayMs]);
  return (
    <>
      {/* Pixel cover on exit - progressively takes over the screen */}
      <TransitionOverlay
        isActive={showPixelCover}
        mode="out"
        maxDelayMs={maxDelayMs}
      />

      {/* Page content appears after pixels have fully covered previous page */}
      <motion.div
        style={{
          minHeight: "100vh",
          // Hide immediately when exiting to prevent animation glitches
          visibility: (!isPresent && showPixelCover) ? 'hidden' : 'visible'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{
          duration: 0.4,
          delay: 0,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {children}
      </motion.div>
    </>
  );
};

export default PageTransition;
