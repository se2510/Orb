import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export interface SimulationDataPoint {
  horaSolar: string;
  altura: number;
  azimut: number;
  radiacion: number;
  temperatura: number;
  potencia: number;
}

interface ReportData {
  locationName: string;
  date: Date;
  latitude: number;
  longitude: number;
  panelInclination: number;
  wallSolarAzimuth: number;
  simulationData: SimulationDataPoint[];
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

  // --- Gráfica de Generación (Vectorial) ---
  // Verificar si cabe en la página actual, si no, nueva página
  if (yPos + 80 > doc.internal.pageSize.height) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('3. Curva de Generación de Potencia', 20, yPos);
  yPos += 10;

  const chartHeight = 60;
  const chartWidth = pageWidth - 40;
  const chartX = 20;
  const chartY = yPos;

  // Ejes
  doc.setLineWidth(0.5);
  doc.setDrawColor(150);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // Eje X
  doc.line(chartX, chartY, chartX, chartY + chartHeight); // Eje Y

  // Encontrar potencia máxima para escalar
  const maxPower = Math.max(...data.simulationData.map(d => d.potencia), 1);
  
  // Dibujar curva
  doc.setLineWidth(1.5);
  doc.setDrawColor(76, 175, 80); // Verde Orb
  
  const points = data.simulationData;
  if (points.length > 1) {
    const xStep = chartWidth / (points.length - 1);
    
    // Relleno suave bajo la curva (opcional, simulado con muchas líneas verticales finas o polygon)
    // Para simplicidad y compatibilidad, solo línea por ahora.
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      
      const x1 = chartX + (i * xStep);
      const y1 = chartY + chartHeight - ((p1.potencia / maxPower) * chartHeight);
      
      const x2 = chartX + ((i + 1) * xStep);
      const y2 = chartY + chartHeight - ((p2.potencia / maxPower) * chartHeight);
      
      doc.line(x1, y1, x2, y2);
    }
  }

  // Etiquetas de Ejes
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('0 W', chartX - 2, chartY + chartHeight, { align: 'right' });
  doc.text(`${maxPower.toFixed(0)} W`, chartX - 2, chartY + 5, { align: 'right' });
  
  // Etiquetas de Tiempo
  if (points.length > 0) {
    doc.text(points[0].horaSolar, chartX, chartY + chartHeight + 5);
    doc.text(points[Math.floor(points.length/2)].horaSolar, chartX + chartWidth/2, chartY + chartHeight + 5, { align: 'center' });
    doc.text(points[points.length-1].horaSolar, chartX + chartWidth, chartY + chartHeight + 5, { align: 'right' });
  }

  yPos += chartHeight + 15;

  // --- Tabla Detallada de Datos ---
  // Verificar espacio
  if (yPos + 40 > doc.internal.pageSize.height) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('4. Detalle Horario de Simulación', 20, yPos);
  
  yPos += 5;
  
  const tableRows = data.simulationData.map(point => [
    point.horaSolar,
    point.altura.toFixed(1) + '°',
    point.radiacion.toFixed(0),
    point.temperatura.toFixed(1) + '°C',
    point.potencia.toFixed(1) + ' W'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Hora', 'Altitud', 'Irradiancia (W/m²)', 'Temp. Panel', 'Potencia']],
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
