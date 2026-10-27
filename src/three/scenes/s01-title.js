// Slide 1 — title: a miniature grid from power plant to homes, with GridOS floating above.
// Physical grid on the ground, software above, data rising, commands descending.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const { scene, camera } = A.createBaseScene({ ground: { width: 76, depth: 42 }, shadowExtent: 40, fogNear: 70, fogFar: 170 });
  const flows = [];
  const S = { gen: 0, trans: 0, dist: 0, os: 0, beams: 0.25, cmd: 0 };

  const addFlow = (path, group, opts = {}) => {
    const f = new F.PowerFlow({ path, color: M.PALETTE.flow, ...opts });
    f.group = group;
    scene.add(f.object3D);
    flows.push(f);
    return f;
  };
  const wire = (pts, mat) => scene.add(A.createConductor(pts, mat, 0.035));
  const wireMat = M.stdMat('#8C98AC', { metalness: 0.5, roughness: 0.4 });

  // ── Generation ─────────────────────────────────────────────
  const gas = A.createGasPlant();
  gas.position.set(-24, 0, -6);
  scene.add(gas);

  const turbines = [[-25, 5.5], [-21, 8.8], [-17.2, 5.2]].map(([x, z]) => {
    const t = A.createWindTurbine({ height: 6.6 });
    t.group.position.set(x, 0, z);
    t.rotor.rotation.x = Math.random() * Math.PI;
    scene.add(t.group);
    return t;
  });

  const stepUp = A.createSubstation({ w: 5, d: 4.4 });
  stepUp.position.set(-12.5, 0, 0);
  scene.add(stepUp);
  const exitW = stepUp.position.clone().add(stepUp.userData.exitW);
  const exitE = stepUp.position.clone().add(stepUp.userData.exitE);

  // Gas plant → step-up: one span from a short pole at the plant
  const gasPole = A.createPole({ height: 3.2 });
  gasPole.position.set(-20.5, 0, -3.2);
  scene.add(gasPole);
  const gasTop = gasPole.position.clone().add(gasPole.userData.top);
  const gasLine = [...A.catenary(gas.position.clone().add(V(-0.6, 1.7, 1.1)), gasTop, 0.2, 8), ...A.catenary(gasTop, exitW, 0.3, 10).slice(1)];
  wire(gasLine, wireMat);
  addFlow(gasLine, 'gen');

  // Wind turbines → step-up: underground collector cables (flow drawn at ground level)
  for (const t of turbines) {
    const p = t.group.position;
    const path = [V(p.x, 0.12, p.z), V(p.x, 0.12, 1.6), V(exitW.x - 0.4, 0.12, 1.6)];
    addFlow(path, 'gen', { density: 1.3, size: 0.36 });
  }

  // ── Transmission ───────────────────────────────────────────
  const towers = [-5.5, 1.5, 8.5].map((x) => {
    const tw = A.createTransmissionTower({ height: 7.5 });
    tw.position.set(x, 0, 0);
    scene.add(tw);
    return tw;
  });
  const transSub = A.createSubstation({ w: 5, d: 4.4 });
  transSub.position.set(15, 0, 0);
  scene.add(transSub);
  const tExitW = transSub.position.clone().add(transSub.userData.exitW);
  const tExitE = transSub.position.clone().add(transSub.userData.exitE);

  for (const side of [0, 1]) {
    const z = side ? 1.3 : -1.3;
    const pts = [exitE.clone().setZ(z), ...towers.map((tw) => tw.position.clone().add(tw.userData.attach[side])), tExitW.clone().setZ(z)];
    let line = [];
    for (let i = 0; i < pts.length - 1; i += 1) line = A.joinPaths(line, A.catenary(pts[i], pts[i + 1], i === 0 || i === pts.length - 2 ? 0.35 : 0.75, 12));
    wire(line, wireMat);
    addFlow(line, 'trans', { velocity: 4.2 });
  }

  // Data center fed from the transmission substation
  const dc = A.createDataCenter({ w: 5, d: 3, h: 1.6 });
  dc.group.position.set(15.5, 0, -9);
  scene.add(dc.group);
  const dcPole = A.createPole({ height: 3.4 });
  dcPole.position.set(15.5, 0, -5);
  scene.add(dcPole);
  const dcTop = dcPole.position.clone().add(dcPole.userData.top);
  const dcLine = [...A.catenary(transSub.position.clone().add(V(-1, 2.2, -2.1)), dcTop, 0.2, 8), ...A.catenary(dcTop, dc.group.position.clone().add(V(0, 1.2, 1.5)), 0.15, 6).slice(1)];
  wire(dcLine, wireMat);
  addFlow(dcLine, 'dist', { density: 1.4 });

  // ── Distribution street ────────────────────────────────────
  scene.add(A.createRoad(V(17.5, 0, 1.1), V(33, 0, 1.1), 1.5));
  const poleXs = [19.2, 22.2, 25.2, 28.2, 31.2];
  const poles = poleXs.map((x) => {
    const p = A.createPole({ height: 4.2 });
    p.position.set(x, 0, -0.1);
    scene.add(p);
    return p;
  });
  const xfmr = A.createDistTransformer();
  xfmr.position.copy(poles[2].position).add(V(0, 3.2, 0));
  scene.add(xfmr);
  let feeder = A.catenary(tExitE, poles[0].position.clone().add(poles[0].userData.top), 0.35, 10);
  for (let i = 0; i < poles.length - 1; i += 1) {
    feeder = A.joinPaths(feeder, A.catenary(poles[i].position.clone().add(poles[i].userData.top), poles[i + 1].position.clone().add(poles[i + 1].userData.top), 0.3, 10));
  }
  wire(feeder, wireMat);
  addFlow(feeder, 'dist', { velocity: 2.6 });

  const houses = [];
  for (let i = 0; i < 10; i += 1) {
    const x = 18.6 + i * 1.42;
    houses.push({ x, z: -2.5, rot: 0, solar: i % 3 !== 1, battery: i === 2 || i === 7, ev: false });
    houses.push({ x, z: 4.1, rot: Math.PI, solar: i % 4 === 0, battery: i === 4, ev: i === 3 || i === 8 });
  }
  const homes = A.createHouses(houses);
  scene.add(homes.group);

  scene.add(A.createTrees([
    [-28, -1], [-27, 1.5], [-19, -9], [-16, -8], [-9, 6], [-7, 8], [-2, 7], [4, -7], [6, -9], [5, 8],
    [21, -6], [24, -6.5], [27.5, -6], [31, -6.2], [20, 7.6], [23.5, 7.8], [28, 7.6], [32.5, 7.5], [-29, 9], [10, 7],
  ].map(([x, z], i) => ({ x, z, s: 0.9 + (i % 4) * 0.12 }))));

  // ── GridOS slab: software floating above ───────────────────
  const SLAB_Y = 15.5;
  const slab = A.createGlassSlab({ width: 60, depth: 22, thickness: 0.5, color: M.PALETTE.data, opacity: 0.13 });
  slab.group.position.set(2, SLAB_Y, -1);
  scene.add(slab.group);

  const beamFrom = [
    exitW.clone().setY(3.2), transSub.position.clone().add(V(0, 3.2, 0)), dc.group.position.clone().add(V(0, 2.1, 0)),
    gas.position.clone().add(V(3, 5.4, -0.2)), turbines[1].group.position.clone().add(V(0, 7.2, 0)),
    V(19.9, 1.5, -2.5), V(25.6, 1.5, 4.1), V(30.0, 1.5, -2.5), xfmr.position.clone().add(V(0, 0.4, 0.3)),
  ];
  const beams = beamFrom.map((a) => {
    const b = A.createBeam(a, V(a.x, SLAB_Y - 0.25, a.z), { color: M.PALETTE.data, radius: 0.045, opacity: 0.3 });
    scene.add(b);
    return b;
  });
  const dataUp = new F.PacketStream({ paths: beamFrom.map((a) => [a.clone(), V(a.x, SLAB_Y - 0.3, a.z)]), color: M.PALETTE.data, perPath: 3, velocity: 3.2 });
  const cmdDown = new F.PacketStream({ paths: [0, 1, 6, 8].map((i) => [V(beamFrom[i].x, SLAB_Y - 0.3, beamFrom[i].z), beamFrom[i].clone()]), color: M.PALETTE.command, perPath: 1, size: 0.26, velocity: 2.6, intensity: 0 });
  scene.add(dataUp.object3D, cmdDown.object3D);
  flows.push(dataUp, cmdDown);

  // ── Ground highlights for each step ─────────────────────────
  const spot = (x, z, r) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2).rotateX(-Math.PI / 2), M.glowMat(M.PALETTE.data, { map: M.glowTexture(), opacity: 0 }));
    m.position.set(x, 0.04, z);
    scene.add(m);
    return m;
  };
  const spots = { gen: spot(-20, 1, 10), trans: spot(1.5, 0, 11), dist: spot(24.5, 0, 10) };

  // ── Labels (text from slides.js) ────────────────────────────
  const lab = content.labels;
  const labels = {
    gridos: L.label(lab.gridos, { variant: 'big accent' }),
    gas: L.label(lab.gas), wind: L.label(lab.wind), stepUp: L.label(lab.stepUp), lines: L.label(lab.lines),
    transSub: L.label(lab.transSub), dataCenter: L.label(lab.dataCenter), feeder: L.label(lab.feeder), homes: L.label(lab.homes),
  };
  labels.gridos.position.set(2, SLAB_Y + 0.6, 9.6);
  labels.gas.position.set(-24, 6.2, -6);
  labels.wind.position.set(-21, 9.7, 8.8);
  labels.stepUp.position.set(-12.5, 3.4, 0);
  labels.lines.position.set(1.5, 8.2, 0);
  labels.transSub.position.set(15, 3.4, 0);
  labels.dataCenter.position.set(15.5, 2.4, -9);
  labels.feeder.position.set(27.4, 4.6, -0.1);
  labels.homes.position.set(26, 1.6, 4.6);
  for (const l of Object.values(labels)) scene.add(l);
  const areaLabels = { gen: ['gas', 'wind'], trans: ['stepUp', 'lines', 'transSub'], dist: ['feeder', 'homes', 'dataCenter'] };

  // ── Timeline ────────────────────────────────────────────────
  const timeline = stepTimeline([1.6, 1.6, 1.6, 2.2], (tl, at, k) => {
    if (k === 1) tl.to(S, { gen: 1, duration: 1.2, ease: 'power2.out' }, at);
    if (k === 2) tl.to(S, { gen: 0.2, trans: 1, duration: 1.2, ease: 'power2.inOut' }, at);
    if (k === 3) tl.to(S, { trans: 0.2, dist: 1, duration: 1.2, ease: 'power2.inOut' }, at);
    if (k === 4) {
      tl.to(S, { dist: 0.2, gen: 0, trans: 0, os: 1, beams: 1, duration: 1.6, ease: 'power2.inOut' }, at);
      tl.to(S, { cmd: 1, duration: 0.8 }, `${at}+=0.9`);
    }
  });

  const presets = {
    overview: { pos: [2, 26, 50], target: [2, 6, 0] },
    generation: { pos: [-27, 13, 25], target: [-19.5, 4, 1.5] },
    transmission: { pos: [0.5, 15, 35], target: [0.8, 4.5, 0] },
    street: { pos: [32, 9, 16], target: [24.5, 1.5, 0.5] },
    gridos: { pos: [2, 31, 52], target: [2, 10, -1] },
  };

  const update = (dt) => {
    for (const t of turbines) t.rotor.rotation.x += dt * 1.1;
    for (const f of flows) {
      if (f.group) f.intensity = 0.5 + 0.5 * S[f.group];
      f.update(dt);
    }
    dataUp.intensity = S.beams;
    cmdDown.intensity = S.cmd;
    for (const b of beams) b.material.opacity = 0.06 + 0.4 * S.beams;
    slab.setGlow(0.25 + 0.75 * S.os);
    for (const [k, m] of Object.entries(spots)) m.material.opacity = 0.32 * S[k];
    // Labels show only for the area in focus (a dimmed area's labels would just add clutter).
    for (const [area, keys] of Object.entries(areaLabels)) for (const key of keys) L.setLabelOpacity(labels[key], (S[area] - 0.3) / 0.7);
    L.setLabelOpacity(labels.gridos, 0.6 + 0.4 * S.os);
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['generation', 'transmission', 'street', 'gridos']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 8, maxDistance: 110 },
  });
}
