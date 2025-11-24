import * as THREE from 'three';

export interface SunObject {
  sphere: THREE.Mesh;
  light: THREE.DirectionalLight;
  helper: THREE.Group;
}

export const createSun = (scene: THREE.Scene): SunObject => {
  // Crear la esfera del sol
  const sunGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd00
  });
  const sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
  sunSphere.castShadow = false;
  
  // Crear luz direccional suave que sigue al sol (sin sombras)
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.3);
  sunLight.castShadow = false;
  
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
