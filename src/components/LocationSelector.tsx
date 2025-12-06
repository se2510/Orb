import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LocationSelector.css';

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
    <div className="zoom-controls">
      <button
        className="zoom-btn"
        onClick={handleZoomIn}
        title="Zoom in"
      >
        +
      </button>
      <button
        className="zoom-btn"
        onClick={handleZoomOut}
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
};


type InputMode = 'map' | 'manual';

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationConfirmed }) => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [locationName, setLocationName] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<InputMode>('map');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  }, []);

  const handleLocationSelect = useCallback(async (coords: Coordinates) => {
    setSelectedLocation(coords);
    setLoadingLocation(true);
    // Si el panel estaba colapsado, abrirlo para mostrar la info
    if (window.innerWidth <= 768) {
      setIsCollapsed(false);
    }
    
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
  }, []);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        handleLocationSelect(coords);
      },
      (error) => {
        setLoadingLocation(false);
        alert('No se pudo obtener tu ubicación: ' + error.message);
      }
    );
  }, [handleLocationSelect]);

  const handleManualCoordinates = useCallback(() => {
    setValidationError('');
    
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    // Validación
    if (isNaN(lat) || isNaN(lng)) {
      setValidationError('Ingresa valores numéricos válidos');
      return;
    }

    if (lat < -90 || lat > 90) {
      setValidationError('Latitud debe estar entre -90 y 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setValidationError('Longitud debe estar entre -180 y 180');
      return;
    }

    handleLocationSelect({ lat, lng });
  }, [manualLat, manualLng, handleLocationSelect]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSelectedDate(date);
  }, []);

  const handleConfirmLocation = useCallback(() => {
    if (selectedLocation) {
      onLocationConfirmed({
        coords: selectedLocation,
        date: selectedDate,
        locationName: locationName || undefined
      });
    }
  }, [selectedLocation, selectedDate, locationName, onLocationConfirmed]);

  // Formatear fecha para el input type="date" (YYYY-MM-DD)
  const formattedDate = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  return (
    <div className="location-selector-container">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="map-container"
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

      <div className="location-overlay">
        <div className={`location-panel ${isCollapsed ? 'collapsed' : ''}`}>
          <h2 className="location-title" onClick={() => setIsCollapsed(!isCollapsed)}>
            🌍 Simulación Solar
            <span className="collapse-icon">▼</span>
          </h2>
          <div className="panel-content">
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
            Selecciona una ubicación en el mapa o ingresa coordenadas manualmente
          </p>

          {/* Tabs para seleccionar modo */}
          <div className="mode-tabs">
            <div
              onClick={() => setInputMode('map')}
              className={`mode-tab ${inputMode === 'map' ? 'active' : ''}`}
            >
              🗺️ Mapa
            </div>
            <div
              onClick={() => setInputMode('manual')}
              className={`mode-tab ${inputMode === 'manual' ? 'active' : ''}`}
            >
              ⌨️ Manual
            </div>
          </div>

          {/* Modo Manual */}
          {inputMode === 'manual' && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label className="input-label">🧭 Latitud (-90 a 90)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Ej: 40.416775"
                  className="date-input"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="input-label">🧭 Longitud (-180 a 180)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="Ej: -3.703790"
                  className="date-input"
                />
              </div>
              {validationError && (
                <div className="error-message">
                  ⚠️ {validationError}
                </div>
              )}
              <button
                onClick={handleManualCoordinates}
                className="location-btn"
                style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
              >
                📍 Aplicar Coordenadas
              </button>
            </div>
          )}

          {/* Modo Mapa */}
          {inputMode === 'map' && (
            <>
              <button
                onClick={handleGeolocation}
                className="location-btn secondary-btn"
              >
                📍 Usar Mi Ubicación
              </button>
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                fontSize: '13px',
                textAlign: 'center',
                opacity: 0.7,
                marginBottom: '15px'
              }}>
                👆 Haz clic en cualquier punto del mapa
              </div>
            </>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <label className="input-label">
              📅 Fecha de simulación
            </label>
            <input
              type="date"
              value={formattedDate}
              onChange={handleDateChange}
              className="date-input"
            />
          </div>

          {selectedLocation ? (
            <>
              <div className="coord-display">
                {loadingLocation ? (
                  <div style={{ marginBottom: '10px', fontStyle: 'italic', opacity: 0.7 }}>
                    🔍 Buscando ubicación...
                  </div>
                ) : locationName && (
                  <div style={{ marginBottom: '15px', fontSize: '15px', fontWeight: '600' }}>
                    📍 {locationName}
                  </div>
                )}
                <div className="coord-row">
                  <span>Latitud:</span>
                  <span className="coord-value">{selectedLocation.lat.toFixed(6)}°</span>
                </div>
                <div className="coord-row">
                  <span>Longitud:</span>
                  <span className="coord-value">{selectedLocation.lng.toFixed(6)}°</span>
                </div>
              </div>
              <button
                className="location-btn"
                onClick={handleConfirmLocation}
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
              opacity: 0.7,
              marginTop: '15px'
            }}>
              📍 Selecciona una ubicación para continuar
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
