import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import LocationSelector, { type Coordinates, type LocationData } from './LocationSelector';
import Scene from './Scene';
import BuildingControlsModal from './BuildingControlsModal';
import SolarDataPanel from './SolarDataPanel';
import { 
  calculateSunriseSunset, 
  type SunriseSunsetInfo,
  generateSolarTrajectory,
  type SolarTrajectoryPoint
} from '../utils/solarCalculations';
import { initializeSunTrail, type SunObject } from '../scene/createSun';

interface SimulationModeProps {
  onBackToMenu: () => void;
}

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
  padding: '20px',
  borderRadius: '8px',
  maxWidth: '400px',
  maxHeight: 'calc(100vh - 80px)',
  overflowY: 'auto',
  fontFamily: 'sans-serif'
};

const coordDisplayStyle: React.CSSProperties = {
  marginTop: '15px',
  padding: '15px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '14px'
};

const solarInfoStyle: React.CSSProperties = {
  marginTop: '15px',
  padding: '15px',
  background: 'rgba(255, 193, 7, 0.15)',
  borderRadius: '8px',
  fontSize: '14px',
  borderLeft: '3px solid rgba(255, 193, 7, 0.8)'
};

const infoRowStyle: React.CSSProperties = {
  marginBottom: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const sliderContainerStyle: React.CSSProperties = {
  marginTop: '15px',
  padding: '15px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  borderLeft: '3px solid rgba(102, 126, 234, 0.6)'
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '10px'
};

const sliderLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '5px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const backButtonStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  pointerEvents: 'auto',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: '600',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease',
  zIndex: 1001,
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const floatingControlsStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  pointerEvents: 'auto',
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  padding: '15px 20px',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 1002,
  minWidth: '600px',
  maxWidth: '800px'
};

const controlRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  justifyContent: 'center'
};

const compactButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: '600',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  whiteSpace: 'nowrap'
};

