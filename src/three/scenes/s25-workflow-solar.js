// Slide 25 — Workflow B: a high-solar afternoon across transmission and distribution.
// Back: the transmission grid (gas plant, wind farm, lattice line, data center).
// Front: a distribution neighbourhood with rooftop solar and batteries.
// Middle: the T&D boundary substation with a big net-flow arrow (down = homes import,
// up and purple = homes export). Above: distribution apps over the neighbourhood,
// transmission apps over the transmission grid, all linked through the Data Fabric hub.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';
import { createAppPanel, createHub, createHandoff } from '../kit/AppNetwork.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FEEDER_Z = 4;

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M, charts: CH } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const P = content.packets;
  const SO = content.solar;
  const C = M.COLOR;
  const { scene, camera, lights } = A.createBaseScene({ ground: { width: 64, depth: 42 }, shadowExtent: 34, fogNear: 75, fogFar: 180 });
  const flows = [];
  const wireMat = M.stdMat('#8C98AC', { metalness: 0.5, roughness: 0.4 });

  // ── Transmission grid (back) ─────────────────────────────────
  const gas = A.createGasPlant();
  gas.position.set(-16, 0, -11);
  scene.add(gas);
  const gauge = CH.createBarGauge({ height: 3.2, width: 0.6, maxPct: 100, limitPct: 100 });
  gauge.group.position.set(-11.6, 0, -9.4);
  scene.add(gauge.group);
  const turbines = [[-6, -13], [-2.4, -14.5], [1.2, -12.8]].map(([x, z]) => {
    const t = A.createWindTurbine({ height: 6.2 });
    t.group.position.set(x, 0, z);
    scene.add(t.group);
    return t;
  });
  const towerXs = [-9, -2, 5, 12];
  for (const x of towerXs) {
    const tw = A.createTransmissionTower({ height: 7.2 });
    tw.position.set(x, 0, -7);
    scene.add(tw);
  }
  const tPts = [V(-13, 4.8, -8.9), ...towerXs.map((x) => V(x, 4.84, -8.9)), V(16, 3, -8.9)];
  let tLine = [];
  for (let i = 0; i < tPts.length - 1; i += 1) tLine = A.joinPaths(tLine, A.catenary(tPts[i], tPts[i + 1], 0.6, 10));
  const tMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.5 });
  scene.add(A.createConductor(tLine, tMat, 0.06));
  const tFlow = new F.PowerFlow({ path: tLine, color: M.PALETTE.flow, velocity: 4 });
  scene.add(tFlow.object3D);
  flows.push(tFlow);
  const dc = A.createDataCenter({ w: 4.4, d: 2.8, h: 1.5 });
  dc.group.position.set(17.5, 0, -11);
  scene.add(dc.group);

  // Wind arrows along the line (evening)
  const windMat = M.glowMat('#C9D3EE', { opacity: 0, blending: THREE.NormalBlending });
  const windArrows = new THREE.InstancedMesh(new THREE.ConeGeometry(0.18, 0.7, 8).rotateZ(-Math.PI / 2), windMat, 8);
  scene.add(windArrows);

  // ── T&D boundary substation and net-flow arrow ───────────────
  const boundary = A.createSubstation({ w: 4.4, d: 4 });
  boundary.position.set(2, 0, 0.6);
  scene.add(boundary);
  const drop = A.catenary(V(2, 4.84, -8.9), boundary.position.clone().add(V(1.2, 2.7, -1.4)), 0.3, 10);
  scene.add(A.createConductor(drop, wireMat, 0.04));
  const arrow = new THREE.Group();
  const arrowMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.8, transparent: true, opacity: 0.92 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1, 14).translate(0, 0.5, 0), arrowMat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1, 16).translate(0, 0.5, 0), arrowMat);
  arrow.add(shaft, head);
  arrow.position.set(2, 4.9, 0.6);
  scene.add(arrow);

  // ── Distribution neighbourhood (front) ───────────────────────
  const exitE = boundary.position.clone().add(boundary.userData.exitE);
  const poleXs = [7, 1, -5, -11, -17];
  for (const x of poleXs) {
    const p = A.createPole({ height: 4.6 });
    p.position.set(x, 0, FEEDER_Z);
    scene.add(p);
  }
  let feeder = A.catenary(exitE, V(7, 4.52, FEEDER_Z), 0.25, 8);
  for (let i = 0; i < poleXs.length - 1; i += 1) feeder = A.joinPaths(feeder, A.catenary(V(poleXs[i], 4.52, FEEDER_Z), V(poleXs[i + 1], 4.52, FEEDER_Z), 0.3, 10));
  const fMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.5 });
  scene.add(A.createConductor(feeder, fMat, 0.05));
  const fFlow = new F.PowerFlow({ path: feeder, color: M.PALETTE.flow, velocity: 3 });
  scene.add(fFlow.object3D);
  flows.push(fFlow);
  const regulator = A.createDistTransformer();
  regulator.position.set(-5, 3.6, FEEDER_Z);
  scene.add(regulator);
  const regGlow = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), M.glowMat(M.PALETTE.command, { opacity: 0, blending: THREE.NormalBlending }));
  regGlow.position.set(-5, 3.6, FEEDER_Z + 0.3);
  scene.add(regGlow);

  const homes = [];
  for (let i = 0; i < 10; i += 1) {
    const x = -17 + i * 2.4;
    homes.push({ x, z: 7, solar: true, battery: i % 3 === 0 });
    if (x < 6) homes.push({ x: x + 1.2, z: 9.6, solar: i % 2 === 0, battery: i % 4 === 1 });
  }
  const houses = A.createHouses(homes);
  scene.add(houses.group);
  const solarHomes = homes.filter((h) => h.solar);
  const envMat = M.stdMat(M.PALETTE.command, { emissive: M.PALETTE.command, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 });
  const envBars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1, 0.16).translate(0, 0.5, 0), envMat, solarHomes.length);
  scene.add(envBars);
  const battHomes = homes.filter((h) => h.battery);
  const battMat = M.glowMat(M.PALETTE.restored, { opacity: 0, blending: THREE.NormalBlending });
  const battGlow = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 10, 8), battMat, battHomes.length);
  const o = new THREE.Object3D();
  battHomes.forEach((hm, i) => {
    o.position.set(hm.x + 0.68, 0.3, hm.z + 0.18);
    o.updateMatrix();
    battGlow.setMatrixAt(i, o.matrix);
  });
  scene.add(battGlow);
  const aggregator = new THREE.Group();
  aggregator.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.6).translate(0, 0.35, 0), M.stdMat('#4B5567')));
  aggregator.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9).translate(0.25, 1.1, 0), M.stdMat('#C9D3E0')));
  aggregator.position.set(11, 0, 8.4);
  scene.add(aggregator);

  // Weather station
  const station = new THREE.Group();
  station.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6).translate(0, 1.6, 0), M.stdMat('#C9D3E0')));
  const cups = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 16), M.stdMat('#E8EDF4'));
  cups.rotation.x = Math.PI / 2;
  cups.position.y = 3.2;
  station.add(cups);
  station.position.set(-21, 0, -4);
  scene.add(station);

  // Sun moving across the sky
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 14), new THREE.MeshBasicMaterial({ color: '#FFD27A', toneMapped: false }));
  scene.add(sun);
  const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), M.glowMat('#FFC857', { map: M.glowTexture(), opacity: 0.6 }));
  scene.add(sunGlow);

  // ── Applications ─────────────────────────────────────────────
  const apps = {};
  const appAt = (key, x, y, z) => {
    const p = createAppPanel(lab[key], { width: 3.4, height: 1.7 });
    p.group.position.set(x, y, z);
    p.group.rotation.x = -0.1;
    scene.add(p.group);
    Object.assign(p.label.element.style, { whiteSpace: 'normal', maxWidth: '150px' });
    apps[key] = p;
  };
  appAt('forecasting', -12, 13.8, -9);
  appAt('aems', 2, 13.8, -9);
  appAt('ddlr', 14, 13.8, -9);
  appAt('derms', -8, 11.4, 2.5);
  appAt('adms', 8, 11.4, 2.5);
  const hub = createHub(lab.fabric, { radius: 1.1 });
  hub.group.position.set(-1, 12.0, -3.4);
  scene.add(hub.group);
  const gateway = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), M.stdMat(M.PALETTE.data, { emissive: M.PALETTE.data, emissiveIntensity: 0.5 }));
  gateway.position.set(-8, 7.6, 3.4);
  scene.add(gateway);

  const under = (key) => apps[key].group.position.clone().add(V(0, -1.0, 0.15));
  const hubPt = hub.group.position.clone().add(V(0, 0.35, 0));
  const H = [];
  const hand = (a, b, kind, packet, lift = 1.4) => {
    const color = kind === 'command' ? M.PALETTE.command : kind === 'decision' ? M.PALETTE.ai : kind === 'reverse' ? M.PALETTE.reverse : M.PALETTE.data;
    const hd = createHandoff(a, b, { color, kind, packet, lift });
    scene.add(hd.group);
    H.push(hd);
    return hd;
  };
  const h = {
    weatherFc: hand(V(-21, 3.4, -4), under('forecasting'), 'data', P.weather),
    fcHub: hand(under('forecasting'), hubPt, 'data', P.forecast),
    hubDerms: hand(hubPt, under('derms'), 'data', null, 0.9),
    dermsGw: hand(under('derms'), gateway.position.clone().add(V(0, 0.3, 0)), 'decision', P.envelopes, 0.5),
    gwHomes1: hand(gateway.position.clone(), V(-12.2, 1.6, 7), 'command', P.limits, 1.0),
    gwHomes2: hand(gateway.position.clone(), V(-2.6, 1.6, 7), 'command', null, 1.0),
    gwAgg: hand(gateway.position.clone(), aggregator.position.clone().add(V(0, 1.2, 0)), 'command', null, 1.6),
    homesAdms: hand(V(0.4, 1.8, 7), under('adms'), 'reverse', P.voltages),
    admsReg: hand(under('adms'), regulator.position.clone().add(V(0, 0.6, 0)), 'command', P.settings),
    bndAems: hand(boundary.position.clone().add(V(0, 3.2, 0)), under('aems'), 'data', P.boundary),
    aemsGas: hand(under('aems'), gas.position.clone().add(V(0, 3.2, 0)), 'command', P.dispatch),
    windDdlr: hand(V(-21, 3.6, -4), under('ddlr'), 'data', P.wind, 3.0),
    ddlrAems: hand(under('ddlr'), under('aems'), 'decision', P.rating, 1.0),
  };

  // ── Labels ───────────────────────────────────────────────────
  const place = (def, x, y, z, opts) => {
    const l = L.label(def, opts);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  };
  // Each ground label is shown in the overview (step 0) and in the steps it belongs to.
  const ground = [
    { l: place(lab.boundary, 5, 2.2, 3.2, { anchor: 'left' }), steps: [0, 5] },
    { l: place(lab.transmission, -20, 8.5, -12), steps: [0] },
    { l: place(lab.distribution, -19, 1.6, 9.6), steps: [0, 3, 4] },
    { l: place(lab.dataCenter, 17.5, 2.4, -11), steps: [0, 6] },
    { l: place(lab.gas, -11.6, 4.1, -9.4), steps: [0, 5] },
    { l: place(lab.gateway, -9.2, 7.6, 3.4, { anchor: 'right' }), steps: [2, 3] },
    { l: place(lab.weather, -21, 2.2, -2), steps: [0, 1] },
  ];
  Object.assign(ground[1].l.element.style, { whiteSpace: 'normal', maxWidth: '150px' });

  // ── State and timeline ───────────────────────────────────────
  const S = {
    ti: 0, net: 36, sun: 0.15, day: 1, wind: 0.2, env: 1, envSet: 0, batt: 0, reg: 0, gen: 72, rating: 100,
    aForecasting: 0.15, aDerms: 0.15, aAdms: 0.15, aAems: 0.15, aDdlr: 0.15, aHub: 0.3, gw: 0,
  };
  for (const k of Object.keys(h)) S[`p_${k}`] = 0;
  const go = (tl, keys, at, dur = 0.9) => tl.to(S, { ...Object.fromEntries(keys.map((k) => [`p_${k}`, 1])), duration: dur, ease: 'power1.inOut' }, at);

  const timeline = stepTimeline([3.0, 3.2, 3.0, 3.2, 3.2, 3.4], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    const cast = (vars, d, dur = 0.5) => tl.to(S, { ...vars, duration: dur }, q(d));
    switch (k) {
      case 1: // Forecasting
        cast({ ti: 0, sun: 0.25, net: 30, aForecasting: 1 }, 0, 0.8);
        go(tl, ['weatherFc'], q(0.3));
        go(tl, ['fcHub'], q(1.3));
        cast({ aHub: 1 }, 2.15, 0.3);
        break;
      case 2: // DERMS: backfeed foreseen, envelopes calculated
        cast({ ti: 1, sun: 0.38, net: 14, aForecasting: 0.35 }, 0, 0.8);
        go(tl, ['hubDerms'], q(0.1), 0.8);
        cast({ aDerms: 1, aHub: 0.3 }, 0.85, 0.3);
        go(tl, ['dermsGw'], q(1.2), 0.8);
        cast({ env: 0.45, gw: 1 }, 2.0, 0.8);
        break;
      case 3: // Gateway sends limits; batteries soak up solar
        cast({ ti: 2, sun: 0.5, net: 6 }, 0, 0.8);
        go(tl, ['gwHomes1', 'gwHomes2', 'gwAgg'], q(0.2), 1.0);
        cast({ envSet: 1, batt: 1 }, 1.2, 0.6);
        cast({ gw: 0.4, aDerms: 0.5 }, 2.0, 0.5);
        break;
      case 4: // backfeed; ADMS keeps voltages in limits (VVO)
        cast({ ti: 3, sun: 0.6, net: -18 }, 0, 1.0);
        cast({ aAdms: 1 }, 0.3, 0.3);
        go(tl, ['homesAdms'], q(0.4));
        go(tl, ['admsReg'], q(1.4));
        cast({ reg: 1 }, 2.2, 0.2);
        cast({ reg: 0 }, 2.6, 0.4);
        break;
      case 5: // net flow reversed at the boundary; AEMS re-dispatches
        cast({ ti: 4, sun: 0.68, net: -16, aAdms: 0.35 }, 0, 0.6);
        go(tl, ['bndAems'], q(0.2));
        cast({ aAems: 1 }, 1.05, 0.3);
        go(tl, ['aemsGas'], q(1.3));
        cast({ gen: 52 }, 2.1, 0.8);
        break;
      case 6: // windy evening; DDLR raises ratings
        cast({ ti: 5, sun: 0.95, day: 0.45, net: 44, batt: 0, env: 1, envSet: 0, wind: 1, aAems: 0.35, aDerms: 0.15 }, 0, 1.0);
        go(tl, ['windDdlr'], q(0.6));
        cast({ aDdlr: 1 }, 1.45, 0.3);
        go(tl, ['ddlrAems'], q(1.7));
        cast({ rating: 120, aAems: 1 }, 2.5, 0.6);
        break;
      default:
    }
  });

  // ── Per-frame rendering ─────────────────────────────────────
  const tmp = new THREE.Color();
  const sunDay = new THREE.Color('#FFD27A');
  const sunEvening = new THREE.Color('#FF8A3D');
  const dirBase = lights.dir.intensity;
  const hemiBase = lights.hemi.intensity;
  let lastHud = '';
  const m = new THREE.Matrix4();
  const q0 = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const pv = new THREE.Vector3();

  function update(dt, t) {
    // Sun and daylight
    const a = Math.PI * S.sun;
    sun.position.set(-26 * Math.cos(a), 5 + 12 * Math.sin(a), -24);
    sun.material.color.copy(sunDay).lerp(sunEvening, clamp01((S.sun - 0.75) * 4));
    sunGlow.position.copy(sun.position);
    sunGlow.quaternion.copy(camera.quaternion);
    lights.dir.intensity = dirBase * S.day;
    lights.hemi.intensity = hemiBase * (0.6 + 0.4 * S.day);
    lights.dir.position.set(sun.position.x * 0.6, Math.max(8, sun.position.y * 2), 18);

    // Net flow at the boundary: down (teal) = import, up (purple) = export
    const exportFlow = S.net < 0;
    const mag = Math.abs(S.net);
    const len = 0.6 + mag / 14;
    arrowMat.color.copy(exportFlow ? C.reverse : C.flow);
    arrowMat.emissive.copy(arrowMat.color);
    shaft.scale.y = len;
    head.position.y = len;
    arrow.rotation.z = exportFlow ? 0 : Math.PI;
    arrow.position.y = exportFlow ? 3.2 : 4.6 + len + 1;
    arrow.visible = mag > 0.5;

    tmp.copy(exportFlow ? C.reverse : C.flow);
    fMat.color.copy(tmp);
    fMat.emissive.copy(tmp);
    fFlow.color.copy(tmp);
    fFlow.direction = exportFlow ? -1 : 1;
    fFlow.intensity = clamp01(0.3 + mag / 30);
    fFlow.update(dt);
    tMat.color.copy(C.flow).lerp(C.restored, clamp01((S.rating - 100) / 20) * 0.6);
    tMat.emissive.copy(tMat.color);
    tFlow.intensity = 0.6 + 0.4 * clamp01((S.rating - 100) / 20);
    tFlow.update(dt);

    for (const tb of turbines) tb.rotor.rotation.x += dt * (0.6 + 2.2 * S.wind);
    windMat.opacity = 0.7 * clamp01((S.wind - 0.3) / 0.7);
    for (let i = 0; i < 8; i += 1) {
      const u = ((i / 8 + t * 0.15) % 1);
      pv.set(-14 + u * 30, 6.4 + 0.4 * Math.sin(i * 1.3), -10.5 + (i % 2) * 3);
      sc.setScalar(windMat.opacity > 0.01 ? 1 : 0.001);
      m.compose(pv, q0, sc);
      windArrows.setMatrixAt(i, m);
    }
    windArrows.instanceMatrix.needsUpdate = true;

    // Envelopes (allowed export per home) and battery charging
    envMat.color.copy(C.data).lerp(C.command, S.envSet);
    envMat.emissive.copy(envMat.color);
    solarHomes.forEach((hm, i) => {
      pv.set(hm.x - 0.45, 1.5, hm.z);
      sc.set(1, Math.max(0.001, 1.4 * S.env), 1);
      m.compose(pv, q0, sc);
      envBars.setMatrixAt(i, m);
    });
    envBars.instanceMatrix.needsUpdate = true;
    envBars.visible = S.gw > 0.01 || S.envSet > 0.01;
    battMat.opacity = S.batt * (0.55 + 0.35 * Math.sin(t * 3));
    regGlow.material.opacity = 0.8 * S.reg;

    gauge.setValue(S.gen);
    gauge.setColor(C.flow);
    gateway.material.emissiveIntensity = 0.4 + 1.2 * S.gw;

    hub.update(dt);
    hub.setActive(S.aHub);
    apps.forecasting.setActive(S.aForecasting);
    apps.derms.setActive(S.aDerms);
    apps.adms.setActive(S.aAdms);
    apps.aems.setActive(S.aAems);
    apps.ddlr.setActive(S.aDdlr);
    // As in Workflow A: titles only in the overview; close-ups label only the acting apps.
    for (const [key, app] of Object.entries(apps)) {
      const av = S[`a${key[0].toUpperCase()}${key.slice(1)}`];
      app.label.element.classList.toggle('label3d--compact', av < 0.6);
      if (view.k >= 1 && av < 0.6) app.setLabelVisible(0);
    }
    hub.label.element.classList.toggle('label3d--compact', view.k === 0);
    L.setLabelOpacity(hub.label, view.k <= 2 ? 1 : 0);
    for (const g of ground) L.setLabelOpacity(g.l, g.steps.includes(view.k) ? 1 : 0);
    for (const [k, link] of Object.entries(h)) link.set(S[`p_${k}`]);

    // Readouts
    const time = SO.times[Math.max(0, Math.min(SO.times.length - 1, Math.round(S.ti)))];
    const netText = `${Math.round(mag)} ${SO.unit} ${exportFlow ? SO.exportWord : SO.importWord}`;
    const rating = `${Math.round(S.rating)}%`;
    const key = `${time}|${netText}|${rating}`;
    if (key !== lastHud) {
      lastHud = key;
      ctx.setHud({
        items: [
          { label: SO.timeLabel, value: time },
          { label: SO.netLabel, value: netText, mood: exportFlow ? 'warn' : '' },
          { label: SO.ratingLabel, value: rating, mood: S.rating > 101 ? 'ok' : '' },
        ],
      });
    }
  }

  // k = current step: 0 is the overview, 1-6 follow the afternoon.
  const view = { k: 0 };
  const presets = {
    overview: { pos: [0, 23, 46], target: [0, 6.5, -1] },
    forecast: { pos: [-10, 15.5, 28], target: [-8, 9, -5] },
    derms: { pos: [-6, 12, 25], target: [-6, 6, 3] },
    homes: { pos: [-1, 11, 27], target: [-2, 5, 3] },
    boundary: { pos: [6, 13, 25], target: [2, 6.5, -3] },
    evening: { pos: [8, 16.5, 35], target: [5, 8, -5] },
  };

  return finishScene({
    scene, camera, timeline, presets, flows, update,
    steps: stepsFromContent(content, ['forecast', 'derms', 'homes', 'homes', 'boundary', 'evening']),
    startPreset: 'overview',
    onStep: (k) => { view.k = k; },
    onEnter: () => { lastHud = ''; },
    controlsLimits: { minDistance: 8, maxDistance: 100 },
    dispose: () => { for (const x of H) x.dispose(); },
  });
}
