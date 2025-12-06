import * as THREE from 'three';

export interface StarElements {
  group: THREE.Points;
  setVisible: (visible: boolean) => void;
}

/**
 * Crea un sistema de estrellas eficiente usando THREE.Points y BufferGeometry
 * @param scene - Escena de Three.js
 * @param numStars - Número de estrellas
 */
export const createStars = (scene: THREE.Scene, numStars: number = 120): StarElements => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(numStars * 3);

  const radiusBase = 48;
  let inserted = 0;
  for (let i = 0; i < numStars; i++) {
    // Distribuir en la bóveda celeste (hemisferio superior)
    const theta = Math.random() * (Math.PI / 2);
    const phi = Math.random() * Math.PI * 2;
    const radius = radiusBase + Math.random() * 8;
    const y = Math.cos(theta) * radius;
    if (y <= 0.5) continue; // rechazamos estrellas por debajo del umbral

    const x = Math.sin(theta) * Math.cos(phi) * radius;
    const z = Math.sin(theta) * Math.sin(phi) * radius;

    positions[inserted * 3 + 0] = x;
    positions[inserted * 3 + 1] = y;
    positions[inserted * 3 + 2] = z;
    inserted++;
  }

  const finalPositions = positions.subarray(0, inserted * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(finalPositions, 3));

  // Points material: pequeño y ligeramente brillante
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.12,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  });

  const points = new THREE.Points(geometry, material);
  points.visible = false;
  scene.add(points);

  const setVisible = (visible: boolean) => {
    points.visible = visible;
  };

  return { group: points, setVisible };
};
