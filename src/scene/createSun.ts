import * as THREE from 'three';

export interface SunObject {
  sphere: THREE.Mesh;
  light: THREE.DirectionalLight;
  helper: THREE.Group;
  trail?: THREE.Line; // Línea de la estela del sol
  trailPositions?: number[]; // Posiciones de la estela
}

export const createSun = (scene: THREE.Scene): SunObject => {
  // Crear la esfera del sol
  const sunGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd00
  });
  const sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
  sunSphere.castShadow = false;
  
  // Crear luz direccional menos intensa para evitar sobreexposición
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.7);
  sunLight.castShadow = true;
  
  // Configurar sombras de alta calidad
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  
  // Ajustar el frustum de la cámara de sombras para cubrir el área central
  const d = 10;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  
  // Bias para evitar "shadow acne"
  sunLight.shadow.bias = -0.0005;
  
  // Grupo helper para visualizar la línea del rayo solar
  const helperGroup = new THREE.Group();
  
  // Línea del rayo solar (desde el sol hasta el centro)
  const rayMaterial = new THREE.LineBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.6,
    linewidth: 2
  });
  
  // Crear geometría con buffer reutilizable
  const rayGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(6); // 2 puntos * 3 coordenadas
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  positionAttribute.setUsage(THREE.DynamicDrawUsage); // Marcar como dinámico para updates frecuentes
  rayGeometry.setAttribute('position', positionAttribute);
  
  const rayLine = new THREE.Line(rayGeometry, rayMaterial);
  helperGroup.add(rayLine);
  
  // Agregar todo a la escena
  scene.add(sunSphere);
  scene.add(sunLight);
  scene.add(helperGroup);
  
  return {
    sphere: sunSphere,
    light: sunLight,
    helper: helperGroup
  };
};

/**
 * Actualiza la posición del sol basándose en los ángulos solares
 * @param sunObject - Objeto del sol con esfera, luz y helpers
 * @param altitude - Ángulo de altura solar (β) en grados (-90° a 90°, 0° = mediodía)
 * @param azimuth - Ángulo de azimut solar (γ) en grados (-90° a 90°)
 *                  0° = Mediodía (Sur), -90° = Amanecer (Este), 90° = Atardecer (Oeste)
 * @param domeRadius - Radio del domo (default: 5)
 */
export const updateSunPosition = (
  sunObject: SunObject,
  altitude: number, // β (-90° a 90°, donde 0° = mediodía)
  azimuth: number,  // γ (-90° a 90°) donde 0° = mediodía
  domeRadius: number = 5
): void => {
  // Validar rangos
  altitude = Math.max(-90, Math.min(90, altitude));
  azimuth = Math.max(-90, Math.min(90, azimuth));
  
  // Convertir altitude a radianes
  // Convertimos el rango [-90, 90] a [0, 180] para la altura
  // -90° = horizonte este, 0° = cenit (mediodía), 90° = horizonte oeste
  const altitudeRad = ((altitude + 90) * Math.PI) / 180;
  
  // Convertir azimuth: queremos que el sol se mueva de Este a Oeste pasando por Sur
  // -90° = Este, 0° = Sur, 90° = Oeste
  // Convertimos el rango [-90, 90] a un ángulo que va de Este→Sur→Oeste
  // Sumamos 90° para que -90° se convierta en 0° (Este) y 90° en 180° (Oeste)
  const azimuthRad = ((azimuth + 90) * Math.PI) / 180;
  
  // Calcular posición en coordenadas esféricas
  // En Three.js: Y es arriba, X es este-oeste (+X = Este), Z es norte-sur (+Z = Sur)
  // Para que el sol vaya de Este→Sur→Oeste:
  // azimuthRad 0° (Este): x=+5, z=0
  // azimuthRad 90° (Sur): x=0, z=+5
  // azimuthRad 180° (Oeste): x=-5, z=0
  const x = domeRadius * Math.cos(altitudeRad) * Math.cos(azimuthRad);
  const y = domeRadius * Math.sin(altitudeRad);
  const z = domeRadius * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  
  // Actualizar posición de la esfera del sol
  sunObject.sphere.position.set(x, y, z);
  
  // Actualizar posición y dirección de la luz
  sunObject.light.position.set(x, y, z);
  sunObject.light.target.position.set(0, 0, 0);
  sunObject.light.target.updateMatrixWorld();
  
  // Actualizar línea del rayo solar (reutilizando el buffer existente)
  const rayLine = sunObject.helper.children[0] as THREE.Line;
  const positionAttribute = rayLine.geometry.attributes.position as THREE.BufferAttribute;
  const positions = positionAttribute.array as Float32Array;
  
  // Actualizar los valores en el array existente (sin crear nuevo objeto)
  positions[0] = x;
  positions[1] = y;
  positions[2] = z;
  positions[3] = 0;
  positions[4] = 0;
  positions[5] = 0;
  
  positionAttribute.needsUpdate = true;
};

