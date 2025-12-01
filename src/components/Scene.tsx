import React, { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import { setupCamera } from '../scene/setupCamera';
import { setupControls } from '../scene/setupControls';
import { createDome } from '../scene/createDome';
import { createLighting } from '../scene/createLighting';
import { createCardinalLabels } from '../scene/createCardinalLabels';
import { createCardinalAxes } from '../scene/createCardinalAxes';
import { createSun, updateSunPosition, updateSunPositionSolar, initializeSunTrail, clearSunTrail } from '../scene/createSun';
import { updateAngleReferences } from '../scene/createAngleReferences';
import { createSolarPanel, updatePanelOrientation } from '../scene/createSolarPanel';
import { createBuilding, updateBuildingOrientation } from '../scene/createBuilding';

interface SceneProps {
  sunAltitude: number;
  sunAzimuth: number;
  showAltitudeReference?: boolean;
  showAzimuthReference?: boolean;
  showWallSolarAzimuthReference?: boolean; // Si true, muestra referencia del ángulo azimut sol-pared
  panelInclination?: number;
  panelAzimuth?: number;
  wallSolarAzimuth?: number; // Ángulo azimut solar-pared (ψ) en grados
  useBuilding?: boolean; // Si true, usa edificio con panel en vez de panel solo
  useSolarAngles?: boolean; // Si true, usa ángulos solares reales (altura 0-90°, azimut 0-360°)
  showTrail?: boolean; // Si true, muestra la estela del sol
  clearTrail?: boolean; // Si true, limpia la estela (trigger)
  onSceneReady?: (scene: THREE.Scene, sunObject: ReturnType<typeof createSun>) => void; // Callback cuando la escena está lista
}

// Memoizamos el componente para evitar re-renders innecesarios
const Scene: React.FC<SceneProps> = memo(({ 
  sunAltitude, 
  sunAzimuth,
  showAltitudeReference = false,
  showAzimuthReference = false,
  showWallSolarAzimuthReference = false,
  panelInclination = 30,
  panelAzimuth = 0,
  wallSolarAzimuth = 0,
  useBuilding = false,
  useSolarAngles = false,
  showTrail = false,
  clearTrail = false,
  onSceneReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<ReturnType<typeof createSun> | null>(null);
  const panelRef = useRef<ReturnType<typeof createSolarPanel> | null>(null);
  const buildingRef = useRef<ReturnType<typeof createBuilding> | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Effect para inicializar la escena (solo una vez)
  useEffect(() => {
    if (!containerRef.current) return;

    // Configuración de la escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Cielo azul
    sceneRef.current = scene;

    // Configuración del renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Asegurar que el canvas tenga display block y sin márgenes
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    
    containerRef.current.appendChild(renderer.domElement);

    // Configurar cámara
    const camera = setupCamera();

    // Configurar controles
    const controls = setupControls(camera, renderer.domElement);

    // Crear elementos de la escena
    createDome(scene);
    createLighting(scene);
    createCardinalLabels(scene);
    createCardinalAxes(scene); // Vectores grandes para Norte-Sur y Este-Oeste
    
    // Crear el sol y guardarlo en ref
    const sun = createSun(scene);
    sunRef.current = sun;
    updateSunPosition(sun, sunAltitude, sunAzimuth);
    
    // Crear el panel solar o edificio según el modo
    if (useBuilding) {
      // Modo edificio: crear edificio con panel en el techo
      const building = createBuilding(scene);
      buildingRef.current = building;
      updateBuildingOrientation(building, wallSolarAzimuth, panelInclination);
    } else {
      // Modo panel solo: crear panel solar independiente
      const panel = createSolarPanel(scene);
      panelRef.current = panel;
      updatePanelOrientation(panel, panelInclination, panelAzimuth);
    }
    
    // Notificar que la escena está lista (si hay callback)
    if (onSceneReady) {
      onSceneReady(scene, sun);
    }

    // Loop de animación
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Manejo de redimensionamiento
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      controls.dispose();
      sunRef.current = null;
      panelRef.current = null;
      buildingRef.current = null;
    };
  }, []); // Solo se ejecuta una vez al montar

  // Effect separado para actualizar la posición del sol
  useEffect(() => {
    if (sunRef.current) {
      if (useSolarAngles) {
        // Usar ángulos solares reales (altura 0-90°, azimut 0-360°)
        updateSunPositionSolar(sunRef.current, sunAltitude, sunAzimuth);
      } else {
        // Usar sistema antiguo de la escena
        updateSunPosition(sunRef.current, sunAltitude, sunAzimuth);
      }
    }
  }, [sunAltitude, sunAzimuth, useSolarAngles]);

  // Effect para actualizar las referencias visuales de ángulos
  useEffect(() => {
    if (sceneRef.current) {
      updateAngleReferences(
        sceneRef.current,
        showAltitudeReference,
        showAzimuthReference,
        sunAltitude,
        sunAzimuth,
        showWallSolarAzimuthReference,
        wallSolarAzimuth
      );
    }
  }, [showAltitudeReference, showAzimuthReference, sunAltitude, sunAzimuth, showWallSolarAzimuthReference, wallSolarAzimuth]);

  // Effect para actualizar la orientación del panel o edificio
  useEffect(() => {
    if (useBuilding && buildingRef.current) {
      // Modo edificio: actualizar orientación del edificio y panel
      updateBuildingOrientation(buildingRef.current, wallSolarAzimuth, panelInclination);
    } else if (panelRef.current) {
      // Modo panel solo: actualizar orientación del panel
      updatePanelOrientation(panelRef.current, panelInclination, panelAzimuth);
    }
  }, [useBuilding, wallSolarAzimuth, panelInclination, panelAzimuth]);

  // Effect para inicializar la estela cuando showTrail cambia a true
  useEffect(() => {
    if (showTrail && sunRef.current && sceneRef.current) {
      initializeSunTrail(sunRef.current, sceneRef.current);
    }
  }, [showTrail]);

  // Effect para limpiar la estela cuando clearTrail cambia
  useEffect(() => {
    if (clearTrail && sunRef.current && sceneRef.current) {
      clearSunTrail(sunRef.current, sceneRef.current);
    }
  }, [clearTrail]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }} 
    />
  );
});

Scene.displayName = 'Scene';

export default Scene;
