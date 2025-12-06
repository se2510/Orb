import React, { useState, useMemo, memo, useCallback } from 'react';
import { 
  type SolarTrajectoryPoint,
  calculateIncidenceAngleOnPanel,
  calculateIncidentRadiation,
  calculatePanelTemperature,
  calculatePowerOutput
} from '../utils/solarCalculations';
import { exportToCSV, type ExportData } from '../utils/dataExport';
import { generatePDFReport } from '../utils/pdfExport';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

// Constantes para el modelo térmico (valores típicos)
const DEFAULT_PARAMS = {
  Ta: 25, // Temperatura ambiente (°C)
  k: 0.03, // Coeficiente de viento
  Pp: 300, // Potencia pico del panel (W)
  deltaDeg: 0.004, // Coeficiente de degradación (0.4%/°C)
  tauAlpha: 0.9, // Producto transmisividad-absortividad
  UL: 4.0 // Coeficiente de pérdidas
};

interface SolarDataPanelProps {
  trajectory: SolarTrajectoryPoint[] | null;
  isFinished: boolean;
  panelInclination?: number; // Inclinación del panel en grados
  wallSolarAzimuth?: number; // Ángulo azimut solar-pared (ψ) en grados
  isOpen?: boolean; // Estado de apertura controlado externamente
  onOpenChange?: (isOpen: boolean) => void; // Callback para notificar cambio de estado
  locationName?: string; // Nombre de la ubicación (opcional, para exportación)
  date?: Date; // Fecha de la simulación (opcional, para exportación)
  latitude?: number; // Latitud (opcional, para exportación)
  longitude?: number; // Longitud (opcional, para exportación)
  highlightTrigger?: boolean; // Si el botón de apertura debe brillar
}

const panelContainerStyle = (isOpen: boolean): React.CSSProperties => ({
  position: 'fixed',
  top: 0,
  right: isOpen ? 0 : '-100%',
  width: '100%',
  maxWidth: '900px',
  height: '100%',
  background: 'rgba(15, 23, 42, 0.95)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  transition: 'right 0.3s ease',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: isOpen ? '-4px 0 20px rgba(0, 0, 0, 0.5)' : 'none'
});

const toggleButtonStyle = (isOpen: boolean, highlight: boolean = false): React.CSSProperties => ({
  position: 'fixed',
  top: '50%',
  right: isOpen ? '900px' : '0',
  transform: 'translateY(-50%)',
  background: highlight ? 'rgba(251, 191, 36, 0.9)' : 'rgba(15, 23, 42, 0.95)',
  color: 'white',
  border: highlight ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
  borderRight: 'none',
  padding: '20px 12px',
  cursor: 'pointer',
  borderRadius: '8px 0 0 8px',
  fontSize: '20px',
  transition: 'all 0.3s ease',
  zIndex: 1002,
  boxShadow: highlight ? '0 0 20px rgba(251, 191, 36, 0.6)' : '-2px 0 10px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  animation: highlight ? 'pulse-glow 2s infinite' : 'none'
});

const headerStyle: React.CSSProperties = {
  padding: '25px 20px',
  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
  flexShrink: 0
};

const contentContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '20px'
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '20px'
};

const tabStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '12px 24px',
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
  color: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.6)',
  fontWeight: isActive ? 'bold' : 'normal',
  fontSize: '14px',
  transition: 'all 0.3s ease'
});


const tableContainerStyle: React.CSSProperties = {
  overflowY: 'auto',
  overflowX: 'hidden'
};

const chartContainerStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  padding: '15px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '20px',
  minHeight: '350px'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px'
};

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
  background: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(10px)',
  fontWeight: 'bold',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  fontSize: '12px'
};

const tdStyle: React.CSSProperties = {
  padding: '10px 8px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
};

