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
  right: '20px',
  pointerEvents: 'auto',
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.85)',
  color: 'white',
  padding: '20px',
  borderRadius: '12px',
  minWidth: '300px',
  maxWidth: '350px',
  fontFamily: 'sans-serif',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};

const sliderLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
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
          margin: '0 0 15px 0', 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: '#76C7C0',
          borderBottom: '2px solid rgba(118, 199, 192, 0.3)',
          paddingBottom: '10px'
        }}>
          🏢 Configuración del Edificio
        </h3>
        
        {/* Control de Azimut Solar-Pared */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
            <div style={sliderLabelStyle}>
              <span>🧭 Azimut Solar-Pared (ψ)</span>
              <strong style={{ 
                background: 'rgba(76, 175, 80, 0.2)', 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                {wallSolarAzimuth.toFixed(0)}°
              </strong>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer', marginLeft: '10px' }}>
              <input
                type="checkbox"
                checked={showWallSolarAzimuthRef}
                onChange={(e) => onShowWallSolarAzimuthRefChange(e.target.checked)}
                disabled={disabled}
                style={{ marginRight: '5px' }}
              />
              Mostrar
            </label>
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
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.7, 
            marginTop: '5px',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            0° = Pared → Sur | 90° = Oeste | -90° = Este | ±180° = Norte
          </div>
        </div>
        
        {/* Control de Inclinación del Panel */}
        <div>
          <div style={sliderLabelStyle}>
            <span>📐 Inclinación del Panel (φ)</span>
            <strong style={{ 
              background: 'rgba(33, 150, 243, 0.2)', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '13px'
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
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.7, 
            marginTop: '5px',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            0° = Horizontal (cielo) | 90° = Vertical (pared)
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingControlsModal;
