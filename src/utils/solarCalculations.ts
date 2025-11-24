/**
 * Cálculos relacionados con la geometría solar
 */

/**
 * Calcula el ángulo cenital del sol
 * El ángulo cenital (θz) es el ángulo entre la vertical (cenit) y la dirección del sol
 * 
 * Fórmula: θz = 90° - β
 * 
 * @param altitude - Ángulo de altura solar (β) en grados
 *                   -90° = Horizonte Este
 *                   0° = Cenit (Mediodía, sol en lo más alto)
 *                   90° = Horizonte Oeste
 * @returns Ángulo cenital (θz) en grados
 *          0° = Sol en el cenit (directamente arriba)
 *          90° = Sol en el horizonte
 *          >90° = Sol bajo el horizonte (noche)
 */
export const calculateZenithAngle = (altitude: number): number => {
  // θz = 90° - β
  // Cuando β = 0° (mediodía), θz = 90° - 0° = 90°
  // Cuando β = 45° (sol a 45° del horizonte), θz = 45°
  // Cuando β = -90° (horizonte este), θz = 180°
  
  return 90 - altitude;
};

/**
 * Calcula el ángulo de incidencia sobre una superficie horizontal
 * Este es igual al ángulo cenital para una superficie horizontal
 * 
 * @param altitude - Ángulo de altura solar (β) en grados
 * @returns Ángulo de incidencia en grados
 */
export const calculateIncidenceAngle = (altitude: number): number => {
  return calculateZenithAngle(altitude);
};

/**
 * Convierte grados a radianes
 */
export const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Convierte radianes a grados
 */
export const radiansToDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

/**
 * Calcula la altura solar a partir del ángulo cenital
 * 
 * @param zenithAngle - Ángulo cenital (θz) en grados
 * @returns Altura solar (β) en grados
 */
export const zenithAngleToAltitude = (zenithAngle: number): number => {
  return 90 - zenithAngle;
};
