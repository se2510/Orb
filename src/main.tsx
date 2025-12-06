import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './performance.css'
import App from './App.tsx'

// --- FIX: Suppress deprecated MouseEvent warnings ---
// Leaflet iterates over all properties of events, triggering warnings for deprecated Mozilla properties.
// We override them to return undefined without triggering the warning.
try {
  if (typeof MouseEvent !== 'undefined' && MouseEvent.prototype) {
    const deprecatedProps = ['mozPressure', 'mozInputSource'];
    deprecatedProps.forEach(prop => {
      // Define a getter that does nothing, effectively silencing the warning
      // when these properties are accessed.
      Object.defineProperty(MouseEvent.prototype, prop, {
        get: function() { return undefined; },
        configurable: true,
        enumerable: true // Keep them enumerable so loops don't break if they expect them, though usually they don't
      });
    });
  }
} catch (e) {
  console.warn('Failed to patch MouseEvent to suppress warnings', e);
}
// ---------------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
