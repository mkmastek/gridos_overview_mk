// Slide 22 — GridOS Markets: clearing a day-ahead market.
// A 3D merit-order supply stack (width = MW, height = price), a demand plane that sets the
// clearing price, and a two-zone map whose tie line can congest and split the price into two
// LMPs. The "Tie-line limit" slider takes over from the demo until the next step.
// Volumes and prices are illustrative.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';
import { createMeritStack } from '../kit/Plots3D.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

const OFFERS = [
  { key: 'wind', mw: 300, price: 5, zone: 'north', color: '#0099A8' },
  { key: 'solar', mw: 200, price: 8, zone: 'north', color: '#FFC94D' },
  { key: 'hydro', mw: 250, price: 22, zone: 'north', color: '#0FBDFF' },
  { key: 'ccgt', mw: 400, price: 45, zone: 'south', color: '#AE63E4' },
  { key: 'peaker', mw: 250, price: 95, zone: 'south', color: '#F28C28' },
  { key: 'oil', mw: 150, price: 160, zone: 'south', color: '#9AA8C7' },
];
const LOAD = { north: 200, south: 900 };
const DEMAND = LOAD.north + LOAD.south;
const MW_SCALE = 1 / 60;
const PRICE_SCALE = 1 / 22;
const STACK = V(-13, 0, -5);
const NORTH = V(-8, 0, 8);
const SOUTH = V(8, 0, 8);
const PANEL = V(0, 12.5, -9);

/** Marginal price in a zone when it must generate `mw` from its own offers. */
function zonePrice(zone, mw) {
  let acc = 0;
  for (const o of OFFERS.filter((x) => x.zone === zone)) {
    acc += o.mw;
    if (mw <= acc + 1e-6) return o.price;
  }
  return OFFERS.filter((x) => x.zone === zone).pop().price;
}

