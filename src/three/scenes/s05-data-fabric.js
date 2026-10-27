// Slide 5 — GridOS Data Fabric and Connect: federation vs copying.
// A ring of eight source systems. The old way copies everything into a central data lake
// (it overflows and goes stale). The fabric way: Connect plugs in, metadata goes to a
// catalog, and a question reaches only the systems that hold the answer.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createSystemBuilding, createTank, createFabricMesh, createCatalogDisc } from '../kit/Buildings.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SOURCES = [
  { key: 'scada', icon: 'antenna' },
  { key: 'ami', icon: 'meter' },
  { key: 'cis', icon: 'person' },
  { key: 'gis', icon: 'map' },
  { key: 'erp', icon: 'gears' },
  { key: 'weather', icon: 'cloud' },
  { key: 'wildfire', icon: 'flame' },
  { key: 'der', icon: 'solar' },
];
const RING = 13.4;
const CAT_Y = 6.4;
const APP = V(-4.2, 11.2, -2.5);
const TABLE = V(4.2, 11.2, -2.5);

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const { scene, camera } = A.createBaseScene({ ground: { width: 58, depth: 42 }, shadowExtent: 30, fogNear: 70, fogFar: 150 });
  const S = {
    bglow: 0, copy: 0, level: 0, stale: 0, xmark: 0, lake: 1, plugs: 0,
    fabric: 0, catalog: 0, meta: 0, context: 0, app: 0, ask: 0, answer: 0, rows: 0,
  };
  const view = { query: content.queries[0].value, userAsk: false, askStart: 0 };
  const flows = [];

  // ── Ring of source systems ──────────────────────────────────
  const buildings = SOURCES.map((s, i) => {
    const a = (i / SOURCES.length) * Math.PI * 2 + Math.PI / 8;
    const pos = V(Math.cos(a) * RING, 0, Math.sin(a) * RING * 0.9);
    const b = createSystemBuilding({ icon: s.icon, color: i % 2 ? M.BRAND.turquoise : M.BRAND.lightBlue });
    b.group.position.copy(pos);
    b.group.rotation.y = -a - Math.PI / 2;
    scene.add(b.group);
    // 150 px wrap keeps the full forms to two lines, so neighbours around the ring don't collide.
    const label = L.label(lab[s.key]);
    label.element.style.whiteSpace = 'normal';
    label.element.style.maxWidth = '150px';
    // The two far-back buildings (weather, wildfire) get higher labels than their neighbours.
    // Weather's label also shifts right, clear of its ERP/EAM neighbour.
    label.position.copy(pos).add(V(s.key === 'weather' ? 1.2 : 0, pos.z < -8 ? 4.4 : 3.0, 0));
    scene.add(label);
    // GridOS Connect plug on the side facing the centre
    const inward = pos.clone().multiplyScalar(-1).normalize();
    const plugMat = M.stdMat('#9AA8C7', { emissive: M.BRAND.green, emissiveIntensity: 0 });
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), plugMat);
    plug.position.copy(pos).addScaledVector(inward, 1.7).setY(0.7);
    scene.add(plug);
    const top = pos.clone().setY(2.2);
    return { ...s, pos, top, b, label, plug, plugMat, inward };
  });

  // ── The old way: a central data lake ───────────────────────
  const tank = createTank({ r: 2.3, h: 3.2 });
  scene.add(tank.group);
  const xMat = M.glowMat(M.PALETTE.fault, { blending: THREE.NormalBlending, opacity: 0 });
  const xMark = new THREE.Group();
  for (const r of [Math.PI / 4, -Math.PI / 4]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(6, 0.35, 0.2), xMat);
    bar.rotation.z = r;
    xMark.add(bar);
  }
  xMark.position.set(0, 2.2, 2.6);
  scene.add(xMark);
  const lLake = L.label(lab.lake);
  lLake.position.set(0, 3.6, 0);
  scene.add(lLake);

  // Full copies travelling to the lake (one labelled)
  const copyTrails = buildings.map((bd, i) => {
    const t = new F.PacketTrail({
      path: new THREE.QuadraticBezierCurve3(bd.top, bd.top.clone().lerp(V(0, 5, 0), 0.5).setY(5), V(0, 3.4, 0)),
      color: '#9AA8C7', size: 0.55, count: 3, spacing: 0.1,
      label: i === 1 ? { text: content.packets.copy, kind: 'data' } : null,
    });
    scene.add(t.object3D);
    flows.push(t);
    return t;
  });

  // ── The fabric way ──────────────────────────────────────────
  const fabric = createFabricMesh({ w: 30, d: 24, seg: 22, color: M.BRAND.green });
  fabric.lines.position.y = 5;
  scene.add(fabric.lines);
  const catalog = createCatalogDisc({ r: 1.7, color: M.BRAND.green });
  catalog.group.position.set(0, CAT_Y - 0.3, 0);
  scene.add(catalog.group);
  const lFabric = L.label(lab.fabric);
  lFabric.position.set(0, 5.2, 11.8);
  scene.add(lFabric);
  const lCatalog = L.label(lab.catalog);
  lCatalog.position.set(0, CAT_Y - 0.7, 2.0);
  lCatalog.center.set(0.5, -0.1);
  scene.add(lCatalog);

  // Context: the catalog places data on the network model (purple map above the disc)
  const ctxPos = [];
  const nodes = [[-2, -1], [-0.5, 0.6], [1.2, -0.4], [2.2, 1.0], [-1.6, 1.3], [0.4, -1.4]];
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [1, 4], [2, 5], [0, 5]]) ctxPos.push(nodes[a][0], 0, nodes[a][1], nodes[b][0], 0, nodes[b][1]);
  const ctxGeo = new THREE.BufferGeometry();
  ctxGeo.setAttribute('position', new THREE.Float32BufferAttribute(ctxPos, 3));
  const ctxMat = new THREE.LineBasicMaterial({ color: M.BRAND.violet, transparent: true, opacity: 0, toneMapped: false });
  const ctxMap = new THREE.LineSegments(ctxGeo, ctxMat);
  ctxMap.position.set(0, CAT_Y + 0.75, 0);
  scene.add(ctxMap);

  // Metadata travels to the catalog (one labelled)
  const metaTrails = buildings.map((bd, i) => {
    const t = new F.PacketTrail({
      path: new THREE.QuadraticBezierCurve3(bd.top, bd.top.clone().lerp(V(0, CAT_Y, 0), 0.5).setY(CAT_Y + 1.5), V(0, CAT_Y + 0.2, 0)),
      color: M.PALETTE.data, size: 0.2, count: 3,
      label: i === 3 ? { text: content.packets.meta, kind: 'data' } : null,
    });
    scene.add(t.object3D);
    flows.push(t);
    return t;
  });

  // Application asks; answers assemble into one virtual table
  const appPanel = A.createGlassPanel({ width: 4.6, height: 2.6, color: M.PALETTE.ai });
  appPanel.group.position.copy(APP);
  const tablePanel = A.createGlassPanel({ width: 4.6, height: 2.6, color: M.PALETTE.data });
  tablePanel.group.position.copy(TABLE);
  scene.add(appPanel.group, tablePanel.group);
  const rowMat = M.glowMat(M.PALETTE.data, { blending: THREE.NormalBlending, opacity: 0.85 });
  const rows = [0, 1, 2].map((r) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.42, 0.06), rowMat);
    m.position.copy(TABLE).add(V(0, 0.7 - r * 0.65, 0.05));
    scene.add(m);
    return m;
  });
  const lApp = L.label(lab.app);
  lApp.position.copy(APP).add(V(0, 1.5, 0));
  const lTable = L.label(lab.table);
  lTable.position.copy(TABLE).add(V(0, 1.5, 0));
  scene.add(lApp, lTable);

  const askTrails = buildings.map((bd, i) => {
    const t = new F.PacketTrail({
      path: new THREE.QuadraticBezierCurve3(APP.clone().add(V(0, -1.3, 0)), V(bd.pos.x * 0.45, 9, bd.pos.z * 0.45), bd.top),
      color: M.PALETTE.ai, size: 0.18, count: 4,
      label: { text: content.packets.ask, kind: 'decision' },
    });
    scene.add(t.object3D);
    flows.push(t);
    return t;
  });
  const answerTrails = buildings.map((bd) => {
    const t = new F.PacketTrail({
      path: new THREE.QuadraticBezierCurve3(bd.top, V(bd.pos.x * 0.45, 9.5, bd.pos.z * 0.45), TABLE.clone().add(V(0, -1.3, 0))),
      color: M.PALETTE.data, size: 0.22, count: 4,
    });
    scene.add(t.object3D);
    flows.push(t);
    return t;
  });
  // Only the first active source carries the "Query" label, so labels do not pile up.
  const activeSources = () => content.queries.find((q) => q.value === view.query).sources;

  // ── Timeline ────────────────────────────────────────────────
  const timeline = stepTimeline([1.8, 3.4, 2.6, 2.8, 2.2, 3.8], (tl, at, k) => {
    const q = (dt) => `${at}+=${dt}`;
    if (k === 1) tl.to(S, { bglow: 1, duration: 0.6 }, q(0.1)).to(S, { bglow: 0.25, duration: 0.6 }, q(0.9));
    if (k === 2) {
      tl.to(S, { copy: 1, duration: 1.6, ease: 'power1.inOut' }, q(0));
      tl.to(S, { level: 1.15, duration: 1.6 }, q(0.3));
      tl.to(S, { stale: 1, duration: 0.5 }, q(1.9));
      tl.to(S, { xmark: 1, duration: 0.4 }, q(2.5));
    }
    if (k === 3) {
      tl.to(S, { lake: 0, xmark: 0, level: 0, duration: 0.6 }, q(0));
      tl.to(S, { plugs: 1, duration: 0.9 }, q(0.5));
    }
    if (k === 4) {
      tl.to(S, { fabric: 1, duration: 0.8 }, q(0));
      tl.to(S, { catalog: 1, duration: 0.6 }, q(0.3));
      tl.to(S, { meta: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.8));
    }
    if (k === 5) tl.to(S, { context: 1, duration: 0.8 }, q(0.2));
    if (k === 6) {
      tl.to(S, { app: 1, duration: 0.5 }, q(0));
      tl.to(S, { ask: 1, duration: 1.0, ease: 'power1.in' }, q(0.5));
      tl.to(S, { answer: 1, duration: 1.0, ease: 'power1.out' }, q(1.6));
      tl.to(S, { rows: 3, duration: 0.8 }, q(2.7));
    }
  });

  const presets = {
    overview: { pos: [0, 20, 36], target: [0, 4.2, 0] },
    ring: { pos: [0, 17, 32], target: [0, 3.2, 1] },
    fabric: { pos: [0, 19.5, 34], target: [0, 5.2, 0] },
    ask: { pos: [0, 19.5, 34], target: [0, 6.6, -0.5] },
  };

  // ── Interaction: ask one of three preset questions ─────────
  const ask = (value) => {
    view.query = value;
    view.userAsk = true;
    view.askStart = stage.elapsed;
    const q = content.queries.find((x) => x.value === value);
    ctx.showInfo({ title: q.label, paras: [q.answer], items: q.sources.map((s) => content.sourceNames[s]), note: content.controls.sourcesHeading });
  };

  const grey = new THREE.Color('#7C88A9');
  const lakeBlue = new THREE.Color('#3B6FD8');
  const update = (dt, t) => {
    const active = new Set(activeSources());
    // A user question replays a short ask → answer loop.
    let askP = S.ask;
    let ansP = S.answer;
    let rowsP = S.rows;
    let appP = S.app;
    if (view.userAsk) {
      const ph = ((t - view.askStart) % 3.4) / 3.4;
      askP = Math.max(askP, clamp01(ph * 2.4));
      ansP = Math.max(ansP, clamp01(ph * 2.4 - 1.2));
      rowsP = Math.max(rowsP, 3);
      appP = 1;
    }
    const fabricOn = Math.max(S.fabric, view.userAsk ? 1 : 0);
    const querying = askP > 0.01 && askP < 1 ? 1 : 0;

    buildings.forEach((bd, i) => {
      const hot = (active.has(bd.key) && (askP > 0 || view.userAsk)) ? 1 : 0;
      bd.b.setGlow(Math.max(S.bglow, hot, 0.15));
      bd.plug.scale.setScalar(Math.max(0.001, S.plugs));
      bd.plugMat.emissiveIntensity = 0.9 * S.plugs * (0.7 + 0.3 * Math.sin(t * 3 + i));
      bd.label.element.classList.toggle('label3d--accent', hot > 0 || S.bglow > 0.9);
      copyTrails[i].setProgress(S.copy);
      metaTrails[i].setProgress(S.meta);
      const on = active.has(bd.key);
      const firstActive = activeSources()[0] === bd.key;
      askTrails[i].setProgress(on ? askP : 0);
      if (askTrails[i].label) askTrails[i].label.visible = askTrails[i].label.visible && firstActive;
      answerTrails[i].setProgress(on ? ansP : 0);
    });
    // Lake overflows and goes grey (stale), then disappears
    tank.group.visible = S.lake > 0.01;
    tank.setLevel(S.level);
    tank.fillMaterial.color.copy(lakeBlue).lerp(grey, S.stale);
    tank.fillMaterial.opacity = 0.85 * S.lake;
    tank.shellMaterial.opacity = 0.25 * S.lake;
    tank.rimMaterial.opacity = 0.7 * S.lake;
    xMat.opacity = S.xmark;
    xMark.visible = S.xmark > 0.01;
    xMark.quaternion.copy(camera.quaternion);
    L.setLabelOpacity(lLake, S.lake);

    fabric.material.opacity = 0.65 * fabricOn;
    fabric.lines.visible = fabricOn > 0.01;
    fabric.lines.position.y = 5 + 0.15 * Math.sin(t * 1.2);
    const cat = Math.max(S.catalog, view.userAsk ? 1 : 0);
    catalog.group.visible = cat > 0.01;
    catalog.group.scale.setScalar(Math.max(0.001, cat));
    catalog.group.rotation.y += dt * 0.4;
    catalog.material.emissiveIntensity = 0.4 + 0.6 * (S.context + querying);
    ctxMat.opacity = Math.max(S.context, view.userAsk ? 0.8 : 0);
    ctxMap.rotation.y = catalog.group.rotation.y;
    L.setLabelOpacity(lFabric, fabricOn);
    L.setLabelOpacity(lCatalog, cat);

    appPanel.group.visible = appP > 0.01;
    tablePanel.group.visible = appP > 0.01;
    appPanel.material.opacity = 0.18 * appP;
    tablePanel.material.opacity = 0.18 * appP;
    appPanel.edgeMaterial.opacity = appP;
    tablePanel.edgeMaterial.opacity = appP;
    L.setLabelOpacity(lApp, appP);
    L.setLabelOpacity(lTable, appP);
    rows.forEach((r, i) => { r.visible = rowsP > i + 0.05; r.scale.x = clamp01(rowsP - i); });
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['ring', 'overview', 'ring', 'fabric', 'fabric', 'ask']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 8, maxDistance: 85 },
    interactions: [
      {
        id: 'ask', type: 'select', label: content.controls.askLabel, tip: content.controls.askTip,
        value: '',
        options: [{ value: '', label: content.controls.askPlaceholder }, ...content.queries.map((q) => ({ value: q.value, label: q.label }))],
        onChange: (v) => { if (v) ask(v); },
      },
    ],
    onEnter: () => { view.userAsk = false; },
  });
}
