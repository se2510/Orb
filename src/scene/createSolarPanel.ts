import * as THREE from 'three';

interface SolarPanelElements {
  group: THREE.Group;
  panel: THREE.Mesh;
}

/**
 * Crea un panel solar en el centro de la escena
 * El panel es una superficie cuadrada que se puede rotar en dos ejes:
 * - Inclinación (φ - Phi): rotación en el eje X (0° = horizontal, 90° = vertical)
 * - Azimut (A_panel): rotación en el eje Z vertical (0° = Sur, 90° = Oeste, -90° = Este)
 */
export const createSolarPanel = (scene: THREE.Scene): SolarPanelElements => {
  // Grupo principal del panel (para aplicar rotaciones)
  const panelGroup = new THREE.Group();
  // Elevar el panel para que sea visible y no se oculte debajo del domo
  panelGroup.position.set(0, 1.2, 0); // Centro de la escena, bien elevado
  
  // Geometría del panel: superficie rectangular más pequeña
  // Dimensiones: 1.5 unidades de ancho x 1 unidad de alto
  const panelGeometry = new THREE.PlaneGeometry(1.5, 1);
  
  // Material del panel: azul oscuro con efecto metálico para simular un panel solar
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a3a52,
    metalness: 0.7,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.castShadow = true;
  panel.receiveShadow = true;
  
  // Agregar el panel al grupo
  panelGroup.add(panel);
  
  // Crear un marco/borde para el panel
  const edgesGeometry = new THREE.EdgesGeometry(panelGeometry);
  const edgesMaterial = new THREE.LineBasicMaterial({ 
    color: 0x333333, 
    linewidth: 2 
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  panelGroup.add(edges);
  
  // Agregar el grupo a la escena
  scene.add(panelGroup);
  
  return {
    group: panelGroup,
    panel
  };
};

/**
 * Actualiza la orientación del panel solar
 * @param panelElements - Elementos del panel solar
 * @param inclination - Ángulo de inclinación φ (Phi) en grados (0° = horizontal, 90° = vertical)
 * @param azimuth - Azimut del panel en grados (0° = Sur, 90° = Oeste, -90° = Este)
 */
export const updatePanelOrientation = (
  panelElements: SolarPanelElements,
  inclination: number,
  azimuth: number
) => {
  const { group } = panelElements;
  
  // Convertir ángulos a radianes
  const inclinationRad = THREE.MathUtils.degToRad(inclination);
  const azimuthRad = THREE.MathUtils.degToRad(azimuth);
  
  // Usar Euler angles con orden específico para evitar gimbal lock
  // Orden YXZ: primero Y (azimut), luego X (inclinación), luego Z
  // 
  // La lógica es:
  // 1. El panel empieza horizontal (mirando hacia arriba en +Y)
  // 2. Primero rotamos en Y (azimut) para orientar hacia qué dirección mira
  // 3. Luego rotamos en X (inclinación) para levantarlo del suelo
  group.rotation.order = 'YXZ';
  group.rotation.set(inclinationRad, azimuthRad, 0);
};