const infoChipStyle: React.CSSProperties = {
  padding: '6px 12px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const SimulationMode: React.FC<SimulationModeProps> = ({ onBackToMenu }) => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [locationName, setLocationName] = useState<string>('');
  const [solarInfo, setSolarInfo] = useState<SunriseSunsetInfo | null>(null);
  const [trajectory, setTrajectory] = useState<SolarTrajectoryPoint[] | null>(null);
  const [currentPoint, setCurrentPoint] = useState<SolarTrajectoryPoint | null>(null);
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0); // Índice del punto actual en la trayectoria
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [shouldClearTrail, setShouldClearTrail] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(3); // Velocidad de simulación (default 3)
  const [wallSolarAzimuth, setWallSolarAzimuth] = useState(180); // Ángulo azimut solar-pared (ψ) en grados
  const [panelInclination, setPanelInclination] = useState(30); // Inclinación del panel en grados
  const [showWallSolarAzimuthRef, setShowWallSolarAzimuthRef] = useState(false); // Mostrar referencia visual del ángulo ψ
  const [isPaused, setIsPaused] = useState(false); // Control de pausa
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0); // Tiempo transcurrido antes de pausar
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sunObjRef = useRef<SunObject | null>(null);

  const handleLocationConfirmed = (data: LocationData) => {
    setSelectedLocation(data.coords);
    setSelectedDate(data.date);
    setLocationName(data.locationName || '');
  };

  // Calcular información solar y trayectoria cuando cambia la ubicación o la fecha
  useEffect(() => {
    if (selectedLocation) {
      const info = calculateSunriseSunset(selectedDate, selectedLocation.lat);
      setSolarInfo(info);
      
      const traj = generateSolarTrajectory(selectedDate, selectedLocation.lat, 100);
      setTrajectory(traj);
      
      // Iniciar punto en el amanecer
      if (traj && traj.length > 0) {
        setCurrentPoint(traj[0]);
        setCurrentPointIndex(0);
      }
      
      // Resetear estado de reproducción
      setIsPlaying(false);
      setIsFinished(false);
    }
  }, [selectedLocation, selectedDate]);

  // Lógica de animación con soporte para pausa
  useEffect(() => {
    if (!isPlaying || !trajectory || trajectory.length === 0) {
      return;
    }
    
    // Si está pausado, no animar
    if (isPaused) {
      return;
    }
    
    const durationMs = simulationSpeed * 1000; // Convertir velocidad a milisegundos
    
    const animate = () => {
      if (!trajectory || trajectory.length === 0 || !isPlaying || isPaused) return;
      
      // Calcular tiempo transcurrido considerando pausas previas
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Calcular el índice actual basado en el progreso
      const index = Math.floor(progress * (trajectory.length - 1));
      const point = trajectory[index];
      
      setCurrentPoint(point);
      setCurrentPointIndex(index);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Simulación terminada
        setIsPlaying(false);
        setIsFinished(true);
        setIsPaused(false);
        elapsedBeforePauseRef.current = 0;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isPaused, trajectory, simulationSpeed]);

  // Callback cuando la escena está lista
  const handleSceneReady = (scene: THREE.Scene, sunObject: SunObject) => {
    sceneRef.current = scene;
    sunObjRef.current = sunObject;
  };

  // Funciones de control
  const handleStartSimulation = () => {
    if (trajectory && trajectory.length > 0 && sceneRef.current && sunObjRef.current) {
      // Inicializar estela
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
      // Limpiar estela anterior e inicializar nueva
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
          setIsPaused(false);
          setShouldClearTrail(false);
        }
      }, 50);
    }
  };

  // Función para pausar la simulación
  const handlePauseSimulation = useCallback(() => {
    if (isPlaying && !isPaused) {
      // Guardar el tiempo transcurrido hasta ahora
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      elapsedBeforePauseRef.current = elapsed;
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  // Función para reanudar la simulación
  const handleResumeSimulation = useCallback(() => {
    if (isPlaying && isPaused) {
      // Reiniciar el contador desde el momento actual
      startTimeRef.current = Date.now();
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  // Función para avanzar al siguiente punto (solo cuando está pausado)
  const handleNextPoint = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;
    if (!isPaused && isPlaying) return; // Solo permitir cuando está pausado o detenido
    
    const nextIndex = Math.min(currentPointIndex + 1, trajectory.length - 1);
    if (nextIndex !== currentPointIndex) {
      setCurrentPointIndex(nextIndex);
      setCurrentPoint(trajectory[nextIndex]);
      
      // Si llegamos al final mientras navegamos, marcar como terminado
      if (nextIndex === trajectory.length - 1) {
        setIsFinished(true);
        setIsPlaying(false);
        setIsPaused(false);
      }
    }
  }, [trajectory, isPaused, isPlaying, currentPointIndex]);

  // Función para retroceder al punto anterior (solo cuando está pausado)
  const handlePreviousPoint = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;
    if (!isPaused && isPlaying) return; // Solo permitir cuando está pausado o detenido
    
    const prevIndex = Math.max(currentPointIndex - 1, 0);
    if (prevIndex !== currentPointIndex) {
      setCurrentPointIndex(prevIndex);
      setCurrentPoint(trajectory[prevIndex]);
      
      // Si retrocedemos desde el final, ya no está terminado
      if (isFinished) {
        setIsFinished(false);
      }
    }
  }, [trajectory, isPaused, isPlaying, currentPointIndex, isFinished]);

  // Soporte de teclado para control paso a paso
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo si hay una ubicación seleccionada
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
        case ' ': // Espacio para pausar/reanudar
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

  // Vista de simulación con coordenadas
  // Ahora usamos directamente los ángulos solares reales del cálculo
  if (selectedLocation && currentPoint) {
    return (
      <div style={containerStyle}>
        {/* Botón de regreso al menú */}
        <button
          style={backButtonStyle}
          onClick={onBackToMenu}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
          }}
        >
          <span>←</span>
          <span>Volver al Menú</span>
        </button>

        {/* Escena 3D con animación usando ángulos solares reales */}
        <Scene 
          sunAltitude={currentPoint.altura} 
          sunAzimuth={currentPoint.azimut}
          showAltitudeReference={false}
          showAzimuthReference={false}
          showWallSolarAzimuthReference={showWallSolarAzimuthRef}
          panelInclination={panelInclination}
          wallSolarAzimuth={wallSolarAzimuth}
          useBuilding={true}
          useSolarAngles={true}
          showTrail={isPlaying}
          clearTrail={shouldClearTrail}
          onSceneReady={handleSceneReady}
        />
        
        <div style={overlayStyle}>
          <div style={panelStyle}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
              🌍 Simulación Solar
            </h2>
            
            <div style={coordDisplayStyle}>
              {locationName && (
                <div style={{ 
                  marginBottom: '15px', 
                  fontSize: '15px', 
                  fontWeight: '600',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  📍 {locationName}
                </div>
              )}
              <div style={{ marginBottom: '10px' }}>
                <strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}°
              </div>
              <div>
                <strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}°
              </div>
            </div>

            {/* Información de posición actual del sol */}
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: 'rgba(33, 150, 243, 0.15)',
              borderRadius: '8px',
              fontSize: '14px',
              borderLeft: '3px solid rgba(33, 150, 243, 0.8)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                🌞 Posición Solar Actual
              </h3>
              
              <div style={infoRowStyle}>
                <span>🕐 Hora Solar:</span>
                <strong>{currentPoint.horaSolar}</strong>
              </div>
              
              <div style={infoRowStyle}>
                <span>📐 Altura Solar (β):</span>
                <strong>{currentPoint.altura.toFixed(2)}°</strong>
              </div>
              
              <div style={infoRowStyle}>
                <span>🧭 Azimut (γ):</span>
                <strong>{currentPoint.azimut.toFixed(2)}°</strong>
              </div>
              
              <div style={{ 
                marginTop: '12px', 
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                  Punto {currentPointIndex + 1} de {trajectory?.length || 100}
                </span>
                <span style={{ 
                  fontSize: '11px',
                  background: 'rgba(33, 150, 243, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  {((currentPointIndex / ((trajectory?.length || 1) - 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {solarInfo && (
              <div style={solarInfoStyle}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  ☀️ Información del Día - {selectedDate.toLocaleDateString('es-MX', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                
                <div style={infoRowStyle}>
                  <span>🌅 Amanecer:</span>
                  <strong>{solarInfo.horaAmanecer}</strong>
                </div>
                
                <div style={infoRowStyle}>
                  <span>🌇 Atardecer:</span>
                  <strong>{solarInfo.horaAtardecer}</strong>
                </div>
                
                <div style={infoRowStyle}>
                  <span>⏱️ Horas de asoleamiento:</span>
                  <strong>{solarInfo.tiempoAsoleamiento.toFixed(2)} hrs</strong>
                </div>
                
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  <div style={infoRowStyle}>
                    <span>Día del año:</span>
                    <span>{solarInfo.n}</span>
                  </div>
                </div>
              </div>
            )}

            {!solarInfo && (
              <div style={{ 
                marginTop: '15px', 
                padding: '15px', 
                background: 'rgba(255, 87, 34, 0.15)',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'center',
                borderLeft: '3px solid rgba(255, 87, 34, 0.8)'
              }}>
                ⚠️ No hay información solar disponible para esta ubicación
              </div>
            )}
            
            {/* Controles paso a paso - Solo visibles cuando está pausado o detenido */}
            {(isPaused || (!isPlaying && !isFinished)) && trajectory && trajectory.length > 0 && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                background: 'rgba(156, 39, 176, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid rgba(156, 39, 176, 0.6)'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#CE93D8'
                }}>
                  🎮 Control Paso a Paso
                </h4>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={handlePreviousPoint}
                    disabled={currentPointIndex === 0}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPointIndex === 0 ? 'not-allowed' : 'pointer',
                      background: currentPointIndex === 0 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)',
                      color: currentPointIndex === 0 ? '#666' : 'white',
                      opacity: currentPointIndex === 0 ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPointIndex > 0) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>◀</span>
                    <span>Anterior</span>
                  </button>
                  
                  <div style={{
                    padding: '10px 15px',
                    background: 'rgba(156, 39, 176, 0.2)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#CE93D8',
                    whiteSpace: 'nowrap',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {currentPointIndex + 1} / {trajectory.length}
                  </div>
                  
                  <button
                    onClick={handleNextPoint}
                    disabled={currentPointIndex === trajectory.length - 1}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPointIndex === trajectory.length - 1 ? 'not-allowed' : 'pointer',
                      background: currentPointIndex === trajectory.length - 1
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)',
                      color: currentPointIndex === trajectory.length - 1 ? '#666' : 'white',
                      opacity: currentPointIndex === trajectory.length - 1 ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPointIndex < trajectory.length - 1) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>Siguiente</span>
                    <span>▶</span>
                  </button>
                </div>
                
                <div style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  opacity: 0.7,
                  textAlign: 'center',
                  color: '#CE93D8'
                }}>
                  ⌨️ Usa ← → para navegar | Espacio para pausar/reanudar
                </div>
              </div>
            )}
            
            {/* Control de velocidad de simulación */}
            <div style={sliderContainerStyle}>
              <div style={sliderLabelStyle}>
                <span>⚡ Velocidad de simulación:</span>
                <strong>{6 - simulationSpeed}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={6 - simulationSpeed}
                onChange={(e) => setSimulationSpeed(6 - Number(e.target.value))}
                disabled={isPlaying && !isPaused}
                style={{
                  ...sliderStyle,
                  opacity: (isPlaying && !isPaused) ? 0.5 : 1,
                  cursor: (isPlaying && !isPaused) ? 'not-allowed' : 'pointer'
                }}
              />
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.7, 
                marginTop: '5px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Lento</span>
                <span>Rápido</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de controles del edificio (esquina inferior derecha) */}
        <BuildingControlsModal
          wallSolarAzimuth={wallSolarAzimuth}
          panelInclination={panelInclination}
          showWallSolarAzimuthRef={showWallSolarAzimuthRef}
          onWallSolarAzimuthChange={setWallSolarAzimuth}
          onPanelInclinationChange={setPanelInclination}
          onShowWallSolarAzimuthRefChange={setShowWallSolarAzimuthRef}
          disabled={isPlaying && !isPaused}
        />
        
        {/* Panel lateral de datos de trayectoria solar */}
        <SolarDataPanel
          trajectory={trajectory}
          isFinished={isFinished}
          panelInclination={panelInclination}
          wallSolarAzimuth={wallSolarAzimuth}
        />
        
        {/* Control flotante de simulación (bottom center) */}
        <div style={floatingControlsStyle}>
          <div style={controlRowStyle}>
            {/* Botón Iniciar/Pausar/Reanudar */}
            {!isPlaying && !isFinished && (
              <button
                style={{
                  ...compactButtonStyle,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
                onClick={handleStartSimulation}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>▶️</span>
                <span>Iniciar</span>
              </button>
            )}

            {isPlaying && !isPaused && (
              <button
                style={{
                  ...compactButtonStyle,
                  background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                  color: 'white'
                }}
                onClick={handlePauseSimulation}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>⏸️</span>
                <span>Pausar</span>
              </button>
            )}

            {isPlaying && isPaused && (
              <button
                style={{
                  ...compactButtonStyle,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                  color: 'white'
                }}
                onClick={handleResumeSimulation}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>▶️</span>
                <span>Reanudar</span>
              </button>
            )}

            {isFinished && (
              <button
                style={{
                  ...compactButtonStyle,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}
                onClick={handleRestartSimulation}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 87, 108, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>🔄</span>
                <span>Reiniciar</span>
              </button>
            )}
            
            {/* Separador vertical */}
            <div style={{
              width: '1px',
              height: '30px',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '0 8px'
            }} />
            
            {/* Controles paso a paso */}
            <button
              onClick={handlePreviousPoint}
              disabled={currentPointIndex === 0 || (isPlaying && !isPaused)}
              style={{
                ...compactButtonStyle,
                background: (currentPointIndex === 0 || (isPlaying && !isPaused))
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)',
                color: (currentPointIndex === 0 || (isPlaying && !isPaused)) ? '#666' : 'white',
                opacity: (currentPointIndex === 0 || (isPlaying && !isPaused)) ? 0.5 : 1,
                cursor: (currentPointIndex === 0 || (isPlaying && !isPaused)) ? 'not-allowed' : 'pointer',
                padding: '8px 12px'
              }}
              onMouseEnter={(e) => {
                if (currentPointIndex > 0 && (!isPlaying || isPaused)) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>◀</span>
            </button>
            
            {/* Contador de punto actual */}
            <div style={infoChipStyle}>
              <span style={{ color: '#CE93D8' }}>{currentPointIndex + 1}</span>
              <span style={{ opacity: 0.5 }}>/</span>
              <span style={{ opacity: 0.7 }}>{trajectory?.length || 100}</span>
            </div>
            
            <button
              onClick={handleNextPoint}
              disabled={currentPointIndex === (trajectory?.length || 100) - 1 || (isPlaying && !isPaused)}
              style={{
                ...compactButtonStyle,
                background: (currentPointIndex === (trajectory?.length || 100) - 1 || (isPlaying && !isPaused))
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)',
                color: (currentPointIndex === (trajectory?.length || 100) - 1 || (isPlaying && !isPaused)) ? '#666' : 'white',
                opacity: (currentPointIndex === (trajectory?.length || 100) - 1 || (isPlaying && !isPaused)) ? 0.5 : 1,
                cursor: (currentPointIndex === (trajectory?.length || 100) - 1 || (isPlaying && !isPaused)) ? 'not-allowed' : 'pointer',
                padding: '8px 12px'
              }}
              onMouseEnter={(e) => {
                if (currentPointIndex < (trajectory?.length || 100) - 1 && (!isPlaying || isPaused)) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>▶</span>
            </button>
            
            {/* Separador vertical */}
            <div style={{
              width: '1px',
              height: '30px',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '0 8px'
            }} />
            
            {/* Información de hora solar y estado */}
            <div style={infoChipStyle}>
              <span>🕒</span>
              <span>{currentPoint?.horaSolar || '--:--'}</span>
            </div>
            
            {isPlaying && !isPaused && (
              <div style={{
                ...infoChipStyle,
                background: 'rgba(76, 175, 80, 0.2)',
                borderLeft: '2px solid rgba(76, 175, 80, 0.8)'
              }}>
                <span>▶️</span>
                <span style={{ fontSize: '11px' }}>En progreso</span>
              </div>
            )}
            
            {isPaused && (
              <div style={{
                ...infoChipStyle,
                background: 'rgba(255, 152, 0, 0.2)',
                borderLeft: '2px solid rgba(255, 152, 0, 0.8)'
              }}>
                <span>⏸️</span>
                <span style={{ fontSize: '11px' }}>Pausado</span>
              </div>
            )}
            
            {/* Hint de teclado */}
            <div style={{
              fontSize: '10px',
              opacity: 0.5,
              marginLeft: '8px',
              whiteSpace: 'nowrap'
            }}>
              ⌨️ ←→ | Espacio
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de selección de ubicación
  return (
    <>
      <button
        style={backButtonStyle}
        onClick={onBackToMenu}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        }}
      >
        <span>←</span>
        <span>Volver al Menú</span>
      </button>
      <LocationSelector onLocationConfirmed={handleLocationConfirmed} />
    </>
  );
};

export default SimulationMode;
