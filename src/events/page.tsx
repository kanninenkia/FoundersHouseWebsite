import "./page.css";
import "./pageMobile.css";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue } from "framer-motion";
import ParallaxMotion from '../effects/ParallaxMotion.tsx';
import { Button } from '../components/ui';
import { NavBar } from '../components/layout';
import { FullScreenMenu } from '../components/layout';
import { eventsData } from './hooks/events-data.ts';

const HEADER_IMG_SRC = "/assets/images/events/join-process.webp";

const removeDuplicatePageCssSheets = () => {
  if (typeof document === "undefined") return false;
  const sheets = Array.from(document.styleSheets);
  const pageCssSheets = sheets.filter(sheet =>
    sheet.href && sheet.href.includes("/events/page.css")
  );
  if (pageCssSheets.length <= 1) return false;
  pageCssSheets.slice(1).forEach(sheet => {
    sheet.ownerNode?.remove();
  });
  return true;
};

const forceStyleRecalc = () => {
  if (typeof document === "undefined") return;
  document.body.style.display = "none";
  void document.body.offsetHeight;
  document.body.style.display = "";
};

// Clean up duplicate stylesheets from Vite HMR on component unmount
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (removeDuplicatePageCssSheets()) {
      forceStyleRecalc();
    }
  });
}

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

