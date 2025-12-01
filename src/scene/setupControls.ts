import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export const setupControls = (
  camera: THREE.Camera,
  domElement: HTMLElement
): OrbitControls => {
  const controls = new OrbitControls(camera, domElement);
  
  // Configuración de suavizado
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Límites de distancia
  controls.minDistance = 5;
  controls.maxDistance = 20;
  
  // Limitar el ángulo polar para que no pueda voltear el domo completamente
  controls.minPolarAngle = Math.PI / 6; // 30 grados desde arriba
  controls.maxPolarAngle = Math.PI / 2.2; // Un poco más de 80 grados
  
  // Deshabilitar paneo para mantener el centro
  controls.enablePan = false;
  controls.target.set(0, 0, 0);
  
  return controls;
};
