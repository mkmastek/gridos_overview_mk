// Slide 18 — AEMS demo on a six-bus network (8 lines, 2 generators, a wind farm, 3 loads).
//   Part A  state estimation: noisy measurements converge; one bad reading is flagged.
//   Part B  N-1 contingency sweep: losing line 3–5 overloads 2–5 to 112%; re-dispatch fixes it.
//   Part C  a region blacks out; AEMS builds and runs a numbered restoration plan.
// All MW values are illustrative. Visuals are driven by one numeric state S (seekable).

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createBusNode, createCityBlock } from '../kit/Transmission.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

const BUSES = [V(-15, 0, 0), V(-5, 0, -8), V(8, 0, -9), V(-5, 0, 8), V(5, 0, 0), V(15, 0, 4)];
const BUS_Y = 1.6;
// [from, to, rating MW, flow before re-dispatch, flow after re-dispatch] — flows run from → to.
const LINES = [
  { id: '1-2', a: 0, b: 1, rating: 400, flow: 140, after: 200 },
  { id: '1-4', a: 0, b: 3, rating: 250, flow: 120, after: 120 },
  { id: '2-3', a: 1, b: 2, rating: 300, flow: 230, after: 260 },
  { id: '2-5', a: 1, b: 4, rating: 250, flow: 150, after: 120 },
  { id: '3-5', a: 2, b: 4, rating: 450, flow: 330, after: 360 },
  { id: '3-6', a: 2, b: 5, rating: 300, flow: 200, after: 200 },
  { id: '5-4', a: 4, b: 3, rating: 200, flow: 80, after: 80 },
  { id: '5-6', a: 4, b: 5, rating: 200, flow: 50, after: 50 },
];
const BAD = '1-4';
const BAD_READING = 480;
// N-1: for each lost line, the worst-loaded remaining line (% before / after re-dispatch). Illustrative.
const CASES = {
  '1-2': ['1-4', 76, 79],
  '1-4': ['1-2', 65, 80],
  '2-3': ['3-6', 88, 84],
  '2-5': ['2-3', 93, 96],
  '3-5': ['2-5', 112, 92],
  '3-6': ['5-6', 81, 81],
  '5-4': ['1-4', 58, 58],
  '5-6': ['3-6', 86, 86],
};
const FAIL_CASE = '3-5';
// Part C: buses 3, 5, 6 go dark; restoration energizes in this order.
const DARK_BUSES = [2, 4, 5];
const PLAN = [
  { line: '2-5', bus: 4 },
  { line: '5-6', bus: 5 },
  { line: '3-5', bus: 2 },
  { bus: 2, wind: true },
  { lines: ['2-3', '3-6', '5-4'] },
];
const GEN = { g1: [260, 320], g2: [240, 180] };
const LOAD = { 3: 200, 4: 350, 5: 250 };
const AEMS_POS = V(0, 14.5, -6);

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M, charts: CH } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const T = content.aems;
  const pk = content.packets;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 54, depth: 40 }, shadowExtent: 30, fogNear: 70, fogFar: 160 });
  const flows = [];

  // ── Buses ───────────────────────────────────────────────────
  const buses = BUSES.map((p, i) => {
    const b = createBusNode({ radius: 1.4 });
    b.group.position.copy(p);
    scene.add(b.group);
    // Buses 4 and 5 sit among busy line chips: bus 4's tag goes to its left, bus 5's in front of it.
    const anchor = i === 3 ? 'right' : i === 4 ? 'center' : 'bottom';
    const tag = L.tagLabel(fill(T.busTag, { n: i + 1 }), fill(T.busTip, { n: i + 1 }), { anchor });
    tag.position.copy(p).add(i === 3 ? V(-1.5, 1.2, 0) : i === 4 ? V(0, 0.3, 2.2) : V(0, 2.4, 0));
    scene.add(tag);
    return { ...b, tag, color: new THREE.Color() };
  });

  // ── Lines: glowing tubes with flow particles and value chips ─
  const top = (i) => BUSES[i].clone().setY(BUS_Y);
  const lines = {};
  for (const ln of LINES) {
    const path = A.catenary(top(ln.a), top(ln.b), 0.35, 14);
    const mat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.6 });
    scene.add(A.createConductor(path, mat, 0.12));
    // `particles`, not `flow`: each line's `flow` is its MW value.
    const particles = new F.PowerFlow({ path, color: M.PALETTE.flow, density: 1.3, size: 0.42 });
    scene.add(particles.object3D);
    flows.push(particles);
    const mid = path[Math.floor(path.length / 2)].clone();
    const chip = document.createElement('div');
    chip.className = 'tag3d';
    const chipObj = L.elementLabel(chip, { anchor: 'center' });
    chipObj.position.copy(mid).add(V(0, 0.9, 0));
    scene.add(chipObj);
    lines[ln.id] = { ...ln, mat, particles, mid, chip, chipObj, color: new THREE.Color() };
  }
  const suspect = document.createElement('div');
  suspect.className = 'tag3d is-fault';
  suspect.textContent = fill(T.suspect, { mw: BAD_READING });
  const suspectObj = L.elementLabel(suspect);
  suspectObj.position.copy(lines[BAD].mid).add(V(0, 1.5, 0));
  scene.add(suspectObj);

  // ── Generators, wind farm and loads ─────────────────────────
  const g1 = A.createGasPlant();
  g1.scale.setScalar(0.7);
  g1.position.set(-21.5, 0, -1);
  g1.rotation.y = Math.PI / 2;
  const g2 = A.createGasPlant();
  g2.scale.setScalar(0.7);
  g2.position.set(-6, 0, -14.5);
  scene.add(g1, g2);
  const turbines = [[11, -14.5], [14.5, -12.5], [7.5, -15.5]].map(([x, z]) => {
    const t = A.createWindTurbine({ height: 4.8, radius: 1.6 });
    t.group.position.set(x, 0, z);
    t.rotor.rotation.x = Math.random() * Math.PI;
    scene.add(t.group);
    return t;
  });
  const city4 = createCityBlock({ seed: 2 });
  city4.position.set(-6, 0, 13.5);
  const city5 = createCityBlock({ seed: 3 });
  city5.scale.setScalar(0.8);
  city5.position.set(8.5, 0, 3.4);
  const dc = A.createDataCenter({ w: 3.6, d: 2.4, h: 1.3 });
  dc.group.position.set(18, 0, 9);
  scene.add(city4, city5, dc.group);
  const feed = (a, b, bus) => {
    const f = new F.PowerFlow({ path: [a.clone().setY(0.12), b.clone().setY(0.12)], color: M.PALETTE.flow, density: 1, size: 0.3 });
    f.bus = bus;
    scene.add(f.object3D);
    flows.push(f);
    return f;
  };
  const feeds = [feed(V(-19.5, 0, -0.6), BUSES[0], 0), feed(V(-5.6, 0, -12.5), BUSES[1], 1), feed(V(10.5, 0, -13.5), BUSES[2], 2),
    feed(BUSES[3], V(-6, 0, 12), 3), feed(BUSES[4], V(7.6, 0, 2.6), 4), feed(BUSES[5], V(17.4, 0, 7.6), 5)];

  // Generator output bars (re-dispatch)
  const bars = {
    g1: CH.createBarGauge({ height: 3.2, width: 0.6, maxPct: 100, limitPct: 100 }),
    g2: CH.createBarGauge({ height: 3.2, width: 0.6, maxPct: 100, limitPct: 100 }),
  };
  bars.g1.group.position.set(-18.4, 0, 3.2);
  bars.g2.group.position.set(-1.8, 0, -13.2);
  scene.add(bars.g1.group, bars.g2.group);
  const barChip = (key) => {
    const el = document.createElement('div');
    el.className = 'tag3d';
    const o = L.elementLabel(el);
    o.position.copy(bars[key].group.position).add(V(0, 3.7, 0));
    scene.add(o);
    return el;
  };
  const barChips = { g1: barChip('g1'), g2: barChip('g2') };

  const gl = (def, x, y, z) => { const l = L.label(def); l.position.set(x, y, z); scene.add(l); return l; };
  // City 4 is in the front row: its label sits to the right of the block, clear of bus 4 and the bottom edge.
  const load4Label = L.label(lab.load4, { anchor: 'left' });
  load4Label.position.set(-3.2, 1.4, 13.5);
  scene.add(load4Label);
  // The wind label sits to the right of the turbines so it stays clear of the AEMS panel above them.
  const windLabel = L.label(lab.wind, { anchor: 'left' });
  windLabel.position.set(16.2, 3.4, -12.5);
  scene.add(windLabel);
  const groundLabels = [
    gl(lab.gen1, -21.5, 3.4, -1), gl(lab.gen2, -9.5, 3.4, -15), windLabel,
    gl(lab.load5, 8.5, 0.6, 7.2), load4Label, gl(lab.load6, 17, 2.6, 10.5),
  ];

  // ── AEMS panel, data streams, labelled packets ──────────────
  const panel = A.createGlassPanel({ width: 9, height: 2.8, color: M.BRAND.lightBlue });
  panel.group.position.copy(AEMS_POS);
  scene.add(panel.group);
  const aemsLabel = L.label(lab.aems, { variant: 'big', anchor: 'center' });
  aemsLabel.position.copy(AEMS_POS);
  scene.add(aemsLabel);
  const factLabel = L.label(lab.fact, { variant: 'accent' });
  factLabel.position.copy(AEMS_POS).add(V(0, 1.7, 0));
  scene.add(factLabel);

  const panelBottom = (x) => V(AEMS_POS.x + x * 0.25, AEMS_POS.y - 1.4, AEMS_POS.z);
  const busTop = (i) => BUSES[i].clone().add(V(0, 2, 0));
  const meas = new F.PacketStream({ paths: BUSES.map((p, i) => [busTop(i), panelBottom(p.x)]), color: M.PALETTE.data, perPath: 2, velocity: 4, intensity: 0 });
  const cmds = new F.PacketStream({ paths: [4, 5, 2].map((i) => [panelBottom(BUSES[i].x), busTop(i)]), color: M.PALETTE.command, perPath: 1, size: 0.28, velocity: 3.4, intensity: 0 });
  scene.add(meas.object3D, cmds.object3D);
  flows.push(meas, cmds);
  const arc = (a, b) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + 2, (a.z + b.z) / 2), b);
  const trail = (a, b, text, kind, color) => {
    const t = new F.PacketTrail({ path: arc(a, b), color, label: { text, kind } });
    scene.add(t.object3D);
    return t;
  };
  const trails = {
    t1: trail(busTop(2), panelBottom(BUSES[2].x), pk.measurement, 'data', M.PALETTE.data),
    t2: trail(panelBottom(-15), bars.g1.group.position.clone().add(V(0, 3.4, 0)), pk.redispatch, 'command', M.PALETTE.command),
    t3: trail(panelBottom(5), busTop(4), pk.close, 'command', M.PALETTE.command),
  };

  // Numbered restoration markers
  const planTags = PLAN.map((p, i) => {
    const el = document.createElement('div');
    el.className = 'tag3d is-command';
    el.textContent = String(i + 1);
    const o = L.elementLabel(el, { anchor: 'center' });
    const at = p.line ? lines[p.line].mid.clone().add(V(0, 2.1, 0)) : p.lines ? lines[p.lines[1]].mid.clone().add(V(0, 2.1, 0)) : BUSES[p.bus].clone().add(V(1.8, 3.6, 0));
    o.position.copy(at);
    scene.add(o);
    return o;
  });

  // ── State and timeline ─────────────────────────────────────
  const S = {
    meas: 0, noise: 1, suspect: 0,
    sweepOn: 0, sweep: 0, focus: 0, redispatch: 0,
    dark: 0, r: 0, cmd: 0, fact: 0, values: 1,
    t1: 0, t2: 0, t3: 0,
  };
  const timeline = stepTimeline([2.6, 2.8, 2.4, 4.2, 2.4, 2.8, 2.2, 5, 2.4], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    switch (k) {
      case 1: tl.to(S, { meas: 1, duration: 0.6 }, q(0)).to(S, { t1: 1, duration: 1.9, ease: 'power1.inOut' }, q(0.4)); break;
      case 2: tl.to(S, { noise: 0, duration: 2.3, ease: 'power2.out' }, q(0.2)); break;
      case 3: tl.to(S, { suspect: 1, duration: 0.5 }, q(0.2)); break;
      case 4: tl.to(S, { meas: 0.25, sweepOn: 1, duration: 0.3 }, q(0)).to(S, { sweep: 7.99, duration: 3.6, ease: 'none' }, q(0.4)); break;
      case 5: tl.to(S, { focus: 1, duration: 0.4 }, q(0.1)); break;
      case 6: tl.to(S, { t2: 1, duration: 1.3, ease: 'power1.in' }, q(0.1)).to(S, { redispatch: 1, duration: 1.0 }, q(1.4)); break;
      case 7: tl.to(S, { sweepOn: 0, focus: 0, values: 0, meas: 0, duration: 0.3 }, q(0)).to(S, { dark: 1, duration: 0.8 }, q(0.4)); break;
      case 8:
        tl.to(S, { cmd: 1, duration: 0.3 }, q(0.1)).to(S, { t3: 1, duration: 1.1, ease: 'power1.in' }, q(0.1));
        tl.to(S, { r: 5, duration: 4.2, ease: 'none' }, q(0.6));
        break;
      case 9: tl.to(S, { cmd: 0, fact: 1, duration: 0.6 }, q(0.1)); break;
      default:
    }
  });

  const presets = {
    overview: { pos: [0, 23.5, 45], target: [0, 5.5, -2] },
    network: { pos: [-1, 27, 44], target: [-1, 4.2, 0] },
    focus: { pos: [3, 17, 18], target: [2, 2, -3] },
    aems: { pos: [-1, 25, 47], target: [-1, 7.2, -2] },
  };

  // ── Per-frame rendering ─────────────────────────────────────
  const tmp = new THREE.Color();
  const loadColor = (pct, out) => out.copy(pct > 100 ? C.fault : pct >= 80 ? C.warning : C.flow);
  let hudKey = '';

  function update(dt, t) {
    const dark = S.dark;
    const restored = (i) => S.r >= i + 1;
    const busOn = BUSES.map((_, i) => {
      if (!DARK_BUSES.includes(i)) return 1;
      const step = PLAN.findIndex((p) => p.bus === i && !p.wind);
      return dark < 0.5 ? 1 : restored(step) ? 1 : 0;
    });
    const lineOn = (id) => {
      const ln = lines[id];
      if (dark < 0.5) return 1;
      if (!DARK_BUSES.includes(ln.a) && !DARK_BUSES.includes(ln.b)) return 1;
      const step = PLAN.findIndex((p) => p.line === id || p.lines?.includes(id));
      return restored(step) ? 1 : 0;
    };

    // Which N-1 case is being shown
    const caseIds = Object.keys(CASES);
    const caseId = S.sweepOn > 0.5 ? (S.focus > 0.5 ? FAIL_CASE : caseIds[Math.min(7, Math.floor(S.sweep))]) : null;
    const worst = caseId ? CASES[caseId] : null;
    const worstPct = worst ? Math.round(worst[1] + (worst[2] - worst[1]) * S.redispatch) : 0;

    for (const ln of Object.values(lines)) {
      const on = lineOn(ln.id) * (caseId === ln.id ? 0 : 1);
      const mw = ln.flow + (ln.after - ln.flow) * S.redispatch;
      let pct = (mw / ln.rating) * 100;
      if (worst && worst[0] === ln.id) pct = worstPct;
      const col = on ? loadColor(pct, ln.color) : ln.color.copy(C.off);
      if (S.suspect > 0.5 && ln.id === BAD) col.lerp(C.fault, 0.4 + 0.3 * Math.sin(t * 6));
      ln.mat.color.copy(col);
      ln.mat.emissive.copy(col);
      ln.mat.emissiveIntensity = on ? 0.6 : 0.15;
      const dim = caseId && !(worst && worst[0] === ln.id) && caseId !== ln.id ? 0.45 : 1;
      ln.particles.intensity = on * dim;
      ln.particles.color.copy(col);
      ln.particles.velocity = 1.2 + mw / 70;
      ln.particles.update(dt);

      // Value chip: noisy measurement → converged estimate; the bad reading shows until flagged.
      let shown = mw + S.noise * 28 * Math.sin(t * 3.1 + ln.rating * 0.37 + ln.flow);
      if (ln.id === BAD && S.suspect < 0.5) shown = BAD_READING + S.noise * 20 * Math.sin(t * 2.3);
      const isWorst = worst && worst[0] === ln.id;
      const text = isWorst ? fill(T.loading, { pct: worstPct }) : fill(T.flowLabel, { mw: Math.round(shown) });
      if (ln.chip.textContent !== text) ln.chip.textContent = text;
      ln.chip.classList.toggle('is-fault', Boolean(isWorst && worstPct > 100));
      ln.chip.classList.toggle('is-command', Boolean(isWorst && worstPct <= 100));
      L.setLabelOpacity(ln.chipObj, S.values * on * (caseId && !isWorst ? 0.35 : 1));
    }
    L.setLabelOpacity(suspectObj, S.suspect * S.values * (1 - S.focus));

    // Buses, feeders and the wind farm
    buses.forEach((b, i) => {
      b.color.copy(busOn[i] ? C.flow : C.off);
      if (dark > 0.5 && busOn[i] && DARK_BUSES.includes(i)) b.color.lerp(C.restored, 0.5);
      b.setColor(b.color, busOn[i] ? 0.7 : 0.15);
      b.tag.element.classList.toggle('is-fault', !busOn[i]);
    });
    const windOn = dark < 0.5 || S.r >= 4;
    if (windOn) for (const tb of turbines) tb.rotor.rotation.x += dt * 1.1;
    for (const f of feeds) {
      f.intensity = f.bus === 2 ? (windOn ? 1 : 0) : busOn[f.bus];
      f.update(dt);
    }

    // Generator bars
    for (const key of ['g1', 'g2']) {
      const [a, b] = GEN[key];
      const mw = a + (b - a) * S.redispatch;
      bars[key].setValue((mw / 400) * 100);
      bars[key].setColor(S.redispatch > 0.02 && S.redispatch < 0.98 ? C.command : C.flow);
      bars[key].setOpacity(1);
      const txt = fill(T.flowLabel, { mw: Math.round(mw) });
      if (barChips[key].textContent !== txt) barChips[key].textContent = txt;
    }

    // Packets and streams
    meas.intensity = S.meas;
    cmds.intensity = S.cmd;
    meas.update(dt);
    cmds.update(dt);
    for (const [k, tr] of Object.entries(trails)) tr.setProgress(S[k]);
    planTags.forEach((o, i) => L.setLabelOpacity(o, dark > 0.5 ? clamp01(S.r - i) : 0));
    panel.material.opacity = 0.16 + 0.2 * Math.max(S.meas, S.cmd, S.fact);
    L.setLabelOpacity(factLabel, S.fact);
    for (const l of groundLabels) L.setLabelOpacity(l, (1 - 0.55 * S.sweepOn) * (1 - S.focus));

    // Live readouts
    let items = null;
    if (dark > 0.5) {
      const lost = LOAD[4] + LOAD[5];
      const back = (busOn[4] ? LOAD[4] : 0) + (busOn[5] ? LOAD[5] : 0);
      const pct = Math.round((back / lost) * 100);
      items = [{ label: T.hudRestored, value: fill(T.pctValue, { pct }), mood: pct >= 100 ? 'ok' : 'alert' }];
    } else if (S.sweepOn > 0.5) {
      items = [{ label: T.hudWorst, value: fill(T.pctValue, { pct: worstPct }), mood: worstPct > 100 ? 'alert' : 'ok' }];
    } else if (S.meas > 0.05) {
      const mw = (0.3 + 12.1 * S.noise).toFixed(1);
      items = [{ label: T.hudMismatch, value: fill(T.mismatchValue, { mw }), mood: S.noise < 0.1 ? 'ok' : '' }];
    }
    const key = JSON.stringify(items);
    if (key !== hudKey) {
      hudKey = key;
      ctx.setHud(items ? { items } : null);
    }
  }

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['network', 'network', 'network', 'overview', 'focus', 'overview', 'overview', 'overview', 'aems']),
    startPreset: 'overview',
    onEnter: () => { hudKey = ''; },
    controlsLimits: { minDistance: 8, maxDistance: 90 },
  });
}
