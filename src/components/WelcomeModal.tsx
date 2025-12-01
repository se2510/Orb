import React from 'react';

interface WelcomeModalProps {
  onSelectMode: (mode: 'free' | 'simulation') => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(10px)'
};

const modalStyle: React.CSSProperties = {
  background: 'white',
  padding: '50px',
  borderRadius: '20px',
  maxWidth: '600px',
  textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  fontFamily: 'sans-serif',
  animation: 'fadeIn 0.5s ease-out'
};

const titleStyle: React.CSSProperties = {
  fontSize: '48px',
  margin: '0 0 10px 0',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold'
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#666',
  marginBottom: '40px'
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap'
};

const buttonStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '200px',
  padding: '20px 30px',
  fontSize: '16px',
  fontWeight: '600',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
};

const freeModeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white'
};

const simulationModeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white'
};

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onSelectMode }) => {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h1 style={titleStyle}>
          Bienvenido/a a Orb
        </h1>
        <p style={subtitleStyle}>
          Explora la energía solar de manera interactiva
        </p>
        
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '16px', color: '#555', margin: '0' }}>
            Selecciona un modo para comenzar:
          </p>
        </div>

        <div style={buttonContainerStyle}>
          <button
            style={freeModeButtonStyle}
            onClick={() => onSelectMode('free')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎨</div>
            <div>Modo Libre</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              Controla manualmente los ángulos solares
            </div>
          </button>

          <button
            style={simulationModeButtonStyle}
            onClick={() => onSelectMode('simulation')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌍</div>
            <div>Modo Simulación</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              Simula una ubicación específica
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
