
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { useMotionValue, useTransform } from "framer-motion";
import GridDistortion from '../effects/GridDistortion.tsx';
import ParallaxMotion from '../effects/ParallaxMotion.tsx';
import "./page.css";

const HEADER_IMG_SRC = "/images/The Legends Day.webp";
const SECTION2_IMG_SRC = "/images/Wave x Maki Photo (2).webp";
const SECTION4_IMG_SRC = "/images/Legends Day Still 014.webp";

export default function AboutPage() {
  const [stage, setStage] = useState(1);
  // Parallax setup
  const yScroll = useMotionValue(0);
  // Parallax: image moves at 40% scroll speed in stage 2
  const parallaxY = useTransform(yScroll, (v) => stage === 2 ? v * 0.4 : 0);


  //--------------------------------------//
  // Parallax on Elements Settings //
  //--------------------------------------//
  const { scrollY } = useScroll();
  const headerBG = useTransform(scrollY, [0, 1000], [0, 200]);
  const headerContent = useTransform(scrollY, [0, 1000], [0, 100]);
  const section2BG = useTransform(scrollY, [0, 1500], [-400, 100]);
  const section2Content = useTransform(scrollY, [0, 1500], [-150, 200]);
  const section3 = useTransform(scrollY, [0, 1800], [0, 0]);
  const section4 = useTransform(scrollY, [0, 0], [0, 0]);
  const section4BG = useTransform(scrollY, [0, 2500], [-1200, 50]);
  const section4Content = useTransform(scrollY, [0, 2500], [-100, 100]);

  // Transition from stage 1 to stage 2 after a delay
  useEffect(() => {
    if (stage === 1) {
      const timer = setTimeout(() => setStage(2), 3000); // 2 seconds for stage 1, then transition
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <div style={{ position: "relative", maxWidth: "100%", minHeight: "100vh", background: "#af4f47" }}>
      {/* Persistent animated image container */}
      <motion.div
        className="stage1-img-container"
        initial={false}
        animate={
            stage === 1
            ? { width: "100%", height: "100vh", overflow: "hidden", position: "absolute", top: "10vh", left: "50%", x: "-50%", scale: 0.9, zIndex: 2 }
            : { width: "100%", height: "100vh", overflow: "hidden", position: "absolute", top: "0", left: "50%", x: "-50%", scale: 1, zIndex: 2 }
        }
        transition={{ duration: 1.2, ease: [0.32, 0.26, 0, 1] }}
      >
        <ParallaxMotion speedX={12} speedY={12} easing={[0.37, 0.67, 0.3, 0.97]} delay={12}>
          <motion.img
            className="stage1-img"
            src={HEADER_IMG_SRC}
            alt="About"
            initial={false}
            animate={
                stage === 1
                ? { width: "100%", height: "100vh", position: "absolute", objectFit: "cover", filter: "grayscale(1) brightness(0.6)", scale: 1.4 }
                : { width: "100%", height: "100vh", position: "absolute", objectFit: "cover", filter: "grayscale(1) brightness(0.4)", scale: 1.05 }
            }
            transition={{ duration: 2, ease: [0.32, 0.26, 0, 1] }}
            style={{ y: headerBG }}
          />
        </ParallaxMotion>
        <motion.div
          className="stage1-text-overlay"
          initial={false}
          animate={
            stage === 1
            ? { width: "100%", top: 0, objectFit: "cover", scale: 1 }
            : { width: "100%", top: 0, objectFit: "cover", scale: 0.9 }
          }
          transition={{ delay: 0.1, duration: 1.8, ease: [0.32, 0.26, 0, 1] }}
        >
          <div className="stage1-text-overlay-wrapper">
            <motion.h2 
              className="stage1-text-overlay-h2"
              initial={{ y: 0 }}
              animate={
                stage === 1
                ? { y: 0 }
                : { y: 80 }
              }
              transition={{ delay: 1.5, duration: 0.6, ease: [0.17, 0.22, 0.20, 0.99] }}
              >
                <span>NEXT</span> <span>GENERATION</span>
            </motion.h2>
          </div>
          <div className="stage1-text-overlay-wrapper">
            <motion.h2 
              className="stage1-text-overlay-h2"
              initial={{ y: 0 }}
              animate={
                stage === 1
                ? { y: 0 }
                : { y: 80 }
              }
              transition={{ delay: 1.55, duration: 0.6, ease: [0.17, 0.22, 0.20, 0.99] }}
              >
                <span>OF</span> <span>OBSESSED</span>
            </motion.h2>
          </div>
          <div className="stage1-text-overlay-wrapper">
            <motion.h2 
              className="stage1-text-overlay-h2"
              initial={{ y: 0 }}
              animate={
                stage === 1
                ? { y: 0 }
                : { y: 80 }
              }
              transition={{ delay: 1.6, duration: 0.6, ease: [0.17, 0.22, 0.20, 0.99] }}
              >
                <span>BUILDERS</span>
            </motion.h2>
          </div>
        </motion.div>
      </motion.div>

      {/* Stage 1 content */}
      <AnimatePresence>
        {stage === 1 && (
          <motion.div
            className="stage1-wrapper"
            key="stage1"
            initial={{ opacity: 1, y: 15 }}
            exit={{ opacity: 0.5, y: -30 }}
            transition={{ duration: 2, ease: [0.32, 0.26, 0, 1] }}
            style={{ position: "absolute", width: "100%", height: "100vh", zIndex: 1 }}
          >
            <div className="corner-elements">
              <motion.div
                className="corner-element top-left"
                initial={{ left: "20px", opacity: 1 }}>
                  <p>FOUNDERS HOUSE</p>
              </motion.div>
              <motion.div
                className="corner-element top-right"
                initial={{ right: "15px", opacity: 1 }}>
                  <p>HELSINKI, FINLAND</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*---------------------------------------------------------------------*/}
      {/* Stage 2 content */}
      {/*---------------------------------------------------------------------*/}
      <AnimatePresence>
        {stage === 2 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: "relative", width: "100%", zIndex: 4 }}
          >
            <div className="header-wrapper">
              <motion.div className="header-content" style={{ y: headerContent }}>
                <ParallaxMotion speedX={30} speedY={15} easing={[0.37, 0.67, 0.3, 0.67]} delay={10}>
                  <div className="header-h1-wrapper">
                    <motion.h1
                      className="header-h1"
                      initial={{ y: 175 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 2.4, duration: 1.3, ease: [0.11, 0.45, 0.08, 1.00] }}
                      >
                        ABOUT
                    </motion.h1>
                  </div>
                </ParallaxMotion>
                <div className="header-h3-wrapper">
                  <ParallaxMotion speedX={40} speedY={25} easing={[0.27, 0.67, 0.3, 0.67]}>
                    <motion.h3
                      className="header-h3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.6, duration: 1, ease: [0.11, 0.45, 0.08, 1.00] }}
                      >
                        We believe that the future generational companies will be built by a small group of exceptional next-gen founders.
                    </motion.h3>  
                  </ParallaxMotion>
                </div>
              </motion.div>
            </div>

            <div className="section-2">
              <motion.div
                className="section-2-bg-container"
                style={{ y: section2BG }}
              >
                <GridDistortion
                  imageSrc={SECTION2_IMG_SRC}
                  grid={20}
                  mouse={0.1}
                  strength={0.04}
                  relaxation={0.96}
                  className="section-2-bg"
                />
              </motion.div>        
              
                <motion.div className="section-2-content" style={{ y: section2Content }}>
                  <ParallaxMotion speedX={30} speedY={30} easing={[0.37, 0.67, 0.3, 0.67]}>
                    <p>Founders House Helsinki is the hub for Finland’s most promising next-gen startups. A home for builders who move faster than anyone else, think differently, and raise the bar for everyone around them.</p>
                  </ParallaxMotion>
                </motion.div>
            </div>

            <motion.div className="section-3" style={{ y: section3 }}>
              <div className="section-3-content">
                <div className="img-container">
                  <img className="img-1" src={SECTION2_IMG_SRC} />
                  <img className="img-2" src={SECTION2_IMG_SRC} />
                  <img className="img-3" src={SECTION2_IMG_SRC} />
                </div>
                <p>We're here to support them through a tight-knit community shaped by high ambition, collaboration, and shared energy—all under one roof. Here collisions happen naturally, where potential multiplies, and where the right people find each other.</p>
              </div>
            </motion.div>

            <motion.div className="section-4" style={{ y: section4 }}>
              <motion.img
              className="section-4-bg"
              src={SECTION4_IMG_SRC}
              alt="About"
              style={{ y: section4BG }}
              />
              {/* Add a tall test section to enable scrolling */}
              <motion.div className="section-4-content" style={{ y: section4Content }}>
                <p>Founders House Helsinki is the hub for Finland’s most promising next-gen startups. A home for builders who move faster than anyone else, think differently, and raise the bar for everyone around them.</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
