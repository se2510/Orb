import * as THREE from 'three';
import { calculateIncidenceAngleOnPanel } from '../utils/solarCalculations';

// Paleta de colores para visualización de ángulos
const ALTITUDE_COLORS = {
  plane: 0xFF6B35,        // Coral/naranja para el plano
  planeOpacity: 0.12,
  planeBorder: 0xFF8C42,  // Coral más claro para el borde
  planeBorderOpacity: 0.5,
  sunLine: 0xFFD700,      // Dorado para la línea al sol
  angleFill: 0xFFB380,    // Naranja claro/melocotón para relleno
  angleFillOpacity: 0.45,
  angleStroke: 0xFF6B35,  // Coral oscuro para el trazo
  labelText: 0xFFFFFF     // Blanco para el texto
};

const AZIMUTH_COLORS = {
  plane: 0x4A90E2,        // Azul medio para el plano
  planeOpacity: 0.12,
  planeBorder: 0x5BA3F5,  // Azul más claro para el borde
  planeBorderOpacity: 0.5,
  referenceLine: 0xE74C3C, // Rojo coral para línea Sur
  sunLine: 0xFFD700,      // Dorado para la línea al sol
  angleFill: 0x7FB3FF,    // Azul claro para relleno
  angleFillOpacity: 0.45,
  angleStroke: 0x2E5C8A,  // Azul oscuro para el trazo
  labelText: 0xFFFFFF     // Blanco para el texto
};

/**
 * Crea referencias visuales para el ángulo de Altura Solar (β)
 * Muestra un plano horizontal, una línea desde el centro hacia el sol,
 * y el arco que representa el ángulo β
 */