/**
 * Actualiza la posición del sol usando ángulos solares reales (altura y azimut)
 * @param sunObject - Objeto del sol con esfera, luz y helpers
 * @param solarAltitude - Altura solar real (β) en grados (0° = horizonte, 90° = cenit)
 * @param solarAzimuth - Azimut solar real (γ) en grados con N=0° (0°=N, 90°=E, 180°=S, 270°=W)
 * @param domeRadius - Radio del domo (default: 5)
 */
export const updateSunPositionSolar = (
  sunObject: SunObject,
  solarAltitude: number, // β (0° a 90°, altura desde el horizonte)
  solarAzimuth: number,  // γ (0° a 360°, con N=0°)
  domeRadius: number = 5
): void => {
  // Convertir altura solar a radianes (0° = horizonte, 90° = cenit)
  const altitudeRad = (solarAltitude * Math.PI) / 180;
  
  // Convertir azimut de N=0° a coordenadas Three.js
  // En Three.js: +X = Este, +Z = Sur, -X = Oeste, -Z = Norte
  // Azimut: 0°=N, 90°=E, 180°=S, 270°=W
  // Necesitamos rotar para que 0° apunte al Norte (-Z) y gire en sentido horario
  const azimuthRad = ((solarAzimuth - 90) * Math.PI) / 180;
  
  // Calcular posición en coordenadas esféricas
  // x, z definen la posición horizontal (azimut)
  // y define la altura
  const horizontalRadius = domeRadius * Math.cos(altitudeRad);
  const x = horizontalRadius * Math.cos(azimuthRad);
  const y = domeRadius * Math.sin(altitudeRad);
  const z = horizontalRadius * Math.sin(azimuthRad);
  
  // Actualizar posición de la esfera del sol
  sunObject.sphere.position.set(x, y, z);
  
  // Actualizar posición y dirección de la luz
  sunObject.light.position.set(x, y, z);
  sunObject.light.target.position.set(0, 0, 0);
  sunObject.light.target.updateMatrixWorld();
  
  // Actualizar línea del rayo solar
  const rayLine = sunObject.helper.children[0] as THREE.Line;
  const positionAttribute = rayLine.geometry.attributes.position as THREE.BufferAttribute;
  const positions = positionAttribute.array as Float32Array;
  
  positions[0] = x;
  positions[1] = y;
  positions[2] = z;
  positions[3] = 0;
  positions[4] = 0;
  positions[5] = 0;
  
  positionAttribute.needsUpdate = true;
  
  // Agregar posición a la estela si existe
  if (sunObject.trail && sunObject.trailPositions) {
    addToSunTrail(sunObject, x, y, z);
  }
};

/**
 * Inicializa la estela del sol
 * @param sunObject - Objeto del sol
 * @param scene - Escena de Three.js
 */
