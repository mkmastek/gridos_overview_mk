// Slide 8 — GNM (Geo Network Management): assets drop onto the map, a connectivity trace
// runs out from the substation, a quality rule finds a cable connected to nothing, the
// segment is snapped, and the finished model lifts off and is published to ADMS.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const POLE_X = [-11, -6.5, -2, 2.5, 7, 11.5];
const BRANCH = V(7, 0, 4.8);
const BROKEN = 3; // segment from pole 2 to pole 3 is drawn but not snapped
const GNM_PANEL = V(-9.5, 9.4, -7);
const ADMS_PANEL = V(9.5, 9.4, -7);

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 48, depth: 32 }, shadowExtent: 26, fogNear: 60, fogFar: 140 });
  const S = { drop: 0, cables: 0, attr: 0, trace: 0, gap: 0, fix: 0, done: 0, twin: 0, pub: 0, gnmGlow: 0.3 };
  const flows = [];

  // ── The map: streets and the substation ─────────────────────
  scene.add(A.createRoad(V(-20, 0, 2), V(20, 0, 2), 1.6));
  scene.add(A.createRoad(V(9.5, 0, 2), V(9.5, 0, 12), 1.4));
  const sub = A.createSubstation({ w: 5, d: 4.4, scale: 0.85 });
  sub.position.set(-16, 0, 0);
  scene.add(sub);
  const exit = sub.position.clone().add(sub.userData.exitE);

  // ── New assets that drop in: poles, branch pole + transformer, houses ──
  const drops = [];
  const poles = POLE_X.map((x) => {
    const p = A.createPole({ height: 4.4 });
    p.position.set(x, 0, 0);
    scene.add(p);
    drops.push(p);
    return p;
  });
  const branchPole = A.createPole({ height: 4.4 });
  branchPole.position.copy(BRANCH);
  scene.add(branchPole);
  drops.push(branchPole);
  const xfmr = A.createDistTransformer();
  const xfmrHolder = new THREE.Group();
  xfmrHolder.position.copy(BRANCH).add(V(0, 3.3, 0));
  xfmrHolder.add(xfmr);
  scene.add(xfmrHolder);
  drops.push(xfmrHolder);
  const estate = A.createHouses([0, 1, 2, 3, 4, 5].map((i) => ({ x: 11.5 + (i % 3) * 2.2, z: 5.8 + Math.floor(i / 3) * 2.6, rot: -Math.PI / 2, solar: i % 2 === 0 })));
  const estateHolder = new THREE.Group();
  estateHolder.add(estate.group);
  scene.add(estateHolder);
  drops.push(estateHolder);
  const baseY = drops.map((d) => d.position.y);

  // ── Cable segments, in trace order ──────────────────────────
  const top = (p) => p.position.clone().add(p.userData.top);
  const ends = [
    [exit, top(poles[0])],
    [top(poles[0]), top(poles[1])],
    [top(poles[1]), top(poles[2])],
    [top(poles[2]), top(poles[3])],
    [top(poles[3]), top(poles[4])],
    [top(poles[4]), top(poles[5])],
    [top(poles[4]), top(branchPole)],
  ];
  const segs = ends.map(([a, b], i) => {
    const pts = A.catenary(a, b, 0.32, 14);
    const mat = M.stdMat('#8C98AC', { emissive: '#000000', transparent: true, opacity: 0 });
    const m = A.createConductor(pts, mat, 0.06);
    scene.add(m);
    return { pts, mat, m, i };
  });
  // The un-snapped version of the broken segment: stops short of pole 3 and droops
  const [ba, bb] = ends[BROKEN];
  const brokenEnd = bb.clone().add(V(-1.5, -1.1, 0.4));
  const brokenMat = M.stdMat('#8C98AC', { emissive: M.PALETTE.fault, emissiveIntensity: 0, transparent: true, opacity: 0 });
  scene.add(A.createConductor(A.catenary(ba, brokenEnd, 0.4, 14), brokenMat, 0.06));

  // Gap marker
  const ringMat = M.glowMat(M.PALETTE.fault, { blending: THREE.NormalBlending, opacity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 32), ringMat);
  ring.position.copy(brokenEnd.clone().lerp(bb, 0.5));
  scene.add(ring);
  const lGap = L.label(lab.gap);
  lGap.position.copy(ring.position).add(V(0, 1.2, 0));
  scene.add(lGap);

  // Trace head: a glowing dot travelling along the connected segments
  const headMat = M.glowMat(M.PALETTE.data, { map: M.glowTexture(), opacity: 0 });
  const head = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), headMat);
  scene.add(head);

  // ── GNM and ADMS panels, and the model that lifts off ──────
  const gnmPanel = A.createGlassPanel({ width: 6, height: 3.4, color: M.BRAND.violet });
  gnmPanel.group.position.copy(GNM_PANEL);
  const admsPanel = A.createGlassPanel({ width: 6, height: 3.4, color: M.BRAND.lightBlue });
  admsPanel.group.position.copy(ADMS_PANEL);
  scene.add(gnmPanel.group, admsPanel.group);
  const lGnm = L.label(lab.gnm, { variant: 'accent' });
  lGnm.position.copy(GNM_PANEL).add(V(0, 2.1, 0));
  const lAdms = L.label(lab.adms);
  lAdms.position.copy(ADMS_PANEL).add(V(0, 2.1, 0));
  const lSub = L.label(lab.substation, { anchor: 'left' });
  lSub.position.set(-15.2, 3.2, 1.4);
  const lXfmr = L.label(lab.transformer);
  lXfmr.position.copy(BRANCH).add(V(0, 4.9, 0));
  scene.add(lGnm, lAdms, lSub, lXfmr);

  const twinPos = [];
  for (const s of segs) for (let k = 0; k < s.pts.length - 1; k += 1) twinPos.push(...s.pts[k].toArray(), ...s.pts[k + 1].toArray());
  const twinGeo = new THREE.BufferGeometry();
  twinGeo.setAttribute('position', new THREE.Float32BufferAttribute(twinPos, 3));
  const twinMat = new THREE.LineBasicMaterial({ color: '#C9A8FF', transparent: true, opacity: 0, toneMapped: false });
  const twin = new THREE.LineSegments(twinGeo, twinMat);
  scene.add(twin);
  const lModel = L.label(lab.model);
  scene.add(lModel);

  const pub = new F.PacketTrail({
    path: new THREE.QuadraticBezierCurve3(GNM_PANEL.clone().add(V(3, 0, 0.2)), V(0, 13, -6), ADMS_PANEL.clone().add(V(-3, 0, 0.2))),
    color: M.PALETTE.data,
    label: { text: content.packets.publish, kind: 'data' },
  });
  scene.add(pub.object3D);
  flows.push(pub);

  // ── Timeline ────────────────────────────────────────────────
  const timeline = stepTimeline([2.8, 2.8, 2.2, 3.2, 3.4], (tl, at, k) => {
    const q = (dt) => `${at}+=${dt}`;
    if (k === 1) {
      tl.to(S, { drop: 1, duration: 1.6, ease: 'power2.out' }, q(0));
      tl.to(S, { cables: 1, duration: 0.6 }, q(1.5));
      tl.to(S, { attr: 1, gnmGlow: 0.8, duration: 0.5 }, q(2.1));
    }
    if (k === 2) {
      tl.to(S, { attr: 0, duration: 0.3 }, q(0));
      tl.to(S, { trace: BROKEN, duration: 2.0, ease: 'none' }, q(0.3));
    }
    if (k === 3) tl.to(S, { gap: 1, duration: 0.5 }, q(0.2));
    if (k === 4) {
      tl.to(S, { fix: 1, duration: 0.6, ease: 'back.out(1.6)' }, q(0.1));
      tl.to(S, { gap: 0, duration: 0.4 }, q(0.4));
      tl.to(S, { trace: segs.length, duration: 1.6, ease: 'none' }, q(0.7));
      tl.to(S, { done: 1, duration: 0.4 }, q(2.4));
    }
    if (k === 5) {
      tl.to(S, { twin: 1, duration: 2.2, ease: 'power2.inOut' }, q(0.1));
      tl.to(S, { pub: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.8));
    }
  });

  const presets = {
    overview: { pos: [0, 17, 29], target: [0, 3, -1] },
    trace: { pos: [-5, 12.5, 23], target: [-4.5, 2.2, 0] },
    gap: { pos: [0.5, 7.5, 13], target: [0.4, 3.2, 0] },
    publish: { pos: [0, 17, 31], target: [0, 6.4, -3] },
  };

  const grey = new THREE.Color('#8C98AC');
  const tmp = new THREE.Color();
  const update = (dt, t) => {
    // drop-in with a small stagger per asset
    drops.forEach((d, j) => {
      const p = clamp01(S.drop * 1.5 - j * 0.07);
      d.position.y = baseY[j] + (1 - p) * 7;
      d.visible = p > 0.01;
    });
    // segments: grey → traced (blue) → complete (green)
    segs.forEach((s) => {
      const lit = clamp01(S.trace - s.i);
      const isBroken = s.i === BROKEN;
      s.mat.opacity = isBroken ? S.cables * S.fix : S.cables;
      s.mat.transparent = s.mat.opacity < 0.99;
      s.m.visible = s.mat.opacity > 0.01;
      tmp.copy(grey).lerp(C.data, lit).lerp(C.restored, S.done);
      s.mat.color.copy(tmp);
      s.mat.emissive.copy(tmp);
      s.mat.emissiveIntensity = 0.5 * Math.max(lit, S.done);
    });
    brokenMat.opacity = S.cables * (1 - S.fix);
    brokenMat.emissiveIntensity = 0.9 * S.gap * (0.6 + 0.4 * Math.sin(t * 7));
    ringMat.opacity = S.gap;
    ring.visible = S.gap > 0.01;
    ring.lookAt(camera.position);
    L.setLabelOpacity(lGap, S.gap);

    // trace head position
    const tr = Math.min(S.trace, segs.length - 0.001);
    const tracing = S.trace > 0.01 && S.done < 0.5 && Math.abs(S.trace - Math.round(S.trace)) > 0.005;
    head.visible = tracing || (S.trace > 0.01 && S.gap > 0.1);
    if (head.visible) {
      const s = segs[Math.floor(tr)];
      const f = tr - Math.floor(tr);
      const idx = f * (s.pts.length - 1);
      const a = s.pts[Math.floor(idx)];
      const b = s.pts[Math.min(s.pts.length - 1, Math.floor(idx) + 1)];
      head.position.copy(a).lerp(b, idx - Math.floor(idx));
      if (S.gap > 0.1 && !tracing) head.position.copy(ba);
      head.quaternion.copy(camera.quaternion);
      headMat.opacity = 0.9;
    }

    // panels and the published model
    gnmPanel.material.emissiveIntensity = 0.3 + 0.6 * S.gnmGlow;
    admsPanel.material.emissiveIntensity = 0.25 + 0.8 * S.twin;
    lAdms.element.classList.toggle('label3d--accent', S.twin > 0.9);
    L.setLabelOpacity(lXfmr, S.attr);
    const tw = clamp01(S.twin);
    twinMat.opacity = tw < 0.02 ? 0 : 0.95;
    twin.visible = tw > 0.02;
    const sc = lerp(1, 0.2, tw);
    twin.scale.setScalar(sc);
    twin.position.set(lerp(0, ADMS_PANEL.x, tw), lerp(0.4, ADMS_PANEL.y - 0.6, tw), lerp(0, ADMS_PANEL.z + 0.3, tw));
    twin.rotation.x = (Math.PI / 2) * 0.85 * tw;
    lModel.position.copy(twin.position).add(V(0, -1.4 * tw - 0.2, 0.6));
    L.setLabelOpacity(lModel, tw > 0.85 ? (tw - 0.85) / 0.15 : 0);
    pub.setProgress(S.pub);
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['overview', 'trace', 'gap', 'overview', 'publish']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 6, maxDistance: 80 },
  });
}
