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
  background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
  padding: '60px 50px',
  borderRadius: '24px',
  maxWidth: '850px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  animation: 'fadeIn 0.5s ease-out',
  position: 'relative'
};

const titleStyle: React.CSSProperties = {
  fontSize: '56px',
  margin: '0 0 15px 0',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: '800',
  letterSpacing: '-1px'
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '20px',
  color: '#555',
  marginBottom: '35px',
  fontWeight: '500'
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap'
};

const buttonStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '250px',
  padding: '30px 35px',
  fontSize: '18px',
  fontWeight: '700',
  border: 'none',
  borderRadius: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
  position: 'relative',
  overflow: 'hidden'
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
          Proyecto Final de Energías Renovables
        </p>
        
        <div style={{ 
          marginBottom: '35px', 
          padding: '25px 30px', 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
          borderRadius: '16px',
          border: '2px solid rgba(102, 126, 234, 0.15)',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.1)'
        }}>
          <p style={{ 
            fontSize: '15px', 
            color: '#2d3748', 
            margin: '0 0 12px 0', 
            fontWeight: '700',
            letterSpacing: '0.3px'
          }}>
            👥 Alumnos: Domínguez Riera Erik Ivanov, González García David Elías
          </p>
          <p style={{ 
            fontSize: '15px', 
            color: '#2d3748', 
            margin: '0',
            fontWeight: '600',
            letterSpacing: '0.3px'
          }}>
            👨‍🏫 Profesor: Dr. Gabriel León de los Santos
          </p>
        </div>
        
        <div style={{ 
          marginBottom: '35px',
          padding: '0 20px'
        }}>
          <p style={{ 
            fontSize: '18px', 
            color: '#4a5568', 
            margin: '0',
            fontWeight: '600',
            letterSpacing: '0.3px'
          }}>
            Selecciona un modo para comenzar:
          </p>
        </div>

        <div style={buttonContainerStyle}>
          <button
            style={freeModeButtonStyle}
            onClick={() => onSelectMode('free')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
          >
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '15px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}>🔧</div>
            <div style={{ 
              fontSize: '22px', 
              fontWeight: '800',
              marginBottom: '12px',
              letterSpacing: '0.5px'
            }}>Modo Libre</div>
            <div style={{ 
              fontSize: '13px', 
              opacity: 0.95, 
              lineHeight: '1.6',
              fontWeight: '500',
              padding: '0 10px'
            }}>
              Observa y controla manualmente los ángulos solares, del panel y de la construcción
            </div>
          </button>

          <button
            style={simulationModeButtonStyle}
            onClick={() => onSelectMode('simulation')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(245, 87, 108, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
          >
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '15px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}>🌍</div>
            <div style={{ 
              fontSize: '22px', 
              fontWeight: '800',
              marginBottom: '12px',
              letterSpacing: '0.5px'
            }}>Modo Simulación</div>
            <div style={{ 
              fontSize: '13px', 
              opacity: 0.95, 
              lineHeight: '1.6',
              fontWeight: '500',
              padding: '0 10px'
            }}>
              Elige una ubicación y fecha para simular ángulos horarios, calcular el ángulo de incidencia entre el sol y el panel, y ver la tabla de resultados
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
