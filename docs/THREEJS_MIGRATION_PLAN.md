# Core Pathways — Three.js Migration Plan

**Status:** Proposed
**Author:** Engineering
**Last updated:** 2026-04-28
**Scope:** Replace the CSS pseudo-3D chase/cockpit camera system in `pathway.html` with a real WebGL scene built on `@react-three/fiber`.

---

## 1. Why migrate

### 1.1 What we have today

The current "3D" in Core Pathways is a CSS illusion. In `pathway.html` (`applyTransform()` around line 3528):

- `#nodeLayer` gets `transform: rotateX(18deg)` (chase) or `rotateX(40deg)` (cockpit).
- Every `.skill-node` is then individually counter-rotated by `-tiltX` to face the camera (billboarding via DOM).
- The discovery layer, parallax depth layers, and `#pflxShip` (an inline SVG) are all dragged through the same compositor pipeline.

### 1.2 Why it breaks

This pattern has three structural problems we cannot solve cleanly inside the CSS approach:

1. **Compositor cost scales with node count.** Every frame, the browser re-evaluates a `rotateX` on the parent layer plus an inverse `rotateX` on each of N skill nodes. With our current map sizes that's hundreds of GPU layer recompositions per frame. Pan/zoom while in chase mode is where the worst jank shows up.
2. **`z-index` is unreliable in 3D contexts.** `position: absolute; z-index: 100` does not guarantee front-most when a `transform-style: preserve-3d` ancestor exists. The ship has been disappearing because its computed Z in 3D space drifts behind tilted siblings — a problem we can patch (Plan A did) but cannot eliminate while we're using DOM 3D.
3. **No real lighting, depth-of-field, post-processing, or particle systems.** Everything has to be faked with CSS — drop shadows for "glow," opacity gradients for "atmosphere," CSS-animated SVGs for "exhaust." Each fake costs paint time and none of them composite together correctly.

### 1.3 What we get from real WebGL

- **One draw loop, GPU compositing.** A single `<canvas>` renders the entire scene. The browser is not asked to lay out, paint, and composite hundreds of DOM nodes per frame.
- **Real camera math.** A `PerspectiveCamera` with `lookAt()` and a chase target produces buttery follow-cam behavior with smoothing (`lerp`) on `requestAnimationFrame`.
- **Real depth.** Z-ordering is solved by the depth buffer, not by us guessing `z-index`.
- **Composable effects.** Bloom on the ship engine, chromatic aberration on the edges, atmospheric fog, particle exhaust trails — all out-of-the-box from `@react-three/drei` and `@react-three/postprocessing`.
- **Headroom.** When we add planet flybys, asteroid fields, or the cockpit "warp" sequence, we won't be fighting the platform.

---

## 2. Target architecture

### 2.1 Library stack

| Library | Purpose |
| --- | --- |
| `three` | Core WebGL engine. |
| `@react-three/fiber` | React renderer for Three.js. Lets us declare the scene as JSX. |
| `@react-three/drei` | Helpers we'll lean on heavily: `PerspectiveCamera`, `CameraShake`, `Stars`, `Trail`, `Float`, `Html` (for DOM-in-3D when needed), `useGLTF`. |
| `@react-three/postprocessing` | Bloom, chromatic aberration, vignette, noise. |
| `three-stdlib` | Loaders (`GLTFLoader`), controls. |
| `leva` *(dev only)* | Live tweak panel for tuning camera distance, bloom strength, etc. Strip from prod build. |

Optional later (only if we add collisions or inertia):

- `@react-three/rapier` — physics.

### 2.2 Scene graph (target)

```
<Canvas>                              ← single WebGL surface
  <PflxScene>
    <SpaceBackdrop />                 ← <Stars/>, parallax nebulas (sprites)
    <Galaxies />                      ← instanced quads, GPU-driven drift
    <PathwayMap>                      ← the existing 5000×5000 map, projected onto a plane
      <SkillNode />  × N              ← billboarded sprites or low-poly meshes
      <DiscoveryGlow />               ← additive sprites
      <ConnectionLines />             ← <Line/> from drei
    </PathwayMap>
    <Ship>                            ← gltf model + <Trail/> for engine
      <ParticleEngine />
    </Ship>
    <ChaseCamera target={shipRef} />
  </PflxScene>
  <EffectComposer>
    <Bloom intensity={0.8} mipmapBlur />
    <ChromaticAberration offset={[0.001, 0.001]} />
    <Vignette darkness={0.4} />
  </EffectComposer>
</Canvas>
```

