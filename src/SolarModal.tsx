import React from 'react';

interface SolarModalProps {
  open: boolean;
  onClose: () => void;
  sunPosition: { x: number; y: number; z: number };
  earthPosition: { x: number; y: number; z: number };
  moonPosition: { x: number; y: number; z: number };
  angleIncidence: number;
  hour: string;
}

const SolarModal: React.FC<SolarModalProps> = ({ open, onClose, sunPosition, earthPosition, moonPosition, angleIncidence, hour }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#222',
        color: '#fff',
        padding: '2rem',
        borderRadius: '12px',
        minWidth: '320px',
        boxShadow: '0 2px 16px #000',
      }}>
        <h2>Información Solar</h2>
        <p><b>Ángulo de incidencia:</b> {angleIncidence.toFixed(2)}°</p>
        <p><b>Hora:</b> {hour}</p>
        <p><b>Sol:</b> x: {sunPosition.x.toFixed(2)}, y: {sunPosition.y.toFixed(2)}, z: {sunPosition.z.toFixed(2)}</p>
        <p><b>Tierra:</b> x: {earthPosition.x.toFixed(2)}, y: {earthPosition.y.toFixed(2)}, z: {earthPosition.z.toFixed(2)}</p>
        <p><b>Luna:</b> x: {moonPosition.x.toFixed(2)}, y: {moonPosition.y.toFixed(2)}, z: {moonPosition.z.toFixed(2)}</p>
        <button style={{marginTop: '1rem'}} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default SolarModal;
