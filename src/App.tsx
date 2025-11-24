import React, { useCallback } from 'react';
import Scene from './components/Scene';
import { useSunControls } from './hooks/useSunControls';
import './App.css';

// Estilos constantes para evitar recrearlos en cada render
const containerStyle: React.CSSProperties = { 
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%', 
  height: '100%',
  overflow: 'hidden'
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  left: '20px',
  pointerEvents: 'none',
  zIndex: 1000
};

const panelStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '15px',
  borderRadius: '8px',
  maxWidth: '400px',
  fontFamily: 'sans-serif'
};

const sliderStyle: React.CSSProperties = { width: '100%' };

const App: React.FC = () => {
  const { angles, setAltitude, setAzimuth } = useSunControls(0, 0);
  
  // Memoizar handlers para evitar recrearlos en cada render
  const handleAltitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAltitude(Number(e.target.value));
  }, [setAltitude]);
  
  const handleAzimuthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAzimuth(Number(e.target.value));
  }, [setAzimuth]);
  
  return (
    <div style={containerStyle}>
      {/* Escena 3D */}
      <Scene sunAltitude={angles.altitude} sunAzimuth={angles.azimuth} />
      
      {/* UI Overlay - Aquí irán los controles e información */}
      <div style={overlayStyle}>
        {/* Panel superior para información */}
        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Maqueta Solar Interactiva</h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
            Usa el mouse para rotar la vista del domo
          </p>
          
          {/* Controles del Sol */}
          <div style={{ marginTop: '15px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Ángulo de Altura Solar (β): {angles.altitude.toFixed(1)}°
              </label>
              <input
                type="range"
                min="-90"
                max="90"
                step="1"
                value={angles.altitude}
                onChange={handleAltitudeChange}
                style={sliderStyle}
              />
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                -90° = Horizonte Este, 0° = Cenit (Mediodía), 90° = Horizonte Oeste
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Ángulo de Azimut Solar (γ): {angles.azimuth.toFixed(1)}°
              </label>
              <input
                type="range"
                min="-90"
                max="90"
                step="1"
                value={angles.azimuth}
                onChange={handleAzimuthChange}
                style={sliderStyle}
              />
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                -90° = Amanecer (Este), 0° = Mediodía (Sur), 90° = Atardecer (Oeste)
              </div>
            </div>
            
            {/* Display del Ángulo Cenital (calculado) */}
            <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '5px',
              borderLeft: '3px solid #4CAF50'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                📐 Ángulo Cenit (θz): {angles.zenith.toFixed(1)}°
              </div>
              <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '5px', fontStyle: 'italic' }}>
                θz = 90° - β (calculado automáticamente)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
