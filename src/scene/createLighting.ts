import * as THREE from 'three';

export const createLighting = (scene: THREE.Scene): THREE.AmbientLight => {
  // Luz ambiental aún más suave para evitar sobreexposición
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  // Luz hemisférica más tenue
  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.15);
  scene.add(hemiLight);
  
  return ambientLight;
};
