import * as THREE from 'three';

/**
 * Crea una brújula visual en el suelo para mejorar la orientación
 */
export const createCompass = (scene: THREE.Scene): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'compass';
  
  // 1. Círculo base de la brújula
  const radius = 4;
  const circleGeometry = new THREE.CircleGeometry(radius, 64);
  const circleMaterial = new THREE.MeshBasicMaterial({
    color: 0x222222,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const circle = new THREE.Mesh(circleGeometry, circleMaterial);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.01; // Justo encima del suelo
  group.add(circle);
  
  // 2. Anillo exterior con marcas de grados
  const ringGeometry = new THREE.RingGeometry(radius - 0.5, radius, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);
  
  // 3. Estrella de la brújula (4 puntas principales)
  const starShape = new THREE.Shape();
  const outer = radius - 0.8;
  const inner = 0.5;
  
  // Norte
  starShape.moveTo(0, outer);
  starShape.lineTo(inner, inner);
  // Este
  starShape.lineTo(outer, 0);
  starShape.lineTo(inner, -inner);
  // Sur
  starShape.lineTo(0, -outer);
  starShape.lineTo(-inner, -inner);
  // Oeste
  starShape.lineTo(-outer, 0);
  starShape.lineTo(-inner, inner);
  starShape.lineTo(0, outer);
  
  const starGeometry = new THREE.ShapeGeometry(starShape);
  const starMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const star = new THREE.Mesh(starGeometry, starMaterial);
  star.rotation.x = -Math.PI / 2;
  star.position.y = 0.03;
  group.add(star);
  
  // 4. Punta Norte destacada (Roja)
  const northShape = new THREE.Shape();
  northShape.moveTo(0, outer);
  northShape.lineTo(inner, inner);
  northShape.lineTo(0, 0);
  northShape.lineTo(-inner, inner);
  northShape.lineTo(0, outer);
  
  const northGeometry = new THREE.ShapeGeometry(northShape);
  const northMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4444, // Rojo
    side: THREE.DoubleSide
  });
  const northPoint = new THREE.Mesh(northGeometry, northMaterial);
  northPoint.rotation.x = -Math.PI / 2;
  northPoint.position.y = 0.04;
  group.add(northPoint);
  
  // 5. Letras Cardinales (N, S, E, W)
  // Usamos sprites de texto simples o geometrías si no queremos cargar fuentes
  // Por simplicidad, usaremos geometrías básicas o sprites si es posible, 
  // pero para mantenerlo simple y sin dependencias de fuentes externas, 
  // usaremos colores en los ejes para identificar.
  // (Las etiquetas flotantes ya existen en createCardinalLabels, esto es un refuerzo en el suelo)
  
  scene.add(group);
  return group;
};
