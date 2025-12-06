import * as THREE from 'three';

export interface CloudElements {
  group: THREE.InstancedMesh | THREE.Group;
  animate: () => void;
  dispose?: () => void;
}

/**
 * Crea un grupo de nubes animadas usando planos con textura semitransparente
 * @param scene - Escena de Three.js
 * @param numClouds - Número de nubes
 */
export const createClouds = (scene: THREE.Scene, numClouds: number = 12): CloudElements => {
  // Usar InstancedMesh para mejorar rendimiento
  const textureLoader = new THREE.TextureLoader();
  const cloudTexture = textureLoader.load('/cloud.png');

  const planeGeom = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide });

  const inst = new THREE.InstancedMesh(planeGeom, material, numClouds);
  const dummy = new THREE.Object3D();

  // Store state for animation
  const instances: { x: number; y: number; z: number; rotY: number; scale: number; speed: number; }[] = [];

  for (let i = 0; i < numClouds; i++) {
    const w = 8 + Math.random() * 6;
    const h = 3 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    const radius = 18 + Math.random() * 6;
    const x = Math.cos(angle) * radius;
    const y = 6 + Math.random() * 2;
    const z = Math.sin(angle) * radius;
    const rotY = Math.random() * Math.PI * 2;
    const scale = Math.max(w, h) * 0.5;
    const speed = 0.002 + i * 0.0002;

    dummy.position.set(x, y, z);
    dummy.rotation.set(-Math.PI / 6, rotY, 0);
    dummy.scale.set(scale, scale, 1);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);

    instances.push({ x, y, z, rotY, scale, speed });
  }

  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);

  const animate = () => {
    for (let i = 0; i < instances.length; i++) {
      const s = instances[i];
      s.x += s.speed;
      if (s.x > 30) s.x = -30;
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(-Math.PI / 6, s.rotY, 0);
      dummy.scale.set(s.scale, s.scale, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  };

  const dispose = () => {
    try {
      inst.geometry.dispose();
      (inst.material as THREE.Material).dispose();
      if (cloudTexture) cloudTexture.dispose();
      inst.dispose();
    } catch (e) { void e; }
  };

  return { group: inst, animate, dispose };
};