/** Clear the two-zone market for a tie-line limit (MW, North → South). */
export function clearMarket(limit) {
  // Unconstrained: cheapest offers first across both zones.
  let acc = 0;
  let price = 0;
  for (const o of OFFERS) {
    if (acc >= DEMAND) break;
    acc += o.mw;
    price = o.price;
  }
  const northGen = Math.min(OFFERS.filter((o) => o.zone === 'north').reduce((n, o) => n + o.mw, 0), DEMAND);
  const wanted = northGen - LOAD.north;
  if (wanted <= limit) return { congested: false, price, north: price, south: price, flow: wanted };
  return { congested: true, price, north: zonePrice('north', LOAD.north + limit), south: zonePrice('south', LOAD.south - limit), flow: limit };
}

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const T = content.markets;
  const pk = content.packets;
  const ctl = content.controls;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 50, depth: 38 }, shadowExtent: 28, fogNear: 70, fogFar: 150 });
  const flows = [];

  // ── Merit-order stack ───────────────────────────────────────
  const stack = createMeritStack({ offers: OFFERS, mwScale: MW_SCALE, priceScale: PRICE_SCALE, depth: 2.4 });
  stack.group.position.copy(STACK);
  scene.add(stack.group);
  // Arrival order (scrambled) before sorting: offers come in as they are submitted.
  const scrambled = ['ccgt', 'wind', 'oil', 'hydro', 'peaker', 'solar'];
  let x = 0;
  const startX = {};
  for (const key of scrambled) {
    const b = stack.blocks.find((bl) => bl.key === key);
    const w = b.x1 - b.x0;
    startX[key] = x + w / 2;
    x += w;
  }
  const blockLabels = stack.blocks.map((b) => {
    const o = L.tagLabel(T.offers[b.key], null, { anchor: 'bottom' });
    scene.add(o);
    return o;
  });

  // Demand plane, clearing marker and price line
  const demandX = STACK.x + stack.xAt(DEMAND);
  const planeMat = M.glowMat(M.BRAND.lightBlue, { opacity: 0.2, side: THREE.DoubleSide, blending: THREE.NormalBlending });
  const demandPlane = new THREE.Mesh(new THREE.PlaneGeometry(4, 9).rotateY(Math.PI / 2), planeMat);
  const demandEdge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 9, 0.08), M.glowMat(M.BRAND.lightBlue, { blending: THREE.NormalBlending }));
  scene.add(demandPlane, demandEdge);
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 10), M.glowMat(M.PALETTE.command, { blending: THREE.NormalBlending }));
  const priceLine = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.06), M.glowMat(M.PALETTE.command, { blending: THREE.NormalBlending }));
  scene.add(marker, priceLine);
  const priceEl = document.createElement('div');
  priceEl.className = 'tag3d is-command';
  const priceLabel = L.elementLabel(priceEl, { anchor: 'right' });
  scene.add(priceLabel);
  const at = (def, p, opts) => { const l = L.label(def, opts); l.position.copy(p); scene.add(l); return l; };
  // Positions checked at 1366×768: the stack title sits top-right, the price-axis title top-left.
  const stackLabel = at(lab.stack, V(9, 8.4, STACK.z));
  const demandLabel = at(lab.demand, V(demandX, 9.3, STACK.z));
  // Axis titles are hidden on phones (the text panel explains the axes there).
  const axisTag = (text, p, anchor = 'center') => {
    const o = L.tagLabel(text, null, { anchor });
    o.element.classList.add('tag3d--minor');
    o.position.copy(p);
    scene.add(o);
    return o;
  };
  axisTag(T.priceAxis, STACK.clone().add(V(-0.6, 8.0, 1.3)), 'left');
  axisTag(T.mwAxis, STACK.clone().add(V(stack.width / 2, -0.6, 1.8)));

  // ── Two-zone map with the tie line ──────────────────────────
  const zone = (p, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(11, 0.2, 7), M.stdMat(color, { transparent: true, opacity: 0.35, emissive: color, emissiveIntensity: 0.2 }));
    m.position.copy(p).setY(0.1);
    scene.add(m);
    return m;
  };
  const zones = { north: zone(NORTH, '#0099A8'), south: zone(SOUTH, '#AE63E4') };
  const turbines = [[-11.5, 6.5], [-9, 9.5]].map(([zx, zz]) => {
    const t = A.createWindTurbine({ height: 3.6, radius: 1.2 });
    t.group.position.set(zx, 0.2, zz);
    scene.add(t.group);
    return t;
  });
  const gas = A.createGasPlant();
  gas.scale.setScalar(0.55);
  gas.position.set(11, 0.2, 7);
  scene.add(gas);
  const city = A.createDataCenter({ w: 3.2, d: 2.2, h: 1.2 });
  city.group.position.set(5.5, 0.2, 9.5);
  scene.add(city.group);
  const tieA = NORTH.clone().add(V(5.5, 1.6, 0));
  const tieB = SOUTH.clone().add(V(-5.5, 1.6, 0));
  const tiePath = A.catenary(tieA, tieB, 0.3, 12);
  const tieMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.6 });
  scene.add(A.createConductor(tiePath, tieMat, 0.14));
  const tieFlow = new F.PowerFlow({ path: tiePath, color: M.PALETTE.flow, density: 2, size: 0.45 });
  scene.add(tieFlow.object3D);
  flows.push(tieFlow);
  const labels = {
    north: at(lab.north, NORTH.clone().add(V(-1, 2.2, -2.6))),
    south: at(lab.south, SOUTH.clone().add(V(1, 2.6, -2.6))),
    tie: at(lab.tie, V(0, 0.4, 11), { anchor: 'center' }),
  };
  const zoneTag = (p) => {
    const el = document.createElement('div');
    el.className = 'tag3d';
    const o = L.elementLabel(el, { anchor: 'center' });
    o.position.copy(p);
    scene.add(o);
    return { el, o };
  };
  const zonePrices = { north: zoneTag(NORTH.clone().add(V(-1, 0.6, 3.6))), south: zoneTag(SOUTH.clone().add(V(1, 0.6, 3.6))) };
  const tieTag = zoneTag(V(0, 2.4, 8));

  // ── GridOS Markets panel and labelled packets ───────────────
  const panel = A.createGlassPanel({ width: 7, height: 2, color: M.BRAND.lightBlue });
  panel.group.position.copy(PANEL);
  scene.add(panel.group);
  at(lab.markets, PANEL, { anchor: 'center', variant: 'big' });
  const arc = (a, b, lift = 2.2) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const trail = (a, b, text, kind, color) => {
    const t = new F.PacketTrail({ path: arc(a, b), color, label: { text, kind } });
    scene.add(t.object3D);
    return t;
  };
  const pBottom = PANEL.clone().add(V(0, -1, 0));
  const trails = {
    offerN: trail(NORTH.clone().add(V(0, 1, 0)), pBottom.clone().add(V(-2, 0, 0)), pk.offer, 'data', M.PALETTE.data),
    offerS: trail(SOUTH.clone().add(V(0, 1, 0)), pBottom.clone().add(V(2, 0, 0)), pk.offer, 'data', M.PALETTE.data),
    sched: trail(pBottom.clone().add(V(2.5, 0, 0)), SOUTH.clone().add(V(2, 1, 0)), pk.schedule, 'command', M.PALETTE.command),
    pays: trail(SOUTH.clone().add(V(-2, 1, 1)), pBottom.clone().add(V(1, 0, 0)), pk.pays, 'data', M.PALETTE.data),
    paid: trail(pBottom.clone().add(V(-1, 0, 0)), NORTH.clone().add(V(2, 1, 1)), pk.paid, 'data', M.PALETTE.data),
  };

  // ── State and timeline (tie limit follows the demo unless the viewer moves it) ─
  const S = { offers: 0, sort: 0, demand: 0, secure: 0, tie: 700, lmp: 0, settle: 0, offerN: 0, offerS: 0, sched: 0, pays: 0, paid: 0 };
  const user = {};
  const timeline = stepTimeline([2.8, 2.4, 2.6, 2.6, 2.8, 2.8], (tl, at2, k) => {
    const q = (d) => `${at2}+=${d}`;
    if (k === 1) {
      tl.to(S, { offerN: 1, offerS: 1, duration: 1.4, ease: 'power1.inOut' }, q(0));
      tl.to(S, { offers: 1, duration: 1.8 }, q(0.6));
    }
    if (k === 2) tl.to(S, { sort: 1, duration: 1.8, ease: 'power2.inOut' }, q(0.2));
    if (k === 3) tl.to(S, { demand: 1, duration: 1.8, ease: 'power2.out' }, q(0.2));
    if (k === 4) tl.to(S, { secure: 1, duration: 0.6 }, q(0)).to(S, { sched: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.4));
    if (k === 5) tl.to(S, { lmp: 1, duration: 0.4 }, q(0)).to(S, { tie: 300, duration: 2.0, ease: 'power1.inOut' }, q(0.4));
    if (k === 6) {
      tl.to(S, { settle: 1, duration: 0.4 }, q(0));
      tl.to(S, { pays: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { paid: 1, duration: 1.4, ease: 'power1.inOut' }, q(1.2));
    }
  });

  const presets = {
    overview: { pos: [0, 22, 39], target: [0, 5.4, 0] },
    stack: { pos: [-0.5, 10.5, 30], target: [-0.5, 4.6, -4.5] },
    map: { pos: [0, 14, 27], target: [0, 1.5, 6] },
  };

  let shownTie = null;
  let hudKey = '';
  // k = current step: 2-3 frame the stack, 5 frames the map.
  const view = { k: 0 };
  function update(dt) {
    for (const tb of turbines) tb.rotor.rotation.x += dt * 1.1;
    const limit = 'tie' in user ? user.tie : S.tie;
    const res = clearMarket(limit);

    // Stack: blocks rise as offers arrive, then slide into merit order
    stack.blocks.forEach((b, i) => {
      const grow = clamp01(S.offers * 7 - scrambled.indexOf(b.key));
      b.mesh.scale.y = Math.max(0.001, grow);
      b.mesh.position.x = lerp(startX[b.key], (b.x0 + b.x1) / 2, S.sort);
      const used = b.x0 < stack.xAt(DEMAND) - 1e-6;
      b.material.opacity = S.demand > 0.5 && !used ? 0.35 : 1;
      const o = blockLabels[i];
      o.position.copy(STACK).add(V(b.mesh.position.x, b.height * grow + 0.15, 1.3));
      L.setLabelOpacity(o, grow * (view.k === 5 ? 0 : 1));
    });

    // Demand plane slides in from the right; the marker sits where it meets the stack
    const dx = lerp(STACK.x + stack.width + 6, demandX, S.demand);
    demandPlane.position.set(dx, 4.5, STACK.z);
    demandEdge.position.set(dx, 4.5, STACK.z + 2);
    planeMat.opacity = 0.22 * S.demand;
    demandEdge.visible = S.demand > 0.01;
    L.setLabelOpacity(demandLabel, S.demand);
    demandLabel.position.set(dx, 9.3, STACK.z);
    const py = STACK.y + res.price * PRICE_SCALE;
    marker.position.set(demandX, py, STACK.z + 1.25);
    marker.visible = S.demand > 0.95;
    priceLine.scale.x = Math.max(0.001, demandX - STACK.x);
    priceLine.position.set((STACK.x + demandX) / 2, py, STACK.z + 1.25);
    priceLine.visible = marker.visible;
    const pt = fill(T.price, { p: res.price });
    if (priceEl.textContent !== pt) priceEl.textContent = pt;
    priceLabel.position.set(STACK.x - 0.4, py, STACK.z + 1.25);
    L.setLabelOpacity(priceLabel, marker.visible ? 1 : 0);
    // Once demand arrives the block tags tell the story; the stack title steps back.
    L.setLabelOpacity(stackLabel, (0.4 + 0.6 * S.offers) * (1 - S.demand));
    // Close-ups: hide the labels of the half of the scene that is out of focus.
    for (const l of Object.values(labels)) L.setLabelOpacity(l, view.k === 2 || view.k === 3 ? 0 : 1);

    // Tie line: flow up to its limit, amber when congested
    const congested = res.congested;
    const col = congested ? C.warning : C.flow;
    tieMat.color.copy(col);
    tieMat.emissive.copy(col);
    tieMat.emissiveIntensity = 0.5 + 0.4 * S.secure;
    tieFlow.color.copy(col);
    tieFlow.intensity = 0.3 + 0.7 * clamp01(res.flow / 400);
    tieFlow.velocity = 1.5 + res.flow / 120;
    tieFlow.update(dt);
    const tt = fill(T.tieValue, { f: Math.round(res.flow), lim: Math.round(limit) });
    if (tieTag.el.textContent !== tt) tieTag.el.textContent = tt;
    tieTag.el.classList.toggle('is-command', congested);
    L.setLabelOpacity(tieTag.o, Math.max(S.secure, S.lmp));
    for (const z of ['north', 'south']) {
      const zt = fill(T.zonePrice, { zone: T[z], p: res[z] });
      if (zonePrices[z].el.textContent !== zt) zonePrices[z].el.textContent = zt;
      zonePrices[z].el.classList.toggle('is-command', congested);
      L.setLabelOpacity(zonePrices[z].o, S.lmp);
      zones[z].material.emissiveIntensity = 0.15 + 0.35 * S.lmp * (congested ? 1 : 0.4);
    }

    for (const [k, tr] of Object.entries(trails)) tr.setProgress(S[k]);
    panel.material.opacity = 0.14 + 0.25 * Math.max(S.offers, S.settle);

    // Slider follows the demo unless the viewer has taken over
    const tieShown = Math.round(S.tie / 10) * 10;
    if (!('tie' in user) && shownTie !== tieShown) { shownTie = tieShown; ctx.setControl('tie', tieShown); }

    // Readouts
    let items = null;
    if (S.lmp > 0.5 || 'tie' in user) {
      items = congested
        ? [{ label: T.hudNorth, value: fill(T.money, { p: res.north }), mood: 'ok' }, { label: T.hudSouth, value: fill(T.money, { p: res.south }), mood: 'alert' }]
        : [{ label: T.hudPrice, value: fill(T.money, { p: res.price }), mood: 'ok' }];
      items.push({ label: T.hudTie, value: tt, mood: congested ? 'warn' : '' });
    } else if (S.demand > 0.95) {
      items = [{ label: T.hudPrice, value: fill(T.money, { p: res.price }), mood: 'ok' }];
    }
    const key = JSON.stringify(items);
    if (key !== hudKey) { hudKey = key; ctx.setHud(items ? { items } : null); }
  }

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['overview', 'stack', 'stack', 'overview', 'map', 'overview']),
    startPreset: 'overview',
    onStep: (k) => { view.k = k; delete user.tie; shownTie = null; },
    onEnter: () => { hudKey = ''; shownTie = null; },
    controlsLimits: { minDistance: 8, maxDistance: 80 },
    interactions: [
      {
        id: 'tie', type: 'slider', label: ctl.tie, min: 0, max: 700, step: 10, value: 700,
        format: (v) => fill(ctl.tieUnit, { v }),
        onChange: (v) => { user.tie = v; },
      },
    ],
  });
}
