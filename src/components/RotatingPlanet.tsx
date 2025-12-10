import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface RotatingPlanetProps {
  size?: number;
  className?: string;
}

const RotatingPlanet: React.FC<RotatingPlanetProps> = ({ size = 64, className }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reqRef = useRef<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene / camera / renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    // Limit device pixel ratio for performance (keeps crisp without over-rendering)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(size, size, false);
    (renderer as any).outputEncoding = (THREE as any).sRGBEncoding;
    mount.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // Geometry + Material (sun-like)
    const segments = 32; // balanced for quality / perf
    const geometry = new THREE.SphereGeometry(1, segments, segments);

    // Create a canvas texture that resembles solar surface with warm gradient and subtle spots
    const texSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;

    // radial warm background
    const rg = ctx.createRadialGradient(texSize / 2, texSize / 2, texSize * 0.1, texSize / 2, texSize / 2, texSize / 1.2);
    rg.addColorStop(0, '#fff8e1');
    rg.addColorStop(0.25, '#ffd54f');
    rg.addColorStop(0.6, '#ff8a65');
    rg.addColorStop(1, '#ff7043');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, texSize, texSize);

    // Add stronger procedural darker patches (simulated sunspots) for contrast
    for (let i = 0; i < 45; i++) {
      const radius = Math.random() * (texSize * 0.09) + texSize * 0.01;
      const x = Math.random() * texSize;
      const y = Math.random() * texSize;
      const alpha = 0.06 + Math.random() * 0.28; // stronger
      // darker core
      ctx.beginPath();
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      // subtle halo
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,180,100,${Math.max(0, (alpha - 0.04))})`;
      ctx.arc(x + radius * 0.15, y - radius * 0.12, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add brighter flares / streaks with 'lighter' composite to increase contrast
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) {
      const grd = ctx.createLinearGradient(Math.random() * texSize, Math.random() * texSize, Math.random() * texSize, Math.random() * texSize);
      grd.addColorStop(0, 'rgba(255,255,255,0.02)');
      grd.addColorStop(0.5, 'rgba(255,255,255,0.08)');
      grd.addColorStop(1, 'rgba(255,240,200,0.01)');
      ctx.fillStyle = grd;
      // draw a thin rotated rectangle as streak
      ctx.save();
      const cx = Math.random() * texSize;
      const cy = Math.random() * texSize;
      ctx.translate(cx, cy);
      ctx.rotate((Math.random() - 0.5) * 2);
      ctx.fillRect(-texSize * 0.6, -texSize * 0.04, texSize * 1.2, texSize * 0.08);
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Add a multiply layer to deepen edges for more globe contrast
    const multGrad = ctx.createRadialGradient(texSize / 2, texSize / 2, texSize * 0.4, texSize / 2, texSize / 2, texSize);
    multGrad.addColorStop(0, 'rgba(255,255,255,0)');
    multGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = multGrad;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, texSize, texSize);
    ctx.globalCompositeOperation = 'source-over';

    const texture = new THREE.CanvasTexture(canvas);
    (texture as any).encoding = (THREE as any).sRGBEncoding;
    texture.needsUpdate = true;

    // Make material slightly shinier and with stronger emissive behavior for contrast
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.0,
      emissive: new THREE.Color(0xffe0b0),
      emissiveIntensity: 1.0,
      emissiveMap: texture
    });

    const sphere = new THREE.Mesh(geometry, material);
    // slight axial tilt for nicer spin
    sphere.rotation.z = THREE.MathUtils.degToRad(10);
    scene.add(sphere);

    // Add a subtle glowing sprite behind the sphere to emulate bloom/glow (additive blending)
    const glowCanvas = document.createElement('canvas');
    const gSize = 256;
    glowCanvas.width = gSize;
    glowCanvas.height = gSize;
    const gctx = glowCanvas.getContext('2d')!;
    const gg = gctx.createRadialGradient(gSize / 2, gSize / 2, 0, gSize / 2, gSize / 2, gSize / 2);
    gg.addColorStop(0, 'rgba(255,240,200,0.9)');
    gg.addColorStop(0.2, 'rgba(255,200,120,0.6)');
    gg.addColorStop(0.5, 'rgba(255,150,80,0.25)');
    gg.addColorStop(1, 'rgba(255,120,50,0)');
    gctx.fillStyle = gg;
    gctx.fillRect(0, 0, gSize, gSize);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    (glowTex as any).encoding = (THREE as any).sRGBEncoding;
    const spriteMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.4, 3.4, 1);
    sprite.position.set(0, 0, -0.12);
    scene.add(sprite);

    // Add a small point light to enhance the effect in case the scene uses PBR
    const point = new THREE.PointLight(0xfff0c8, 0.8, 10, 2);
    point.position.set(2, 2, 2);
    scene.add(point);

    // Resize handling (keep small and square)
    const resize = () => {
      const w = size;
      const h = size;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    // Animation loop: rotate horizontally (around Y axis) and pulse emissive intensity
    const start = performance.now();
    const pulseSpeed = 0.9; // seconds
    const animate = (now: number) => {
      const t = (now - start) / 1000;
      // gentle horizontal spin
      sphere.rotation.y = t * 0.5; // a bit faster to showcase texture variation

      // animate texture offset slightly to create moving surface variation (gives stronger sense of rotation)
      texture.offset.x = (t * 0.08) % 1;

      // pulse emissive intensity for stronger glow
      const emissiveBase = 1.0;
      const emissivePulse = 0.6 * Math.abs(Math.sin(t * Math.PI * pulseSpeed));
      (material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveBase + emissivePulse;

      // pulse sprite opacity a bit to simulate flare
      sprite.material.opacity = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.7));

      renderer.render(scene, camera);
      reqRef.current = requestAnimationFrame(animate);
    };

    resize();
    reqRef.current = requestAnimationFrame(animate);

    // Clean up on unmount
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);

      // remove objects from scene
      scene.remove(sphere);
      scene.remove(sprite);
      scene.remove(point);
      scene.remove(hemi);
      scene.remove(dir);

      // dispose geometries, materials and textures
      try {
        geometry.dispose();
      } catch (e) {}

      try {
        (material as THREE.MeshStandardMaterial).dispose();
      } catch (e) {}

      try {
        texture.dispose();
      } catch (e) {}

      try {
        if (glowTex) glowTex.dispose();
      } catch (e) {}

      try {
        if (spriteMat) spriteMat.dispose();
      } catch (e) {}

      // dispose renderer
      try {
        renderer.dispose();
        // remove canvas DOM
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        // try to free GL context
        // @ts-ignore
        if (renderer.getContext) {
          // @ts-ignore
          const gl = renderer.getContext();
          if (gl && typeof gl.getExtension === 'function') {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext && typeof ext.loseContext === 'function') ext.loseContext();
          }
        }
      } catch (e) {}
    };
  }, [size]);

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: 'inline-block',
    lineHeight: 0,
  };

  return <div ref={mountRef} className={className} style={wrapperStyle} />;
};

export default RotatingPlanet;
