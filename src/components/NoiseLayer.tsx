import React from 'react';
import './NoiseLayer.css';

/**
 * NoiseLayer - a fullscreen fixed-position noise overlay for subtle grain effect
 */
const NoiseLayer: React.FC = () => (
  <div className="noise-layer" aria-hidden="true" />
);

export default NoiseLayer;