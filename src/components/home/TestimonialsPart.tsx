import { motion } from 'framer-motion';

export const TestimonialsPart = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 80px)',
    gridTemplateRows: 'repeat(2, 80px)',
    gap: '24px',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '40vh',
    ...style
  }}>
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.7, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2 + i * 0.1, duration: 0.5, type: 'spring' }}
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '80px',
          height: '80px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}
      />
    ))}
  </div>
);