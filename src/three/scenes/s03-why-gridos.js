// Slide 3 — management vs orchestration. BEFORE: five grey system boxes, each with its own
// slightly different network map, tangled in point-to-point cables. AFTER: the cables
// dissolve, the boxes become glass panels on one shared model, and a field change reaches
// every application at once.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const KEYS = ['scada', 'gis', 'oms', 'dms', 'ems'];
const OMS = 2;
const BEFORE = [V(-12, 5, -2), V(-6, 8.6, -4.5), V(0, 5.2, -1), V(6, 8.8, -4.5), V(12, 5.4, -2)];
// 6.6 apart (wider than a wrapped label) so the five labels never touch on the shared slab.
const AFTER = KEYS.map((_, i) => V(-13.2 + i * 6.6, 8.7, -2.5));
const SLAB_Y = 6.4;

// A tiny feeder map drawn on top of each box: main line, two branches, a switch marker.
const MAP_SEGS = [
  [-1.2, -0.4, 1.2, -0.4], [-0.6, -0.4, -0.6, 0.45], [0.5, -0.4, 0.5, 0.45], [0.5, 0.45, 1.1, 0.45],
];

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 52, depth: 34 }, shadowExtent: 26, fogNear: 60, fogFar: 140 });
  const S = { tangle: 1, glow: 0, sw: 1, pk1: 0, oms: 0, mismatch: 0, morph: 0, slab: 0, mini: 1, merged: 0, pk2: 0, sync: 0, green: 0 };
  const flows = [];

  // ── The five systems ────────────────────────────────────────
  const grey = new THREE.Color('#5B6890');
  const glass = new THREE.Color(M.BRAND.lightBlue);
  const boxes = KEYS.map((key, i) => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: grey.clone(), roughness: 0.6, metalness: 0.1, transparent: true, opacity: 1, emissive: M.BRAND.lightBlue, emissiveIntensity: 0 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 2.4), mat);
    body.castShadow = true;
    const edgeMat = new THREE.LineBasicMaterial({ color: '#C9D3EE', transparent: true, opacity: 0.8, toneMapped: false });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), edgeMat);
    group.add(body, edges);

    // own copy of the map — box 1 is missing a branch, so the copies disagree
    const pos = [];
    MAP_SEGS.forEach((s, k) => { if (!(i === 1 && k === 3)) pos.push(s[0], 0.82, s[1], s[2], 0.82, s[3]); });
    const mapGeo = new THREE.BufferGeometry();
    mapGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mapMat = new THREE.LineBasicMaterial({ color: '#D9E4FF', transparent: true, opacity: 1, toneMapped: false });
    group.add(new THREE.LineSegments(mapGeo, mapMat));
    const swMat = new THREE.MeshBasicMaterial({ color: '#9AA8C7', transparent: true, toneMapped: false });
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), swMat);
    sw.position.set(0.0, 0.85, -0.4);
    group.add(sw);

    const label = L.label(lab[key]);
    label.element.style.whiteSpace = 'normal';
    label.element.style.maxWidth = '120px';
    label.position.set(0, 1.25, 0);
    group.add(label);
    group.position.copy(BEFORE[i]);
    scene.add(group);
    return { group, mat, edgeMat, mapMat, swMat, label };
  });

  // ── Point-to-point cables (BEFORE) ──────────────────────────
  const cableMat = M.stdMat(M.PALETTE.warning, { emissive: M.PALETTE.fault, emissiveIntensity: 0.4, transparent: true, opacity: 1 });
  const pairs = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [0, 4], [1, 4], [0, 3]];
  const cables = new THREE.Group();
  scene.add(cables);
  pairs.forEach(([a, b], n) => {
    const pa = BEFORE[a].clone().add(V(0, -0.5, 0.6));
    const pb = BEFORE[b].clone().add(V(0, -0.5, 0.6));
    const mid = pa.clone().lerp(pb, 0.5).add(V(Math.sin(n * 2.1) * 1.4, -1.5 - (n % 3) * 0.8, 1.2 + (n % 2) * 1.5));
    const curve = new THREE.CatmullRomCurve3([pa, mid, pb]);
    cables.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 6, false), cableMat));
  });

  // ── Shared model slab (AFTER) ───────────────────────────────
  const slab = A.createGlassSlab({ width: 30, depth: 9, thickness: 0.4, color: M.BRAND.green, opacity: 0.14 });
  slab.group.position.set(0, SLAB_Y, -2.5);
  scene.add(slab.group);
  const mergedPos = [];
  for (let x = -13; x <= 13; x += 2.6) mergedPos.push(x, 0, -1.2, x + 2.6, 0, -1.2);
  for (const x of [-11, -6, -1, 4, 9]) mergedPos.push(x, 0, -1.2, x, 0, 1.6, x, 0, 1.6, x + 1.6, 0, 1.6);
  const mergedGeo = new THREE.BufferGeometry();
  mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(mergedPos, 3));
  const mergedMat = new THREE.LineBasicMaterial({ color: M.BRAND.violet, transparent: true, opacity: 0, toneMapped: false });
  const merged = new THREE.LineSegments(mergedGeo, mergedMat);
  merged.position.set(0, SLAB_Y + 0.22, -2.5);
  scene.add(merged);
  const lShared = L.label(lab.shared, { variant: 'accent' });
  lShared.position.set(-10, SLAB_Y - 0.4, 2.2);
  lShared.center.set(0.5, 0);
  scene.add(lShared);

  // ── A switch in the field ───────────────────────────────────
  for (const x of [-7, 7]) {
    const p = A.createPole({ height: 4.4 });
    p.position.set(x, 0, 7.5);
    scene.add(p);
  }
  const fieldPole = A.createPole({ height: 4.2, crossarm: false });
  fieldPole.position.set(0, 0, 7.5);
  scene.add(fieldPole);
  const sw = A.createSwitchDevice({ kind: 'switch', span: 0.9 });
  sw.group.position.set(0, 4.12, 7.5);
  scene.add(sw.group);
  const wireMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.4 });
  scene.add(A.createConductor(A.catenary(V(-7, 4.3, 7.5), V(-0.45, 4.5, 7.5), 0.25, 10), wireMat, 0.04));
  scene.add(A.createConductor(A.catenary(V(0.45, 4.5, 7.5), V(7, 4.3, 7.5), 0.25, 10), wireMat, 0.04));
  const lField = L.label(lab.field);
  lField.position.set(3.4, 5.3, 7.5);
  scene.add(lField);

  // ── Packets ─────────────────────────────────────────────────
  const swTop = V(0, 5.1, 7.5);
  const arc = (a, b, lift = 3) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const pk1 = new F.PacketTrail({ path: arc(swTop, BEFORE[OMS].clone().add(V(0, -0.8, 1.2))), color: M.PALETTE.data, label: { text: content.packets.change, kind: 'data' } });
  const pk2 = new F.PacketTrail({ path: arc(swTop, V(0, SLAB_Y + 0.2, 0.5), 2), color: M.PALETTE.data, label: { text: content.packets.change2, kind: 'data' } });
  const syncTrails = AFTER.map((p, i) => new F.PacketTrail({
    path: [V(p.x * 0.4, SLAB_Y + 0.3, -1.2), V(p.x, p.y - 0.85, p.z)],
    color: M.PALETTE.restored,
    count: 3,
    label: i === 4 ? { text: content.packets.sync, kind: 'data' } : null,
  }));
  for (const t of [pk1, pk2, ...syncTrails]) { scene.add(t.object3D); flows.push(t); }

  // ── Timeline ────────────────────────────────────────────────
  const timeline = stepTimeline([1.8, 3.2, 3.0, 3.4], (tl, at, k) => {
    const q = (dt) => `${at}+=${dt}`;
    if (k === 1) tl.to(S, { glow: 1, duration: 0.5 }, q(0.1)).to(S, { glow: 0, duration: 0.6 }, q(0.9));
    if (k === 2) {
      tl.to(S, { sw: 0, duration: 0.4 }, q(0.1));
      tl.to(S, { pk1: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.5));
      tl.to(S, { oms: 1, duration: 0.3 }, q(1.9));
      tl.to(S, { mismatch: 1, duration: 0.4 }, q(2.2));
    }
    if (k === 3) {
      tl.to(S, { tangle: 0, mismatch: 0, duration: 0.6 }, q(0));
      tl.to(S, { morph: 1, duration: 1.6, ease: 'power2.inOut' }, q(0.4));
      tl.to(S, { slab: 1, duration: 0.8 }, q(0.4));
      tl.to(S, { mini: 0, duration: 0.6 }, q(1.2));
      tl.to(S, { merged: 1, duration: 0.8 }, q(1.6));
    }
    if (k === 4) {
      tl.to(S, { sw: 1, duration: 0.4 }, q(0.1));
      tl.to(S, { pk2: 1, duration: 1.2, ease: 'power1.inOut' }, q(0.5));
      tl.to(S, { sync: 1, duration: 1.0, ease: 'power1.inOut' }, q(1.7));
      tl.to(S, { green: 1, duration: 0.4 }, q(2.6));
    }
  });

  const presets = {
    overview: { pos: [0, 13, 31], target: [0, 5.6, 0] },
    after: { pos: [0, 14.5, 29], target: [0, 6.8, -1] },
  };

  const tmp = new THREE.Color();
  const update = (dt, t) => {
    const m = clamp01(S.morph);
    boxes.forEach((b, i) => {
      b.group.position.lerpVectors(BEFORE[i], AFTER[i], m);
      b.mat.color.copy(grey).lerp(glass, m);
      b.mat.opacity = 1 - 0.62 * m;
      b.mat.depthWrite = m < 0.5;
      b.mat.emissiveIntensity = 0.12 * m + 0.25 * S.glow;
      // edges: red when its copy is now wrong, green when updated
      tmp.set('#C9D3EE');
      if (i === OMS) tmp.lerp(C.restored, S.oms * (1 - m));
      else tmp.lerp(C.fault, S.mismatch * (0.6 + 0.4 * Math.sin(t * 8)));
      tmp.lerp(C.restored, S.green);
      b.edgeMat.color.copy(tmp);
      b.mapMat.opacity = S.mini;
      b.swMat.opacity = S.mini;
      b.swMat.color.copy(C.off).lerp(C.restored, i === OMS ? S.oms : 0);
      b.label.element.classList.toggle('label3d--accent', S.green > 0.5);
    });
    cableMat.opacity = S.tangle;
    cableMat.emissiveIntensity = 0.3 + 0.7 * S.glow;
    cables.visible = S.tangle > 0.02;
    slab.group.visible = S.slab > 0.01;
    slab.setGlow(0.2 + 0.8 * S.slab);
    slab.material.opacity *= S.slab;
    slab.edgeMaterial.opacity *= S.slab;
    mergedMat.opacity = S.merged;
    L.setLabelOpacity(lShared, S.slab);
    sw.setOpen(S.sw);
    sw.setColor(S.sw < 0.5 ? C.flow : C.off, 0.6);
    pk1.setProgress(S.pk1);
    pk2.setProgress(S.pk2);
    syncTrails.forEach((tr) => tr.setProgress(S.sync));
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['overview', 'overview', 'after', 'after']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 8, maxDistance: 80 },
  });
}
