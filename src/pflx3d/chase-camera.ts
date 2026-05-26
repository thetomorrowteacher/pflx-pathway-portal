import * as THREE from 'three';
import type { CameraMode } from './types';

// Chase / cockpit camera. The standard r3f follow-cam pattern, written
// against vanilla three.js so it can run without React.
//
// Per phase plan: the offset is rotated by the ship's heading, then
// position is lerped toward the desired pose every frame for smoothing.
// `lerp = 0.08` is a comfortable starting value — exposed as a public
// field so a leva panel (or query-string knob) can tune it later.

const CHASE_OFFSET = new THREE.Vector3(-7, 4, 0); // behind & above (+X is forward)
const COCKPIT_OFFSET = new THREE.Vector3(-1, 1.0, 0); // tucked just behind nose

export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera;
  /** Smoothing factor: 0 = frozen, 1 = snap. */
  lerp = 0.08;
  private mode: CameraMode = 'chase';
  private desired = new THREE.Vector3();
  private target = new THREE.Vector3();
  private offset = CHASE_OFFSET.clone();

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
    this.camera.position.set(0, 50, 0);
    this.camera.lookAt(0, 0, 0);
  }

  setMode(mode: CameraMode) {
    this.mode = mode;
    if (mode === 'cockpit') {
      this.offset.copy(COCKPIT_OFFSET);
      this.camera.fov = 90;
    } else {
      this.offset.copy(CHASE_OFFSET);
      this.camera.fov = 60;
    }
    this.camera.updateProjectionMatrix();
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Run every frame. `shipObj` is the ship's THREE.Group. */
  update(shipObj: THREE.Object3D) {
    if (this.mode === 'birdseye') return;

    // desired = shipPos + offset.applyQuaternion(shipRotation)
    this.desired.copy(this.offset).applyQuaternion(shipObj.quaternion);
    this.desired.add(shipObj.position);

    this.camera.position.lerp(this.desired, this.lerp);

    this.target.copy(shipObj.position);
    if (this.mode === 'cockpit') {
      // Look slightly forward of the ship, not at it
      const forward = new THREE.Vector3(5, 0, 0).applyQuaternion(shipObj.quaternion);
      this.target.add(forward);
    }
    this.camera.lookAt(this.target);
  }
}
