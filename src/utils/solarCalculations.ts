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
 * Fórmula: δ = 23.45 * cos(0.985647 * (N - 173))
 * 
 * @param n - Día del año (1-365)
 * @returns Declinación en radianes
 */
export const calculateDeclination = (n: number): number => {
  // 0.985647 es aproximadamente 360/365.2422
  const factorAnguloRad = degreesToRadians(0.985647 * (n - 173));
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
  
  // Crear conjunto de ángulos horarios que incluye obligatoriamente el mediodía (h=0°)
  const angulosHorarios = new Set<number>();
  
  // Agregar el mediodía (12:00, h=0°) obligatoriamente
  angulosHorarios.add(0);
  
  // Generar puntos uniformes
  const pasoH = (atardecerH - amanecerH) / (numPuntos - 1);
  for (let i = 0; i < numPuntos; i++) {
    const hGrados = amanecerH + (i * pasoH);
    angulosHorarios.add(hGrados);
  }
  
  // Convertir a array y ordenar
  const angulosOrdenados = Array.from(angulosHorarios).sort((a, b) => a - b);
  
  const puntos: SolarTrajectoryPoint[] = [];
  
  for (let i = 0; i < angulosOrdenados.length; i++) {
    const hGrados = angulosOrdenados[i];
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

/**
 * Calcula el azimut sol-pared (ψ)
 * Es la diferencia angular entre la dirección del sol y la orientación del panel/pared
 * 
 * @param solarAzimuth - Azimut solar (γ) en grados (0°=N, 90°=E, 180°=S, 270°=W)
 * @param panelAzimuth - Azimut del panel/pared en grados (dirección hacia donde apunta la normal)
 * @returns Azimut sol-pared (ψ) en grados, normalizado a rango [-180, 180]
 */
export const calculateWallSolarAzimuth = (
  solarAzimuth: number,
  panelAzimuth: number
): number => {
  // ψ = γ_solar - γ_panel
  let diff = solarAzimuth - panelAzimuth;
  
  // Normalizar a rango [-180, 180]
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  
  return diff;
};

/**
 * Calcula el ángulo de incidencia solar (θ) sobre un panel inclinado
 * usando únicamente trigonometría esférica.
 * 
 * MÉTODO TRIGONOMÉTRICO PURO (sin vectores 3D):
 * 
 * Paso A: Calcular diferencia de azimut (alpha)
 *   alpha = gamma_solar - a_panel
 *   Normalizado al rango [-180°, 180°]
 * 
 * Paso B: Aplicar fórmula de proyección trigonométrica
 *   cos(θ) = cos(beta) * cos(alpha) * cos(phi) + sin(beta) * sin(phi)
 * 
 * Paso C: Obtener ángulo final
 *   θ = acos(cos(θ))
 * 
 * @param beta - Altura Solar (β) en grados (0°=horizonte, 90°=cenit)
 * @param gamma - Azimut Solar (γ) en grados (0°=N, 90°=E, 180°=S, 270°=W)
 * @param phi - Inclinación del Panel en grados (0°=horizontal, 90°=vertical)
 * @param a_panel - Azimut del Panel en grados (dirección hacia donde apunta)
 * @returns Ángulo de incidencia (θ) en grados (0°=perpendicular, 90°=rasante)
 */
export const calculateIncidenceAngleOnPanel = (
  beta: number,
  gamma: number,
  phi: number,
  a_panel: number
): number => {
  // Paso A: Calcular diferencia de azimut (alpha)
  let alpha = gamma - a_panel;
  
  // Normalizar alpha al rango [-180, 180]
  while (alpha > 180) alpha -= 360;
  while (alpha < -180) alpha += 360;
  
  // Convertir todos los ángulos a radianes
  const betaRad = degreesToRadians(beta);
  const alphaRad = degreesToRadians(alpha);
  const phiRad = degreesToRadians(phi);
  
  // Paso B: Aplicar fórmula de proyección trigonométrica
  const cosTheta = 
    (Math.cos(betaRad) * Math.cos(alphaRad) * Math.cos(phiRad)) + 
    (Math.sin(betaRad) * Math.sin(phiRad));
  
  // Limitar el valor entre -1 y 1 para evitar errores numéricos
  const cosLimited = Math.max(-1, Math.min(1, cosTheta));
  
  // Paso C: Obtener el ángulo final en radianes y convertir a grados
  const thetaRad = Math.acos(cosLimited);
  const thetaDeg = radiansToDegrees(thetaRad);
  
  return thetaDeg;
};

/**
 * Calcula la eficiencia del panel solar basada en el ángulo de incidencia
 * 
 * @param incidenceAngle - Ángulo de incidencia (θ) en grados
 * @returns Eficiencia en porcentaje (0-100)
 */
export const calculatePanelEfficiency = (incidenceAngle: number): number => {
  // Si el ángulo es mayor a 90°, el sol está detrás del panel
  if (incidenceAngle > 90) {
    return 0;
  }
  
  // Eficiencia = cos(θ) * 100
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const efficiency = Math.cos(toRad(incidenceAngle)) * 100;
  
  return Math.max(0, efficiency);
};

// ==========================================
// Nuevas fórmulas solicitadas
// ==========================================

/**
 * Constante solar (Isc) en W/m²
 */
export const SOLAR_CONSTANT = 1367;

/**
 * Calcula el factor de corrección de la distancia tierra-sol (r)
 * 
 * @param n - Día del año (1-365)
 * @returns Factor de corrección (adimensional)
 */
export const calculateEarthSunDistanceCorrection = (n: number): number => {
  // Fórmula aproximada: r = 1 + 0.033 * cos(360 * n / 365)
  // Nota: El argumento del coseno debe estar en grados o convertirse a radianes
  const angleRad = degreesToRadians((360 * n) / 365);
  return 1 + 0.033 * Math.cos(angleRad);
};

/**
 * Calcula la Masa de Aire (AM) usando la fórmula de Kasten & Young (1989)
 * 
 * AM representa cuántas "atmósferas" atraviesa la luz.
 * AM = 1 en el cenit (vertical).
 * AM > 1 conforme el sol baja.
 * 
 * @param zenithAngle - Ángulo cenital en grados
 * @returns Masa de Aire (AM)
 */
export const calculateAirMass = (zenithAngle: number): number => {
  // Limitar z para evitar singularidad en el horizonte (90°)
  const z = Math.min(89.9, Math.max(0, zenithAngle));
  const zRad = degreesToRadians(z);
  
  // Fórmula Kasten & Young (1989)
  return 1 / (Math.cos(zRad) + 0.50572 * Math.pow(96.07995 - z, -1.6364));
};

/**
 * Calcula la radiación incidente considerando atenuación atmosférica
 * 
 * Modelo: Meinel & Meinel (1976)
 * I_incident = I_DNI * cos(θ)
 * I_DNI = I_sc * r * 0.7^(AM^0.678)
 * 
 * @param n - Día del año
 * @param incidenceAngle - Ángulo de incidencia (θ) en grados
 * @param solarAltitude - Altura solar (β) en grados (necesaria para AM)
 * @returns Radiación incidente en W/m²
 */
export const calculateIncidentRadiation = (n: number, incidenceAngle: number, solarAltitude: number): number => {
  // Si el sol está bajo el horizonte, no hay radiación directa
  if (solarAltitude <= 0) return 0;

  const r = calculateEarthSunDistanceCorrection(n);
  const thetaRad = degreesToRadians(incidenceAngle);
  
  // Si el sol está detrás del panel, la radiación directa es 0
  if (incidenceAngle > 90) return 0;
  
  // Calcular Masa de Aire (AM)
  const zenithAngle = 90 - solarAltitude;
  const am = calculateAirMass(zenithAngle);
  
  // Calcular atenuación atmosférica (Modelo Meinel & Meinel)
  // 0.7 es un coeficiente de transmisión típico para cielo claro
  const transmission = Math.pow(0.7, Math.pow(am, 0.678));
  
  // Radiación Normal Directa (DNI) estimada
  const dni = SOLAR_CONSTANT * r * transmission;
  
  return dni * Math.cos(thetaRad);
};

/**
 * Calcula el calor útil por unidad de área (q)
 * 
 * q = τ * α * I - UL * (Tc - Ta)
 * 
 * @param tau - Transmisividad de la cubierta
 * @param alpha - Absortividad de la placa
 * @param I - Irradiancia incidente (W/m²)
 * @param UL - Coeficiente global de pérdidas (W/m²·°C)
 * @param Tc - Temperatura del colector (°C)
 * @param Ta - Temperatura ambiente (°C)
 * @returns Calor útil (W/m²)
 */
export const calculateUsefulHeat = (
  tau: number, 
  alpha: number, 
  I: number, 
  UL: number, 
  Tc: number, 
  Ta: number
): number => {
  return (tau * alpha * I) - (UL * (Tc - Ta));
};

/**
 * Calcula la eficiencia instantánea (η)
 * 
 * η = τ * α - (UL * (Tc - Ta)) / I
 * 
 * @param tau - Transmisividad
 * @param alpha - Absortividad
 * @param UL - Coeficiente de pérdidas
 * @param Tc - Temperatura del colector
 * @param Ta - Temperatura ambiente
 * @param I - Irradiancia incidente
 * @returns Eficiencia (0-1, puede ser negativa si las pérdidas superan la ganancia)
 */
export const calculateInstantaneousEfficiency = (
  tau: number, 
  alpha: number, 
  UL: number, 
  Tc: number, 
  Ta: number, 
  I: number
): number => {
  if (I === 0) return 0;
  return (tau * alpha) - ((UL * (Tc - Ta)) / I);
};

/**
 * Calcula la temperatura de trabajo del panel (Tt)
 * 
 * Tt = Ta + k * R
 * 
 * @param Ta - Temperatura ambiente (°C)
 * @param k - Coeficiente de viento (0.02 - 0.04)
 * @param R - Radiación incidente (W/m²)
 * @returns Temperatura de trabajo (°C)
 */
export const calculatePanelTemperature = (Ta: number, k: number, R: number): number => {
  return Ta + (k * R);
};

/**
 * Calcula la potencia de salida con degradación térmica (Pt)
 * 
 * Pt = Pp - (Pp * deltaDeg * DeltaT)
 * 
 * @param Pp - Potencia pico (W)
 * @param deltaDeg - Coeficiente de degradación por temperatura (ej. 0.004 para 0.4%/°C)
 * @param deltaT - Incremento de temperatura sobre STC (Tt - 25°C)
 * @returns Potencia real de salida (W)
 */
export const calculatePowerOutput = (Pp: number, deltaDeg: number, deltaT: number): number => {
  return Pp - (Pp * deltaDeg * deltaT);
};

/**
 * Calcula la longitud de la sombra (Is)
 * 
 * Is = H / tan(β)
 * 
 * @param H - Altura del objeto
 * @param solarAltitude - Altura solar (β) en grados
 * @returns Longitud de la sombra
 */
export const calculateShadowLength = (H: number, solarAltitude: number): number => {
  if (solarAltitude <= 0) return Infinity; // Sol en horizonte o abajo
  const betaRad = degreesToRadians(solarAltitude);
  return H / Math.tan(betaRad);
};

/**
 * Calcula el espaciamiento mínimo entre filas (e)
 * 
 * e = (l * sin(s) + h1) / tan(β) - h2 / tan(β) + l * cos(s)
 * Simplificado si h1=h2=0 (montaje en suelo plano): e = l * sin(s) / tan(β) + l * cos(s)
 * 
 * @param l - Longitud del panel (altura inclinada)
 * @param s - Inclinación del panel (grados)
 * @param beta - Altura solar crítica (β) en grados (usualmente solsticio de invierno al mediodía o 10am/2pm)
 * @param h1 - Altura de montaje superior (opcional, default 0 relativo)
 * @param h2 - Altura de montaje inferior (opcional, default 0 relativo)
 * @returns Espaciamiento entre filas
 */
export const calculateRowSpacing = (
  l: number, 
  s: number, 
  beta: number, 
  h1: number = 0, 
  h2: number = 0
): number => {
  if (beta <= 0) return Infinity;
  
  const sRad = degreesToRadians(s);
  const betaRad = degreesToRadians(beta);
  const tanBeta = Math.tan(betaRad);
  
  // e = (l * sin s + h1) / tan beta - h2 / tan beta + l * cos s
  // Agrupando términos con tan beta: (l * sin s + h1 - h2) / tan beta + l * cos s
  
  const term1 = (l * Math.sin(sRad) + h1 - h2) / tanBeta;
  const term2 = l * Math.cos(sRad);
  
  return term1 + term2;
};
