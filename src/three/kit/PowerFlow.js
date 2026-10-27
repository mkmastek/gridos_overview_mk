// Moving light along paths.
//   PowerFlow    — continuous glowing particles along a line (energized power flow).
//                  Reduced motion: static arrow cones instead of moving particles.
//   PacketTrail  — a short train of cubes whose position is set by progress 0..1.
//                  Driven by the demo timeline, so it is exact when seeking.
//                  Optional label rides with the lead cube ("Fault current: yes", "Open SW2").
//   PacketStream — continuous cubes along several paths (data beams, command pulses).
//                  Reduced motion: the cubes stand still, evenly spaced.

import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { glowTexture, glowMat } from '../materials.js';

const LUT_N = 160;
const UP = new THREE.Vector3(0, 1, 0);

/** Sample a path (array of Vector3 or a Curve) into an evenly spaced lookup table. */
class PathLUT {
  constructor(path) { this.set(path); }

  set(path) {
    const curve = Array.isArray(path)
      ? (path.length === 2 ? new THREE.LineCurve3(path[0], path[1]) : new THREE.CatmullRomCurve3(path, false, 'centripetal', 0.1))
      : path;
    const pts = curve.getSpacedPoints(LUT_N);
    this.length = curve.getLength();
    this.lut = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => p.toArray(this.lut, i * 3));
  }

  at(u, out) {
    const f = Math.max(0, Math.min(1, u)) * LUT_N;
    const i = Math.min(LUT_N - 1, Math.floor(f));
    const t = f - i;
    const a = i * 3;
    const b = a + 3;
    const L = this.lut;
    return out.set(L[a] + (L[b] - L[a]) * t, L[a + 1] + (L[b + 1] - L[a + 1]) * t, L[a + 2] + (L[b + 2] - L[a + 2]) * t);
  }

  tangent(u, out) {
    const p = this.at(Math.min(1, u + 0.01), new THREE.Vector3());
    return this.at(Math.max(0, u - 0.01), out).sub(p).negate().normalize();
  }
}

export class PowerFlow {
  /**
   * @param path      Vector3[] or THREE.Curve
   * @param color     hex / THREE.Color
   * @param density   particles per world unit
   * @param velocity  world units per second
   */
  constructor({ path, color, density = 1.6, size = 0.42, velocity = 3.2, intensity = 1, direction = 1, arrows = null }) {
    this.path = new PathLUT(path);
    this.color = new THREE.Color(color);
    this.intensity = intensity;
    this.direction = direction;
    this.velocity = velocity;
    this.phase = Math.random();
    this.reduced = false;
    this.count = Math.max(4, Math.round(this.path.length * density));
    this.arrowCount = arrows ?? Math.max(1, Math.round(this.path.length / 4.5));

    this.object3D = new THREE.Group();
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    // Normal blending keeps the semantic colour true on the dark-blue stage
    // (additive blending would shift turquoise towards the data blue).
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size, map: glowTexture(), color: this.color, transparent: true, depthWrite: false,
      blending: THREE.NormalBlending, sizeAttenuation: true, toneMapped: false,
    }));
    this.points.frustumCulled = false;

    this.arrows = new THREE.InstancedMesh(new THREE.ConeGeometry(0.16, 0.48, 8), glowMat(this.color, { blending: THREE.NormalBlending }), this.arrowCount);
    this.arrows.visible = false;
    this.object3D.add(this.points, this.arrows);
    this.arrowSign = 0;
    this._v = new THREE.Vector3();
    this.update(0);
  }

  setPath(path) {
    this.path.set(path);
    this.arrowSign = 0;
  }

  setReducedMotion(on) {
    this.reduced = on;
    this.arrowSign = 0;
  }

  layoutArrows(sign) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const t = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < this.arrowCount; i += 1) {
      const u = (i + 0.5) / this.arrowCount;
      this.path.at(u, p);
      this.path.tangent(u, t).multiplyScalar(sign || 1);
      q.setFromUnitVectors(UP, t);
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      this.arrows.setMatrixAt(i, m);
    }
    this.arrows.instanceMatrix.needsUpdate = true;
    this.arrowSign = sign;
  }

  update(dt) {
    const visible = this.intensity > 0.01;
    this.object3D.visible = visible;
    if (!visible) return;

    if (this.reduced) {
      this.points.visible = false;
      this.arrows.visible = Math.abs(this.direction) > 0.05;
      const sign = Math.sign(this.direction) || 1;
      if (sign !== this.arrowSign) this.layoutArrows(sign);
      this.arrows.material.color.copy(this.color);
      this.arrows.material.opacity = Math.min(1, this.intensity);
      return;
    }
    this.arrows.visible = false;
    this.points.visible = true;
    this.points.material.color.copy(this.color);
    this.points.material.opacity = Math.min(1, this.intensity);

    this.phase = (this.phase + (dt * this.velocity * this.direction) / this.path.length + 1) % 1;
    const v = this._v;
    for (let i = 0; i < this.count; i += 1) {
      const u = (i / this.count + this.phase) % 1;
      this.path.at(u, v).toArray(this.positions, i * 3);
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.arrows.geometry.dispose();
    this.arrows.material.dispose();
    this.arrows.dispose();
  }
}

