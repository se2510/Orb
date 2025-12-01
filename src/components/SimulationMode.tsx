import React, { useState, useEffect } from 'react';
import LocationSelector, { type Coordinates, type LocationData } from './LocationSelector';
import { calculateSunriseSunset, type SunriseSunsetInfo } from '../utils/solarCalculations';

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

const SimulationMode: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [solarInfo, setSolarInfo] = useState<SunriseSunsetInfo | null>(null);

  const handleLocationConfirmed = (data: LocationData) => {
    setSelectedLocation(data.coords);
    setSelectedDate(data.date);
  };

  // Calcular información solar cuando cambia la ubicación o la fecha
  useEffect(() => {
    if (selectedLocation) {
      const info = calculateSunriseSunset(selectedDate, selectedLocation.lat);
      setSolarInfo(info);
    }
  }, [selectedLocation, selectedDate]);

  // Vista de simulación con coordenadas
  if (selectedLocation) {
    return (
      <div style={containerStyle}>
        <div style={overlayStyle}>
          <div style={panelStyle}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
              🌍 Ubicación Seleccionada
            </h2>
            
            <div style={coordDisplayStyle}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}°
              </div>
              <div>
                <strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}°
              </div>
            </div>

            {solarInfo && (
              <div style={solarInfoStyle}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  ☀️ Información Solar - {selectedDate.toLocaleDateString('es-MX', { 
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
              marginTop: '20px', 
              padding: '15px', 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              🚧 Maqueta de simulación en desarrollo...
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
