import React, { useState, useEffect, useRef } from 'react';
import LocationSelector, { type Coordinates, type LocationData } from './LocationSelector';
import Scene from './Scene';
import { 
  calculateSunriseSunset, 
  type SunriseSunsetInfo,
  generateSolarTrajectory,
  type SolarTrajectoryPoint
} from '../utils/solarCalculations';

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

const SIMULATION_DURATION = 7000; // 7 segundos en milisegundos

const SimulationMode: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [solarInfo, setSolarInfo] = useState<SunriseSunsetInfo | null>(null);
  const [trajectory, setTrajectory] = useState<SolarTrajectoryPoint[] | null>(null);
  const [currentPoint, setCurrentPoint] = useState<SolarTrajectoryPoint | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const handleLocationConfirmed = (data: LocationData) => {
    setSelectedLocation(data.coords);
    setSelectedDate(data.date);
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
    }
  }, [selectedLocation, selectedDate]);

  // Iniciar animación automática cuando la trayectoria está lista
  useEffect(() => {
    if (trajectory && trajectory.length > 0) {
      startTimeRef.current = Date.now();
      
      const animate = () => {
        if (!trajectory || trajectory.length === 0) return;
        
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(elapsed / SIMULATION_DURATION, 1);
        
        // Calcular el índice actual basado en el progreso
        const index = Math.floor(progress * (trajectory.length - 1));
        const point = trajectory[index];
        
        setCurrentPoint(point);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Reiniciar animación en bucle
          startTimeRef.current = Date.now();
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trajectory]);

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
          panelInclination={30}
          panelAzimuth={0}
          useSolarAngles={true}
        />
        
        <div style={overlayStyle}>
          <div style={panelStyle}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
              🌍 Simulación Solar Automática
            </h2>
            
            <div style={coordDisplayStyle}>
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
            
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              background: 'rgba(76, 175, 80, 0.15)',
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'center',
              borderLeft: '3px solid rgba(76, 175, 80, 0.8)'
            }}>
              ▶️ Animación automática de 7 segundos en bucle
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de selección de ubicación
  return <LocationSelector onLocationConfirmed={handleLocationConfirmed} />;
};

export default SimulationMode;
