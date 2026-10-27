// Regional-map pieces for the storm slides:
//   createTownships — hexagonal township tiles, each with a flat plate, an extrudable bar
//                     (predicted / actual outages) and an outline (zone of impact)
//   createStorm     — rotating cloud disc with falling rain
//   createForecastCone — the widening cone of uncertainty along a storm track

import * as THREE from 'three';
import { stdMat, glowMat } from '../materials.js';

/**
 * Hexagon tiles on the ground. Returns { group, towns } where each town is
 * { center: Vector3, plate, bar, outline, plateMat, barMat, outlineMat }.
 * The bar is 1 unit tall: set bar.scale.y to the height you want.
 */
export function createTownships({ cols = 5, rows = 4, size = 2.4, gap = 0.2, center = new THREE.Vector3() } = {}) {
  const group = new THREE.Group();
  const r = size - gap;
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i;
    if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a));
    else shape.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  shape.closePath();
  // Shapes are drawn in the x/y plane; rotate so they lie on the ground and extrude upwards.
  const plateGeo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  const barGeo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false }).rotateX(-Math.PI / 2);
  const edgeGeo = new THREE.EdgesGeometry(plateGeo);

  const h = Math.sqrt(3) * size;
  const width = 1.5 * size * (cols - 1);
  const depth = h * (rows - 1) + h / 2;
  const towns = [];
  for (let c = 0; c < cols; c += 1) {
    for (let k = 0; k < rows; k += 1) {
      const x = center.x - width / 2 + c * 1.5 * size;
      const z = center.z - depth / 2 + k * h + (c % 2 ? h / 2 : 0);
      const plateMat = stdMat('#15307A', { roughness: 1 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(x, 0.04, z);
      plate.receiveShadow = true;
      const barMat = stdMat('#F15BB5', { emissive: '#F15BB5', emissiveIntensity: 0.35, transparent: true, opacity: 0.85 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(x, 0.05, z);
      bar.scale.set(0.82, 0.001, 0.82);
      bar.visible = false;
      bar.castShadow = true;
      const outlineMat = new THREE.LineBasicMaterial({ color: '#5B7BD5', transparent: true, opacity: 0.55, toneMapped: false });
      const outline = new THREE.LineSegments(edgeGeo, outlineMat);
      outline.position.set(x, 0.07, z);
      group.add(plate, bar, outline);
      towns.push({ center: new THREE.Vector3(x, 0, z), plate, bar, outline, plateMat, barMat, outlineMat, col: c, row: k });
    }
  }
  return { group, towns };
}

/** Rotating cloud disc with rain. update(dt) animates it; setIntensity(0..1) fades it. */
export function createStorm({ radius = 3.4, rainHeight = 4.5 } = {}) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  const puffs = 22;
  const cloudMat = stdMat('#D7DEEC', { transparent: true, opacity: 0.85, roughness: 1 });
  const cloud = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), cloudMat, puffs);
  const o = new THREE.Object3D();
  for (let i = 0; i < puffs; i += 1) {
    // Two spiral arms around a clear eye
    const arm = i % 2;
    const t = Math.floor(i / 2) / (puffs / 2);
    const ang = arm * Math.PI + t * Math.PI * 1.6;
    const rr = radius * (0.25 + 0.75 * t);
    o.position.set(Math.cos(ang) * rr, 0.25 * Math.sin(i * 1.7), Math.sin(ang) * rr);
    o.scale.set(0.9 + 0.5 * (1 - t), 0.45, 0.9 + 0.5 * (1 - t));
    o.updateMatrix();
    cloud.setMatrixAt(i, o.matrix);
  }
  cloud.castShadow = true;
  spin.add(cloud);

  const drops = 360;
  const pos = new Float32Array(drops * 3);
  for (let i = 0; i < drops; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * radius;
    pos[i * 3] = Math.cos(a) * rr;
    pos[i * 3 + 1] = -Math.random() * rainHeight;
    pos[i * 3 + 2] = Math.sin(a) * rr;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rainMat = new THREE.PointsMaterial({ color: '#9EC9FF', size: 0.09, transparent: true, opacity: 0.75, depthWrite: false });
  const rain = new THREE.Points(rainGeo, rainMat);
  rain.frustumCulled = false;
  group.add(rain);

  let reduced = false;
  return {
    group,
    setReducedMotion(on) { reduced = on; },
    update(dt) {
      if (!group.visible || reduced) return;
      spin.rotation.y -= dt * 0.7;
      const p = rainGeo.attributes.position.array;
      for (let i = 1; i < p.length; i += 3) {
        p[i] -= dt * 7;
        if (p[i] < -rainHeight) p[i] += rainHeight;
      }
      rainGeo.attributes.position.needsUpdate = true;
    },
    setIntensity(v) {
      group.visible = v > 0.01;
      cloudMat.opacity = 0.85 * v;
      rainMat.opacity = 0.75 * v;
    },
  };
}

/**
 * Cone of uncertainty along a track (array of ground points). Width grows from w0 to w1.
 * Returns { group, curve, setOpacity(v) }.
 */
export function createForecastCone(points, { w0 = 1.2, w1 = 8, color = '#9EC9FF', samples = 40 } = {}) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const verts = [];
  const idx = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(up, tan).normalize();
    const w = (w0 + (w1 - w0) * t) / 2;
    verts.push(p.x + side.x * w, 0.06, p.z + side.z * w, p.x - side.x * w, 0.06, p.z - side.z * w);
    if (i < samples) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  const mat = glowMat(color, { opacity: 0.16, blending: THREE.NormalBlending, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(geo, mat);

  const linePts = curve.getPoints(60).map((p) => new THREE.Vector3(p.x, 0.08, p.z));
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  const lineMat = new THREE.LineDashedMaterial({ color, dashSize: 0.6, gapSize: 0.4, transparent: true, opacity: 0.8 });
  const line = new THREE.Line(lineGeo, lineMat);
  line.computeLineDistances();
  group.add(cone, line);
  return {
    group,
    curve,
    setOpacity(v) {
      group.visible = v > 0.01;
      mat.opacity = 0.16 * v;
      lineMat.opacity = 0.8 * v;
    },
  };
}