export function createAltitudeReference(altitude: number, azimuth: number, domeRadius: number = 5): THREE.Group {
  const group = new THREE.Group();
  group.name = 'altitudeReference';

  // Calcular la posición real del sol usando la MISMA fórmula que updateSunPositionSolar en createSun.ts
  const altitudeRad = (altitude * Math.PI) / 180;
  const azimuthRad = ((azimuth - 90) * Math.PI) / 180;
  
  const horizontalRadius = domeRadius * Math.cos(altitudeRad);
  const sunX = horizontalRadius * Math.cos(azimuthRad);
  const sunY = domeRadius * Math.sin(altitudeRad);
  const sunZ = horizontalRadius * Math.sin(azimuthRad);

  // 1. Plano horizontal de referencia (XZ)
  const planeGeometry = new THREE.CircleGeometry(domeRadius + 1, 64);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: ALTITUDE_COLORS.plane,
    opacity: ALTITUDE_COLORS.planeOpacity,
    transparent: true,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = Math.PI / 2;
  plane.position.y = 0.01; // Ligeramente arriba del suelo
  group.add(plane);

  // 2. Borde del plano (círculo)
  const circleOutline = new THREE.RingGeometry(domeRadius + 0.8, domeRadius + 1, 64);
  const circleMaterial = new THREE.MeshBasicMaterial({
    color: ALTITUDE_COLORS.planeBorder,
    opacity: ALTITUDE_COLORS.planeBorderOpacity,
    transparent: true,
    side: THREE.DoubleSide
  });
  const circle = new THREE.Mesh(circleOutline, circleMaterial);
  circle.rotation.x = Math.PI / 2;
  circle.position.y = 0.02; // Más alto que el plano para evitar z-fighting
  group.add(circle);

  // 3. Línea DIRECTA desde el centro hacia la posición REAL del sol
  const sunLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(sunX, sunY, sunZ)
  ]);
  const sunLineMaterial = new THREE.LineBasicMaterial({
    color: ALTITUDE_COLORS.sunLine,
    opacity: 1.0,
    transparent: false,
    linewidth: 4,
    depthTest: false, // Siempre visible
    depthWrite: false
  });
  const sunLine = new THREE.Line(sunLineGeometry, sunLineMaterial);
  sunLine.renderOrder = 998; // Renderizar antes que las etiquetas pero después del resto
  group.add(sunLine);

  // 4. Arco que muestra el ángulo β
  // Usar directamente el parámetro altitude ya que representa el ángulo desde el horizonte
  // Solo crear el arco si el ángulo es significativo (más de 1 grado)
  if (Math.abs(altitude) > 1) { // Más de 1 grado
    // Calcular la proyección horizontal del sol
    const projectionX = sunX;
    const projectionZ = sunZ;
    const distance2D = Math.sqrt(projectionX * projectionX + projectionZ * projectionZ);
    
    // El ángulo de elevación real (puede ser positivo o negativo)
    const elevationAngle = Math.atan2(sunY, distance2D);
    const arcRadius = 1.5;
    const arcSegments = 32;
    
    // Dirección normalizada hacia la proyección horizontal
    const dirX = distance2D > 0.001 ? projectionX / distance2D : 1;
    const dirZ = distance2D > 0.001 ? projectionZ / distance2D : 0;

    // Crear geometría del relleno del ángulo usando triángulos en forma de abanico
    const fillVertices: number[] = [];
    const fillIndices: number[] = [];
    
    // Añadir vértice del origen (centro)
    fillVertices.push(0, 0, 0);
    
    // Añadir vértices del arco
    for (let i = 0; i <= arcSegments; i++) {
      const t = i / arcSegments;
      const angle = t * elevationAngle;
      const x = arcRadius * Math.cos(angle) * dirX;
      const y = arcRadius * Math.sin(angle);
      const z = arcRadius * Math.cos(angle) * dirZ;
      fillVertices.push(x, y, z);
    }
    
    // Crear índices para los triángulos (forma de abanico desde el origen)
    for (let i = 0; i < arcSegments; i++) {
      fillIndices.push(0, i + 1, i + 2);
    }
    
    const fillGeometry = new THREE.BufferGeometry();
    fillGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fillVertices, 3));
    fillGeometry.setIndex(fillIndices);
    fillGeometry.computeVertexNormals();
    
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: ALTITUDE_COLORS.angleFill,
      opacity: ALTITUDE_COLORS.angleFillOpacity,
      transparent: true,
      side: THREE.DoubleSide
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    group.add(fillMesh);

    // Crear el borde del arco (más grueso y oscuro)
    const arcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= arcSegments; i++) {
      const t = i / arcSegments;
      const angle = t * elevationAngle;
      const x = arcRadius * Math.cos(angle) * dirX;
      const y = arcRadius * Math.sin(angle);
      const z = arcRadius * Math.cos(angle) * dirZ;
      arcPoints.push(new THREE.Vector3(x, y, z));
    }

    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMaterial = new THREE.LineBasicMaterial({
      color: ALTITUDE_COLORS.angleStroke,
      opacity: 1.0,
      transparent: false,
      linewidth: 5 // Más grueso
    });
    const arc = new THREE.Line(arcGeometry, arcMaterial);
    group.add(arc);

    // 5. Etiqueta del ángulo
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'bold 40px Arial';
    context.fillStyle = '#ffffff'; // Texto blanco
    context.textAlign = 'center';
    context.fillText(`β = ${altitude.toFixed(1)}°`, 128, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false, // Siempre visible, encima de todo
      depthWrite: false
    });
    const label = new THREE.Sprite(labelMaterial);
    
    // Posicionar la etiqueta cerca del arco
    const labelAngle = elevationAngle / 2;
    const labelRadius = arcRadius + 1.2;
    label.position.set(
      labelRadius * Math.cos(labelAngle) * dirX,
      labelRadius * Math.sin(labelAngle),
      labelRadius * Math.cos(labelAngle) * dirZ
    );
    label.scale.set(2, 1, 1);
    label.renderOrder = 999; // Renderizar al final para estar siempre encima
    group.add(label);
  }

  return group;
}

/**
 * Crea referencias visuales para el ángulo de Azimut Solar (γ)
 * Muestra un plano horizontal, línea de referencia Norte-Sur,
 * y el arco que representa el ángulo γ
 */
