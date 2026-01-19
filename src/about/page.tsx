import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useAnimation } from "framer-motion";
import { useMotionValue, useTransform } from "framer-motion";
import GridDistortion from '../effects/GridDistortion.tsx';
import ParallaxMotion from '../effects/ParallaxMotion.tsx';
import "./page.css";
import Footer from "../components/Footer.tsx";
const HEADER_IMG_SRC = "/images/The Legends Day.webp";
const SECTION2_IMG_SRC = "/images/Wave x Maki Photo (2).webp";
const SECTION3_IMG_1_SRC = "/images/Legends Day Still 002.webp";
const SECTION3_IMG_2_SRC = "/images/Wave x Maki Photo.webp";
const SECTION3_IMG_3_SRC = "/images/LoadInImage-min.webp";
const SECTION4_IMG_SRC = "/images/Legends Day Still 014.webp";
const SECTION5_MAP_IMG_SRC = "/models/birdseyemaps.webp";
const SECTION5_MAP_TOP_IMG_SRC = "/models/radar.webp";
const FOUNDERS_HOUSE_TEAM_IMG_SRC = "/images/Founders House BW.webp";  

export default function AboutPage() {
  const [stage, setStage] = useState(1);
  // For team hover effect
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hoveredMember) return;
    function handleClickOutside(event: MouseEvent) {
      if (teamRef.current && !teamRef.current.contains(event.target as Node)) {
        setHoveredMember(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hoveredMember]);
  // Ref for section-5
  const section5Ref = useRef<HTMLDivElement>(null);
  const [imgScale, setImgScale] = useState(1.5);
  const [imgSkew, setImgSkew] = useState(-50); // degrees, negative for backward tilt
    // Use rAF for scale animation (Lenis compatible)
    useEffect(() => {
      let running = true;
      function animate() {
        if (!running) return;
        if (section5Ref.current) {
          const rect = section5Ref.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const total = rect.height + windowHeight;
          const visible = windowHeight - rect.top;
          let progress = visible / total;
          progress = Math.max(0, Math.min(1, progress));
          const scale = 1.5 - 0.5 * progress;
          setImgScale(scale);
          // Skew from -50deg (backward tilt) to 0deg
          const skew = -50 + 50 * progress;
          setImgSkew(skew);
        }
        requestAnimationFrame(animate);
      }
      animate();
      return () => { running = false; };
    }, []);

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
  /* Section 2 */
  const section2BG = useTransform(scrollY, [0, 1500], [-300, 50]);
  const section2Content = useTransform(scrollY, [0, 1500], [-150, 200]);
  /* Section 3 */
  const section3 = useTransform(scrollY, [0, 1800], [0, 0]);
  const section3img1 = useTransform(scrollY, [0, 1800], [0, -100]);
  const section3img2 = useTransform(scrollY, [0, 1800], [500, -260]);
  const section3img3 = useTransform(scrollY, [0, 1800], [350, -240]);
  const section3text = useTransform(scrollY, [0, 1800], [0, -150]);
  /* Section 4 */
  const section4 = useTransform(scrollY, [0, 0], [0, 0]);
  const section4BG = useTransform(scrollY, [0, 2500], [-500, -50]);
  const section4Content = useTransform(scrollY, [0, 2500], [-100, 100]);
  /* Section 5 */
  const section5Content = useTransform(scrollY, [0, 3000], [0, -300]);
  /* Last Section */
  const floatingRedBorderY = useTransform(scrollY, [0, 3000], [0, 150]);

  const section3Ref = useRef<HTMLDivElement>(null);
  const revealerControls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      if (!section3Ref.current) return;
      const rect = section3Ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // When the top of section-3 is above the bottom by half its height
      if (rect.top < windowHeight - rect.height / 8) {
        revealerControls.start({ y: "100%" }); // Move up (adjust as needed)
      } else {
        revealerControls.start({ y: "0%" }); // Original position
      }
    };
    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [revealerControls]);

  // Transition from stage 1 to stage 2 after a delay
  useEffect(() => {
    if (stage === 1) {
      const timer = setTimeout(() => setStage(2), 3000); // 2 seconds for stage 1, then transition
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <div style={{ position: "relative", maxWidth: "100%", minHeight: "100vh", background: "#2B0906" }}>
      {/*---------------------------------------------------------------------*/}
      {/* Persistent animated image container */}
      {/*---------------------------------------------------------------------*/}
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
          transition={{ delay: 0.1, duration: 1.8, ease: [0.22, 0.26, 0, 1] }}
        >
          <div className="stage1-text-overlay-wrapper">
            <motion.h2 
              className="stage1-text-overlay-h2"
              initial={{ y: 0 }}
              animate={
                stage === 1
                ? { y: 0 }
                : { y: 0, filter: "blur(20px)", opacity: 0 }
              }
              transition={{ delay: 0.8, duration: 0.8, ease: [0.42, 0.00, 1.00, 1.00] }}
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
                : { y: 0, filter: "blur(20px)", opacity: 0 }
              }
              transition={{ delay: 0.8, duration: 0.8, ease: [0.42, 0.00, 1.00, 1.00] }}
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
                : { y: 0, filter: "blur(20px)", opacity: 0 }
              }
              transition={{ delay: 0.8, duration: 0.8, ease: [0.42, 0.00, 1.00, 1.00] }}
              >
                <span>BUILDERS</span>
            </motion.h2>
          </div>
        </motion.div>
      </motion.div>

      {/*---------------------------------------------------------------------*/}
      {/* Stage 1 content */}
      {/*---------------------------------------------------------------------*/}
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
            className="stage2-wrapper"
          >
            <div className="header-wrapper" style={{pointerEvents: "none"}}>
              <motion.div className="header-content" style={{ y: headerContent }}>
                <ParallaxMotion speedX={30} speedY={15} easing={[0.17, 0.67, 0.3, 0.99]} delay={10}>
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
                  <ParallaxMotion speedX={40} speedY={25} easing={[0.17, 0.67, 0.3, 0.99]}>
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
              <motion.div className="section-2-bg-container" style={{ y: section2BG }}>
                <ParallaxMotion speedX={20} speedY={15} easing={[0.22, 0.67, 0.3, 0.99]} delay={12}>
                  <motion.img
                    className="section-2-bg"
                    src={SECTION2_IMG_SRC}
                    alt="About"
                    style={{ scale: 1.05 }}
                  />
                </ParallaxMotion>
              </motion.div>        
              
                <motion.div className="section-2-content" style={{ y: section2Content }}>
                  <ParallaxMotion speedX={30} speedY={32} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <p>Founders House Helsinki is the hub for Finland’s most promising next-gen startups. A home for builders who move faster than anyone else, think differently, and raise the bar for everyone around them.</p>
                  </ParallaxMotion>
                </motion.div>
            </div>

            <motion.div className="section-3" style={{ y: section3 }} ref={section3Ref}>
              <motion.div
                className="section-3-revealer"
                animate={revealerControls}
                transition={{ type: "tween", duration: 0.8, ease: [0.22, 0.67, 0.3, 0.99] }}
              />
              <div className="section-3-content">
                <div className="img-container">
                  <ParallaxMotion speedX={15} speedY={15} delay={0}>
                    <motion.img className="img-1" src={SECTION3_IMG_1_SRC} style={{ y: section3img1 }} />
                  </ParallaxMotion>
                  <ParallaxMotion speedX={26} speedY={26} delay={5}>  
                    <motion.img className="img-2" src={SECTION3_IMG_2_SRC} style={{ y: section3img2 }} />
                  </ParallaxMotion>
                  <ParallaxMotion speedX={42} speedY={42} delay={10}>
                    <motion.img className="img-3" src={SECTION3_IMG_3_SRC} style={{ y: section3img3 }} />
                  </ParallaxMotion>
                </div>
                <ParallaxMotion speedX={70} speedY={70} delay={5}>
                  <motion.p style={{ y: section3text }}>We're here to support them through a tight-knit community shaped by high ambition, collaboration, and shared energy—all under one roof. Here collisions happen naturally, where potential multiplies, and where the right people find each other.</motion.p>
                </ParallaxMotion>
              </div>
            </motion.div>

            <motion.div className="section-4" style={{ y: section4 }}>
              <motion.div
                className="section-4-bg-container"
                style={{ y: section4BG }}
              >
                <ParallaxMotion speedX={20} speedY={15} easing={[0.22, 0.67, 0.3, 0.99]} delay={12}>
                  <motion.img
                    className="section-4-bg"
                    src={SECTION4_IMG_SRC}
                    alt="About"
                    style={{ scale: 1.05 }}
                  />
                </ParallaxMotion>
              </motion.div>
              {/* Add a tall test section to enable scrolling */}
              <motion.div className="section-4-content" style={{ y: section4Content }}>
                <ParallaxMotion speedX={30} speedY={32} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <p>Founders House Helsinki is the hub for Finland’s most promising next-gen startups. A home for builders who move faster than anyone else, think differently, and raise the bar for everyone around them.</p>
                </ParallaxMotion>
              </motion.div>
            </motion.div>

            <motion.div className="section-5" ref={section5Ref}>
              <div className="section-5-content">
                <div className="content-img-container">
                    <div className="img-container-fade">
                        <div className="img-gradient-left" />
                        <div className="img-gradient-right" />
                        <div className="img-gradient-top" />
                        <div className="img-gradient-bottom" />
                    </div>
                    <div style={{ mixBlendMode: "multiply" }}>
                      <ParallaxMotion background="#2B0906" speedX={16} speedY={16} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <motion.img
                          className="section-5-map-img"
                          src={SECTION5_MAP_IMG_SRC}
                          alt="2D Map"
                          style={{ mixBlendMode: "multiply", width: "100%", height: "auto", transform: `skewY(${imgSkew}deg)`, top: "10%" }}
                          animate={{ scale: imgScale }}
                          transition={{ duration: 0.6, ease: [0.17, 0.67, 0.3, 0.99] }}
                        />
                    </ParallaxMotion>
                  </div>
                  <ParallaxMotion speedX={16} speedY={16} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <motion.img
                      className="section-5-map-img"
                      src={SECTION5_MAP_TOP_IMG_SRC}
                      alt="2D Map Pin"
                      style={{ width: "100%", height: "auto", transform: `skewY(${imgSkew}deg)`, top: "10%" }}
                      animate={{ scale: imgScale }}
                      transition={{ duration: 0.6, ease: [0.17, 0.67, 0.3, 0.99] }}
                    />
                  </ParallaxMotion>
                </div>
                <motion.div className="content-text" style={{ y: section5Content }}>
                  <ParallaxMotion speedX={40} speedY={45} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <p>Founders House Helsinki is more than a workspace. It’s a standard and the place where the next generation builds before the rest of the world realizes who they are. The next wave of Finland’s unicorns will have their roots here.</p>
                  </ParallaxMotion>
                </motion.div>
              </div>
            </motion.div>

            <motion.div className="last-section">
              <div className="team-img-wrapper">
                <ParallaxMotion speedX={15} speedY={15} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <div className="team-img-container">
                    {/*
                    <img src={FOUNDERS_HOUSE_TEAM_IMG_SRC} alt="" />
                    */}
                    <GridDistortion
                      imageSrc={FOUNDERS_HOUSE_TEAM_IMG_SRC}
                      grid={20}
                      mouse={0.25}
                      strength={0.01}
                      relaxation={0.95}
                      className="team-distortion-img"
                    />
                  </div>
                </ParallaxMotion>
              </div>
              <motion.div className="floating-red-border-wrapper">
                <ParallaxMotion speedX={40} speedY={20} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <div className="floating-red-border"></div>
                </ParallaxMotion>
              </motion.div>
              <div className="team-text-wrapper">
                <ParallaxMotion speedX={25} speedY={25} delay={10} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <h3>THE TEAM</h3>
                </ParallaxMotion>
              </div>
            </motion.div>

            <div className="team-individuals-wrapper" ref={teamRef}>
              <ParallaxMotion speedX={25} speedY={25} delay={10} easing={[0.17, 0.67, 0.3, 0.99]}>
                <div className="individuals">
                  <div
                    className={`individual-name${hoveredMember === "camilla" ? " active" : ""}`}
                    onMouseEnter={() => setHoveredMember("camilla")}
                  >
                    <h4>Camilla Komulainen</h4>
                  </div>
                  <div
                    className={`individual-name${hoveredMember === "kia" ? " active" : ""}`}
                    onMouseEnter={() => setHoveredMember("kia")}
                  >
                    <h4>Kia Kanninen</h4>
                  </div>
                  <div
                    className={`individual-name${hoveredMember === "niklas" ? " active" : ""}`}
                    onMouseEnter={() => setHoveredMember("niklas")}
                  >
                    <h4>Niklas Kervinen</h4>
                  </div>
                  <div
                    className={`individual-name${hoveredMember === "johannes" ? " active" : ""}`}
                    onMouseEnter={() => setHoveredMember("johannes")}
                  >
                    <h4>Johannes Korpela</h4>
                  </div>
                  <div
                    className={`individual-name${hoveredMember === "robin" ? " active" : ""}`}
                    onMouseEnter={() => setHoveredMember("robin")}
                  >
                    <h4>Robin Hansson</h4>
                  </div>
                </div>
              </ParallaxMotion>
              <ParallaxMotion speedX={10} speedY={10} delay={10} easing={[0.17, 0.67, 0.3, 0.99]}>
                <div className="individuals-profiles">
                  <AnimatePresence mode="wait">
                    {hoveredMember === "camilla" && (
                      <motion.div
                        key="camilla"
                        className="profiles-card card-camilla"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <img src="images/camilla.webp" alt="Camilla Komulainen" />
                        <h5>started to like horses</h5>
                        <a className="card-email" href="mailto:camilla@wave.ventures">camilla@wave.ventures</a>
                        <a className="card-linkedin" href="https://www.linkedin.com/in/camillakomulainen/">linkedin</a>
                      </motion.div>
                    )}
                    {hoveredMember === "kia" && (
                      <motion.div
                        key="kia"
                        className="profiles-card card-kia"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <img src="images/kia.webp" alt="Kia Kanninen" />
                        <h5>Likes horses</h5>
                        <a className="card-email" href="mailto:kia@wave.ventures">kia@wave.ventures</a>
                        <a className="card-linkedin" href="https://www.linkedin.com/in/kiakanninen/">linkedin</a>
                      </motion.div>
                    )}
                    {hoveredMember === "niklas" && (
                      <motion.div
                        key="niklas"
                        className="profiles-card card-niklas"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <img src="images/niklas.webp" alt="Niklas Kervinen" />
                        <h5>Likes horses</h5>
                        <a className="card-email" href="mailto:niklas@wave.ventures">niklas@wave.ventures</a>
                        <a className="card-linkedin" href="https://www.linkedin.com/in/niklas-kervinen/">linkedin</a>
                      </motion.div>
                    )}
                    {hoveredMember === "johannes" && (
                      <motion.div
                        key="johannes"
                        className="profiles-card card-johannes"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <img src="images/johannes.webp" alt="Johannes Korpela" />
                        <h5>Likes horses</h5>
                        <a className="card-email" href="mailto:johannes@wave.ventures">johannes@wave.ventures</a>
                        <a className="card-linkedin" href="https://www.linkedin.com/in/korpelajohannes/">linkedin</a>
                      </motion.div>
                    )}
                    {hoveredMember === "robin" && (
                      <motion.div
                        key="robin"
                        className="profiles-card card-robin"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <img src="images/robin.webp" alt="Robin Hansson" />
                        <h5>Likes horses</h5>
                        <a className="card-email" href="mailto:robin@wave.ventures">robin@wave.ventures</a>
                        <a className="card-linkedin" href="https://www.linkedin.com/in/robin-hansson-/">linkedin</a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ParallaxMotion>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}