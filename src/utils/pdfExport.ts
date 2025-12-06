import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SolarTrajectoryPoint } from './solarCalculations';

interface FinancialData {
  electricityPrice: number;
  systemCost: number;
  dailySavings: number;
  monthlySavings: number;
  annualSavings: number;
  paybackYears: number;
}

interface EnergyData {
  totalKWh: number;
  peakW: number;
  generationHours: number;
}

interface ReportData {
  locationName: string;
  date: Date;
  latitude: number;
  longitude: number;
  panelInclination: number;
  wallSolarAzimuth: number;
  trajectory: SolarTrajectoryPoint[];
  energy: EnergyData;
  financial: FinancialData;
}

export const generatePDFReport = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- Encabezado ---
  doc.setFillColor(15, 23, 42); // Dark blue background
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Orb Solar Simulation', 20, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Técnico de Viabilidad Solar', 20, 30);
  
  doc.setFontSize(10);
  doc.text(`Fecha de reporte: ${new Date().toLocaleDateString()}`, pageWidth - 20, 20, { align: 'right' });
  doc.text('Generado por Orb Engine', pageWidth - 20, 30, { align: 'right' });

  // --- Información del Proyecto ---
  let yPos = 55;
  
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Configuración del Proyecto', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const projectInfo = [
    ['Ubicación:', data.locationName || 'Coordenadas personalizadas'],
    ['Latitud / Longitud:', `${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`],
    ['Fecha Simulada:', data.date.toLocaleDateString()],
    ['Inclinación Panel:', `${data.panelInclination}°`],
    ['Orientación (Azimut):', `${data.wallSolarAzimuth}° (0°=Norte, 180°=Sur)`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: projectInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 20 }
  });

  // --- Resumen Energético ---
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Análisis Energético (Diario)', 20, yPos);
  
  yPos += 10;
  const energyData = [
    ['Energía Total Generada', `${data.energy.totalKWh.toFixed(3)} kWh`],
    ['Potencia Pico', `${data.energy.peakW.toFixed(1)} W`],
    ['Horas de Generación Activa', `${data.energy.generationHours.toFixed(1)} horas`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: energyData,
    theme: 'striped',
    headStyles: { fillColor: [76, 175, 80] }, // Green header
    styles: { fontSize: 10 },
    margin: { left: 20, right: 110 } // Tabla más angosta
  });

  // --- Resumen Financiero ---
  // Posicionar al lado de la tabla energética si cabe, o abajo
  const finalYEnergy = (doc as any).lastAutoTable.finalY;
  
  // Dibujar tabla financiera a la derecha
  const financialData = [
    ['Precio Electricidad', `$${data.financial.electricityPrice.toFixed(2)} /kWh`],
    ['Ahorro Diario Estimado', `$${data.financial.dailySavings.toFixed(2)}`],
    ['Ahorro Anual Proyectado', `$${data.financial.annualSavings.toFixed(2)}`],
    ['Retorno de Inversión (ROI)', `${data.financial.paybackYears.toFixed(1)} años`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Métrica Financiera', 'Proyección']],
    body: financialData,
    theme: 'striped',
    headStyles: { fillColor: [33, 150, 243] }, // Blue header
    styles: { fontSize: 10 },
    margin: { left: 110 } // Mover a la derecha
  });

  yPos = Math.max(finalYEnergy, (doc as any).lastAutoTable.finalY) + 15;

  // --- Tabla Detallada de Datos ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Detalle Horario de Generación', 20, yPos);
  
  yPos += 5;
  
  // Preparar datos para la tabla grande
  // Necesitamos calcular algunos valores que se hacen en el componente
  // Para simplificar, usaremos los datos crudos de trayectoria y haremos una estimación rápida o 
  // idealmente deberíamos pasar los datos procesados (incidenceData) a esta función.
  // Por ahora, usaremos los datos de trayectoria básicos.
  
  const tableRows = data.trajectory.map(point => [
    point.horaSolar,
    point.altura.toFixed(1) + '°',
    point.azimut.toFixed(1) + '°',
    // Nota: Aquí idealmente irían los datos calculados de potencia. 
    // Como el PDF se genera desde el componente, podemos pasar esos datos procesados.
    // Por simplicidad en esta primera versión, mostramos la geometría solar.
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Hora', 'Altitud Solar', 'Azimut Solar']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60] },
    styles: { fontSize: 9, halign: 'center' },
    margin: { left: 20, right: 20 }
  });

  // --- Pie de página ---
  const pageCount = doc.internal.pages.length - 1; // -1 porque jsPDF crea una página extra a veces o es 1-based
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  // Guardar archivo
  doc.save(`Orb_Reporte_${data.locationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