export function createAzimuthReference(azimuth: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'azimuthReference';

  // 1. Plano horizontal de referencia (XZ) - diferente color
  const planeGeometry = new THREE.CircleGeometry(15, 64);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: AZIMUTH_COLORS.plane,
    opacity: AZIMUTH_COLORS.planeOpacity,
    transparent: true,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = Math.PI / 2;
  plane.position.y = 0.01; // Ligeramente arriba del suelo
  group.add(plane);

  // 2. Borde del plano
  const circleOutline = new THREE.RingGeometry(14.8, 15, 64);
  const circleMaterial = new THREE.MeshBasicMaterial({
    color: AZIMUTH_COLORS.planeBorder,
    opacity: AZIMUTH_COLORS.planeBorderOpacity,
    transparent: true,
    side: THREE.DoubleSide
  });
  const circle = new THREE.Mesh(circleOutline, circleMaterial);
  circle.rotation.x = Math.PI / 2;
  circle.position.y = 0.02; // Más alto que el plano para evitar z-fighting
  group.add(circle);

  // 3. Línea Norte-Sur (referencia 0°) - apunta hacia Z negativo (Sur)
  const southLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0, 0.05, -15)
  ]);
  const southLineMaterial = new THREE.LineBasicMaterial({
    color: AZIMUTH_COLORS.referenceLine,
    opacity: 0.8,
    transparent: true,
    linewidth: 3
  });
  const southLine = new THREE.Line(southLineGeometry, southLineMaterial);
  group.add(southLine);

  // 4. Línea desde el centro hacia la proyección del sol en el plano horizontal
  const azimuthRad = (azimuth * Math.PI) / 180;
  const projectionDistance = 15;
  
  // Azimuth: 0° = Sur (-Z), -90° = Este (+X), +90° = Oeste (-X)
  const projX = projectionDistance * Math.sin(azimuthRad);
  const projZ = -projectionDistance * Math.cos(azimuthRad);

  const azimuthLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(projX, 0.05, projZ)
  ]);
  const azimuthLineMaterial = new THREE.LineBasicMaterial({
    color: AZIMUTH_COLORS.sunLine,
    opacity: 1.0,
    transparent: false,
    linewidth: 3,
    depthTest: false, // Siempre visible
    depthWrite: false
  });
  const azimuthLine = new THREE.Line(azimuthLineGeometry, azimuthLineMaterial);
  azimuthLine.renderOrder = 998; // Renderizar antes que las etiquetas pero después del resto
  group.add(azimuthLine);

  // 5. Arco que muestra el ángulo γ con relleno
  const arcRadius = 6;
  const arcSegments = 32;
  
  const startAngle = -Math.PI / 2; // Comienza apuntando hacia Z negativo (Sur)
  const endAngle = startAngle + azimuthRad;
  const angleStep = (endAngle - startAngle) / arcSegments;

  // Solo crear el arco y relleno si el ángulo es significativo
  if (Math.abs(azimuth) > 1) { // Más de 1 grado
    // Crear geometría del relleno del ángulo usando triángulos en forma de abanico
    const fillVertices: number[] = [];
    const fillIndices: number[] = [];
    
    // Añadir vértice del origen (centro)
    fillVertices.push(0, 0.08, 0);
    
    // Añadir vértices del arco
    for (let i = 0; i <= arcSegments; i++) {
      const angle = startAngle + angleStep * i;
      const x = arcRadius * Math.cos(angle);
      const z = arcRadius * Math.sin(angle);
      fillVertices.push(x, 0.08, z);
    }
    
    // Crear índices para los triángulos (forma de abanico desde el origen)
    for (let i = 0; i < arcSegments; i++) {
      fillIndices.push(0, i + 1, i + 2);
    }
    
    const fillGeometry = new THREE.BufferGeometry();
    fillGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fillVertices, 3));
    fillGeometry.setIndex(fillIndices);
    fillGeometry.computeVertexNormals();
    
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: AZIMUTH_COLORS.angleFill,
      opacity: AZIMUTH_COLORS.angleFillOpacity,
      transparent: true,
      side: THREE.DoubleSide
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    group.add(fillMesh);

    // Crear el borde del arco (más grueso y oscuro)
    const arcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= arcSegments; i++) {
      const angle = startAngle + angleStep * i;
      const x = arcRadius * Math.cos(angle);
      const z = arcRadius * Math.sin(angle);
      arcPoints.push(new THREE.Vector3(x, 0.1, z));
    }

    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMaterial = new THREE.LineBasicMaterial({
      color: AZIMUTH_COLORS.angleStroke,
      opacity: 1.0,
      transparent: false,
      linewidth: 5 // Más grueso
    });
    const arc = new THREE.Line(arcGeometry, arcMaterial);
    group.add(arc);

    // 6. Etiqueta del ángulo
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'bold 40px Arial';
    context.fillStyle = '#ffffff'; // Texto blanco
    context.textAlign = 'center';
    context.fillText(`γ = ${azimuth.toFixed(1)}°`, 128, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false, // Siempre visible, encima de todo
      depthWrite: false
    });
    const label = new THREE.Sprite(labelMaterial);
    
    const labelAngle = startAngle + azimuthRad / 2;
    const labelDistance = arcRadius + 3;
    label.position.set(
      labelDistance * Math.cos(labelAngle),
      1,
      labelDistance * Math.sin(labelAngle)
    );
    label.scale.set(3, 1.5, 1);
    label.renderOrder = 999; // Renderizar al final para estar siempre encima
    group.add(label);
  }

  return group;
}

