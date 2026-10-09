/**
 * main.jsx — React Entry Point
 * ==============================
 * This is the very first file that runs. It mounts the React app
 * into the <div id="root"> in index.html.
 *
 * StrictMode: A React development tool that highlights potential problems.
 * It runs certain checks twice in development mode to catch bugs early.
 * It does NOT affect the production build.
 */

import { StrictMode } from 'react';
import { createRoot }  from 'react-dom/client';
import './index.css';   /* global design tokens + reset */
import App             from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
