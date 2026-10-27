// Slide 14 — DERMS demo: too much rooftop solar on a sunny afternoon.
// 24 homes (16 with solar, 6 with batteries, 4 with EV chargers) share one transformer.
// Exports show as purple reverse flow. DERMS forecasts the 13:00 voltage problem, sends
// export envelopes (DOEs) and charges batteries; at the evening peak batteries discharge
// and EV chargers pause. The time slider and the DERMS switch let the user explore freely;
// pressing Play or a step returns to the guided demo. All numbers are illustrative.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';
import { createSunArc, createDaylight } from '../kit/Weather.js';
import { createDialGauge, createEnvelopeBars } from '../kit/Gauges.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const XFMR = V(0, 3.55, -0.95);
const RATING = 34; // transformer rating, same units as the house loads
const V_LIMIT = 1.05;
const NON_SOLAR = new Set([2, 5, 8, 11, 14, 17, 20, 23]);
const BATTERY = [0, 4, 9, 13, 18, 22];
const EV = [3, 7, 15, 19];
const LIMITED = [1, 6, 10, 12, 16, 21]; // homes whose export envelope shrinks
const DIRECT = [1, 6, 10, 12]; // envelopes sent straight from the Gateway
const VIA_AGG = [16, 21]; // envelopes sent through the aggregator
const DERMS_PANEL = V(-9, 10.2, -11);
const CHART = { pos: V(5, 10.6, -11), w: 10, h: 5 };
const AGG = V(14, 0, -7);

