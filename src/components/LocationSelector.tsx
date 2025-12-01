import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para el ícono del marcador en Leaflet con React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  coords: Coordinates;
  date: Date;
  locationName?: string;
}

interface LocationSelectorProps {
  onLocationConfirmed: (data: LocationData) => void;
}

const containerStyle: React.CSSProperties = { 
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%', 
  height: '100%',
  overflow: 'hidden'
};

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%'
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

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: '600',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  transition: 'all 0.3s ease',
  marginTop: '15px'
};

const coordDisplayStyle: React.CSSProperties = {
  marginTop: '15px',
  padding: '15px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '14px'
};

const dateInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: '14px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  fontFamily: 'sans-serif',
  outline: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: '600',
  color: 'rgba(255, 255, 255, 0.9)'
};

const zoomControlsStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1000,
  pointerEvents: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const zoomButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  background: 'white',
  border: '2px solid rgba(0, 0, 0, 0.2)',
  borderRadius: '4px',
  fontSize: '24px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  color: '#333',
  transition: 'all 0.2s ease'
};

// Componente para manejar clicks en el mapa
const MapClickHandler: React.FC<{ onLocationSelect: (coords: Coordinates) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Componente de controles de zoom personalizados
const ZoomControls: React.FC = () => {
  const map = useMapEvents({});

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div style={zoomControlsStyle}>
      <button
        style={zoomButtonStyle}
        onClick={handleZoomIn}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
        title="Zoom in"
      >
        +
      </button>
      <button
        style={zoomButtonStyle}
        onClick={handleZoomOut}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
};

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationConfirmed }) => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [locationName, setLocationName] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);

  const handleLocationSelect = async (coords: Coordinates) => {
    setSelectedLocation(coords);
    setLoadingLocation(true);
    
    // Obtener nombre de la ubicación usando geocodificación inversa
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        
        // Construir nombre legible de la ubicación
        const parts = [];
        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.village) parts.push(address.village);
        else if (address.municipality) parts.push(address.municipality);
        
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        
        setLocationName(parts.length > 0 ? parts.join(', ') : 'Ubicación desconocida');
      } else {
        setLocationName('Ubicación desconocida');
      }
    } catch (error) {
      console.error('Error al obtener nombre de ubicación:', error);
      setLocationName('Ubicación desconocida');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSelectedDate(date);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationConfirmed({
        coords: selectedLocation,
        date: selectedDate,
        locationName: locationName || undefined
      });
    }
  };

  // Formatear fecha para el input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div style={containerStyle}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={mapContainerStyle}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        <ZoomControls />
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
        )}
      </MapContainer>

      <div style={overlayStyle}>
        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
            🌍 Simulación Solar por Ubicación
          </h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
            Selecciona una ubicación en el mapa para iniciar la simulación solar basada en coordenadas geográficas reales
          </p>
          
          <div style={{ marginTop: '15px' }}>
            <label style={labelStyle}>
              📅 Fecha de simulación
            </label>
            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={handleDateChange}
              style={dateInputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.8)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          {selectedLocation ? (
            <>
              <div style={coordDisplayStyle}>
                {loadingLocation ? (
                  <div style={{ marginBottom: '10px', fontStyle: 'italic', opacity: 0.7 }}>
                    🔍 Buscando ubicación...
                  </div>
                ) : locationName && (
                  <div style={{ marginBottom: '15px', fontSize: '15px', fontWeight: '600' }}>
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
              <button
                style={buttonStyle}
                onClick={handleConfirmLocation}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Iniciar Simulación
              </button>
            </>
          ) : (
            <div style={{
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center',
              opacity: 0.7
            }}>
              📍 Haz clic en cualquier punto del mapa
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
