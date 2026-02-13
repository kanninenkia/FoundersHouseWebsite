import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeDir: number;
}

interface FloatingParticlesOverlayProps {
  density?: number; // particles per square meter (default: 5)
  color?: string; // default: light gray
}

const PARTICLE_SIZE = 8; // px
const PARTICLE_MIN_SPEED = 0.05;
const PARTICLE_MAX_SPEED = 0.25;
const PARTICLE_MIN_OPACITY = 0.15;
const PARTICLE_MAX_OPACITY = 0.35;

export const FloatingParticlesOverlay: React.FC<FloatingParticlesOverlayProps> = ({
  density = 5,
  color = '#e0e0e0',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  // Calculate number of particles based on density and viewport size
  const getParticleCount = (width: number, height: number) => {
    // Assume 1 square meter = 1000x1000 px for visual density
    const area = (width * height) / (1000 * 1000);
    return Math.round(area * density);
  };

  // Initialize particles
  const initParticles = (width: number, height: number) => {
    const count = getParticleCount(width, height);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: PARTICLE_SIZE + Math.random() * 4,
        speedX: (Math.random() - 0.5) * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) + (Math.random() > 0.5 ? PARTICLE_MIN_SPEED : -PARTICLE_MIN_SPEED),
        speedY: (Math.random() - 0.5) * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) + (Math.random() > 0.5 ? PARTICLE_MIN_SPEED : -PARTICLE_MIN_SPEED),
        opacity: PARTICLE_MIN_OPACITY + Math.random() * (PARTICLE_MAX_OPACITY - PARTICLE_MIN_OPACITY),
        fadeDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    particlesRef.current = particles;
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    particlesRef.current.forEach(p => {
      // Move
      p.x += p.speedX;
      p.y += p.speedY;
      // Wrap around edges
      if (p.x < -p.size) p.x = width + p.size;
      if (p.x > width + p.size) p.x = -p.size;
      if (p.y < -p.size) p.y = height + p.size;
      if (p.y > height + p.size) p.y = -p.size;
      // Fade in/out gently
      p.opacity += p.fadeDir * 0.003;
      if (p.opacity > PARTICLE_MAX_OPACITY) p.fadeDir = -1;
      if (p.opacity < PARTICLE_MIN_OPACITY) p.fadeDir = 1;
      // Draw
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    });
    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [density]);

  // Start animation
  useEffect(() => {
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color, density]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 2,
      }}
      aria-hidden="true"
    />
  );
};

export default FloatingParticlesOverlay;
