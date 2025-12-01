import { useState, useCallback } from 'react';

export interface PanelAngles {
  inclination: number;  // φ (Phi) - Ángulo de inclinación (0° = horizontal, 90° = vertical)
  azimuth: number;      // A_panel - Azimut del panel (0° = Sur, 90° = Oeste, -90° = Este)
}

/**
 * Hook para controlar la orientación del panel solar
 * @param initialInclination - Inclinación inicial en grados (por defecto 30°)
 * @param initialAzimuth - Azimut inicial en grados (por defecto 0° = Sur)
 */
export const usePanelControls = (
  initialInclination: number = 30,
  initialAzimuth: number = 0
) => {
  const [angles, setAngles] = useState<PanelAngles>({
    inclination: initialInclination,
    azimuth: initialAzimuth
  });

  const setInclination = useCallback((value: number) => {
    // Limitar inclinación entre 0° y 90°
    const clampedInclination = Math.max(0, Math.min(90, value));
    setAngles(prev => ({
      ...prev,
      inclination: clampedInclination
    }));
  }, []);

  const setAzimuth = useCallback((value: number) => {
    // Limitar azimut entre -180° y 180°
    const clampedAzimuth = Math.max(-180, Math.min(180, value));
    setAngles(prev => ({
      ...prev,
      azimuth: clampedAzimuth
    }));
  }, []);

  const setAnglesDirectly = useCallback((inclination: number, azimuth: number) => {
    setAngles({
      inclination: Math.max(0, Math.min(90, inclination)),
      azimuth: Math.max(-180, Math.min(180, azimuth))
    });
  }, []);

  return {
    angles,
    setInclination,
    setAzimuth,
    setAnglesDirectly
  };
};
