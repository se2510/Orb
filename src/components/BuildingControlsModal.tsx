import React from 'react';

interface BuildingControlsModalProps {
  wallSolarAzimuth: number;
  panelInclination: number;
  showWallSolarAzimuthRef: boolean;
  onWallSolarAzimuthChange: (value: number) => void;
  onPanelInclinationChange: (value: number) => void;
  onShowWallSolarAzimuthRefChange: (value: boolean) => void;
  disabled?: boolean;
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  pointerEvents: 'auto',
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.85)',
  color: 'white',
  padding: '12px',
  borderRadius: '10px',
  minWidth: '220px',
  maxWidth: '240px',
  fontFamily: 'sans-serif',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '8px',
  marginBottom: '8px'
};

const BuildingControlsModal: React.FC<BuildingControlsModalProps> = ({
  wallSolarAzimuth,
  panelInclination,
  showWallSolarAzimuthRef,
  onWallSolarAzimuthChange,
  onPanelInclinationChange,
  onShowWallSolarAzimuthRefChange,
  disabled = false
}) => {
  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '13px', 
          fontWeight: 'bold',
          color: '#76C7C0',
          borderBottom: '1px solid rgba(118, 199, 192, 0.3)',
          paddingBottom: '6px'
        }}>
          🏢 Configuración
        </h3>
        
        {/* Control de Azimut Solar-Pared */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600' }}>🧭 Azimut (ψ)</span>
            <strong style={{ 
              background: 'rgba(76, 175, 80, 0.2)', 
              padding: '2px 6px', 
              borderRadius: '4px',
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
            onChange={(e) => onWallSolarAzimuthChange(Number(e.target.value))}
            disabled={disabled}
            style={{
              ...sliderStyle,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', cursor: 'pointer', marginTop: '4px', opacity: 0.8 }}>
            <input
              type="checkbox"
              checked={showWallSolarAzimuthRef}
              onChange={(e) => onShowWallSolarAzimuthRefChange(e.target.checked)}
              disabled={disabled}
              style={{ marginRight: '4px' }}
            />
            Mostrar referencia
          </label>
        </div>
        
        {/* Control de Inclinación del Panel */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600' }}>📐 Inclinación (φ)</span>
            <strong style={{ 
              background: 'rgba(33, 150, 243, 0.2)', 
              padding: '2px 6px', 
              borderRadius: '4px',
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
            onChange={(e) => onPanelInclinationChange(Number(e.target.value))}
            disabled={disabled}
            style={{
              ...sliderStyle,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BuildingControlsModal;
