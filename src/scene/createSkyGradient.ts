import * as THREE from 'three';

/**
 * Crea una textura de gradiente azul para usar como fondo procedural.
 * @param topColor - Color superior (hex)
 * @param bottomColor - Color inferior (hex)
 * @returns THREE.CanvasTexture
 */
export function createSkyGradientTexture(topColor: string = '#87ceeb', bottomColor: string = '#1565c0'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    // Azul MUY claro arriba, azul claro en el centro, azul medio en el horizonte
    gradient.addColorStop(0, '#e0f7ff'); // Azul casi blanco arriba
    gradient.addColorStop(0.5, '#87ceeb'); // Azul claro en el centro
    gradient.addColorStop(1, '#4682b4'); // Azul medio en el horizonte
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
