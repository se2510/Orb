import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import Scene from './Scene';
import { useSunControls } from '../hooks/useSunControls';
import './FreeMode.css';

interface FreeModeProps {
  onBackToMenu: () => void;
}

const FreeMode: React.FC<FreeModeProps> = ({ onBackToMenu }) => {
  const { angles, setAltitude, setAzimuth } = useSunControls(0, 0);
  const [showAltitudeRef, setShowAltitudeRef] = useState(false);
  const [showAzimuthRef, setShowAzimuthRef] = useState(false);
  const [wallSolarAzimuth, setWallSolarAzimuth] = useState(180);
  const [panelInclination, setPanelInclination] = useState(30);
  const [showWallSolarAzimuthRef, setShowWallSolarAzimuthRef] = useState(false);
  const [showIncidenceAngle, setShowIncidenceAngle] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnglesVisible, setIsAnglesVisible] = useState(false);
  const [panelRows, setPanelRows] = useState(2);
  const [panelCols, setPanelCols] = useState(3);
  const [showPanelConfig, setShowPanelConfig] = useState(false);
  
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
    <motion.div 
      className="free-mode-container"
      initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.9 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
      transition={{ 
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1]
      }}
    >
      {/* Menu Toggle Button (Mobile) */}
      <button 
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMenuOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        )}
      </button>

      {/* Botón de regreso al menú */}
      <button
        className="back-button"
        onClick={onBackToMenu}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>Volver</span>
      </button>

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
        panelRows={panelRows}
        panelCols={panelCols}
        useBuilding={true}
      />
      
      {/* Mobile Overlay */}
      <div 
        className={`menu-overlay ${isMenuOpen ? 'visible' : ''}`} 
        onClick={() => setIsMenuOpen(false)}
      />

      {/* UI Overlay - Sidebar/Bubble Panel */}
      <div className={`controls-panel ${isMenuOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h2 className="panel-title">Maqueta Solar</h2>
          <p className="panel-subtitle">
            Controla la posición del sol y la orientación del panel en tiempo real.
          </p>
        </div>
        <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>✕</button>
          
        {/* Controles del Sol */}
        <div className="control-group">
          <h3 className="control-group-title">
            <span>☀️</span> Posición Solar
          </h3>
          
          <div className="control-item">
            <div className="control-label-row">
              <span className="control-label">Altura (β): {angles.altitude.toFixed(1)}°</span>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={showAltitudeRef}
                  onChange={handleAltitudeRefToggle}
                />
                Ver Guía
              </label>
            </div>
            <input
              type="range"
              className="range-input"
              min="-90"
              max="90"
              step="1"
              value={angles.altitude}
              onChange={handleAltitudeChange}
            />
            <div className="control-hint">
              -90° (Este) a 90° (Oeste)
            </div>
          </div>
          
          <div className="control-item">
            <div className="control-label-row">
              <span className="control-label">Azimut (γ): {angles.azimuth.toFixed(1)}°</span>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={showAzimuthRef}
                  onChange={handleAzimuthRefToggle}
                />
                Ver Guía
              </label>
            </div>
            <input
              type="range"
              className="range-input"
              min="-90"
              max="90"
              step="1"
              value={angles.azimuth}
              onChange={handleAzimuthChange}
            />
            <div className="control-hint">
              -90° (Amanecer) a 90° (Atardecer)
            </div>
          </div>
          
          {/* Display del Ángulo Cenital */}
          <div className="info-box">
            <div className="info-title">
              📐 Ángulo Cenit (θz): {angles.zenith.toFixed(1)}°
            </div>
            <div className="info-desc">
              θz = 90° - β (calculado)
            </div>
          </div>
        </div>

        {/* Controles del Edificio y Panel Solar */}
        <div className="control-group">
          <h3 className="control-group-title">
            <span>🏢</span> Panel y Edificio
          </h3>
          
          <div className="control-item">
            <div className="control-label-row">
              <span className="control-label">Azimut Pared (ψ): {wallSolarAzimuth.toFixed(1)}°</span>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={showWallSolarAzimuthRef}
                  onChange={handleWallSolarAzimuthRefToggle}
                />
                Ver Guía
              </label>
            </div>
            <input
              type="range"
              className="range-input"
              min="0"
              max="360"
              step="1"
              value={wallSolarAzimuth}
              onChange={handleWallSolarAzimuthChange}
            />
          </div>
          
          <div className="control-item">
            <div className="control-label-row">
              <span className="control-label">Inclinación (φ): {panelInclination.toFixed(1)}°</span>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={showIncidenceAngle}
                  onChange={handleIncidenceAngleToggle}
                />
                Ver Ángulo θ
              </label>
            </div>
            <input
              type="range"
              className="range-input"
              min="0"
              max="90"
              step="1"
              value={panelInclination}
              onChange={handleInclinationChange}
            />
            <div className="control-hint">
              0° (Horizontal) a 90° (Vertical)
            </div>
          </div>
          <div className="control-group desktop-only">
            <label className="checkbox-label" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Mostrar Panel de Ángulos</span>
              <input
                type="checkbox"
                checked={isAnglesVisible}
                onChange={(e) => setIsAnglesVisible(e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation (similar to SimulationMode, adapted for FreeMode) */}
      <div className={`bottom-nav ${isMenuOpen ? 'hidden' : ''}`}>
        <button
          className="icon-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title="Menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          className={`icon-btn ${showAltitudeRef ? 'active' : ''}`}
          onClick={() => setShowAltitudeRef(!showAltitudeRef)}
          title="Mostrar guía de Altura"
        >
          <span>📈</span>
        </button>

        <button
          className={`icon-btn ${showAzimuthRef ? 'active' : ''}`}
          onClick={() => setShowAzimuthRef(!showAzimuthRef)}
          title="Mostrar guía de Azimut"
        >
          <span>🧭</span>
        </button>

        <button
          className={`icon-btn ${showWallSolarAzimuthRef ? 'active' : ''}`}
          onClick={() => setShowWallSolarAzimuthRef(!showWallSolarAzimuthRef)}
          title="Mostrar Azimut Pared"
        >
          <span>🏢</span>
        </button>

        <button
          className={`icon-btn ${showIncidenceAngle ? 'active' : ''}`}
          onClick={() => setShowIncidenceAngle(!showIncidenceAngle)}
          title="Mostrar Ángulo de Incidencia"
        >
          <span>📐</span>
        </button>

        <button
          className="icon-btn"
          onClick={() => setShowPanelConfig(true)}
          title="Configurar paneles"
        >
          <span>🔧</span>
        </button>
      </div>

      {/* Panel popup para configurar cantidad de paneles */}
      {showPanelConfig && (
        <>
          <div className="panel-config-overlay" onClick={() => setShowPanelConfig(false)} />
          <div className="panel-config-popup">
            <div className="popup-header">
              <strong className="popup-title">Configurar Paneles</strong>
            </div>

            <div className="popup-body">
              <label className="popup-row">
                <span className="popup-label popup-label-rows">Filas</span>
                <input type="range" min={1} max={5} value={panelRows} onChange={(e) => setPanelRows(parseInt(e.target.value))} />
                <span className="value value-rows">{panelRows}</span>
              </label>

              <label className="popup-row">
                <span className="popup-label popup-label-cols">Columnas</span>
                <input type="range" min={1} max={5} value={panelCols} onChange={(e) => setPanelCols(parseInt(e.target.value))} />
                <span className="value value-cols">{panelCols}</span>
              </label>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="control-btn" onClick={() => setShowPanelConfig(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default FreeMode;
