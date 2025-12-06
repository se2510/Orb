import * as THREE from 'three';

export const createLighting = (scene: THREE.Scene): THREE.AmbientLight => {
  // Luz ambiental suave (no tan intensa para permitir sombras contrastadas)
  // Reducimos intensidad de 1.0 a 0.6
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  // Luz hemisférica para dar un toque más natural (cielo azulado, suelo terroso)
  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.3);
  scene.add(hemiLight);
  
  return ambientLight;
};
