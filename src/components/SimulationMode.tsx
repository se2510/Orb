import React from 'react';

const containerStyle: React.CSSProperties = { 
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%', 
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
};

const placeholderStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.95)',
  padding: '40px',
  borderRadius: '16px',
  maxWidth: '500px',
  textAlign: 'center',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  fontFamily: 'sans-serif'
};

const SimulationMode: React.FC = () => {
  return (
    <div style={containerStyle}>
      <div style={placeholderStyle}>
        <h1 style={{ margin: '0 0 20px 0', fontSize: '32px', color: '#333' }}>
          🌍 Modo Simulación
        </h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
          Simula la posición del sol en una ubicación específica
        </p>
        <div style={{ 
          padding: '20px', 
          background: '#f0f0f0', 
          borderRadius: '8px',
          color: '#888',
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>🚧 Próximamente...</p>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px' }}>
            Aquí podrás seleccionar una ubicación geográfica y visualizar<br />
            la trayectoria solar en tiempo real
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimulationMode;