export default function EventsPage({ audioRef, audio2Ref }: { audioRef?: React.MutableRefObject<HTMLAudioElement | null>, audio2Ref?: React.MutableRefObject<HTMLAudioElement | null> }) {
  const [stage, setStage] = useState(1);
  const [showNavBar, setShowNavBar] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const targetCursorPosition = useRef({ x: 0, y: 0 });
  const [showCustomCursor, setShowCustomCursor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const displayedTitle = "EVENTS";
  const [isEventTitle, setIsEventTitle] = useState(false);
  const [displayedDateLocation, setDisplayedDateLocation] = useState("");
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const matches = window.matchMedia('(max-width: 768px)').matches;
    return matches;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNavBar(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const [isCardLocked, setIsCardLocked] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLHeadingElement>(null);
  const titleCleanupRef = useRef<(() => void) | null>(null);
  const descriptionCleanupRef = useRef<(() => void) | null>(null);
  const fitTitleTimeoutRef = useRef<number | null>(null);
  const isTouchingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  //--------------------------------------//
  // Parallax on Elements Settings //
  //--------------------------------------//
  const { scrollY } = useScroll();
  const headerBG = useTransform(scrollY, [0, 1000], [0, 200]);
  const headerContent = useTransform(scrollY, [0, 1000], [0, 100]);

  // Transition from stage 1 to stage 2 after a delay
  useEffect(() => {
    if (typeof document === "undefined") {
      setFontsReady(true);
      return;
    }

    const fontSet = document.fonts;
    if (!fontSet || fontSet.status === "loaded") {
      setFontsReady(true);
      return;
    }

    let cancelled = false;
    fontSet.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (stage === 1 && fontsReady) {
      const timer = setTimeout(() => setStage(2), 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, fontsReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Remove duplicate page.css stylesheets on mount (Vite HMR bug)
  useEffect(() => {
    const runCleanup = () => {
      if (removeDuplicatePageCssSheets()) {
        forceStyleRecalc();
      }
    };

    runCleanup();
    const timeout = setTimeout(runCleanup, 50);

    return () => clearTimeout(timeout);
  }, []);



  const parallaxScale = isMobile ? 0.5 : 1;
  const lockedBrightness = isCardLocked ? 0.3 : 0.35;

  useEffect(() => {
    if (!isMobile) {
      setIsCardLocked(false);
    }
  }, [isMobile]);

  const resetCardSelection = () => {
    setHoveredCardId(null);
    setDisplayedDateLocation("");
    if (titleCleanupRef.current) {
      titleCleanupRef.current();
    }
    if (descriptionCleanupRef.current) {
      descriptionCleanupRef.current();
    }
    if (titleRef.current) {
      titleCleanupRef.current = shuffleText(titleRef.current, "EVENTS", 400);
      titleRef.current.style.fontSize = "";
    }
    if (descriptionRef.current) {
      descriptionCleanupRef.current = shuffleText(
        descriptionRef.current,
        "Join us for inspiring events, networking opportunities, and community building sessions designed to accelerate your startup journey.",
        300
      );
    }
    setIsEventTitle(false);
  };

  useEffect(() => {
    if (!isCardLocked) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest(".event-card")) {
        return;
      }
      setIsCardLocked(false);
      resetCardSelection();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isCardLocked]);

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
        setScrollX(constrainedX);

        // Apply friction
        velocity *= 0.95;

        animationFrame = requestAnimationFrame(applyMomentum);
        animationFrameRef.current = animationFrame;
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
      setScrollX(constrainedX);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsDragging(true);
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
      setScrollX(constrainedX);
    };

    const handleMouseUp = () => {
      isDragging = false;
      setIsDragging(false);
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
    if (isMenuOpen) {
      setShowCustomCursor(false);
      return;
    }
    const handleMouseMove = (e: MouseEvent) => {
      targetCursorPosition.current = { x: e.clientX, y: e.clientY };
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const isInteractive = !!target?.closest(
        'a, button, .hamburger-button, .calendar-button, .events-calendar-button, .events-header'
      );
      // Hide custom cursor when hovering over interactive elements (but keep it visible on event cards)
      setShowCustomCursor(!isInteractive);
      document.body.classList.toggle('events-cursor-interactive', isInteractive);
    };
    // Only show custom cursor initially if menu is closed
    setShowCustomCursor(true);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      setShowCustomCursor(false);
      document.body.classList.remove('events-cursor-interactive');
    };
  }, [stage, isMenuOpen]);

  // Smooth cursor lerp animation
  useEffect(() => {
    let animationFrameId: number;

    const smoothCursor = () => {
      setCursorPosition(prev => {
        const dx = targetCursorPosition.current.x - prev.x;
        const dy = targetCursorPosition.current.y - prev.y;
        
        // Lerp factor - lower = smoother but slower, higher = faster but less smooth
        const lerp = 0.3;
        
        return {
          x: prev.x + dx * lerp,
          y: prev.y + dy * lerp
        };
      });
      
      animationFrameId = requestAnimationFrame(smoothCursor);
    };

    animationFrameId = requestAnimationFrame(smoothCursor);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    document.body.classList.add('events-cursor');
    document.documentElement.classList.add('events-cursor');
    return () => {
      document.body.classList.remove('events-cursor');
      document.body.classList.remove('events-cursor-interactive');
      document.body.classList.remove('events-dragging');
      document.documentElement.classList.remove('events-cursor');
      document.documentElement.classList.remove('events-cursor-interactive');
    };
  }, []);

  // Toggle dragging cursor class
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('events-dragging');
    } else {
      document.body.classList.remove('events-dragging');
    }
  }, [isDragging]);

  // Comprehensive cleanup on unmount to prevent stuck transitions
  useEffect(() => {
    return () => {
      // Cancel any running animation frames
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clear any pending text shuffle timeouts
      if (titleCleanupRef.current) {
        titleCleanupRef.current();
      }
      if (descriptionCleanupRef.current) {
        descriptionCleanupRef.current();
      }
      if (fitTitleTimeoutRef.current !== null) {
        clearTimeout(fitTitleTimeoutRef.current);
      }

      // Ensure custom cursor is hidden
      setShowCustomCursor(false);

      // Clean up all cursor-related classes
      document.body.classList.remove('events-cursor', 'events-cursor-interactive');
      document.documentElement.classList.remove('events-cursor', 'events-cursor-interactive');
    };
  }, []);

  const fitTitleToWidth = (text?: string) => {
    const titleEl = titleRef.current;
    if (!titleEl) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;

    const parent = titleEl.parentElement;
    if (!parent) return;

    // Reset inline sizing so we always measure against the base CSS size.
    const previousInlineSize = titleEl.style.fontSize;
    titleEl.style.fontSize = "";
    void titleEl.offsetWidth;

    const availableWidth = parent.clientWidth;
    const computed = window.getComputedStyle(titleEl);
    const currentSize = parseFloat(computed.fontSize);
    if (!availableWidth || !currentSize) {
      titleEl.style.fontSize = previousInlineSize;
      return;
    }

    let titleWidth = titleEl.scrollWidth;
    if (text) {
      const measurer = document.createElement("span");
      measurer.textContent = text;
      measurer.style.position = "absolute";
      measurer.style.visibility = "hidden";
      measurer.style.whiteSpace = "nowrap";
      measurer.style.fontFamily = computed.fontFamily;
      measurer.style.fontSize = computed.fontSize;
      measurer.style.fontWeight = computed.fontWeight;
      measurer.style.letterSpacing = computed.letterSpacing;
      measurer.style.textTransform = computed.textTransform;
      measurer.style.pointerEvents = "none";
      document.body.appendChild(measurer);
      titleWidth = measurer.offsetWidth;
      document.body.removeChild(measurer);
    }

    if (titleWidth > availableWidth) {
      const scale = availableWidth / titleWidth;
      const newSize = Math.max(14, Math.floor(currentSize * scale));
      titleEl.style.fontSize = `${newSize}px`;
    } else {
      titleEl.style.fontSize = "";
    }
  };

  const scheduleFitTitleToWidth = (text?: string) => {
    if (!isMobile) return;
    if (fitTitleTimeoutRef.current !== null) {
      window.clearTimeout(fitTitleTimeoutRef.current);
    }
    fitTitleTimeoutRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => fitTitleToWidth(text));
    }, 0);
  };

  return (
    <div
      className="events-page"
      style={{ position: "relative", maxWidth: "100%", minHeight: "100vh", height: "100vh", overflow: "hidden", background: "#2B0906" }}
    >
      <section className="visually-hidden" aria-label="Founders House events">
        <h1>Founders House Events</h1>
        <p>Curated founder events in Helsinki.</p>
        <p>Discover upcoming gatherings and community moments.</p>
      </section>

      {/* Custom Cursor */}
      {showCustomCursor && (
        <motion.div
          className={`custom-cursor ${isDragging ? 'dragging' : ''}`}
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <img src="/assets/icons/eventsexplore.svg" alt="Drag to explore" className="cursor-icon" />
        </motion.div>
      )}

      <NavBar 
        logoColor="dark" 
        hamburgerColor="#FFF8F2" 
        streakColor="rgba(216, 46, 17, 1)" 
        opacity={showNavBar ? 1 : 0} 
        audioRef={audioRef} 
        audio2Ref={audio2Ref}
        onMenuChange={setIsMenuOpen}
      />


      {/*---------------------------------------------------------------------*/}
      {/* Persistent animated image container */}
      {/*---------------------------------------------------------------------*/}
      <motion.div
        className="stage1-img-container"
        initial={false}
        animate={
          stage === 1
            ? {
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                position: "absolute",
                top: "10vh",
                left: "50%",
                x: "-50%",
                scale: 0.9,
                zIndex: 2
              }
            : {
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                position: "absolute",
                top: "0",
                left: "50%",
                x: "-50%",
                scale: 1,
                zIndex: 2
              }
        }
        transition={{ duration: 1.2, ease: [0.32, 0.26, 0, 1] }}
      >
        <ParallaxMotion speedX={12 * parallaxScale} speedY={12 * parallaxScale} easing={[0.37, 0.67, 0.3, 0.97]} delay={12}>
          <motion.img
            className="stage1-img"
            src={HEADER_IMG_SRC}
            alt="Events"
            initial={false}
            animate={
                stage === 1
                ? { width: "100%", height: "100vh", position: "absolute", objectFit: "cover", filter: "grayscale(1) brightness(0.6)", scale: 1.4 }
                : { width: "100%", height: "100vh", position: "absolute", objectFit: "cover", filter: `grayscale(1) brightness(${lockedBrightness})`, scale: 1.05 }
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
            style={{ position: "relative", width: "100%", zIndex: 4, pointerEvents: "none" }}
            className="stage2-wrapper"
          >
            <div className="header-wrapper" style={{pointerEvents: "none"}}>
              <motion.div className="header-content" style={{ y: headerContent }}>
                <ParallaxMotion speedX={30 * parallaxScale} speedY={15 * parallaxScale} easing={[0.17, 0.67, 0.3, 0.99]} delay={10}>
                  <div className="header-h1-wrapper">
                    <motion.h1
                      ref={titleRef}
                      className={`header-h1${isEventTitle ? " is-event-title" : ""}`}
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
                  <ParallaxMotion
                    className="header-h3-parallax"
                    speedX={40 * parallaxScale}
                    speedY={25 * parallaxScale}
                    easing={[0.17, 0.67, 0.3, 0.99]}
                  >
                    <motion.div
                      className="calendar-button-wrapper"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.6, duration: 1, ease: [0.11, 0.45, 0.08, 1.00] }}
                      style={{ pointerEvents: "auto" }}
                    >
                      <a
                        href="https://luma.com/founders-house_helsinki"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <Button className="calendar-button events-calendar-button">
                          Subscribe Here
                        </Button>
                      </a>
                    </motion.div>
                    <motion.h3
                      ref={descriptionRef}
                      className="header-h3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.6, duration: 1, ease: [0.11, 0.45, 0.08, 1.00] }}
                      >
                        We host highly curated events, networking opportunities and community building sessions designed to accelerate your startup journey.
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
            {/*}
            <div className="events-scroll-blur">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            */}
            <motion.div
              ref={trackRef}
              className="events-scroll-track"
            >
              {eventsData.map((event, index) => {
                // Different parallax speeds for each card
                const speeds = [
                  { speedX: 20 * parallaxScale, speedY: 10 * parallaxScale },
                  { speedX: 35 * parallaxScale, speedY: 18 * parallaxScale },
                  { speedX: 15 * parallaxScale, speedY: 8 * parallaxScale },
                  { speedX: 28 * parallaxScale, speedY: 14 * parallaxScale }
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

                  setIsEventTitle(true);
                  scheduleFitTitleToWidth(event.title.toUpperCase());
                };

                const handleMouseLeave = () => {
                  if (isTouchingRef.current || isCardLocked) return;
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

                  setIsEventTitle(false);
                  if (fitTitleTimeoutRef.current !== null) {
                    window.clearTimeout(fitTitleTimeoutRef.current);
                  }
                  if (titleRef.current) {
                    titleRef.current.style.fontSize = "";
                  }
                };

                const handleTouchStart = () => {
                  isTouchingRef.current = true;
                  handleMouseEnter();
                  setIsCardLocked(true);
                };

                const handleTouchEnd = () => {
                  isTouchingRef.current = false;
                };

                const handleCardClick = (event: React.MouseEvent) => {
                  if (event.detail > 1) return;
                  if (!isMobile) return;
                  handleMouseEnter();
                  setIsCardLocked(true);
                };

                const isHovered = hoveredCardId === event.id;
                const isOtherHovered = hoveredCardId !== null && !isHovered;

                // Calculate fade based on card position on screen
                // Cards fade when they cross 40vw from the left edge
                const fadeThresholdVw = 40;
                const fadeThreshold = typeof window !== 'undefined' ? window.innerWidth * (fadeThresholdVw / 100) : 400;
                const cardWidth = typeof window !== 'undefined' ? window.innerWidth * 0.35 : 350; // 35vw per card
                const cardOverlap = typeof window !== 'undefined' ? window.innerWidth * 0.14 : 140; // 14vw overlap (margin-left: -14vw)
                const initialPadding = typeof window !== 'undefined' ? window.innerWidth * 0.5 : 500; // 50vw initial padding
                
                // Calculate card's left position on screen
                // First card starts at initialPadding, each subsequent card is offset by (cardWidth - cardOverlap)
                const cardLeftPosition = initialPadding + scrollX + (index * (cardWidth - cardOverlap));
                
                // Fade zone: 200px before the threshold
                const fadeStart = fadeThreshold;
                const fadeEnd = fadeThreshold - 200;
                
                let fadeOpacity = 1;
                if (cardLeftPosition < fadeStart) {
                  // Card is past the threshold, calculate fade
                  fadeOpacity = Math.max(0, Math.min(1, (cardLeftPosition - fadeEnd) / (fadeStart - fadeEnd)));
                }

                return (
                  <motion.div
                    key={event.id}
                    className="event-card"
                    style={{
                      zIndex: isHovered ? 100 : (index % 2 === 0 ? 5 : 4),
                      opacity: fadeOpacity
                    }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{
                      opacity: fadeOpacity,
                      x: 0
                    }}
                    transition={{
                      delay: 3.4 + (index * 0.1),
                      duration: 0.8,
                      ease: [0.11, 0.45, 0.08, 1.00],
                      opacity: { duration: 0.1, delay: 0 } // Fast opacity transition, no delay
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onClick={handleCardClick}
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
                        scale={1.09}
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
