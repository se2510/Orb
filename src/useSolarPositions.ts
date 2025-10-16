import { useState } from 'react';

export function useSolarPositions() {
  const [sun, setSun] = useState({ x: -10, y: 0, z: 0 });
  const [earth, setEarth] = useState({ x: 0, y: 0, z: 0 });
  const [moon, setMoon] = useState({ x: 4, y: 0, z: 0 });

  return {
    sun, setSun,
    earth, setEarth,
    moon, setMoon,
  };
}
