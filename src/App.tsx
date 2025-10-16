import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import FloatingLabel from './FloatingLabel';
import { useSolarPositions } from './useSolarPositions';
import './App.css';

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { sun, setSun, earth, setEarth, moon, setMoon } = useSolarPositions();
  const [panelPos, setPanelPos] = useState({ x: 0, z: 0 });
  const [panelRot, setPanelRot] = useState({ x: 0, y: 0 });
  // Estados eliminados porque no se usan

  useEffect(() => {
    if (!mountRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cleanupRef = mountRef.current;

    // Escena y cámara
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, 30);
  // Exponer la cámara globalmente para FloatingLabel
  // @ts-expect-error
  window._threeCamera = camera;
  // @ts-expect-error
  window.THREE = THREE;

  // Renderizador
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000010);
  cleanupRef.appendChild(renderer.domElement);

  // OrbitControls para mover la cámara con el mouse
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 10;
  controls.maxDistance = 100;
  controls.target.set(0, 0, 0);
  controls.update();

  // Exponer controls para reset desde UI
  // @ts-expect-error: expose controls for reset button
  window._threeControls = controls;

    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 0, 30);
    scene.add(pointLight);

    // Base Terrestre
    const baseGeometry = new THREE.PlaneGeometry(30, 30);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22, side: THREE.DoubleSide });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = -4;
    scene.add(baseMesh);

    // Panel Solar
    const panelGeometry = new THREE.PlaneGeometry(6, 4);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x3333ff, side: THREE.DoubleSide });
    const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh.position.set(panelPos.x, -3.8, panelPos.z);
    panelMesh.rotation.x = panelRot.x;
    panelMesh.rotation.y = panelRot.y;
    scene.add(panelMesh);

    // Sol
    const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.set(sun.x, sun.y, sun.z);
    scene.add(sunMesh);

    // Tierra
    const earthGeometry = new THREE.SphereGeometry(2, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x1e90ff });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.position.set(earth.x, earth.y, earth.z);
    scene.add(earthMesh);

    // Luna
    const moonGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.set(moon.x, moon.y, moon.z);
    scene.add(moonMesh);

    // Drag controls para panel solar
    let selectedPanel = false;
    let rotateMode = false;
    renderer.domElement.addEventListener('pointerdown', (e: PointerEvent) => {
      const mouse = new THREE.Vector2(
        (e.clientX / width) * 2 - 1,
        -(e.clientY / height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(panelMesh);
      if (intersects.length > 0) {
        if (e.shiftKey) {
          rotateMode = true;
        } else {
          selectedPanel = true;
        }
      }
    });
    renderer.domElement.addEventListener('pointerup', () => {
      selectedPanel = false;
      rotateMode = false;
    });
    renderer.domElement.addEventListener('pointermove', (e: PointerEvent) => {
      if (selectedPanel) {
        const mouse = new THREE.Vector2(
          (e.clientX / width) * 2 - 1,
          -(e.clientY / height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), -3.8);
        const intersect = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(planeY, intersect)) {
          panelMesh.position.x = intersect.x;
          panelMesh.position.z = intersect.z;
          setPanelPos({ x: intersect.x, z: intersect.z });
        }
      }
      if (rotateMode) {
        // Rotar el panel con movimiento horizontal/vertical del mouse
        panelMesh.rotation.x += e.movementY * 0.01;
        panelMesh.rotation.y += e.movementX * 0.01;
        setPanelRot({ x: panelMesh.rotation.x, y: panelMesh.rotation.y });
      }
    });

    // Drag controls para sol, tierra y luna
    // Drag controls solo para la luna
    let selected: THREE.Object3D | null = null;
    renderer.domElement.addEventListener('pointerdown', (e: PointerEvent) => {
      const mouse = new THREE.Vector2(
        (e.clientX / width) * 2 - 1,
        -(e.clientY / height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([moonMesh]);
      if (intersects.length > 0) {
        selected = intersects[0].object;
      }
    });
    renderer.domElement.addEventListener('pointerup', () => {
      selected = null;
    });
    renderer.domElement.addEventListener('pointermove', (e: PointerEvent) => {
      if (selected) {
        const mouse = new THREE.Vector2(
          (e.clientX / width) * 2 - 1,
          -(e.clientY / height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersect = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(planeZ, intersect)) {
          selected.position.x = intersect.x;
          selected.position.y = intersect.y;
          // Actualizar estado React
          setMoon(m => ({ ...m, x: intersect.x, y: intersect.y }));
        }
      }
    });

    // Cálculo de ángulos solares
    const calcAngles = () => {
      // Vector del sol al panel
      const sunVec = new THREE.Vector3(sunMesh.position.x, sunMesh.position.y, sunMesh.position.z);
      const panelPosVec = new THREE.Vector3(panelMesh.position.x, panelMesh.position.y, panelMesh.position.z);
      const panelNormal = new THREE.Vector3(0, 1, 0)
        .applyEuler(panelMesh.rotation);
      const raySunPanel = sunVec.clone().sub(panelPosVec).normalize();
      // Si necesitas mostrar estos valores, puedes calcularlos aquí y usarlos directamente
    };

    // Animación
    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      calcAngles();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupRef.removeChild(renderer.domElement);
    };
  }, [sun, earth, moon, setSun, setEarth, setMoon, panelPos, panelRot]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div
        ref={mountRef}
        style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '3rem',
          fontWeight: 'bold',
          textShadow: '0 2px 16px #000',
          pointerEvents: 'none',
        }}
      >
        {/* Etiquetas flotantes */}
        {mountRef.current && (
          <>
            {/* Sol */}
            <FloatingLabel refDiv={mountRef} objectPos={{ x: sun.x, y: sun.y, z: sun.z }} label="Sol" color="#ffd700" />
            {/* Tierra */}
            <FloatingLabel refDiv={mountRef} objectPos={{ x: earth.x, y: earth.y, z: earth.z }} label="Tierra" color="#1e90ff" />
            {/* Panel Solar */}
            <FloatingLabel refDiv={mountRef} objectPos={{ x: panelPos.x, y: -3.8, z: panelPos.z }} label="Panel Solar" color="#3333ff" />
          </>
        )}
      </div>
      <div style={{ position: 'absolute', left: 24, top: 24, zIndex: 20, background: 'rgba(30,30,30,0.92)', padding: '1rem', borderRadius: '12px', color: '#fff', minWidth: '260px', boxShadow: '0 2px 8px #000' }}>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ color: '#ffd700', fontWeight: 'bold', marginRight: 8 }}>Sol (ciclo solar):</label>
          <input
            type="range"
            min={0}
            max={180}
            value={Math.round((Math.atan2(sun.y, sun.x) * 180 / Math.PI + 180) % 180)}
            onChange={e => {
              // Mover el sol en circunferencia de radio fijo
              const angle = Number(e.target.value) * Math.PI / 180;
              const radius = 15;
              setSun({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: sun.z });
            }}
            style={{ width: 180 }}
          />
        </div>
      </div>
    </div>
  );
}
  export default App;