export const initializeSunTrail = (sunObject: SunObject, scene: THREE.Scene): void => {
  // Si ya existe una estela, eliminarla primero
  if (sunObject.trail) {
    scene.remove(sunObject.trail);
    sunObject.trail.geometry.dispose();
    (sunObject.trail.material as THREE.Material).dispose();
  }
  
  // Inicializar array de posiciones vacío
  sunObject.trailPositions = [];
  
  // Crear geometría para la estela
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.6,
    linewidth: 3
  });
  
  const trailLine = new THREE.Line(trailGeometry, trailMaterial);
  sunObject.trail = trailLine;
  scene.add(trailLine);
};

/**
 * Agrega una posición a la estela del sol
 * @param sunObject - Objeto del sol
 * @param x - Coordenada X
 * @param y - Coordenada Y
 * @param z - Coordenada Z
 */
export const addToSunTrail = (sunObject: SunObject, x: number, y: number, z: number): void => {
  if (!sunObject.trailPositions || !sunObject.trail) return;
  
  // Agregar nueva posición
  sunObject.trailPositions.push(x, y, z);
  
  // Actualizar geometría de la línea
  const positions = new Float32Array(sunObject.trailPositions);
  sunObject.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sunObject.trail.geometry.attributes.position.needsUpdate = true;
};

/**
 * Limpia la estela del sol
 * @param sunObject - Objeto del sol
 * @param scene - Escena de Three.js
 */
export const clearSunTrail = (sunObject: SunObject, scene: THREE.Scene): void => {
  if (sunObject.trail) {
    scene.remove(sunObject.trail);
    sunObject.trail.geometry.dispose();
    (sunObject.trail.material as THREE.Material).dispose();
    sunObject.trail = undefined;
  }
  sunObject.trailPositions = [];
};

/**
 * Dibuja la trayectoria solar completa del día
 * @param scene - Escena de Three.js
 * @param trajectoryPoints - Array de puntos de la trayectoria solar
 * @param domeRadius - Radio del domo (default: 5)
 */
export const drawFullDayTrajectory = (
  scene: THREE.Scene,
  trajectoryPoints: { altura: number; azimut: number }[],
  domeRadius: number = 5
): THREE.Line => {
  // Eliminar trayectoria anterior si existe
  const existingTrajectory = scene.getObjectByName('fullDayTrajectory');
  if (existingTrajectory) {
    scene.remove(existingTrajectory);
    (existingTrajectory as THREE.Line).geometry.dispose();
    ((existingTrajectory as THREE.Line).material as THREE.Material).dispose();
  }

  const points: THREE.Vector3[] = [];

  trajectoryPoints.forEach(point => {
    // Convertir coordenadas esféricas a cartesianas (misma lógica que updateSunPositionSolar)
    const altitudeRad = (point.altura * Math.PI) / 180;
    // Azimut: 0°=N, 90°=E, 180°=S, 270°=W
    // Three.js: +X=E, +Z=S
    // Rotación: (azimut - 90)
    const azimuthRad = ((point.azimut - 90) * Math.PI) / 180;

    const horizontalRadius = domeRadius * Math.cos(altitudeRad);
    const x = horizontalRadius * Math.cos(azimuthRad);
    const y = domeRadius * Math.sin(altitudeRad);
    const z = horizontalRadius * Math.sin(azimuthRad);

    // Solo agregar puntos sobre el horizonte
    if (point.altura >= -5) {
      points.push(new THREE.Vector3(x, y, z));
    }
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: 0xffff00, // Amarillo
    linewidth: 1,
    scale: 1,
    dashSize: 0.2,
    gapSize: 0.1,
    opacity: 0.4,
    transparent: true
  });

  const line = new THREE.Line(geometry, material);
  line.computeLineDistances(); // Necesario para LineDashedMaterial
  line.name = 'fullDayTrajectory';
  
  scene.add(line);
  return line;
};

