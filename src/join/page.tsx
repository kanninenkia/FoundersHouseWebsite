import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useAnimation, color } from "framer-motion";
import { useMotionValue, useTransform } from "framer-motion";
import GridDistortion from '../effects/GridDistortion.tsx';
import ParallaxMotion from '../effects/ParallaxMotion.tsx';
import "./page.css";
import "./pageMobile.css";
import { HelsinkiViewer } from "../components/map";
import { Footer, NavBar } from "../components/layout";
import { Button } from "../components/ui";
import { joinContent } from './join-content';

const HEADER_IMG_SRC = "/assets/images/membership/horses.webp";
const RESIDENT_SRC = "/assets/images/membership/resident.webp";
const MEMBER_SRC = "/assets/images/membership/member.webp";
const PROCESS_SRC = "/assets/images/membership/FH_people1.webp";

export default function JoinPage({ audioRef, audio2Ref }: { audioRef?: React.MutableRefObject<HTMLAudioElement | null>, audio2Ref?: React.MutableRefObject<HTMLAudioElement | null> }) {
  const [stage, setStage] = useState(1);
  const [showNavBar, setShowNavBar] = useState(false);
  const [enableScrollScale, setEnableScrollScale] = useState(false);
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

    useEffect(() => {
    const timer = setTimeout(() => {
      setShowNavBar(true);
    }, 3000);
    return () => clearTimeout(timer);
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
  const headerContent = useTransform(scrollY, [0, 1000], [0, -100]);

  // Scroll-based scale for stage1-img-container in stage 2
  const stage1ImgScale = useTransform(scrollY, [0, 400], [1, 0.9]);
  /* Section 2 */
  const section2BG = useTransform(scrollY, [0, 1500], [-100, 200]);
  const section2Content = useTransform(scrollY, [0, 1500], [-150, 200]);

  // Scroll-based scale for header-wrapper in stage 2
  const headerWrapperScale = useTransform(scrollY, [0, 400], [1, 0.92]);

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
      setEnableScrollScale(false);
      const timer = setTimeout(() => setStage(2), 1000);
      return () => clearTimeout(timer);
    } else if (stage === 2) {
      // Wait for the transition to finish before enabling scroll-based scale
      const timer = setTimeout(() => setEnableScrollScale(true), 1200); // matches transition duration
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <div style={{ position: "relative", maxWidth: "100%", minHeight: "100vh", background: "#2B0906" }}>
      <NavBar logoColor="dark" hamburgerColor="#FFF8F2" streakColor="rgba(216, 46, 17, 1)" opacity={showNavBar ? 1 : 0} audioRef={audioRef} audio2Ref={audio2Ref} />
      <section className="visually-hidden" aria-label="Join Founders House">
        <h1>Join Founders House</h1>
        <p>Apply to become part of Founders House in Helsinki.</p>
        <p>Membership is designed for ambitious founders building the next generation of companies.</p>
      </section>
      {/*---------------------------------------------------------------------*/}
      {/* Persistent animated image container */}
      {/*---------------------------------------------------------------------*/}
      <motion.div
        className="stage1-img-container"
        initial={false}
        animate={
          stage === 1
            ? { width: "100%", height: "100vh", overflow: "hidden", position: "absolute", top: "10vh", left: "50%", x: "-50%", scale: 0.9, zIndex: 2 }
            : { width: "100%", height: "100vh", overflow: "hidden", position: "absolute", top: "0", left: "50%", x: "-50%", zIndex: 2, scale: 1 }
        }
        transition={{ duration: 1.2, ease: [0.32, 0.26, 0, 1] }}
        style={stage === 2 && enableScrollScale ? { scale: stage1ImgScale } : {}}
      >
        <ParallaxMotion speedX={12} speedY={12} easing={[0.37, 0.67, 0.3, 0.97]} delay={12}>
          <motion.img
            className="stage1-img"
            src={HEADER_IMG_SRC}
            alt="About"
            initial={false}
            animate={
                stage === 1
                ? { width: "100%", height: "100vh", position: "absolute", objectFit: "cover", filter: "grayscale(1) brightness(0.9)", scale: 1.4 }
                : { width: "100%", height: "100vh", position: "absolute", objectFit: "cover", filter: "grayscale(1) brightness(0.7)", scale: 1.05 }
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
                <span>{joinContent.hero.line1}</span>
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
                <span>{joinContent.hero.line2}</span>
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
            style={{ position: "absolute", width: "100%", height: "100vh", zIndex: 5 }}
          >
            <div className="corner-elements">
              <motion.div
                className="corner-element top-left"
                initial={{ left: "20px", opacity: 1 }}>
                  <p>{joinContent.hero.topLeft}</p>
              </motion.div>
              <motion.div
                className="corner-element top-right"
                initial={{ right: "15px", opacity: 1 }}>
                  <p>{joinContent.hero.topRight}</p>
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

            <motion.div
              className="header-wrapper"
              style={enableScrollScale ? { pointerEvents: "none", scale: headerWrapperScale } : { pointerEvents: "none" }}
            >
              <motion.div className="header-content" style={{ y: headerContent }}>
                <ParallaxMotion speedX={15} speedY={15} easing={[0.17, 0.67, 0.3, 0.99]} delay={6}>
                  <div className="header-h1-wrapper">
                    <motion.h1
                      className="header-h1"
                      initial={{ y: 175 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 2.4, duration: 1.1, ease: [0.11, 0.45, 0.08, 1.00] }}
                      >
                        {joinContent.header.title}
                    </motion.h1>
                  </div>
                </ParallaxMotion>
                <div className="header-h3-wrapper">
                  <ParallaxMotion speedX={30} speedY={30} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <motion.h3
                      className="header-h3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.6, duration: 1, ease: [0.11, 0.45, 0.08, 1.00] }}
                      >
                        {joinContent.header.subtitle}
                    </motion.h3>  
                  </ParallaxMotion>
                </div>
              </motion.div>
            </motion.div>

            <div className="section-2">
              <div className="content-wrapper">
                <motion.div
                  className="join-type type-resident"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  style={{ y: section2BG }}
                  >
                  <ParallaxMotion className="second-border-container" speedX={10} speedY={10} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <div className="second-border"></div>
                    <ParallaxMotion className="second-border-container" speedX={10} speedY={10} easing={[0.17, 0.67, 0.3, 0.99]}>
                      <div className="first-border">
                        <h2>{joinContent.membershipTypes.resident.title}</h2>
                        <p>{joinContent.membershipTypes.resident.description}</p>
                        <p>{joinContent.membershipTypes.resident.additionalInfo}</p>
                        <div className="type-img-container" style={{ position: "relative", overflow: "hidden" }}>
                          <img src={RESIDENT_SRC} alt="Founders House Resident" />
                          {/* Animated squares: top-left */}
                          <div className="img-square resident-square square-tl-1" />
                          <div className="img-square resident-square square-tl-2" />
                          <div className="img-square resident-square square-tl-3" />
                          {/* Animated squares: bottom-right */}
                          <div className="img-square resident-square square-br-1" />
                          <div className="img-square resident-square square-br-2" />
                          <div className="img-square resident-square square-br-3" />
                        </div>
                        <a href="https://forms.fillout.com/t/7TEkwvviqPus" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <Button className="button">{joinContent.membershipTypes.resident.buttonText}</Button>
                        </a>
                      </div>
                    </ParallaxMotion>
                  </ParallaxMotion>
                </motion.div>
                <motion.div 
                  className="join-type type-member"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ delay: 0.1, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  style={{ y: section2BG }}>
                  <ParallaxMotion className="second-border-container" speedX={10} speedY={10} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <div className="second-border"></div>
                    <ParallaxMotion className="second-border-container" speedX={5} speedY={5} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                      <div className="first-border">
                        <h2>{joinContent.membershipTypes.member.title}</h2>
                        <p>{joinContent.membershipTypes.member.description}</p>
                        <p>{joinContent.membershipTypes.member.additionalInfo}</p>
                        <div className="type-img-container" style={{ position: "relative" }}>
                          <img src={MEMBER_SRC} alt="Founders House Member" />
                          {/* Animated squares: top-right (different pattern) */}
                          <div className="img-square member-square member-square-tr-1" />
                          <div className="img-square member-square member-square-tr-2" />
                          <div className="img-square member-square member-square-tr-3" />
                          {/* Animated squares: bottom-left (different pattern) */}
                          <div className="img-square member-square member-square-bl-1" />
                          <div className="img-square member-square member-square-bl-2" />
                          <div className="img-square member-square member-square-bl-3" />
                        </div>
                        <a href="https://forms.fillout.com/t/mt825jk2bGus" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <Button className="button">{joinContent.membershipTypes.member.buttonText}</Button>
                        </a>
                      </div>
                    </ParallaxMotion>
                  </ParallaxMotion>
                </motion.div>
              </div>
            </div>

            <div className="last-section">
              <motion.div className="last-section-bg-container" style={{ y: section2BG }}>
                <ParallaxMotion speedX={20} speedY={15} easing={[0.22, 0.67, 0.3, 0.99]} delay={12}>
                  <motion.img
                    className="last-section-bg"
                    src={PROCESS_SRC}
                    alt="About"
                    style={{ scale: 1.05, objectFit: "cover", filter: "brightness(0.6)" }}
                  />
                </ParallaxMotion>
              </motion.div>        
              
              <motion.div className="last-section-content" style={{ y: section2Content }}>
                <ParallaxMotion speedX={30} speedY={32} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <h3>{joinContent.applicationProcess.heading}</h3>
                </ParallaxMotion>
                <ParallaxMotion speedX={30} speedY={32} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                    <motion.p>
                      {joinContent.applicationProcess.description.split('\n\n').map((paragraph, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <><br /><br /></>}
                          {paragraph}
                        </React.Fragment>
                      ))}
                    </motion.p>
                    <motion.div
                      initial={{ translateY: "0%" }}
                      whileInView={{ translateY: "101%" }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 1.2, ease: [0.11, 0.45, 0.08, 1.00] }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#D82E11",
                        zIndex: 1
                      }}
                    />
                  </div>
                </ParallaxMotion>
              </motion.div>


              <motion.div className="last-section-content community-content" style={{ y: section2Content }}>
                <ParallaxMotion speedX={50} speedY={52} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <h3 style={{ color: "white" }}>{joinContent.community.heading}</h3>
                </ParallaxMotion>
                <ParallaxMotion speedX={50} speedY={52} easing={[0.17, 0.67, 0.3, 0.99]}>
                 <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                    <motion.p style={{ color: "white" }}>
                      {joinContent.community.description}
                    </motion.p>
                    <motion.div
                      initial={{ translateY: "0%" }}
                      whileInView={{ translateY: "101%" }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 1.2, ease: [0.11, 0.45, 0.08, 1.00] }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#D82E11",
                        zIndex: 1
                      }}
                    />
                  </div>
                  <motion.div
                    className="community-social-links"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                  >
                    <a
                      href="https://www.instagram.com/foundershousehelsinki/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="community-social-icon"
                      aria-label="Instagram"
                    >
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.linkedin.com/company/founders-house-helsinki/about/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="community-social-icon"
                      aria-label="LinkedIn"
                    >
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </a>
                  </motion.div>
                </ParallaxMotion>
              </motion.div>
            </div>

            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
