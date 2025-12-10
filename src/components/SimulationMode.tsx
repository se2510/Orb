import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import LocationSelector, { type Coordinates, type LocationData } from './LocationSelector';
import Scene from './Scene';
import SolarDataPanel from './SolarDataPanel';
import RotatingPlanet from './RotatingPlanet';
import { 
  calculateSunriseSunset, 
  type SunriseSunsetInfo,
  generateSolarTrajectory,
  type SolarTrajectoryPoint,
  calculateWallSolarAzimuth,
  calculateIncidenceAngleOnPanel,
  calculatePanelEfficiency
} from '../utils/solarCalculations';
import { initializeSunTrail, type SunObject } from '../scene/createSun';
import './SimulationMode.css';

interface SimulationModeProps {
  onBackToMenu: () => void;
}

const SimulationMode: React.FC<SimulationModeProps> = ({ onBackToMenu }) => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [locationName, setLocationName] = useState<string>('');
  const [solarInfo, setSolarInfo] = useState<SunriseSunsetInfo | null>(null);
  const [trajectory, setTrajectory] = useState<SolarTrajectoryPoint[] | null>(null);
  const [currentPoint, setCurrentPoint] = useState<SolarTrajectoryPoint | null>(null);
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const [shouldClearTrail, setShouldClearTrail] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(3);
  const [wallSolarAzimuth, setWallSolarAzimuth] = useState(180);
  const [panelAzimuth, setPanelAzimuth] = useState(180);
  const [panelInclination, setPanelInclination] = useState(30);
  const [panelRows, setPanelRows] = useState(2);
  const [panelCols, setPanelCols] = useState(3);
  const [showAltitudeRef, setShowAltitudeRef] = useState(false);
  const [showAzimuthRef, setShowAzimuthRef] = useState(false);
  const [showWallSolarAzimuthRef, setShowWallSolarAzimuthRef] = useState(false);
  const [showIncidenceAngleRef, setShowIncidenceAngleRef] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'angles'>('settings');
  const [isAnglesVisible, setIsAnglesVisible] = useState(false);
  const [isSolarDataPanelOpen, setIsSolarDataPanelOpen] = useState(false);
  const [showFinishNotification, setShowFinishNotification] = useState(false);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sunObjRef = useRef<SunObject | null>(null);

  const handleLocationConfirmed = (data: LocationData) => {
    setIsLoading(true);
    setSelectedLocation(data.coords);
    setSelectedDate(data.date);
    setLocationName(data.locationName || '');
  };

  useEffect(() => {
    if (selectedLocation) {
      const info = calculateSunriseSunset(selectedDate, selectedLocation.lat);
      setSolarInfo(info);
      
      const traj = generateSolarTrajectory(selectedDate, selectedLocation.lat, 100);
      setTrajectory(traj);
      
      if (traj && traj.length > 0) {
        setCurrentPoint(traj[0]);
        setCurrentPointIndex(0);
      }
      
      setIsPlaying(false);
      setIsFinished(false);
      setHasCompletedOnce(false);
      setIsLoading(false);
    }
  }, [selectedLocation, selectedDate]);

  useEffect(() => {
    if (!isPlaying || !trajectory || trajectory.length === 0) return;
    if (isPaused) return;
    
    const durationMs = simulationSpeed * 1000;
    
    const animate = () => {
      if (!trajectory || trajectory.length === 0 || !isPlaying || isPaused) return;
      
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      const progress = Math.min(elapsed / durationMs, 1);
      
      const index = Math.floor(progress * (trajectory.length - 1));
      const point = trajectory[index];
      
      setCurrentPoint(point);
      setCurrentPointIndex(index);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        setIsFinished(true);
        setHasCompletedOnce(true);
        setIsPaused(false);
        elapsedBeforePauseRef.current = 0;
        setShowFinishNotification(true);
        setTimeout(() => setShowFinishNotification(false), 4000);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isPaused, trajectory, simulationSpeed]);

  const handleSceneReady = (scene: THREE.Scene, sunObject: SunObject) => {
    sceneRef.current = scene;
    sunObjRef.current = sunObject;
  };

  const handleStartSimulation = () => {
    if (trajectory && trajectory.length > 0 && sceneRef.current && sunObjRef.current) {
      initializeSunTrail(sunObjRef.current, sceneRef.current);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      elapsedBeforePauseRef.current = 0;
      setCurrentPointIndex(0);
      setCurrentPoint(trajectory[0]);
      setIsPlaying(true);
      setIsFinished(false);
      setIsPaused(false);
      setShouldClearTrail(false);
    }
  };

  const handleRestartSimulation = () => {
    if (trajectory && trajectory.length > 0 && sceneRef.current && sunObjRef.current) {
      setShouldClearTrail(true);
      setTimeout(() => {
        if (sceneRef.current && sunObjRef.current) {
          initializeSunTrail(sunObjRef.current, sceneRef.current);
          setCurrentPoint(trajectory[0]);
          setCurrentPointIndex(0);
          startTimeRef.current = Date.now();
          pausedTimeRef.current = 0;
          elapsedBeforePauseRef.current = 0;
          setIsPlaying(true);
          setIsFinished(false);
          setHasCompletedOnce(false);
          setIsPaused(false);
          setShouldClearTrail(false);
        }
      }, 50);
    }
  };

  const handlePauseSimulation = useCallback(() => {
    if (isPlaying && !isPaused) {
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      elapsedBeforePauseRef.current = elapsed;
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const handleResumeSimulation = useCallback(() => {
    if (isPlaying && isPaused) {
      startTimeRef.current = Date.now();
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  const handleNextPoint = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;
    if (!isPaused && isPlaying) return;
    
    const nextIndex = Math.min(currentPointIndex + 1, trajectory.length - 1);
    if (nextIndex !== currentPointIndex) {
      setCurrentPointIndex(nextIndex);
      setCurrentPoint(trajectory[nextIndex]);
      
      if (nextIndex === trajectory.length - 1) {
        setIsFinished(true);
        setHasCompletedOnce(true);
        setIsPlaying(false);
        setIsPaused(false);
        setShowFinishNotification(true);
        setTimeout(() => setShowFinishNotification(false), 4000);
      }
    }
  }, [trajectory, isPaused, isPlaying, currentPointIndex]);

  const handlePreviousPoint = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;
    if (!isPaused && isPlaying) return;
    
    const prevIndex = Math.max(currentPointIndex - 1, 0);
    if (prevIndex !== currentPointIndex) {
      setCurrentPointIndex(prevIndex);
      setCurrentPoint(trajectory[prevIndex]);
      
      if (isFinished) {
        setIsFinished(false);
      }
    }
  }, [trajectory, isPaused, isPlaying, currentPointIndex, isFinished]);

  const jumpToSunrise = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;
    if (isPlaying && !isPaused) handlePauseSimulation();
    setCurrentPointIndex(0);
    setCurrentPoint(trajectory[0]);
    setIsFinished(false);
  }, [trajectory, isPlaying, isPaused, handlePauseSimulation]);

  const jumpToNoon = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;
    if (isPlaying && !isPaused) handlePauseSimulation();
    let maxAlt = -Infinity;
    let maxIndex = 0;
    trajectory.forEach((p, i) => {
      if (p.altura > maxAlt) {
        maxAlt = p.altura;
        maxIndex = i;
      }
    });
    setCurrentPointIndex(maxIndex);
    setCurrentPoint(trajectory[maxIndex]);
    setIsFinished(false);
  }, [trajectory, isPlaying, isPaused, handlePauseSimulation]);

  const jumpToSunset = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;
    if (isPlaying && !isPaused) handlePauseSimulation();
    const lastIndex = trajectory.length - 1;
    setCurrentPointIndex(lastIndex);
    setCurrentPoint(trajectory[lastIndex]);
    setIsFinished(true);
    setHasCompletedOnce(true);
    setShowFinishNotification(true);
    setTimeout(() => setShowFinishNotification(false), 4000);
  }, [trajectory, isPlaying, isPaused, handlePauseSimulation]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!trajectory || trajectory.length === 0) return;
    
    const newIndex = parseInt(e.target.value);
    setCurrentPointIndex(newIndex);
    setCurrentPoint(trajectory[newIndex]);
    
    if (isPlaying && !isPaused) {
      handlePauseSimulation();
    }
    
    if (newIndex === trajectory.length - 1) {
      setIsFinished(true);
      setHasCompletedOnce(true);
      setShowFinishNotification(true);
      setTimeout(() => setShowFinishNotification(false), 4000);
    } else {
      setIsFinished(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLocation || !trajectory) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousPoint();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextPoint();
          break;
        case ' ':
          e.preventDefault();
          if (isPlaying && !isPaused) {
            handlePauseSimulation();
          } else if (isPlaying && isPaused) {
            handleResumeSimulation();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLocation, trajectory, isPlaying, isPaused, handleNextPoint, handlePreviousPoint, handlePauseSimulation, handleResumeSimulation]);

  const wallSolarAzimuthValue = useMemo(() => {
    if (!currentPoint) return 0;
    return calculateWallSolarAzimuth(currentPoint.azimut, panelAzimuth);
  }, [currentPoint, panelAzimuth]);
  
  const incidenceAngle = useMemo(() => {
    if (!currentPoint) return 0;
    return calculateIncidenceAngleOnPanel(currentPoint.altura, panelInclination, wallSolarAzimuthValue);
  }, [currentPoint, panelInclination, wallSolarAzimuthValue]);
  
  const efficiency = useMemo(() => {
    return calculatePanelEfficiency(incidenceAngle);
  }, [incidenceAngle]);

  const formattedSelectedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [selectedDate]);

  const renderAnglesContent = () => {
    if (!currentPoint) return null;
    return (
    <>
      <div className="angle-item" style={{ borderColor: 'rgba(33, 150, 243, 0.3)' }}>
        <div className="angle-label">☀️ Altura Solar (β)</div>
        <div className="angle-value">
          <span style={{ color: '#2196F3' }}>{currentPoint.altura.toFixed(1)}</span>
          <span className="angle-unit">°</span>
        </div>
        <label className="checkbox-label blue">
          <input
            type="checkbox"
            checked={showAltitudeRef}
            onChange={(e) => setShowAltitudeRef(e.target.checked)}
          />
          Ver en 3D
        </label>
      </div>

      <div className="angle-item" style={{ borderColor: 'rgba(33, 150, 243, 0.3)' }}>
        <div className="angle-label">🧭 Azimut Solar (γ)</div>
        <div className="angle-value">
          <span style={{ color: '#2196F3' }}>{currentPoint.azimut.toFixed(1)}</span>
          <span className="angle-unit">°</span>
        </div>
        <label className="checkbox-label blue">
          <input
            type="checkbox"
            checked={showAzimuthRef}
            onChange={(e) => setShowAzimuthRef(e.target.checked)}
          />
          Ver en 3D
        </label>
      </div>

      <div className="angle-item" style={{ borderColor: 'rgba(255, 215, 0, 0.3)' }}>
        <div className="angle-label" style={{ color: '#FFD700' }}>⭐ Azimut Sol-Pared (ψ)</div>
        <div className="angle-value">
          <span style={{ color: '#FFD700' }}>{wallSolarAzimuthValue.toFixed(1)}</span>
          <span className="angle-unit" style={{ color: '#FFD700' }}>°</span>
        </div>
        <label className="checkbox-label gold">
          <input
            type="checkbox"
            checked={showWallSolarAzimuthRef}
            onChange={(e) => setShowWallSolarAzimuthRef(e.target.checked)}
          />
          Ver en 3D
        </label>
      </div>

      <div className="angle-item" style={{ borderColor: 'rgba(255, 152, 0, 0.3)' }}>
        <div className="angle-label" style={{ color: '#FF9800' }}>⭐ Ángulo Incidencia (θ)</div>
        <div className="angle-value">
          <span style={{ color: '#FF9800' }}>{incidenceAngle.toFixed(1)}</span>
          <span className="angle-unit" style={{ color: '#FF9800' }}>°</span>
        </div>
        <label className="checkbox-label orange">
          <input
            type="checkbox"
            checked={showIncidenceAngleRef}
            onChange={(e) => setShowIncidenceAngleRef(e.target.checked)}
          />
          Ver en 3D
        </label>
      </div>

      <div className="angle-item" style={{ border: 'none' }}>
        <div className="angle-label" style={{ 
          color: efficiency > 80 ? '#4CAF50' : efficiency > 50 ? '#FFC107' : '#F44336' 
        }}>
          ⚡ Eficiencia
        </div>
        <div className="angle-value">
          <span style={{ 
            color: efficiency > 80 ? '#4CAF50' : efficiency > 50 ? '#FFC107' : '#F44336' 
          }}>
            {efficiency.toFixed(0)}
          </span>
          <span className="angle-unit">%</span>
        </div>
        <div className="efficiency-bar" style={{
          marginTop: '6px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${efficiency}%`,
            background: efficiency > 80 ? '#4CAF50' : efficiency > 50 ? '#FFC107' : '#F44336',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </>
  );
  };

  if (!selectedLocation) {
    return (
      <>
        <LocationSelector onLocationConfirmed={handleLocationConfirmed} />
        <button
          className={`back-button ${isSolarDataPanelOpen ? 'hidden-by-data' : ''}`}
          onClick={onBackToMenu}
          style={{ zIndex: 2000 }}
        >
          <span>←</span>
          <span>Volver al Menú</span>
        </button>
      </>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0f172a',
        color: 'white',
        zIndex: 2000
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }} className="loading-planet">
            <RotatingPlanet size={72} />
          </div>
          <div>Calculando trayectoria solar...</div>
        </div>
      </div>
    );
  }

  if (selectedLocation && !currentPoint) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0f172a',
        color: 'white',
        zIndex: 2000,
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ marginBottom: '10px' }}>No hay datos solares</h2>
          <p style={{ opacity: 0.7, marginBottom: '20px' }}>
            No se pudo calcular la trayectoria solar para esta ubicación y fecha. 
            Es posible que sea una zona polar durante el invierno o verano perpetuo.
          </p>
          <button
            className="control-btn"
            onClick={() => setSelectedLocation(null)}
            style={{ background: '#3b82f6', margin: '0 auto' }}
          >
            Seleccionar otra ubicación
          </button>
        </div>
      </div>
    );
  }

  if (selectedLocation && currentPoint) {
    return (
      <motion.div 
        className="simulation-mode-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button 
          className={`menu-toggle ${isMenuOpen ? 'hidden-when-menu-open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div 
          className={`menu-overlay ${isMenuOpen ? 'visible' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        />

        <button
          className={`back-button ${isMenuOpen ? 'hidden-when-menu-open' : ''} ${isSolarDataPanelOpen ? 'hidden-by-data' : ''}`}
          onClick={onBackToMenu}
        >
          <span>←</span>
          <span>Volver</span>
        </button>

        <div className={`controls-panel ${isMenuOpen ? 'open' : ''} ${isSolarDataPanelOpen ? 'hidden-by-data' : ''}`} style={{
          transition: 'transform 0.3s ease'
        }}>
          <div className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="panel-title">Simulación Solar</h2>
                <p className="panel-subtitle">
                  {locationName || `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lng.toFixed(4)}°`} · {formattedSelectedDate}
                </p>
              </div>
              <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>
          </div>

          <div className="panel-tabs">
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Configuración
            </button>
            <button 
              className={`tab-btn ${activeTab === 'angles' ? 'active' : ''}`}
              onClick={() => setActiveTab('angles')}
            >
              Ángulos
            </button>
          </div>

            <div className="panel-content">
            <div className={`settings-content ${activeTab === 'settings' ? 'active' : ''}`}>
              <div className="control-group">
                <button 
                  className="control-btn" 
                  onClick={() => setIsSolarDataPanelOpen(true)}
                  style={{ width: '100%', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  📊 Ver Datos y Gráficas
                </button>
              </div>

              {solarInfo && (
                <div className="control-group">
                  <h3 className="control-group-title">
                    <span>☀️</span> Info del Día
                  </h3>
                  <div className="info-row">
                    <span>Fecha:</span>
                    <span className="info-value">
                      {selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="info-row">
                    <span>Amanecer:</span>
                    <span className="info-value">{solarInfo.horaAmanecer}</span>
                  </div>
                  <div className="info-row">
                    <span>Atardecer:</span>
                    <span className="info-value">{solarInfo.horaAtardecer}</span>
                  </div>
                  <div className="info-row">
                    <span>Duración:</span>
                    <span className="info-value">{solarInfo.tiempoAsoleamiento.toFixed(1)} hrs</span>
                  </div>
                </div>
              )}

              <div className="control-group">
                <h3 className="control-group-title">
                  <span>⚙️</span> Configuración
                </h3>
                
                <div className="info-row">
                  <span>Velocidad: {simulationSpeed}s</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                  className="range-input"
                />

                <div className="info-row" style={{ marginTop: '10px' }}>
                  <span>Orientación Pared: {wallSolarAzimuth}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={wallSolarAzimuth}
                  onChange={(e) => setWallSolarAzimuth(parseInt(e.target.value))}
                  className="range-input"
                />

                <div className="info-row" style={{ marginTop: '10px' }}>
                  <span>Orientación Panel: {panelAzimuth}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={panelAzimuth}
                  onChange={(e) => setPanelAzimuth(parseInt(e.target.value))}
                  className="range-input"
                />

                <div className="info-row" style={{ marginTop: '10px' }}>
                  <span>Inclinación Panel: {panelInclination}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="90" 
                  value={panelInclination}
                  onChange={(e) => setPanelInclination(parseInt(e.target.value))}
                  className="range-input"
                />

                <div className="info-row" style={{ marginTop: '10px' }}>
                  <span>Filas de Paneles: {panelRows}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={panelRows}
                  onChange={(e) => setPanelRows(parseInt(e.target.value))}
                  className="range-input"
                />

                <div className="info-row" style={{ marginTop: '10px' }}>
                  <span>Columnas de Paneles: {panelCols}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={panelCols}
                  onChange={(e) => setPanelCols(parseInt(e.target.value))}
                  className="range-input"
                />
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

            <div className={`angles-content ${activeTab === 'angles' ? 'active' : ''}`}>
              {activeTab === 'angles' && renderAnglesContent()}
            </div>
          </div>
        </div>

        <div className={`angles-display desktop-only ${isAnglesVisible ? 'visible' : ''}`} style={{
          opacity: isSolarDataPanelOpen ? 0 : 1,
          pointerEvents: isSolarDataPanelOpen ? 'none' : 'auto',
          transition: 'opacity 0.3s ease'
        }}>
          {renderAnglesContent()}
        </div>


        <div className={`playback-controls ${isMenuOpen ? 'hidden-when-menu-open' : ''}`} style={{ 
          opacity: isSolarDataPanelOpen ? 0 : 1,
          pointerEvents: isSolarDataPanelOpen ? 'none' : 'auto',
          transition: 'opacity 0.3s ease'
        }}>
          <input
            type="range"
            min="0"
            max={(trajectory?.length || 1) - 1}
            value={currentPointIndex}
            onChange={handleSliderChange}
            className="range-input timeline-slider"
          />
          
          <div className="controls-row">
            <button 
              className="icon-btn mobile-panel-toggle" 
              onClick={() => setIsMenuOpen(true)}
              title="Menú"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="time-display">
              <span className="time-icon">🕒</span>
              <span className="time-text">
                {currentPoint.horaSolar}
              </span>
            </div>

            <div className="playback-buttons">
              <div className="jump-controls">
                <button className="icon-btn" onClick={jumpToSunrise} title="Ir al Amanecer">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 18a5 5 0 0 0-10 0" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 2v7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.22 10.22l1.42 1.42" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 18h2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 18h2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.36 11.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 22H1" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                <button className="icon-btn" onClick={jumpToNoon} title="Ir al Mediodía">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 1v2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 21v2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.22 4.22l1.42 1.42" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.36 18.36l1.42 1.42" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 12h2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12h2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.22 19.78l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button className="icon-btn" onClick={jumpToSunset} title="Ir al Atardecer">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 18a5 5 0 0 0-10 0" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 9V2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.22 10.22l1.42 1.42" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 18h2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 18h2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.36 11.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 22H1" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <div className="separator" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
                
                <button className="icon-btn" onClick={() => {
                  if (!trajectory) return;
                  const targetTime = "09:00";
                  const index = trajectory.findIndex(p => p.horaSolar >= targetTime);
                  if (index !== -1) {
                    if (isPlaying && !isPaused) handlePauseSimulation();
                    setCurrentPointIndex(index);
                    setCurrentPoint(trajectory[index]);
                    setIsFinished(false);
                  }
                }} title="Ver sombra 9:00 AM">
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>9h</span>
                </button>
                
                <button className="icon-btn" onClick={() => {
                  if (!trajectory) return;
                  const targetTime = "15:00";
                  const index = trajectory.findIndex(p => p.horaSolar >= targetTime);
                  if (index !== -1) {
                    if (isPlaying && !isPaused) handlePauseSimulation();
                    setCurrentPointIndex(index);
                    setCurrentPoint(trajectory[index]);
                    setIsFinished(false);
                  }
                }} title="Ver sombra 3:00 PM">
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>15h</span>
                </button>
                
                <div className="separator" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
              </div>

              <button 
                className="icon-btn" 
                onClick={handlePreviousPoint}
                title="Anterior"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M19 20L9 12l10-8v16zM5 19V5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {!isPlaying && !isFinished && !isPaused && (
                <button className="main-control-btn" onClick={handleStartSimulation} style={{ background: '#4CAF50' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Iniciar</span>
                </button>
              )}

              {isPlaying && !isPaused && (
                <button className="main-control-btn" onClick={handlePauseSimulation} style={{ background: '#FF9800' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  <span>Pausar</span>
                </button>
              )}

              {isPaused && (
                <button className="main-control-btn" onClick={handleResumeSimulation} style={{ background: '#2196F3' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Reanudar</span>
                </button>
              )}

              {isFinished && (
                <button className="main-control-btn" onClick={handleRestartSimulation} style={{ background: '#9C27B0' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Reiniciar</span>
                </button>
              )}

              <button 
                className="icon-btn" 
                onClick={handleNextPoint}
                title="Siguiente"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M5 4l10 8-10 8V4zM19 5v14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <button 
              className={`icon-btn mobile-panel-toggle ${isFinished && !isSolarDataPanelOpen ? 'highlight-glow' : ''}`}
              onClick={() => setIsSolarDataPanelOpen(true)}
              title="Datos"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {showFinishNotification && (
          <div className="completion-notification">
            <div className="notification-icon">🌅</div>
            <div className="notification-content">
              <h3>Simulación Completada</h3>
              <p>Revisa los datos detallados en el panel lateral 👉</p>
            </div>
          </div>
        )}

        <SolarDataPanel
          trajectory={trajectory}
          isFinished={isFinished}
          canShowData={hasCompletedOnce}
          panelInclination={panelInclination}
          wallSolarAzimuth={wallSolarAzimuth}
          isOpen={isSolarDataPanelOpen}
          onOpenChange={setIsSolarDataPanelOpen}
          locationName={locationName}
          date={selectedDate}
          latitude={selectedLocation.lat}
          longitude={selectedLocation.lng}
          highlightTrigger={isFinished}
        />

        <Scene 
          sunAltitude={currentPoint.altura} 
          sunAzimuth={currentPoint.azimut}
          trajectory={trajectory || []}
          showAltitudeReference={showAltitudeRef}
          showAzimuthReference={showAzimuthRef}
          showWallSolarAzimuthReference={showWallSolarAzimuthRef}
          showIncidenceAngle={showIncidenceAngleRef}
          panelInclination={panelInclination}
          panelAzimuth={panelAzimuth}
          panelRows={panelRows}
          panelCols={panelCols}
          wallSolarAzimuth={wallSolarAzimuth}
          useBuilding={true}
          useSolarAngles={true}
          showTrail={isPlaying}
          clearTrail={shouldClearTrail}
          onSceneReady={handleSceneReady}
        />
      </motion.div>
    );
  }

  return null;
};

export default SimulationMode;