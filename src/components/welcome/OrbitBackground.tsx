import React, { useMemo } from 'react';

interface OrbitBackgroundProps {
  zoom: number;
}

const OrbitBackground: React.FC<OrbitBackgroundProps> = React.memo(({ zoom }) => {
  const zoomLevel = useMemo(() => zoom > 0.9 ? 1 : 2.5, [zoom]);
  
  const orbitSystemStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${zoomLevel})`,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    opacity: 0.5,
    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform'
  }), [zoomLevel]);

  const sunSize = useMemo(() => zoomLevel > 1.5 ? 120 : 80, [zoomLevel]);
  const sunGlow = useMemo(() => 
    zoomLevel > 1.5 
      ? 'drop-shadow(0 0 40px rgba(255, 215, 0, 0.8))' 
      : 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.6))',
    [zoomLevel]
  );

  const sunStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: `${sunSize}px`,
    height: `${sunSize}px`,
    borderRadius: '50%',
    background: 'radial-gradient(circle, #ffd700 0%, #ff8c00 50%, #ff6347 100%)',
    filter: sunGlow,
    transform: 'translate(-50%, -50%) translateZ(0)',
    animation: 'pulse 4s ease-in-out infinite',
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), height 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform, filter'
  }), [sunSize, sunGlow]);

  const planetStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #4facfe 0%, #00f2fe 100%)',
    filter: 'drop-shadow(0 0 10px rgba(79, 172, 254, 0.5))',
    animation: 'orbit 20s linear infinite',
    transform: 'translateZ(0)',
    willChange: 'transform'
  }), []);

  return (
    <div style={orbitSystemStyle}>
      <div style={sunStyle}></div>
      <div style={planetStyle}></div>
    </div>
  );
});

OrbitBackground.displayName = 'OrbitBackground';

export default OrbitBackground;
