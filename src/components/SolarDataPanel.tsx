import React, { useState, useMemo, memo, useCallback } from 'react';
import type { SolarTrajectoryPoint } from '../utils/solarCalculations';
import { exportToCSV, type ExportData } from '../utils/dataExport';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

interface SolarDataPanelProps {
  trajectory: SolarTrajectoryPoint[] | null;
  isFinished: boolean;
  panelInclination?: number; // Inclinación del panel en grados
  wallSolarAzimuth?: number; // Ángulo azimut solar-pared (ψ) en grados
  onOpenChange?: (isOpen: boolean) => void; // Callback para notificar cambio de estado
  locationName?: string; // Nombre de la ubicación (opcional, para exportación)
  date?: Date; // Fecha de la simulación (opcional, para exportación)
  latitude?: number; // Latitud (opcional, para exportación)
  longitude?: number; // Longitud (opcional, para exportación)
}

const panelContainerStyle = (isOpen: boolean): React.CSSProperties => ({
  position: 'fixed',
  top: 0,
  right: isOpen ? 0 : '-900px',
  width: '900px',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  transition: 'right 0.3s ease',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: isOpen ? '-4px 0 20px rgba(0, 0, 0, 0.5)' : 'none'
});

const toggleButtonStyle = (isOpen: boolean): React.CSSProperties => ({
  position: 'fixed',
  top: '50%',
  right: isOpen ? '900px' : '0',
  transform: 'translateY(-50%)',
  background: 'rgba(0, 0, 0, 0.85)',
  color: 'white',
  border: 'none',
  padding: '20px 12px',
  cursor: 'pointer',
  borderRadius: '8px 0 0 8px',
  fontSize: '20px',
  transition: 'right 0.3s ease',
  zIndex: 1002,
  boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
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
  display: 'flex',
  gap: '20px',
  padding: '20px'
};

const columnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

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

/**
 * Calcula el ángulo de incidencia sobre el panel solar con respecto a su normal
 * 
 * El ángulo de incidencia es el ángulo entre:
 * - El vector que apunta hacia el sol
 * - La normal del panel (perpendicular a la superficie superior del panel)
 * 
 * GEOMETRÍA DEL PANEL:
 * - El panel está montado en un edificio que puede rotar
 * - El azimut del panel (γₚ) es la dirección hacia donde apunta la normal proyectada horizontalmente
 * - La inclinación (α) es cuánto se levanta desde horizontal (0°=acostado, 90°=parado)
 * 
 * VECTOR NORMAL DEL PANEL:
 * Cuando el panel está inclinado α grados y orientado con azimut γₚ:
 * - Nx = sin(α) * sin(γₚ)
 * - Ny = cos(α)         (componente vertical, máxima cuando α=0° horizontal)
 * - Nz = sin(α) * cos(γₚ)
 * 
 * VECTOR DEL SOL:
 * Con altura solar β y azimut solar γ:
 * - Sx = cos(β) * sin(γ)
 * - Sy = sin(β)
 * - Sz = cos(β) * cos(γ)
 * 
 * ÁNGULO DE INCIDENCIA:
 * El producto punto da: cos(θ) = S · N
 * 
 * Expandiendo y simplificando:
 * cos(θ) = sin(β)*cos(α) + cos(β)*sin(α)*cos(γ - γₚ)
 * 
 * Donde (γ - γₚ) es la diferencia entre el azimut solar y el azimut del panel.
 * 
 * INTERPRETACIÓN:
 * - θ = 0°: Sol perpendicular al panel (máxima radiación)
 * - θ = 90°: Sol paralelo al panel (sin radiación)
 * - θ > 90°: Sol detrás del panel (sin radiación)
 * 
 * @param altitudSolar - Altura solar (β) en grados
 * @param panelInclination - Inclinación del panel (α) en grados desde horizontal (0°=horizontal, 90°=vertical)
 * @param azimuthDifference - Diferencia angular (γ - γₚ) en grados entre azimut solar y azimut del panel
 * @returns Ángulo de incidencia (θ) en grados entre el sol y la normal del panel
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
  
  // Fórmula del ángulo de incidencia con respecto a la NORMAL del panel
  // cos(θ) = sin(β)*cos(α) + cos(β)*sin(α)*cos(γ - γₚ)
  const cosTheta = 
    Math.sin(beta) * Math.cos(alpha) + 
    Math.cos(beta) * Math.sin(alpha) * Math.cos(deltaGamma);
  
  // Limitar el valor entre -1 y 1 para evitar errores numéricos
  const cosLimited = Math.max(-1, Math.min(1, cosTheta));
  const theta = Math.acos(cosLimited);
  
  return toDeg(theta);
};

/**
 * Calcula la eficiencia del panel en función del ángulo de incidencia
 * 
 * @param incidenceAngle - Ángulo de incidencia (θ) en grados
 * @returns Eficiencia en porcentaje (0-100)
 */
const calculateEfficiency = (incidenceAngle: number): number => {
  // Si el ángulo es mayor a 90°, el sol está detrás del panel
  if (incidenceAngle > 90) {
    return 0;
  }
  
  // Eficiencia = cos(θ) * 100
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const efficiency = Math.cos(toRad(incidenceAngle)) * 100;
  
  return Math.max(0, efficiency);
};

const SolarDataPanel: React.FC<SolarDataPanelProps> = memo(({
  trajectory,
  isFinished,
  panelInclination = 30,
  wallSolarAzimuth = 0,
  onOpenChange,
  locationName,
  date,
  latitude,
  longitude
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => {
    const newState = !isOpen;
    setIsOpen(newState);
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
    
    return trajectory.map(point => {
      // El azimut del panel es wallSolarAzimuth (orientación del edificio)
      // Necesitamos calcular la diferencia entre el azimut solar y el azimut del panel
      const azimuthDifference = point.azimut - wallSolarAzimuth;
      
      const incidenceAngle = calculateIncidenceAngle(
        point.altura,
        panelInclination,
        azimuthDifference
      );
      
      const efficiency = calculateEfficiency(incidenceAngle);
      
      return {
        horaSolar: point.horaSolar,
        anguloIncidencia: incidenceAngle,
        eficiencia: efficiency
      };
    });
  }, [trajectory, panelInclination, wallSolarAzimuth]);

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

  // Solo mostrar el panel si la simulación ha finalizado
  if (!isFinished) {
    return null;
  }

  return (
    <>
      {/* Botón para abrir/cerrar el panel */}
      <button
        style={toggleButtonStyle(isOpen)}
        onClick={togglePanel}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
        }}
      >
        {isOpen ? '›' : '‹'}
      </button>

      {/* Panel lateral */}
      <div style={panelContainerStyle(isOpen)}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                📊 Datos de Trayectoria Solar y Eficiencia del Panel
              </h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
                {trajectory ? `${trajectory.length} puntos calculados` : 'Sin datos'} | 
                Panel: α={panelInclination}°, ψ={wallSolarAzimuth}°
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={!trajectory || trajectory.length === 0}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
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
              onMouseEnter={(e) => {
                if (trajectory && trajectory.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>💾</span>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        <div style={contentContainerStyle}>
          {trajectory && trajectory.length > 0 ? (
            <>
              {/* Columna 1: Trayectoria Solar */}
              <div style={columnStyle}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  🌞 Trayectoria Solar
                </h3>
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
              </div>

              {/* Columna 2: Ángulo de Incidencia y Eficiencia */}
              <div style={columnStyle}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  ⚡ Ángulo de Incidencia y Eficiencia
                </h3>
                
                {/* Explicación de Eficiencia */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ color: '#60a5fa' }}>💡 ¿Qué es la eficiencia?</strong>
                  <p style={{ margin: '6px 0 0 0', color: '#e5e7eb' }}>
                    La eficiencia del panel solar depende del <strong>ángulo de incidencia (θ)</strong> entre 
                    los rayos solares y la superficie del panel. Se calcula como <strong>η = cos(θ) × 100%</strong>.
                    La máxima eficiencia (100%) ocurre cuando el sol está perpendicular al panel (θ = 0°), 
                    y es nula cuando el sol está detrás del panel (θ &gt; 90°).
                  </p>
                </div>

                {/* Gráfica de Eficiencia */}
                <div style={chartContainerStyle}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600' }}>
                    Eficiencia del Panel durante el Día
                  </h4>
                  {incidenceData && incidenceData.length > 0 ? (
                    <ReactApexChart
                      options={chartOptions}
                      series={chartSeries}
                      type="area"
                      height={300}
                      width="100%"
                    />
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No hay datos para mostrar
                    </div>
                  )}
                </div>

                {/* Tabla de datos de incidencia */}
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
