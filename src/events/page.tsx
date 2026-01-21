import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import ParallaxMotion from '../effects/ParallaxMotion.tsx';
import { AnimatedHamburger } from '../components/AnimatedHamburger.tsx';
import { FullScreenMenu } from '../components/FullScreenMenu.tsx';
import { eventsData } from './hooks/events-data.ts';
import "./page.css";

const HEADER_IMG_SRC = "/images/Legends Day Still 002.webp";

// Text shuffle utility - Rylan Phillips style
const shuffleText = (
  element: HTMLElement,
  finalText: string,
  duration: number = 700
) => {
  const charsUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charsLower = "abcdefghijklmnopqrstuvwxyz";
  const punctuation = ".,!?;:'-";

  let iterations = 0;
  const frameRate = 30; // ms per frame
  const totalIterations = duration / frameRate;

  const interval = setInterval(() => {
    element.textContent = finalText
      .split("")
      .map((char, index) => {
        // Each character resolves at a different rate creating a wave effect
        if (index < iterations) {
          return finalText[index];
        }
        if (char === " ") return " ";
        if (punctuation.includes(char)) return char;

        // Use uppercase or lowercase based on the original character
        if (char === char.toUpperCase()) {
          return charsUpper[Math.floor(Math.random() * charsUpper.length)];
        } else {
          return charsLower[Math.floor(Math.random() * charsLower.length)];
        }
      })
      .join("");

    if (iterations >= finalText.length) {
      clearInterval(interval);
    }

    iterations += finalText.length / totalIterations;
  }, frameRate);

  return () => clearInterval(interval);
};

