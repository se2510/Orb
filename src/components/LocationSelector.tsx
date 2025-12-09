import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LocationSelector.css';
import RotatingPlanet from './RotatingPlanet';
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

// Map click handler
const MapClickHandler: React.FC<{ onLocationSelect: (coords: Coordinates) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Zoom controls component
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
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  }, []);

  const handleLocationSelect = useCallback(async (coords: Coordinates) => {
    setSelectedLocation(coords);
    setLoadingLocation(true);
    if (window.innerWidth <= 768) {
      setIsCollapsed(false);
    }
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

  // Cuando la ubicación cambia desde búsqueda/manual, limpiar sugerencias
  useEffect(() => {
    if (selectedLocation) {
      setSuggestions([]);
      setQuery('');
    }
  }, [selectedLocation]);

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

  // --- BÚSQUEDA POR TEXTO (Nominatim forward geocoding) ---
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = encodeURIComponent(query.trim());
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=6&accept-language=es`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          setSuggestions([]);
          setIsSearching(false);
          return;
        }
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          console.error('Geocoding error', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelectSuggestion = useCallback((item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const name = item.display_name || item.address && Object.values(item.address).slice(-3).join(', ');
    setSelectedLocation({ lat, lng: lon });
    setLocationName(name || 'Ubicación seleccionada');
    setSuggestions([]);
    setQuery('');
  }, []);

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

  // Helper para centrar el mapa cuando se selecciona una ubicación
  const SetMapView: React.FC<{ coords: Coordinates | null }> = ({ coords }) => {
    const Inner: React.FC<{ coords: Coordinates | null }> = ({ coords }) => {
      const mapInstance = useMap();
      useEffect(() => {
        if (coords && mapInstance) {
          try {
            mapInstance.setView([coords.lat, coords.lng], Math.max(mapInstance.getZoom(), 6));
          } catch (e) {
            // noop
          }
        }
      }, [coords, mapInstance]);
      return null;
    };
    return <Inner coords={coords} />;
  };

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
            <span className="title-planet" aria-hidden="true">
              <RotatingPlanet size={20} />
            </span>
            <span className="title-text">Simulación Solar</span>
            <span className="collapse-icon">▼</span>
          </h2>
          <div className="panel-content">
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.8 }}>
            Busca por nombre (ej. "Ciudad de México"), usa el mapa o ingresa coordenadas manuales
          </p>

          {/* BÚSQUEDA POR TEXTO */}
          <div style={{ marginBottom: '12px' }}>
            <label className="input-label">🔎 Buscar ubicación</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Ciudad de México, Bogotá, Madrid"
              className="date-input"
              aria-label="Buscar ubicación"
            />
            {isSearching && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Buscando...</div>}
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => handleSelectSuggestion(s)} className="suggestion-item">
                    <div style={{ fontSize: 13 }}>{s.display_name}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Primary actions row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <button
              onClick={handleGeolocation}
              className="location-btn primary-cta"
              style={{ flex: 1 }}
              title="Usar mi ubicación"
            >
              📍 Usar mi ubicación
            </button>

            <button
              onClick={() => { setManualLat(''); setManualLng(''); setSelectedLocation(null); setLocationName(''); }}
              className="icon-btn small"
              title="Limpiar selección"
              aria-label="Limpiar"
            >
              ♻️
            </button>
          </div>

          {/* Advanced (manual coords) toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <button
              className="advanced-toggle"
              onClick={() => setShowAdvanced(v => !v)}
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? '▼ Opciones avanzadas' : '▲ Mostrar coordenadas manuales'}
            </button>
            <button
              className="advanced-sample small"
              onClick={() => { setQuery('Ciudad de México'); }}
              title="Ejemplo rápido"
            >
              Ejemplo
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-panel" style={{ marginBottom: 12 }}>
              <div className="inline-input-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: 6 }}>🧭 Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="19.432608"
                    className="date-input"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: 6 }}>🧭 Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="-99.133209"
                    className="date-input"
                  />
                </div>
                <div style={{ width: 110 }}>
                  <label className="input-label" style={{ opacity: 0 }}>&nbsp;</label>
                  <button
                    onClick={handleManualCoordinates}
                    className="location-btn inline-apply"
                    style={{ width: '100%' }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {validationError && (
                <div className="error-message" style={{ marginTop: 8 }}>⚠️ {validationError}</div>
              )}

              <div style={{ marginTop: 10 }}>
                <label className="input-label">📅 Fecha de simulación</label>
                <input
                  type="date"
                  value={formattedDate}
                  onChange={handleDateChange}
                  className="date-input"
                />
              </div>
            </div>
          )}

          {/* Fecha ahora en opciones avanzadas para mantener UI limpia */}

          {selectedLocation ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'center' }}>
                {loadingLocation ? (
                  <div style={{ fontStyle: 'italic', opacity: 0.8 }}>🔍 Buscando...</div>
                ) : (
                  <div style={{ fontWeight: 700 }}>{locationName || `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lng.toFixed(4)}°`}</div>
                )}
                <div style={{ marginTop: 6, fontFamily: 'monospace', opacity: 0.85, fontSize: 13 }}>
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  📅 {formattedDate}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
                <button
                  className="location-btn"
                  onClick={handleConfirmLocation}
                  style={{ maxWidth: 220 }}
                >
                  🚀 Iniciar simulación
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center', opacity: 0.8 }}>
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
