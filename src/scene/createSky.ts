import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export interface SkyElements {
  sky: Sky;
  updateSunPosition: (sunPosition: THREE.Vector3) => void;
}

/**
 * Crea un cielo atmosférico realista usando el shader Sky de Three.js
 * @param scene - La escena a la que añadir el cielo
 * @returns Objeto con el cielo y función para actualizarlo
 */
export const createSky = (scene: THREE.Scene): SkyElements => {
  const sky = new Sky();
  sky.scale.setScalar(450000); // Escala grande para cubrir todo

  // Configuración para un cielo azul claro y nubes visibles
  const skyUniforms = sky.material.uniforms;
  // Forzar azul intenso y saturado, nunca blanco
  skyUniforms['turbidity'].value = 0.1; // Aire ultra limpio, sin neblina
  skyUniforms['rayleigh'].value = 6.5; // Azul saturado
  skyUniforms['mieCoefficient'].value = 0.0001; // Sin dispersión blanca
  skyUniforms['mieDirectionalG'].value = 0.5; // Sol menos brillante, más azul

  scene.add(sky);

  // Función para actualizar la posición del sol en el shader del cielo
  const updateSunPosition = (sunPosition: THREE.Vector3) => {
    sky.material.uniforms['sunPosition'].value.copy(sunPosition);
  };

  return {
    sky,
    updateSunPosition
  };
};
