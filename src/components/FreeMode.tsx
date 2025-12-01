import React, { useCallback } from 'react';
import Scene from './Scene';
import { useSunControls } from '../hooks/useSunControls';

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

const FreeMode: React.FC = () => {
  const { angles, setAltitude, setAzimuth } = useSunControls(0, 0);
  const [showAltitudeRef, setShowAltitudeRef] = React.useState(false);
  const [showAzimuthRef, setShowAzimuthRef] = React.useState(false);
  const [wallSolarAzimuth, setWallSolarAzimuth] = React.useState(180);
  const [panelInclination, setPanelInclination] = React.useState(30);
  const [showWallSolarAzimuthRef, setShowWallSolarAzimuthRef] = React.useState(false);
  const [showIncidenceAngle, setShowIncidenceAngle] = React.useState(false);
  
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

  // Handlers para el panel solar y edificio
  const handleInclinationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPanelInclination(Number(e.target.value));
  }, []);

  const handleWallSolarAzimuthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWallSolarAzimuth(Number(e.target.value));
  }, []);

  const handleWallSolarAzimuthRefToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowWallSolarAzimuthRef(e.target.checked);
  }, []);

  const handleIncidenceAngleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowIncidenceAngle(e.target.checked);
  }, []);
  
  return (
    <div style={containerStyle}>
      {/* Escena 3D */}
      <Scene 
        sunAltitude={angles.altitude} 
        sunAzimuth={angles.azimuth}
        showAltitudeReference={showAltitudeRef}
        showAzimuthReference={showAzimuthRef}
        showWallSolarAzimuthReference={showWallSolarAzimuthRef}
        showIncidenceAngle={showIncidenceAngle}
        panelInclination={panelInclination}
        wallSolarAzimuth={wallSolarAzimuth}
        useBuilding={true}
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

          {/* Controles del Edificio y Panel Solar */}
          <div style={{ marginTop: '15px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#4CAF50' }}>
              🏢 Edificio con Panel Solar
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '14px' }}>
                  Azimut Sol-Pared (ψ): {wallSolarAzimuth.toFixed(1)}°
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showWallSolarAzimuthRef}
                    onChange={handleWallSolarAzimuthRefToggle}
                    style={{ marginRight: '5px' }}
                  />
                  Mostrar
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={wallSolarAzimuth}
                onChange={handleWallSolarAzimuthChange}
                style={sliderStyle}
              />
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                Ángulo entre el sol y la normal de la pared
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '14px' }}>
                  Inclinación Panel (φ): {panelInclination.toFixed(1)}°
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showIncidenceAngle}
                    onChange={handleIncidenceAngleToggle}
                    style={{ marginRight: '5px' }}
                  />
                  Ángulo θ
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={panelInclination}
                onChange={handleInclinationChange}
                style={sliderStyle}
              />
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                0° = Horizontal, 90° = Vertical
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeMode;