const SolarDataPanel: React.FC<SolarDataPanelProps> = memo((props) => {
  const {
    trajectory,
    panelInclination = 30,
    wallSolarAzimuth = 0,
    isOpen: externalIsOpen,
    onOpenChange,
    locationName,
    date,
    latitude,
    longitude,
    highlightTrigger = false
  } = props;

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'trajectory' | 'efficiency' | 'energy' | 'financial'>('trajectory');
  const [electricityPrice, setElectricityPrice] = useState(0.15); // USD/kWh
  const [systemCost, setSystemCost] = useState(500); // USD (Costo estimado por panel + instalación)
  
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const togglePanel = () => {
    const newState = !isOpen;
    if (externalIsOpen === undefined) {
      setInternalIsOpen(newState);
    }
    if (onOpenChange) {
      onOpenChange(newState);
    }
  };

  const handleExport = useCallback(() => {
    if (!trajectory || trajectory.length === 0) return;

    const exportData: ExportData = {
      trajectory,
      panelInclination,
      wallSolarAzimuth,
      locationName,
      date,
      latitude,
      longitude
    };

    exportToCSV(exportData);
  }, [trajectory, panelInclination, wallSolarAzimuth, locationName, date, latitude, longitude]);  // Calcular datos de incidencia y eficiencia
  const incidenceData = useMemo(() => {
    if (!trajectory) return null;
    
    // Obtener el día del año (n) para cálculos de radiación
    const n = date ? Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24) : 1;

    return trajectory.map(point => {
      // El azimut del panel es wallSolarAzimuth (orientación del edificio)
      // Necesitamos calcular la diferencia entre el azimut solar y el azimut del panel
      // ψ = γ_solar - γ_panel
      let azimuthDifference = point.azimut - wallSolarAzimuth;
      // Normalizar a [-180, 180]
      while (azimuthDifference > 180) azimuthDifference -= 360;
      while (azimuthDifference < -180) azimuthDifference += 360;
      
      const incidenceAngle = calculateIncidenceAngleOnPanel(
        point.altura,
        panelInclination,
        azimuthDifference
      );
      
      // Calcular radiación incidente (I0) con modelo atmosférico
      // Pasamos point.altura (Altitud Solar) para calcular la Masa de Aire
      const incidentRadiation = calculateIncidentRadiation(n, incidenceAngle, point.altura);
      
      // Calcular temperatura del panel (Tt)
      const panelTemp = calculatePanelTemperature(DEFAULT_PARAMS.Ta, DEFAULT_PARAMS.k, incidentRadiation);
      
      // Calcular potencia de salida (Pt)
      const deltaT = Math.max(0, panelTemp - 25); // Incremento sobre STC (25°C)
      const powerOutput = calculatePowerOutput(DEFAULT_PARAMS.Pp, DEFAULT_PARAMS.deltaDeg, deltaT);
      
      // Eficiencia geométrica simple (cos θ)
      const efficiency = Math.max(0, Math.cos(incidenceAngle * Math.PI / 180) * 100);
      
      return {
        horaSolar: point.horaSolar,
        anguloIncidencia: incidenceAngle,
        eficiencia: efficiency,
        radiacion: incidentRadiation,
        temperaturaPanel: panelTemp,
        potenciaSalida: Math.max(0, powerOutput * (incidentRadiation / 1000)) // Ajustar por irradiancia (aprox lineal)
        // Nota: La fórmula de Pt del usuario es Pt = Pp - (Pp * deg * dT). 
        // Esto es la potencia CAPAZ de entregar si la irradiancia fuera 1000 W/m2 pero con temperatura alta?
        // Usualmente P = P_stc * (I/I_stc) * (1 - deg * dT).
        // La fórmula del usuario es Pt = Pp - (Pp * deg * dT) = Pp * (1 - deg * dT).
        // Esto parece ser la potencia nominal ajustada por temperatura, pero falta multiplicar por la intensidad solar relativa.
        // Asumiré que Pt es la potencia ajustada por temperatura Y radiación.
        // Si la fórmula del usuario es literal, solo ajusta por temperatura. 
        // Pero para una simulación realista, si no hay sol, la potencia es 0.
        // Voy a usar: Pt_real = (incidentRadiation / 1000) * calculatePowerOutput(...)
      };
    });
  }, [trajectory, panelInclination, wallSolarAzimuth, date]);

  // Calcular resumen energético (Integración)
  const energySummary = useMemo(() => {
    if (!incidenceData || !trajectory || trajectory.length < 2) return null;

    // Calcular paso de tiempo en horas (dt)
    // Asumimos paso constante basado en la generación de trayectoria
    const h0 = trajectory[0].anguloHorario;
    const h1 = trajectory[1].anguloHorario;
    const deltaDegrees = Math.abs(h1 - h0);
    const deltaHours = deltaDegrees / 15.0; // 15 grados = 1 hora

    let totalWh = 0;
    let maxP = 0;
    let generationHours = 0;

    incidenceData.forEach(d => {
      // Integración rectangular: Energía = Potencia * dt
      totalWh += d.potenciaSalida * deltaHours;
      
      if (d.potenciaSalida > maxP) maxP = d.potenciaSalida;
      if (d.potenciaSalida > 0) generationHours += deltaHours;
    });

    return {
      totalKWh: totalWh / 1000,
      peakW: maxP,
      generationHours: generationHours
    };
  }, [incidenceData, trajectory]);

  // Configuración de la gráfica de eficiencia
  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: 'area',
      height: 300,
      width: '100%',
      background: 'transparent',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true
      }
    },
    theme: {
      mode: 'dark'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: incidenceData?.map(d => d.horaSolar) || [],
      tickAmount: 10,
      labels: {
        style: {
          colors: '#fff'
        },
        rotate: -45,
        rotateAlways: true
      },
      title: {
        text: 'Hora Solar',
        style: {
          color: '#fff'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Eficiencia (%)',
        style: {
          color: '#fff'
        }
      },
      labels: {
        style: {
          colors: '#fff'
        },
        formatter: (value) => value.toFixed(1)
      },
      min: 0,
      max: 100
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true
      },
      y: {
        formatter: (value) => `${value.toFixed(2)}%`
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    colors: ['#FFC107']
  }), [incidenceData]);

  const chartSeries = useMemo(() => [{
    name: 'Eficiencia',
    data: incidenceData?.map(d => d.eficiencia) || []
  }], [incidenceData]);

  const handlePDFExport = useCallback(() => {
    if (!trajectory || !energySummary || !incidenceData) return;

    // Calcular datos financieros actuales
    const dailySavings = energySummary.totalKWh * electricityPrice;
    const annualSavings = dailySavings * 365;
    const paybackYears = annualSavings > 0 ? systemCost / annualSavings : 0;

    // Preparar datos detallados de simulación
    const simulationData = trajectory.map((point, index) => {
      const data = incidenceData[index];
      return {
        horaSolar: point.horaSolar,
        altura: point.altura,
        azimut: point.azimut,
        radiacion: data.radiacion,
        temperatura: data.temperaturaPanel,
        potencia: data.potenciaSalida
      };
    });

    generatePDFReport({
      locationName: locationName || 'Ubicación Desconocida',
      date: date || new Date(),
      latitude: latitude || 0,
      longitude: longitude || 0,
      panelInclination,
      wallSolarAzimuth,
      simulationData,
      energy: energySummary,
      financial: {
        electricityPrice,
        systemCost,
        dailySavings,
        monthlySavings: dailySavings * 30,
        annualSavings,
        paybackYears
      }
    });
  }, [trajectory, energySummary, incidenceData, locationName, date, latitude, longitude, panelInclination, wallSolarAzimuth, electricityPrice, systemCost]);

  return (
    <>
      {/* Botón para abrir/cerrar el panel */}
      <button
        style={toggleButtonStyle(isOpen, highlightTrigger && !isOpen)}
        onClick={togglePanel}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = (highlightTrigger && !isOpen) ? 'rgba(251, 191, 36, 0.9)' : 'rgba(15, 23, 42, 0.95)';
        }}
      >
        {isOpen ? '›' : '‹'}
      </button>

      {/* Panel lateral */}
      <div style={panelContainerStyle(isOpen)}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                📊 Datos de Trayectoria Solar y Eficiencia del Panel
              </h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
                {trajectory ? `${trajectory.length} puntos calculados` : 'Sin datos'} | 
                Panel: α={panelInclination}°, ψ={wallSolarAzimuth}°
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handlePDFExport}
                disabled={!trajectory || trajectory.length === 0}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: trajectory && trajectory.length > 0 ? 'pointer' : 'not-allowed',
                  background: trajectory && trajectory.length > 0 
                    ? 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: trajectory && trajectory.length > 0 ? 1 : 0.5
                }}
                title="Exportar Reporte PDF"
              >
                <span>📄</span>
                <span className="hide-mobile">PDF</span>
              </button>

              <button
                onClick={handleExport}
                disabled={!trajectory || trajectory.length === 0}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: trajectory && trajectory.length > 0 ? 'pointer' : 'not-allowed',
                  background: trajectory && trajectory.length > 0 
                    ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: trajectory && trajectory.length > 0 ? 1 : 0.5
                }}
                title="Exportar a CSV"
              >
                <span>💾</span>
                <span className="hide-mobile">Exportar</span>
              </button>

              <button
                onClick={togglePanel}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                title="Cerrar panel"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div style={contentContainerStyle}>
          {trajectory && trajectory.length > 0 ? (
            <>
              {/* Sección Superior: Gráfica y Explicación */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                  {/* Explicación de Eficiencia */}
                  <div style={{
                    flex: '1 1 300px',
                    padding: '15px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '8px' }}>💡 ¿Qué es la eficiencia?</strong>
                    <p style={{ margin: 0, color: '#e5e7eb' }}>
                      La eficiencia del panel solar depende del <strong>ángulo de incidencia (θ)</strong> entre 
                      los rayos solares y la superficie del panel. Se calcula como <strong>η = cos(θ) × 100%</strong>.
                      La máxima eficiencia (100%) ocurre cuando el sol está perpendicular al panel (θ = 0°).
                    </p>
                  </div>

                  {/* Gráfica de Eficiencia */}
                  <div style={{ ...chartContainerStyle, flex: '2 1 400px', margin: 0, minHeight: '300px' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600' }}>
                      Eficiencia del Panel durante el Día
                    </h4>
                    {incidenceData && incidenceData.length > 0 ? (
                      <ReactApexChart
                        options={chartOptions}
                        series={chartSeries}
                        type="area"
                        height={250}
                        width="100%"
                      />
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No hay datos para mostrar
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección Inferior: Tablas de Datos con Pestañas */}
              <div>
                <div style={tabContainerStyle}>
                  <button 
                    style={tabStyle(activeTab === 'trajectory')}
                    onClick={() => setActiveTab('trajectory')}
                  >
                    🌞 Trayectoria Solar
                  </button>
                  <button 
                    style={tabStyle(activeTab === 'efficiency')}
                    onClick={() => setActiveTab('efficiency')}
                  >
                    ⚡ Datos de Eficiencia
                  </button>
                  <button 
                    style={tabStyle(activeTab === 'energy')}
                    onClick={() => setActiveTab('energy')}
                  >
                    🔥 Modelo Térmico
                  </button>
                  <button 
                    style={tabStyle(activeTab === 'financial')}
                    onClick={() => setActiveTab('financial')}
                  >
                    💰 Finanzas
                  </button>
                </div>

                {activeTab === 'trajectory' && (
                  <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>#</th>
                          <th style={thStyle}>Hora Solar</th>
                          <th style={thStyle}>Ángulo Horario (°)</th>
                          <th style={thStyle}>Altura β (°)</th>
                          <th style={thStyle}>Azimut γ (°)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trajectory.map((point) => {
                          return (
                            <tr key={point.numero}>
                              <td style={tdStyle}>{point.numero}</td>
                              <td style={tdStyle}>{point.horaSolar}</td>
                              <td style={tdStyle}>{point.anguloHorario.toFixed(2)}</td>
                              <td style={tdStyle}>{point.altura.toFixed(2)}</td>
                              <td style={tdStyle}>{point.azimut.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'efficiency' && (
                  <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Hora Solar</th>
                          <th style={thStyle}>Ángulo Inc. θ (°)</th>
                          <th style={thStyle}>Eficiencia (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidenceData?.map((data, index) => {
                          const efficiencyColor = data.eficiencia > 80 ? '#4CAF50' :
                                                data.eficiencia > 50 ? '#FFC107' :
                                                data.eficiencia > 20 ? '#FF9800' : '#F44336';
                          
                          return (
                            <tr key={index}>
                              <td style={tdStyle}>{data.horaSolar}</td>
                              <td style={tdStyle}>{data.anguloIncidencia.toFixed(2)}</td>
                              <td style={{
                                ...tdStyle,
                                color: efficiencyColor,
                                fontWeight: 'bold'
                              }}>
                                {data.eficiencia.toFixed(2)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === 'energy' && (
                  <div style={tableContainerStyle}>
                    {/* Resumen Energético (KPIs) */}
                    {energySummary && (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                        gap: '15px',
                        marginBottom: '20px'
                      }}>
                        {/* Energía Total */}
                        <div style={{ 
                          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.2) 100%)', 
                          padding: '15px', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#81c784', marginBottom: '5px' }}>
                            Energía Diaria
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            {energySummary.totalKWh.toFixed(3)} 
                            <span style={{fontSize: '14px', opacity: 0.8, fontWeight: 'normal'}}>kWh</span>
                          </div>
                        </div>

                        {/* Potencia Pico */}
                        <div style={{ 
                          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.2) 100%)', 
                          padding: '15px', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255, 193, 7, 0.3)',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#ffd54f', marginBottom: '5px' }}>
                            Potencia Pico
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFC107', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            {energySummary.peakW.toFixed(1)} 
                            <span style={{fontSize: '14px', opacity: 0.8, fontWeight: 'normal'}}>W</span>
                          </div>
                        </div>

                        {/* Horas de Generación */}
                        <div style={{ 
                          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.2) 100%)', 
                          padding: '15px', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(33, 150, 243, 0.3)',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64b5f6', marginBottom: '5px' }}>
                            Horas Activas
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            {energySummary.generationHours.toFixed(1)} 
                            <span style={{fontSize: '14px', opacity: 0.8, fontWeight: 'normal'}}>h</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '10px', fontSize: '12px', color: '#aaa', marginBottom: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                      Parámetros estimados: Ta={DEFAULT_PARAMS.Ta}°C, Viento k={DEFAULT_PARAMS.k}, Pp={DEFAULT_PARAMS.Pp}W
                    </div>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Hora</th>
                          <th style={thStyle}>Rad. Incidente (W/m²)</th>
                          <th style={thStyle}>Temp. Panel (°C)</th>
                          <th style={thStyle}>Potencia (W)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidenceData?.map((data, index) => {
                          return (
                            <tr key={index}>
                              <td style={tdStyle}>{data.horaSolar}</td>
                              <td style={tdStyle}>{data.radiacion.toFixed(1)}</td>
                              <td style={tdStyle}>{data.temperaturaPanel.toFixed(1)}</td>
                              <td style={{
                                ...tdStyle,
                                color: '#4CAF50',
                                fontWeight: 'bold'
                              }}>
                                {data.potenciaSalida.toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === 'financial' && energySummary && (
                  <div style={tableContainerStyle}>
                    {/* Inputs de Configuración Financiera */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '15px', 
                      marginBottom: '20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '15px',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                          Precio Electricidad ($/kWh)
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={electricityPrice}
                          onChange={(e) => setElectricityPrice(parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                          Costo del Sistema ($)
                        </label>
                        <input 
                          type="number" 
                          step="10"
                          value={systemCost}
                          onChange={(e) => setSystemCost(parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>

                    {/* Resultados Financieros */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                      gap: '15px'
                    }}>
                      {/* Ahorro Diario */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.2) 100%)', 
                        padding: '15px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#81c784', marginBottom: '5px' }}>
                          Ahorro Diario
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                          ${(energySummary.totalKWh * electricityPrice).toFixed(2)}
                        </div>
                      </div>

                      {/* Proyección Mensual */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.2) 100%)', 
                        padding: '15px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(33, 150, 243, 0.3)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64b5f6', marginBottom: '5px' }}>
                          Mensual (30 días)
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                          ${(energySummary.totalKWh * electricityPrice * 30).toFixed(2)}
                        </div>
                      </div>

                      {/* Proyección Anual */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.2) 100%)', 
                        padding: '15px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(156, 39, 176, 0.3)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#ba68c8', marginBottom: '5px' }}>
                          Anual (365 días)
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                          ${(energySummary.totalKWh * electricityPrice * 365).toFixed(2)}
                        </div>
                      </div>

                      {/* Retorno de Inversión */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.2) 100%)', 
                        padding: '15px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255, 152, 0, 0.3)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#ffb74d', marginBottom: '5px' }}>
                          Retorno (Payback)
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {((systemCost) / (energySummary.totalKWh * electricityPrice * 365)).toFixed(1)}
                          <span style={{fontSize: '14px', opacity: 0.8, fontWeight: 'normal'}}>años</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '20px', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                      * Nota: Proyecciones basadas en la radiación del día seleccionado. El retorno real variará según la estacionalidad anual.
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              opacity: 0.6,
              fontSize: '14px',
              width: '100%'
            }}>
              No hay datos de trayectoria disponibles
            </div>
          )}
        </div>
      </div>
    </>
  );
});

SolarDataPanel.displayName = 'SolarDataPanel';

export default SolarDataPanel;
