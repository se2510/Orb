import * as THREE from 'three';

export interface SolarPanelElements {
  group: THREE.Group;
  panels: THREE.Group[]; // Array de wrappers para rotación individual
}

/**
 * Crea un array de paneles solares
 * @param scene - Escena de Three.js (opcional, si se pasa se añade el grupo)
 * @param rows - Número de filas (default: 2)
 * @param cols - Número de columnas (default: 3)
 */
export const createSolarPanel = (scene: THREE.Scene | null, rows: number = 2, cols: number = 3): SolarPanelElements => {
  // Grupo principal del array (para rotación azimutal global)
  const mainGroup = new THREE.Group();
  mainGroup.position.set(0, 0, 0);
  
  const panelWrappers: THREE.Group[] = [];
  
  // Dimensiones del panel (Escalado x0.4 para que quepa en el domo)
  const width = 0.6;
  const height = 0.4;
  const gapX = 0.08; // Espacio entre columnas
  const gapZ = 0.6; // Espacio entre filas (para evitar sombras)

  // Calcular offsets para centrar el array
  const totalWidth = cols * width + (cols - 1) * gapX;
  const totalDepth = rows * height + (rows - 1) * gapZ; // Aproximado, depende de la inclinación pero usamos el spacing base
  
  const offsetX = totalWidth / 2 - width / 2;
  const offsetZ = totalDepth / 2 - height / 2;

  // Geometría y materiales compartidos para optimizar
  const panelGeometry = new THREE.PlaneGeometry(width, height);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a3a52,
    metalness: 0.7,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const edgesGeometry = new THREE.EdgesGeometry(panelGeometry);
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Wrapper para cada panel (permite inclinación individual)
      const wrapper = new THREE.Group();
      
      // Posición en la grilla
      // Z aumenta hacia el "Sur" (en coordenadas locales antes de rotar azimut)
      // X aumenta hacia el "Oeste"
      const x = c * (width + gapX) - offsetX;
      const z = r * (height + gapZ) - offsetZ;
      
      wrapper.position.set(x, 0.5, z); // Elevados 0.5m del suelo
      
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.castShadow = true;
      panel.receiveShadow = true;
      
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      panel.add(edges);
      
      wrapper.add(panel);
      mainGroup.add(wrapper);
      panelWrappers.push(wrapper);
    }
  }
  
  if (scene) {
    scene.add(mainGroup);
  }
  
  return {
    group: mainGroup,
    panels: panelWrappers
  };
};

/**
 * Actualiza la orientación del array de paneles
 * @param panelElements - Elementos del array
 * @param inclination - Ángulo de inclinación φ (Phi) en grados (0° = horizontal, 90° = vertical)
 * @param azimuth - Azimut del array en grados (0° = Sur, 90° = Oeste, -90° = Este)
 */
export const updatePanelOrientation = (
  panelElements: SolarPanelElements,
  inclination: number,
  azimuth: number
) => {
  const { group, panels } = panelElements;
  
  // Convertir ángulos a radianes
  const inclinationRad = THREE.MathUtils.degToRad(inclination);
  const azimuthRad = THREE.MathUtils.degToRad(azimuth);
  
  // 1. Rotación Azimutal: Rota todo el grupo (la orientación del array)
  // Eje Y (vertical)
  group.rotation.y = azimuthRad;
  
  // 2. Inclinación: Rota cada panel individualmente sobre su eje X local
  // Esto simula un array de inclinación fija o seguidores de un eje
  panels.forEach(wrapper => {
    wrapper.rotation.x = inclinationRad;
  });
};
