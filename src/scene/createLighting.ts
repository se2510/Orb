import * as THREE from 'three';

export const createLighting = (scene: THREE.Scene): THREE.AmbientLight => {
  // Luz ambiental uniforme para una visualización clara sin sombras complejas
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  
  return ambientLight;
};
