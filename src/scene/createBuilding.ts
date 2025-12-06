import * as THREE from 'three';
import { createSolarPanel, updatePanelOrientation, type SolarPanelElements } from './createSolarPanel';

interface BuildingElements {
  group: THREE.Group;
  building: THREE.Mesh;
  panelElements: SolarPanelElements;
}

/**
 * Crea un edificio con un array de paneles solares en el techo
 * 
 * @param scene - Escena de Three.js
 * @param buildingHeight - Altura del edificio (default: 1 unidad)
 * @param buildingWidth - Ancho del edificio (default: 1 unidad)
 * @param buildingDepth - Profundidad del edificio (default: 1 unidad)
 * @param panelRows - Filas de paneles
 * @param panelCols - Columnas de paneles
 */
export const createBuilding = (
  scene: THREE.Scene,
  buildingHeight: number = 0.6,
  buildingWidth: number = 0.6,
  buildingDepth: number = 0.6,
  panelRows: number = 2,
  panelCols: number = 3
): BuildingElements => {
  // Grupo principal que contendrá el edificio y el panel
  const buildingGroup = new THREE.Group();
  buildingGroup.position.set(0, 0, 0);
  
  // ==================================
  // EDIFICIO
  // ==================================
  // Ajustar tamaño del edificio según el array de paneles para que quepan
  // Dimensiones panel: 0.6 x 0.4, gaps: 0.08, 0.6 (Escalado x0.4)
  const panelW = 0.6;
  const panelH = 0.4;
  const gapX = 0.08;
  const gapZ = 0.6;
  
  const arrayWidth = panelCols * panelW + (panelCols - 1) * gapX;
  const arrayDepth = panelRows * panelH + (panelRows - 1) * gapZ;
  
  // El edificio debe ser al menos tan grande como el array + margen
  const finalWidth = Math.max(buildingWidth, arrayWidth + 0.4);
  const finalDepth = Math.max(buildingDepth, arrayDepth + 0.4);
  
  const buildingGeometry = new THREE.BoxGeometry(finalWidth, buildingHeight, finalDepth);
  
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
  // ARRAY DE PANELES EN EL TECHO
  // ==================================
  
  // Crear el array de paneles sin añadirlo a la escena (pasamos null)
  const panelElements = createSolarPanel(null, panelRows, panelCols);
  
  // Posicionar el grupo de paneles encima del edificio
  // createSolarPanel eleva los paneles a 0.5 por defecto
  // Queremos que estén justo encima del techo (0.1 de margen)
  // buildingHeight + 0.1 = groupY + 0.5  => groupY = buildingHeight - 0.4
  panelElements.group.position.set(0, buildingHeight - 0.4, 0); 
  // (0.5 - 0.4 = 0.1 de altura sobre el techo)
  
  buildingGroup.add(panelElements.group);
  
  // Agregar el grupo completo a la escena
  scene.add(buildingGroup);
  
  return {
    group: buildingGroup,
    building,
    panelElements
  };
};

/**
 * Actualiza la orientación del edificio y sus paneles
 */
export const updateBuildingOrientation = (
  buildingElements: BuildingElements,
  wallAzimuth: number,
  panelInclination: number,
  panelAzimuth: number
) => {
  const { group, panelElements } = buildingElements;
  
  // 1. Rotar todo el edificio (orientación de la pared/casa)
  const wallAzimuthRad = THREE.MathUtils.degToRad(wallAzimuth);
  group.rotation.y = wallAzimuthRad;
  
  // 2. Orientar los paneles
  // El azimut del panel es relativo al Norte geográfico.
  // Como el edificio ya está rotado, debemos compensar esa rotación
  // para que el panel apunte a la dirección absoluta deseada.
  // Azimut relativo = Azimut Absoluto - Azimut Edificio
  const relativePanelAzimuth = panelAzimuth - wallAzimuth;
  
  updatePanelOrientation(panelElements, panelInclination, relativePanelAzimuth);
};