/**
 * Actualiza las referencias visuales existentes con nuevos ángulos
 */
/**
 * Crea referencias visuales para el ángulo azimut solar-pared (ψ)
 * Muestra dos líneas: una para la dirección Sur y otra para la normal de la pared,
 * y un arco que representa el ángulo ψ entre ellas
 */
export function createWallSolarAzimuthReference(wallSolarAzimuth: number, sunAzimuth: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'wallSolarAzimuthReference';

  const WALL_COLORS = {
    southLine: 0xE74C3C,    // Rojo para la línea Sur
    wallLine: 0x9B59B6,     // Púrpura para la normal de la pared
    sunLine: 0xFFD700,      // Dorado para la línea del sol
    angleFill: 0xBB8FCE,    // Púrpura claro para relleno
    angleFillOpacity: 0.35,
    angleStroke: 0x6C3483,  // Púrpura oscuro para el trazo
    labelText: 0xFFFFFF
  };

  const lineRadius = 4;
  const arcRadius = 2.5;
  
  // 1. Línea Sur (referencia 0°) - apunta hacia -Z (Sur)
  const southLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0, 0.05, -lineRadius)
  ]);
  const southLineMaterial = new THREE.LineBasicMaterial({
    color: WALL_COLORS.southLine,
    linewidth: 3,
    opacity: 0.8,
    transparent: true
  });
  const southLine = new THREE.Line(southLineGeometry, southLineMaterial);
  group.add(southLine);

  // 2. Línea de la normal de la pared (rotada según wallSolarAzimuth)
  // wallSolarAzimuth: positivo = rotación hacia oeste (sentido horario visto desde arriba)
  // Convertimos a radianes y aplicamos la rotación en el plano XZ
  const wallAngleRad = (wallSolarAzimuth * Math.PI) / 180;
  
  // Calcular posición de la línea de la pared
  // Comenzamos desde Sur (-Z) y rotamos
  const wallX = lineRadius * Math.sin(wallAngleRad);
  const wallZ = -lineRadius * Math.cos(wallAngleRad);
  
  const wallLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(wallX, 0.05, wallZ)
  ]);
  const wallLineMaterial = new THREE.LineBasicMaterial({
    color: WALL_COLORS.wallLine,
    linewidth: 3,
    opacity: 1.0,
    transparent: false,
    depthTest: false,
    depthWrite: false
  });
  const wallLine = new THREE.Line(wallLineGeometry, wallLineMaterial);
  wallLine.renderOrder = 998;
  group.add(wallLine);

  // 3. Línea de proyección del sol en el plano horizontal (opcional, para referencia)
  const sunAngleRad = (sunAzimuth * Math.PI) / 180;
  const sunX = (lineRadius * 0.7) * Math.sin(sunAngleRad);
  const sunZ = -(lineRadius * 0.7) * Math.cos(sunAngleRad);
  
  const sunLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(sunX, 0.05, sunZ)
  ]);
  const sunLineMaterial = new THREE.LineBasicMaterial({
    color: WALL_COLORS.sunLine,
    linewidth: 2,
    opacity: 0.6,
    transparent: true,
    depthTest: false
  });
  const sunLine = new THREE.Line(sunLineGeometry, sunLineMaterial);
  sunLine.renderOrder = 997;
  group.add(sunLine);

  // 4. Arco y relleno que muestra el ángulo ψ (entre Sur y normal de pared)
  if (Math.abs(wallSolarAzimuth) > 1) {
    const arcSegments = 32;
    
    // Ángulos en el sistema: -π/2 = Sur (-Z), 0 = Este (+X), π/2 = Norte (+Z), π = Oeste (-X)
    const startAngle = -Math.PI / 2; // Sur
    const endAngle = startAngle + wallAngleRad; // Rotamos según wallSolarAzimuth
    const angleStep = (endAngle - startAngle) / arcSegments;

    // Crear geometría del relleno del ángulo usando triángulos en forma de abanico
    const fillVertices: number[] = [];
    const fillIndices: number[] = [];
    
    // Añadir vértice del origen (centro)
    fillVertices.push(0, 0.08, 0);
    
    // Añadir vértices del arco
    for (let i = 0; i <= arcSegments; i++) {
      const angle = startAngle + angleStep * i;
      const x = arcRadius * Math.cos(angle);
      const z = arcRadius * Math.sin(angle);
      fillVertices.push(x, 0.08, z);
    }
    
    // Crear índices para los triángulos (forma de abanico desde el origen)
    for (let i = 0; i < arcSegments; i++) {
      fillIndices.push(0, i + 1, i + 2);
    }
    
    const fillGeometry = new THREE.BufferGeometry();
    fillGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fillVertices, 3));
    fillGeometry.setIndex(fillIndices);
    fillGeometry.computeVertexNormals();
    
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: WALL_COLORS.angleFill,
      opacity: WALL_COLORS.angleFillOpacity,
      transparent: true,
      side: THREE.DoubleSide
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    group.add(fillMesh);

    // Crear el borde del arco (más grueso y oscuro)
    const arcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= arcSegments; i++) {
      const angle = startAngle + angleStep * i;
      const x = arcRadius * Math.cos(angle);
      const z = arcRadius * Math.sin(angle);
      arcPoints.push(new THREE.Vector3(x, 0.1, z));
    }

    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMaterial = new THREE.LineBasicMaterial({
      color: WALL_COLORS.angleStroke,
      opacity: 1.0,
      transparent: false,
      linewidth: 5
    });
    const arc = new THREE.Line(arcGeometry, arcMaterial);
    group.add(arc);

    // 5. Etiqueta del ángulo usando Sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;
    
    // Fondo oscuro semitransparente
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Texto del ángulo
    context.font = 'bold 40px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(`ψ = ${wallSolarAzimuth.toFixed(1)}°`, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const label = new THREE.Sprite(labelMaterial);
    
    // Posicionar la etiqueta en el centro del arco
    const labelAngle = startAngle + wallAngleRad / 2;
    const labelDistance = arcRadius + 2;
    label.position.set(
      labelDistance * Math.cos(labelAngle),
      1,
      labelDistance * Math.sin(labelAngle)
    );
    label.scale.set(3, 1.5, 1);
    label.renderOrder = 999;
    group.add(label);
  }

  return group;
}

