// Slide 9 — ADMS overview: a control-room console with three floating screens — OMS (left),
// DMS (centre), DERMS (right) — above a town with three feeders from one substation.
// Each screen in turn pulls its data up from the part of the grid it watches.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SUB = V(0, 0, -11);
const SCREENS = {
  oms: { pos: V(-9.6, 9.2, -3.2), ry: 0.28 },
  dms: { pos: V(0, 9.8, -4.4), ry: 0 },
  derms: { pos: V(9.6, 9.2, -3.2), ry: -0.28 },
};

function drawScreen(kind, P) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(4, 18, 70, 0.92)';
  g.fillRect(0, 0, 512, 288);
  g.strokeStyle = 'rgba(15, 189, 255, 0.25)';
  g.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 288); g.stroke(); }
  for (let y = 0; y < 288; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  const line = (pts, color, w = 7) => {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.lineCap = 'round';
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };
  if (kind === 'dms') {
    g.fillStyle = '#C9D3EE';
    g.fillRect(236, 36, 40, 40);
    line([[256, 76], [160, 130], [80, 190], [40, 250]], P.flow);
    line([[256, 76], [352, 130], [432, 190], [472, 250]], P.flow);
    line([[256, 76], [256, 160]], P.flow);
    line([[256, 160], [256, 250]], P.warning, 9);
    for (const [x, y] of [[160, 130], [80, 190], [352, 130], [432, 190], [256, 160], [256, 210]]) {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
    }
  } else if (kind === 'oms') {
    g.fillStyle = 'rgba(230, 57, 70, 0.35)';
    g.strokeStyle = P.fault;
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(60, 170); g.lineTo(190, 140); g.lineTo(230, 230); g.lineTo(90, 255); g.closePath(); g.fill(); g.stroke();
    for (let i = 0; i < 26; i += 1) {
      const x = 40 + ((i * 97) % 430);
      const y = 40 + ((i * 53) % 220);
      const out = x < 240 && y > 140;
      g.fillStyle = out ? P.fault : P.flow;
      g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = P.command;
    g.fillRect(300, 190, 46, 24);
    g.fillRect(340, 180, 18, 18);
  } else {
    for (const [x, y] of [[90, 90], [210, 70], [330, 100]]) {
      g.fillStyle = '#EBAA01';
      g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#EBAA01';
      g.lineWidth = 4;
      for (let k = 0; k < 8; k += 1) {
        const a = (k / 8) * Math.PI * 2;
        g.beginPath(); g.moveTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40); g.stroke();
      }
    }
    [[80, 0.8], [180, 0.55], [280, 0.35], [380, 0.7]].forEach(([x, f]) => {
      g.strokeStyle = '#C9D3EE';
      g.lineWidth = 3;
      g.strokeRect(x, 160, 60, 100);
      g.fillStyle = P.restored;
      g.fillRect(x + 4, 160 + 100 * (1 - f) + 4, 52, 100 * f - 8);
    });
    line([[440, 220], [490, 170]], P.reverse, 6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const P = M.PALETTE;
  const { scene, camera } = A.createBaseScene({ ground: { width: 60, depth: 38 }, shadowExtent: 32, fogNear: 70, fogFar: 160 });
  const S = { s1: 0, s2: 0, s3: 0, p1: 0, p2: 0, p3: 0, model: 0, p4: 0 };
  const flows = [];
  const textures = [];

  // ── Substation and three feeders ────────────────────────────
  const sub = A.createSubstation({ w: 5, d: 4.4 });
  sub.position.copy(SUB);
  scene.add(sub);
  const wire = M.stdMat('#8C98AC', { metalness: 0.5 });
  const amber = M.stdMat(P.warning, { emissive: P.warning, emissiveIntensity: 0.6 });
  const feederDefs = {
    left: { start: SUB.clone().add(V(-2.6, 2.6, 0)), poles: [[-5, -10], [-10, -8.5], [-15, -6.5], [-20, -4]] },
    centre: { start: SUB.clone().add(V(0, 2.6, 2.2)), poles: [[0, -6], [0, -1.5], [0, 3]] },
    right: { start: SUB.clone().add(V(2.6, 2.6, 0)), poles: [[5, -10], [10, -8.5], [15, -6.5], [20, -4]] },
  };
  const feederPts = {};
  for (const [key, def] of Object.entries(feederDefs)) {
    const tops = def.poles.map(([x, z]) => {
      const p = A.createPole({ height: 4.4 });
      p.position.set(x, 0, z);
      scene.add(p);
      return p.position.clone().add(p.userData.top);
    });
    const pts = [def.start, ...tops];
    const spans = [];
    for (let i = 0; i < pts.length - 1; i += 1) spans.push(A.catenary(pts[i], pts[i + 1], 0.3, 10));
    feederPts[key] = spans;
    spans.forEach((s, i) => {
      const loaded = key === 'centre' && i >= 2;
      scene.add(A.createConductor(s, loaded ? amber : wire, 0.045));
    });
  }
  const addFlow = (spans, color) => {
    let path = [];
    for (const s of spans) path = A.joinPaths(path, s);
    const f = new F.PowerFlow({ path, color, velocity: 3 });
    scene.add(f.object3D);
    flows.push(f);
    return f;
  };
  addFlow(feederPts.left.slice(0, 2), P.flow);
  addFlow(feederPts.right, P.flow);
  addFlow(feederPts.centre.slice(0, 2), P.flow);
  addFlow(feederPts.centre.slice(2), P.warning);

  // Houses: left end is out (outage), right has solar and batteries (DERs)
  const homes = A.createHouses([
    { x: -8, z: -11.5 }, { x: -12, z: -10.5 }, { x: -9, z: -5.5, rot: Math.PI }, { x: -13.5, z: -3.8, rot: Math.PI },
    { x: 3, z: -4.5, rot: Math.PI / 2 }, { x: -3, z: -2, rot: -Math.PI / 2 }, { x: 3, z: 0.5, rot: Math.PI / 2 }, { x: -3, z: 3.5, rot: -Math.PI / 2 },
  ]);
  scene.add(homes.group);
  const outHomes = A.createHouses([{ x: -17.5, z: -9 }, { x: -21, z: -7 }, { x: -18, z: -1.8, rot: Math.PI }, { x: -22, z: -0.8, rot: Math.PI }], { lit: 0 });
  scene.add(outHomes.group);
  const derHomes = A.createHouses([
    { x: 8, z: -11.5, solar: true }, { x: 12, z: -10.5, solar: true, battery: true }, { x: 17, z: -9, solar: true },
    { x: 9, z: -5.5, rot: Math.PI, solar: true, battery: true }, { x: 13.5, z: -3.8, rot: Math.PI, solar: true }, { x: 18, z: -1.8, rot: Math.PI, solar: true, battery: true },
  ]);
  scene.add(derHomes.group);
  // Solar backfeed from two DER homes to the right feeder
  for (const [hx, hz, px, pz] of [[12, -10.5, 10, -8.5], [18, -1.8, 20, -4]]) {
    const f = new F.PowerFlow({ path: [V(hx, 1.2, hz), V((hx + px) / 2, 3.2, (hz + pz) / 2), V(px, 4.2, pz)], color: P.reverse, velocity: 1.6, density: 2.4, size: 0.34 });
    scene.add(f.object3D);
    flows.push(f);
  }
  const outRingMat = M.glowMat(P.fault, { blending: THREE.NormalBlending, opacity: 0.6 });
  const outRing = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.0, 40).rotateX(-Math.PI / 2), outRingMat);
  outRing.position.set(-19.5, 0.05, -4.8);
  scene.add(outRing);
  const truck = A.createCrewTruck();
  truck.group.position.set(-14, 0, 1.8);
  truck.group.rotation.y = Math.PI * 0.85;
  scene.add(truck.group);
  scene.add(A.createTrees([[-25, -12], [25, -12], [-26, 4], [26, 3], [-8, 8], [8, 8]].map(([x, z], i) => ({ x, z, s: 1 + (i % 3) * 0.15 }))));

  // ── Control-room console and its three screens ─────────────
  const desk = new THREE.Mesh(new THREE.BoxGeometry(15, 0.9, 1.8), M.stdMat('#22324D'));
  desk.position.set(0, 0.45, 11);
  scene.add(desk);
  const deskGlow = M.glowMat(M.BRAND.lightBlue, { blending: THREE.NormalBlending, opacity: 0.85 });
  for (const x of [-5, -2.5, 0, 2.5, 5]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.06), deskGlow);
    s.position.set(x, 1.45, 10.5);
    s.rotation.x = -0.25;
    scene.add(s);
  }
  for (const x of [-4, 0, 4]) {
    const p = A.createPerson();
    p.position.set(x, 0, 12.4);
    scene.add(p);
  }

  const screenTargets = {
    dms: SUB.clone().add(V(0, 3, 0)),
    oms: V(-19.5, 1.5, -4.8),
    derms: V(14, 2.2, -7.5),
  };
  const unitBeam = new THREE.CylinderGeometry(0.06, 0.06, 1, 6, 1, true).translate(0, 0.5, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const screens = ['dms', 'oms', 'derms'].map((key, i) => {
    const tex = drawScreen(key, P);
    textures.push(tex);
    const panel = A.createGlassPanel({ width: 7, height: 3.9, color: M.BRAND.lightBlue, map: tex, opacity: 0.95 });
    panel.group.position.copy(SCREENS[key].pos);
    panel.group.rotation.y = SCREENS[key].ry;
    scene.add(panel.group);
    const label = L.label(lab[key]);
    label.element.style.whiteSpace = 'normal';
    label.element.style.maxWidth = '128px';
    scene.add(label);
    const beamMat = M.glowMat(M.PALETTE.data, { opacity: 0 });
    const beam = new THREE.Mesh(unitBeam, beamMat);
    const from = SCREENS[key].pos.clone().add(V(0, -2.0, 0));
    const dir = screenTargets[key].clone().sub(from);
    beam.position.copy(from);
    beam.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    beam.scale.set(1, dir.length(), 1);
    scene.add(beam);
    const pk = new F.PacketTrail({
      path: new THREE.QuadraticBezierCurve3(screenTargets[key], screenTargets[key].clone().lerp(from, 0.5).add(V(0, 2.5, 0)), from),
      color: M.PALETTE.data,
      label: { text: content.packets[key], kind: 'data' },
    });
    scene.add(pk.object3D);
    flows.push(pk);
    return { key, i, panel, label, beamMat, pk, base: SCREENS[key].pos };
  });
  const stepOf = { dms: 1, oms: 2, derms: 3 };

  // One shared network model (step 4): a violet map above the town, feeding all three screens
  const modelPos = [];
  for (const spans of Object.values(feederPts)) for (const s of spans) modelPos.push(...s[0].toArray(), ...s[s.length - 1].toArray());
  const modelGeo = new THREE.BufferGeometry();
  modelGeo.setAttribute('position', new THREE.Float32BufferAttribute(modelPos, 3));
  const modelMat = new THREE.LineBasicMaterial({ color: '#C9A8FF', transparent: true, opacity: 0, toneMapped: false });
  const model = new THREE.LineSegments(modelGeo, modelMat);
  model.scale.set(0.42, 0.1, 0.42);
  model.position.set(0, 6.2, -2.4);
  scene.add(model);
  const modelTrails = screens.map((sc) => {
    const t = new F.PacketTrail({ path: [V(0, 6.5, -4), sc.base.clone().add(V(0, -2, 0.1))], color: M.BRAND.violet, count: 3, size: 0.18 });
    scene.add(t.object3D);
    flows.push(t);
    return t;
  });

  // Ground labels
  const lSub = L.label(lab.substation);
  lSub.position.copy(SUB).add(V(0, 3.4, -1.6));
  const lLoaded = L.label(lab.loaded);
  // Hangs below-right of its point, clear of the substation label behind it.
  lLoaded.position.set(1.6, 4.9, 1.2);
  lLoaded.center.set(0, -0.1);
  const lOutage = L.label(lab.outage, { anchor: 'left' });
  lOutage.position.set(-17.2, 2.2, -3.2);
  scene.add(lSub, lLoaded, lOutage);

  // ── Timeline ────────────────────────────────────────────────
  const timeline = stepTimeline([2.6, 2.6, 2.6, 3.0], (tl, at, k) => {
    const q = (dt) => `${at}+=${dt}`;
    if (k <= 3) {
      const off = {};
      for (let j = 1; j <= 3; j += 1) if (j !== k) off[`s${j}`] = 0.25;
      tl.to(S, { [`s${k}`]: 1, ...off, duration: 0.7, ease: 'power2.inOut' }, q(0));
      tl.to(S, { [`p${k}`]: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.6));
    } else {
      tl.to(S, { s1: 0.8, s2: 0.8, s3: 0.8, model: 1, duration: 0.8 }, q(0));
      tl.to(S, { p4: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.9));
    }
  });

  const presets = {
    overview: { pos: [0, 16, 35], target: [0, 6, -3] },
    dms: { pos: [1, 14, 30], target: [0, 6.8, -4.5] },
    oms: { pos: [-8, 14, 29], target: [-9, 6.4, -4] },
    derms: { pos: [8, 14, 29], target: [9, 6.4, -4] },
  };

  const update = (dt, t) => {
    for (const f of flows) if (f.update && !f.setProgress) f.update(dt);
    screens.forEach((sc) => {
      const h = S[`s${stepOf[sc.key]}`];
      const g = sc.panel.group;
      g.position.copy(sc.base).add(V(0, 0, 1.4 * h));
      g.scale.setScalar(1 + 0.1 * h);
      sc.panel.edgeMaterial.opacity = 0.35 + 0.65 * h;
      sc.panel.material.opacity = 0.7 + 0.28 * h;
      sc.label.position.copy(g.position).add(V(0, 2.4 + 0.2 * h, 0));
      sc.label.element.classList.toggle('label3d--accent', h > 0.9);
      const focus = Math.max(S.s1, S.s2, S.s3) > 0.9 && S.model < 0.5;
      L.setLabelOpacity(sc.label, focus ? (h > 0.9 ? 1 : 0) : 0.55 + 0.45 * h);
      sc.beamMat.opacity = 0.5 * (h > 0.9 ? 1 : 0) * (S.model > 0.5 ? 0.4 : 1);
      sc.pk.setProgress(S[`p${stepOf[sc.key]}`]);
    });
    outRingMat.opacity = 0.35 + 0.35 * Math.sin(t * 4) * Math.max(0.3, S.s2);
    truck.lightMaterial.opacity = 0.5 + 0.5 * (Math.sin(t * 9) > 0 ? 1 : 0);
    modelMat.opacity = 0.9 * S.model;
    model.visible = S.model > 0.01;
    modelTrails.forEach((tr) => tr.setProgress(S.p4));
    lLoaded.element.classList.toggle('label3d--accent', S.s1 > 0.9);
    lOutage.element.classList.toggle('label3d--accent', S.s2 > 0.9);
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['dms', 'oms', 'derms', 'overview']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 8, maxDistance: 85 },
    dispose: () => { for (const tx of textures) tx.dispose(); },
  });
}
