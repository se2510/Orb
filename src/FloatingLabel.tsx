import React, { useEffect, useState } from 'react';

interface FloatingLabelProps {
  refDiv: React.RefObject<HTMLDivElement | null>;
  objectPos: { x: number; y: number; z: number };
  label: string;
  color?: string;
}

const FloatingLabel: React.FC<FloatingLabelProps> = ({ refDiv, objectPos, label, color = '#fff' }) => {
  const [screenPos, setScreenPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    if (!refDiv.current) return;
    // Obtener la cámara de Three.js
  const renderer = refDiv.current.children[0];
    if (!renderer || !(renderer instanceof HTMLCanvasElement)) return;
  // @ts-expect-error: threeRenderer is not used, but may exist
  const threeRenderer = renderer.__threeObj || renderer.threeRenderer;
    // Buscar la cámara en window (hack)
  // @ts-expect-error: camera is exposed in window from App.tsx
  const camera = window._threeCamera;
    if (!camera) return;
    // Proyectar la posición 3D a 2D
    const width = refDiv.current.clientWidth;
    const height = refDiv.current.clientHeight;
  // @ts-expect-error: THREE is exposed in window from App.tsx
  const THREE = window.THREE || {};
    if (!THREE.Vector3) return;
    const vector = new THREE.Vector3(objectPos.x, objectPos.y, objectPos.z);
    vector.project(camera);
    const left = ((vector.x + 1) / 2) * width;
    const top = ((-vector.y + 1) / 2) * height;
    setScreenPos({ left, top });
  }, [objectPos, refDiv]);

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.left,
        top: screenPos.top,
        transform: 'translate(-50%, -100%)',
        background: color,
        color: '#222',
        padding: '2px 8px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        pointerEvents: 'none',
        zIndex: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {label}
    </div>
  );
};

export default FloatingLabel;