/**
 * Crea referencias visuales para el ángulo de incidencia (θ)
 * usando el mismo cálculo trigonométrico puro que calculateIncidenceAngleOnPanel
 * 
 * Muestra:
 * 1. La normal del panel solar (vector perpendicular al panel)
 * 2. El rayo del sol hacia el panel
 * 3. El arco que representa el ángulo θ entre ambos vectores
 * 
 * @param sunAltitude - Altura del sol (β) en grados
 * @param sunAzimuth - Azimut del sol (γ) en grados
 * @param panelInclination - Inclinación del panel (φ) en grados (0 = horizontal, 90 = vertical)
 * @param panelAzimuth - Azimut del panel (a_panel) en grados
 * @param domeRadius - Radio del domo solar (default: 5)
 */
export function createIncidenceAngleReference(
  sunAltitude: number,
  sunAzimuth: number,
  panelInclination: number,
  panelAzimuth: number,
  domeRadius: number = 5
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'incidenceAngleReference';

  // Colores para la visualización
  const COLORS = {
    normal: 0x00FF00,      // Verde para la normal del panel
    sunRay: 0xFFD700,      // Dorado para el rayo del sol
    arc: 0xFF00FF,         // Magenta para el arco del ángulo
    arcFill: 0xFF88FF,     // Magenta claro para el relleno
  };

  // ========================================
  // CALCULAR ÁNGULO DE INCIDENCIA CON MÉTODO TRIGONOMÉTRICO PURO
  // ========================================
  const thetaDeg = calculateIncidenceAngleOnPanel(
    sunAltitude,      // beta
    sunAzimuth,       // gamma
    panelInclination, // phi
    panelAzimuth      // a_panel
  );

  // ========================================
  // CALCULAR VECTORES 3D PARA VISUALIZACIÓN
  // (Solo para dibujar, no para calcular el ángulo)
  // ========================================
  
  // Posición del panel (encima del edificio)
  const panelPosition = new THREE.Vector3(0, 1.25, 0);

  // Calcular la posición del sol usando coordenadas esféricas
  const altitudeRad = (sunAltitude * Math.PI) / 180;
  const azimuthRad = ((sunAzimuth - 90) * Math.PI) / 180;
  
  const horizontalRadius = domeRadius * Math.cos(altitudeRad);
  const sunX = horizontalRadius * Math.cos(azimuthRad);
  const sunY = domeRadius * Math.sin(altitudeRad);
  const sunZ = horizontalRadius * Math.sin(azimuthRad);
  const sunPosition = new THREE.Vector3(sunX, sunY, sunZ);

  // Calcular el vector de dirección del panel al sol (para visualización)
  const panelToSun = new THREE.Vector3().subVectors(sunPosition, panelPosition).normalize();

  // Calcular la normal del panel (para visualización)
  // El panel apunta hacia su azimut configurado
  const panelAzimuthRad = ((panelAzimuth - 90) * Math.PI) / 180;
  const panelInclinationRad = (panelInclination * Math.PI) / 180;

  // Normal del panel (apunta hacia donde "mira" el panel)
  const panelNormal = new THREE.Vector3(
    Math.sin(panelInclinationRad) * Math.cos(panelAzimuthRad),
    Math.cos(panelInclinationRad),
    Math.sin(panelInclinationRad) * Math.sin(panelAzimuthRad)
  ).normalize();

  // ========================================
  // VISUALIZACIÓN: 2 VECTORES DESDE EL TECHO DEL EDIFICIO
  // ========================================
  
  const vectorLength = 2.0;
  
  // 1. Vector NORMAL del panel (verde) - Dirección hacia donde apunta el panel
  const normalEnd = panelPosition.clone().add(panelNormal.clone().multiplyScalar(vectorLength));
  const normalGeometry = new THREE.BufferGeometry().setFromPoints([panelPosition, normalEnd]);
  const normalMaterial = new THREE.LineBasicMaterial({
    color: COLORS.normal,
    linewidth: 4,
    depthTest: false,
  });
  const normalLine = new THREE.Line(normalGeometry, normalMaterial);
  normalLine.renderOrder = 998;
  group.add(normalLine);

  // Flecha en el extremo de la normal
  const normalArrowGeometry = new THREE.ConeGeometry(0.1, 0.25, 8);
  const normalArrowMaterial = new THREE.MeshBasicMaterial({ 
    color: COLORS.normal,
    depthTest: false,
  });
  const normalArrow = new THREE.Mesh(normalArrowGeometry, normalArrowMaterial);
  normalArrow.position.copy(normalEnd);
  normalArrow.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    panelNormal
  );
  normalArrow.renderOrder = 998;
  group.add(normalArrow);

  // 2. Vector DIRECCIÓN del SOL (dorado) - Dirección desde donde viene el sol
  const sunRayEnd = panelPosition.clone().add(panelToSun.clone().multiplyScalar(vectorLength));
  const sunRayGeometry = new THREE.BufferGeometry().setFromPoints([panelPosition, sunRayEnd]);
  const sunRayMaterial = new THREE.LineBasicMaterial({
    color: COLORS.sunRay,
    linewidth: 4,
    depthTest: false,
  });
  const sunRayLine = new THREE.Line(sunRayGeometry, sunRayMaterial);
  sunRayLine.renderOrder = 998;
  group.add(sunRayLine);

  // Flecha en el extremo del rayo solar
  const sunArrowGeometry = new THREE.ConeGeometry(0.1, 0.25, 8);
  const sunArrowMaterial = new THREE.MeshBasicMaterial({ 
    color: COLORS.sunRay,
    depthTest: false,
  });
  const sunArrow = new THREE.Mesh(sunArrowGeometry, sunArrowMaterial);
  sunArrow.position.copy(sunRayEnd);
  sunArrow.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    panelToSun
  );
  sunArrow.renderOrder = 998;
  group.add(sunArrow);

  // 3. Etiqueta con el valor del ángulo θ (siempre se muestra)
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 48px Arial';
    context.fillStyle = '#FF00FF';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(`θ = ${thetaDeg.toFixed(1)}°`, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      depthTest: false,
    });
    const label = new THREE.Sprite(spriteMaterial);
    
    // Posicionar la etiqueta entre los dos vectores
    const labelPos = panelPosition.clone().add(
      panelNormal.clone().add(panelToSun).normalize().multiplyScalar(1.5)
    );
    label.position.copy(labelPos);
    label.scale.set(1.0, 0.5, 1);
    label.renderOrder = 999;
    group.add(label);
  }

  return group;
}

