window.onerror = function (message, source, lineno, colno, error) {
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace; background: #fff0f0; border: 2px solid red; margin: 20px;">
      <h1>CRITICAL ERROR</h1>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>
      <pre>${error ? error.stack : 'No stack trace'}</pre>
    </div>
  `;
};

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
