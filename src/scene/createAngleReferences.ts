import * as THREE from 'three';

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

  // Calcular la posición real del sol usando la misma fórmula que createSun
  const altitudeRad = ((altitude + 90) * Math.PI) / 180;
  const azimuthRad = ((azimuth + 90) * Math.PI) / 180;
  
  const sunX = domeRadius * Math.cos(altitudeRad) * Math.cos(azimuthRad);
  const sunY = domeRadius * Math.sin(altitudeRad);
  const sunZ = domeRadius * Math.cos(altitudeRad) * Math.sin(azimuthRad);

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
    opacity: 0.9,
    transparent: true,
    linewidth: 4
  });
  const sunLine = new THREE.Line(sunLineGeometry, sunLineMaterial);
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
    const labelMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
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
    opacity: 0.9,
    transparent: true,
    linewidth: 3
  });
  const azimuthLine = new THREE.Line(azimuthLineGeometry, azimuthLineMaterial);
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
    const labelMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const label = new THREE.Sprite(labelMaterial);
    
    const labelAngle = startAngle + azimuthRad / 2;
    const labelDistance = arcRadius + 3;
    label.position.set(
      labelDistance * Math.cos(labelAngle),
      1,
      labelDistance * Math.sin(labelAngle)
    );
    label.scale.set(3, 1.5, 1);
    group.add(label);
  }

  return group;
}

/**
 * Actualiza las referencias visuales existentes con nuevos ángulos
 */
export function updateAngleReferences(
  scene: THREE.Scene,
  showAltitude: boolean,
  showAzimuth: boolean,
  altitude: number,
  azimuth: number
) {
  // Remover referencias existentes
  const existingAltitude = scene.getObjectByName('altitudeReference');
  const existingAzimuth = scene.getObjectByName('azimuthReference');
  
  if (existingAltitude) {
    scene.remove(existingAltitude);
  }
  
  if (existingAzimuth) {
    scene.remove(existingAzimuth);
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
}
