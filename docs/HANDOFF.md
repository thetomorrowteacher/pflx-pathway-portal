# PFLX Session Handoff — Cartridge / Module System

**Purpose:** This document exists so a new Claude session (e.g. after porting to
a new computer) can resume PFLX work without losing the context built up over
the previous session. Read this top-to-bottom; everything you need is here or
linked from here.

**Owner:** Ennis · `info@thetomorrowteacher.org` · GitHub org `thetomorrowteacher`

---

## 1. The 30-second orientation

PFLX (Prototype FLX) is a gamified education platform. This session designed and
shipped a **Module / Cartridge system** that lets a host upload a self-contained
learning experience (a "Module") into a node on a Core Pathways map, and have it
work without any custom wiring. Think Nintendo cartridge plugged into a console:
the Node is the drive, the Module is the cartridge, and the **Connector** is
the slot — a versioned `postMessage` protocol between them.

The session also wrote the canonical Module structure (anchored to the FLX
Curriculum Framework — Engagement → Development → Enhancement → Fulfillment),
built the first working Module (Storybuilding & Storyboarding), wired it into
two real Core Pathways nodes, and closed the loop by routing module completions
into the Console's unified Approvals Queue with reward payout on approve.

Everything below this is the detail. If you only have time for one section
after this one, read §4 (Locked decisions).

---

## 2. Repos and deployments

| Repo | URL | Latest commit (session end) | Auto-deploys to |
|------|-----|-----------------------------|-----------------|
| `pflx-pathway-portal` | https://github.com/thetomorrowteacher/pflx-pathway-portal | `4547106` | Vercel |
| `pflx-platform` (the Console; folder on disk is `pflx-platform-check`) | https://github.com/thetomorrowteacher/pflx-platform | `fbc0124` | Vercel |

Working-folder layout on disk (mount these in Cowork):

```
~/Desktop/PFLX Apps/
├── Core Pathway Development/
│   └── pflx-pathway-portal/         ← clone of pflx-pathway-portal repo
└── PFLX Overlay/
    └── pflx-platform-check/         ← clone of pflx-platform repo
```

To rebuild this layout on a new machine, see §11.

---

## 3. Commits made in this session (chronological)

All on `main`, all pushed.

`pflx-pathway-portal`:

| Hash | Subject |
|------|---------|
| `5be2158` | Add PFLX Module system: Connector + Module Structure specs, Storybuilding module |
| `277513b` | Wire Storybuilding module into Core Pathways nodes via the Connector |
| `46cd299` | Connector: route Module completion to Approvals Queue + relay approval result |
| `4547106` | Recover three.js scaffold: `src/pflx3d` + `scripts/` + `.npmrc` |

`pflx-platform`:

| Hash | Subject |
|------|---------|
| `fbc0124` | Console: receive Module completions into the unified Approvals Queue |

---

## 4. Locked decisions — DO NOT re-litigate without explicit user OK

These were chosen deliberately with the user this session. They are settled.

1. **Three Module types** — Course, Project, Quest. Quest is **paused** (not
   developed further this session; design stub is in §7 of `MODULE_STRUCTURE.md`).
2. **All Module types run the FLX framework** — Engagement → Development
   (Ideation + Creation) → Enhancement → Fulfillment. The placeholder E.P.I.C.
   and 4-D cycles are dropped. The framework comes from the user's existing
   *FLX Curriculum Planner 2023–2024*.
3. **Per-phase FLX objective tagging** — each phase declares its
   `flxObjectives` (e.g. `["FLX.CN.1", "FLX.ID.2"]`). The crosswalk to
   ISTE / CASEL / 21st-Century / UDL / Arts / MYP Design is **PFLX reference
   data**, not stored in the cartridge — keeps cartridges lean.
4. **UbD authoring** — each phase mirrors the Curriculum Planner's three stages:
   Desired Results / Assessment Evidence / Learning Plan.
5. **Per-node upload** — Modules are uploaded directly to the Node that runs
   them. No shared Mission Control library. A Quest `.pflx` can bundle its
   child modules.
6. **Module package extension** — `.pflx` (a zip).
7. **Approval-gated completion** — a Module never pays itself. On
   `pflx_mod_complete`, the Node builds a *Completion Record* and posts it to
   the Platform's **single unified Approvals Queue** (same panel as task,
   pitch, arena_external). Reward pays only when a host approves.
