// Slide 21 — GridOS Forecasting: a 24-hour 3D area chart (load, solar, wind) with an
// uncertainty band and a sweeping "now" plane (actuals behind, forecast ahead). Linked solar
// farm, wind farm and data center pulse as their series appear; forecasts flow to AEMS and DDLR.
// Curves are illustrative.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createAreaSeries, createBand } from '../kit/Plots3D.js';
import { createSolarFarm } from '../kit/Transmission.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// Tomorrow, MW (illustrative): cloudy morning, sunny afternoon, windy night, data-center ramp.
const HOURS = 25;
const SOLAR = [0, 0, 0, 0, 0, 0, 10, 25, 40, 55, 60, 70, 210, 260, 280, 250, 190, 110, 40, 5, 0, 0, 0, 0, 0];
const WIND = [150, 145, 140, 130, 120, 110, 95, 85, 75, 70, 65, 60, 60, 65, 70, 80, 95, 120, 150, 185, 215, 240, 255, 260, 262];
const LOAD = Array.from({ length: HOURS }, (_, h) => {
  const morning = 90 * Math.exp(-((h - 8) ** 2) / 4);
  const evening = 140 * Math.exp(-((h - 19) ** 2) / 5);
  const ramp = 120 * clamp01((h - 10) / 3);
  return 400 + morning + evening + ramp;
});
// Uncertainty grows with time ahead and in the evening peak.
const BAND = LOAD.map((v, h) => 20 + h * 2.5 + 25 * Math.exp(-((h - 19) ** 2) / 6));
const SCALE = 1 / 100; // MW → world units
const ORIGIN = V(-12, 0, 0);
const ROWS = { load: -3, wind: 0, solar: 3 };
const COLORS = { load: '#B9C6EA', wind: '#5FD3E0', solar: '#FFC94D' };
const PANEL = V(0, 13, -8);
const AEMS = V(-9, 15.5, -11);
const DDLR = V(9, 15.5, -11);

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const T = content.forecasting;
  const pk = content.packets;
  const { scene, camera } = A.createBaseScene({ ground: { width: 50, depth: 36 }, shadowExtent: 28, fogNear: 70, fogFar: 150 });
  const flows = [];

  // ── The chart: actual (solid) up to now, forecast (translucent) after ─
  const series = {};
  for (const [key, values] of Object.entries({ load: LOAD, wind: WIND, solar: SOLAR })) {
    const group = new THREE.Group();
    group.position.copy(ORIGIN).setZ(ROWS[key]);
    const actual = createAreaSeries({ values, dx: 1, depth: 0.9, scaleY: SCALE, color: COLORS[key], opacity: 1, emissive: 0.3 });
    const forecast = createAreaSeries({ values, dx: 1, depth: 0.9, scaleY: SCALE, color: COLORS[key], opacity: 0.42, emissive: 0.5 });
    group.add(actual.mesh, forecast.mesh);
    scene.add(group);
    series[key] = { group, actual, forecast, values };
  }
  const bandUpper = LOAD.map((v, h) => v + BAND[h]);
  const bandLower = LOAD.map((v, h) => v - BAND[h]);
  const band = createBand({ lower: bandLower, upper: bandUpper, dx: 1, scaleY: SCALE, color: COLORS.load, opacity: 0.3 });
  band.mesh.position.copy(ORIGIN).setZ(ROWS.load + 0.6);
  scene.add(band.mesh);
  const axis = new THREE.Mesh(new THREE.BoxGeometry(HOURS - 1, 0.06, 0.06), M.stdMat('#9AA8C7'));
  axis.position.copy(ORIGIN).add(V((HOURS - 1) / 2, 0.05, 4.8));
  scene.add(axis);
  const hourTags = T.hours.map((h, i) => {
    const o = L.tagLabel(h, null, { anchor: 'center' });
    o.position.copy(ORIGIN).add(V(i * 6, 0.1, 5.6));
    scene.add(o);
    return o;
  });

  // "Now" plane
  const nowMat = M.glowMat(M.BRAND.lightBlue, { opacity: 0.18, side: THREE.DoubleSide, blending: THREE.NormalBlending });
  const nowPlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 9).rotateY(Math.PI / 2), nowMat);
  const nowEdge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 9, 0.06), M.glowMat(M.BRAND.lightBlue, { blending: THREE.NormalBlending }));
  scene.add(nowPlane, nowEdge);

  // ── Linked sources on the map ──────────────────────────────
  const solarFarm = createSolarFarm({ rows: 3, cols: 5, gap: 1.1 });
  solarFarm.position.set(-8, 0, 12);
  const turbines = [[2, 12], [5, 13]].map(([x, z]) => {
    const t = A.createWindTurbine({ height: 4.6, radius: 1.5 });
    t.group.position.set(x, 0, z);
    scene.add(t.group);
    return t;
  });
  const dc = A.createDataCenter({ w: 4, d: 2.6, h: 1.4 });
  dc.group.position.set(12, 0, 12);
  scene.add(solarFarm, dc.group);
  const glow = (x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2), M.glowMat(M.BRAND.lightBlue, { map: M.glowTexture(), opacity: 0 }));
    m.position.set(x, 0.06, z);
    scene.add(m);
    return m;
  };
  const glows = { solar: glow(-8, 12), wind: glow(3.5, 12.5), load: glow(12, 12) };

  // ── Panels: Forecasting, AEMS, DDLR ────────────────────────
  const panel = (pos, w) => {
    const p = A.createGlassPanel({ width: w, height: 2, color: M.BRAND.lightBlue });
    p.group.position.copy(pos);
    scene.add(p.group);
    return p;
  };
  const panels = { fc: panel(PANEL, 7.5), aems: panel(AEMS, 5.4), ddlr: panel(DDLR, 5.4) };

  // ── Labels ──────────────────────────────────────────────────
  const at = (def, p, opts) => { const l = L.label(def, opts); l.position.copy(p); scene.add(l); return l; };
  const endY = (key) => series[key].values[HOURS - 1] * SCALE;
  const labels = {
    // Positions checked at 1366×768: the load label sits above the wind label at the right end of the chart.
    load: at(lab.load, ORIGIN.clone().add(V(HOURS - 0.4, 5.4, ROWS.load)), { anchor: 'left' }),
    wind: at(lab.wind, ORIGIN.clone().add(V(HOURS - 0.4, endY('wind') + 0.2, ROWS.wind)), { anchor: 'left' }),
    solar: at(lab.solar, ORIGIN.clone().add(V(14, 3.4, ROWS.solar))),
    band: at(lab.band, ORIGIN.clone().add(V(22, 9.6, ROWS.load))),
    now: at(lab.now, V(0, 9.4, 0)),
    actual: at(lab.actual, V(0, 8, 2), { anchor: 'right' }),
    forecast: at(lab.forecast, V(0, 8, 2), { anchor: 'left' }),
    fc: at(lab.forecasting, PANEL, { anchor: 'center' }),
    aems: at(lab.aems, AEMS, { anchor: 'center' }),
    ddlr: at(lab.ddlr, DDLR, { anchor: 'center' }),
    // Source labels sit to the right of each source, clear of the hour tags behind them.
    solarFarm: at(lab.solarFarm, V(-4.9, 0.9, 12.6), { anchor: 'left' }),
    windFarm: at(lab.windFarm, V(6.4, 1.6, 13.2), { anchor: 'left' }),
    dataCenter: at(lab.dataCenter, V(14.2, 1.2, 12.5), { anchor: 'left' }),
  };

  // The load label's full form is long: wrap it so it fits at the right edge of the frame.
  Object.assign(labels.load.element.style, { whiteSpace: 'normal', width: '118px' });

  // ── Labelled packets ───────────────────────────────────────
  const arc = (a, b, lift = 2.2) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const trail = (a, b, text, kind) => {
    const t = new F.PacketTrail({ path: arc(a, b), color: M.PALETTE.data, label: { text, kind } });
    scene.add(t.object3D);
    return t;
  };
  const pBottom = PANEL.clone().add(V(0, -1, 0));
  const trails = {
    in1: trail(V(-8, 1.2, 12), pBottom.clone().add(V(-2, 0, 0)), pk.inputs, 'data'),
    toA: trail(PANEL.clone().add(V(-3.7, 0, 0)), AEMS.clone().add(V(2.7, 0, 0)), pk.schedule, 'data'),
    toD: trail(PANEL.clone().add(V(3.7, 0, 0)), DDLR.clone().add(V(-2.7, 0, 0)), pk.lookahead, 'data'),
  };
  const feed = new F.PacketStream({ paths: [[V(-8, 1, 12), pBottom], [V(3.5, 5, 12.5), pBottom], [V(12, 1.6, 12), pBottom]], color: M.PALETTE.data, perPath: 2, velocity: 3, intensity: 0 });
  scene.add(feed.object3D);
  flows.push(feed);

  // ── State and timeline ─────────────────────────────────────
  const S = { now: 4, inputs: 0, solar: 0, wind: 0, load: 0, band: 0, out: 0, hlSolar: 0, hlWind: 0, hlLoad: 0, in1: 0, toA: 0, toD: 0 };
  const timeline = stepTimeline([2.6, 2.6, 2.6, 2.8, 2.6, 2.8], (tl, at2, k) => {
    const q = (d) => `${at2}+=${d}`;
    if (k === 1) tl.to(S, { inputs: 1, duration: 0.6 }, q(0)).to(S, { in1: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.3));
    if (k === 2) tl.to(S, { solar: 1, hlSolar: 1, now: 9, duration: 1.6, ease: 'power1.inOut' }, q(0.1));
    if (k === 3) tl.to(S, { wind: 1, hlSolar: 0, hlWind: 1, now: 12, duration: 1.6, ease: 'power1.inOut' }, q(0.1));
    if (k === 4) tl.to(S, { load: 1, hlWind: 0, hlLoad: 1, now: 14, duration: 1.8, ease: 'power1.inOut' }, q(0.1));
    if (k === 5) tl.to(S, { band: 1, hlLoad: 0, now: 16, duration: 1.6, ease: 'power1.inOut' }, q(0.1));
    if (k === 6) {
      tl.to(S, { out: 1, duration: 0.4 }, q(0));
      tl.to(S, { toA: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.2));
      tl.to(S, { toD: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.8));
    }
  });

  const presets = {
    overview: { pos: [1.5, 20, 46], target: [1, 6.5, -1] },
    chart: { pos: [0.5, 13, 34], target: [0.5, 4.4, 1.5] },
    panels: { pos: [0, 15, 26], target: [0, 11, -6] },
  };

  let hudKey = '';
  function update(dt, t) {
    for (const tb of turbines) tb.rotor.rotation.x += dt * 1.1;
    const nowX = S.now;
    for (const [key, s] of Object.entries(series)) {
      s.group.scale.y = Math.max(0.001, S[key]);
      s.group.visible = S[key] > 0.01;
      s.actual.setCut(0, nowX);
      s.forecast.setCut(nowX, HOURS - 1);
    }
    band.mesh.visible = S.band > 0.01;
    band.material.opacity = 0.32 * S.band;
    band.setCut(nowX, HOURS - 1);
    const wx = ORIGIN.x + nowX;
    nowPlane.position.set(wx, 4.5, 0);
    nowEdge.position.set(wx, 4.5, 4.9);
    labels.now.position.set(wx, 9.4, 0);
    labels.actual.position.set(wx - 0.4, 8, 2);
    labels.forecast.position.set(wx + 0.4, 8, 2);
    // Series labels step back once the forecasts go out to AEMS and DDLR (the panel close-up).
    const seriesFade = 1 - S.out;
    L.setLabelOpacity(labels.load, S.load * seriesFade);
    L.setLabelOpacity(labels.wind, S.wind * seriesFade);
    L.setLabelOpacity(labels.solar, S.solar * seriesFade);
    L.setLabelOpacity(labels.band, S.band * seriesFade);
    const pulse = 0.55 + 0.45 * Math.sin(t * 4);
    glows.solar.material.opacity = 0.6 * S.hlSolar * pulse;
    glows.wind.material.opacity = 0.6 * S.hlWind * pulse;
    glows.load.material.opacity = 0.6 * S.hlLoad * pulse;
    for (const [k, key] of [['solarFarm', 'hlSolar'], ['windFarm', 'hlWind'], ['dataCenter', 'hlLoad']]) {
      labels[k].element.classList.toggle('label3d--accent', S[key] > 0.5);
    }
    feed.intensity = S.inputs * (1 - 0.6 * S.out);
    feed.update(dt);
    for (const [k, tr] of Object.entries(trails)) tr.setProgress(S[k]);
    panels.fc.material.opacity = 0.14 + 0.25 * S.inputs;
    panels.aems.material.opacity = 0.12 + 0.3 * S.toA;
    panels.ddlr.material.opacity = 0.12 + 0.3 * S.toD;
    L.setLabelOpacity(labels.aems, 0.45 + 0.55 * S.out);
    L.setLabelOpacity(labels.ddlr, 0.45 + 0.55 * S.out);

    // Readouts: the hour at the "now" line and, once the band is shown, the reserve to hold
    const h = Math.min(24, Math.round(nowX));
    const items = [{ label: T.hudTime, value: fill(T.hudTimeValue, { h: String(h).padStart(2, '0') }) }];
    if (S.band > 0.5) items.push({ label: T.hudReserve, value: fill(T.hudReserveValue, { mw: Math.round(BAND[Math.min(HOURS - 1, h)] / 5) * 5 }), mood: 'warn' });
    const key = JSON.stringify(items);
    if (key !== hudKey) { hudKey = key; ctx.setHud({ items }); }
  }

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['panels', 'chart', 'chart', 'chart', 'chart', 'panels']),
    startPreset: 'overview',
    onEnter: () => { hudKey = ''; },
    controlsLimits: { minDistance: 8, maxDistance: 80 },
  });
}
