// Slide 11 — VVO (Volt/VAR Optimization) demo.
// A 15-pole feeder with a floating voltage ribbon (height = voltage) between the 0.95 and
// 1.05 pu limit planes. The timeline switches devices on one by one; the "Feeder load"
// slider changes the load live (simplified linear voltage-drop model, illustrative).

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createVoltageRibbon, createBandPlanes, createDialGauge } from '../kit/Gauges.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const POLE_X = (i) => -15 + (i - 1) * 2.4; // poles 1..15
const SUB_X = -19.5;
const RIBBON = { z: 1.3, baseY: 8, scale: 32 };
const PANEL = { x: 0, y: 13.4, z: -8, w: 10, h: 2.6 };

// Simplified, illustrative voltage model (per unit) along the feeder, s = 0 (substation) … 1 (end).
const DROP = 0.11; // full-load drop at the end with no devices
const CAP = 0.03;
const REG = 0.04;
const INV = 0.012;

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 56, depth: 30 }, shadowExtent: 30, fogNear: 70, fogFar: 160 });
  const flows = [];
  const view = { load: 100 };
  const S = { data: 0, calc: 0, mCap: 0, cap: 0, mReg: 0, reg: 0, mInv: 0, inv: 0, result: 0, mLtc: 0, cvr: 0 };

  // ── Substation, poles and the feeder ────────────────────────
  const sub = A.createSubstation({ w: 4.4, d: 4 });
  sub.position.set(SUB_X, 0, 0);
  scene.add(sub);
  const exit = sub.position.clone().add(sub.userData.exitE);
  const tops = [];
  for (let i = 1; i <= 15; i += 1) {
    const p = A.createPole({ height: 4.6 });
    p.position.set(POLE_X(i), 0, 0);
    scene.add(p);
    tops.push(p.position.clone().add(p.userData.top));
  }
  let path = A.catenary(exit, tops[0], 0.3, 10);
  for (let i = 0; i < tops.length - 1; i += 1) path = A.joinPaths(path, A.catenary(tops[i], tops[i + 1], 0.25, 8));
  scene.add(A.createConductor(path, M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.5 }), 0.045));
  const feederFlow = new F.PowerFlow({ path, color: M.PALETTE.flow, velocity: 3 });
  scene.add(feederFlow.object3D);
  flows.push(feederFlow);
  const x0 = exit.x;
  const x1 = tops[14].x;
  const sAt = (x) => (x - x0) / (x1 - x0);
  const S_REG = sAt(POLE_X(8));
  const S_CAP = sAt(POLE_X(11));

  // Homes along the feeder; the last two have smart inverters on their rooftop solar.
  const houseList = [];
  for (let i = 2; i <= 15; i += 1) houseList.push({ x: POLE_X(i), z: i % 2 ? -3.4 : -5.6, solar: i >= 14 || i === 6 || i === 10 });
  scene.add(A.createHouses(houseList).group);
  scene.add(A.createTrees([[-24, -6], [-23, 5], [-8, -8.5], [4, -8.8], [14, -8.4], [21, -5], [21, 5], [-6, 6], [8, 6.5]].map(([x, z], i) => ({ x, z, s: 0.9 + (i % 3) * 0.15 }))));

  // ── Devices ──────────────────────────────────────────────────
  const deviceMat = (c) => M.stdMat(c, { emissive: c, emissiveIntensity: 0 });
  // Voltage regulator (pole 8): a tank hanging on the pole.
  const regMat = deviceMat('#8C97A8');
  const reg = new THREE.Group();
  reg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 12), regMat));
  for (const x of [-0.14, 0, 0.14]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.22, 6), M.mats().insulator);
    b.position.set(x, 0.5, 0);
    reg.add(b);
  }
  reg.position.set(POLE_X(8), 3.1, 0.42);
  scene.add(reg);
  // Capacitor bank (pole 11): three cans on a rack.
  const capMat = deviceMat('#8C97A8');
  const cap = new THREE.Group();
  cap.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.12), M.mats().darkMetal));
  for (const x of [-0.36, 0, 0.36]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.24), capMat);
    c.position.set(x, -0.3, 0);
    cap.add(c);
  }
  cap.position.set(POLE_X(11), 3.4, 0.4);
  scene.add(cap);
  // Smart inverters on the last two homes.
  const invMat = deviceMat('#8C97A8');
  const inverters = [14, 15].map((i) => {
    const h = houseList.find((x) => x.x === POLE_X(i));
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.08), invMat);
    box.position.set(h.x + 0.66, 0.55, h.z + 0.52);
    scene.add(box);
    return box;
  });
  // Load tap changer at the substation: a tap scale with a moving indicator.
  const ltcMat = deviceMat('#8C97A8');
  const ltc = new THREE.Group();
  for (let k = 0; k < 7; k += 1) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.05), M.mats().metal);
    tick.position.y = 0.4 + k * 0.28;
    ltc.add(tick);
  }
  const ltcIndicator = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.12), ltcMat);
  ltc.add(ltcIndicator);
  ltc.position.set(SUB_X - 1.1, 0.16, 2.3);
  scene.add(ltc);

  // Losses dial beside the substation.
  const gauge = createDialGauge({
    radius: 1.15, min: 0, max: 8,
    bands: [{ from: 0, to: 4, color: M.PALETTE.restored }, { from: 4, to: 6, color: M.PALETTE.warning }, { from: 6, to: 8, color: M.PALETTE.fault }],
  });
  gauge.group.position.set(-23, 5.4, -1.5);
  scene.add(gauge.group);

  // ── Voltage ribbon and limit planes ─────────────────────────
  const ribbon = createVoltageRibbon({ x0, x1, z: RIBBON.z, baseY: RIBBON.baseY, scale: RIBBON.scale, width: 0.9 });
  scene.add(ribbon.group);
  const yLow = ribbon.yFor(0.95);
  const yHigh = ribbon.yFor(1.05);
  scene.add(createBandPlanes({ x0, x1, z: RIBBON.z, depth: 2.2, yLow, yHigh }));

  // ── ADMS panel and packets ───────────────────────────────────
  const panel = A.createGlassPanel({ width: PANEL.w, height: PANEL.h, color: M.PALETTE.data });
  panel.group.position.set(PANEL.x, PANEL.y, PANEL.z);
  scene.add(panel.group);
  const panelPoint = (x) => V(PANEL.x + (x - PANEL.x) * 0.3, PANEL.y - PANEL.h / 2, PANEL.z + 0.1);
  const arc = (a, b) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + 2.5, (a.z + b.z) / 2), b);
  const P = content.packets;
  const trail = (from, to, color, text, kind, size) => {
    const t = new F.PacketTrail({ path: arc(from, to), color, size, label: text ? { text, kind } : null });
    scene.add(t.object3D);
    return t;
  };
  const dataTrails = [15, 14, 12].map((i, k) => {
    const h = houseList.find((x) => x.x === POLE_X(i));
    return trail(V(h.x, 1.6, h.z), panelPoint(h.x), M.PALETTE.data, k === 0 ? P.data : null, 'data');
  });
  const cmdCap = trail(panelPoint(cap.position.x), cap.position.clone().add(V(0, 0.3, 0)), M.PALETTE.command, P.capacitor, 'command', 0.26);
  const cmdReg = trail(panelPoint(reg.position.x), reg.position.clone().add(V(0, 0.6, 0)), M.PALETTE.command, P.regulator, 'command', 0.26);
  const cmdInv = inverters.map((b, k) => trail(panelPoint(b.position.x), b.position.clone(), M.PALETTE.command, k === 0 ? P.inverter : null, 'command', 0.26));
  const cmdLtc = trail(panelPoint(SUB_X), ltc.position.clone().add(V(0, 2.4, 0)), M.PALETTE.command, P.ltc, 'command', 0.26);

  // ── Labels (text from the content file) ─────────────────────
  const lab = content.labels;
  const labels = {
    adms: L.label(lab.adms, { variant: 'accent' }),
    ribbon: L.label(lab.ribbon),
    upper: L.label(lab.upper, { anchor: 'left' }),
    lower: L.label(lab.lower, { anchor: 'left' }),
    ltc: L.label(lab.ltc, { anchor: 'center' }),
    regulator: L.label(lab.regulator, { anchor: 'center' }),
    capacitor: L.label(lab.capacitor, { anchor: 'center' }),
    inverters: L.label(lab.inverters, { anchor: 'center' }),
    losses: L.label(lab.losses),
  };
  labels.adms.position.set(PANEL.x, PANEL.y + PANEL.h / 2 + 0.2, PANEL.z);
  // Positions measured at 1366×768 so labels clear each other, the readouts and the flow strip.
  labels.ribbon.position.set(x0 + 21, yHigh + 0.6, RIBBON.z);
  labels.upper.position.set(x1 + 0.6, yHigh, RIBBON.z);
  labels.lower.position.set(x1 + 0.6, yLow, RIBBON.z);
  labels.ltc.position.set(SUB_X - 1.1, 0.9, 4.3);
  labels.regulator.position.set(POLE_X(8), 4.4, 2.4);
  labels.capacitor.position.set(POLE_X(11), 0.4, 2.4);
  labels.inverters.position.set((POLE_X(14) + POLE_X(15)) / 2, 1.1, 2.4);
  labels.losses.position.set(-23, 6.9, -1.5);
  for (const l of Object.values(labels)) scene.add(l);

  // ── Voltage model ────────────────────────────────────────────
  const voltage = (s) => {
    const load = view.load / 100;
    const k = Math.min(1.1, load); // device settings follow the load (simplified)
    const tap = 1.04 - 0.016 * S.cvr;
    const drop = DROP * load * (2 * s - s * s);
    const capRise = CAP * S.cap * k * Math.min(s, S_CAP) / S_CAP;
    const regRise = s > S_REG ? REG * S.reg * k : 0;
    const invRise = INV * S.inv * k * clamp01((s - 0.86) / 0.14);
    return tap - drop + capRise + regRise + invRise;
  };

  // ── Timeline ─────────────────────────────────────────────────
  const timeline = stepTimeline([2.2, 2.4, 2.6, 2.6, 2.6, 2.0, 3.0], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) tl.to(S, { data: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.2));
    if (k === 2) tl.to(S, { calc: 1, duration: 0.6 }, q(0.1));
    if (k === 3) tl.to(S, { mCap: 1, duration: 1.0, ease: 'power1.in' }, q(0.1)).to(S, { cap: 1, duration: 1.0 }, q(1.1));
    if (k === 4) tl.to(S, { mReg: 1, duration: 1.0, ease: 'power1.in' }, q(0.1)).to(S, { reg: 1, duration: 1.0 }, q(1.1));
    if (k === 5) tl.to(S, { mInv: 1, duration: 1.0, ease: 'power1.in' }, q(0.1)).to(S, { inv: 1, duration: 1.0 }, q(1.1));
    if (k === 6) tl.to(S, { result: 1, duration: 0.8 }, q(0.1));
    if (k === 7) tl.to(S, { mLtc: 1, duration: 1.0, ease: 'power1.in' }, q(0.1)).to(S, { cvr: 1, duration: 1.4 }, q(1.1));
  });

  const presets = {
    overview: { pos: [0.5, 17, 53], target: [0.5, 5.2, 0] },
    end: { pos: [12.5, 9, 22], target: [14.5, 3.4, 0] },
    cap: { pos: [5.5, 9, 19.5], target: [8, 3.2, 0] },
    reg: { pos: [-1.5, 9, 19.5], target: [1.5, 4.0, 0] },
    sub: { pos: [-14, 9, 21.5], target: [-18.5, 3.8, 0] },
  };

  // ── Per frame ────────────────────────────────────────────────
  const yellow = C.command;
  const grey = new THREE.Color('#8C97A8');
  const tint = (mat, on, cmd, onColor) => {
    mat.color.copy(grey).lerp(onColor, on);
    mat.emissive.copy(onColor).lerp(yellow, cmd);
    mat.emissiveIntensity = 0.15 + 0.7 * Math.max(on, cmd);
  };
  const busy = (p) => (p > 0.02 && p < 0.98 ? 1 : 0);
  let hudKey = '';

  const update = (dt) => {
    ribbon.update(voltage);
    feederFlow.update(dt);
    for (const t of dataTrails) t.setProgress(S.data);
    cmdCap.setProgress(S.mCap);
    cmdReg.setProgress(S.mReg);
    for (const t of cmdInv) t.setProgress(S.mInv);
    cmdLtc.setProgress(S.mLtc);

    tint(capMat, S.cap, busy(S.mCap), C.restored);
    tint(regMat, S.reg, busy(S.mReg), C.restored);
    tint(invMat, S.inv, busy(S.mInv), C.restored);
    tint(ltcMat, 1, busy(S.mLtc), C.flow);
    ltcIndicator.position.y = 0.4 + (4.6 - 1.6 * S.cvr) * 0.28;
    panel.edgeMaterial.opacity = 0.5 + 0.5 * Math.max(S.calc, S.result);

    const load = view.load / 100;
    const losses = 6.5 * load * load * (1 - 0.24 * S.cap - 0.05 * S.reg - 0.07 * S.inv);
    gauge.setValue(losses);

    const h = content.hud;
    const lo = ribbon.min;
    const hi = ribbon.max;
    const items = [
      { label: h.lowest, value: lo.toFixed(3), mood: lo < 0.95 ? 'alert' : lo < 0.958 ? 'warn' : 'ok' },
      { label: h.highest, value: hi.toFixed(3), mood: hi > 1.05 ? 'alert' : hi > 1.042 ? 'warn' : 'ok' },
      { label: h.losses, value: `${losses.toFixed(1)}%`, mood: losses > 6 ? 'alert' : losses > 4 ? 'warn' : 'ok' },
    ];
    if (S.cvr > 0.05) items.push({ label: h.saved, value: `${(2.4 * S.cvr).toFixed(1)}%`, mood: 'ok' });
    const key = items.map((i) => i.value + i.mood).join('|');
    if (key !== hudKey) {
      hudKey = key;
      ctx.setHud({ items });
    }
  };

  const c = content.controls;
  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['end', 'overview', 'cap', 'reg', 'end', 'overview', 'sub']),
    startPreset: 'overview',
    onEnter: () => { hudKey = ''; },
    controlsLimits: { minDistance: 6, maxDistance: 80 },
    reserveShift: 0.5, // zoom out evenly: the ADMS panel label sits near the top edge
    interactions: [
      {
        id: 'load', type: 'slider', label: c.loadLabel, tip: c.loadTip, min: 30, max: 110, step: 1, value: view.load,
        format: (v) => `${v}%`,
        onChange: (v) => { view.load = v; },
      },
    ],
  });
}
