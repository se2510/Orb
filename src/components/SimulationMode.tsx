import React, { useState, useEffect, useRef } from 'react';
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
import { initializeSunTrail } from '../scene/createSun';

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

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 20px',
  fontSize: '16px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  marginTop: '15px'
};

const startButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white'
};

const restartButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white'
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

const SimulationMode: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [locationName, setLocationName] = useState<string>('');
  const [solarInfo, setSolarInfo] = useState<SunriseSunsetInfo | null>(null);
  const [trajectory, setTrajectory] = useState<SolarTrajectoryPoint[] | null>(null);
  const [currentPoint, setCurrentPoint] = useState<SolarTrajectoryPoint | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [shouldClearTrail, setShouldClearTrail] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(3); // Velocidad de simulación (default 3)
  const [wallSolarAzimuth, setWallSolarAzimuth] = useState(180); // Ángulo azimut solar-pared (ψ) en grados
  const [panelInclination, setPanelInclination] = useState(30); // Inclinación del panel en grados
  const [showWallSolarAzimuthRef, setShowWallSolarAzimuthRef] = useState(false); // Mostrar referencia visual del ángulo ψ
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sunObjRef = useRef<any>(null);

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
      }
      
      // Resetear estado de reproducción
      setIsPlaying(false);
      setIsFinished(false);
    }
  }, [selectedLocation, selectedDate]);

  // Lógica de animación
  useEffect(() => {
    if (!isPlaying || !trajectory || trajectory.length === 0) {
      return;
    }
    
    const durationMs = simulationSpeed * 1000; // Convertir velocidad a milisegundos
    
    const animate = () => {
      if (!trajectory || trajectory.length === 0 || !isPlaying) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Calcular el índice actual basado en el progreso
      const index = Math.floor(progress * (trajectory.length - 1));
      const point = trajectory[index];
      
      setCurrentPoint(point);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Simulación terminada
        setIsPlaying(false);
        setIsFinished(true);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, trajectory, simulationSpeed]);

  // Callback cuando la escena está lista
  const handleSceneReady = (scene: THREE.Scene, sunObject: any) => {
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
      setIsPlaying(true);
      setIsFinished(false);
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
          startTimeRef.current = Date.now();
          pausedTimeRef.current = 0;
          setIsPlaying(true);
          setIsFinished(false);
          setShouldClearTrail(false);
        }
      }, 50);
    }
  };

  // Vista de simulación con coordenadas
  // Ahora usamos directamente los ángulos solares reales del cálculo
  if (selectedLocation && currentPoint) {
    return (
      <div style={containerStyle}>
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
                <span>📐 Altura Solar (β):</span>
                <strong>{currentPoint.altura.toFixed(2)}°</strong>
              </div>
              
              <div style={infoRowStyle}>
                <span>🧭 Azimut (γ):</span>
                <strong>{currentPoint.azimut.toFixed(2)}°</strong>
              </div>
              
              <div style={{ 
                marginTop: '10px', 
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                fontSize: '11px',
                textAlign: 'center'
              }}>
                Punto {currentPoint.numero} de {trajectory?.length || 100} en la trayectoria
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
                disabled={isPlaying}
                style={{
                  ...sliderStyle,
                  opacity: isPlaying ? 0.5 : 1,
                  cursor: isPlaying ? 'not-allowed' : 'pointer'
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
            
            {/* Controles de simulación */}
            {!isPlaying && !isFinished && (
              <button
                style={startButtonStyle}
                onClick={handleStartSimulation}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ▶️ Iniciar Simulación
              </button>
            )}

            {isPlaying && (
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                background: 'rgba(76, 175, 80, 0.15)',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'center',
                borderLeft: '3px solid rgba(76, 175, 80, 0.8)'
              }}>
                ▶️ Simulación en progreso... 🌞 Observa la estela del sol
              </div>
            )}

            {isFinished && (
              <button
                style={restartButtonStyle}
                onClick={handleRestartSimulation}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🔄 Reiniciar Simulación
              </button>
            )}
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
          disabled={isPlaying}
        />
        
        {/* Panel lateral de datos de trayectoria solar */}
        <SolarDataPanel
          trajectory={trajectory}
          isFinished={isFinished}
          panelInclination={panelInclination}
          wallSolarAzimuth={wallSolarAzimuth}
        />
      </div>
    );
  }

  // Vista de selección de ubicación
  return <LocationSelector onLocationConfirmed={handleLocationConfirmed} />;
};

export default SimulationMode;
