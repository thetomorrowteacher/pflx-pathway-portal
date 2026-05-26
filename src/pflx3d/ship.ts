import * as THREE from 'three';
import type { ShipState } from './types';

// Phase 1 placeholder ship: a low-poly built from primitives so we don't block
// on a GLB asset. Phase 2 swaps this for a proper model.
//
// Geometry choice: a flat triangular fuselage + two angled wings + a small
// emissive engine block. Visible from any angle, distinct silhouette,
// reads as a "ship" without any texture work.

export class Ship {
  readonly group: THREE.Group;
  private engine: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Pflx3DShip';

    // Fuselage — long thin pyramid pointing forward (+X)
    const fuselageGeom = new THREE.ConeGeometry(0.6, 2.4, 6);
    fuselageGeom.rotateZ(-Math.PI / 2); // point along +X
    const fuselage = new THREE.Mesh(
      fuselageGeom,
      new THREE.MeshStandardMaterial({
        color: 0x2a2f3a,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.18,
        metalness: 0.6,
        roughness: 0.35,
      }),
    );
    this.group.add(fuselage);

    // Wings — two thin slabs angled back
    const wingGeom = new THREE.BoxGeometry(1.6, 0.08, 1.0);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d24,
      emissive: 0x00b0d0,
      emissiveIntensity: 0.1,
      metalness: 0.55,
      roughness: 0.4,
    });
    const wingL = new THREE.Mesh(wingGeom, wingMat);
    wingL.position.set(-0.2, 0, 0.7);
    wingL.rotation.y = -0.25;
    this.group.add(wingL);
    const wingR = new THREE.Mesh(wingGeom, wingMat);
    wingR.position.set(-0.2, 0, -0.7);
    wingR.rotation.y = 0.25;
    this.group.add(wingR);

    // Engine block — emissive, glows on boost
    const engineGeom = new THREE.CylinderGeometry(0.25, 0.35, 0.4, 12);
    engineGeom.rotateZ(Math.PI / 2);
    this.engine = new THREE.Mesh(
      engineGeom,
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.4,
      }),
    );
    this.engine.position.set(-1.1, 0, 0);
    this.group.add(this.engine);
  }

  /** Apply the simulation state to the 3D group. Map-space → world-space mapping
   * is delegated to the caller (PflxScene) so the ship doesn't need to know
   * the map dimensions. */
  apply(worldX: number, worldZ: number, state: ShipState) {
    this.group.position.set(worldX, 0, worldZ);
    this.group.rotation.y = -state.heading; // three.js Y-up; +X forward
    this.group.rotation.z = state.roll ?? 0;

    const mat = this.engine.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = state.boosting ? 2.6 : 1.4;
  }
}
