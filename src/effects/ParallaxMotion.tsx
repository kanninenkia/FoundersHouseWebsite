import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, ReactNode } from "react";

interface ParallaxMotionProps {
  children: ReactNode;
  speedX?: number;
  speedY?: number;
  easing?: number[];
  delay?: number; // in ms
  [key: string]: any;
}

const ParallaxMotion = ({
  children,
  speedX = 20,
  speedY = 20,
  easing = [0.32, 0.26, 0, 1],
  delay = 0,
  ...rest
}: ParallaxMotionProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);

  useEffect(() => {
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
    let timeoutX: NodeJS.Timeout | null = null;
    let timeoutY: NodeJS.Timeout | null = null;
    const unsubX = mouseX.on("change", (v) => {
      if (timeoutX) clearTimeout(timeoutX);
      timeoutX = setTimeout(() => {
        animate(parallaxX, v * speedX, { ease: easing as any, duration: 0.6 });
      }, delay);
    });
    const unsubY = mouseY.on("change", (v) => {
      if (timeoutY) clearTimeout(timeoutY);
      timeoutY = setTimeout(() => {
        animate(parallaxY, v * speedY, { ease: easing as any, duration: 0.6 });
      }, delay);
    });
    return () => {
      unsubX();
      unsubY();
      if (timeoutX) clearTimeout(timeoutX);
      if (timeoutY) clearTimeout(timeoutY);
    };
  }, [mouseX, mouseY, parallaxX, parallaxY, speedX, speedY, easing, delay]);

  return (
    <motion.div style={{ x: parallaxX, y: parallaxY }} {...rest}>
      {children}
    </motion.div>
  );
};

export default ParallaxMotion;