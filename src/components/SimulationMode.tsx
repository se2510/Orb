import React, { useState } from 'react';
import LocationSelector, { type Coordinates } from './LocationSelector';

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

const SimulationMode: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);

  const handleLocationConfirmed = (coords: Coordinates) => {
    setSelectedLocation(coords);
  };

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
