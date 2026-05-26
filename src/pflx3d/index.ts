// Public entry — bundled to public/pflx3d.js as a single IIFE that exposes
// `window.Pflx3D.mount(opts)`. The existing pathway.html runtime stays in
// charge of game state; this module only renders the 3D view of it.

import { PflxScene } from './scene';
import type { MountOptions, Pflx3DApi } from './types';

function mount(opts: MountOptions): Pflx3DApi {
  if (!opts || !opts.container) {
    throw new Error('[pflx3d] mount() requires { container: HTMLElement }');
  }
  return new PflxScene(opts);
}

// Bind to window for the IIFE bundle. The build script wraps this file in
// `(() => { ... })()` so all of three.js stays scoped to the bundle.
(window as any).Pflx3D = { mount };

// Also export named for the rare case someone imports this as an ES module.
export { mount };
export type { MountOptions, Pflx3DApi, ShipState, CameraMode } from './types';