8. **Co-op session size cap = 4 players.** Enforced by the Node.
9. **Offline play allowed.** The Node buffers the Save Slot locally and syncs
   on reconnect, last-write-wins on `updatedAt`. Co-op is live-only.
10. **Quizzes / CFUs live inside Module content.** The Node does NOT read quiz
    scores. Non-final phase gates are Module-internal; only the Fulfillment
    `submission` gate is a real Node-enforced contract.
11. **`moduleId` is auto-derived from the manifest.** No central ID minting
    (consequence of per-node upload).
12. **Builder UI is required** for module authoring — hosts won't hand-edit
    `manifest.json`. The Builder is the **next major piece of work** (not yet
    started).
13. **`course.json` (slide-based) is the LEGACY format** — see
    `pflx-pathway-portal/courses/graphic-design-concepts/`. The CANONICAL
    format is phase-based `manifest.json` per `MODULE_STRUCTURE.md` v0.2. New
    modules use the canonical format; the existing graphic-design course is to
    be migrated later.

---

## 5. The specs in this repo (read these in order)

Both live in `pflx-pathway-portal/docs/`:

1. **`CONNECTOR_CONTRACT.md` — v0.4** — the node↔module postMessage protocol.
   All open questions resolved; ready to freeze as v1.0 on next review.
2. **`MODULE_STRUCTURE.md` — v0.2 body + v0.3 addendum (§14)** — what's inside
   a `.pflx` cartridge. The v0.2 body covers the FLX-strand phase model,
   per-phase objective tagging, UbD anatomy, the three Module types, and the
   single-tier manifest schema. The **v0.3 addendum** layers a tiered
   (Starter/Novice/Pro) model on top: tier-aware manifest shape, badge
   convention `<moduleId>-<tier>`, save scoping per (player, node, tier),
   co-op gated to `moduleType: "project"`, and tier-picker UX. v0.2
   single-tier modules are backwards-compatible (implicitly Novice). §14.8
   has four new open questions, each with a default proposal. Once reviewed,
   fold the addendum into the body as v0.3.

Other docs:

