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

/**
 * Calcula la declinación solar (δ) para un día del año
 * 
 * @param n - Día del año (1-365)
 * @returns Declinación en radianes
 */
export const calculateDeclination = (n: number): number => {
  const factorAnguloRad = degreesToRadians((360 / 365.25) * (n - 173));
  const deltaRad = degreesToRadians(23.45) * Math.cos(factorAnguloRad);
  return deltaRad;
};

/**
 * Calcula el ángulo horario del amanecer/atardecer (h_s)
 * 
 * @param latitudRad - Latitud en radianes
 * @param deltaRad - Declinación solar en radianes
 * @returns Ángulo horario en radianes, o null si no hay amanecer/atardecer
 */
export const calculateSunriseHourAngle = (latitudRad: number, deltaRad: number): number | null => {
  const cosHs = -Math.tan(deltaRad) * Math.tan(latitudRad);
  
  if (cosHs > 1.0 || cosHs < -1.0) {
    return null; // Sol nunca sale o nunca se pone
  }
  
  return Math.acos(cosHs);
};

/**
 * Convierte ángulo horario en grados a formato HH:MM
 * 
 * @param hGrados - Ángulo horario en grados
 * @returns Hora en formato "HH:MM"
 */
export const hourAngleToTime = (hGrados: number): string => {
  const horaDecimal = 12.0 + (hGrados / 15.0);
  const horas = Math.floor(horaDecimal);
  const minutos = Math.floor((horaDecimal * 60) % 60);
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
};

/**
 * Información sobre el amanecer, atardecer y asoleamiento para un día específico
 */
export interface SunriseSunsetInfo {
  latitud: number;
  n: number;
  declinacion: number; // en grados
  anguloAmanecer: number; // en grados
  horaAmanecer: string;
  horaAtardecer: string;
  tiempoAsoleamiento: number; // en horas
}

/**
 * Calcula la información de amanecer, atardecer y asoleamiento
 * 
 * @param date - Fecha para calcular
 * @param latitudGrados - Latitud en grados
 * @returns Información de amanecer/atardecer, o null si no hay
 */
export const calculateSunriseSunset = (date: Date, latitudGrados: number): SunriseSunsetInfo | null => {
  // Calcular día del año (n)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const n = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
  // Convertir latitud a radianes
  const latitudRad = degreesToRadians(latitudGrados);
  
  // Calcular declinación
  const deltaRad = calculateDeclination(n);
  
  // Calcular ángulo de amanecer
  const hsRad = calculateSunriseHourAngle(latitudRad, deltaRad);
  
  if (hsRad === null) {
    return null; // Sol nunca sale o nunca se pone
  }
  
  const hsGrados = radiansToDegrees(hsRad);
  const amanecerH = -hsGrados;
  const atardecerH = hsGrados;
  
  return {
    latitud: latitudGrados,
    n: n,
    declinacion: radiansToDegrees(deltaRad),
    anguloAmanecer: hsGrados,
    horaAmanecer: hourAngleToTime(amanecerH),
    horaAtardecer: hourAngleToTime(atardecerH),
    tiempoAsoleamiento: (hsGrados * 2) / 15.0
  };
};
