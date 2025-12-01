import { useState, useCallback } from 'react';
import { calculateZenithAngle } from '../utils/solarCalculations';

export interface SunAngles {
  altitude: number;  // β - Ángulo de altura solar (-90° a 90°, 0° = mediodía)
  azimuth: number;   // γ - Ángulo de azimut solar (-90° a 90°)
                     // 0° = Mediodía, -90° = Amanecer, 90° = Atardecer
  zenith: number;    // θz - Ángulo cenital (calculado automáticamente)
}

export const useSunControls = (initialAltitude: number = 0, initialAzimuth: number = 0) => {
  const [angles, setAngles] = useState<SunAngles>({
    altitude: initialAltitude,
    azimuth: initialAzimuth,
    zenith: calculateZenithAngle(initialAltitude)
  });

  const setAltitude = useCallback((value: number) => {
    const clampedAltitude = Math.max(-90, Math.min(90, value));
    setAngles(prev => ({
      ...prev,
      altitude: clampedAltitude,
      zenith: calculateZenithAngle(clampedAltitude)
    }));
  }, []);

  const setAzimuth = useCallback((value: number) => {
    setAngles(prev => ({
      ...prev,
      azimuth: Math.max(-90, Math.min(90, value))
    }));
  }, []);

  const setAnglesDirectly = useCallback((altitude: number, azimuth: number) => {
    const clampedAltitude = Math.max(-90, Math.min(90, altitude));
    setAngles({
      altitude: clampedAltitude,
      azimuth: Math.max(-90, Math.min(90, azimuth)),
      zenith: calculateZenithAngle(clampedAltitude)
    });
  }, []);

  return {
    angles,
    setAltitude,
    setAzimuth,
    setAnglesDirectly
  };
};
