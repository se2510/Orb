import * as THREE from 'three';

export const setupCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 4, 5);
  camera.lookAt(0, 0, 0);
  
  return camera;
};
