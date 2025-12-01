import * as THREE from 'three';

/**
 * Crea vectores/flechas grandes para los ejes cardinales Norte-Sur y Este-Oeste
 * para que sean más visibles en la maqueta
 */
export const createCardinalAxes = (scene: THREE.Scene): void => {
  const axisLength = 6; // Longitud de las flechas
  const arrowHeadLength = 0.5; // Tamaño de la punta de la flecha
  const arrowHeadWidth = 0.3; // Ancho de la punta de la flecha
  
  // ==================================
  // EJE NORTE-SUR (Z)
  // ==================================
  
  // Norte (Z negativo) - Línea Roja
  const northDirection = new THREE.Vector3(0, 0, -1);
  const northOrigin = new THREE.Vector3(0, 0.05, 0);
  const northArrow = new THREE.ArrowHelper(
    northDirection,
    northOrigin,
    axisLength,
    0xff0000, // Rojo
    arrowHeadLength,
    arrowHeadWidth
  );
  northArrow.name = 'northAxis';
  scene.add(northArrow);
  
  // Sur (Z positivo) - Línea Azul
  const southDirection = new THREE.Vector3(0, 0, 1);
  const southOrigin = new THREE.Vector3(0, 0.05, 0);
  const southArrow = new THREE.ArrowHelper(
    southDirection,
    southOrigin,
    axisLength,
    0x0000ff, // Azul
    arrowHeadLength,
    arrowHeadWidth
  );
  southArrow.name = 'southAxis';
  scene.add(southArrow);
  
  // ==================================
  // EJE ESTE-OESTE (X)
  // ==================================
  
  // Este (X positivo) - Línea Verde
  const eastDirection = new THREE.Vector3(1, 0, 0);
  const eastOrigin = new THREE.Vector3(0, 0.05, 0);
  const eastArrow = new THREE.ArrowHelper(
    eastDirection,
    eastOrigin,
    axisLength,
    0x00ff00, // Verde
    arrowHeadLength,
    arrowHeadWidth
  );
  eastArrow.name = 'eastAxis';
  scene.add(eastArrow);
  
  // Oeste (X negativo) - Línea Amarilla
  const westDirection = new THREE.Vector3(-1, 0, 0);
  const westOrigin = new THREE.Vector3(0, 0.05, 0);
  const westArrow = new THREE.ArrowHelper(
    westDirection,
    westOrigin,
    axisLength,
    0xffff00, // Amarillo
    arrowHeadLength,
    arrowHeadWidth
  );
  westArrow.name = 'westAxis';
  scene.add(westArrow);
  
  // ==================================
  // LÍNEAS COMPLEMENTARIAS (más gruesas en el plano)
  // ==================================
  
  // Línea Norte-Sur completa (Z)
  const nsLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.03, -axisLength),
    new THREE.Vector3(0, 0.03, axisLength)
  ]);
  const nsLineMaterial = new THREE.LineBasicMaterial({
    color: 0xff00ff, // Magenta para destacar
    linewidth: 3,
    opacity: 0.8,
    transparent: true
  });
  const nsLine = new THREE.Line(nsLineGeometry, nsLineMaterial);
  nsLine.name = 'northSouthLine';
  scene.add(nsLine);
  
  // Línea Este-Oeste completa (X)
  const ewLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-axisLength, 0.03, 0),
    new THREE.Vector3(axisLength, 0.03, 0)
  ]);
  const ewLineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff, // Cyan para destacar
    linewidth: 3,
    opacity: 0.8,
    transparent: true
  });
  const ewLine = new THREE.Line(ewLineGeometry, ewLineMaterial);
  ewLine.name = 'eastWestLine';
  scene.add(ewLine);
};
