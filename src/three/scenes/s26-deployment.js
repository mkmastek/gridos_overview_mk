// Slide 26 — deployment, adoption journey, customer examples.
// Left: an on-premises data center and a cloud platform joined by a hybrid link.
// Centre: a low-poly globe with four customer pins, each linked to a GridOS emblem
// (click a pin to open its customer card). Right: two 3D staircases for the
// distribution and transmission adoption journeys.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createGlobe, createPin } from '../kit/Globe.js';
import { createHandoff } from '../kit/AppNetwork.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const GLOBE_C = V(-4, 5.2, 0);
const R = 3.6;

// Approximate city locations (geography, not GridOS facts).
const CUSTOMERS = [
  { key: 'alabama', lat: 33.0, lon: -86.8 },
  { key: 'oneGrid', lat: 63.4, lon: 10.4 },
  { key: 'stedin', lat: 52.1, lon: 5.1 },
  { key: 'queensland', lat: -27.5, lon: 153.0 },
];

export function createScene(stage, kit, ctx) {
  const { assets: A, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const P = content.packets;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 56, depth: 36 }, shadowExtent: 28, fogNear: 70, fogFar: 160 });

  // ── Globe with customer pins ─────────────────────────────────
  const globe = createGlobe({ radius: R });
  globe.group.position.copy(GLOBE_C);
  scene.add(globe.group);
  const plinth = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 40).rotateX(-Math.PI / 2), M.glowMat(M.PALETTE.data, { opacity: 0.35, blending: THREE.NormalBlending }));
  plinth.position.set(GLOBE_C.x, 0.05, GLOBE_C.z);
  scene.add(plinth);

  const emblem = A.createGlassSlab({ width: 4.6, depth: 2.6, thickness: 0.32, color: M.PALETTE.data, opacity: 0.18 });
  emblem.group.position.set(GLOBE_C.x, 11.2, GLOBE_C.z);
  scene.add(emblem.group);
  const emblemPt = emblem.group.position.clone().add(V(0, -0.2, 0));

  const pins = CUSTOMERS.map((cu) => {
    const pin = createPin(cu.lat, cu.lon, R);
    pin.head.userData.customer = cu.key;
    globe.group.add(pin.group);
    const surface = GLOBE_C.clone().add(pin.normal.clone().multiplyScalar(R + 0.95));
    const info = content.customers[cu.key];
    const lbl = L.label({ title: info.name, sub: info.place });
    lbl.position.copy(GLOBE_C.clone().add(pin.normal.clone().multiplyScalar(R + 1.6)));
    scene.add(lbl);
    return { ...cu, pin, surface, lbl };
  });
  const pinOf = Object.fromEntries(pins.map((p) => [p.key, p]));

  // Arcs bend outward around the globe, then up to the GridOS emblem.
  const H = [];
  const arc = (from, to, kind, packet, normal) => {
    const control = GLOBE_C.clone().add(normal.clone().multiplyScalar(R + 4)).setY(Math.max(from.y, to.y) + 1);
    const h = createHandoff(from, to, { color: kind === 'command' ? M.PALETTE.command : M.PALETTE.data, kind, packet, control });
    scene.add(h.group);
    H.push(h);
    return h;
  };
  const links = {
    oneGrid: arc(pinOf.oneGrid.surface, emblemPt, 'data', P.adms, pinOf.oneGrid.pin.normal),
    alabama: arc(pinOf.alabama.surface, emblemPt, 'data', P.alabama, pinOf.alabama.pin.normal),
    stedin: arc(emblemPt, pinOf.stedin.surface, 'command', P.stedin, pinOf.stedin.pin.normal),
    queensland: arc(emblemPt, pinOf.queensland.surface, 'command', P.queensland, pinOf.queensland.pin.normal),
  };

  // ── Hybrid deployment: on-premises data center + cloud platform ──
  const onPrem = A.createDataCenter({ w: 2.8, d: 2, h: 1.3 });
  onPrem.group.position.set(-15, 0, 3);
  scene.add(onPrem.group);
  const cloud = A.createGlassSlab({ width: 3.8, depth: 2.6, thickness: 0.5, color: M.PALETTE.data, opacity: 0.22 });
  cloud.group.position.set(-15, 6.6, 3);
  scene.add(cloud.group);
  const hybrid = createHandoff(V(-15, 1.6, 3), V(-15, 6.3, 3), { color: M.PALETTE.data, packet: P.hybrid, kind: 'data', lift: 0.4, control: V(-12.6, 4, 3) });
  scene.add(hybrid.group);
  H.push(hybrid);

  // ── Adoption staircases ──────────────────────────────────────
  const stairs = (keys, x0, z0, dx, dz, tips) => keys.map((key, i) => {
    const h = 0.6 * (i + 1);
    const mat = M.stdMat('#2A3E86', { emissive: M.PALETTE.data, emissiveIntensity: 0 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.1, h, 2.1).translate(0, h / 2, 0), mat);
    box.position.set(x0 + i * dx, 0, z0 + i * dz);
    box.castShadow = true;
    box.receiveShadow = true;
    box.userData.tip = tips[i];
    scene.add(box);
    const lbl = L.label(lab[key]);
    lbl.position.set(box.position.x, h + 0.15, box.position.z);
    // Steps are close together: narrow, wrapped labels (full form only on the current step).
    Object.assign(lbl.element.style, { whiteSpace: 'normal', width: '90px' });
    scene.add(lbl);
    return { box, mat, lbl };
  });
  const dist = stairs(['d1', 'd2', 'd3', 'd4', 'd5'], 4, 1.8, 2.2, -1.7, content.tips.distribution);
  const trans = stairs(['t1', 't2', 't3'], 6.2, 7.4, 2.4, -1.4, content.tips.transmission);

  // ── Labels ───────────────────────────────────────────────────
  const place = (def, p, opts) => {
    const l = L.label(def, opts);
    l.position.copy(p);
    scene.add(l);
    return l;
  };
  const lGridos = place(lab.gridos, emblem.group.position.clone().add(V(0, 0.45, 0)));
  const lOnPrem = place(lab.onPrem, V(-15, 1.8, 3.9));
  const lCloud = place(lab.cloud, V(-15, 7.1, 3));
  // Journey titles sit on the ground in front of the first step of each staircase.
  const lDist = place(lab.distJourney, V(4, 0.2, 3.6), { anchor: 'center' });
  const lTrans = place(lab.transJourney, V(6.2, 0.2, 9.2), { anchor: 'center' });

  // ── State and timeline ───────────────────────────────────────
  const S = {
    hyb: 0, emb: 0.3, aOneGrid: 0, aAlabama: 0, aStedin: 0, aQueensland: 0,
    pHyb: 0, pOneGrid: 0, pAlabama: 0, pStedin: 0, pQueensland: 0, dj: 0, tj: 0,
  };
  const timeline = stepTimeline([2.6, 2.8, 2.6, 2.6, 2.6, 3.0, 2.4], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    const cast = (vars, d, dur = 0.5) => tl.to(S, { ...vars, duration: dur }, q(d));
    if (k === 1) {
      cast({ hyb: 1 }, 0, 0.5);
      tl.to(S, { pHyb: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.4));
    }
    if (k === 2) {
      cast({ hyb: 0.4, aOneGrid: 1 }, 0, 0.5);
      tl.to(S, { pOneGrid: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.5));
      cast({ emb: 1 }, 1.8, 0.4);
    }
    if (k === 3) {
      cast({ aOneGrid: 0.25, aAlabama: 1, emb: 0.3 }, 0, 0.5);
      tl.to(S, { pAlabama: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.4));
      cast({ emb: 1 }, 1.7, 0.4);
    }
    if (k === 4) {
      cast({ aAlabama: 0.25, aStedin: 1, emb: 1 }, 0, 0.5);
      tl.to(S, { pStedin: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.4));
    }
    if (k === 5) {
      cast({ aStedin: 0.25, aQueensland: 1 }, 0, 0.5);
      tl.to(S, { pQueensland: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.4));
    }
    if (k === 6) {
      cast({ aQueensland: 0.25, emb: 0.3 }, 0, 0.4);
      tl.to(S, { dj: 5, duration: 2.4, ease: 'none' }, q(0.3));
    }
    if (k === 7) {
      tl.to(S, { tj: 3, duration: 1.8, ease: 'none' }, q(0.2));
    }
  });

  // ── Per-frame rendering ─────────────────────────────────────
  const lit = new THREE.Color('#0FBDFF');
  const unlit = new THREE.Color('#2A3E86');
  const lightStairs = (list, level) => list.forEach((s, i) => {
    const v = clamp01(level - i);
    s.mat.color.copy(unlit).lerp(lit, v * 0.7);
    s.mat.emissiveIntensity = 0.5 * v;
    L.setLabelOpacity(s.lbl, v);
    const current = v > 0.5 && level - i < 1.5;
    s.lbl.element.classList.toggle('label3d--accent', current);
    s.lbl.element.classList.toggle('label3d--compact', !current);
  });

  // k = current step: 1 hybrid, 2-5 customer pins, 6-7 staircases.
  const view = { k: 0 };
  function update(dt, t) {
    for (const p of pins) {
      const a = S[`a${p.key[0].toUpperCase()}${p.key.slice(1)}`];
      p.pin.setActive(a);
      p.pin.update(t);
      L.setLabelOpacity(p.lbl, a > 0.5 ? 1 : 0);
    }
    links.oneGrid.set(S.pOneGrid);
    links.alabama.set(S.pAlabama);
    links.stedin.set(S.pStedin);
    links.queensland.set(S.pQueensland);
    hybrid.set(S.pHyb);
    emblem.setGlow(S.emb);
    cloud.setGlow(0.3 + 0.7 * S.hyb);
    onPrem.stripMaterial.opacity = 0.5 + 0.5 * S.hyb;
    L.setLabelOpacity(lOnPrem, 0.55 + 0.45 * S.hyb);
    L.setLabelOpacity(lCloud, 0.55 + 0.45 * S.hyb);
    lightStairs(dist, S.dj);
    lightStairs(trans, S.tj);
    // The journey titles belong to the overview and the staircase steps, not the globe close-ups.
    const journey = view.k === 0 || view.k >= 6 ? 1 : 0;
    L.setLabelOpacity(lDist, (S.dj > 0.01 ? 1 : 0.6) * journey);
    L.setLabelOpacity(lTrans, (S.tj > 0.01 ? 1 : 0.6) * journey);
    L.setLabelOpacity(lGridos, 0.7 + 0.3 * S.emb);
  }

  // ── Picking: pins open customer cards; stairs show their stage ─
  // The globe itself is included so pins on its far side cannot be clicked through it.
  const pickables = [globe.mesh, ...pins.map((p) => p.pin.head), ...dist.map((s) => s.box), ...trans.map((s) => s.box)];
  const hit = (ray) => {
    const o = ray.intersectObjects(pickables, false)[0]?.object || null;
    return o === globe.mesh ? null : o;
  };
  const onClick = (ray) => {
    const o = hit(ray);
    const key = o?.userData.customer;
    if (key) ctx.showInfo(content.customers[key].card);
  };
  const onHover = (ray) => {
    const o = hit(ray);
    if (!o) return null;
    if (o.userData.customer) {
      const cu = content.customers[o.userData.customer];
      return { tip: `${cu.name} — ${cu.place}\n${content.tips.pinHint}`, clickable: true };
    }
    return o.userData.tip ? { tip: o.userData.tip, clickable: false } : null;
  };

  // Camera presets: one per customer, looking at the pin from outside the globe.
  // lift raises the view so a southern pin's label clears the flow strip at the bottom of the frame.
  const pinView = (key, dist = 8.5, lift = 0) => {
    const n = pinOf[key].pin.normal;
    const pos = GLOBE_C.clone().add(n.clone().multiplyScalar(R + dist)).add(V(0, 2.5, 0));
    pos.y = Math.max(pos.y, 1.5) + lift;
    const target = GLOBE_C.clone().add(n.clone().multiplyScalar(R * 0.5)).add(V(0, 1.5 + lift, 0));
    return { pos: pos.toArray(), target: target.toArray() };
  };
  const presets = {
    overview: { pos: [-1, 15, 34], target: [-3, 4.5, 0] },
    hybrid: { pos: [-10, 9, 19], target: [-12, 4, 2] },
    oneGrid: pinView('oneGrid'),
    alabama: pinView('alabama'),
    stedin: pinView('stedin'),
    queensland: pinView('queensland', 10, 3),
    stairs: { pos: [11, 9.5, 16], target: [8.5, 2.2, 0] },
  };

  return finishScene({
    scene, camera, timeline, presets, update, onClick, onHover,
    steps: stepsFromContent(content, ['hybrid', 'oneGrid', 'alabama', 'stedin', 'queensland', 'stairs', 'stairs']),
    startPreset: 'overview',
    onStep: (k) => { view.k = k; },
    controlsLimits: { minDistance: 6, maxDistance: 80 },
    dispose: () => { for (const h of H) h.dispose(); },
  });
}
