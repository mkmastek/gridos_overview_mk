// Slide 23 — resilience: before, during and after a storm.
// A regional map of townships, a storm moving along its forecast track, and the three
// applications that act in turn: Disruption Prepare (before), Outage Assist in the
// Enterprise OMS (during) and Storm Manager (after). Labelled packets show what each
// application receives and sends. All visuals are driven by one state object S.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';
import { createTownships, createStorm, createForecastCone } from '../kit/Regions.js';
import { createAppPanel, createHandoff } from '../kit/AppNetwork.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function createScene(stage, kit, ctx) {
  const { assets: A, labels: L, materials: M } = kit;
  const content = ctx.content;
  const R = content.resilience;
  const lab = content.labels;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 62, depth: 40 }, shadowExtent: 32, fogNear: 70, fogFar: 170 });

  // ── Sea, townships, storm track ──────────────────────────────
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(13, 40).rotateX(-Math.PI / 2), M.stdMat('#03103F', { roughness: 0.35, metalness: 0.2 }));
  sea.position.set(-24.5, 0.03, 0);
  scene.add(sea);

  const { group: townGroup, towns } = createTownships({ cols: 5, rows: 4, size: 2.4, center: V(0, 0, 0.6) });
  scene.add(townGroup);

  const track = [V(-27, 0, 10), V(-15, 0, 5.5), V(-4, 0, 1.6), V(7, 0, -3), V(19, 0, -9)];
  const cone = createForecastCone(track, { w0: 1.6, w1: 9 });
  scene.add(cone.group);
  const trackPts = cone.curve.getSpacedPoints(80);
  for (const t of towns) {
    let d = Infinity;
    for (const p of trackPts) d = Math.min(d, Math.hypot(p.x - t.center.x, p.z - t.center.z));
    t.risk = clamp01(1 - d / 7.5) ** 1.2;
  }
  const byRisk = [...towns].sort((a, b) => b.risk - a.risk);

  const storm = createStorm({ radius: 3.6 });
  scene.add(storm.group);

  // ── Service centers and crews ────────────────────────────────
  const depots = [V(-12.5, 0, -7.5), V(12.5, 0, -6.5), V(12, 0, 7.5)].map((p) => {
    const dc = A.createDataCenter({ w: 2.4, d: 1.6, h: 0.9 });
    dc.group.position.copy(p);
    scene.add(dc.group);
    return p;
  });
  const trucks = byRisk.slice(0, 6).map((town, i) => {
    const t = A.createCrewTruck();
    t.group.scale.setScalar(0.8);
    scene.add(t.group);
    const depot = depots[i % depots.length];
    const dirToDepot = depot.clone().sub(town.center).setY(0).normalize();
    return {
      ...t,
      p0: depot.clone().add(V((i % 2) * 1.2 - 0.6, 0, 1.4)),
      p1: town.center.clone().add(dirToDepot.multiplyScalar(2.9)), // staged at the edge of the township
      p2: town.center.clone().add(V(0.6, 0, 0.6)),
    };
  });
  const aidTrucks = [0, 1, 2].map((i) => {
    const t = A.createCrewTruck();
    t.group.scale.setScalar(0.8);
    scene.add(t.group);
    const town = byRisk[i + 1];
    return { ...t, p0: V(30, 0, 1.5 + i * 1.6), p1: town.center.clone().add(V(-0.7, 0, -0.7)) };
  });

  // ── Weather feed, remote staff ───────────────────────────────
  const weather = new THREE.Group();
  weather.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.9), M.stdMat('#C9D3E0')));
  for (const s of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.7), M.stdMat('#1E3A6E', { emissive: '#0c1f44' }));
    panel.position.x = s * 1.15;
    weather.add(panel);
  }
  weather.position.set(-17.5, 6, -9);
  scene.add(weather);

  const staff = [V(11.2, 0, 12), V(12.4, 0, 11.6), V(13.6, 0, 12.1)].map((p) => {
    const g = new THREE.Group();
    g.add(A.createPerson({ color: '#9EC9FF' }));
    const phone = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.03), M.glowMat(M.PALETTE.data, { blending: THREE.NormalBlending }));
    phone.position.set(0.2, 0.62, 0.2);
    g.add(phone);
    g.position.copy(p);
    scene.add(g);
    return g;
  });

  // ── Applications floating above the map ─────────────────────
  const panelAt = (def, x, y, z) => {
    const p = createAppPanel(def, { width: 4, height: 2.1 });
    p.group.position.set(x, y, z);
    p.group.rotation.x = -0.12;
    scene.add(p.group);
    return p;
  };
  const prep = panelAt(lab.prepare, -10, 9.2, -12);
  const assist = panelAt(lab.assist, 0, 9.8, -12.5);
  const manager = panelAt(lab.manager, 10, 9.2, -12);
  const below = (p) => p.group.position.clone().add(V(0, -1.15, 0.2));

  // Storm Manager resource board: three bars beside the panel
  const boardBars = R.boardRows.map((row, i) => {
    const mat = M.stdMat(M.PALETTE.restored, { emissive: M.PALETTE.restored, emissiveIntensity: 0.5 });
    const geo = new THREE.BoxGeometry(1, 0.45, 0.3).translate(0.5, 0, 0);
    const bar = new THREE.Mesh(geo, mat);
    bar.position.set(13.2, 7.6 - i * 1.6, -12);
    bar.scale.x = 0.001;
    scene.add(bar);
    const tag = L.tagLabel(row, null, { anchor: 'right' });
    tag.position.set(13.05, 7.6 - i * 1.6, -12);
    scene.add(tag);
    return { bar, tag, value: [3.4, 2.4, 2.9][i] };
  });

  // ── Handoffs: what each application receives and sends ──────
  const P = R.packets;
  const hand = (a, b, color, packet, kind, lift = 1.6) => {
    const h = createHandoff(a, b, { color, packet, kind, lift });
    scene.add(h.group);
    return h;
  };
  const hWeather = hand(weather.position.clone(), below(prep), M.PALETTE.data, P.forecast, 'data', 1.2);
  const hStage = depots.map((d, i) => hand(below(prep), d.clone().setY(1.2), M.PALETTE.command, i === 0 ? P.stage : null, 'command', 1.0));
  const hReports = byRisk.slice(0, 3).map((t, i) => hand(t.center.clone().setY(2.2), below(assist), M.PALETTE.data, i === 0 ? P.reports : null, 'data', 1.2));
  const stagingMid = trucks.reduce((acc, t) => acc.add(t.p1), V(0, 0, 0)).multiplyScalar(1 / trucks.length).setY(1.2);
  const hDispatch = hand(below(assist), stagingMid, M.PALETTE.command, P.dispatch, 'command', 1.0);
  const hRemote = hand(below(assist), V(12.4, 1.8, 11.6), M.PALETTE.command, P.remote, 'command', 1.4);
  const hAid = hand(below(manager), V(22, 1.2, 3), M.PALETTE.command, P.aid, 'command', 1.0);

  // ── Time ruler (T−72h … T+48h) on the right edge of the map ──
  const RULER_X = 17.5;
  const tickZ = (i) => -8 + (i * 14) / (R.timeline.length - 1);
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 14.4), M.glowMat(M.PALETTE.data, { opacity: 0.5, blending: THREE.NormalBlending }));
  ruler.position.set(RULER_X, 0.08, -1);
  scene.add(ruler);
  const ticks = R.timeline.map((t, i) => {
    const tag = L.tagLabel(t, null, { anchor: 'left' });
    tag.position.set(RULER_X + 0.4, 0.1, tickZ(i));
    scene.add(tag);
    return tag;
  });
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), M.stdMat(M.PALETTE.command, { emissive: M.PALETTE.command, emissiveIntensity: 1 }));
  scene.add(marker);

  // ── Labels ────────────────────────────────────────────────────
  const lStorm = L.label(lab.storm);
  const lCenter = L.label(lab.center);
  lCenter.position.copy(depots[0]).add(V(0, 1.6, 0));
  const lWeather = L.label(lab.weather);
  lWeather.position.copy(weather.position).add(V(0, 0.8, 0));
  const lRemote = L.label(lab.remote);
  lRemote.position.set(12.4, 2.1, 11.7);
  scene.add(lStorm, lCenter, lWeather, lRemote);

  // ── State and timeline ───────────────────────────────────────
  const S = {
    clock: 0, hours: -72, out: 0, cone: 0.35, storm: 0, stormI: 0.55,
    forecast: 0, actual: 0, zones: 0, restore: 0, flash: 0,
    stage: 0, dispatch: 0, aid: 0, board: 0, remote: 0,
    aPrep: 0.15, aAssist: 0.15, aMgr: 0.15,
    pWeather: 0, pStage: 0, pReports: 0, pDispatch: 0, pRemote: 0, pAid: 0,
  };
  const timeline = stepTimeline([2.8, 3.0, 3.6, 2.8, 3.2, 2.8], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) {
      tl.to(S, { aPrep: 1, cone: 1, duration: 0.5 }, q(0));
      tl.to(S, { pWeather: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.2));
      tl.to(S, { forecast: 1, duration: 1.1, ease: 'power2.out' }, q(1.5));
    }
    if (k === 2) {
      tl.to(S, { hours: -48, clock: 1, storm: 0.2, duration: 0.8 }, q(0));
      tl.to(S, { pStage: 1, duration: 1.2, ease: 'power1.inOut' }, q(0.2));
      tl.to(S, { stage: 1, duration: 1.5, ease: 'power1.inOut' }, q(1.3));
    }
    if (k === 3) {
      tl.to(S, { hours: 0, clock: 2, storm: 0.55, stormI: 1, duration: 1.2, ease: 'power1.inOut' }, q(0));
      tl.to(S, { actual: 1, zones: 1, aPrep: 0.3, aAssist: 1, duration: 0.6 }, q(0.9));
      tl.to(S, { out: 48000, duration: 0.8, ease: 'power1.out' }, q(0.9));
      tl.to(S, { pReports: 1, duration: 1.0, ease: 'power1.inOut' }, q(1.3));
      tl.to(S, { pDispatch: 1, duration: 0.9, ease: 'power1.in' }, q(2.3));
      tl.to(S, { dispatch: 1, duration: 1.2, ease: 'power1.inOut' }, q(2.35));
    }
    if (k === 4) {
      tl.to(S, { hours: 6, clock: 3, storm: 0.72, duration: 0.8 }, q(0));
      tl.to(S, { remote: 1, duration: 0.5 }, q(0.2));
      tl.to(S, { pRemote: 1, duration: 1.2, ease: 'power1.inOut' }, q(0.5));
      tl.to(S, { out: 36000, restore: 0.25, duration: 1.0 }, q(1.5));
    }
    if (k === 5) {
      tl.to(S, { hours: 12, clock: 4, storm: 0.88, stormI: 0.45, aAssist: 0.4, aMgr: 1, duration: 0.8 }, q(0));
      tl.to(S, { board: 1, duration: 1.0, ease: 'power2.out' }, q(0.4));
      tl.to(S, { pAid: 1, duration: 1.1, ease: 'power1.inOut' }, q(0.6));
      tl.to(S, { aid: 1, duration: 1.4, ease: 'power1.inOut' }, q(1.6));
      tl.to(S, { out: 21000, restore: 0.55, duration: 1.2 }, q(1.8));
    }
    if (k === 6) {
      tl.to(S, { hours: 48, clock: 5, storm: 1, stormI: 0, cone: 0, duration: 1.0 }, q(0));
      tl.to(S, { restore: 1, zones: 0, out: 0, aMgr: 0.4, duration: 1.2, ease: 'power1.inOut' }, q(0.4));
      tl.to(S, { flash: 1, duration: 0.4 }, q(1.4)).to(S, { flash: 0, duration: 0.8 }, q(1.9));
    }
  });

  // ── Per-frame rendering of the state ────────────────────────
  const tmp = new THREE.Color();
  const base = new THREE.Color('#15307A');
  const outlineBase = new THREE.Color('#5B7BD5');
  const placeTruck = (t, a, b, u) => {
    const p = a.clone().lerp(b, clamp01(u));
    t.group.position.copy(p);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    if (Math.abs(dx) + Math.abs(dz) > 1e-3) t.group.rotation.y = -Math.atan2(dz, dx);
  };
  let lastHud = '';
  const clockText = (h) => {
    const n = Math.round(h);
    if (n === 0) return 'T0';
    return n < 0 ? `T−${-n}h` : `T+${n}h`;
  };

  function update(dt, t) {
    for (const town of towns) {
      const h = town.risk > 0.1 ? town.risk * 3.4 * S.forecast * (1 - S.restore) : 0;
      town.bar.visible = h > 0.02;
      town.bar.scale.y = Math.max(0.001, h);
      town.barMat.color.copy(C.ai).lerp(C.fault, S.actual);
      town.barMat.emissive.copy(town.barMat.color);
      tmp.copy(base).lerp(C.fault, 0.55 * S.actual * S.zones * (1 - S.restore) * town.risk);
      if (S.flash > 0 && town.risk > 0.1) tmp.lerp(C.restored, S.flash * 0.8);
      town.plateMat.color.copy(tmp);
      const hot = S.zones * (town.risk > 0.35 ? 1 : 0);
      town.outlineMat.color.copy(outlineBase).lerp(C.fault, hot);
      town.outlineMat.opacity = 0.5 + 0.5 * hot;
    }

    const sp = cone.curve.getPointAt(clamp01(S.storm));
    storm.group.position.set(sp.x, 5.6, sp.z);
    storm.setIntensity(S.stormI);
    storm.update(dt);
    cone.setOpacity(S.cone);
    lStorm.position.set(sp.x, 7.4, sp.z);
    L.setLabelOpacity(lStorm, S.stormI * (view.k === 5 ? 0 : 1));

    trucks.forEach((tr) => {
      if (S.dispatch > 0) placeTruck(tr, tr.p1, tr.p2, S.dispatch);
      else placeTruck(tr, tr.p0, tr.p1, S.stage);
    });
    aidTrucks.forEach((tr) => {
      tr.group.visible = S.aid > 0.01;
      placeTruck(tr, tr.p0, tr.p1, S.aid);
    });
    for (const tr of [...trucks, ...aidTrucks]) tr.lightMaterial.opacity = Math.sin(t * 9) > 0 ? 1 : 0.4;

    prep.setActive(S.aPrep);
    assist.setActive(S.aAssist);
    manager.setActive(S.aMgr);
    hWeather.set(S.pWeather);
    for (const h of hStage) h.set(S.pStage);
    for (const h of hReports) h.set(S.pReports);
    hDispatch.set(S.pDispatch);
    hRemote.set(S.pRemote);
    hAid.set(S.pAid);

    for (const b of boardBars) {
      b.bar.scale.x = Math.max(0.001, b.value * S.board);
      b.bar.visible = S.board > 0.01;
      L.setLabelOpacity(b.tag, S.board);
    }
    staff.forEach((g) => { g.visible = S.remote > 0.01; g.scale.setScalar(Math.max(0.001, S.remote)); });
    // Close-ups (steps 1-5) keep only the labels that belong to that step in view.
    const close = view.k >= 1 && view.k <= 5;
    L.setLabelOpacity(lRemote, S.remote * (view.k === 5 ? 0 : 1));
    L.setLabelOpacity(lWeather, close && view.k !== 1 ? 0 : 1);

    const zc = tickZ(0) + (S.clock / (R.timeline.length - 1)) * (tickZ(R.timeline.length - 1) - tickZ(0));
    marker.position.set(RULER_X, 0.35 + 0.08 * Math.sin(t * 4), zc);
    ticks.forEach((tag, i) => {
      const now = Math.abs(S.clock - i) < 0.5;
      tag.element.classList.toggle('is-command', now);
      // Ticks sit close together on screen: show the current one, plus both ends in the wide shots.
      const end = i === 0 || i === ticks.length - 1;
      L.setLabelOpacity(tag, now || (!close && end) ? 1 : 0);
    });

    const hud = `${clockText(S.hours)}|${Math.round(S.out / 100) * 100}`;
    if (hud !== lastHud) {
      lastHud = hud;
      ctx.setHud({
        items: [
          { label: R.clockLabel, value: clockText(S.hours) },
          { label: R.outLabel, value: (Math.round(S.out / 100) * 100).toLocaleString('en-US'), mood: S.out > 0 ? 'alert' : S.restore > 0.9 ? 'ok' : '' },
        ],
      });
    }
  }

  // k = current step: 1-5 are close-ups, 0 and 6 the whole map.
  const view = { k: 0 };
  const presets = {
    overview: { pos: [0, 22, 39], target: [0, 4.8, -2] },
    forecast: { pos: [-12, 13.5, 21], target: [-7, 6, -5] },
    stage: { pos: [3, 18, 26], target: [2.5, 1.5, -1] },
    storm: { pos: [-3, 16, 23], target: [-1, 3.5, -1] },
    remote: { pos: [5, 16.5, 32], target: [4, 5.2, -1] },
    aid: { pos: [8, 15, 30], target: [5.5, 5.4, -2.5] },
  };

  return finishScene({
    scene, camera, timeline, presets,
    flows: [storm],
    steps: stepsFromContent(content, ['forecast', 'stage', 'storm', 'remote', 'aid', 'overview']),
    startPreset: 'overview',
    update,
    onEnter: () => { lastHud = ''; },
    onStep: (k) => { view.k = k; },
    controlsLimits: { minDistance: 8, maxDistance: 90 },
    dispose: () => {
      for (const h of [hWeather, ...hStage, ...hReports, hDispatch, hRemote, hAid]) h.dispose();
    },
  });
}
