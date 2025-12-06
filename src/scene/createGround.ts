import * as THREE from 'three';

/**
 * Crea el suelo y elementos de referencia base (grid, ejes)
 * @param scene - Escena de Three.js
 */
export const createGround = (scene: THREE.Scene): void => {
  // Función para crear textura procedural de suelo técnico
  const createTechnicalFloorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (context) {
      // Fondo gris muy claro (concreto limpio)
      context.fillStyle = '#f2f2f2';
      context.fillRect(0, 0, 1024, 1024);
      
      // Ruido sutil
      for (let i = 0; i < 80000; i++) {
        const val = Math.floor(Math.random() * 20 + 235); // 235-255
        context.fillStyle = `rgb(${val}, ${val}, ${val})`;
        context.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
      }

      // Cuadrícula suave
      context.strokeStyle = '#e0e0e0';
      context.lineWidth = 1;
      context.beginPath();
      const step = 64; // Divisiones
      for (let i = 0; i <= 1024; i += step) {
        context.moveTo(i, 0);
        context.lineTo(i, 1024);
        context.moveTo(0, i);
        context.lineTo(1024, i);
      }
      context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40); // Repetir para cubrir el área grande
    texture.anisotropy = 16; // Mejor calidad en ángulos rasantes
    return texture;
  };

  // 1. Plano de suelo infinito (visual)
  const groundGeometry = new THREE.PlaneGeometry(400, 400);
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: createTechnicalFloorTexture(),
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  // Bajamos el suelo un poco más para evitar z-fighting con brújula y ejes
  ground.position.y = -0.05; 
  ground.receiveShadow = true;
  scene.add(ground);

  // 2. Grid Helper (Rejilla) - Opcional, lo mantenemos como referencia métrica
  // Color más sutil para complementar la textura
  const gridHelper = new THREE.GridHelper(50, 50, 0xbbbbbb, 0xdddddd);
  gridHelper.position.y = 0.001; // Apenas por encima del 0 para verse bien
  scene.add(gridHelper);

  // Ejes de referencia (X=rojo, Y=verde, Z=azul)
  const axesHelper = new THREE.AxesHelper(6);
  scene.add(axesHelper);
};
