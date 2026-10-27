// Slide 16 — GridOS VI (Visual Intelligence): AI on drone, satellite and LiDAR images.
// A line corridor is scanned by a drone and a satellite, turned into a height-coloured point
// cloud, given clearance zones, and AI flags trees and assets (pink boxes with illustrative
// scores) that become a prioritized work-order list. The "Data source" control shows what
// each source can detect.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';
import { createDrone, createSatellite, createSwath, createPointCloud, makeRandom, sampleCone, samplePolyline, sampleGround } from '../kit/Aerial.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const POLE_H = 5.2;
const POLE_XS = Array.from({ length: 13 }, (_, i) => -24 + i * 4);
const LEAN_POLE = 9; // index of the leaning pole (x = 12)
const RUST_POLE = 4; // index of the corroded cross-arm (x = -8)
const LEAN = 0.16;
const PANEL = { pos: V(0, 12.4, -9), w: 9, h: 2.6 };
const WO_POS = V(15, 10.6, -6);
// Illustrative findings: score/confidence and which sources can detect them.
const TREES = [
  { x: -17, z: 2.0, h: 6.2, score: 0.91, span: 2, detect: ['satellite', 'lidar', 'photo'] },
  { x: -3, z: -1.9, h: 6.6, score: 0.78, span: 6, detect: ['satellite', 'lidar', 'photo'] },
  { x: 5, z: 2.1, h: 5.9, score: 0.64, span: 8, detect: ['lidar', 'photo'] },
  { x: 19, z: -2.2, h: 6.0, score: 0.52, span: 11, detect: ['lidar'] },
];
const ASSET_FINDINGS = [
  { kind: 'pole', conf: 0.91, detect: ['lidar', 'photo'] },
  { kind: 'arm', conf: 0.84, detect: ['photo'] },
];

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const { scene, camera } = A.createBaseScene({ ground: { width: 60, depth: 30 }, shadowExtent: 30, fogNear: 70, fogFar: 160 });
  const view = { source: 'all' };
  const S = { drone: 0, sat: 0, img: 0, scan: 0, lidar: 0, zone: 0, ai: 0, asset: 0, wo: 0 };

  // ── Corridor: poles, conductor, trees ───────────────────────
  const tops = POLE_XS.map((x, i) => {
    const p = A.createPole({ height: POLE_H });
    p.position.set(x, 0, 0);
    if (i === LEAN_POLE) p.rotation.z = -LEAN;
    scene.add(p);
    return p.position.clone().add(p.userData.top.clone().applyEuler(p.rotation));
  });
  let line = [];
  for (let i = 0; i < tops.length - 1; i += 1) line = A.joinPaths(line, A.catenary(tops[i], tops[i + 1], 0.35, 8));
  scene.add(A.createConductor(line, M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.4 }), 0.045));
  const lineFlow = new F.PowerFlow({ path: line, color: M.PALETTE.flow, velocity: 3, density: 1.2 });
  scene.add(lineFlow.object3D);
  const rust = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.13, 0.16), M.stdMat('#9A4A22', { roughness: 1 }));
  rust.position.set(POLE_XS[RUST_POLE], POLE_H - 0.35, 0);
  scene.add(rust);

  const rnd = makeRandom(11);
  const bgTrees = [];
  for (let i = 0; i < 46; i += 1) {
    const side = i % 2 ? 1 : -1;
    bgTrees.push({ x: -27 + rnd() * 54, z: side * (4.5 + rnd() * 6), s: 0.9 + rnd() * 0.7 });
  }
  scene.add(A.createTrees(bgTrees));
  for (const t of TREES) {
    const tree = A.createTree({ height: t.h });
    tree.position.set(t.x, 0, t.z);
    scene.add(tree);
  }

  // Clearance zone around the conductor.
  const zoneMat = M.glowMat(M.PALETTE.data, { opacity: 0, blending: THREE.NormalBlending, side: THREE.DoubleSide });
  const zone = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line), 160, 1.8, 12, false), zoneMat);
  scene.add(zone);

  // ── Sensors ──────────────────────────────────────────────────
  const drone = createDrone({ coneHeight: 8.5, coneRadius: 2.6 });
  scene.add(drone.group);
  const sat = createSatellite();
  scene.add(sat);
  const swath = createSwath({ length: 6, width: 24 });
  scene.add(swath);

  // LiDAR point cloud (deterministic samples on ground, trees, poles and the line).
  const pts = [];
  sampleGround(pts, rnd, { x0: -27, x1: 27, z0: -9, z1: 9, step: 1.1 });
  for (const t of TREES) {
    const s = t.h / 5.5;
    sampleCone(pts, rnd, { x: t.x, z: t.z, baseY: 1.6 * s, radius: 1.3 * s, height: 3.8 * s }, 260);
  }
  for (const t of bgTrees) sampleCone(pts, rnd, { x: t.x, z: t.z, baseY: 0.5 * t.s, radius: 0.55 * t.s, height: 1.6 * t.s }, 40);
  POLE_XS.forEach((x, i) => {
    const lean = i === LEAN_POLE ? LEAN : 0;
    for (let k = 0; k < 40; k += 1) {
      const y = rnd() * POLE_H;
      pts.push(x + Math.sin(lean) * y + (rnd() - 0.5) * 0.2, y * Math.cos(lean), (rnd() - 0.5) * 0.2);
    }
  });
  samplePolyline(pts, rnd, line, 500);
  const cloud = createPointCloud(pts, { size: 0.14, minY: 0, maxY: 7 });
  scene.add(cloud.points);

  // ── VI panel and packets ─────────────────────────────────────
  const panel = A.createGlassPanel({ width: PANEL.w, height: PANEL.h, color: M.PALETTE.ai });
  panel.group.position.copy(PANEL.pos);
  scene.add(panel.group);
  const pBottom = PANEL.pos.clone().add(V(0, -PANEL.h / 2, 0.1));
  const arc = (a, b) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + 2, (a.z + b.z) / 2), b);
  const P = content.packets;
  const imgDrone = new F.PacketTrail({ path: arc(V(5, 8.6, 0), pBottom), color: M.PALETTE.data, label: { text: P.images, kind: 'data' } });
  const imgSat = new F.PacketTrail({ path: arc(V(6, 21, -10), pBottom.clone().add(V(2, 0, 0))), color: M.PALETTE.data });
  const scanTrail = new F.PacketTrail({ path: arc(V(-6, 8.6, 0), pBottom.clone().add(V(-2, 0, 0))), color: M.PALETTE.data, label: { text: P.scan, kind: 'data' } });
  scene.add(imgDrone.object3D, imgSat.object3D, scanTrail.object3D);

  // ── AI findings: pink boxes with labels ─────────────────────
  const Fd = content.findings;
  const pct = (v) => v.toFixed(2);
  const findings = [];
  const addFinding = (center, size, text, data, at = null) => {
    const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z)), new THREE.LineBasicMaterial({ color: M.PALETTE.ai, transparent: true, toneMapped: false }));
    box.position.copy(center);
    scene.add(box);
    const el = document.createElement('div');
    el.className = 'label3d';
    el.style.borderColor = M.PALETTE.ai;
    const t = document.createElement('span');
    t.className = 'label3d__title';
    t.style.color = '#B0177E';
    t.textContent = text;
    el.append(t);
    const lab = L.elementLabel(el, { anchor: at ? 'right' : 'bottom' });
    lab.position.copy(center).add(at || V(0, size.y / 2 + 0.2, 0));
    scene.add(lab);
    findings.push({ box, lab, ...data });
  };
  for (const t of TREES) {
    const s = t.h / 5.5;
    addFinding(V(t.x, t.h * 0.62, t.z), V(2.7 * s, t.h * 0.78, 2.7 * s), Fd.tree.replace('{score}', pct(t.score)), { group: 'tree', score: t.score, span: t.span, detect: t.detect });
  }
  const lx = POLE_XS[LEAN_POLE];
  addFinding(V(lx + 0.4, POLE_H / 2, 0), V(1.8, POLE_H + 0.4, 1.2), Fd.pole.replace('{conf}', pct(0.91)), { group: 'asset', kind: 'pole', score: ASSET_FINDINGS[0].conf, detect: ASSET_FINDINGS[0].detect }, V(-1.1, 0.4, 0));
  addFinding(V(POLE_XS[RUST_POLE], POLE_H - 0.35, 0), V(2.0, 0.6, 0.6), Fd.arm.replace('{conf}', pct(0.84)), { group: 'asset', kind: 'arm', score: ASSET_FINDINGS[1].conf, detect: ASSET_FINDINGS[1].detect });

  // ── Work-order list (DOM card floating in the scene) ────────
  const W = content.workOrders;
  const woEl = document.createElement('div');
  woEl.className = 'label3d';
  woEl.style.cssText = 'text-align:left;white-space:normal;width:240px;padding:8px 10px';
  const woLabel = L.elementLabel(woEl, { anchor: 'center' });
  woLabel.position.copy(WO_POS);
  scene.add(woLabel);
  const prioColor = { high: '#E63946', medium: '#F28C28', low: '#0099A8' };
  let woSig = '';
  const renderWorkOrders = (visible) => {
    const sig = visible.map((f) => f.kind || f.span).join();
    if (sig === woSig) return;
    woSig = sig;
    woEl.replaceChildren();
    const title = document.createElement('span');
    title.className = 'label3d__title';
    title.textContent = W.title;
    woEl.append(title);
    for (const f of [...visible].sort((a, b) => b.score - a.score)) {
      const level = f.score >= 0.8 ? 'high' : f.score >= 0.6 ? 'medium' : 'low';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:4px;font-size:11px;color:#1B2559';
      const chip = document.createElement('span');
      chip.style.cssText = `flex:none;padding:0 6px;border-radius:999px;color:#fff;font-weight:600;background:${prioColor[level]}`;
      chip.textContent = W[level];
      const text = document.createElement('span');
      text.textContent = f.group === 'tree' ? W.tree.replace('{n}', String(f.span)) : W[f.kind];
      row.append(chip, text);
      woEl.append(row);
    }
  };

  // ── Labels ───────────────────────────────────────────────────
  const lab = content.labels;
  const lVi = L.label(lab.vi, { variant: 'accent' });
  lVi.position.copy(PANEL.pos).add(V(0, PANEL.h / 2 + 0.2, 0));
  const lDrone = L.label(lab.drone);
  const lSat = L.label(lab.satellite);
  scene.add(lVi, lDrone, lSat);

  // ── Timeline ─────────────────────────────────────────────────
  const timeline = stepTimeline([3.4, 2.4, 2.0, 2.6, 2.4, 2.4], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) {
      tl.to(S, { drone: 1, sat: 1, duration: 3.0, ease: 'none' }, q(0));
      tl.to(S, { img: 1, duration: 1.2, ease: 'power1.inOut' }, q(1.9));
    }
    if (k === 2) {
      tl.to(S, { scan: 1, duration: 1.0, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { lidar: 1, duration: 0.9 }, q(1.0));
    }
    if (k === 3) tl.to(S, { zone: 1, lidar: 0.35, duration: 0.8 }, q(0.2));
    if (k === 4) tl.to(S, { ai: 1, duration: 1.4, ease: 'none' }, q(0.2));
    if (k === 5) tl.to(S, { asset: 1, duration: 0.8 }, q(0.2));
    if (k === 6) tl.to(S, { wo: 1, duration: 0.8 }, q(0.2));
  });

  const presets = {
    overview: { pos: [0, 15, 33], target: [0, 3.5, 0] },
    drone: { pos: [-11, 10, 16], target: [-4, 5, 0] },
    cloud: { pos: [0, 11.5, 21], target: [0, 4, 0] },
    ai: { pos: [1, 12, 25], target: [0, 4, 0] },
    assets: { pos: [0.5, 14, 41], target: [0.5, 5.6, 0] },
    wo: { pos: [2, 15.5, 40], target: [2, 6.6, -2] },
  };

  // ── Per frame ────────────────────────────────────────────────
  let hudKey = '';
  const update = (dt) => {
    lineFlow.update(dt);
    // Sensors fly during step 1 only.
    const flying = S.drone > 0.001 && S.drone < 0.999;
    drone.group.visible = flying;
    drone.group.position.set(lerp(-27, 27, S.drone), 8.6, 0);
    drone.spin(dt);
    sat.visible = S.sat > 0.001 && S.sat < 0.999;
    sat.position.set(lerp(-32, 32, S.sat), 21, -10);
    swath.visible = sat.visible;
    swath.position.x = sat.position.x;
    lDrone.position.copy(drone.group.position).add(V(0, 0.6, 0));
    lSat.position.copy(sat.position).add(V(0, 1.2, 0));
    L.setLabelOpacity(lDrone, flying ? 1 : 0);
    L.setLabelOpacity(lSat, sat.visible ? 1 : 0);
    imgDrone.setProgress(S.img);
    imgSat.setProgress(S.img);
    scanTrail.setProgress(S.scan);
    cloud.setOpacity(S.lidar);
    zoneMat.opacity = 0.16 * S.zone;
    zone.visible = S.zone > 0.01;
    panel.edgeMaterial.opacity = 0.5 + 0.5 * Math.max(S.ai, S.asset);

    // Findings: shown once their step has played, and only if the chosen source can see them.
    const visible = [];
    let treeIndex = 0;
    for (const f of findings) {
      const can = view.source === 'all' || f.detect.includes(view.source);
      let shown;
      if (f.group === 'tree') {
        shown = clamp01(S.ai * 4 - treeIndex);
        treeIndex += 1;
      } else {
        shown = S.asset;
      }
      const o = can ? shown : 0;
      f.box.visible = o > 0.02;
      f.box.material.opacity = o;
      // In the work-order step the card lists every finding, so the boxes keep their glow but drop their labels.
      L.setLabelOpacity(f.lab, o * (1 - S.wo));
      if (o > 0.5) visible.push(f);
    }
    renderWorkOrders(visible);
    L.setLabelOpacity(woLabel, S.wo);

    if (S.ai > 0.01) {
      const h = content.hud;
      const value = h.foundFormat.replace('{n}', String(visible.length)).replace('{total}', String(findings.length));
      if (value !== hudKey) {
        hudKey = value;
        ctx.setHud({ items: [{ label: h.found, value, mood: visible.length === findings.length ? 'ok' : 'warn' }] });
      }
    } else if (hudKey !== '') {
      hudKey = '';
      ctx.setHud(null);
    }
  };

  const c = content.controls;
  return finishScene({
    scene, camera, timeline, presets, update,
    flows: [lineFlow],
    steps: stepsFromContent(content, ['drone', 'cloud', 'overview', 'ai', 'assets', 'wo']),
    startPreset: 'overview',
    onEnter: () => { hudKey = '-'; woSig = '-'; },
    controlsLimits: { minDistance: 6, maxDistance: 75 },
    interactions: [
      {
        id: 'source', type: 'select', label: c.sourceLabel, tip: c.sourceTip, value: view.source,
        options: Object.entries(c.sources).map(([value, label]) => ({ value, label })),
        onChange: (v) => {
          view.source = v;
          ctx.showInfo({ title: c.infoTitle, paras: [c.tradeoffs[v]] });
        },
      },
    ],
    dispose: () => { imgDrone.dispose(); imgSat.dispose(); scanTrail.dispose(); },
  });
}
