import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, ReactNode } from "react";

const isSafari = typeof navigator !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

interface ParallaxMotionProps {
  children: ReactNode;
  speedX?: number;
  speedY?: number;
  easing?: number[];
  delay?: number; // in ms
  background?: string;
  [key: string]: any;
}

const ParallaxMotion = ({
  children,
  speedX = 20,
  speedY = 20,
  easing = [0.12, 0.26, 0, 1],
  delay = 0,
  background,
  ...rest
}: ParallaxMotionProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);

  useEffect(() => {
    if (isSafari) return;
    const handle = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;
      mouseX.set(normX);
      mouseY.set(normY);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (isSafari) return;
    const unsubX = mouseX.on("change", (v) => {
      animate(parallaxX, v * speedX, {
        ease: easing as any,
        duration: 1.4,
        delay: delay / 1000,
      });
    });
    const unsubY = mouseY.on("change", (v) => {
      animate(parallaxY, v * speedY, {
        ease: easing as any,
        duration: 1.4,
        delay: delay / 1000,
      });
    });
    return () => {
      unsubX();
      unsubY();
    };
  }, [mouseX, mouseY, parallaxX, parallaxY, speedX, speedY, easing, delay]);

  return (
    <motion.div
      style={{
        position: "relative",
        x: parallaxX,
        y: parallaxY,
        width: "100%",
        height: "100%",
      }}
      {...rest}
    >
      {background && (
        <div
          style={{
            background,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </motion.div>
  );
};

export default ParallaxMotion;
