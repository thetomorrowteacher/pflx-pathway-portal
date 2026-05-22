# Phase 1 — Three.js Migration Scaffolding (DONE)

**What landed in this session.**

## Files added

```
src/pflx3d/
├── index.ts          # entry — binds window.Pflx3D.mount
├── scene.ts          # Scene/Renderer/loop + map→world projection
├── chase-camera.ts   # follow-cam with .lerp smoothing
├── ship.ts           # placeholder ship from primitives
└── types.ts          # ShipState / CameraMode / API contract

scripts/
└── build-3d.mjs      # esbuild → public/pflx3d.js (single-file IIFE)

docs/
├── THREEJS_MIGRATION_PLAN.md   # the full 5-phase plan
└── PHASE_1_DONE.md              # this file
```

## Files edited

- `package.json` — added `build:3d` and `watch:3d` scripts; added
  `@react-three/rapier` to dependencies (per the upgrade-table screenshot).
- `pathway.html` — added a guarded `<script>` block at the bottom that mounts
  the 3D canvas as an overlay when the flag is set. The existing CSS scene is
  unchanged.
- `.npmrc` — `legacy-peer-deps=true` (so r3f's optional `expo` peer doesn't
  block install).
- `scripts/install-3d-deps.sh` — added `@react-three/rapier`.

## Run this in the morning

```bash
cd "/Users/ejohnson/Desktop/PFLX Apps/Core Pathway Development/pflx-pathway-portal"

# 1. Pick up @react-three/rapier (added to package.json)
npm install --legacy-peer-deps

# 2. Build the Phase 1 bundle
npm run build:3d
# → writes public/pflx3d.js + sourcemap

# 3. Open pathway.html in the browser with the flag on:
#    <pathway-url>?pflx3d=1
#    or in DevTools console:    localStorage.PFLX_3D_ENABLED = '1'; location.reload();
```

## What you should see

A WebGL canvas overlays the existing CSS scene. In the center of the
viewport: a low-poly placeholder ship (gray fuselage, two angled wings,
glowing cyan engine) sitting on a faint reference grid, surrounded by a
starfield. The chase camera follows the ship; switching the existing
`pflxCamera.mode` to `cockpit` widens the FOV. Birdseye mode hides the 3D
canvas entirely — the existing CSS scene takes over.

## What you should NOT see yet

- Skill-node graph in 3D (Phase 3)
- Engine trail / bloom / chromatic aberration (Phase 4)
- Any change to default behavior — the flag is opt-in

## How the bridge works

`pathway.html` reads `pflxShipState` (the global the existing simulation
already maintains for ship position/heading) on every animation frame and
mirrors it into the 3D scene via `api.updateShip(...)`. Camera mode follows
`pflxCamera.mode`. If those globals don't exist yet, the bridge sits dormant
and the canvas just renders an idle ship — nothing breaks.

## Next phase (Phase 2)

Per the migration plan: replace the placeholder ship with the existing SVG
exported as a GLB (or keep the primitive ship + add `<Trail>`-style engine
plume), then bind input keys to the 3D heading instead of the CSS
`--ship-rotate` variable. Effort estimate: 1 day.
