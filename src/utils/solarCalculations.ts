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

/**
 * Punto de la trayectoria solar
 */
export interface SolarTrajectoryPoint {
  numero: number;
  horaSolar: string;
  anguloHorario: number; // en grados
  altura: number; // β en grados
  azimut: number; // γ en grados (N=0°)
}

/**
 * Limita un valor entre -1.0 y 1.0
 */
const clamp = (valor: number, minVal: number = -1.0, maxVal: number = 1.0): number => {
  return Math.max(minVal, Math.min(valor, maxVal));
};

/**
 * Calcula la altura solar (β) para un ángulo horario dado
 */
const calculateAltitude = (hRad: number, deltaRad: number, latitudRad: number): number => {
  const sinBeta = (Math.cos(deltaRad) * Math.cos(latitudRad) * Math.cos(hRad)) +
                  (Math.sin(deltaRad) * Math.sin(latitudRad));
  return Math.asin(clamp(sinBeta));
};

/**
 * Calcula el azimut solar (γ) con N=0°
 */
const calculateAzimuth = (hRad: number, betaRad: number, deltaRad: number, latitudRad: number): number => {
  const cosBeta = Math.cos(betaRad);
  
  if (Math.abs(cosBeta) < 1e-6) {
    if (betaRad > 0) {
      return deltaRad > latitudRad ? 0.0 : 180.0;
    } else {
      return hRad < 0 ? 90.0 : 270.0;
    }
  }
  
  const numerador = (Math.sin(deltaRad) * Math.cos(latitudRad)) -
                    (Math.cos(deltaRad) * Math.sin(latitudRad) * Math.cos(hRad));
  
  const cosGamma = clamp(numerador / cosBeta);
  const gammaRad = Math.acos(cosGamma);
  
  if (hRad > 0) {
    return radiansToDegrees(2 * Math.PI - gammaRad);
  } else {
    return radiansToDegrees(gammaRad);
  }
};

/**
 * Genera la trayectoria solar completa para un día
 * 
 * @param date - Fecha para calcular
 * @param latitudGrados - Latitud en grados
 * @param numPuntos - Número de puntos a generar (default: 32)
 * @returns Array de puntos de la trayectoria, o null si no hay
 */
export const generateSolarTrajectory = (
  date: Date, 
  latitudGrados: number, 
  numPuntos: number = 32
): SolarTrajectoryPoint[] | null => {
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
  const pasoH = (atardecerH - amanecerH) / (numPuntos - 1);
  
  const puntos: SolarTrajectoryPoint[] = [];
  
  for (let i = 0; i < numPuntos; i++) {
    const hGrados = amanecerH + (i * pasoH);
    const hRad = degreesToRadians(hGrados);
    
    const betaRad = calculateAltitude(hRad, deltaRad, latitudRad);
    const betaGrados = radiansToDegrees(betaRad);
    
    const gammaGrados = calculateAzimuth(hRad, betaRad, deltaRad, latitudRad);
    const horaSolar = hourAngleToTime(hGrados);
    
    puntos.push({
      numero: i + 1,
      horaSolar: horaSolar,
      anguloHorario: hGrados,
      altura: betaGrados,
      azimut: gammaGrados
    });
  }
  
  return puntos;
};
