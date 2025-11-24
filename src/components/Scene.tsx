import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { setupCamera } from '../scene/setupCamera';
import { setupControls } from '../scene/setupControls';
import { createDome } from '../scene/createDome';
import { createLighting } from '../scene/createLighting';
import { createCardinalLabels } from '../scene/createCardinalLabels';
import { createSun, updateSunPosition } from '../scene/createSun';

interface SceneProps {
  sunAltitude: number;
  sunAzimuth: number;
}

const Scene: React.FC<SceneProps> = ({ sunAltitude, sunAzimuth }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<ReturnType<typeof createSun> | null>(null);

  // Effect para inicializar la escena (solo una vez)
  useEffect(() => {
    if (!containerRef.current) return;

    // Configuración de la escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Cielo azul

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
    
    // Crear el sol y guardarlo en ref
    const sun = createSun(scene);
    sunRef.current = sun;
    updateSunPosition(sun, sunAltitude, sunAzimuth);

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
    };
  }, []); // Solo se ejecuta una vez al montar

  // Effect separado para actualizar la posición del sol
  useEffect(() => {
    if (sunRef.current) {
      updateSunPosition(sunRef.current, sunAltitude, sunAzimuth);
    }
  }, [sunAltitude, sunAzimuth]);

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
};

export default Scene;
