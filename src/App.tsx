import React, { useCallback } from 'react';
import Scene from './components/Scene';
import { useSunControls } from './hooks/useSunControls';
import { usePanelControls } from './hooks/usePanelControls';
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
  const { angles: panelAngles, setInclination, setAzimuth: setPanelAzimuth } = usePanelControls(30, 0);
  const [showAltitudeRef, setShowAltitudeRef] = React.useState(false);
  const [showAzimuthRef, setShowAzimuthRef] = React.useState(false);
  
  // Memoizar handlers para evitar recrearlos en cada render
  const handleAltitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAltitude(Number(e.target.value));
  }, [setAltitude]);
  
  const handleAzimuthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAzimuth(Number(e.target.value));
  }, [setAzimuth]);

  const handleAltitudeRefToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAltitudeRef(e.target.checked);
  }, []);

  const handleAzimuthRefToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAzimuthRef(e.target.checked);
  }, []);

  // Handlers para el panel solar
  const handleInclinationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInclination(Number(e.target.value));
  }, [setInclination]);

  const handlePanelAzimuthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPanelAzimuth(Number(e.target.value));
  }, [setPanelAzimuth]);
  
  return (
    <div style={containerStyle}>
      {/* Escena 3D */}
      <Scene 
        sunAltitude={angles.altitude} 
        sunAzimuth={angles.azimuth}
        showAltitudeReference={showAltitudeRef}
        showAzimuthReference={showAzimuthRef}
        panelInclination={panelAngles.inclination}
        panelAzimuth={panelAngles.azimuth}
      />
      
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '14px' }}>
                  Ángulo de Altura Solar (β): {angles.altitude.toFixed(1)}°
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showAltitudeRef}
                    onChange={handleAltitudeRefToggle}
                    style={{ marginRight: '5px' }}
                  />
                  Mostrar
                </label>
              </div>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '14px' }}>
                  Ángulo de Azimut Solar (γ): {angles.azimuth.toFixed(1)}°
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showAzimuthRef}
                    onChange={handleAzimuthRefToggle}
                    style={{ marginRight: '5px' }}
                  />
                  Mostrar
                </label>
              </div>
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

          {/* Separador */}
          <div style={{ margin: '20px 0', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }} />

          {/* Controles del Panel Solar */}
          <div style={{ marginTop: '15px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#4CAF50' }}>
              ⚡ Panel Solar
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                Ángulo de Inclinación (φ): {panelAngles.inclination.toFixed(1)}°
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={panelAngles.inclination}
                onChange={handleInclinationChange}
                style={sliderStyle}
              />
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                0° = Horizontal (mirando al cenit), 90° = Vertical (como una pared)
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                Azimut del Panel (A<sub>panel</sub>): {panelAngles.azimuth.toFixed(1)}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={panelAngles.azimuth}
                onChange={handlePanelAzimuthChange}
                style={sliderStyle}
              />
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                0° = Sur, 90° = Oeste, -90° = Este, ±180° = Norte
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
