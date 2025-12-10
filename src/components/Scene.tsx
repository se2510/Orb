import React, { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import { setupCamera } from '../scene/setupCamera';
import { setupControls } from '../scene/setupControls';
import { createDome } from '../scene/createDome';
import { createLighting } from '../scene/createLighting';
import { createCardinalLabels } from '../scene/createCardinalLabels';
import { createCompass } from '../scene/createCompass';
import { createSun, updateSunPosition, updateSunPositionSolar, initializeSunTrail, clearSunTrail, drawFullDayTrajectory } from '../scene/createSun';
import { updateAngleReferences } from '../scene/createAngleReferences';
import { createSolarPanel, updatePanelOrientation } from '../scene/createSolarPanel';
import { createBuilding, updateBuildingOrientation } from '../scene/createBuilding';
import { createSky } from '../scene/createSky';
import { createGround } from '../scene/createGround';
import { createClouds } from '../scene/createClouds';
import { createStars } from '../scene/createStars';
import { createSkyGradientTexture } from '../scene/createSkyGradient';

interface SceneProps {
  sunAltitude: number;
  sunAzimuth: number;
  trajectory?: { altura: number; azimut: number }[]; // Trayectoria completa del día
  showAltitudeReference?: boolean;
  showAzimuthReference?: boolean;
  showWallSolarAzimuthReference?: boolean; // Si true, muestra referencia del ángulo azimut sol-pared
  showIncidenceAngle?: boolean; // Si true, muestra el ángulo de incidencia (θ)
  panelInclination?: number;
  panelAzimuth?: number;
  panelRows?: number;
  panelCols?: number;
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
  trajectory,
  showAltitudeReference = false,
  showAzimuthReference = false,
  showWallSolarAzimuthReference = false,
  showIncidenceAngle = false,
  panelInclination = 30,
  panelAzimuth = 0,
  panelRows = 2,
  panelCols = 3,
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
   const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const updateSkySunRef = useRef<((pos: THREE.Vector3) => void) | null>(null);
  // Referencia al objeto Sky y a la escena para manipulación avanzada
  const skyObjectRef = useRef<THREE.Object3D | null>(null);
  const skyWasRemovedRef = useRef<boolean>(false);
  const cloudsRef = useRef<ReturnType<typeof import('../scene/createClouds').createClouds> | null>(null);
  const starsRef = useRef<ReturnType<typeof import('../scene/createStars').createStars> | null>(null);

  // Effect para inicializar la escena (solo una vez)
  useEffect(() => {
    if (!containerRef.current) return;

    // Guardar referencia al contenedor para usarla en cleanup
    const container = containerRef.current;

    // Configuración de la escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Configuración del renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    rendererRef.current = renderer;
    // Forzar color de limpieza del renderer para evitar fondo blanco
      renderer.setClearColor('#87ceeb', 1); // Azul claro, opaco
    // Asegurar que el canvas tenga display block y sin márgenes
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    
    container.appendChild(renderer.domElement);

    // Configurar cámara
    const camera = setupCamera();

    // Configurar controles
    const controls = setupControls(camera, renderer.domElement);

    // Crear elementos de la escena
    // Cielo atmosférico
    const { sky, updateSunPosition: updateSkySun } = createSky(scene);
    updateSkySunRef.current = updateSkySun;
    skyObjectRef.current = sky;
    skyWasRemovedRef.current = false;
    // Precrear textura gradiente para fondo diurno
    const gradientTexture = createSkyGradientTexture('#87ceeb', '#1565c0');
    scene.userData.gradientTexture = gradientTexture;

    // Nubes
    const { group: cloudGroup, animate: animateClouds } = createClouds(scene, 12);
    cloudsRef.current = { group: cloudGroup, animate: animateClouds };

    // Estrellas
    const { group: starGroup, setVisible: setStarsVisible } = createStars(scene, 120);
    starsRef.current = { group: starGroup, setVisible: setStarsVisible };

    createDome(scene);
    createGround(scene);
    createLighting(scene);
    createCardinalLabels(scene);
    // createCardinalAxes(scene); // Reemplazado por la brújula más intuitiva
    createCompass(scene);
    
    // Crear el sol y guardarlo en ref
    const sun = createSun(scene);
    sunRef.current = sun;
    updateSunPosition(sun, sunAltitude, sunAzimuth);
    
    // Inicializar posición del sol en el cielo
    updateSkySun(sun.sphere.position);
    
    // Crear el panel solar o edificio según el modo
    if (useBuilding) {
      // Modo edificio: crear edificio con panel en el techo
      const building = createBuilding(scene, 1, 1, 1, panelRows, panelCols);
      buildingRef.current = building;
      updateBuildingOrientation(building, wallSolarAzimuth, panelInclination, panelAzimuth);
    } else {
      // Modo panel solo: crear array de paneles solares
      const panel = createSolarPanel(scene, panelRows, panelCols);
      panelRef.current = panel;
      updatePanelOrientation(panel, panelInclination, panelAzimuth);
    }
    
    // Notificar que la escena está lista (si hay callback)
    if (onSceneReady) {
      onSceneReady(scene, sun);
    }

    // Loop de animación
    let rafId: number | null = null;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Animar nubes
      if (cloudsRef.current) cloudsRef.current.animate();

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
      try {
        // Remove canvas from the original container captured above
        if (container && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      } catch (err) { void err; }

      try { renderer.dispose(); } catch (err) { void err; }
      try { controls.dispose(); } catch (err) { void err; }

      sunRef.current = null;
      panelRef.current = null;
      buildingRef.current = null;

      // Cancelar animación
      if (rafId != null) cancelAnimationFrame(rafId);

      // Dispose rendererRef if still present
      try {
        if (rendererRef.current) {
          rendererRef.current.dispose();
          const canvas = rendererRef.current.domElement;
          if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas);
          rendererRef.current = null;
        }
      } catch (e) { void e; }
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

      // Actualizar la posición del sol en el cielo atmosférico
      if (updateSkySunRef.current) {
        updateSkySunRef.current(sunRef.current.sphere.position);
      }

      // Usar fondo gradiente azul procedural cuando el sol está alto, y shader Sky cuando está bajo
      if (sceneRef.current && skyObjectRef.current) {
        if (sunAltitude > 80) {
          if (!skyWasRemovedRef.current) {
            sceneRef.current.remove(skyObjectRef.current);
            skyWasRemovedRef.current = true;
          }
          // Fondo gradiente azul procedural
          sceneRef.current.background = sceneRef.current.userData.gradientTexture;
          // Asegurar que el renderer limpie con azul claro
          if (rendererRef.current) {
            rendererRef.current.setClearColor('#b3e0ff', 1);
          }
        } else {
          if (skyWasRemovedRef.current) {
            sceneRef.current.add(skyObjectRef.current);
            skyWasRemovedRef.current = false;
          }
          sceneRef.current.background = null;
        }
      }

      // Mostrar/ocultar estrellas según la hora solar
      if (starsRef.current) {
        starsRef.current.setVisible(sunAltitude < 0);
      }
      }
  }, [sunAltitude, sunAzimuth, useSolarAngles]);

  // Effect para dibujar la trayectoria completa del día
  useEffect(() => {
    if (sceneRef.current && trajectory && trajectory.length > 0) {
      drawFullDayTrajectory(sceneRef.current, trajectory);
    }
  }, [trajectory]);

  // Effect para actualizar las referencias visuales de ángulos y el rayo incidente
  useEffect(() => {
    if (sceneRef.current && sunRef.current) {
      updateAngleReferences(
        sceneRef.current,
        showAltitudeReference,
        showAzimuthReference,
        sunAltitude,
        sunAzimuth,
        showWallSolarAzimuthReference,
        wallSolarAzimuth,
        showIncidenceAngle,
        panelInclination,
        panelAzimuth
      );

    }
  }, [showAltitudeReference, showAzimuthReference, sunAltitude, sunAzimuth, showWallSolarAzimuthReference, wallSolarAzimuth, showIncidenceAngle, panelInclination, panelAzimuth, trajectory]);

  // Effect para recrear el edificio o paneles cuando cambian las filas/columnas
  useEffect(() => {
    if (!sceneRef.current) return;

    // Limpiar objetos anteriores
    if (buildingRef.current) {
      sceneRef.current.remove(buildingRef.current.group);
      buildingRef.current = null;
    }
    if (panelRef.current) {
      sceneRef.current.remove(panelRef.current.group);
      panelRef.current = null;
    }
    if (useBuilding) {
      const building = createBuilding(sceneRef.current, 1, 1, 1, panelRows, panelCols);
      buildingRef.current = building;
      updateBuildingOrientation(building, wallSolarAzimuth, panelInclination, panelAzimuth);
    } else {
      const panel = createSolarPanel(sceneRef.current, panelRows, panelCols);
      panelRef.current = panel;
      updatePanelOrientation(panel, panelInclination, panelAzimuth);
    }
  }, [panelRows, panelCols, useBuilding]); // Recrear cuando cambian dimensiones o modo

  // Effect para actualizar la orientación del panel o edificio
  useEffect(() => {
    if (useBuilding && buildingRef.current) {
      // Modo edificio: actualizar orientación del edificio y panel
      updateBuildingOrientation(buildingRef.current, wallSolarAzimuth, panelInclination, panelAzimuth);
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
