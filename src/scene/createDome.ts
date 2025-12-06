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

  // ==================================
  // SUELO Y ENTORNO
  // ==================================

  // 1. Plano de suelo infinito (visual)
  // Usamos un plano muy grande para recibir sombras
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01; // Ligeramente debajo de y=0 para evitar z-fighting con otros elementos
  ground.receiveShadow = true;
  scene.add(ground);

  // 2. Grid Helper (Rejilla)
  // Ayuda a la perspectiva y escala
  // Tamaño 20, divisiones 20 (cada cuadro es 1 unidad = 1 metro aprox)
  const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xdddddd);
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  // 3. Grid secundario más grande para el horizonte
  const largeGridHelper = new THREE.GridHelper(100, 10, 0xcccccc, 0xeeeeee);
  largeGridHelper.position.y = -0.01;
  scene.add(largeGridHelper);


  // Ejes de referencia (X=rojo, Y=verde, Z=azul)
  const axesHelper = new THREE.AxesHelper(6);
  scene.add(axesHelper);
};
