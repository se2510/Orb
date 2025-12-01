import React, { useState } from 'react';
import type { SolarTrajectoryPoint } from '../utils/solarCalculations';

interface SolarDataPanelProps {
  trajectory: SolarTrajectoryPoint[] | null;
  isFinished: boolean;
}

const panelContainerStyle = (isOpen: boolean): React.CSSProperties => ({
  position: 'fixed',
  top: 0,
  right: isOpen ? 0 : '-450px',
  width: '450px',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  transition: 'right 0.3s ease',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: isOpen ? '-4px 0 20px rgba(0, 0, 0, 0.5)' : 'none'
});

const toggleButtonStyle = (isOpen: boolean): React.CSSProperties => ({
  position: 'fixed',
  top: '50%',
  right: isOpen ? '450px' : '0',
  transform: 'translateY(-50%)',
  background: 'rgba(0, 0, 0, 0.85)',
  color: 'white',
  border: 'none',
  padding: '20px 12px',
  cursor: 'pointer',
  borderRadius: '8px 0 0 8px',
  fontSize: '20px',
  transition: 'right 0.3s ease',
  zIndex: 1002,
  boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
});

const headerStyle: React.CSSProperties = {
  padding: '25px 20px',
  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
  flexShrink: 0
};

const tableContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '20px'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px'
};

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
  background: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(10px)',
  fontWeight: 'bold',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  fontSize: '12px'
};

const tdStyle: React.CSSProperties = {
  padding: '10px 8px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
};

const SolarDataPanel: React.FC<SolarDataPanelProps> = ({ trajectory, isFinished }) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // Solo mostrar el panel si la simulación ha finalizado
  if (!isFinished) {
    return null;
  }

  return (
    <>
      {/* Botón para abrir/cerrar el panel */}
      <button
        style={toggleButtonStyle(isOpen)}
        onClick={togglePanel}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
        }}
      >
        {isOpen ? '›' : '‹'}
      </button>

      {/* Panel lateral */}
      <div style={panelContainerStyle(isOpen)}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            📊 Datos de Trayectoria Solar
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
            {trajectory ? `${trajectory.length} puntos calculados` : 'Sin datos'}
          </p>
        </div>

        <div style={tableContainerStyle}>
          {trajectory && trajectory.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Hora Solar</th>
                  <th style={thStyle}>Ángulo Horario (°)</th>
                  <th style={thStyle}>Altura β (°)</th>
                  <th style={thStyle}>Azimut γ (°)</th>
                </tr>
              </thead>
              <tbody>
                {trajectory.map((point) => {
                  return (
                    <tr key={point.numero}>
                      <td style={tdStyle}>{point.numero}</td>
                      <td style={tdStyle}>{point.horaSolar}</td>
                      <td style={tdStyle}>{point.anguloHorario.toFixed(2)}</td>
                      <td style={tdStyle}>{point.altura.toFixed(2)}</td>
                      <td style={tdStyle}>{point.azimut.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              opacity: 0.6,
              fontSize: '14px'
            }}>
              No hay datos de trayectoria disponibles
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SolarDataPanel;
