// Public types for the pflx3d module — the contract between the bundled
// three.js stub and the existing vanilla pathway.html runtime.

export interface ShipState {
  /** Map-space x, in the same coordinate frame as the existing CSS scene (0..MAP_W). */
  x: number;
  /** Map-space y (0..MAP_H). */
  y: number;
  /** Heading in radians, 0 = facing positive X axis. */
  heading: number;
  /** Optional roll for banking; small angles only. */
  roll?: number;
  /** Boost on/off — drives camera shake and engine glow. */
  boosting?: boolean;
}

export type CameraMode = 'birdseye' | 'chase' | 'cockpit';

export interface MountOptions {
  /** Element to attach the WebGL canvas to. Will be resized to fill the parent. */
  container: HTMLElement;
  /** Initial camera mode; matches the existing pflxCamera.mode values. */
  mode?: CameraMode;
  /** Initial ship state. */
  ship?: Partial<ShipState>;
  /** If true, the canvas captures pointer events. Default false (overlay only). */
  capturePointerEvents?: boolean;
}

export interface Pflx3DApi {
  /** Update the ship's position/heading from the existing simulation. */
  updateShip(state: Partial<ShipState>): void;
  /** Switch the camera mode (birdseye disables 3D rendering). */
  setMode(mode: CameraMode): void;
  /** Tear down the renderer and remove the canvas. */
  unmount(): void;
}

declare global {
  interface Window {
    /** Set to true (e.g. via querystring or env) to enable the 3D canvas. */
    PFLX_3D_ENABLED?: boolean;
    /** Mount entry point exposed by the bundled IIFE. */
    Pflx3D?: {
      mount(opts: MountOptions): Pflx3DApi;
    };
  }
}
