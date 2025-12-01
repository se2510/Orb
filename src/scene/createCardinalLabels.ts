import * as THREE from 'three';

// Cache de texturas para evitar recrear canvas en cada llamada
const labelTextureCache = new Map<string, THREE.CanvasTexture>();

const createLabel = (
  text: string,
  position: THREE.Vector3,
  color: number
): THREE.Sprite => {
  // Crear clave única para el cache
  const cacheKey = `${text}_${color}`;
  
  // Verificar si ya existe la textura en cache
  let texture = labelTextureCache.get(cacheKey);
  
  if (!texture) {
    // Solo crear el canvas si no existe en cache
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;
    
    // Dibujar el texto en el canvas
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'Bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 64, 32);

    // Crear la textura y guardarla en cache
    texture = new THREE.CanvasTexture(canvas);
    labelTextureCache.set(cacheKey, texture);
  }

  // Crear el sprite con la textura (cacheada o nueva)
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.copy(position);
  sprite.scale.set(1, 0.5, 1);
  
  return sprite;
};

export const createCardinalLabels = (scene: THREE.Scene): void => {
  // Norte (N) - Rojo - Cerca de la punta de la flecha
  const north = createLabel('N', new THREE.Vector3(0, 0.0, -6.3), 0xff0000);
  scene.add(north);
  
  // Sur (S) - Azul - Cerca de la punta de la flecha
  const south = createLabel('S', new THREE.Vector3(0, 0.0, 6.3), 0x0000ff);
  scene.add(south);
  
  // Este (E) - Verde - Cerca de la punta de la flecha
  const east = createLabel('E', new THREE.Vector3(6.3, 0.0, 0), 0x00ff00);
  scene.add(east);
  
  // Oeste (W) - Amarillo - Cerca de la punta de la flecha
  const west = createLabel('W', new THREE.Vector3(-6.3, 0.0, 0), 0xffff00);
  scene.add(west);
};
