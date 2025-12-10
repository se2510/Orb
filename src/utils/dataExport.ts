/**
 * Utilidades para exportar datos de la trayectoria solar
 */

import type { SolarTrajectoryPoint } from './solarCalculations';

/**
 * Calcula el ángulo azimut sol-pared (ψ)
 */
const calculateWallSolarAzimuth = (solarAzimuth: number, panelAzimuth: number): number => {
  let diff = solarAzimuth - panelAzimuth;
  
  // Normalizar a rango [-180, 180]
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  
  return diff;
};

/**
 * Calcula el ángulo de incidencia (θ)
 */
const calculateIncidenceAngle = (
  altitudSolar: number,
  panelInclination: number,
  azimuthDifference: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  
  const beta = toRad(altitudSolar);
  const alpha = toRad(panelInclination);
  const deltaGamma = toRad(azimuthDifference);
  
  const cosTheta = 
    Math.sin(beta) * Math.cos(alpha) + 
    Math.cos(beta) * Math.sin(alpha) * Math.cos(deltaGamma);
  
  const cosLimited = Math.max(-1, Math.min(1, cosTheta));
  const theta = Math.acos(cosLimited);
  
  return toDeg(theta);
};

/**
 * Calcula la eficiencia del panel (%)
 */
const calculateEfficiency = (incidenceAngle: number): number => {
  if (incidenceAngle > 90) return 0;
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const efficiency = Math.cos(toRad(incidenceAngle)) * 100;
  
  return Math.max(0, efficiency);
};

export interface CalculatedSolarData {
  horaSolar: string;
  anguloIncidencia: number;
  eficiencia: number;
  radiacion: number;
  temperaturaPanel: number;
  potenciaSalida: number;
}

export interface ExportData {
  trajectory: SolarTrajectoryPoint[];
  calculatedData?: CalculatedSolarData[]; // Datos calculados avanzados
  panelInclination: number;
  wallSolarAzimuth: number;
  locationName?: string;
  date?: Date;
  latitude?: number;
  longitude?: number;
}

/**
 * Genera contenido CSV con todos los datos de la trayectoria solar
 */
export const generateCSV = (data: ExportData): string => {
  const { trajectory, calculatedData, panelInclination, wallSolarAzimuth, locationName, date, latitude, longitude } = data;
  
  // Encabezados del CSV
  let csv = '';
  
  // Metadata
  csv += `Exportación de Trayectoria Solar\n`;
  if (locationName) csv += `Ubicación,${locationName}\n`;
  if (latitude !== undefined && longitude !== undefined) {
    csv += `Coordenadas,"Lat: ${latitude.toFixed(6)}°, Lng: ${longitude.toFixed(6)}°"\n`;
  }
  if (date) csv += `Fecha,${date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  csv += `Inclinación del Panel,${panelInclination}°\n`;
  csv += `Azimut del Panel,${wallSolarAzimuth}°\n`;
  csv += `Total de Puntos,${trajectory.length}\n`;
  csv += `\n`;
  
  // Encabezados de columnas
  csv += `#,Hora Solar,Ángulo Horario (°),Altura Solar β (°),Azimut Solar γ (°),Azimut Sol-Pared ψ (°),Ángulo de Incidencia θ (°),Eficiencia geométrica de captación (η) (%),Radiación Incidente (W/m²),Temp. Panel (°C),Potencia Salida (W)\n`;
  
  // Datos
  trajectory.forEach((point, index) => {
    const psi = calculateWallSolarAzimuth(point.azimut, wallSolarAzimuth);
    
    // Usar datos pre-calculados si existen, de lo contrario calcular básicos al vuelo
    let theta, efficiency, radiation, temp, power;
    
    if (calculatedData && calculatedData[index]) {
      const d = calculatedData[index];
      theta = d.anguloIncidencia;
      efficiency = d.eficiencia;
      radiation = d.radiacion;
      temp = d.temperaturaPanel;
      power = d.potenciaSalida;
    } else {
      theta = calculateIncidenceAngle(point.altura, panelInclination, psi);
      efficiency = calculateEfficiency(theta);
      radiation = 0; // No disponible sin cálculo avanzado
      temp = 0;      // No disponible sin cálculo avanzado
      power = 0;     // No disponible sin cálculo avanzado
    }
    
    csv += `${point.numero},${point.horaSolar},${point.anguloHorario.toFixed(2)},${point.altura.toFixed(2)},${point.azimut.toFixed(2)},${psi.toFixed(2)},${theta.toFixed(2)},${efficiency.toFixed(2)},${radiation.toFixed(2)},${temp.toFixed(2)},${power.toFixed(2)}\n`;
  });
  
  return csv;
};

/**
 * Descarga el CSV generado
 */
export const downloadCSV = (csvContent: string, filename: string = 'trayectoria_solar.csv'): void => {
  // Agregar BOM para UTF-8 (ayuda con acentos en Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Exporta los datos de trayectoria solar a CSV
 */
export const exportToCSV = (data: ExportData): void => {
  const csv = generateCSV(data);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `trayectoria_solar_${timestamp}.csv`;
  downloadCSV(csv, filename);
};
