import * as THREE from 'three';

interface BuildingElements {
  group: THREE.Group;
  building: THREE.Mesh;
  panel: THREE.Mesh;
  panelGroup: THREE.Group;
}

/**
 * Crea un edificio con un panel solar en el techo
 * El edificio es un cubo que representa una estructura y el panel está montado encima
 * 
 * @param scene - Escena de Three.js
 * @param buildingHeight - Altura del edificio (default: 1 unidad)
 * @param buildingWidth - Ancho del edificio (default: 1 unidad)
 * @param buildingDepth - Profundidad del edificio (default: 1 unidad)
 */
export const createBuilding = (
  scene: THREE.Scene,
  buildingHeight: number = 1,
  buildingWidth: number = 1,
  buildingDepth: number = 1
): BuildingElements => {
  // Grupo principal que contendrá el edificio y el panel
  const buildingGroup = new THREE.Group();
  buildingGroup.position.set(0, 0, 0);
  
  // ==================================
  // EDIFICIO
  // ==================================
  const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
  
  // Material del edificio: color concreto/gris con textura
  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.8,
    metalness: 0.2,
  });
  
  const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
  // Posicionar el edificio para que su base esté en y=0
  building.position.y = buildingHeight / 2;
  building.castShadow = true;
  building.receiveShadow = true;
  
  // Agregar bordes al edificio para mejor definición
  const buildingEdges = new THREE.EdgesGeometry(buildingGeometry);
  const buildingEdgesMaterial = new THREE.LineBasicMaterial({ 
    color: 0x444444, 
    linewidth: 2 
  });
  const buildingLines = new THREE.LineSegments(buildingEdges, buildingEdgesMaterial);
  building.add(buildingLines);
  
  buildingGroup.add(building);
  
  // ==================================
  // PANEL SOLAR EN EL TECHO
  // ==================================
  
  // Grupo del panel (para aplicar rotaciones independientes)
  const panelGroup = new THREE.Group();
  // Posicionar el panel encima del edificio con un pequeño offset para evitar solapamiento
  panelGroup.position.set(0, buildingHeight + 0.25, 0);
  
  // Geometría del panel: superficie rectangular más pequeña
  // Dimensiones: 0.7 unidades de ancho x 0.4 unidades de alto
  const panelGeometry = new THREE.PlaneGeometry(0.7, 0.4);
  
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
  
  // Agregar el panel al grupo del panel
  panelGroup.add(panel);
  
  // Crear un marco/borde para el panel
  const panelEdges = new THREE.EdgesGeometry(panelGeometry);
  const panelEdgesMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffd700, // Dorado para que resalte
    linewidth: 2 
  });
  const panelLines = new THREE.LineSegments(panelEdges, panelEdgesMaterial);
  panelGroup.add(panelLines);
  
  // Agregar el grupo del panel al grupo del edificio
  buildingGroup.add(panelGroup);
  
  // Agregar el grupo completo a la escena
  scene.add(buildingGroup);
  
  return {
    group: buildingGroup,
    building,
    panel,
    panelGroup
  };
};

/**
 * Actualiza la orientación del edificio y su panel
 * 
 * @param buildingElements - Elementos del edificio
 * @param wallSolarAzimuth - Ángulo azimut solar-pared (ψ) en grados
 *                           Este es el ángulo entre el Norte y la normal de la pared
 *                           0° = pared mirando al Sur, 90° = pared mirando al Oeste
 *                           -90° = pared mirando al Este, 180° = pared mirando al Norte
 * @param panelInclination - Ángulo de inclinación del panel (φ) en grados (0° = horizontal, 90° = vertical)
 */
export const updateBuildingOrientation = (
  buildingElements: BuildingElements,
  wallSolarAzimuth: number,
  panelInclination: number = 30
) => {
  const { group, panelGroup } = buildingElements;
  
  // Rotar el edificio completo según el azimut solar-pared
  // El edificio rota alrededor del eje Y (vertical)
  const wallAzimuthRad = THREE.MathUtils.degToRad(wallSolarAzimuth);
  group.rotation.y = wallAzimuthRad;
  
  // Actualizar orientación del panel
  // El panel siempre mira hacia adelante (en dirección -Z local del edificio)
  // y se inclina según el ángulo especificado
  const inclinationRad = THREE.MathUtils.degToRad(panelInclination);
  
  // Resetear rotación del panel
  panelGroup.rotation.set(0, 0, 0);
  
  // Aplicar inclinación (rotar alrededor del eje X local)
  panelGroup.rotation.x = inclinationRad;
  
  // Nota: El panel hereda la rotación Y del edificio, por lo que automáticamente
  // quedará orientado según la dirección de la pared
};

/**
 * Actualiza solo la inclinación del panel sin cambiar la orientación del edificio
 * 
 * @param buildingElements - Elementos del edificio
 * @param panelInclination - Ángulo de inclinación del panel (φ) en grados (0° = horizontal, 90° = vertical)
 */
export const updatePanelInclination = (
  buildingElements: BuildingElements,
  panelInclination: number
) => {
  const { panelGroup } = buildingElements;
  
  const inclinationRad = THREE.MathUtils.degToRad(panelInclination);
  panelGroup.rotation.x = inclinationRad;
};