- `docs/THREEJS_MIGRATION_PLAN.md` — older three.js migration proposal
  (not part of this session's main thread, but lives here).
- `docs/PHASE_1_DONE.md` — three.js phase 1 record.

There is a stale duplicate at the repo root (`THREE_JS_MIGRATION_PLAN.md`,
shorter, older) that is intentionally NOT committed. Do not commit it; the
canonical doc is the one in `docs/`.

---

## 6. Open questions on the Module spec

From `MODULE_STRUCTURE.md` §13, after this session's resolutions:

| # | Question | Status |
|---|---------|--------|
| 1 | Quest stage references — bundled `.pflx` inside the Quest package, or pointer? | **Open** (Quest paused, defer until Quest is unpaused) |
| 2 | Phase content authoring | **Resolved** — Builder UI |
| 3 | CFU / quiz item format | **Resolved** — fully inside Module content |
| 4 | Objective completion granularity (per-phase gate vs whole-module approval) | **Resolved** — per `MODULE_STRUCTURE.md` §14.7, marked met on tier-completion approval |
| 5 | DIX vs FLX variant — separate framework or branding overlay? | **Open** |
| 6 | Per-phase reward weighting within the node's XC ceiling | **Resolved** — per-tier `suggestedReward` in v0.3 (§14.7), node `xcReward` still clamps |

None of the open ones are blockers — they are refinements.

---

## 7. The first real Module — Storybuilding & Storyboarding

Built end-to-end from the user's Google Slides deck. The proof-of-concept that
the phase-based format works.

**Source folder:** `pflx-pathway-portal/modules/storybuilding-storyboarding/`

- `manifest.json` — 4 FLX phases, every phase tags `flxObjectives`, UbD fields,
  gates, `suggestedReward { xc: 200, badgeIds: ["visual-storyteller"] }`,
  `taskCriteria` for host grading.
- `viewer.html` — self-contained vanilla-JS phase-based renderer. PFLX cyan
  aesthetic, phase rail on the left, content stage on the right. Block
  renderers for `markdown`, `callout`, `video`, `image`, `tool`, `diagnostic`
  (confidence ranker), `activity` (multi-field task with live "complete"
  button), `reflection`, `submission` (link + file + description, validates
  min length). Speaks the full Connector. Standalone fallback if no Node is
  the parent (persists to `localStorage`). Has a minimal markdown parser, a
  toast notifier (uses `setTimeout` — `requestAnimationFrame` was removed
  during testing for env-portability), and a save indicator.
- `host.html` — host-facing module dashboard. Shows the FLX map, all targeted
  objectives, the standards crosswalk (PFLX reference data), task criteria, and
  the approval/reward flow summary.
- `..` (parent): `modules/storybuilding-storyboarding.pflx` — the zipped
  package (`manifest.json` + `viewer.html` + `host.html`).

**Phase mapping of the deck:**

| FLX Strand | What's in this Course |
|---|---|
| Engagement (CN) | Diagnostic confidence ranker (8 items) + warm-up "story that stuck with you" reflection. **Scaffolded** — the deck had no diagnostic. |
| Development (ID + CR) | *Ideation segment:* the 7 elements + "build your story" structured activity (Plot Factory). *Creation segment:* storyboarding concept + "draft your storyboard" activity (Slides/Canva templates). Straight from the deck. |
| Enhancement (RE) | Peer feedforward, refinement pass, reflection. **Scaffolded** — the deck jumped straight to final. |
| Fulfillment (PR) | Finalize + screencast walkthrough + submission. Direct from the deck. |

---

## 8. The Connector — Node-side implementation in pathway.html

`pflx-pathway-portal/pathway.html` is the Core Pathways portal. The Connector
implementation lives in the `launchNode` function block — search for
`PFLX Connector — phase-based Module protocol` to find it.

Key helpers added this session:

- `resolvedCourseUrl(n)` — extended so a `coursePackage` containing a slash
  resolves root-relative (e.g. `"modules/storybuilding-storyboarding"` →
  `./modules/storybuilding-storyboarding/viewer.html`). A bare slug still
  resolves to `./courses/<slug>/` (legacy).
- `pflxModulePlayer()` — best-effort player context (brand + initials only,
  never a real name — Connector §7 privacy rule).
- `_pflxCourseProgressHandler` — the active iframe message handler. Now parses
  string messages too (the MC broadcasts arrive as `JSON.stringify`). Handles:
  - `pflx_mod_ready` → reply with `pflx_mod_init` carrying restored Save Slot
  - `pflx_mod_progress` → drive `#courseProgressFill`
  - `pflx_mod_checkpoint` → record `node._lastCheckpoint`
  - `pflx_mod_save` → persist to `localStorage['pflx_modsave_<nodeId>']`, reply `pflx_mod_save_ack`
  - `pflx_mod_submission` → record `node._moduleSubmission`
  - `pflx_mod_complete` → build a Completion Record (now carrying
    `reward: { xc: node.xcReward, badgeIds: node.taggedBadges }`) and forward
    up to the Platform via `window.parent.postMessage({ type: 'pflx_module_completion', payload: record })`
  - `pflx_mc_module_approval` (incoming from the Console) → relay
    `pflx_mod_approval_result` to the module iframe; flips node title to
    "— APPROVED" when approved
- Plus all the LEGACY `pflx-task-*` / `pflx-course-*` handling, untouched.

Nodes wired to the Storybuilding module in seed data (line ~3180 & ~3195):
- `cc-storyboard` on Content Creator pathway
- `da-storyboard` on Digital Artist pathway

Both: `nodeType: 'course'`, `coursePackage: 'modules/storybuilding-storyboarding'`.

**Gotcha — these seed nodes have no `xcReward` or `taggedBadges` configured.**
On approval the reward currently pays **0 XC** until the host sets values in
the node editor. The Connector machinery works; the values just need filling
in. This is a configuration item, not a bug.

---

## 9. The Console — preview.html receiving completions

`pflx-platform-check/preview.html` is the Console. The new code added this
session, in two regions:

### Message handler (around line 18913 area)
A `pflx_module_completion` case that pushes an entry into the `mcApprovals`
array with `type: 'module_completion'`, persists via `mcSaveData('approvals')`
(which also cloud-syncs), and re-renders the queue.

### MC Approvals panel render (around line 34216 area)
- `mcRenderApprovals` builds items — added `module_completion` to the filter
  alongside `arena_external`, with submission-link/XC-award detail in the card.
- `mcApproveItem('module_completion', id)`:
  - flips the entry to `action: 'approved'`
  - awards the reward to the player via `PflxDataBus.award(playerId, { xc })`
    and `.award(playerId, { badge })` (this is the authority — XC propagates
    to toolbar, portfolio, every sub-app)
  - broadcasts `mcBroadcastToApps('module_approval', { … approved: true … })`
    which fans out to all sub-app iframes, including `corepathways-frame`,
    which pathway.html catches and relays into the module as
    `pflx_mod_approval_result`
- `mcRejectItem('module_completion', id)`:
  - flips to `action: 'rejected'`
  - broadcasts `module_approval` with `approved: false, note: '...'`

The unified Approvals Queue (`mc-panel-approvals`) is THE host approval
surface — module completions sit alongside task, pitch, and arena_external
items in one place, exactly as the user wanted.

---

## 10. Verification — what was tested

All tests are written as jsdom node scripts (they lived in `/tmp` on the old
machine; not committed). On the new machine, re-create them as needed.

| Test | Coverage | Result |
|------|----------|--------|
| `test_viewer.js` | Storybuilding viewer in standalone mode — phase rendering, gates, diagnostic, activity, segments, tool cards, FLX objective chips, essential questions, locked phases, navigation. | **22 / 22 pass** |
| `test_full.js` | Viewer in embedded mode (fake parent injected) — full 4-phase run-through, Connector messages outbound (`pflx_mod_ready`, `progress`, `checkpoint`, `submission`, `complete`), submission state. | **19 / 19 pass** |
| `test_handshake.js` | Node→Module `pflx_mod_init` with restored Save Slot → viewer restores to the right phase. | **5 / 5 pass** |
| `test_approvals.js` | Real extracted Console code (mcRenderApprovals, mcApproveItem, mcRejectItem, the handler block) against mocks — completion → queue → approve pays reward + broadcasts / reject returns with note. | **11 / 11 pass** |

**What is NOT verified:** the **full live multi-iframe round-trip in a real
browser** (Console → Pathways iframe → module iframe → back). Each layer is
tested in isolation. A live smoke test is the right next verification step.

---

## 11. New-computer setup checklist

Follow in order on the new machine:

1. Install Cowork (the Claude desktop app) and sign in with
   `info@thetomorrowteacher.org`. Plugins and connectors generally re-appear
   once signed in; OAuth-based connectors (Slack, Gmail, Calendar, Vercel,
   Box, etc.) will need re-authentication on first use.
2. Install Git. Easiest on macOS: `brew install git`.
3. Recreate the working-folder layout and clone both repos:
   ```bash
   mkdir -p ~/Desktop/"PFLX Apps/Core Pathway Development"
   mkdir -p ~/Desktop/"PFLX Apps/PFLX Overlay"
   cd ~/Desktop/"PFLX Apps/Core Pathway Development"
   git clone https://github.com/thetomorrowteacher/pflx-pathway-portal.git
   cd ~/Desktop/"PFLX Apps/PFLX Overlay"
   git clone https://github.com/thetomorrowteacher/pflx-platform.git pflx-platform-check
   ```
   (The platform folder MUST be named `pflx-platform-check` to match the
   existing deploy/iframe paths.)
4. In Cowork, add both folders as workspaces:
   `~/Desktop/PFLX Apps` and `~/Desktop/PFLX Apps/PFLX Overlay`.
5. Reinstall the plugins you were using:
   `productivity`, `marketing`, `product-management`, `cowork-plugin-management`.
   The built-in skills (`pdf`, `xlsx`, `pptx`, `docx`, `schedule`,
   `setup-cowork`, `skill-creator`) come with the app.
6. Reconnect the MCP connectors you actually use. From this session: Slack,
   Gmail, Calendar, Box (Google Drive), Vercel, Wix, Canva, Gamma, Figma,
   Bitly, Apple Notes, Control Your Mac, Claude in Chrome.
7. Set up GitHub push auth — easiest path is
   `brew install gh && gh auth login`, which wires the credential helper for
   HTTPS pushes. Otherwise Keychain will prompt on the first push.
8. Open a fresh Cowork chat, attach the `PFLX Apps` workspace, and bootstrap
   the new session by asking Claude to **read `docs/HANDOFF.md` in
   pflx-pathway-portal** — that's this file. It will give Claude full context.

---

## 12. What was NOT done — natural next steps

Pick whichever the user wants to tackle first.

1. **Live browser smoke test** of the full chain — open the Console, launch
   the Storybuilding node from Content Creator or Digital Artist, complete it,
   confirm it appears in the MC Approvals panel, approve it, confirm XC pays
   and the module flips to "Approved." This is the highest-confidence step
   before declaring the system production-ready.
2. **Configure rewards on the two seed nodes** (`cc-storyboard`,
   `da-storyboard`) — set `xcReward` and `taggedBadges` in the node editor
   (or directly in the seed data) so approval actually awards XC.
3. **Build the Module Builder UI** — this is the resolved Open Question #2
   from the Module spec. It needs to ingest existing content (Google Slides
   exports, HTML files, raw text) and produce a `.pflx` package. The user has
   plenty of existing content (the `graphic-design-concepts` `course.json`
   format, the `pflx_pm_v2` Firebase-based Project, more Google Slides). The
   Builder is the next major engineering effort and would unlock host-led
   module creation.
4. **Migrate `graphic-design-concepts`** from the legacy `course.json` slide
   format to the canonical phase-based `manifest.json` format. Already a
   working module; format conversion is the task.
5. **Unpause Quest** — resolve Open Question #1 (whether stages reference
   bundled child modules or point to external ones), then port the user's
   `pflx_pm_v2` Production Management project as the first Project (using
   the FLX framework) or build a Quest that chains Storybuilding + GD.
