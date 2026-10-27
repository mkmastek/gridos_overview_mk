// Slide 19 — DDLR demo: one transmission span, live weather and a simplified heat-balance model
// (src/sim/heatBalance.js — a teaching model; the real DDLR follows IEEE 738).
// The demo animates the weather; the sliders take over whenever the viewer moves them
// (the next demo step hands control back to the timeline).

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createWeatherMast } from '../kit/Transmission.js';
import { createBars } from '../kit/Plots3D.js';
import { ratingPu, conductorTemp, forecastDays, MODES, MW_PER_PU, DEMAND_MW, STATIC_WEATHER, T_MAX } from '../../sim/heatBalance.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const DEMAND_PU = DEMAND_MW / MW_PER_PU;

const TOWER_X = 11;
const GAUGE = V(16.5, 0, 3);
const PU_SCALE = 3; // world units per pu on the rating gauge
const PANEL = V(0, 14, -7);
const FORECAST = V(-9, 9.6, -9);

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M, charts: CH } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const T = content.ddlr;
  const ctl = content.controls;
  const pk = content.packets;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 56, depth: 36 }, shadowExtent: 30, fogNear: 70, fogFar: 150 });
  const flows = [];

  // ── The span: two lattice towers and two sagging conductors ─
  const towers = [-TOWER_X, TOWER_X].map((x) => {
    const tw = A.createTransmissionTower({ height: 9 });
    tw.position.set(x, 0, 0);
    scene.add(tw);
    return tw;
  });
  const attach = (tw, k) => tw.position.clone().add(tw.userData.attach[k]);
  const condMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.4 });
  const conductors = [0, 1].map((k) => ({ a: attach(towers[0], k), b: attach(towers[1], k), mesh: null, flow: null }));
  let sagNow = -1;
  const setSag = (sag) => {
    if (Math.abs(sag - sagNow) < 0.04) return;
    sagNow = sag;
    for (const c of conductors) {
      const pts = A.catenary(c.a, c.b, sag, 24);
      if (c.mesh) { scene.remove(c.mesh); c.mesh.geometry.dispose(); }
      c.mesh = A.createConductor(pts, condMat, 0.07);
      scene.add(c.mesh);
      if (!c.flow) {
        c.flow = new F.PowerFlow({ path: pts, color: M.PALETTE.flow, density: 1.6, size: 0.42 });
        scene.add(c.flow.object3D);
        flows.push(c.flow);
      } else {
        c.flow.setPath(pts);
      }
    }
  };
  setSag(1.4);
  scene.add(A.createTrees([[-20, -8], [-22, 6], [22, -9], [-6, -12], [5, -13], [24, 10], [-24, -2]].map(([x, z], i) => ({ x, z, s: 0.95 + (i % 3) * 0.15 }))));

  // ── Weather: sun, wind arrows, weather mast, thermometer ─────
  const sunMat = new THREE.MeshBasicMaterial({ color: '#FFD166', toneMapped: false });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 12), sunMat);
  sun.position.set(14, 16, -14);
  const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), M.glowMat('#FFD166', { map: M.glowTexture(), opacity: 0.8 }));
  sunGlow.position.copy(sun.position);
  scene.add(sun, sunGlow);

  const arrowGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6).rotateZ(Math.PI / 2),
    new THREE.ConeGeometry(0.2, 0.45, 8).rotateZ(-Math.PI / 2).translate(0.8, 0, 0),
  ], false);
  const arrowMat = M.glowMat('#E6F7FF', { blending: THREE.NormalBlending, opacity: 0.8 });
  const N_ARROWS = 16;
  const arrows = new THREE.InstancedMesh(arrowGeo, arrowMat, N_ARROWS);
  arrows.frustumCulled = false;
  scene.add(arrows);
  const arrowPos = Array.from({ length: N_ARROWS }, (_, i) => V(-13 + ((i * 7.3) % 26), 3 + ((i * 1.9) % 6), -7 + ((i * 3.7) % 14)));
  const dummy = new THREE.Object3D();

  const mast = createWeatherMast({ height: 4 });
  mast.group.position.set(-17, 0, -3);
  scene.add(mast.group);

  const thermo = new THREE.Group();
  thermo.position.set(-17, 0, 4);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 4, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, depthWrite: false }));
  glass.position.y = 2.6;
  const bulbMat = M.stdMat('#E63946', { emissive: '#E63946', emissiveIntensity: 0.5 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), bulbMat);
  bulb.position.y = 0.5;
  const fillGeo = new THREE.CylinderGeometry(0.17, 0.17, 1, 10).translate(0, 0.5, 0);
  const mercury = new THREE.Mesh(fillGeo, bulbMat);
  mercury.position.y = 0.7;
  thermo.add(glass, bulb, mercury);
  scene.add(thermo);

  // ── Gauges: line rating (with SLR / AAR / DLR markers and demand) and wire temperature ─
  const ratingFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 2.3 * PU_SCALE, 1)), new THREE.LineBasicMaterial({ color: '#9AA8C7', transparent: true, opacity: 0.6 }));
  ratingFrame.position.copy(GAUGE).add(V(0, 1.15 * PU_SCALE, 0));
  const ratingFillMat = M.stdMat('#5ECC62', { emissive: '#5ECC62', emissiveIntensity: 0.5, transparent: true, opacity: 0.92 });
  const ratingFill = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8).translate(0, 0.5, 0), ratingFillMat);
  ratingFill.position.copy(GAUGE);
  const ratingBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 1.6), M.stdMat('#2A3550'));
  ratingBase.position.copy(GAUGE).add(V(0, 0.07, 0));
  scene.add(ratingFrame, ratingFill, ratingBase);
  const plate = (color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.5), M.glowMat(color, { blending: THREE.NormalBlending }));
    m.position.copy(GAUGE);
    scene.add(m);
    return m;
  };
  const markers = {
    // Marker labels sit left of the gauge; the demand label and wire-temperature gauge are on the right.
    SLR: { plate: plate('#E6ECF5'), label: L.label(lab.slr, { anchor: 'right' }) },
    AAR: { plate: plate(M.BRAND.lightBlue), label: L.label(lab.aar, { anchor: 'right' }) },
    DLR: { plate: plate(M.PALETTE.flow), label: L.label(lab.dlr, { anchor: 'right' }) },
  };
  for (const m of Object.values(markers)) scene.add(m.label);
  const demandPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 2.6), M.glowMat('#E63946', { blending: THREE.NormalBlending, opacity: 0.85 }));
  demandPlate.position.copy(GAUGE).add(V(0, DEMAND_PU * PU_SCALE, 0));
  const demandLabel = L.label(lab.demand, { anchor: 'left' });
  demandLabel.position.copy(GAUGE).add(V(1.4, DEMAND_PU * PU_SCALE, 0));
  scene.add(demandPlate, demandLabel);

  const ratingEl = document.createElement('div');
  ratingEl.className = 'label3d label3d--accent';
  const ratingTitle = document.createElement('span');
  ratingTitle.className = 'label3d__title';
  ratingTitle.textContent = T.ratingTitle;
  const ratingSub = document.createElement('span');
  ratingSub.className = 'label3d__sub';
  ratingEl.append(ratingTitle, ratingSub);
  const ratingLabel = L.elementLabel(ratingEl);
  ratingLabel.position.copy(GAUGE).add(V(0, 2.3 * PU_SCALE + 2.6, 0));
  scene.add(ratingLabel);

  const tempGauge = CH.createBarGauge({ height: 4.4, width: 0.6, maxPct: 100, limitPct: T_MAX });
  tempGauge.group.position.set(GAUGE.x + 4.4, 0, GAUGE.z);
  scene.add(tempGauge.group);
  const twoLine = (title, at) => {
    const el = document.createElement('div');
    el.className = 'label3d';
    const t = document.createElement('span');
    t.className = 'label3d__title';
    t.textContent = title;
    const s = document.createElement('span');
    s.className = 'label3d__sub';
    el.append(t, s);
    const o = L.elementLabel(el);
    o.position.copy(at);
    scene.add(o);
    return s;
  };
  const tempSub = twoLine(T.tempTitle, V(GAUGE.x + 4.4, 5, GAUGE.z));
  const airSub = twoLine(T.airTitle, V(-17, 1.6, 4));

  const stationLabel = L.label(lab.station);
  stationLabel.position.set(-17, 5.4, -3);
  const sunLabel = L.label(lab.sun);
  sunLabel.position.set(15.6, 16, -14);
  sunLabel.center.set(0, 0.5);
  scene.add(stationLabel, sunLabel);

  // ── DDLR panel and the 10-day forecast ──────────────────────
  const panel = A.createGlassPanel({ width: 7, height: 2.2, color: M.BRAND.lightBlue });
  panel.group.position.copy(PANEL);
  scene.add(panel.group);
  const panelLabel = L.label(lab.ddlr, { anchor: 'center', variant: 'big' });
  panelLabel.position.copy(PANEL).add(V(2.5, 0, 0));
  scene.add(panelLabel);

  const days = forecastDays();
  const fcBase = A.createGlassSlab({ width: 11.5, depth: 1.8, thickness: 0.2, color: M.BRAND.lightBlue, opacity: 0.16 });
  fcBase.group.position.copy(FORECAST);
  scene.add(fcBase.group);
  const bars = createBars({ count: days.length, width: 0.7, depth: 0.7, spacing: 1.05 });
  bars.group.position.copy(FORECAST).add(V(0, 0.1, 0));
  scene.add(bars.group);
  const fcNeed = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 0.06), M.glowMat('#E63946', { blending: THREE.NormalBlending, opacity: 0 }));
  fcNeed.position.copy(FORECAST).add(V(0, 0.1 + DEMAND_PU * 2, 0.5));
  scene.add(fcNeed);
  const fcTitle = L.label({ title: T.forecastTitle });
  // Label positions measured at 1366×768 so they clear the DDLR panel label and the gauges.
  fcTitle.position.copy(FORECAST).add(V(-4.5, 4.4, 0));
  const fcNeedLabel = L.label({ title: T.forecastNeed }, { anchor: 'right' });
  fcNeedLabel.position.copy(FORECAST).add(V(-5.9, 0.1 + DEMAND_PU * 2, 0.5));
  const dayTag = (i) => {
    const o = L.tagLabel(fill(T.forecastDay, { n: i + 1 }), null, { anchor: 'center' });
    o.position.copy(FORECAST).add(V(bars.xAt(i), -0.5, 0.9));
    scene.add(o);
    return o;
  };
  const dayTags = [dayTag(0), dayTag(days.length - 1)];
  scene.add(fcTitle, fcNeedLabel);

  // ── Labelled packets: weather in, rating out ────────────────
  const arc = (a, b, lift = 2.2) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const trail = (a, b, text, kind, color) => {
    const t = new F.PacketTrail({ path: arc(a, b), color, label: { text, kind } });
    scene.add(t.object3D);
    return t;
  };
  const mastTop = V(-17, 4.4, -3);
  const panelBottom = PANEL.clone().add(V(0, -1.1, 0));
  const gaugeTop = GAUGE.clone().add(V(0, 2.3 * PU_SCALE, 0));
  const trails = {
    w2: trail(mastTop, panelBottom, pk.weather, 'data', M.PALETTE.data),
    r2: trail(panelBottom, gaugeTop, pk.rating, 'data', M.PALETTE.data),
    w3: trail(mastTop, panelBottom, pk.weather, 'data', M.PALETTE.data),
    r3: trail(panelBottom, gaugeTop, pk.rating, 'data', M.PALETTE.data),
    w4: trail(mastTop, panelBottom, pk.weather, 'data', M.PALETTE.data),
    f4: trail(panelBottom, FORECAST.clone().add(V(2, 3, 0)), pk.rating, 'data', M.PALETTE.data),
  };

  // ── State: the demo animates weather; sliders override until the next step ─
  const S = {
    ...STATIC_WEATHER, mode: 0, slr: 0, forecast: 0,
    w2: 0, r2: 0, w3: 0, r3: 0, w4: 0, f4: 0,
  };
  const user = {};
  const timeline = stepTimeline([2.4, 3.6, 3.6, 3.4], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) tl.to(S, { slr: 1, duration: 0.6 }, q(0.2));
    if (k === 2) {
      tl.to(S, { mode: 1, slr: 0, duration: 0.05 }, q(0.05));
      tl.to(S, { w2: 1, duration: 1.2, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { tamb: 12, solar: 0, duration: 2.2, ease: 'power1.inOut' }, q(0.4));
      tl.to(S, { r2: 1, duration: 1.2, ease: 'power1.inOut' }, q(1.9));
    }
    if (k === 3) {
      tl.to(S, { mode: 2, duration: 0.05 }, q(0.05));
      tl.to(S, { w3: 1, duration: 1.2, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { wind: 6, duration: 2.2, ease: 'power1.inOut' }, q(0.4));
      tl.to(S, { r3: 1, duration: 1.2, ease: 'power1.inOut' }, q(1.9));
    }
    if (k === 4) {
      tl.to(S, { w4: 1, duration: 1.2, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { forecast: 1, duration: 1.8, ease: 'power1.out' }, q(1.0));
      tl.to(S, { f4: 1, duration: 1.2, ease: 'power1.inOut' }, q(1.2));
    }
  });

  const value = (key) => (key in user ? user[key] : S[key]);
  const weatherNow = () => ({ tamb: value('tamb'), wind: value('wind'), angle: value('angle'), solar: value('solar') });
  const modeNow = () => ('mode' in user ? user.mode : MODES[Math.round(S.mode)]);

  // ── Per-frame rendering ─────────────────────────────────────
  const tmp = new THREE.Color();
  const shown = {};
  let hudKey = '';
  const mirror = (id, v) => {
    if (id in user || shown[id] === v) return;
    shown[id] = v;
    ctx.setControl(id, v);
  };

  function update(dt) {
    const w = weatherNow();
    const mode = modeNow();
    const ratings = { SLR: ratingPu('SLR', w), AAR: ratingPu('AAR', w), DLR: ratingPu('DLR', w) };
    const rating = ratings[mode];
    const flowPu = Math.min(DEMAND_PU, rating);
    const tc = conductorTemp(flowPu, w);

    // Conductor: colour and sag follow the wire temperature
    const heat = clamp01((tc - 45) / (T_MAX - 45));
    tmp.copy(C.flow).lerp(C.warning, clamp01(heat * 1.6)).lerp(C.fault, clamp01((heat - 0.7) / 0.3));
    condMat.color.copy(tmp);
    condMat.emissive.copy(tmp);
    setSag(1.0 + 1.2 * clamp01((tc - 20) / 60));
    for (const c of conductors) {
      c.flow.intensity = 0.4 + 0.6 * (flowPu / DEMAND_PU);
      c.flow.color.copy(tmp);
      c.flow.velocity = 2 + flowPu * 2;
      c.flow.update(dt);
    }

    // Weather visuals
    const sunAmt = w.solar / 1000;
    sun.scale.setScalar(0.4 + 0.7 * sunAmt);
    sunGlow.scale.setScalar(0.3 + 0.9 * sunAmt);
    sunGlow.material.opacity = 0.15 + 0.7 * sunAmt;
    sunGlow.quaternion.copy(camera.quaternion);
    L.setLabelOpacity(sunLabel, 0.4 + 0.6 * sunAmt);
    const a = (w.angle * Math.PI) / 180;
    const dir = V(Math.cos(a), 0, -Math.sin(a));
    const speed = 1 + w.wind * 1.4;
    arrowMat.opacity = clamp01(w.wind / 2.5) * 0.85 + 0.1;
    const q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), dir);
    arrowPos.forEach((p, i) => {
      p.addScaledVector(dir, speed * dt);
      if (p.x > 14) p.x -= 28; if (p.x < -14) p.x += 28;
      if (p.z > 8) p.z -= 16; if (p.z < -8) p.z += 16;
      dummy.position.copy(p);
      dummy.quaternion.copy(q);
      dummy.scale.setScalar(0.6 + w.wind / 12);
      dummy.updateMatrix();
      arrows.setMatrixAt(i, dummy.matrix);
    });
    arrows.instanceMatrix.needsUpdate = true;
    mast.cups.rotation.y += dt * (0.5 + w.wind * 1.5);
    const tFrac = clamp01((w.tamb + 10) / 55);
    mercury.scale.y = 0.2 + 3.4 * tFrac;
    bulbMat.color.copy(tmp.set('#4FC3F7').lerp(C.fault, tFrac));
    bulbMat.emissive.copy(bulbMat.color);

    // Rating gauge and markers
    ratingFill.scale.y = Math.max(0.01, rating * PU_SCALE);
    const ok = rating >= DEMAND_PU - 1e-6;
    ratingFillMat.color.copy(ok ? C.restored : C.warning);
    ratingFillMat.emissive.copy(ratingFillMat.color);
    demandPlate.material.color.copy(ok ? C.restored : C.fault);
    const place = Object.entries(ratings).map(([k, pu]) => ({ k, y: pu * PU_SCALE })).sort((p1, p2) => p1.y - p2.y);
    // Keep the three marker labels at least one label-height apart.
    for (let i = 1; i < place.length; i += 1) place[i].ly = Math.max(place[i].y, (place[i - 1].ly ?? place[i - 1].y) + 2.4);
    for (const p of place) {
      const m = markers[p.k];
      m.plate.position.y = p.y;
      m.plate.material.opacity = p.k === mode ? 1 : 0.35;
      m.label.position.set(GAUGE.x - 1.1, p.ly ?? p.y, GAUGE.z);
      L.setLabelOpacity(m.label, p.k === mode ? 1 : 0.55);
      m.label.element.classList.toggle('label3d--accent', p.k === mode || (p.k === 'SLR' && S.slr > 0.5));
    }
    const sub = fill(T.ratingValue, { pu: rating.toFixed(2), mw: Math.round(rating * MW_PER_PU) });
    if (ratingSub.textContent !== sub) ratingSub.textContent = sub;
    tempGauge.setValue(tc);
    tempGauge.setColor(tmp.copy(C.flow).lerp(C.warning, clamp01(heat * 1.6)).lerp(C.fault, clamp01((heat - 0.7) / 0.3)));
    tempGauge.setOpacity(1);
    const ts = fill(T.tempValue, { t: Math.round(tc) });
    if (tempSub.textContent !== ts) tempSub.textContent = ts;
    const as = fill(T.airValue, { t: Math.round(w.tamb) });
    if (airSub.textContent !== as) airSub.textContent = as;

    // Forecast chart
    days.forEach((d, i) => {
      const grow = clamp01(S.forecast * 1.5 - i * 0.05);
      bars.setBar(i, d.pu * 2 * grow, d.pu >= DEMAND_PU ? C.restored : C.warning);
    });
    fcNeed.material.opacity = 0.85 * S.forecast;
    fcBase.setGlow(0.2 + 0.8 * S.forecast);
    for (const o of [fcTitle, fcNeedLabel, ...dayTags]) L.setLabelOpacity(o, 0.25 + 0.75 * S.forecast);

    // Packets and panel
    for (const [k, tr] of Object.entries(trails)) tr.setProgress(S[k]);
    panel.material.opacity = 0.15 + 0.25 * Math.max(...['w2', 'r2', 'w3', 'r3', 'w4', 'f4'].map((k) => (S[k] > 0 && S[k] < 1 ? 1 : 0)));

    // Sliders follow the demo unless the viewer has taken over
    mirror('tamb', Math.round(S.tamb));
    mirror('wind', Math.round(S.wind * 10) / 10);
    mirror('angle', Math.round(S.angle));
    mirror('solar', Math.round(S.solar / 10) * 10);
    mirror('mode', MODES[Math.round(S.mode)]);

    // Readouts
    const flowMw = Math.round(flowPu * MW_PER_PU);
    const items = [
      { label: T.hudRating, value: sub, mood: ok ? 'ok' : 'warn' },
      { label: T.hudFlow, value: fill(T.hudFlowValue, { mw: flowMw }), mood: flowMw >= DEMAND_MW ? 'ok' : 'alert' },
      { label: T.hudModel, value: '' },
    ];
    const key = JSON.stringify(items);
    if (key !== hudKey) {
      hudKey = key;
      ctx.setHud({ items });
    }
  }

  const slider = (id, label, unit, min, max, step) => ({
    id, type: 'slider', label, min, max, step, value: S[id],
    format: (v) => fill(unit, { v }),
    onChange: (v) => { user[id] = v; },
  });

  const presets = {
    span: { pos: [10, 12, 41], target: [4, 6.4, 0] },
    gauges: { pos: [11, 9, 24], target: [14, 4.5, 1] },
    forecast: { pos: [-4, 12.5, 19], target: [-8, 10, -6] },
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['span', 'span', 'span', 'forecast']),
    startPreset: 'span',
    controlsLimits: { minDistance: 8, maxDistance: 80 },
    // A demo step hands the weather back to the timeline.
    onStep: () => { for (const k of Object.keys(user)) delete user[k]; for (const k of Object.keys(shown)) delete shown[k]; },
    onEnter: () => { hudKey = ''; for (const k of Object.keys(shown)) delete shown[k]; },
    interactions: [
      slider('tamb', ctl.temp, ctl.tempUnit, -10, 45, 1),
      slider('wind', ctl.wind, ctl.windUnit, 0, 10, 0.1),
      slider('angle', ctl.angle, ctl.angleUnit, 0, 90, 1),
      slider('solar', ctl.solar, ctl.solarUnit, 0, 1000, 10),
      {
        id: 'mode', type: 'select', label: ctl.mode, value: 'SLR',
        options: ctl.modes.map((m) => ({ value: m.value, label: m.label })),
        onChange: (v) => { user.mode = v; },
      },
    ],
    dispose: () => { for (const c of conductors) c.mesh?.geometry.dispose(); arrowGeo.dispose(); },
  });
}
