// Slide 12 — OMS (Outage Management System) on a storm night.
// A transformer serving 12 homes fails. Smart meters send "last gasp" messages and some
// customers call; the outage view traces every report to the one shared transformer,
// flags it, dispatches a crew (with an ETR countdown) and meters confirm restoration.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';
import { createRain, createDaylight, swayTrees } from '../kit/Weather.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const POLES = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18];
const T1_X = -2; // failing transformer
const T2_X = 10; // neighbouring transformer, stays on
const ROAD_Z = 1.6;
const PANEL = { x: 3, y: 11.6, z: -10, w: 12.5, h: 5.2 };
const REPORTERS = [0, 1, 2, 4, 5, 6, 8, 10, 11]; // homes whose meters send a last gasp
const CALLERS = [3, 7, 9]; // homes that call in
const CONFIDENCE = 92; // illustrative
const ETR_MIN = 90; // illustrative

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const C = M.COLOR;
  const { scene, camera, lights } = A.createBaseScene({ ground: { width: 52, depth: 32 }, shadowExtent: 28, fogNear: 45, fogFar: 120 });
  createDaylight(scene, lights, { night: '#00041F' })(0.05);
  const flows = [];
  const S = { fail: 0, spark: 0, pings: 0, calls: 0, trace: 0, pred: 0, crewVis: 0, crew: 0, etr: 0, repair: 0, restored: 0, back: 0 };

  // ── Street, feeder and transformers ─────────────────────────
  scene.add(A.createRoad(V(-25, 0, ROAD_Z), V(25, 0, ROAD_Z), 1.8));
  const tops = POLES.map((x) => {
    const p = A.createPole({ height: 4.6 });
    p.position.set(x, 0, -1.2);
    scene.add(p);
    return p.position.clone().add(p.userData.top);
  });
  let feeder = [];
  for (let i = 0; i < tops.length - 1; i += 1) feeder = A.joinPaths(feeder, A.catenary(tops[i], tops[i + 1], 0.3, 8));
  scene.add(A.createConductor(feeder, M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.5 }), 0.04));
  const feederFlow = new F.PowerFlow({ path: feeder, color: M.PALETTE.flow, velocity: 3 });
  scene.add(feederFlow.object3D);
  flows.push(feederFlow);

  const xfmrAt = (x) => {
    const t = A.createDistTransformer();
    t.position.set(x, 3.3, -1.2);
    scene.add(t);
    return t;
  };
  xfmrAt(T1_X);
  xfmrAt(T2_X);
  const t1Pos = V(T1_X, 3.4, -0.9);

  // Homes: 12 on the failing transformer, 8 on the neighbouring one.
  const homesOn = (cx, cols) => {
    const list = [];
    for (let r = 0; r < 2; r += 1) for (let c = 0; c < cols; c += 1) list.push({ x: cx + (c - (cols - 1) / 2) * 2.2, z: r ? -7 : -4.4 });
    return list;
  };
  const listA = homesOn(T1_X, 6);
  const listB = homesOn(T2_X, 4);
  const homesA = A.createHouses(listA);
  const homesB = A.createHouses(listB);
  scene.add(homesA.group, homesB.group);

  // Service drops from each transformer to its homes (static lines), coloured by state.
  const dropLines = (list, x) => {
    const pts = [];
    for (const h of list) pts.push(x, 3.4, -0.9, h.x, 1.0, h.z + 0.4);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: M.PALETTE.flow, transparent: true, opacity: 0.55, toneMapped: false });
    scene.add(new THREE.LineSegments(g, mat));
    return mat;
  };
  const dropsA = dropLines(listA, T1_X);
  dropLines(listB, T2_X);

  // Street lights (warm glows) and wind-blown trees.
  for (const x of [-14, -6, 6, 14]) {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowTexture(), color: '#FFC56B', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    glow.position.set(x, 4.1, -0.6);
    glow.scale.setScalar(1.6);
    scene.add(glow);
  }
  const trees = [[-20, 5], [-13, 5.5], [-5, 5.2], [5, 5.6], [12, 5.2], [20, 5.4], [-22, -6], [21, -6.5]].map(([x, z], i) => {
    const t = A.createTree({ height: 4.2 + (i % 3) * 0.6 });
    t.position.set(x, 0, z);
    scene.add(t);
    return t;
  });
  const rain = createRain({ x0: -26, x1: 26, z0: -14, z1: 12, top: 16, count: 1000 });
  scene.add(rain.object3D);
  flows.push(rain);

  // Spark when the transformer fails (and when it is repaired).
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowTexture(), color: '#FFE7A8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  spark.position.copy(t1Pos);
  scene.add(spark);

  // Predicted-device marker: red ring around the transformer + label with a confidence bar.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 32), M.glowMat(M.PALETTE.fault, { blending: THREE.NormalBlending }));
  ring.position.copy(t1Pos);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  const predEl = document.createElement('div');
  predEl.className = 'label3d';
  predEl.style.borderColor = M.PALETTE.fault;
  const predTitle = document.createElement('span');
  predTitle.className = 'label3d__title';
  predTitle.textContent = content.predicted.title;
  const predSub = document.createElement('span');
  predSub.className = 'label3d__sub';
  const predBar = document.createElement('div');
  predBar.style.cssText = `height:5px;border-radius:3px;margin-top:4px;background:${M.PALETTE.fault};width:0`;
  predEl.append(predTitle, predSub, predBar);
  const predLabel = L.elementLabel(predEl);
  predLabel.position.set(T1_X - 3.2, 5.6, -1.2);
  scene.add(predLabel);

  // Crew truck with headlight beams.
  const truck = A.createCrewTruck();
  const beamMat = M.glowMat('#FFE9B0', { opacity: 0.22, side: THREE.DoubleSide });
  for (const z of [-0.22, 0.22]) {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4.2, 16, 1, true).translate(0, -2.1, 0), beamMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(0.9, 0.45, z);
    truck.group.add(beam);
  }
  scene.add(truck.group);

  // ── Outage view panel (canvas) ──────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 426;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const panel = A.createGlassPanel({ width: PANEL.w, height: PANEL.h, color: M.PALETTE.data, map: tex, opacity: 0.95 });
  panel.group.position.set(PANEL.x, PANEL.y, PANEL.z);
  scene.add(panel.group);

  // Packets: last gasps and calls rise to the panel; restoration pings rise at the end.
  const panelPoint = (x) => V(PANEL.x + (x - PANEL.x) * 0.45, PANEL.y - PANEL.h / 2 + 0.1, PANEL.z + 0.1);
  const arc = (a, b) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + 2.5, (a.z + b.z) / 2), b);
  const P = content.packets;
  const mk = (i, text, kind) => {
    const h = listA[i];
    const t = new F.PacketTrail({ path: arc(V(h.x, 1.6, h.z), panelPoint(h.x)), color: M.PALETTE.data, count: 3, size: 0.2, label: text ? { text, kind } : null });
    scene.add(t.object3D);
    return t;
  };
  const gasps = REPORTERS.map((i, k) => mk(i, k === 0 ? P.lastGasp : null, 'data'));
  const calls = CALLERS.map((i, k) => mk(i, k === 0 ? P.call : null, 'data'));
  const backPings = listA.map((h, i) => mk(i, i === 2 ? P.restored : null, 'data'));

  // ── Labels ───────────────────────────────────────────────────
  const lab = content.labels;
  const lOms = L.label(lab.oms, { variant: 'accent' });
  lOms.position.set(PANEL.x, PANEL.y + PANEL.h / 2 + 0.2, PANEL.z);
  const lT1 = L.label(lab.transformer, { anchor: 'left' });
  lT1.position.set(T1_X + 1.0, 4.6, -1.2);
  const lB = L.label(lab.neighbours);
  lB.position.set(T2_X, 2.6, -7.5);
  const lCrew = L.label(lab.crew);
  scene.add(lOms, lT1, lB, lCrew);

  // ── Timeline ─────────────────────────────────────────────────
  const timeline = stepTimeline([2.4, 3.0, 2.6, 2.2, 3.6, 3.2], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) {
      tl.to(S, { spark: 1, duration: 0.15 }, q(0.4)).to(S, { spark: 0, duration: 0.8 }, q(0.6));
      tl.to(S, { fail: 1, duration: 0.5 }, q(0.5));
    }
    if (k === 2) {
      tl.to(S, { pings: 1, duration: 2.2, ease: 'none' }, q(0.1));
      tl.to(S, { calls: 1, duration: 1.8, ease: 'none' }, q(0.9));
    }
    if (k === 3) tl.to(S, { trace: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.2));
    if (k === 4) tl.to(S, { pred: 1, duration: 1.2, ease: 'power1.out' }, q(0.2));
    if (k === 5) {
      tl.to(S, { crewVis: 1, duration: 0.3 }, q(0));
      tl.to(S, { etr: ETR_MIN, duration: 0.6 }, q(0.2));
      tl.to(S, { crew: 1, duration: 3.0, ease: 'power1.inOut' }, q(0.4));
    }
    if (k === 6) {
      tl.to(S, { etr: 0, duration: 1.2, ease: 'none' }, q(0));
      tl.to(S, { repair: 1, duration: 0.15 }, q(1.0)).to(S, { repair: 0, duration: 0.6 }, q(1.2));
      tl.to(S, { restored: 1, duration: 0.6 }, q(1.2));
      tl.to(S, { back: 1, duration: 1.4, ease: 'power1.inOut' }, q(1.5));
    }
  });

  const presets = {
    overview: { pos: [2, 14, 30], target: [1, 4, -3] },
    homes: { pos: [-1.5, 9, 18.5], target: [-1.5, 2.4, -4] },
    panel: { pos: [2, 12.5, 19], target: [2, 8.5, -6] },
    // Framed so the predicted-device label clears the readouts (measured at 1366×768).
    transformer: { pos: [5, 9, 15], target: [0, 4.4, -2.5] },
    crew: { pos: [-12, 7, 14], target: [-5, 2.2, -0.5] },
  };

  // ── Per-frame rendering of the state ────────────────────────
  const g2d = canvas.getContext('2d');
  const T = content.panel;
  let lastSig = '';
  const off = new THREE.Color(M.PALETTE.off);
  const flowC = new THREE.Color(M.PALETTE.flow);
  let hudKey = '';
  // Progress of item i of n inside a 0..1 stream (staggered).
  const stagger = (p, i, n) => clamp01(p * (1 + 0.6 * (n - 1) / n) - (0.6 * i) / n);

  function drawPanel() {
    const sig = [S.fail > 0.5, Math.round(S.pings * 9), Math.round(S.calls * 3), Math.round(S.trace * 10), Math.round(S.pred * 10), Math.round(S.crew * 10), S.crewVis > 0.5, S.restored > 0.5].join();
    if (sig === lastSig) return;
    lastSig = sig;
    const g = g2d;
    const W = canvas.width;
    const H = canvas.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(14, 24, 70, 0.92)';
    roundRect(g, 4, 4, W - 8, H - 8, 22);
    g.fill();
    g.strokeStyle = 'rgba(15, 189, 255, 0.85)';
    g.lineWidth = 3;
    g.stroke();
    g.font = '600 26px "Titillium Web", "Trebuchet MS", sans-serif';
    g.fillStyle = '#B9C6EA';
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText(T.title, 30, 40);

    // Feeder and the two transformers
    const fy = 100;
    g.strokeStyle = '#0099A8';
    g.lineWidth = 8;
    g.beginPath(); g.moveTo(60, fy); g.lineTo(W - 60, fy); g.stroke();
    g.fillStyle = '#E6ECF5';
    g.font = '600 20px "Titillium Web", "Trebuchet MS", sans-serif';
    g.fillText(T.feeder, 64, fy - 24);
    const t1x = 340;
    const t2x = 790;
    const ty = 180;
    const node = (x, label, fault) => {
      g.strokeStyle = fault ? '#E63946' : '#0099A8';
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, fy); g.lineTo(x, ty - 22); g.stroke();
      g.fillStyle = fault ? '#E63946' : '#16245A';
      g.strokeStyle = fault ? '#FFB3B9' : '#0FBDFF';
      g.lineWidth = 3;
      g.fillRect(x - 26, ty - 22, 52, 44);
      g.strokeRect(x - 26, ty - 22, 52, 44);
      g.fillStyle = '#E6ECF5';
      g.textAlign = 'center';
      g.fillText(label, x, ty + 42);
    };
    node(t1x, T.transformer, S.pred > 0.5);
    node(t2x, T.otherTransformer, false);

    // Homes (dots): T1's 12 and T2's 8
    const homeXY = (i) => [t1x - 150 + (i % 6) * 60, i < 6 ? 290 : 350];
    for (let i = 0; i < 12; i += 1) {
      const [x, y] = homeXY(i);
      const rep = REPORTERS.indexOf(i);
      const cal = CALLERS.indexOf(i);
      const reported = (rep >= 0 && stagger(S.pings, rep, REPORTERS.length) >= 1) || (cal >= 0 && stagger(S.calls, cal, CALLERS.length) >= 1);
      if (S.trace > 0 && reported) {
        g.strokeStyle = 'rgba(15, 189, 255, 0.8)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (t1x - x) * S.trace, y + (ty + 22 - y) * S.trace);
        g.stroke();
      }
      g.fillStyle = S.restored > 0.5 ? '#5ECC62' : S.fail > 0.5 ? (reported ? '#0FBDFF' : '#7C88A9') : '#FFD69A';
      g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.fill();
      if (cal >= 0 && reported && S.restored < 0.5) {
        g.strokeStyle = '#0FBDFF';
        g.lineWidth = 3;
        g.beginPath(); g.arc(x, y, 21, 0, Math.PI * 2); g.stroke();
      }
    }
    for (let i = 0; i < 8; i += 1) {
      g.fillStyle = '#FFD69A';
      g.beginPath(); g.arc(t2x - 90 + (i % 4) * 60, i < 4 ? 290 : 350, 14, 0, Math.PI * 2); g.fill();
    }
    // Prediction: confidence bar under the transformer
    if (S.pred > 0.02) {
      g.textAlign = 'left';
      g.fillStyle = '#FFB3B9';
      g.fillText(`${T.predicted} ${Math.round(CONFIDENCE * S.pred)}%`, t1x + 44, ty - 6);
      g.fillStyle = 'rgba(230, 57, 70, 0.3)';
      g.fillRect(t1x + 44, ty + 8, 160, 10);
      g.fillStyle = '#E63946';
      g.fillRect(t1x + 44, ty + 8, 160 * (CONFIDENCE / 100) * S.pred, 10);
    }
    // Crew icon travelling to the transformer
    if (S.crewVis > 0.5) {
      const cx = lerp(80, t1x - 70, S.crew);
      g.fillStyle = '#EBAA01';
      g.fillRect(cx - 22, 384, 44, 22);
      g.fillStyle = '#E6ECF5';
      g.textAlign = 'left';
      g.fillText(T.crew, cx + 30, 395);
    }
    tex.needsUpdate = true;
  }

  const update = (dt, t) => {
    rain.update(dt);
    feederFlow.update(dt);
    swayTrees(trees, t, rain.reduced ? 0 : 0.05);
    const on = 1 - S.fail + S.restored * S.fail; // homes A lit?
    homesA.setLit(clamp01(on));
    dropsA.color.copy(off).lerp(flowC, clamp01(on));
    spark.visible = S.spark + S.repair > 0.01;
    spark.scale.setScalar(0.5 + 3 * (S.spark + S.repair));
    spark.material.opacity = clamp01(S.spark + S.repair);

    REPORTERS.forEach((_, k) => gasps[k].setProgress(S.fail > 0.5 ? stagger(S.pings, k, REPORTERS.length) : 0));
    CALLERS.forEach((_, k) => calls[k].setProgress(S.fail > 0.5 ? stagger(S.calls, k, CALLERS.length) : 0));
    backPings.forEach((p, k) => p.setProgress(stagger(S.back, k, backPings.length)));

    ring.visible = S.pred > 0.02 && S.restored < 0.99;
    ring.scale.setScalar(1 + 0.12 * Math.sin(t * 6) * (rain.reduced ? 0 : 1));
    L.setLabelOpacity(predLabel, S.pred * (1 - S.restored));
    predSub.textContent = content.predicted.sub.replace('{pct}', String(Math.round(CONFIDENCE * S.pred)));
    predBar.style.width = `${Math.round(120 * (CONFIDENCE / 100) * S.pred)}px`;
    L.setLabelOpacity(lT1, 1 - S.pred * (1 - S.restored));

    truck.group.visible = S.crewVis > 0.01;
    truck.group.position.set(lerp(-26, T1_X - 3.2, S.crew), 0, ROAD_Z);
    truck.lightMaterial.opacity = 0.5 + 0.5 * (Math.sin(t * 9) > 0 ? 1 : 0);
    lCrew.position.set(truck.group.position.x, 1.9, ROAD_Z);
    L.setLabelOpacity(lCrew, S.crewVis);

    drawPanel();

    const h = content.hud;
    const out = Math.round(12 * S.fail * (1 - S.restored));
    let etr = h.etrNone;
    if (S.etr > 0.5) {
      const m = Math.round(S.etr);
      etr = h.etrFormat.replace('{h}', String(Math.floor(m / 60))).replace('{m}', String(m % 60));
    }
    const key = `${out}|${etr}`;
    if (key !== hudKey) {
      hudKey = key;
      ctx.setHud({ items: [
        { label: h.out, value: String(out), mood: out > 0 ? 'alert' : 'ok' },
        { label: h.etr, value: etr, mood: S.etr > 0.5 ? 'warn' : '' },
      ] });
    }
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['homes', 'panel', 'panel', 'transformer', 'crew', 'overview']),
    startPreset: 'overview',
    onEnter: () => { hudKey = ''; lastSig = ''; },
    controlsLimits: { minDistance: 6, maxDistance: 70 },
    dispose: () => {
      for (const p of [...gasps, ...calls, ...backPings]) p.dispose();
      tex.dispose();
    },
  });
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