export default function EventsPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCustomCursor, setShowCustomCursor] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState("EVENTS");
  const [displayedDateLocation, setDisplayedDateLocation] = useState("");
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLHeadingElement>(null);
  const titleCleanupRef = useRef<(() => void) | null>(null);
  const descriptionCleanupRef = useRef<(() => void) | null>(null);

  //--------------------------------------//
  // Parallax on Elements Settings //
  //--------------------------------------//
  const { scrollY } = useScroll();
  const headerBG = useTransform(scrollY, [0, 1000], [0, 200]);
  const headerContent = useTransform(scrollY, [0, 1000], [0, 100]);

  // Transition from stage 1 to stage 2 after a delay
  useEffect(() => {
    if (stage === 1) {
      const timer = setTimeout(() => setStage(2), 3000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Mouse wheel and drag horizontal scroll - from anywhere with momentum
  useEffect(() => {
    const track = trackRef.current;
    const container = scrollContainerRef.current;
    if (!track || !container) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let animationFrame: number;

    const applyMomentum = () => {
      if (Math.abs(velocity) > 0.5) {
        // Get current transform
        const transform = window.getComputedStyle(track).transform;
        let currentX = 0;

        if (transform !== 'none') {
          const matrix = transform.match(/matrix\((.+)\)/);
          if (matrix) {
            currentX = parseFloat(matrix[1].split(', ')[4]);
          }
        }

        const newX = currentX + velocity;
        const maxScroll = container.clientWidth - track.scrollWidth;
        const constrainedX = Math.max(maxScroll, Math.min(0, newX));

        track.style.transform = `translateX(${constrainedX}px)`;

        // Apply friction
        velocity *= 0.95;

        animationFrame = requestAnimationFrame(applyMomentum);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel momentum
      cancelAnimationFrame(animationFrame);
      velocity = 0;

      // Get current transform
      const transform = window.getComputedStyle(track).transform;
      let currentX = 0;

      if (transform !== 'none') {
        const matrix = transform.match(/matrix\((.+)\)/);
        if (matrix) {
          currentX = parseFloat(matrix[1].split(', ')[4]);
        }
      }

      // Calculate new position
      const newX = currentX - e.deltaY;
      const maxScroll = container.clientWidth - track.scrollWidth;
      const constrainedX = Math.max(maxScroll, Math.min(0, newX));

      // Apply transform
      track.style.transform = `translateX(${constrainedX}px)`;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX;
      lastX = e.pageX;
      lastTime = Date.now();
      velocity = 0;
      cancelAnimationFrame(animationFrame);

      // Get current transform
      const transform = window.getComputedStyle(track).transform;
      if (transform !== 'none') {
        const matrix = transform.match(/matrix\((.+)\)/);
        if (matrix) {
          scrollLeft = parseFloat(matrix[1].split(', ')[4]);
        }
      } else {
        scrollLeft = 0;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const x = e.pageX;
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime > 0) {
        velocity = (x - lastX) / deltaTime * 16; // Normalize to 60fps
      }

      lastX = x;
      lastTime = currentTime;

      const walk = x - startX;
      const newX = scrollLeft + walk;
      const maxScroll = container.clientWidth - track.scrollWidth;
      const constrainedX = Math.max(maxScroll, Math.min(0, newX));

      track.style.transform = `translateX(${constrainedX}px)`;
    };

    const handleMouseUp = () => {
      isDragging = false;
      // Start momentum
      if (Math.abs(velocity) > 0.5) {
        applyMomentum();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stage]);

  // Custom cursor tracking - entire page with hover detection
  useEffect(() => {
    if (stage !== 2) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

          };

    const handleInteractiveEnter = () => {
      setShowCustomCursor(false);
    };

    const handleInteractiveLeave = () => {
      setShowCustomCursor(true);
    };

    // Attach listeners to interactive elements
    const attachListeners = () => {
      const interactiveElements = document.querySelectorAll('.events-header, .event-card, .event-card-image');
      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', handleInteractiveEnter);
        el.addEventListener('mouseleave', handleInteractiveLeave);
      });
    };

    // Wait for elements to be in DOM
    const timeoutId = setTimeout(attachListeners, 100);

    setShowCustomCursor(true);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
            clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleMouseMove);
      setShowCustomCursor(false);
            const interactiveElements = document.querySelectorAll('.events-header, .event-card, .event-card-image');
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleInteractiveEnter);
        el.removeEventListener('mouseleave', handleInteractiveLeave);
      });

    };
  }, [stage]);

  return (
    <div style={{ position: "relative", maxWidth: "100%", minHeight: "100vh", height: "100vh", overflow: "hidden", background: "#2B0906", cursor: "none" }}>
      {/* Custom Cursor */}
      {showCustomCursor && (
        <motion.div
          className="custom-cursor"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="cursor-circle">
            <svg width="50" height="50" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="23" stroke="#D82E11" strokeWidth="2" fill="none" />
              {/* Left arrow pointing left with tail connected to center */}
              <path d="M25 25 L17 25 M20 22 L17 25 L20 28" stroke="#D82E11" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {/* Right arrow pointing right with tail connected to center */}
              <path d="M25 25 L33 25 M30 22 L33 25 L30 28" stroke="#D82E11" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="cursor-text">Drag & Explore</div>
        </motion.div>
      )}

      <AnimatePresence>
        {stage === 2 && (
          <motion.header
            className="events-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 2.6,
              duration: 1,
              ease: [0.11, 0.45, 0.08, 1.00]
            }}
          >
            <img src="/logos/logoWhite.png" alt="Founders House" className="header-logo" />
            <div onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <AnimatedHamburger isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
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
            alt="Events"
            initial={false}
            animate={
                stage === 1
                ? { width: "100%", height: "100vh", position: "absolute", objectFit: "cover", filter: "grayscale(1) brightness(0.9)", scale: 1.4 }
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
                <span>join us, build with us,</span>
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
                <span>define tomorrow.</span>
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
                      ref={titleRef}
                      className="header-h1"
                      initial={{ y: 122 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 2.4, duration: 1.3, ease: [0.11, 0.45, 0.08, 1.00] }}
                      >
                        {displayedTitle}
                    </motion.h1>
                  </div>
                  <motion.p
                    className="header-date-location"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: displayedDateLocation ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    >
                      {displayedDateLocation}
                  </motion.p>
                </ParallaxMotion>
                <div className="header-h3-wrapper">
                  <ParallaxMotion speedX={40} speedY={25} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <motion.a
                      href="https://luma.com/founders-house_helsinki"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="calendar-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.6, duration: 1, ease: [0.11, 0.45, 0.08, 1.00] }}
                      style={{ pointerEvents: "auto" }}
                    >
                      <img src="/icons/calendericon.svg" alt="Calendar" />
                    </motion.a>
                    <motion.h3
                      ref={descriptionRef}
                      className="header-h3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.6, duration: 1, ease: [0.11, 0.45, 0.08, 1.00] }}
                      >
                        Join us for inspiring events, networking opportunities, and community building sessions designed to accelerate your startup journey.
                    </motion.h3>
                  </ParallaxMotion>
                </div>
              </motion.div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/*---------------------------------------------------------------------*/}
      {/* Horizontal Scrolling Events Section */}
      {/*---------------------------------------------------------------------*/}
      <AnimatePresence>
        {stage === 2 && (
          <motion.div
            ref={scrollContainerRef}
            className="events-scroll-container"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.2, duration: 1.2, ease: [0.11, 0.45, 0.08, 1.00] }}
          >
            <motion.div
              ref={trackRef}
              className="events-scroll-track"
            >
              {eventsData.map((event, index) => {
                // Different parallax speeds for each card
                const speeds = [
                  { speedX: 20, speedY: 10 },
                  { speedX: 35, speedY: 18 },
                  { speedX: 15, speedY: 8 },
                  { speedX: 28, speedY: 14 }
                ];
                const speed = speeds[index % speeds.length];

                const handleMouseEnter = () => {
                  setHoveredCardId(event.id);
                  setDisplayedDateLocation(`${event.date}, ${event.location}`);

                  // Cancel previous animations
                  if (titleCleanupRef.current) {
                    titleCleanupRef.current();
                  }
                  if (descriptionCleanupRef.current) {
                    descriptionCleanupRef.current();
                  }

                  // Start new animations
                  if (titleRef.current) {
                    titleCleanupRef.current = shuffleText(titleRef.current, event.title.toUpperCase(), 400);
                  }
                  if (descriptionRef.current) {
                    descriptionCleanupRef.current = shuffleText(descriptionRef.current, event.description, 300);
                  }
                };

                const handleMouseLeave = () => {
                  setHoveredCardId(null);
                  setDisplayedDateLocation("");

                  // Cancel previous animations
                  if (titleCleanupRef.current) {
                    titleCleanupRef.current();
                  }
                  if (descriptionCleanupRef.current) {
                    descriptionCleanupRef.current();
                  }

                  // Start new animations
                  if (titleRef.current) {
                    titleCleanupRef.current = shuffleText(titleRef.current, "EVENTS", 400);
                  }
                  if (descriptionRef.current) {
                    descriptionCleanupRef.current = shuffleText(descriptionRef.current, "Join us for inspiring events, networking opportunities, and community building sessions designed to accelerate your startup journey.", 300);
                  }
                };

                const isHovered = hoveredCardId === event.id;
                const isOtherHovered = hoveredCardId !== null && !isHovered;

                return (
                  <motion.div
                    key={event.id}
                    className="event-card"
                    style={{
                      zIndex: isHovered ? 100 : (index % 2 === 0 ? 5 : 4)
                    }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{
                      opacity: 1,
                      x: 0
                    }}
                    transition={{
                      delay: 3.4 + (index * 0.1),
                      duration: 0.8,
                      ease: [0.11, 0.45, 0.08, 1.00]
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <motion.div
                      className="event-card-inner"
                      animate={{
                        y: isHovered ? -20 : 0,
                        scale: isHovered ? 1.05 : 1,
                        filter: isOtherHovered ? "blur(8px)" : "blur(0px)"
                      }}
                      transition={{
                        y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                        scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                        filter: { duration: 0.5, ease: [0.25, 0.84, 0.43, 1] }
                      }}
                    >
                      <ParallaxMotion
                        speedX={speed.speedX}
                        speedY={speed.speedY}
                        easing={[0.17, 0.67, 0.3, 0.99]}
                      >
                        <img
                          src={event.image}
                          alt={event.title}
                          className="event-card-image"
                          draggable={false}
                        />
                      </ParallaxMotion>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
