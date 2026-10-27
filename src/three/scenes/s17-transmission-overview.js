// Slide 17 — GridOS for Transmission: a high-voltage landscape with three glass tiers above it
// (Data Fabric & Connect → applications → AEMS) and four competency pillars behind.
// Data rises from substations to the data foundation, up to the core; applications feed
// insights to AEMS; control actions come back down.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline } from './common.js';
import { createDoubleCircuit } from '../kit/Transmission.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const SUBS = [V(-18, 0, -6), V(-6, 0, -9), V(8, 0, -8), V(18, 0, 0), V(6, 0, 6), V(-10, 0, 5)];
const LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4]];
const FABRIC_Y = 10.8;
const CORE = V(0, 20.8, -4);
// Applications in two staggered rows so their two-line labels never touch.
const APPS = {
  ddlr: V(-10, 16.6, -3),
  forecasting: V(0, 16.6, -3),
  markets: V(10, 16.6, -3),
  wams: V(-6.5, 13.8, -1.5),
  vi: V(6.5, 13.8, -1.5),
};
const ADD_ONS = ['vi', 'markets'];
const PILLARS = [
  { key: 'awareness', x: -21, apps: ['wams'] },
  { key: 'capacity', x: -7, apps: ['ddlr', 'forecasting'] },
  { key: 'stability', x: 7, apps: ['wams'] },
  { key: 'resilience', x: 21, apps: ['vi', 'forecasting'] },
];
const PILLAR_Z = -16;
const PILLAR_H = 22;

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const pk = content.packets;
  const { scene, camera } = A.createBaseScene({ ground: { width: 64, depth: 42 }, shadowExtent: 34, fogNear: 80, fogFar: 180 });
  const flows = [];

  // ── High-voltage landscape ─────────────────────────────────
  for (const p of SUBS) {
    const s = A.createSubstation({ w: 4.4, d: 3.8, scale: 0.8 });
    s.position.copy(p);
    scene.add(s);
  }
  const wireMat = M.stdMat('#8C98AC', { metalness: 0.5, roughness: 0.4 });
  LINES.forEach(([a, b], i) => {
    const line = createDoubleCircuit(SUBS[a], SUBS[b], { towers: 1, towerHeight: 6.4, endHeight: 2.0, material: wireMat });
    scene.add(line.group);
    line.circuits.forEach((path, c) => {
      const f = new F.PowerFlow({ path: c ? path.slice().reverse() : path, color: M.PALETTE.flow, density: 1.2, size: 0.36, velocity: 3 + (i % 3) * 0.4 });
      scene.add(f.object3D);
      flows.push(f);
    });
  });

  // Generation and load around the network
  const turbines = [[-26, -12], [-23, -15], [-27, -2]].map(([x, z]) => {
    const t = A.createWindTurbine({ height: 5.6, radius: 1.9 });
    t.group.position.set(x, 0, z);
    t.rotor.rotation.x = Math.random() * Math.PI;
    scene.add(t.group);
    return t;
  });
  const gas = A.createGasPlant();
  gas.position.set(25, 0, 6);
  gas.rotation.y = -Math.PI / 2;
  scene.add(gas);
  const dcs = [[5, 13], [11, 13.5]].map(([x, z]) => {
    const d = A.createDataCenter({ w: 4.4, d: 2.6, h: 1.4 });
    d.group.position.set(x, 0, z);
    scene.add(d.group);
    return d;
  });
  const feeder = (from, to) => {
    const f = new F.PowerFlow({ path: [from.clone().setY(0.12), to.clone().setY(0.12)], color: M.PALETTE.flow, density: 1, size: 0.32 });
    scene.add(f.object3D);
    flows.push(f);
  };
  feeder(V(-25, 0, -10), SUBS[0]);
  feeder(V(23, 0, 5.5), SUBS[3]);
  feeder(SUBS[4], V(8, 0, 12));
  scene.add(A.createTrees([[-28, 10], [-22, 12], [-14, 13], [16, 12], [28, -10], [22, -14], [-3, 15], [27, 14], [0, -16], [-30, -16]].map(([x, z], i) => ({ x, z, s: 0.9 + (i % 3) * 0.15 }))));

  // ── Tier 1: Data Fabric & Connect ──────────────────────────
  const fabric = A.createGlassSlab({ width: 30, depth: 16, thickness: 0.4, color: M.BRAND.green, opacity: 0.14 });
  fabric.group.position.set(0, FABRIC_Y, -1);
  scene.add(fabric.group);

  // ── Tier 2: applications (dashed outline = add-on) ─────────
  const apps = {};
  for (const [key, p] of Object.entries(APPS)) {
    const panel = A.createGlassPanel({ width: 4.2, height: 2.1, color: M.BRAND.lightBlue });
    panel.group.position.copy(p);
    scene.add(panel.group);
    if (ADD_ONS.includes(key)) {
      const edges = panel.group.children.find((c) => c.isLineSegments);
      edges.material.dispose();
      edges.material = new THREE.LineDashedMaterial({ color: M.BRAND.lightBlue, dashSize: 0.32, gapSize: 0.2, transparent: true, toneMapped: false });
      edges.computeLineDistances();
    }
    const l = L.label(lab[key], { anchor: 'center' });
    l.position.copy(p);
    scene.add(l);
    apps[key] = { panel, label: l, edgeMaterial: panel.group.children.find((c) => c.isLineSegments).material };
  }

  // ── Tier 3: AEMS, the operational core ─────────────────────
  const core = A.createGlassPanel({ width: 9, height: 2.6, color: M.BRAND.lightBlue });
  core.group.position.copy(CORE);
  scene.add(core.group);
  const coreLabel = L.label(lab.aems, { variant: 'big', anchor: 'center' });
  coreLabel.position.copy(CORE);
  scene.add(coreLabel);

  const fabricLabel = L.label(lab.fabric, { anchor: 'center' });
  fabricLabel.position.set(0, FABRIC_Y + 0.3, 7.2);
  const appsLabel = L.label(lab.apps);
  appsLabel.position.set(-12.5, 18.2, -3);
  scene.add(fabricLabel, appsLabel);

  // ── Four competency pillars behind the platform ────────────
  const pillars = PILLARS.map((p) => {
    const mat = M.glowMat(M.BRAND.lightBlue, { opacity: 0.12, blending: THREE.NormalBlending });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, PILLAR_H, 14, 1, true), mat);
    m.position.set(p.x, PILLAR_H / 2, PILLAR_Z);
    const coreMat = M.stdMat('#9AA8C7', { emissive: M.BRAND.lightBlue, emissiveIntensity: 0.2 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, PILLAR_H, 8), coreMat);
    c.position.copy(m.position);
    scene.add(m, c);
    const l = L.label(lab[p.key]);
    l.position.set(p.x, PILLAR_H + 0.4, PILLAR_Z);
    scene.add(l);
    // Illustrative links from the pillar to the applications that serve it.
    const beams = [...p.apps, 'aems'].map((k) => {
      const to = k === 'aems' ? CORE : APPS[k];
      const b = A.createBeam(V(p.x, k === 'aems' ? 20 : 15.5, PILLAR_Z + 0.6), to.clone().add(V(0, 0, -0.1)), { color: '#C9D3EE', radius: 0.04, opacity: 0 });
      scene.add(b);
      return b;
    });
    return { ...p, mat, coreMat, label: l, beams };
  });

  // ── Data and command streams ───────────────────────────────
  const subTop = (p) => p.clone().add(V(0, 2.6, 0));
  const up = new F.PacketStream({ paths: SUBS.map((p) => [subTop(p), V(p.x * 0.8, FABRIC_Y - 0.25, Math.max(-8.5, Math.min(6.5, p.z)))]), color: M.PALETTE.data, perPath: 2, velocity: 3.2, intensity: 0 });
  const toCore = new F.PacketStream({ paths: [-6, 0, 6].map((x) => [V(x, FABRIC_Y + 0.25, -3.5), V(x * 0.5, CORE.y - 1.35, CORE.z)]), color: M.PALETTE.data, perPath: 3, velocity: 3, intensity: 0 });
  const fromApps = new F.PacketStream({ paths: Object.values(APPS).map((p) => [p.clone().add(V(0, 1.05, 0)), CORE.clone().add(V(p.x * 0.3, -1.3, 0))]), color: M.PALETTE.data, perPath: 2, velocity: 2.6, intensity: 0 });
  const down = new F.PacketStream({ paths: [SUBS[3], SUBS[1], SUBS[5]].map((p) => [CORE.clone().add(V(p.x * 0.2, -1.3, 0)), subTop(p)]), color: M.PALETTE.command, perPath: 1, size: 0.26, velocity: 3.4, intensity: 0 });
  for (const s of [up, toCore, fromApps, down]) { scene.add(s.object3D); flows.push(s); }

  // One labelled packet per step: what is moving, right now.
  const arc = (a, b, lift = 2) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const trail = (a, b, text, kind, color) => {
    const t = new F.PacketTrail({ path: arc(a, b), color, label: { text, kind } });
    scene.add(t.object3D);
    return t;
  };
  const trails = {
    t1: trail(subTop(SUBS[2]), V(6, FABRIC_Y - 0.2, -6), pk.measurements, 'data', M.PALETTE.data),
    t2: trail(V(2, FABRIC_Y + 0.3, -3), CORE.clone().add(V(1.5, -1.3, 0)), pk.state, 'data', M.PALETTE.data),
    t3: trail(APPS.ddlr.clone().add(V(0, 1.05, 0)), CORE.clone().add(V(-3, -1.3, 0)), pk.insight, 'data', M.PALETTE.data),
    t4: trail(subTop(SUBS[5]), CORE.clone().add(V(-1.5, -1.3, 0)), pk.measurements, 'data', M.PALETTE.data),
    t5: trail(APPS.ddlr.clone().add(V(0, -1.05, 0)), V(1, 4.5, -8.5), pk.rating, 'data', M.PALETTE.data),
    t6: trail(APPS.wams.clone().add(V(0, 1.05, 0)), CORE.clone().add(V(-2, -1.3, 0)), pk.insight, 'data', M.PALETTE.data),
    t7: trail(CORE.clone().add(V(2.5, -1.3, 0)), subTop(SUBS[3]), pk.command, 'command', M.PALETTE.command),
  };

  // Ground labels
  const gl = (def, x, y, z) => { const l = L.label(def); l.position.set(x, y, z); scene.add(l); return l; };
  const groundLabels = [gl(lab.wind, -25, 7.6, -9), gl(lab.gas, 25, 6, 6), gl(lab.dataCenter, 8, 2.6, 13.3)];

  // ── State and timeline ─────────────────────────────────────
  const S = {
    fabric: 0.25, core: 0.25, apps: 0.25, ground: 1,
    p1: 0.1, p2: 0.1, p3: 0.1, p4: 0.1,
    up: 0, toCore: 0, fromApps: 0, down: 0,
    t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0, t7: 0,
  };
  const timeline = stepTimeline([2.4, 2.4, 2.6, 2.4, 2.4, 2.4, 2.6], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) tl.to(S, { fabric: 1, up: 1, duration: 0.8 }, q(0)).to(S, { t1: 1, duration: 1.7, ease: 'power1.inOut' }, q(0.3));
    if (k === 2) tl.to(S, { core: 1, toCore: 1, duration: 0.8 }, q(0)).to(S, { t2: 1, duration: 1.7, ease: 'power1.inOut' }, q(0.3));
    if (k === 3) tl.to(S, { apps: 1, fromApps: 1, duration: 0.8 }, q(0)).to(S, { t3: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.4));
    if (k === 4) tl.to(S, { p1: 1, duration: 0.7 }, q(0)).to(S, { t4: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.3));
    if (k === 5) tl.to(S, { p1: 0.35, p2: 1, duration: 0.7 }, q(0)).to(S, { t5: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.3));
    if (k === 6) tl.to(S, { p2: 0.35, p3: 1, duration: 0.7 }, q(0)).to(S, { t6: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.3));
    if (k === 7) tl.to(S, { p3: 0.35, p4: 1, down: 1, duration: 0.7 }, q(0)).to(S, { t7: 1, duration: 1.9, ease: 'power1.inOut' }, q(0.3));
  });

  const presets = {
    overview: { pos: [0, 23.5, 55], target: [0, 11, -4] },
    ground: { pos: [0, 14, 33], target: [0, 3.5, -1] },
    core: { pos: [0, 21, 31], target: [0, 15, -3] },
    apps: { pos: [-1, 19.5, 37], target: [-1, 14.5, -3] },
  };

  // Steps 1-3 are close-ups (ground, core, apps); everything else is the wide shot.
  const view = { wide: true, k: 0 };
  const update = (dt) => {
    for (const t of turbines) t.rotor.rotation.x += dt * 1.1;
    for (const f of flows) {
      if (f === up) f.intensity = S.up;
      else if (f === toCore) f.intensity = S.toCore;
      else if (f === fromApps) f.intensity = S.fromApps;
      else if (f === down) f.intensity = S.down;
      f.update(dt);
    }
    for (const [k, t] of Object.entries(trails)) t.setProgress(S[k]);
    fabric.setGlow(S.fabric);
    core.material.opacity = 0.14 + 0.25 * S.core;
    core.material.emissiveIntensity = 0.2 + 0.6 * S.core;
    L.setLabelOpacity(coreLabel, 0.55 + 0.45 * S.core);
    L.setLabelOpacity(fabricLabel, 0.55 + 0.45 * S.fabric);
    // Close-ups: hide labels of tiers that are not in focus (they would sit cut off at the frame edge).
    const tierShown = { apps: view.k !== 1, pillars: view.k !== 1 && view.k !== 2, ground: view.k !== 3 };
    L.setLabelOpacity(appsLabel, (0.5 + 0.5 * S.apps) * (tierShown.apps && !view.wide ? 1 : 0));
    const pv = [S.p1, S.p2, S.p3, S.p4];
    const appBoost = {};
    pillars.forEach((p, i) => {
      p.mat.opacity = 0.08 + 0.42 * pv[i];
      p.coreMat.emissiveIntensity = 0.15 + 0.9 * pv[i];
      L.setLabelOpacity(p.label, (0.45 + 0.55 * pv[i]) * (tierShown.pillars ? 1 : 0));
      p.label.element.classList.toggle('label3d--accent', pv[i] > 0.9);
      for (const b of p.beams) b.material.opacity = Math.max(0, pv[i] - 0.3) * 0.9;
      for (const a of p.apps) appBoost[a] = Math.max(appBoost[a] || 0, pv[i] > 0.9 ? 1 : 0);
    });
    for (const [key, a] of Object.entries(apps)) {
      const g = Math.max(S.apps, appBoost[key] || 0);
      a.panel.material.opacity = 0.12 + 0.3 * g;
      a.panel.material.emissiveIntensity = 0.15 + 0.7 * g;
      a.edgeMaterial.opacity = 0.4 + 0.6 * g;
      L.setLabelOpacity(a.label, (0.5 + 0.5 * g) * (tierShown.apps ? 1 : 0));
      a.label.element.classList.toggle('label3d--accent', (appBoost[key] || 0) > 0.9);
      // Five apps sit close together in the wide shot: titles only there.
      a.label.element.classList.toggle('label3d--compact', view.wide);
    }
    for (const l of groundLabels) L.setLabelOpacity(l, (1 - 0.6 * Math.max(S.core, S.apps)) * (tierShown.ground ? 1 : 0));
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['ground', 'core', 'apps', 'overview', 'overview', 'overview', 'overview']),
    startPreset: 'overview',
    onStep: (k) => { view.k = k; view.wide = !(k >= 1 && k <= 3); },
    controlsLimits: { minDistance: 10, maxDistance: 110 },
  });
}
