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

  // Material del domo con transparencia
  const domeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    wireframe: false,
  });
  
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.receiveShadow = true;
  scene.add(dome);

  // Agregar wireframe del domo para mejor visualización
  const domeWireframe = new THREE.Mesh(
    domeGeometry,
    new THREE.MeshBasicMaterial({
      color: 0x404040,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    })
  );
  scene.add(domeWireframe);

  // Crear el plano base (horizonte)
  const planeGeometry = new THREE.CircleGeometry(5, 32);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    side: THREE.DoubleSide,
  });
  
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);

  // Agregar grid en el plano base
  const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0xcccccc);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  // Ejes de referencia (X=rojo, Y=verde, Z=azul)
  const axesHelper = new THREE.AxesHelper(6);
  scene.add(axesHelper);
};