export class PacketTrail {
  /**
   * @param label  optional { text, kind: 'data' | 'command' | 'power' | 'decision' }
   *               — text comes from slides.js; shown riding with the lead cube while it moves.
   */
  constructor({ path, color, count = 5, size = 0.22, spacing = 0.07, label = null }) {
    this.path = new PathLUT(path);
    this.count = count;
    this.spacing = spacing;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(size, size, size), glowMat(color, { blending: THREE.NormalBlending }), count);
    this.mesh.frustumCulled = false;
    this.object3D = new THREE.Group();
    this.object3D.add(this.mesh);
    this.label = null;
    if (label) {
      const el = document.createElement('div');
      el.className = `packet3d packet3d--${label.kind || 'data'}`;
      el.textContent = label.text;
      this.label = new CSS2DObject(el);
      this.label.center.set(0.5, 1.6);
      this.label.visible = false;
      this.object3D.add(this.label);
    }
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this.setProgress(0);
  }

  setLabel(text) {
    if (this.label && this.label.element.textContent !== text) this.label.element.textContent = text;
  }

  /** 0 = not started (hidden), 1 = arrived (hidden). */
  setProgress(p) {
    const moving = p > 0.001 && p < 0.999;
    this.mesh.visible = moving;
    if (this.label) this.label.visible = moving;
    if (!moving) return;
    const span = 1 + this.spacing * (this.count - 1);
    for (let j = 0; j < this.count; j += 1) {
      const u = p * span - j * this.spacing;
      const on = u >= 0 && u <= 1;
      this.path.at(u, this._p);
      if (j === 0 && this.label) this.label.position.copy(this._p);
      this._s.setScalar(on ? 1 - j * 0.12 : 0);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(j, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh.dispose();
    this.label?.element.remove();
  }
}

export class PacketStream {
  constructor({ paths, color, perPath = 3, size = 0.18, velocity = 2.4, intensity = 1 }) {
    this.paths = paths.map((p) => new PathLUT(p));
    this.perPath = perPath;
    this.velocity = velocity;
    this.intensity = intensity;
    this.reduced = false;
    const n = paths.length * perPath;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(size, size, size), glowMat(color, { blending: THREE.NormalBlending }), n);
    this.mesh.frustumCulled = false;
    this.object3D = this.mesh;
    this.offsets = Array.from({ length: n }, (_, i) => (i % perPath) / perPath + Math.random() * 0.15);
    this.phase = 0;
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3(1, 1, 1);
    this.update(0);
  }

  setReducedMotion(on) { this.reduced = on; }

  update(dt) {
    this.mesh.visible = this.intensity > 0.01;
    if (!this.mesh.visible) return;
    this.mesh.material.opacity = Math.min(1, this.intensity);
    if (!this.reduced) this.phase += dt * this.velocity;
    this.paths.forEach((lut, pi) => {
      for (let k = 0; k < this.perPath; k += 1) {
        const i = pi * this.perPath + k;
        const u = this.reduced ? (k + 0.5) / this.perPath : (this.offsets[i] + this.phase / lut.length) % 1;
        lut.at(u, this._p);
        // Shrink near both ends so cubes appear and disappear softly.
        this._s.setScalar(Math.min(1, u * 8, (1 - u) * 8));
        this._m.compose(this._p, this._q, this._s);
        this.mesh.setMatrixAt(i, this._m);
      }
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh.dispose();
  }
}
