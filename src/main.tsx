import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NoiseLayer } from './components/transitions';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <NoiseLayer />
  </React.StrictMode>
);
