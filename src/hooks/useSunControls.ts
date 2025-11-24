import { useState, useCallback } from 'react';

export interface SunAngles {
  altitude: number;  // β - Ángulo de altura solar (-90° a 90°, 0° = mediodía)
  azimuth: number;   // γ - Ángulo de azimut solar (-90° a 90°)
                     // 0° = Mediodía, -90° = Amanecer, 90° = Atardecer
}

export const useSunControls = (initialAltitude: number = 0, initialAzimuth: number = 0) => {
  const [angles, setAngles] = useState<SunAngles>({
    altitude: initialAltitude,
    azimuth: initialAzimuth
  });

  const setAltitude = useCallback((value: number) => {
    setAngles(prev => ({
      ...prev,
      altitude: Math.max(-90, Math.min(90, value))
    }));
  }, []);

  const setAzimuth = useCallback((value: number) => {
    setAngles(prev => ({
      ...prev,
      azimuth: Math.max(-90, Math.min(90, value))
    }));
  }, []);

  const setAnglesDirectly = useCallback((altitude: number, azimuth: number) => {
    setAngles({
      altitude: Math.max(-90, Math.min(90, altitude)),
      azimuth: Math.max(-90, Math.min(90, azimuth))
    });
  }, []);

  return {
    angles,
    setAltitude,
    setAzimuth,
    setAnglesDirectly
  };
};
