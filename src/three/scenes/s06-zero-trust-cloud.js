// Slide 6 — Zero Trust and cloud-native runtime.
// On-premises control center with container pods (ADMS) and a floating cloud platform with
// pods (other apps). Two services swap certificates (mutual TLS), an unknown device is
// blocked, an encrypted link joins on-premises and cloud, and the cloud services update one
// at a time (Evergreen) while everything keeps running.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createControlCenter, createCloudPlatform, createContainerGrid, createShield, createLock } from '../kit/Buildings.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PAD = V(-13, 0.2, 1.2);
const CLOUD = V(12, 4.6, -0.5);
const SVC_A = V(-16, 1.45, 3.6);
const SVC_B = V(-10, 1.45, 3.6);
const INTRUDER_START = V(-23, 0.5, 8);
const INTRUDER_STOP = V(-17.9, 0.5, 5.2);

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 54, depth: 34 }, shadowExtent: 28, fogNear: 70, fogFar: 150 });
  const S = { pods: 0, svc: 0, svcLabel: 0, hand: 0, lock: 0, tube: 0, unk: 0, intr: 0, barrier: 0, hybrid: 0, link: 0, pkLink: 0, pkUpd: 0, ever: 0 };
  const flows = [];

  // ── On-premises ─────────────────────────────────────────────
  const cc = createControlCenter({ w: 7, d: 4, h: 2.2 });
  cc.position.set(-13, 0, -5);
  scene.add(cc);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.2, 5.4), M.stdMat('#0B2A7A', { emissive: M.BRAND.lightBlue, emissiveIntensity: 0.05 }));
  pad.position.copy(PAD).setY(0.1);
  pad.receiveShadow = true;
  scene.add(pad);
  const onPods = createContainerGrid({ pods: 4, perPod: 4, size: 0.42, color: M.BRAND.lightBlue });
  onPods.mesh.position.set(PAD.x, 0.2, PAD.z - 0.6);
  scene.add(onPods.mesh);

  // Services A and B, their certificates (shields), the lock and the encrypted tube
  const svcMat = M.stdMat(M.BRAND.lightBlue, { emissive: M.BRAND.lightBlue, emissiveIntensity: 0.5 });
  const svcA = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), svcMat);
  const svcB = svcA.clone();
  svcA.position.copy(SVC_A);
  svcB.position.copy(SVC_B);
  scene.add(svcA, svcB);
  const shieldA = createShield({ color: M.BRAND.yellow, size: 0.55 });
  const shieldB = createShield({ color: M.BRAND.yellow, size: 0.55 });
  scene.add(shieldA, shieldB);
  const lock = createLock({ color: M.BRAND.green });
  lock.group.position.set((SVC_A.x + SVC_B.x) / 2, 2.3, SVC_A.z);
  lock.group.scale.setScalar(0.8);
  scene.add(lock.group);
  const tubeMat = M.glowMat(M.BRAND.green, { blending: THREE.NormalBlending, opacity: 0 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, SVC_B.x - SVC_A.x - 0.8, 10, 1, true).rotateZ(Math.PI / 2), tubeMat);
  tube.position.set((SVC_A.x + SVC_B.x) / 2, SVC_A.y, SVC_A.z);
  scene.add(tube);
  const lSvcA = L.label(lab.svcA);
  lSvcA.position.copy(SVC_A).add(V(0, 1.6, 0));
  const lSvcB = L.label(lab.svcB);
  lSvcB.position.copy(SVC_B).add(V(0, 1.6, 0));
  scene.add(lSvcA, lSvcB);

  // Unknown device and the barrier that stops it
  const unkMat = M.stdMat('#7C88A9');
  const intruder = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), unkMat);
  scene.add(intruder);
  const barrierMat = M.glowMat(M.PALETTE.fault, { blending: THREE.NormalBlending, opacity: 0, side: THREE.DoubleSide });
  const barrier = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), barrierMat);
  barrier.position.set(-17.2, 0.95, 4.6);
  barrier.lookAt(INTRUDER_START.clone().setY(0.95));
  scene.add(barrier);
  const lUnknown = L.label(lab.unknown);
  scene.add(lUnknown);

  // ── Cloud ───────────────────────────────────────────────────
  const cloud = createCloudPlatform({ w: 11, d: 8, color: M.BRAND.lightBlue });
  cloud.group.position.copy(CLOUD);
  scene.add(cloud.group);
  const cloudPods = createContainerGrid({ pods: 6, perPod: 4, size: 0.42, color: M.BRAND.lightBlue });
  cloudPods.mesh.position.set(CLOUD.x, CLOUD.y + 0.62, CLOUD.z);
  scene.add(cloudPods.mesh);

  // Encrypted link between on-premises and cloud
  const linkCurve = new THREE.CatmullRomCurve3([V(-8.6, 1.0, 1.5), V(-2, 4.5, 2.6), V(4, 6, 1.2), V(7.2, 5.4, -0.2)]);
  const linkMat = M.glowMat(M.BRAND.green, { blending: THREE.NormalBlending, opacity: 0 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(linkCurve, 40, 0.1, 8, false), linkMat));
  const linkPts = linkCurve.getPoints(50);
  const streamUp = new F.PacketStream({ paths: [linkPts], color: M.PALETTE.data, perPath: 5, velocity: 4, intensity: 0 });
  const streamDown = new F.PacketStream({ paths: [[...linkPts].reverse()], color: M.PALETTE.data, perPath: 4, velocity: 3.4, intensity: 0 });
  const pkLink = new F.PacketTrail({ path: linkCurve, color: M.PALETTE.data, label: { text: content.packets.link, kind: 'data' } });
  const pkUpd = new F.PacketTrail({ path: [V(CLOUD.x - 2, 11.5, CLOUD.z), V(CLOUD.x - 2, CLOUD.y + 1.2, CLOUD.z)], color: M.PALETTE.restored, size: 0.3, label: { text: content.packets.update, kind: 'data' } });
  const pkCertA = new F.PacketTrail({ path: [SVC_A.clone().add(V(0.5, 0.6, 0)), SVC_B.clone().add(V(-0.5, 0.6, 0))], color: M.BRAND.yellow, count: 3, size: 0.18, label: { text: content.packets.cert, kind: 'command' } });
  const pkDenied = new F.PacketTrail({ path: [INTRUDER_START.clone().add(V(0, 0.9, 0)), INTRUDER_STOP.clone().add(V(0, 0.9, 0))], color: M.PALETTE.fault, count: 3, size: 0.18 });
  for (const f of [streamUp, streamDown, pkLink, pkUpd, pkCertA, pkDenied]) { scene.add(f.object3D); flows.push(f); }

  // ── Labels ──────────────────────────────────────────────────
  const lOnPrem = L.label(lab.onPrem);
  lOnPrem.position.set(-13, 3.1, -5);
  const lCloud = L.label(lab.cloud);
  lCloud.position.set(CLOUD.x, CLOUD.y + 1.4, CLOUD.z - 4.4);
  const lAdms = L.label(lab.adms);
  lAdms.position.set(PAD.x, 1.6, PAD.z - 1.8);
  const lApps = L.label(lab.apps);
  lApps.position.set(CLOUD.x, CLOUD.y - 0.3, CLOUD.z + 4.6);
  lApps.center.set(0.5, 0);
  scene.add(lOnPrem, lCloud, lAdms, lApps);

  // ── Timeline ────────────────────────────────────────────────
  const timeline = stepTimeline([1.8, 3.4, 3.4, 3.2, 4.0], (tl, at, k) => {
    const q = (dt) => `${at}+=${dt}`;
    if (k === 1) tl.to(S, { pods: 1, duration: 0.6 }, q(0.1)).to(S, { pods: 0.35, duration: 0.6 }, q(0.9));
    if (k === 2) {
      tl.to(S, { svc: 1, svcLabel: 1, duration: 0.4 }, q(0));
      tl.to(S, { hand: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.4));
      tl.to(S, { lock: 1, duration: 0.4 }, q(1.9));
      tl.to(S, { tube: 1, duration: 0.5 }, q(2.3));
    }
    if (k === 3) {
      tl.to(S, { svcLabel: 0, unk: 1, duration: 0.3 }, q(0));
      tl.to(S, { intr: 1, duration: 1.2, ease: 'power1.in' }, q(0.2));
      tl.to(S, { barrier: 1, duration: 0.3 }, q(1.2));
      tl.to(S, { intr: 0.55, duration: 0.6, ease: 'power2.out' }, q(1.6));
    }
    if (k === 4) {
      tl.to(S, { unk: 0, barrier: 0, hybrid: 1, duration: 0.6 }, q(0));
      tl.to(S, { link: 1, duration: 0.6 }, q(0.4));
      tl.to(S, { pkLink: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.9));
    }
    if (k === 5) {
      tl.to(S, { pkUpd: 1, duration: 0.8 }, q(0.1));
      tl.to(S, { ever: cloudPods.positions.length, duration: 2.8, ease: 'none' }, q(0.7));
    }
  });

  const presets = {
    overview: { pos: [0, 15, 34], target: [0, 3, 0] },
    hand: { pos: [-13, 6.5, 14.5], target: [-13, 1.7, 2.8] },
    barrier: { pos: [-17.5, 6, 15.5], target: [-16, 1.2, 4.2] },
    hybrid: { pos: [0, 14, 32], target: [0, 3.4, 0] },
    cloud: { pos: [12, 13.5, 21], target: [12, 4.9, 0] },
  };

  const blue = new THREE.Color(M.BRAND.lightBlue);
  const green = C.restored;
  const update = (dt, t) => {
    onPods.mesh.material.emissiveIntensity = 0.15 + 0.6 * S.pods;
    cloudPods.mesh.material.emissiveIntensity = 0.15 + 0.6 * S.pods;

    // mutual TLS handshake: certificates (shields) swap sides, the lock closes, the tube glows
    svcMat.emissiveIntensity = 0.3 + 0.6 * S.svc;
    const h = clamp01(S.hand);
    shieldA.position.lerpVectors(SVC_A, SVC_B, h).add(V(0, 1.0 + Math.sin(h * Math.PI) * 1.2, 0));
    shieldB.position.lerpVectors(SVC_B, SVC_A, h).add(V(0, 1.0 + Math.sin(h * Math.PI) * 0.8, 0.25));
    shieldA.visible = shieldB.visible = S.svc > 0.01 && S.tube < 0.99;
    shieldA.rotation.y = shieldB.rotation.y = t * 1.2;
    lock.group.visible = S.lock > 0.01;
    lock.setClosed(S.lock);
    tubeMat.opacity = 0.6 * S.tube;
    pkCertA.setProgress(S.hand);
    L.setLabelOpacity(lSvcA, S.svcLabel);
    L.setLabelOpacity(lSvcB, S.svcLabel);

    // unknown device is stopped by the barrier
    intruder.visible = S.unk > 0.01;
    intruder.position.lerpVectors(INTRUDER_START, INTRUDER_STOP, clamp01(S.intr));
    intruder.rotation.y = t * 0.8;
    unkMat.color.set('#7C88A9').lerp(C.fault, S.barrier * 0.6);
    barrierMat.opacity = 0.55 * S.barrier * (0.75 + 0.25 * Math.sin(t * 6));
    barrier.visible = S.barrier > 0.01;
    pkDenied.setProgress(S.unk > 0.5 ? clamp01(S.intr) * 0.98 : 0);
    lUnknown.position.copy(intruder.position).add(V(0, 1.1, 0));
    L.setLabelOpacity(lUnknown, S.unk);

    // hybrid deployment: encrypted link with data both ways
    linkMat.opacity = 0.55 * S.link;
    streamUp.intensity = S.link;
    streamDown.intensity = S.link;
    streamUp.update(dt);
    streamDown.update(dt);
    pkLink.setProgress(S.pkLink);
    L.setLabelOpacity(lOnPrem, 1 - Math.max(S.svcLabel, S.unk));
    lAdms.element.classList.toggle('label3d--accent', S.hybrid > 0.5 && S.pkUpd < 0.5);
    lApps.element.classList.toggle('label3d--accent', S.hybrid > 0.5);

    // Evergreen: cloud services switch from version 1 (blue) to version 2 (green) one at a time
    pkUpd.setProgress(S.pkUpd);
    const n = cloudPods.positions.length;
    const done = Math.floor(S.ever);
    const frac = S.ever - done;
    for (let i = 0; i < n; i += 1) {
      const col = i < done ? green : blue;
      cloudPods.setColor(i, i === done && frac > 0.5 ? green : col);
      cloudPods.setScale(i, i === done && S.ever < n ? 1 - 0.45 * Math.sin(frac * Math.PI) : 1);
    }
  };

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['overview', 'hand', 'barrier', 'hybrid', 'cloud']),
    startPreset: 'overview',
    controlsLimits: { minDistance: 6, maxDistance: 80 },
  });
}
