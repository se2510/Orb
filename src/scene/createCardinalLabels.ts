import * as THREE from 'three';

const createLabel = (
  text: string,
  position: THREE.Vector3,
  color: number
): THREE.Sprite => {
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

  // Crear el sprite con el canvas
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.copy(position);
  sprite.scale.set(1, 0.5, 1);
  
  return sprite;
};

export const createCardinalLabels = (scene: THREE.Scene): void => {
  // Norte (N) - Rojo
  const north = createLabel('N', new THREE.Vector3(0, 0.1, -5.5), 0xff0000);
  scene.add(north);
  
  // Sur (S) - Azul
  const south = createLabel('S', new THREE.Vector3(0, 0.1, 5.5), 0x0000ff);
  scene.add(south);
  
  // Este (E) - Verde
  const east = createLabel('E', new THREE.Vector3(5.5, 0.1, 0), 0x00ff00);
  scene.add(east);
  
  // Oeste (W) - Amarillo
  const west = createLabel('W', new THREE.Vector3(-5.5, 0.1, 0), 0xffff00);
  scene.add(west);
};
