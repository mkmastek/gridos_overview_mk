// Slide 2 — GE Vernova portfolio: three islands (Power, Wind, Electrification) on the map
// table, with GridOS glowing above Electrification and data rising from all three.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline } from './common.js';
import { createSMR, createHydroDam, createOffshoreTurbine, createSteamUnit, createWater } from '../kit/Generation.js';
import {
  createGISBay, createLiveTankBreaker, createPowerTransformer, createHVDCHall,
  createStatcom, createRelayCabinet, createSyncCondenser, createBessContainer,
} from '../kit/Equipment.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TOP = 0.6; // island surface height

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const { scene, camera } = A.createBaseScene({ ground: { width: 86, depth: 40 }, shadowExtent: 44, fogNear: 80, fogFar: 190 });
  const S = { p: 0.55, w: 0.55, e: 0.55, os: 0.3, beams: 0, pk: 0 };
  const flows = [];
  const hoverables = [];

  // ── Islands ─────────────────────────────────────────────────
  const islandDefs = [
    { key: 'p', x: -24, tint: M.BRAND.yellow, label: 'power' },
    { key: 'w', x: 0, tint: M.BRAND.green, label: 'wind' },
    { key: 'e', x: 24, tint: M.BRAND.lightBlue, label: 'electrification' },
  ];
  const islands = islandDefs.map((d) => {
    const geo = new THREE.CylinderGeometry(8.6, 9.1, TOP, 6);
    const mat = M.stdMat('#0B2A7A', { emissive: d.tint, emissiveIntensity: 0.1 });
    const plate = new THREE.Mesh(geo, mat);
    plate.position.set(d.x, TOP / 2, 0);
    plate.rotation.y = Math.PI / 6;
    plate.receiveShadow = true;
    const edgeMat = new THREE.LineBasicMaterial({ color: d.tint, transparent: true, opacity: 0.5, toneMapped: false });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    edges.position.copy(plate.position);
    edges.rotation.copy(plate.rotation);
    scene.add(plate, edges);
    // At the island's front edge, hanging towards the viewer (clear of GridOS above).
    const label = L.label(lab[d.label], { variant: 'big' });
    label.element.style.whiteSpace = 'normal';
    label.element.style.maxWidth = '210px';
    label.position.set(d.x, TOP + 0.3, 9.4);
    label.center.set(0.5, -0.1);
    scene.add(label);
    return { ...d, mat, edgeMat, label };
  });

  // Products: each group carries userData.tip for the hover tooltip.
  const place = (obj, key, x, z, s = 1, ry = 0) => {
    obj.position.set(x, TOP, z);
    obj.scale.setScalar(s);
    obj.rotation.y = ry;
    obj.userData.tip = key;
    scene.add(obj);
    hoverables.push(obj);
    return obj;
  };

  // Power island
  place(A.createGasPlant(), 'gas', -27.5, -2.5, 0.75);
  place(createSMR(), 'smr', -19.5, -3);
  const dam = createHydroDam({ width: 5 });
  place(dam.group, 'hydro', -26, 3.8, 0.85);
  place(createSteamUnit(), 'steam', -20.5, 3.4, 0.8);

  // Wind island: onshore at the back, offshore on water at the front
  const rotors = [];
  for (const [x, z] of [[-4, -3.2], [0, -4.6], [4, -3.2]]) {
    const t = A.createWindTurbine({ height: 6 });
    t.rotor.rotation.x = Math.random() * Math.PI;
    place(t.group, 'onshore', x, z);
    rotors.push(t.rotor);
  }
  const sea = createWater(13, 5.6);
  sea.position.set(0, TOP + 0.04, 4.2);
  scene.add(sea);
  for (const [x, z] of [[-3, 4.6], [3, 4.2]]) {
    const t = createOffshoreTurbine({ height: 5.4, radius: 1.9 });
    t.rotor.rotation.x = Math.random() * Math.PI;
    place(t.group, 'offshore', x, z);
    rotors.push(t.rotor);
  }

  // Electrification island
  place(createGISBay(), 'gis', 19, -3.3);
  place(createLiveTankBreaker(), 'breaker', 22.6, -3.8, 0.9);
  place(createPowerTransformer(), 'transformer', 26.4, -3.2, 0.9);
  place(createHVDCHall(), 'hvdc', 24.5, 2.8, 0.8);
  place(createStatcom(), 'statcom', 18.8, 2.4, 0.8);
  const relay = createRelayCabinet();
  place(relay.group, 'relay', 29.5, -1.4);
  place(createSyncCondenser(), 'condenser', 29.4, 2.6, 0.7);
  place(createBessContainer(), 'bess', 20.6, 5.6, 0.8);

  // A small town that receives the power
  const town = A.createHouses([
    { x: 35.5, z: -3.5 }, { x: 37.2, z: -3.5 }, { x: 35.5, z: -1.3 }, { x: 37.2, z: -1.3, solar: true },
    { x: 35.5, z: 1.0, solar: true }, { x: 37.2, z: 1.0 }, { x: 35.5, z: 3.3 }, { x: 37.2, z: 3.3, solar: true },
  ]);
  scene.add(town.group);
  scene.add(A.createTrees([[-36, -6], [-35, 6], [-12, -10], [-11, 9], [11, -10], [12, 9], [34, -8], [39, 6]].map(([x, z], i) => ({ x, z, s: 1 + (i % 3) * 0.15 }))));

  // ── Power lines: Power and Wind feed the grid equipment, which feeds the town ──
  const wireMat = M.stdMat('#8C98AC', { metalness: 0.5, roughness: 0.4 });
  const line = (pts, key, opts = {}) => {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.2);
    const ptsDense = curve.getPoints(60);
    scene.add(A.createConductor(ptsDense, wireMat, 0.05));
    const f = new F.PowerFlow({ path: ptsDense, color: M.PALETTE.flow, velocity: 5, ...opts });
    f.key = key;
    scene.add(f.object3D);
    flows.push(f);
    return f;
  };
  line([V(-21, 1.4, -6.5), V(-15, 2.2, -10.2), V(0, 2.4, -10.6), V(15, 2.2, -10.2), V(21, 1.4, -6.5)], 'p');
  line([V(2, 1.4, -6.8), V(9, 2.2, -10.2), V(16, 1.8, -8.6), V(19.6, 1.4, -6.2)], 'w');
  line([V(30.5, 1.4, 0.2), V(32.5, 1.8, 0.2), V(34.4, 1.2, 0.2)], 'e', { density: 2 });

  // ── GridOS above Electrification ─────────────────────────────
  const SLAB_Y = 11.5;
  const slab = A.createGlassSlab({ width: 15, depth: 10, thickness: 0.45, color: M.PALETTE.data, opacity: 0.16 });
  slab.group.position.set(24, SLAB_Y, 0);
  slab.body.userData.tip = 'gridos';
  hoverables.push(slab.body);
  scene.add(slab.group);
  const lGridos = L.label(lab.gridos, { variant: 'big accent' });
  lGridos.position.set(24, SLAB_Y + 0.4, 5);
  scene.add(lGridos);

  // Data rising from each island to GridOS (step 4): labelled trails + a continuous stream.
  const dataPaths = [
    new THREE.QuadraticBezierCurve3(V(-24, 5, 0), V(-2, 16, 0), V(19, SLAB_Y - 0.3, 0)),
    new THREE.QuadraticBezierCurve3(V(0, 7, -2), V(10, 14, -1), V(21.5, SLAB_Y - 0.3, -1)),
    new THREE.QuadraticBezierCurve3(V(24, 3.5, 0.5), V(24, 7, 0.5), V(24, SLAB_Y - 0.3, 0.5)),
  ];
  const trails = dataPaths.map((path, i) => {
    const t = new F.PacketTrail({ path, color: M.PALETTE.data, label: i < 2 ? { text: content.packets.data, kind: 'data' } : null });
    scene.add(t.object3D);
    flows.push(t);
    return t;
  });
  const stream = new F.PacketStream({ paths: dataPaths, color: M.PALETTE.data, perPath: 4, velocity: 6, intensity: 0 });
  scene.add(stream.object3D);
  flows.push(stream);
  const beam = A.createBeam(V(24, 3.2, 0.5), V(24, SLAB_Y - 0.25, 0.5), { color: M.PALETTE.data, radius: 0.08, opacity: 0 });
  scene.add(beam);

  // ── Product labels (shown for the island in focus) ──────────
  // Heights are staggered so neighbouring product labels do not collide in the close-ups.
  const productLabels = [
    ['gas', 'p', -27.5, 6.0, -2.5], ['smr', 'p', -19.5, 3.0, -3], ['hydro', 'p', -26, 3.4, 4.2],
    ['onshore', 'w', 0, 6.9, -4.6], ['offshore', 'w', 3, 5.0, 4.2],
    ['gis', 'e', 19, 4.4, -3.3], ['hvdc', 'e', 26.0, 4.0, 2.8], ['statcom', 'e', 18.4, 2.2, 3.4],
  ].map(([key, island, x, y, z]) => {
    const l = L.label(lab[key]);
    l.element.style.whiteSpace = 'normal';
    l.element.style.maxWidth = '140px';
    l.position.set(x, y, z);
    scene.add(l);
    return { l, island };
  });

  // ── Timeline ────────────────────────────────────────────────
  const timeline = stepTimeline([1.8, 1.8, 1.8, 3.0], (tl, at, k) => {
    const q = (dt) => `${at}+=${dt}`;
    if (k === 1) tl.to(S, { p: 1, w: 0.25, e: 0.25, duration: 1.0, ease: 'power2.out' }, q(0));
    if (k === 2) tl.to(S, { p: 0.25, w: 1, duration: 1.0, ease: 'power2.inOut' }, q(0));
    if (k === 3) tl.to(S, { w: 0.25, e: 1, duration: 1.0, ease: 'power2.inOut' }, q(0));
    if (k === 4) {
      tl.to(S, { p: 0.6, w: 0.6, e: 1, os: 1, duration: 1.0, ease: 'power2.inOut' }, q(0));
      tl.to(S, { pk: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.4));
      tl.to(S, { beams: 1, duration: 0.6 }, q(0.6));
    }
  });

  const presets = {
    overview: { pos: [1, 34, 65], target: [1, 4, 0] },
    power: { pos: [-24, 13, 21], target: [-23.5, 2.5, 0] },
    wind: { pos: [0, 13.5, 24], target: [0, 3.8, 0] },
    elec: { pos: [25, 12, 20], target: [24.5, 2.5, 0.5] },
    software: { pos: [8, 23, 44], target: [9, 6, 0] },
  };

  const update = (dt, t) => {
    const sw = Math.max(0, (S.os - 0.3) / 0.7); // software step progress (glow starts at 0.3)
    for (const r of rotors) r.rotation.x += dt * 1.1;
    // In an island close-up, the other islands' labels would sit at the frame edges: hide them.
    const focus = sw < 0.1 ? islands.find((isl) => S[isl.key] > 0.9)?.key : null;
    for (const isl of islands) {
      const h = S[isl.key];
      isl.mat.emissiveIntensity = 0.04 + 0.32 * h;
      isl.edgeMat.opacity = 0.2 + 0.8 * h;
      const products = Math.max(0, Math.min(1, (h - 0.65) / 0.35)) * (1 - sw);
      const others = focus && focus !== isl.key ? 0 : 1;
      L.setLabelOpacity(isl.label, (0.45 + 0.55 * h) * (1 - products) * (isl.key === 'e' ? 1 : 1 - sw) * others);
      isl.label.element.classList.toggle('label3d--accent', h > 0.95);
    }
    for (const { l, island } of productLabels) L.setLabelOpacity(l, ((S[island] - 0.65) / 0.35) * (1 - sw));
    for (const f of flows) {
      if (f.key) { f.intensity = 0.35 + 0.65 * S[f.key]; f.update(dt); }
    }
    trails.forEach((t) => t.setProgress(S.pk));
    stream.intensity = S.beams;
    stream.update(dt);
    beam.material.opacity = 0.45 * S.beams;
    slab.setGlow(S.os);
    L.setLabelOpacity(lGridos, 0.55 + 0.45 * S.os);
    relay.ledMaterial.opacity = 0.6 + 0.4 * Math.sin(t * 4);
  };

  const onHover = (ray) => {
    const hit = ray.intersectObjects(hoverables, true)[0];
    if (!hit) return null;
    for (let o = hit.object; o; o = o.parent) {
      if (o.userData.tip) return { tip: content.productTips[o.userData.tip] };
    }
    return null;
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update, onHover,
    steps: stepsFromContent(content, ['power', 'wind', 'elec', 'software']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 8, maxDistance: 120 },
  });
}
