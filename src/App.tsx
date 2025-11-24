import React from 'react';
import Scene from './components/Scene';
import './App.css';

const App: React.FC = () => {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%', 
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Escena 3D */}
      <Scene />
      
      {/* UI Overlay - Aquí irán los controles e información */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        {/* Panel superior para información */}
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '400px',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Maqueta Solar Interactiva</h2>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
            Usa el mouse para rotar la vista del domo
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
