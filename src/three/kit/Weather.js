// Weather and time-of-day helpers (Phase 3).
//   createRain        instanced rain streaks; frozen and faint under reduced motion
//   createSunArc      a sun travelling an arc with the hour (06:00–19:00)
//   createDaylight    blends lights, background and fog between night and day
//   swayTrees         wind-blown trees (no sway under reduced motion)

import * as THREE from 'three';
import { glowTexture, SCENE } from '../materials.js';

const lerp = (a, b, t) => a + (b - a) * t;

/** Rain over a rectangle. Returns { object3D, update(dt), setReducedMotion(on), intensity }. */
export function createRain({ x0 = -20, x1 = 20, z0 = -12, z1 = 10, top = 16, count = 900, wind = 0.25, speed = 15 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: '#A9C8FF', transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.7, 0.025), mat, count);
  mesh.frustumCulled = false;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const drops = Array.from({ length: count }, () => ({ x: lerp(x0, x1, rnd()), y: rnd() * top, z: lerp(z0, z1, rnd()) }));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -wind * 0.7));
  const s = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const rain = {
    object3D: mesh,
    intensity: 1,
    reduced: false,
    update(dt) {
      mesh.visible = rain.intensity > 0.01;
      if (!mesh.visible) return;
      mat.opacity = (rain.reduced ? 0.18 : 0.4) * Math.min(1, rain.intensity);
      const fall = rain.reduced ? 0 : speed * dt;
      for (let i = 0; i < count; i += 1) {
        const d = drops[i];
        d.y -= fall;
        d.x += fall * wind;
        if (d.y < 0) { d.y += top; d.x -= top * wind; }
        if (d.x > x1) d.x -= x1 - x0;
        m.compose(p.set(d.x, d.y, d.z), q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    setReducedMotion(on) { rain.reduced = on; },
    dispose() { mesh.geometry.dispose(); mat.dispose(); mesh.dispose(); },
  };
  rain.update(0);
  return rain;
}

/**
 * Sun on an arc behind the scene. setHour(h): rises at 06:00 (left), sets at 19:00 (right).
 * Returns { group, setHour(h), daylight(h) → 0..1, position }.
 */
export function createSunArc({ center = new THREE.Vector3(0, 0, -16), radius = 22, height = 0.75 } = {}) {
  const group = new THREE.Group();
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 14), new THREE.MeshBasicMaterial({ color: '#FFD27A', toneMapped: false }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#FFC24A', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
  halo.scale.setScalar(7);
  sun.add(halo);
  group.add(sun);

  // Faint dotted arc showing the sun's path.
  const pts = [];
  for (let i = 0; i <= 48; i += 1) {
    const a = Math.PI * (1 - i / 48);
    pts.push(new THREE.Vector3(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius * height, center.z));
  }
  const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const arc = new THREE.Line(arcGeo, new THREE.LineDashedMaterial({ color: '#FFD27A', dashSize: 0.6, gapSize: 0.6, transparent: true, opacity: 0.35 }));
  arc.computeLineDistances();
  group.add(arc);

  const position = new THREE.Vector3();
  const daylight = (h) => Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (h - 6) / 13))));
  return {
    group,
    position,
    daylight,
    setHour(h) {
      const t = (h - 6) / 13;
      const a = Math.PI * (1 - t);
      position.set(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius * height, center.z);
      sun.position.copy(position);
      sun.visible = t > -0.02 && t < 1.02;
    },
  };
}

/**
 * Blend a scene between night (0) and day (1): light intensities, colours, background, fog.
 * lights = { hemi, dir } from createBaseScene.
 */
export function createDaylight(scene, lights, { night = '#00041F', day = SCENE.background } = {}) {
  const nightC = new THREE.Color(night);
  const dayC = new THREE.Color(day);
  const moon = new THREE.Color('#9DB4FF');
  const white = new THREE.Color('#FFFFFF');
  const base = { hemi: lights.hemi.intensity, dir: lights.dir.intensity };
  return (amount) => {
    const t = Math.max(0, Math.min(1, amount));
    lights.hemi.intensity = lerp(base.hemi * 0.22, base.hemi, t);
    lights.dir.intensity = lerp(base.dir * 0.25, base.dir, t);
    lights.dir.color.copy(moon).lerp(white, t);
    scene.background.copy(nightC).lerp(dayC, t);
    if (scene.fog) scene.fog.color.copy(scene.background);
  };
}

/** Wind sway for single trees (pivot at the base). */
export function swayTrees(trees, t, strength) {
  trees.forEach((tree, i) => {
    tree.rotation.z = Math.sin(t * 1.9 + i * 1.3) * strength;
    tree.rotation.x = Math.sin(t * 1.3 + i * 0.7) * strength * 0.4;
  });
}
