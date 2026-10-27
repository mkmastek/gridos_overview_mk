// Software metaphor for the workflow slides: application panels floating above the grid,
// a shared Data Fabric hub, and labelled handoff arcs along which data and commands travel.
//   createAppPanel  — glass panel + two-line label; setActive(0..1) lights it while it acts
//   createHub       — the shared data layer (glowing disc + turning ring + label)
//   createHandoff   — arc between two points with a moving, labelled packet train
// All label text is passed in from the content files.

import * as THREE from 'three';
import { createGlassPanel } from './GridAssets.js';
import { PacketTrail } from './PowerFlow.js';
import { label, setLabelOpacity } from './Labels.js';
import { PALETTE, glowMat, stdMat } from '../materials.js';

/** Floating application panel facing +z. def = { title, sub } from content. */
export function createAppPanel(def, { width = 3.4, height = 1.9, color = PALETTE.data, labelAnchor = 'bottom' } = {}) {
  const panel = createGlassPanel({ width, height, color });
  const group = panel.group;
  // A few "screen" bars so the panel reads as an application, not an empty pane.
  const barMat = stdMat(color, { emissive: color, emissiveIntensity: 0.6, transparent: true, opacity: 0.55 });
  const bars = new THREE.Group();
  [0.62, 0.42, 0.78].forEach((w, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(width * w * 0.8, height * 0.12, 0.02), barMat);
    b.position.set(-width * 0.4 + (width * w * 0.8) / 2, height * 0.22 - i * height * 0.26, 0.02);
    bars.add(b);
  });
  group.add(bars);
  const lab = label(def, { anchor: labelAnchor });
  lab.position.set(0, labelAnchor === 'bottom' ? height / 2 + 0.1 : 0, 0);
  group.add(lab);
  return {
    group,
    label: lab,
    setActive(v) {
      const a = Math.max(0, Math.min(1, v));
      panel.material.opacity = 0.12 + 0.38 * a;
      panel.material.emissiveIntensity = 0.2 + 1.0 * a;
      panel.edgeMaterial.opacity = 0.35 + 0.65 * a;
      barMat.opacity = 0.3 + 0.6 * a;
      lab.element.classList.toggle('label3d--accent', a > 0.6);
      setLabelOpacity(lab, 0.6 + 0.4 * a);
    },
    setLabelVisible(v) { setLabelOpacity(lab, v); },
  };
}

/** The shared data layer: a glowing disc with a turning ring. */
export function createHub(def, { radius = 1.3, color = PALETTE.data } = {}) {
  const group = new THREE.Group();
  const discMat = glowMat(color, { opacity: 0.35, blending: THREE.NormalBlending });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.14, 32), discMat);
  const ringMat = glowMat(color, { opacity: 0.9, blending: THREE.NormalBlending });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.15, 0.06, 8, 48), ringMat);
  ring.rotation.x = Math.PI / 2;
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.35, 16, 12), stdMat('#ffffff', { emissive: color, emissiveIntensity: 1 }));
  core.position.y = 0.3;
  group.add(disc, ring, core);
  const lab = label(def);
  lab.position.set(0, 0.9, 0);
  group.add(lab);
  return {
    group,
    label: lab,
    update(dt) { ring.rotation.z += dt * 0.8; },
    setActive(v) {
      discMat.opacity = 0.25 + 0.45 * v;
      core.scale.setScalar(1 + 0.35 * v);
      lab.element.classList.toggle('label3d--accent', v > 0.6);
    },
  };
}

/**
 * Arc from a to b with a packet train. set(progress) moves the packets (timeline-driven);
 * the arc glows while packets travel and keeps a faint trace afterwards.
 * packet = label text riding with the lead packet; kind styles it ('data', 'command' …).
 * control = optional Bézier control point (e.g. to bend an arc around a globe).
 */
export function createHandoff(a, b, { color = PALETTE.data, lift = 1.6, packet = null, kind = 'data', count = 5, size = 0.22, control = null } = {}) {
  const group = new THREE.Group();
  const mid = control ? control.clone() : a.clone().lerp(b, 0.5);
  if (!control) mid.y = Math.max(a.y, b.y) + lift;
  const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
  const tubeMat = glowMat(color, { opacity: 0.1, blending: THREE.NormalBlending });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.035, 5, false), tubeMat);
  const trail = new PacketTrail({ path: curve, color, count, size, label: packet ? { text: packet, kind } : null });
  group.add(tube, trail.object3D);
  return {
    group,
    curve,
    trail,
    set(p) {
      trail.setProgress(p);
      const moving = p > 0.001 && p < 0.999;
      tubeMat.opacity = moving ? 0.55 : p >= 0.999 ? 0.22 : 0.06;
    },
    dispose() { trail.dispose(); },
  };
}
