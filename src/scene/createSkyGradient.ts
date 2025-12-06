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
    // Use provided colors for top and bottom of the gradient
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(0.5, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
