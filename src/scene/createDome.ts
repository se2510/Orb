import * as THREE from 'three';

export const createDome = (scene: THREE.Scene): void => {
  // Crear el domo (media esfera)
  const domeGeometry = new THREE.SphereGeometry(
    5,    // radio
    32,   // segmentos horizontales
    32,   // segmentos verticales
    0,    // phiStart
    Math.PI * 2,  // phiLength (círculo completo)
    0,    // thetaStart
    Math.PI / 2   // thetaLength (media esfera)
  );

  // Material del domo MUY sutil (casi invisible, solo para dar volumen)
  const domeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.05, // Muy transparente
    side: THREE.DoubleSide,
    roughness: 0.1,
    metalness: 0.1,
    depthWrite: false, // No escribir en buffer de profundidad para evitar conflictos con el cielo
  });
  
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.receiveShadow = false; // No recibir sombras para no ensuciar
  scene.add(dome);

  // Agregar wireframe del domo muy sutil
  const domeWireframe = new THREE.Mesh(
    domeGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.08, // Apenas visible
    })
  );
  scene.add(domeWireframe);
};