// ── Illustrative physics (per home, normalised units) ─────────────
const sol = (h) => (h <= 6 || h >= 19 ? 0 : Math.sin(Math.PI * (h - 6) / 13) ** 1.3);
const demand = (h) => 0.35 + 0.25 * Math.exp(-(((h - 7.5) / 1.2) ** 2)) + 0.85 * Math.exp(-(((h - 19) / 1.7) ** 2));
const evDemand = (h) => 1.5 * Math.exp(-(((h - 19.2) / 1.3) ** 2));
const eveningWindow = (h) => Math.exp(-(((h - 19) / 1.8) ** 2));

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const C = M.COLOR;
  const { scene, camera, lights } = A.createBaseScene({ ground: { width: 50, depth: 32 }, shadowExtent: 26, fogNear: 70, fogFar: 150 });
  const setDaylight = createDaylight(scene, lights);
  const flows = [];
  const view = { manual: false, hour: 9, dermsOn: true };
  const S = { hour: 9, meter: 0, forecast: 0, opt: 0, bars: 0, env: 0, env2: 0, doe: 0, eveCmd: 0, eve: 0 };

  // ── Street, feeder and transformer ──────────────────────────
  scene.add(A.createRoad(V(-24, 0, 0.4), V(24, 0, 0.4), 1.6));
  const poleXs = [-18, -12, -6, 0];
  const tops = poleXs.map((x) => {
    const p = A.createPole({ height: 4.6 });
    p.position.set(x, 0, -1.2);
    scene.add(p);
    return p.position.clone().add(p.userData.top);
  });
  let feeder = [V(-24, 4.4, -1.2)];
  for (let i = 0; i < tops.length; i += 1) feeder = A.joinPaths(feeder, A.catenary(i ? tops[i - 1] : V(-24, 4.4, -1.2), tops[i], 0.3, 8));
  scene.add(A.createConductor(feeder, M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.4 }), 0.04));
  const feederFlow = new F.PowerFlow({ path: feeder, color: M.PALETTE.flow, velocity: 3 });
  scene.add(feederFlow.object3D);
  flows.push(feederFlow);
  const xf = A.createDistTransformer();
  xf.position.set(0, 3.3, -1.2);
  scene.add(xf);
  const loadRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 32), M.glowMat(M.PALETTE.flow, { blending: THREE.NormalBlending }));
  loadRing.position.copy(XFMR);
  loadRing.rotation.x = Math.PI / 2;
  scene.add(loadRing);

  // ── 24 homes ─────────────────────────────────────────────────
  const homes = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 6; c += 1) {
      const i = r * 6 + c;
      const south = r >= 2;
      homes.push({
        x: -7.5 + c * 3, z: [-4.2, -7.0, 4.6, 7.4][r], rot: south ? Math.PI : 0,
        solar: !NON_SOLAR.has(i), battery: BATTERY.includes(i), ev: EV.includes(i),
      });
    }
  }
  const houses = A.createHouses(homes);
  scene.add(houses.group);
  const local = (h, x, y, z) => { const s = Math.cos(h.rot); return V(h.x + x * s, y, h.z + z * s); };

  // One flow per service drop (transformer → home; reversed when the home exports).
  const homeFlows = homes.map((h) => {
    const roof = V(h.x, 1.45, h.z + (h.rot ? -0.4 : 0.4));
    const path = A.catenary(XFMR.clone(), roof, 0.25, 8);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(path), new THREE.LineBasicMaterial({ color: '#4C5F99', transparent: true, opacity: 0.6 }));
    scene.add(line);
    const f = new F.PowerFlow({ path, color: M.PALETTE.flow, density: 1.8, size: 0.32, velocity: 2.2 });
    scene.add(f.object3D);
    flows.push(f);
    return f;
  });

  // Envelope bars above the 16 solar roofs (height = allowed export).
  const solarIdx = homes.map((h, i) => (h.solar ? i : -1)).filter((i) => i >= 0);
  const bars = createEnvelopeBars(solarIdx.map((i) => V(homes[i].x - 0.35, 1.45, homes[i].z)));
  scene.add(bars.mesh);

  // Battery and charger state lights.
  const dotGeo = new THREE.SphereGeometry(0.16, 10, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, BATTERY.length + EV.length);
  const dotPos = [...BATTERY.map((i) => local(homes[i], 0.68, 0.62, 0.32)), ...EV.map((i) => local(homes[i], 0.92, 0.72, 0.68))];
  const mtx = new THREE.Matrix4();
  dotPos.forEach((p, i) => { mtx.makeTranslation(p.x, p.y, p.z); dots.setMatrixAt(i, mtx); dots.setColorAt(i, C.off); });
  scene.add(dots);

  // ── Sun, gauge, aggregator ───────────────────────────────────
  const sun = createSunArc({ center: V(0, 0, -19), radius: 24, height: 0.72 });
  scene.add(sun.group);
  const gauge = createDialGauge({
    radius: 1.1, min: 0.94, max: 1.08,
    bands: [
      { from: 0.94, to: 0.95, color: M.PALETTE.warning },
      { from: 0.95, to: 1.04, color: M.PALETTE.restored },
      { from: 1.04, to: 1.05, color: M.PALETTE.warning },
      { from: 1.05, to: 1.08, color: M.PALETTE.fault },
    ],
  });
  gauge.group.position.set(0, 6.0, -1.2);
  scene.add(gauge.group);
  const agg = new THREE.Group();
  agg.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 2), M.mats().buildingDark));
  agg.children[0].position.y = 0.8;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), M.mats().metal);
  mast.position.set(0.6, 2.4, 0);
  agg.add(mast);
  agg.position.copy(AGG);
  scene.add(agg);

  // ── DERMS panel and forecast chart ──────────────────────────
  const dermsPanel = A.createGlassPanel({ width: 7, height: 3, color: M.PALETTE.data });
  dermsPanel.group.position.copy(DERMS_PANEL);
  scene.add(dermsPanel.group);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const chart = A.createGlassPanel({ width: CHART.w, height: CHART.h, color: M.PALETTE.data, map: tex, opacity: 0.95 });
  chart.group.position.copy(CHART.pos);
  scene.add(chart.group);

  // ── Packets ──────────────────────────────────────────────────
  const P = content.packets;
  const arc = (a, b, lift = 2.5) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const pBottom = DERMS_PANEL.clone().add(V(0, -1.5, 0.1));
  const roofOf = (i) => V(homes[i].x, 1.6, homes[i].z);
  const trail = (path, color, text, kind) => {
    const t = new F.PacketTrail({ path, color, size: 0.24, label: text ? { text, kind } : null });
    scene.add(t.object3D);
    return t;
  };
  const meterTrails = [0, 9, 13, 22].map((i, k) => trail(arc(roofOf(i), pBottom), M.PALETTE.data, k === 0 ? P.meter : null, 'data'));
  const envTrails = DIRECT.map((i, k) => trail(arc(pBottom, roofOf(i)), M.PALETTE.command, k === 0 ? P.envelope : null, 'command'));
  const aggTop = AGG.clone().add(V(0.6, 3.2, 0));
  const toAgg = trail(arc(pBottom, aggTop, 3), M.PALETTE.command, null, 'command');
  const fromAgg = VIA_AGG.map((i, k) => trail(arc(aggTop, roofOf(i), 1.5), M.PALETTE.command, k === 0 ? P.envelope : null, 'command'));
  const batTrails = BATTERY.slice(0, 3).map((i, k) => trail(arc(pBottom, roofOf(i)), M.PALETTE.command, k === 0 ? P.battery : null, 'command'));
  const evTrails = EV.slice(0, 2).map((i, k) => trail(arc(pBottom, roofOf(i)), M.PALETTE.command, k === 0 ? P.ev : null, 'command'));

  // ── Labels ───────────────────────────────────────────────────
  const lab = content.labels;
  const labels = {
    derms: L.label(lab.derms, { variant: 'accent' }),
    forecast: L.label(lab.forecast),
    transformer: L.label(lab.transformer, { anchor: 'left' }),
    aggregator: L.label(lab.aggregator),
  };
  labels.derms.position.copy(DERMS_PANEL).add(V(0, 1.7, 0));
  labels.forecast.position.copy(CHART.pos).add(V(0, CHART.h / 2 + 0.2, 0));
  labels.transformer.position.set(1.5, 6.4, -1.2);
  labels.aggregator.position.copy(AGG).add(V(0, 3.4, 0));
  for (const l of Object.values(labels)) scene.add(l);

  // ── Timeline ─────────────────────────────────────────────────
  const timeline = stepTimeline([2.0, 2.6, 2.2, 3.0, 2.6, 3.2], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) tl.to(S, { hour: 10, duration: 1.6, ease: 'power1.inOut' }, q(0.2));
    if (k === 2) {
      tl.to(S, { meter: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { forecast: 1, duration: 0.8 }, q(1.6));
    }
    if (k === 3) {
      tl.to(S, { opt: 1, duration: 0.6 }, q(0.1));
      tl.to(S, { bars: 1, duration: 0.8 }, q(0.6));
      tl.to(S, { hour: 10.5, duration: 1.4 }, q(0.6));
    }
    if (k === 4) {
      tl.to(S, { env: 1, duration: 1.2, ease: 'power1.in' }, q(0.1));
      tl.to(S, { env2: 1, duration: 1.0, ease: 'power1.inOut' }, q(1.3));
      tl.to(S, { doe: 1, duration: 0.8 }, q(1.2));
      tl.to(S, { hour: 11, duration: 1.5 }, q(1.3));
    }
    if (k === 5) tl.to(S, { hour: 13, duration: 2.2, ease: 'power1.inOut' }, q(0.2));
    if (k === 6) {
      tl.to(S, { hour: 18.5, duration: 1.8, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { eveCmd: 1, duration: 1.0, ease: 'power1.in' }, q(1.9));
      tl.to(S, { eve: 1, duration: 0.8 }, q(2.3));
    }
  });

  const presets = {
    overview: { pos: [0, 14, 28], target: [0, 4.5, -2] },
    // Framed (measured at 1366×768) so labels clear the flow strip.
    chart: { pos: [0, 13.5, 21], target: [-1, 8.8, -8] },
    homes: { pos: [3, 9.5, 21], target: [0.5, 2.6, -1] },
    gateway: { pos: [1, 11.5, 22], target: [1, 5.5, -4] },
  };

  // ── Simulation for one hour and control level ───────────────
  const simulate = (h, doeCtrl, eveCtrl, out = null) => {
    let net = 0;
    const s = sol(h);
    const d = demand(h);
    const evening = eveningWindow(h);
    homes.forEach((home, i) => {
      const isBatt = BATTERY.includes(i);
      const gen = home.solar ? s : 0;
      const charge = isBatt ? Math.min(0.9, s * 0.9) * doeCtrl : 0;
      const ev = home.ev ? evDemand(h) * (1 - eveCtrl) : 0;
      const discharge = isBatt ? Math.min(d, 0.9 * evening) * eveCtrl : 0;
      const load = d + ev + charge - discharge;
      const allowed = LIMITED.includes(i) ? lerp(1, 0.45, doeCtrl) : 1;
      const n = gen >= load ? -Math.min(gen - load, allowed) : load - gen;
      net += n;
      if (out) out[i] = { n, charge, discharge, ev, allowed };
    });
    return net;
  };
  const voltageOf = (net) => (net < 0 ? 1 - 0.0085 * net : 1 - 0.0013 * net);

  // ── Forecast chart drawing ───────────────────────────────────
  const g2d = canvas.getContext('2d');
  const T = content.chart;
  let chartSig = '';
  const drawChart = (hour, doeCtrl, eveCtrl, showRisk) => {
    const sig = [hour.toFixed(1), doeCtrl.toFixed(2), eveCtrl.toFixed(2), showRisk].join();
    if (sig === chartSig) return;
    chartSig = sig;
    const g = g2d;
    const W = canvas.width;
    const H = canvas.height;
    const x0 = 90;
    const x1 = W - 40;
    const yMid = 300;
    const sx = (h) => x0 + ((h - 6) / 16) * (x1 - x0);
    const sy = (v) => yMid - v * 6.4;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(14, 24, 70, 0.92)';
    roundRect(g, 4, 4, W - 8, H - 8, 22);
    g.fill();
    g.strokeStyle = 'rgba(15, 189, 255, 0.85)';
    g.lineWidth = 3;
    g.stroke();
    // zero line and voltage-risk threshold (net export that would push voltage over the limit)
    g.strokeStyle = 'rgba(185, 198, 234, 0.4)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0, yMid); g.lineTo(x1, yMid); g.stroke();
    const riskNet = -(V_LIMIT - 1) / 0.0085;
    g.setLineDash([12, 8]);
    g.strokeStyle = '#E63946';
    g.beginPath(); g.moveTo(x0, sy(riskNet)); g.lineTo(x1, sy(riskNet)); g.stroke();
    g.setLineDash([]);
    g.font = '600 22px "Titillium Web", "Trebuchet MS", sans-serif';
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillStyle = '#FF8A93';
    g.fillText(T.risk, x0 + 6, sy(riskNet) + 18);
    // hour ticks
    g.fillStyle = '#B9C6EA';
    g.textAlign = 'center';
    for (let h = 6; h <= 22; h += 3) g.fillText(`${String(h).padStart(2, '0')}:00`, sx(h), H - 34);
    // curves
    const curve = (fn, color, width, dash = []) => {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.setLineDash(dash);
      g.beginPath();
      for (let h = 6; h <= 22; h += 0.25) {
        const x = sx(h);
        const y = sy(fn(h));
        if (h === 6) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
      g.setLineDash([]);
    };
    curve((h) => 24 * demand(h) + 4 * evDemand(h), '#E6ECF5', 4);
    curve((h) => 16 * sol(h), '#EBAA01', 4);
    curve((h) => simulate(h, 0, 0), 'rgba(174, 99, 228, 0.55)', 3, [10, 8]);
    if (doeCtrl > 0.01 || eveCtrl > 0.01) curve((h) => simulate(h, doeCtrl, eveCtrl), '#AE63E4', 5);
    if (showRisk) {
      g.fillStyle = 'rgba(230, 57, 70, 0.28)';
      g.fillRect(sx(11.2), sy(-12), sx(14.8) - sx(11.2), sy(riskNet) - sy(-12));
    }
    // now line
    g.strokeStyle = '#0FBDFF';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(sx(hour), 60); g.lineTo(sx(hour), H - 60); g.stroke();
    g.fillStyle = '#0FBDFF';
    g.fillText(T.now, sx(hour), 46);
    // legend
    const key = (x, color, text) => { g.fillStyle = color; g.fillRect(x, 28, 26, 8); g.fillStyle = '#E6ECF5'; g.textAlign = 'left'; g.fillText(text, x + 34, 32); };
    key(x0, '#E6ECF5', T.demand);
    key(x0 + 190, '#EBAA01', T.solar);
    key(x0 + 360, '#AE63E4', T.reverse);
    tex.needsUpdate = true;
  };

  // ── Per frame ────────────────────────────────────────────────
  const per = new Array(homes.length);
  const reverseC = C.reverse;
  const flowC = C.flow;
  let hudKey = '';
  let syncedHour = -1;
  const hhmm = (h) => {
    const m = Math.round(h * 60);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  const update = (dt) => {
    const hour = view.manual ? view.hour : S.hour;
    if (!view.manual && Math.abs(hour - syncedHour) > 0.05) {
      syncedHour = hour;
      ctx.setControl('hour', Math.round(hour * 4) / 4);
    }
    const on = view.dermsOn ? 1 : 0;
    const doeCtrl = view.manual ? on : on * S.doe;
    const eveCtrl = view.manual ? on : on * S.eve;
    const net = simulate(hour, doeCtrl, eveCtrl, per);

    // Sun, daylight and windows
    sun.setHour(hour);
    const day = sun.daylight(hour);
    setDaylight(0.3 + 0.7 * day);
    // Light follows the sun east → west but shines from the viewer's side so fronts stay lit.
    lights.dir.position.set(sun.position.x, Math.max(6, sun.position.y), 14);
    houses.setLit(clamp01(1.15 - day * 1.1));

    // Service-drop flows: purple when the home exports, turquoise when it imports.
    homes.forEach((home, i) => {
      const f = homeFlows[i];
      const { n } = per[i];
      f.direction = n < 0 ? -1 : 1;
      f.color.copy(n < 0 ? reverseC : flowC);
      f.intensity = Math.abs(n) > 0.02 ? Math.min(1, 0.25 + Math.abs(n)) : 0;
      f.update(dt);
    });
    feederFlow.direction = net < 0 ? -1 : 1;
    feederFlow.color.copy(net < 0 ? reverseC : flowC);
    feederFlow.intensity = Math.min(1, 0.3 + Math.abs(net) / 12);
    feederFlow.update(dt);

    // Transformer voltage and loading
    const v = voltageOf(net);
    const loading = (Math.abs(net) / RATING) * 100;
    gauge.setValue(v);
    const loadC = loading > 100 ? C.fault : loading > 80 ? C.warning : C.flow;
    loadRing.material.color.copy(loadC);

    // Envelope bars and device lights
    const barsVis = view.manual ? 1 : S.bars;
    bars.mesh.material.opacity = 0.25 + 0.65 * barsVis;
    solarIdx.forEach((i, k) => {
      const limited = per[i].allowed < 0.99;
      bars.set(k, 1.2 * per[i].allowed, limited ? C.command : C.restored);
    });
    bars.commit();
    BATTERY.forEach((i, k) => {
      const { charge, discharge } = per[i];
      dots.setColorAt(k, charge > 0.05 ? C.restored : discharge > 0.05 ? C.flow : C.off);
    });
    EV.forEach((i, k) => {
      const charging = per[i].ev > 0.05;
      const paused = evDemand(hour) > 0.05 && !charging;
      dots.setColorAt(BATTERY.length + k, charging ? C.restored : paused ? C.command : C.off);
    });
    dots.instanceColor.needsUpdate = true;

    // Packets (commands only when DERMS is on)
    for (const t of meterTrails) t.setProgress(S.meter);
    for (const t of envTrails) t.setProgress(on * S.env);
    toAgg.setProgress(on * S.env);
    for (const t of fromAgg) t.setProgress(on * S.env2);
    for (const t of [...batTrails, ...evTrails]) t.setProgress(on * S.eveCmd);
    dermsPanel.edgeMaterial.opacity = 0.5 + 0.5 * Math.max(S.forecast, S.opt) * on;

    drawChart(hour, doeCtrl, eveCtrl, (view.manual || S.forecast > 0.5) && doeCtrl < 0.5);

    const h = content.hud;
    const items = [
      { label: h.time, value: hhmm(hour), mood: '' },
      { label: h.voltage, value: v.toFixed(3), mood: v > V_LIMIT ? 'alert' : v > 1.04 ? 'warn' : 'ok' },
      { label: h.loading, value: `${Math.round(loading)}%`, mood: loading > 100 ? 'alert' : loading > 80 ? 'warn' : 'ok' },
    ];
    const key = items.map((x) => x.value + x.mood).join('|');
    if (key !== hudKey) {
      hudKey = key;
      ctx.setHud({ items });
    }
  };

  const c = content.controls;
  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['overview', 'chart', 'homes', 'gateway', 'overview', 'overview']),
    startPreset: 'overview',
    onEnter: () => { hudKey = ''; chartSig = ''; syncedHour = -1; },
    // Any demo step (Play, a dot, the step buttons) returns to the guided timeline.
    onStep: () => { view.manual = false; syncedHour = -1; },
    controlsLimits: { minDistance: 6, maxDistance: 70 },
    interactions: [
      {
        id: 'hour', type: 'slider', label: c.hourLabel, tip: c.hourTip, min: 6, max: 22, step: 0.25, value: S.hour,
        format: hhmm,
        onChange: (v) => { view.manual = true; view.hour = v; },
      },
      {
        id: 'derms', type: 'toggle', label: c.dermsLabel, tip: c.dermsTip, value: true,
        onChange: (v) => { view.dermsOn = v; },
      },
    ],
    dispose: () => {
      for (const t of [...meterTrails, ...envTrails, toAgg, ...fromAgg, ...batTrails, ...evTrails]) t.dispose();
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
