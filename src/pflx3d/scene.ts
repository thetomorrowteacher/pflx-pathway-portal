import * as THREE from 'three';
import type { CameraMode, MountOptions, Pflx3DApi, ShipState } from './types';
import { Ship } from './ship';
import { ChaseCamera } from './chase-camera';

// Top-level scene wrapper for the Phase 1 stub.
//
// What it does:
//   - Owns a single WebGLRenderer + Scene
//   - Renders a starfield, the placeholder ship, and a ground reference grid
//   - Drives a ChaseCamera that follows the ship
//   - Exposes a tiny imperative API (mount/updateShip/setMode/unmount)
//
// What it does NOT do yet (deferred to Phases 2-5):
//   - Render the skill-node graph (Phase 3)
//   - Bloom / chromatic aberration / camera shake (Phase 4)
//   - Replace the existing CSS scene (Phase 5)

const MAP_W = 5000;
const MAP_H = 5000;

// Map-space (0..MAP_W, 0..MAP_H) → world-space (XZ plane, centered).
// One world unit ≈ one CSS pixel divided by `mapScale` for sane camera distances.
const MAP_SCALE = 50; // 5000 / 50 = 100 world units across

function mapToWorldX(x: number) {
  return (x - MAP_W / 2) / MAP_SCALE;
}
function mapToWorldZ(y: number) {
  return (y - MAP_H / 2) / MAP_SCALE;
}

export class PflxScene implements Pflx3DApi {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private chaseCam: ChaseCamera;
  private ship: Ship;
  private shipState: ShipState;
  private mode: CameraMode;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(opts: MountOptions) {
    this.container = opts.container;
    this.mode = opts.mode ?? 'chase';
    this.shipState = {
      x: opts.ship?.x ?? MAP_W / 2,
      y: opts.ship?.y ?? MAP_H / 2,
      heading: opts.ship?.heading ?? 0,
      roll: opts.ship?.roll ?? 0,
      boosting: opts.ship?.boosting ?? false,
    };

    const { clientWidth, clientHeight } = this.container;
    const aspect = clientWidth / Math.max(1, clientHeight);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(clientWidth, clientHeight, false);
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = opts.capturePointerEvents ? 'auto' : 'none';
    canvas.style.zIndex = '50';
    this.container.appendChild(canvas);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040816, 0.0035);

    // Lights
    const hemi = new THREE.HemisphereLight(0x88aaff, 0x101015, 0.6);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(20, 40, 10);
    this.scene.add(key);

    // Reference grid — same XZ plane the map will project onto in Phase 3
    const grid = new THREE.GridHelper(200, 40, 0x123a55, 0x0a2030);
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    (grid.material as THREE.LineBasicMaterial).opacity = 0.35;
    this.scene.add(grid);

    // Starfield
    this.scene.add(this.makeStars(2000, 600));

    // Ship
    this.ship = new Ship();
    this.scene.add(this.ship.group);
    this.applyShip();

    // Camera
    this.chaseCam = new ChaseCamera(aspect);
    this.chaseCam.setMode(this.mode);

    // Resize
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);

    // Start loop
    this.tick();
  }

  private makeStars(count: number, radius: number) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // uniform on sphere surface
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.6 + 0.4 * Math.random());
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xcfe8ff,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });
    return new THREE.Points(geom, mat);
  }

  private onResize() {
    const { clientWidth, clientHeight } = this.container;
    this.renderer.setSize(clientWidth, clientHeight, false);
    this.chaseCam.setAspect(clientWidth / Math.max(1, clientHeight));
  }

  private applyShip() {
    this.ship.apply(
      mapToWorldX(this.shipState.x),
      mapToWorldZ(this.shipState.y),
      this.shipState,
    );
  }

  private tick = () => {
    this.applyShip();
    this.chaseCam.update(this.ship.group);
    this.renderer.render(this.scene, this.chaseCam.camera);
    this.rafId = requestAnimationFrame(this.tick);
  };

  // ---- Public API ----

  updateShip(state: Partial<ShipState>) {
    Object.assign(this.shipState, state);
  }

  setMode(mode: CameraMode) {
    this.mode = mode;
    this.chaseCam.setMode(mode);
    // Birdseye: hide canvas so the existing CSS scene shows through
    this.renderer.domElement.style.display = mode === 'birdseye' ? 'none' : '';
  }

  unmount() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
