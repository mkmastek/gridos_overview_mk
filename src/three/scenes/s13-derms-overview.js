// Slide 13 — DERMS (Distributed Energy Resource Management System): eight modules.
// An "assembly line" of glass module blocks floats above a neighbourhood of solar homes,
// batteries and EV chargers. Data runs Model Manager → Forecasting → Optimization →
// Gateway → devices; device status rises to Operations; Program Manager and Markets
// Orchestration feed Optimization from the side; Flex Planning sits apart in study mode.
// The last step splits the picture into the grid side and the edge side.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const MAIN_Y = 8.5;
const MAIN_Z = -3;
const MODULES = {
  modelManager: V(-12, MAIN_Y, MAIN_Z),
  forecasting: V(-6, MAIN_Y, MAIN_Z),
  optimization: V(0, MAIN_Y, MAIN_Z),
  gateway: V(6, MAIN_Y, MAIN_Z),
  operations: V(12.8, 9.4, -3.6),
  programManager: V(-6, 12.4, -7.5),
  markets: V(0, 12.4, -7.5),
  flex: V(-13, 12.8, -9),
};
// Step k (1..8) highlights this module.
const ORDER = ['modelManager', 'forecasting', 'optimization', 'gateway', 'operations', 'programManager', 'markets', 'flex'];

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const { scene, camera } = A.createBaseScene({ ground: { width: 50, depth: 34 }, shadowExtent: 28, fogNear: 70, fogFar: 150 });
  const flows = [];
  const S = { h1: 0.2, h2: 0.2, h3: 0.2, h4: 0.2, h5: 0.2, h6: 0.2, h7: 0.2, h8: 0.2, dim: 0, split: 0, sched: 0, status: 0 };

  // ── Neighbourhood ────────────────────────────────────────────
  const houses = [];
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 7; c += 1) {
      const i = r * 7 + c;
      houses.push({ x: -9 + c * 3, z: r ? 6 : 2.6, rot: r ? Math.PI : 0, solar: i % 3 !== 2, battery: i % 4 === 1, ev: i % 5 === 3 });
    }
  }
  scene.add(A.createHouses(houses).group);
  const battery = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.2), M.stdMat('#E8EDF4', { emissive: M.PALETTE.restored, emissiveIntensity: 0.15 }));
  battery.position.set(13, 0.6, 4.2);
  battery.castShadow = true;
  scene.add(battery);
  scene.add(A.createTrees([[-16, 1], [-15, 7], [17, 8], [-4, 10], [5, 10.5]].map(([x, z], i) => ({ x, z, s: 0.9 + (i % 3) * 0.15 }))));
  const devices = [0, 1, 4, 7, 9, 12].map((i) => V(houses[i].x, 1.7, houses[i].z));
  devices.push(V(13, 1.4, 4.2)); // community battery

  // ── Module blocks ────────────────────────────────────────────
  const blocks = {};
  for (const [key, pos] of Object.entries(MODULES)) {
    let block;
    if (key === 'operations') {
      block = A.createGlassPanel({ width: 5, height: 3.2, color: M.BRAND.lightBlue });
      block.setGlow = (v) => { block.edgeMaterial.opacity = 0.3 + 0.7 * v; block.material.opacity = 0.1 + 0.25 * v; };
      // A few glowing "dashboard" bars on the operations screen.
      for (let i = 0; i < 5; i += 1) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.4 + (i % 3) * 0.45), M.glowMat(M.PALETTE.data, { blending: THREE.NormalBlending, opacity: 0.8 }));
        bar.position.set(-1.6 + i * 0.8, -0.9 + (0.2 + (i % 3) * 0.225), 0.02);
        block.group.add(bar);
      }
    } else {
      const color = key === 'programManager' || key === 'markets' ? M.BRAND.turquoise : key === 'flex' ? M.BRAND.violet : M.BRAND.lightBlue;
      block = A.createGlassSlab({ width: 3.6, depth: 1.8, thickness: 1.4, color, opacity: 0.2 });
      if (key === 'flex') {
        // Dashed outline: Flex Planning works in a separate study mode.
        block.edges.visible = false;
        const dashed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.6, 1.4, 1.8)), new THREE.LineDashedMaterial({ color, dashSize: 0.22, gapSize: 0.16, transparent: true }));
        dashed.computeLineDistances();
        block.group.add(dashed);
        const setGlow = block.setGlow;
        block.setGlow = (v) => { setGlow(v); dashed.material.opacity = 0.4 + 0.6 * v; };
      }
    }
    block.group.position.copy(pos);
    scene.add(block.group);
    blocks[key] = block;
  }

  // Static links between modules.
  const link = (a, b) => scene.add(A.createBeam(a, b, { color: M.PALETTE.data, radius: 0.04, opacity: 0.35 }));
  link(MODULES.modelManager, MODULES.forecasting);
  link(MODULES.forecasting, MODULES.optimization);
  link(MODULES.optimization, MODULES.gateway);
  link(MODULES.programManager, MODULES.optimization);
  link(MODULES.markets, MODULES.optimization);

  // ── Moving data and commands ─────────────────────────────────
  const stream = (paths, color, opts = {}) => {
    const s = new F.PacketStream({ paths, color, perPath: 3, velocity: 3, intensity: 0, ...opts });
    scene.add(s.object3D);
    flows.push(s);
    return s;
  };
  const pipeline = stream([[MODULES.modelManager, MODULES.forecasting, MODULES.optimization, MODULES.gateway].map((p) => p.clone())], M.PALETTE.data, { perPath: 8 });
  const gwBottom = MODULES.gateway.clone().add(V(0, -0.8, 0));
  const commands = stream(devices.map((d) => [gwBottom.clone(), d.clone()]), M.PALETTE.command, { perPath: 2, size: 0.24 });
  const opsBottom = MODULES.operations.clone().add(V(0, -1.7, 0));
  const status = stream(devices.map((d) => [d.clone(), opsBottom.clone()]), M.PALETTE.data, { perPath: 2 });
  const sideProgram = stream([[MODULES.programManager.clone(), MODULES.optimization.clone()]], M.PALETTE.data);
  const sideMarkets = stream([[MODULES.markets.clone(), MODULES.optimization.clone()]], M.PALETTE.data);

  // One labelled packet in each direction so the motion is named.
  const P = content.packets;
  const schedTrail = new F.PacketTrail({ path: [gwBottom.clone(), devices[3].clone()], color: M.PALETTE.command, size: 0.26, label: { text: P.schedule, kind: 'command' } });
  const statusTrail = new F.PacketTrail({ path: [devices[5].clone(), opsBottom.clone()], color: M.PALETTE.data, label: { text: P.status, kind: 'data' } });
  scene.add(schedTrail.object3D, statusTrail.object3D);

  // ── Grid side and edge side (step 9) ────────────────────────
  const gridSide = A.createGlassSlab({ width: 8, depth: 3, thickness: 0.3, color: M.BRAND.lightBlue, opacity: 0.2 });
  gridSide.group.position.set(-7, 4.6, 10.5);
  const edgeSide = A.createGlassSlab({ width: 8, depth: 3, thickness: 0.3, color: M.BRAND.turquoise, opacity: 0.2 });
  edgeSide.group.position.set(7, 4.6, 10.5);
  scene.add(gridSide.group, edgeSide.group);
  const bridge = stream([[V(-3, 4.8, 10.5), V(3, 4.8, 10.5)], [V(3, 4.9, 10.2), V(-3, 4.9, 10.2)]], M.PALETTE.data, { perPath: 3 });

  // ── Labels ───────────────────────────────────────────────────
  const lab = content.labels;
  const labels = {};
  for (const key of Object.keys(MODULES)) {
    labels[key] = L.label(lab[key]);
    labels[key].element.style.whiteSpace = 'normal';
    labels[key].element.style.maxWidth = '128px';
    // Main-row labels alternate above / below their block so neighbours never touch.
    const below = key === 'forecasting' || key === 'gateway';
    const lift = key === 'operations' ? 1.75 : 0.85;
    labels[key].position.copy(MODULES[key]).add(V(0, below ? -0.85 : lift, 0));
    if (below) labels[key].center.set(0.5, -0.1);
    scene.add(labels[key]);
  }
  // Top-right, clear of the back-row module labels (measured at 1366×768).
  labels.derms = L.label(lab.derms, { variant: 'accent' });
  labels.derms.element.style.whiteSpace = 'normal';
  labels.derms.element.style.maxWidth = '180px';
  labels.derms.position.set(13.5, 13.2, -8);
  labels.battery = L.label(lab.battery);
  labels.battery.position.set(13, 1.5, 4.2);
  labels.grid = L.label(lab.grid);
  labels.grid.position.set(-7, 5.0, 10.5);
  labels.edge = L.label(lab.edge);
  labels.edge.position.set(7, 5.0, 10.5);
  for (const k of ['derms', 'battery', 'grid', 'edge']) scene.add(labels[k]);

  // ── Timeline: one module per step, then the split ───────────
  const timeline = stepTimeline([1.8, 1.8, 1.8, 2.2, 2.2, 1.8, 1.8, 1.8, 2.4], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k <= 8) {
      tl.to(S, { [`h${k}`]: 1, duration: 0.7, ease: 'power2.out' }, q(0));
      if (k > 1) tl.to(S, { [`h${k - 1}`]: 0.45, duration: 0.7 }, q(0));
      if (k === 4) tl.to(S, { sched: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.4));
      if (k === 5) tl.to(S, { status: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.4));
    } else {
      tl.to(S, { h8: 0.45, dim: 1, duration: 0.7 }, q(0));
      tl.to(S, { split: 1, duration: 1.0, ease: 'power2.out' }, q(0.4));
    }
  });

  const near = (p, dx = 1.5, dy = 3.5, dz = 12) => ({ pos: [p.x + dx, p.y + dy, p.z + dz], target: [p.x, p.y - 0.8, p.z] });
  const presets = {
    overview: { pos: [0, 15, 31], target: [0, 7, 0] },
    modelManager: near(MODULES.modelManager, 3),
    forecasting: near(MODULES.forecasting),
    optimization: near(MODULES.optimization),
    gateway: { pos: [8, 9, 17], target: [6, 5, 0] },
    operations: { pos: [11, 8.5, 15], target: [11, 6, 0] },
    programManager: near(MODULES.programManager, 1.5, 2.5, 14),
    markets: near(MODULES.markets, 1.5, 2.5, 14),
    flex: near(MODULES.flex, 3, 2.5, 14),
    split: { pos: [0, 10, 26], target: [0, 5, 6] },
  };

  const update = (dt) => {
    const dimAll = 1 - 0.7 * S.dim;
    // In a module close-up only that module's label shows; the others sit at the frame edges.
    const focus = S.dim < 0.5 ? ORDER.find((k, i) => S[`h${i + 1}`] > 0.9) : null;
    ORDER.forEach((key, i) => {
      const h = S[`h${i + 1}`] * dimAll;
      blocks[key].setGlow(h);
      // Hidden in other modules' close-ups and in the Grid / Edge split (step 9).
      L.setLabelOpacity(labels[key], (focus && focus !== key) || S.dim > 0.5 ? 0 : 0.45 + 0.55 * h);
      labels[key].element.classList.toggle('label3d--accent', h > 0.95);
    });
    pipeline.intensity = (0.3 + 0.7 * Math.max(S.h1, S.h2, S.h3)) * dimAll;
    commands.intensity = (S.h4 > 0.3 ? S.h4 : 0) * dimAll;
    status.intensity = (S.h5 > 0.3 ? S.h5 : 0) * dimAll;
    sideProgram.intensity = (S.h6 > 0.3 ? S.h6 : 0) * dimAll;
    sideMarkets.intensity = (S.h7 > 0.3 ? S.h7 : 0) * dimAll;
    bridge.intensity = S.split;
    for (const s of flows) s.update(dt);
    schedTrail.setProgress(S.sched);
    statusTrail.setProgress(S.status);

    for (const side of [gridSide, edgeSide]) {
      side.group.visible = S.split > 0.01;
      side.group.scale.setScalar(0.6 + 0.4 * S.split);
      side.setGlow(S.split);
    }
    L.setLabelOpacity(labels.grid, S.split);
    L.setLabelOpacity(labels.edge, S.split);
    L.setLabelOpacity(labels.derms, focus ? 0 : 1 - 0.6 * S.dim);
    L.setLabelOpacity(labels.battery, focus || S.dim > 0.5 ? 0 : 1);
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, [...ORDER, 'split']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 6, maxDistance: 70 },
    dispose: () => { schedTrail.dispose(); statusTrail.dispose(); },
  });
}
