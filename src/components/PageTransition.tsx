import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Placeholder for pixelation animation logic
// Replace with your actual pixelation animation implementation
const Pixelation = ({ show }: { show: boolean }) => (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ opacity: show ? 1 : 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.7 }}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "#1a1a1a",
      zIndex: 9999,
      pointerEvents: "none",
    }}
  >
    {/* Add your pixelation effect here */}
  </motion.div>
);

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const [showPixel, setShowPixel] = useState(true);

  useEffect(() => {
    // Simulate pixel load-in animation
    const timer = setTimeout(() => setShowPixel(false), 900); // adjust duration as needed
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>{showPixel && <Pixelation show={showPixel} />}</AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showPixel ? 0 : 1 }}
        transition={{ duration: 0.5, delay: showPixel ? 0.7 : 0 }}
        style={{ minHeight: "100vh" }}
      >
        {children}
      </motion.div>
    </>
  );
};

export default PageTransition;
