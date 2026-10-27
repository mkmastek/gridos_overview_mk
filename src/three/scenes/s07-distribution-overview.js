// Slide 7 — GridOS for Distribution: five glass app panels orbit one Data Fabric platform
// (with the grid twin on top). Each app's beam reaches the part of the grid it works on,
// and a labelled packet shows what moves. Finally a five-step adoption path lights up.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const APPS = ['gnm', 'adms', 'derms', 'field', 'vi'];
const CENTER = V(0, 0, -3);
const FAB_Y = 7.2;
const ORBIT_Y = 9.6;
const R = 7.6;
const FRONT = V(CENTER.x, ORBIT_Y, CENTER.z + R);
const TAU = Math.PI * 2;

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const { scene, camera } = A.createBaseScene({ ground: { width: 62, depth: 42 }, shadowExtent: 32, fogNear: 70, fogFar: 160 });
  const S = { idle: 1, ring: 0, h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, journey: 0, jv: 0 };
  const flows = [];

  // ── Data Fabric platform with the grid twin on top ─────────
  const fabMat = new THREE.MeshStandardMaterial({ color: M.BRAND.green, emissive: M.BRAND.green, emissiveIntensity: 0.35, transparent: true, opacity: 0.45, depthWrite: false });
  const fab = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.45, 40), fabMat);
  fab.position.set(CENTER.x, FAB_Y, CENTER.z);
  scene.add(fab);
  const fabEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(4.6, 4.6, 0.45, 40), 30), new THREE.LineBasicMaterial({ color: M.BRAND.green, toneMapped: false }));
  fabEdge.position.copy(fab.position);
  scene.add(fabEdge);
  const twinPos = [];
  const tn = [];
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * TAU;
    tn.push([Math.cos(a) * (1.4 + (i % 3) * 0.9), Math.sin(a) * (1.4 + (i % 3) * 0.9)]);
  }
  for (let i = 0; i < tn.length; i += 1) {
    const j = (i + 1) % tn.length;
    twinPos.push(tn[i][0], 0, tn[i][1], tn[j][0], 0, tn[j][1]);
    if (i % 3 === 0) twinPos.push(tn[i][0], 0, tn[i][1], 0, 0, 0);
  }
  const twinGeo = new THREE.BufferGeometry();
  twinGeo.setAttribute('position', new THREE.Float32BufferAttribute(twinPos, 3));
  const twin = new THREE.LineSegments(twinGeo, new THREE.LineBasicMaterial({ color: '#C9A8FF', toneMapped: false }));
  twin.position.set(CENTER.x, FAB_Y + 0.6, CENTER.z);
  scene.add(twin);
  const lFab = L.label(lab.fabric, { variant: 'accent' });
  lFab.position.set(CENTER.x, FAB_Y - 0.5, CENTER.z + 4.7);
  lFab.center.set(0.5, 0);
  scene.add(lFab);

  // ── The distribution grid below ─────────────────────────────
  const sub = A.createSubstation({ w: 5, d: 4.4 });
  sub.position.set(-15, 0, 2);
  scene.add(sub);
  const exit = sub.position.clone().add(sub.userData.exitE);
  const poleXs = [-10, -5, 0, 5, 10, 15];
  const poles = poleXs.map((x) => {
    const p = A.createPole({ height: 4.4 });
    p.position.set(x, 0, 3.2);
    scene.add(p);
    return p;
  });
  let feeder = A.catenary(exit, poles[0].position.clone().add(poles[0].userData.top), 0.3, 10);
  for (let i = 0; i < poles.length - 1; i += 1) {
    feeder = A.joinPaths(feeder, A.catenary(poles[i].position.clone().add(poles[i].userData.top), poles[i + 1].position.clone().add(poles[i + 1].userData.top), 0.28, 10));
  }
  scene.add(A.createConductor(feeder, M.stdMat('#8C98AC', { metalness: 0.5 }), 0.04));
  const power = new F.PowerFlow({ path: feeder, color: M.PALETTE.flow, velocity: 3 });
  scene.add(power.object3D);
  flows.push(power);
  const houseList = [];
  for (let i = 0; i < 9; i += 1) houseList.push({ x: -8.5 + i * 2.6, z: 6.4, solar: i >= 4 && i <= 7, battery: i === 6 });
  for (let i = 0; i < 6; i += 1) houseList.push({ x: -7 + i * 2.8, z: 0.2, rot: Math.PI, solar: i === 4 });
  const homes = A.createHouses(houseList);
  scene.add(homes.group);
  const truck = A.createCrewTruck();
  truck.group.position.set(9.5, 0, 9.4);
  truck.group.rotation.y = Math.PI * 0.9;
  scene.add(truck.group);
  scene.add(A.createRoad(V(-20, 0, 8.6), V(22, 0, 8.6), 1.5));
  scene.add(A.createTrees([[-22, -6], [-20, 9], [19, -7], [21, 6], [16, 12], [-14, 12], [22, -1]].map(([x, z], i) => ({ x, z, s: 1 + (i % 3) * 0.12 }))));

  // GNM's "map": a glowing network-model tile on the ground
  const mapPos = [];
  for (let x = -3; x <= 3; x += 1.5) mapPos.push(x, 0, -2, x, 0, 2);
  for (let z = -2; z <= 2; z += 1) mapPos.push(-3, 0, z, 3, 0, z);
  const mapGeo = new THREE.BufferGeometry();
  mapGeo.setAttribute('position', new THREE.Float32BufferAttribute(mapPos, 3));
  const mapMat = new THREE.LineBasicMaterial({ color: M.BRAND.violet, transparent: true, opacity: 0.35, toneMapped: false });
  const mapTile = new THREE.LineSegments(mapGeo, mapMat);
  mapTile.position.set(-17, 0.06, 11);
  scene.add(mapTile);

  // A small inspection drone (VI)
  const drone = new THREE.Group();
  const droneMat = M.stdMat('#E8EDF4');
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.6), droneMat));
  for (const [x, z] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) {
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 12), M.stdMat('#9AA8C7'));
    rotor.position.set(x, 0.12, z);
    drone.add(rotor);
  }
  scene.add(drone);

  // What each app touches on the ground
  const targets = {
    gnm: mapTile.position.clone().add(V(0, 0.2, 0)),
    adms: sub.position.clone().add(V(0, 3, 0)),
    derms: V(3.5, 1.6, 6.4),
    field: truck.group.position.clone().add(V(0, 1.4, 0)),
    vi: null, // follows the drone
  };

  // ── Five app panels in orbit ────────────────────────────────
  const appColor = { gnm: M.BRAND.violet, adms: M.BRAND.lightBlue, derms: M.BRAND.green, field: M.BRAND.yellow, vi: M.PALETTE.ai };
  const unitBeam = new THREE.CylinderGeometry(0.06, 0.06, 1, 6, 1, true).translate(0, 0.5, 0);
  const apps = APPS.map((key, i) => {
    const panel = A.createGlassPanel({ width: 3.2, height: 1.9, color: appColor[key] });
    scene.add(panel.group);
    const label = L.label(lab[key]);
    label.element.style.whiteSpace = 'normal';
    label.element.style.maxWidth = '150px';
    scene.add(label);
    const beamMat = M.glowMat(appColor[key], { opacity: 0 });
    const beam = new THREE.Mesh(unitBeam, beamMat);
    scene.add(beam);
    return { key, i, panel, label, beamMat, beam, base: (i / APPS.length) * TAU };
  });

  // Labelled packets, drawn from the front slot (where the app sits in its step)
  const packetPaths = {
    gnm: [FRONT.clone().add(V(0, -1, 0)), V(-9, 6, 8), targets.gnm],
    adms: [FRONT.clone().add(V(0, -1, 0)), V(-8, 7, 4), targets.adms],
    derms: [FRONT.clone().add(V(0, -1, 0)), V(2, 6, 7), targets.derms],
    field: [targets.field, V(6, 6, 9), FRONT.clone().add(V(0, -1, 0))],
    vi: [FRONT.clone().add(V(0, -1, 0)), V(-8, 5, 9), targets.gnm],
  };
  const packetKind = { gnm: 'data', adms: 'command', derms: 'command', field: 'data', vi: 'decision' };
  const packetColor = { gnm: M.PALETTE.data, adms: M.PALETTE.command, derms: M.PALETTE.command, field: M.PALETTE.data, vi: M.PALETTE.ai };
  const packets = APPS.map((key) => {
    const t = new F.PacketTrail({
      path: new THREE.CatmullRomCurve3(packetPaths[key]),
      color: packetColor[key],
      label: { text: content.packets[key], kind: packetKind[key] },
    });
    scene.add(t.object3D);
    flows.push(t);
    return t;
  });

  // ── Adoption journey: five stepping stones ─────────────────
  const stoneGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.3, 6);
  const stones = [0, 1, 2, 3, 4].map((i) => {
    const mat = M.stdMat('#0B2A7A', { emissive: M.BRAND.green, emissiveIntensity: 0 });
    const s = new THREE.Mesh(stoneGeo, mat);
    s.position.set(-14 + i * 7, 0.15, 14.5 - Math.sin(i * 0.9) * 1.2);
    scene.add(s);
    const l = L.label(lab[`j${i + 1}`]);
    l.element.style.whiteSpace = 'normal';
    l.element.style.maxWidth = '120px';
    l.position.copy(s.position).add(V(0, 0.5, 0));
    scene.add(l);
    return { s, mat, l };
  });

  // ── Timeline: one app per step, then the journey ───────────
  const timeline = stepTimeline([2.6, 2.6, 2.6, 2.6, 2.6, 3.4], (tl, at, k) => {
    const q = (dt) => `${at}+=${dt}`;
    if (k <= 5) {
      const off = {};
      for (let j = 1; j <= 5; j += 1) if (j !== k) off[`h${j}`] = 0.2;
      tl.to(S, { idle: 0, ring: -((k - 1) * TAU) / APPS.length, [`h${k}`]: 1, ...off, duration: 0.9, ease: 'power2.inOut' }, q(0));
      tl.to(S, { [`p${k}`]: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.9));
    } else {
      tl.to(S, { h1: 0.6, h2: 0.6, h3: 0.6, h4: 0.6, h5: 0.6, jv: 1, duration: 0.6 }, q(0));
      tl.to(S, { journey: 5, duration: 2.4, ease: 'none' }, q(0.6));
    }
  });

  const presets = {
    overview: { pos: [0, 17, 35], target: [0, 5, 1] },
    apps: { pos: [0, 15, 33], target: [0, 6.6, 2] },
    journey: { pos: [0, 13, 33], target: [0, 2.6, 7] },
  };

  const tmp = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const update = (dt, t) => {
    power.update(dt);
    twin.rotation.y += dt * 0.25;
    drone.position.set(13 + Math.sin(t * 0.5) * 3, 3.6 + Math.sin(t * 1.7) * 0.2, 4 + Math.cos(t * 0.5) * 1.5);
    targets.vi = drone.position;

    const idleAngle = t * 0.18 * S.idle;
    apps.forEach((ap, i) => {
      const a = ap.base + S.ring + idleAngle;
      const pos = V(CENTER.x + Math.sin(a) * R, ORBIT_Y, CENTER.z + Math.cos(a) * R);
      ap.panel.group.position.copy(pos);
      ap.panel.group.rotation.y = a;
      const front = (Math.cos(a) + 1) / 2;
      const h = S[`h${i + 1}`];
      ap.panel.material.opacity = 0.12 + 0.35 * h;
      ap.panel.material.emissiveIntensity = 0.25 + 0.9 * h;
      ap.panel.edgeMaterial.opacity = 0.35 + 0.65 * Math.max(h, front * 0.6);
      ap.label.position.copy(pos).add(V(0, 1.45, 0));
      L.setLabelOpacity(ap.label, clamp01((front - 0.8) * 8) * (0.55 + 0.45 * Math.max(h, front)));
      ap.label.element.classList.toggle('label3d--accent', h > 0.9);
      // beam from the panel down to the grid part it works on
      const target = ap.key === 'vi' ? drone.position : targets[ap.key];
      tmp.copy(target).sub(pos);
      const len = tmp.length();
      ap.beam.position.copy(pos).add(V(0, -0.95, 0));
      ap.beam.quaternion.setFromUnitVectors(up, tmp.normalize());
      ap.beam.scale.set(1, len, 1);
      ap.beamMat.opacity = 0.08 + 0.55 * h;
      packets[i].setProgress(S[`p${i + 1}`]);
    });
    mapMat.opacity = 0.3 + 0.6 * S.h1;
    fabMat.emissiveIntensity = 0.3 + 0.3 * Math.sin(t * 1.5) * 0.5 + 0.2 * S.h4;

    stones.forEach((st, i) => {
      const lit = clamp01(S.journey - i);
      st.mat.emissiveIntensity = 0.7 * lit;
      L.setLabelOpacity(st.l, S.jv * (0.45 + 0.55 * lit));
      st.l.element.classList.toggle('label3d--accent', lit > 0.9 && S.journey < i + 1.6);
    });
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['apps', 'apps', 'apps', 'apps', 'apps', 'journey']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 8, maxDistance: 85 },
  });
}