### 2.3 Chase camera pattern

The standard react-three-fiber follow-cam — what we're aiming for:

```jsx
function ChaseCamera({ target }) {
  const { camera } = useThree();
  const offset = new THREE.Vector3(0, 5, 12); // behind + above
  const desired = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  useFrame(() => {
    if (!target.current) return;
    desired.copy(offset).applyQuaternion(target.current.quaternion);
    desired.add(target.current.position);
    camera.position.lerp(desired, 0.08);     // smoothing
    lookAt.copy(target.current.position);
    camera.lookAt(lookAt);
  });
  return null;
}
```

`lerp` is the difference between "snappy" and "buttery." 0.08 is a good starting value; expose it on the leva panel.

---

## 3. Migration phases

I'm proposing **five phases**, each landable in its own commit/PR. Phases 1–3 can ship behind a feature flag (`NEXT_PUBLIC_PFLX_3D=true`) so we can A/B test before cutting over.

### Phase 1 — Scaffolding (½ day)

- Install deps: run `./scripts/install-3d-deps.sh` (or `npm install` if the deps are already in `package.json`, which they are after this plan was committed).
  - **Peer-dep gotcha:** the latest `@react-three/fiber@9` requires React 19. This project is on React 18, so we pin to `@react-three/fiber@^8.17.10` and `@react-three/drei@^9.114.0`. Both are the last React-18-compatible majors. A repo-level `.npmrc` with `legacy-peer-deps=true` is committed so future installs don't trip on the optional `expo` peer.
  - Dev deps: `@types/three`, `leva` (live-tweak panel; strip from prod bundle).
- Create `components/pflx3d/` directory with:
  - `Pflx3DCanvas.tsx` — top-level `<Canvas>` wrapper.
  - `ChaseCamera.tsx`
  - `Ship.tsx` (placeholder cube for now)
  - `index.ts`
- Add a feature flag: `NEXT_PUBLIC_PFLX_3D` in `.env.local` and a guard in `pathway.html`'s mount logic.
- Render `<Pflx3DCanvas />` in a fixed-position `<div>` over the existing CSS scene with `pointer-events: none`. **Don't hide the CSS scene yet.**
- Smoke test: a spinning cube where the ship would be, reading the ship's `(x, y)` from the existing state.

**Exit criteria:** WebGL canvas mounts, FPS stays ≥ 55 on M1, no regression to the CSS scene.

### Phase 2 — The ship and chase cam (1 day)

- Replace placeholder cube with the existing SVG converted to a low-poly mesh, OR ship a GLB. Recommended: hand the existing SVG to a designer for a quick GLB export; until then, build the ship from primitives (`<Cone>` + `<Box>` for wings + emissive material).
- Implement `ChaseCamera` with the lerp pattern above.
- Bind ship rotation to existing input (the same `--ship-rotate` CSS variable we use today, now read into a quaternion).
- Add `<Trail width={2} length={6} color="#00e5ff" />` from drei for the engine plume.
- **Hide the CSS ship** when the 3D flag is on.

**Exit criteria:** Pressing forward/turn keys flies a 3D ship through empty space. Camera follows smoothly. No glitches.

### Phase 3 — The map and nodes (2 days)

This is the riskiest phase because the skill node interaction model has to keep working — clicks, hovers, tooltips, badge popovers, the discovery glow.

- Project the 5000×5000 map onto an XZ plane (`PlaneGeometry`).
- Render skill nodes as **instanced billboards** (one `InstancedMesh` for performance) with per-node emissive color driven by node state (locked/unlocked/mastered).
- For DOM interactivity (click, hover, the existing tooltip system), use drei's `<Html occlude>` per node — but **only for the active/hovered node**, never N at once. The mass of nodes stays as instanced 3D; a single Html overlay handles the popover for whichever one the cursor is over.
- Connection lines: drei's `<Line>` or a `LineSegments` instanced primitive.
- Discovery layer: additive-blend sprite particles.

**Exit criteria:** The full pathway is navigable in 3D, every interaction that worked in 2D still works, and FPS stays ≥ 50 on a mid-range laptop with 500+ nodes.

### Phase 4 — Atmosphere & polish (1 day)