export function updateAngleReferences(
  scene: THREE.Scene,
  showAltitude: boolean,
  showAzimuth: boolean,
  altitude: number,
  azimuth: number,
  showWallSolarAzimuth: boolean = false,
  wallSolarAzimuth: number = 0,
  showIncidenceAngle: boolean = false,
  panelInclination: number = 0,
  panelAzimuth: number = 180
) {
  // Remover referencias existentes
  const existingAltitude = scene.getObjectByName('altitudeReference');
  const existingAzimuth = scene.getObjectByName('azimuthReference');
  const existingWallSolarAzimuth = scene.getObjectByName('wallSolarAzimuthReference');
  const existingIncidenceAngle = scene.getObjectByName('incidenceAngleReference');
  
  if (existingAltitude) {
    scene.remove(existingAltitude);
  }
  
  if (existingAzimuth) {
    scene.remove(existingAzimuth);
  }

  if (existingWallSolarAzimuth) {
    scene.remove(existingWallSolarAzimuth);
  }

  if (existingIncidenceAngle) {
    scene.remove(existingIncidenceAngle);
  }

  // Agregar nuevas referencias si están habilitadas
  if (showAltitude) {
    const altitudeRef = createAltitudeReference(altitude, azimuth);
    scene.add(altitudeRef);
  }

  if (showAzimuth) {
    const azimuthRef = createAzimuthReference(azimuth);
    scene.add(azimuthRef);
  }

  if (showWallSolarAzimuth) {
    const wallSolarAzimuthRef = createWallSolarAzimuthReference(wallSolarAzimuth, azimuth);
    scene.add(wallSolarAzimuthRef);
  }

  if (showIncidenceAngle) {
    // Usar el método trigonométrico puro con los parámetros correctos
    const incidenceAngleRef = createIncidenceAngleReference(
      altitude,         // beta: Altura solar
      azimuth,          // gamma: Azimut solar
      panelInclination, // phi: Inclinación del panel
      panelAzimuth      // a_panel: Azimut del panel
    );
    scene.add(incidenceAngleRef);
  }
}