6. **Resolve the remaining Module-spec open questions** (#4 objective
   granularity, #5 DIX variant, #6 per-phase reward weighting) as needed.

---

## 13. Quick reference — key paths

```
pflx-pathway-portal/
├── pathway.html                                              ← Core Pathways portal; Connector Node side
├── docs/
│   ├── CONNECTOR_CONTRACT.md                                 ← node↔module protocol (v0.4)
│   ├── MODULE_STRUCTURE.md                                   ← what's in a .pflx (v0.2)
│   ├── HANDOFF.md                                            ← THIS FILE
│   ├── THREEJS_MIGRATION_PLAN.md
│   └── PHASE_1_DONE.md
├── modules/
│   ├── storybuilding-storyboarding/                          ← first phase-based module
│   │   ├── manifest.json
│   │   ├── viewer.html                                       ← phase-based renderer
│   │   └── host.html
│   └── storybuilding-storyboarding.pflx                      ← zipped package
├── courses/
│   └── graphic-design-concepts/                              ← LEGACY course.json format example
├── src/pflx3d/                                               ← three.js scaffold (TypeScript)
├── scripts/                                                  ← build-3d.mjs, install-3d-deps.sh
├── package.json
├── vercel.json
└── .npmrc                                                    ← legacy-peer-deps=true

pflx-platform-check/
└── preview.html                                              ← Console (the shell); Approvals Queue lives here
```

Search anchors for the new code (use grep/find these strings):

- pathway.html: `pflxModulePlayer`, `PFLX Connector — phase-based Module protocol`,
  `pflx_mc_module_approval`
- preview.html: `pflx_module_completion`, `module_completion`,
  `mcApproveItem` (look for the `else if (type === 'module_completion')` branch)

---

## 14. Things to mention to Claude on the new computer

If you bootstrap a new chat by having Claude read this file, also flag:

- **You (Ennis) own all of this.** Push commits are wired through your GitHub
  account. Both repos auto-deploy via Vercel on push to `main`.
- **The sandbox can't authenticate `git push`.** The pattern that works is
  `do shell script "..."` via the "Control Your Mac" MCP (`osascript`), which
  runs as you and uses your keychain credentials. The sandbox CAN do
  `git add` / `git commit -c user.email=... -c user.name=...`, though the
  `.git/index.lock` may sometimes need to be cleared (also via osascript).
- **Privacy rule:** when sending player context to a module (CONNECTOR §7),
  pass `brand` and `avatar` only — never a real name.
- **Anything in `/tmp` from the old session is gone.** Re-create the jsdom
  tests as needed; they're not in the repo.

---

*End of handoff. This document was generated at the close of the previous
session and is the single source of truth for resuming work on the cartridge
system on a new machine.*
