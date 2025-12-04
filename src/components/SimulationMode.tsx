import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import LocationSelector, { type Coordinates, type LocationData } from './LocationSelector';
import Scene from './Scene';
// import BuildingControlsModal from './BuildingControlsModal'; // Ahora integrado en panel de configuraciones
import SolarDataPanel from './SolarDataPanel';
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
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  maxHeight: 'calc(100vh - 40px)',
  width: '320px'
};

const panelStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '10px',
  borderRadius: '8px',
  flex: '1',
  minHeight: '0',
  overflowY: 'auto',
  fontFamily: 'sans-serif'
};

const coordDisplayStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '10px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '6px',
  fontSize: '12px'
};

const solarInfoStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '10px',
  background: 'rgba(255, 193, 7, 0.15)',
  borderRadius: '6px',
  fontSize: '12px',
  borderLeft: '3px solid rgba(255, 193, 7, 0.8)'
};

const infoRowStyle: React.CSSProperties = {
  marginBottom: '6px',
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
  maxWidth: '800px',
  transition: 'opacity 0.3s ease, transform 0.3s ease'
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

const anglesDisplayStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  pointerEvents: 'auto',
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  padding: '16px',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 1000,
  minWidth: '290px',
  maxWidth: '300px'
};

const angleItemStyle: React.CSSProperties = {
  marginBottom: '10px',
  paddingBottom: '10px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
};

const angleLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  opacity: 0.7,
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const angleValueStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px'
};

const angleUnitStyle: React.CSSProperties = {
  fontSize: '14px',
  opacity: 0.6,
  fontWeight: 'normal'
};

const configPanelStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '10px',
  borderRadius: '8px',
  flex: '2',
  minHeight: '0',
  overflowY: 'auto',
  fontFamily: 'sans-serif'
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
  const [showAltitudeRef, setShowAltitudeRef] = useState(false); // Mostrar referencia visual de altura solar (β)
  const [showAzimuthRef, setShowAzimuthRef] = useState(false); // Mostrar referencia visual de azimut solar (γ)
  const [showWallSolarAzimuthRef, setShowWallSolarAzimuthRef] = useState(false); // Mostrar referencia visual del ángulo ψ
  const [showIncidenceAngleRef, setShowIncidenceAngleRef] = useState(false); // Mostrar referencia visual del ángulo θ
  const [isPaused, setIsPaused] = useState(false); // Control de pausa
  const [isSolarDataPanelOpen, setIsSolarDataPanelOpen] = useState(false); // Estado del panel lateral de datos
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

  // Calcular ángulos en tiempo real usando useMemo para evitar cálculos innecesarios
  const wallSolarAzimuthValue = useMemo(() => {
    if (!currentPoint) return 0;
    return calculateWallSolarAzimuth(currentPoint.azimut, wallSolarAzimuth);
  }, [currentPoint, wallSolarAzimuth]);
  
  const incidenceAngle = useMemo(() => {
    if (!currentPoint) return 0;
    return calculateIncidenceAngleOnPanel(currentPoint.altura, panelInclination, wallSolarAzimuthValue);
  }, [currentPoint, panelInclination, wallSolarAzimuthValue]);
  
  const efficiency = useMemo(() => {
    return calculatePanelEfficiency(incidenceAngle);
  }, [incidenceAngle]);

  // Vista de simulación con coordenadas
  // Ahora usamos directamente los ángulos solares reales del cálculo
  if (selectedLocation && currentPoint) {
    return (
      <div style={containerStyle}>
        {/* Botón de regreso al menú */}
        <button
          style={{
            ...backButtonStyle,
            top: '20px',
            right: '330px' // Siempre a la izquierda de la tarjeta de ángulos
          }}
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

        {/* Display de ángulos en tiempo real - Siempre visible durante simulación */}
        <div style={anglesDisplayStyle}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '14px', 
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#FFD700',
              borderBottom: '2px solid rgba(255, 215, 0, 0.3)',
              paddingBottom: '8px'
            }}>
              📐 Ángulos en Tiempo Real
            </h3>
            
            {/* Altura Solar (β) */}
            <div style={{...angleItemStyle, borderColor: 'rgba(33, 150, 243, 0.3)'}}>
              <div style={angleLabelStyle}>☀️ Altura Solar (β)</div>
              <div style={angleValueStyle}>
                <span style={{ color: '#2196F3' }}>{currentPoint.altura.toFixed(2)}</span>
                <span style={angleUnitStyle}>°</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', cursor: 'pointer', opacity: 0.8, marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={showAltitudeRef}
                  onChange={(e) => setShowAltitudeRef(e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Mostrar en 3D
              </label>
            </div>
            
            {/* Azimut Solar (γ) */}
            <div style={{...angleItemStyle, borderColor: 'rgba(33, 150, 243, 0.3)'}}>
              <div style={angleLabelStyle}>🧭 Azimut Solar (γ)</div>
              <div style={angleValueStyle}>
                <span style={{ color: '#2196F3' }}>{currentPoint.azimut.toFixed(2)}</span>
                <span style={angleUnitStyle}>°</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', cursor: 'pointer', opacity: 0.8, marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={showAzimuthRef}
                  onChange={(e) => setShowAzimuthRef(e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Mostrar en 3D
              </label>
            </div>
            
            {/* Separador */}
            <div style={{
              margin: '12px 0',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.5), transparent)'
            }} />
            
            {/* Azimut Sol-Pared (ψ) - ÁNGULO PRINCIPAL */}
            <div style={{
              ...angleItemStyle, 
              borderColor: 'rgba(255, 215, 0, 0.5)',
              background: 'rgba(255, 215, 0, 0.05)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <div style={{
                ...angleLabelStyle,
                color: '#FFD700',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                ⭐ Azimut Sol-Pared (ψ)
              </div>
              <div style={angleValueStyle}>
                <span style={{ color: '#FFD700', fontSize: '24px' }}>
                  {wallSolarAzimuthValue.toFixed(2)}
                </span>
                <span style={{...angleUnitStyle, color: '#FFD700'}}>°</span>
              </div>
              <div style={{
                fontSize: '10px',
                opacity: 0.6,
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                Diferencia angular sol-panel
              </div>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', cursor: 'pointer', opacity: 0.8, marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={showWallSolarAzimuthRef}
                  onChange={(e) => setShowWallSolarAzimuthRef(e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Mostrar en 3D
              </label>
            </div>
            
            {/* Ángulo de Incidencia (θ) - ÁNGULO PRINCIPAL */}
            <div style={{
              ...angleItemStyle,
              borderColor: 'rgba(255, 152, 0, 0.5)',
              background: 'rgba(255, 152, 0, 0.05)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderBottom: 'none'
            }}>
              <div style={{
                ...angleLabelStyle,
                color: '#FF9800',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                ⭐ Ángulo de Incidencia (θ)
              </div>
              <div style={angleValueStyle}>
                <span style={{ color: '#FF9800', fontSize: '24px' }}>
                  {incidenceAngle.toFixed(2)}
                </span>
                <span style={{...angleUnitStyle, color: '#FF9800'}}>°</span>
              </div>
              <div style={{
                fontSize: '10px',
                opacity: 0.6,
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                Rayos solares vs. normal del panel
              </div>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', cursor: 'pointer', opacity: 0.8, marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={showIncidenceAngleRef}
                  onChange={(e) => setShowIncidenceAngleRef(e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Mostrar en 3D
              </label>
            </div>
            
            {/* Eficiencia del Panel */}
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: efficiency > 80 
                ? 'rgba(76, 175, 80, 0.15)' 
                : efficiency > 50 
                ? 'rgba(255, 193, 7, 0.15)' 
                : 'rgba(244, 67, 54, 0.15)',
              borderRadius: '8px',
              border: `1px solid ${efficiency > 80 
                ? 'rgba(76, 175, 80, 0.3)' 
                : efficiency > 50 
                ? 'rgba(255, 193, 7, 0.3)' 
                : 'rgba(244, 67, 54, 0.3)'}`
            }}>
              <div style={{
                ...angleLabelStyle,
                color: efficiency > 80 ? '#4CAF50' : efficiency > 50 ? '#FFC107' : '#F44336'
              }}>
                ⚡ Eficiencia del Panel
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginTop: '4px'
              }}>
                <span style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold',
                  color: efficiency > 80 ? '#4CAF50' : efficiency > 50 ? '#FFC107' : '#F44336'
                }}>
                  {efficiency.toFixed(1)}
                </span>
                <span style={{ fontSize: '16px', opacity: 0.7 }}>%</span>
              </div>
              {/* Barra de progreso */}
              <div style={{
                marginTop: '8px',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${efficiency}%`,
                  background: efficiency > 80 
                    ? 'linear-gradient(90deg, #4CAF50, #66BB6A)' 
                    : efficiency > 50 
                    ? 'linear-gradient(90deg, #FFC107, #FFD54F)' 
                    : 'linear-gradient(90deg, #F44336, #E57373)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            
            {/* Indicador de tiempo */}
            <div style={{
              marginTop: '12px',
              padding: '8px',
              background: 'rgba(156, 39, 176, 0.1)',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span>🕒</span>
              <span style={{ fontWeight: 'bold', color: '#CE93D8' }}>
                {currentPoint.horaSolar}
              </span>
            </div>
          </div>

        {/* Escena 3D con animación usando ángulos solares reales */}
        <Scene 
          sunAltitude={currentPoint.altura} 
          sunAzimuth={currentPoint.azimut}
          showAltitudeReference={showAltitudeRef}
          showAzimuthReference={showAzimuthRef}
          showWallSolarAzimuthReference={showWallSolarAzimuthRef}
          showIncidenceAngle={showIncidenceAngleRef}
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
            <h2 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold' }}>
              🌍 Simulación Solar
            </h2>
            
            <div style={coordDisplayStyle}>
              {locationName && (
                <div style={{ 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  📍 {locationName}
                </div>
              )}
              <div style={{ marginBottom: '5px', fontSize: '11px' }}>
                <strong>Lat:</strong> {selectedLocation.lat.toFixed(4)}°
              </div>
              <div style={{ fontSize: '11px' }}>
                <strong>Lng:</strong> {selectedLocation.lng.toFixed(4)}°
              </div>
            </div>

            {solarInfo && (
              <div style={solarInfoStyle}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>
                  ☀️ Info del Día
                </h3>
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '6px' }}>
                  {selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                
                <div style={infoRowStyle}>
                  <span>🌅 Amanecer:</span>
                  <strong>{solarInfo.horaAmanecer}</strong>
                </div>
                
                <div style={infoRowStyle}>
                  <span>🌇 Atardecer:</span>
                  <strong>{solarInfo.horaAtardecer}</strong>
                </div>
                
                <div style={infoRowStyle}>
                  <span>⏱️ Asoleamiento:</span>
                  <strong>{solarInfo.tiempoAsoleamiento.toFixed(1)} hrs</strong>
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
          </div>

          {/* Panel de Configuraciones */}
          <div style={configPanelStyle}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold' }}>
              ⚙️ Configuraciones
            </h2>

            {/* Fecha y Día del año */}
            <div style={{
              marginTop: '0',
              padding: '8px',
              background: 'rgba(255, 215, 0, 0.15)',
              borderRadius: '6px',
              fontSize: '11px',
              borderLeft: '3px solid rgba(255, 215, 0, 0.8)'
            }}>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '3px' }}>📅 Fecha</div>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold'
                }}>
                  {selectedDate.toLocaleDateString('es-MX', { 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
              {solarInfo && (
                <div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '3px' }}>📆 Día del año</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    background: 'rgba(255, 215, 0, 0.2)',
                    padding: '4px',
                    borderRadius: '4px'
                  }}>
                    {solarInfo.n}
                  </div>
                </div>
              )}
            </div>

            {/* Velocidad de simulación */}
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(156, 39, 176, 0.15)',
              borderRadius: '6px',
              borderLeft: '3px solid rgba(156, 39, 176, 0.8)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>⚡ Velocidad</span>
                <strong style={{ fontSize: '11px' }}>{simulationSpeed}s</strong>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Configuración del Edificio */}
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(76, 175, 80, 0.15)',
              borderRadius: '6px',
              borderLeft: '3px solid rgba(76, 175, 80, 0.8)'
            }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold' }}>
                🏢 Edificio
              </h3>
              
              {/* Azimut Solar-Pared */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>🧭 Azimut (ψ)</span>
                  <strong style={{ 
                    background: 'rgba(76, 175, 80, 0.3)', 
                    padding: '2px 5px', 
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    {wallSolarAzimuth.toFixed(0)}°
                  </strong>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={wallSolarAzimuth}
                  onChange={(e) => setWallSolarAzimuth(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Inclinación del Panel */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>📐 Inclinación (φ)</span>
                  <strong style={{ 
                    background: 'rgba(33, 150, 243, 0.3)', 
                    padding: '2px 5px', 
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    {panelInclination.toFixed(0)}°
                  </strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={panelInclination}
                  onChange={(e) => setPanelInclination(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de controles del edificio - DESHABILITADO, ahora integrado en panel de configuraciones */}
        {/* <BuildingControlsModal
          wallSolarAzimuth={wallSolarAzimuth}
          panelInclination={panelInclination}
          showWallSolarAzimuthRef={showWallSolarAzimuthRef}
          onWallSolarAzimuthChange={setWallSolarAzimuth}
          onPanelInclinationChange={setPanelInclination}
          onShowWallSolarAzimuthRefChange={setShowWallSolarAzimuthRef}
          disabled={isPlaying && !isPaused}
        /> */}
        
        {/* Panel lateral de datos de trayectoria solar */}
        <SolarDataPanel
          trajectory={trajectory}
          isFinished={isFinished}
          panelInclination={panelInclination}
          wallSolarAzimuth={wallSolarAzimuth}
          onOpenChange={setIsSolarDataPanelOpen}
          locationName={locationName}
          date={selectedDate}
          latitude={selectedLocation.lat}
          longitude={selectedLocation.lng}
        />
        
        {/* Control flotante de simulación (bottom center) */}
        <div style={{
          ...floatingControlsStyle,
          opacity: isSolarDataPanelOpen ? 0 : 1,
          transform: isSolarDataPanelOpen ? 'translate(-50%, 50px)' : 'translateX(-50%)',
          pointerEvents: isSolarDataPanelOpen ? 'none' : 'auto'
        }}>
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

            {/* Slider de navegación */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              maxWidth: '300px',
              minWidth: '150px'
            }}>
              <input
                type="range"
                min="0"
                max={(trajectory?.length || 100) - 1}
                value={currentPointIndex}
                onChange={(e) => {
                  const newIndex = Number(e.target.value);
                  setCurrentPointIndex(newIndex);
                  if (trajectory && trajectory[newIndex]) {
                    setCurrentPoint(trajectory[newIndex]);
                  }
                }}
                disabled={isPlaying && !isPaused}
                style={{
                  width: '100%',
                  cursor: (isPlaying && !isPaused) ? 'not-allowed' : 'pointer',
                  opacity: (isPlaying && !isPaused) ? 0.5 : 1
                }}
              />
            </div>
            
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