- `<Stars />` from drei replaces the parallax star CSS layers.
- `<EffectComposer>` with bloom (engine glow, mastered-node glow), chromatic aberration on the edges, subtle vignette.
- Camera shake on boost (`<CameraShake>` from drei, only while boost key is held).
- Cockpit mode: same camera, smaller offset (`new Vector3(0, 1.5, 3)`), wider FOV (90°).
- Galaxy backdrop: sprites with custom shader for the breathing effect we already have.

**Exit criteria:** It looks better than the CSS version. Subjective but checkable — record a 10-second clip of each, side by side.

### Phase 5 — Cutover and CSS cleanup (½ day)

- Flip `NEXT_PUBLIC_PFLX_3D` to `true` by default in production.
- Delete the CSS `rotateX` + counter-rotation logic from `applyTransform()` (lines ~3528–3596).
- Delete `#pflxShip` SVG and its CSS animations.
- Keep the 2D fallback path for low-WebGL devices: `if (!WebGLRenderingContext) { renderCSS2DFallback(); }`. The fallback is the current code minus the broken pseudo-3D — i.e., birdseye-only.
- Update analytics: log `pflx_render_mode` so we can monitor rollout.

**Exit criteria:** All CSS pseudo-3D code paths removed, fallback verified on a no-WebGL test profile, error rate flat or down for 7 days post-cutover.

---

## 4. Risks and mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Skill-node click/hover interactions break in 3D. | High | Phase 3 dedicated to this. Use `<Html occlude>` only for the active node, never globally. Write Playwright tests for click → tooltip → badge flow before Phase 3 lands. |
| Performance worse than CSS on low-end devices. | Medium | Instanced meshes for nodes. Use `frameloop="demand"` when nothing is moving. Provide CSS fallback (Phase 5). |
| Ship GLB asset isn't ready. | Medium | Build ship from primitives in Phase 2; swap to GLB whenever it lands. Don't gate the migration on art. |
| Bundle size balloon (three is ~600KB gzipped). | Low | Dynamic-import `Pflx3DCanvas` so the WebGL bundle only loads when the user enters a pathway. Acceptable cost given pathway is the core feature. |
| iOS Safari memory pressure. | Medium | Cap `pixelRatio` at 2, lazy-init the renderer, drop bloom on devices with `navigator.deviceMemory < 4`. |

---

## 5. Effort & sequencing

**Total estimate: 5 working days** if the existing skill-node interaction surface is what I think it is. Phase 3 is the swing factor — could be 1 day or 3 depending on how many edge cases the current DOM interactions hide.

| Phase | Days | Can ship behind flag? |
| --- | --- | --- |
| 1. Scaffolding | 0.5 | Yes |
| 2. Ship + chase cam | 1 | Yes |
| 3. Map + nodes | 2 | Yes |
| 4. Atmosphere | 1 | Yes |
| 5. Cutover | 0.5 | N/A — final |

Recommended sequencing: **land Phase 1 immediately** so the scaffolding exists, then prioritize against the master-host Mimic Player feature based on user impact.

---

## 6. Open questions

1. **Ship art.** Do we have a designer cycle for a GLB, or do we ship with primitives? My recommendation is primitives now, GLB later — don't block on art.
2. **Cockpit mode.** Today it's a deeper CSS tilt. In WebGL it should be a true first-person camera mounted at the ship's nose. Confirm the UX intent.
3. **Mobile.** Is mobile a target for the 3D mode, or do we ship CSS-only on phones? My recommendation: 3D on tablet+, CSS fallback on phone.
4. **Discovery layer.** Today this is its own DOM layer. Should it become particles in 3D, or stay as Html-overlaid hotspots? Particles are prettier; Html is easier to port.

---

## 7. Definition of done

- Plan A's CSS quick-fix is reverted (the 3D path supersedes it).
- `NEXT_PUBLIC_PFLX_3D=true` is the default.
- The CSS pseudo-3D code in `applyTransform()` is deleted.
- A 2D birdseye fallback exists for no-WebGL clients.
- FPS ≥ 50 on M1 / mid-range laptop with a fully populated map.
- Playwright suite covering: enter pathway → fly to node → click node → see tooltip → claim badge — passes in both 3D and fallback modes.
- Bundle delta documented in PR description; dynamic-import prevents pathway WebGL JS from loading on non-pathway routes.
