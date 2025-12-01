import React, { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import { setupCamera } from '../scene/setupCamera';
import { setupControls } from '../scene/setupControls';
import { createDome } from '../scene/createDome';
import { createLighting } from '../scene/createLighting';
import { createCardinalLabels } from '../scene/createCardinalLabels';
import { createCardinalAxes } from '../scene/createCardinalAxes';
import { createSun, updateSunPosition } from '../scene/createSun';
import { updateAngleReferences } from '../scene/createAngleReferences';
import { createSolarPanel, updatePanelOrientation } from '../scene/createSolarPanel';

interface SceneProps {
  sunAltitude: number;
  sunAzimuth: number;
  showAltitudeReference?: boolean;
  showAzimuthReference?: boolean;
  panelInclination?: number;
  panelAzimuth?: number;
}

// Memoizamos el componente para evitar re-renders innecesarios
const Scene: React.FC<SceneProps> = memo(({ 
  sunAltitude, 
  sunAzimuth,
  showAltitudeReference = false,
  showAzimuthReference = false,
  panelInclination = 30,
  panelAzimuth = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<ReturnType<typeof createSun> | null>(null);
  const panelRef = useRef<ReturnType<typeof createSolarPanel> | null>(null);
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
    
    // Crear el panel solar y guardarlo en ref
    const panel = createSolarPanel(scene);
    panelRef.current = panel;
    updatePanelOrientation(panel, panelInclination, panelAzimuth);

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
    };
  }, []); // Solo se ejecuta una vez al montar

  // Effect separado para actualizar la posición del sol
  useEffect(() => {
    if (sunRef.current) {
      updateSunPosition(sunRef.current, sunAltitude, sunAzimuth);
    }
  }, [sunAltitude, sunAzimuth]);

  // Effect para actualizar las referencias visuales de ángulos
  useEffect(() => {
    if (sceneRef.current) {
      updateAngleReferences(
        sceneRef.current,
        showAltitudeReference,
        showAzimuthReference,
        sunAltitude,
        sunAzimuth
      );
    }
  }, [showAltitudeReference, showAzimuthReference, sunAltitude, sunAzimuth]);

  // Effect para actualizar la orientación del panel
  useEffect(() => {
    if (panelRef.current) {
      updatePanelOrientation(panelRef.current, panelInclination, panelAzimuth);
    }
  }, [panelInclination, panelAzimuth]);

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
