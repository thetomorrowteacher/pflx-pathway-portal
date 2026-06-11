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

---
---

# Session Update — June 2026 (Sonnet)

This section appends to the original handoff above. It captures the work done
in the production-hardening + UI cleanup pass between June 1 and June 2, 2026.
**The cartridge system above is unchanged.** Read this section to know what's
new before opening another sprint, especially if you're picking up Core
Pathways "Open Space UI" work next.

## What's new in production

### Home Base redesign (preview.html)
Home Base went from a stats-heavy dashboard to a Mission Hub launcher:

- **Stat row removed.** The four stat tiles (Total XC / Rank / Quests / Position)
  that sat under the player avatar are gone. The toolbar already surfaces XC,
  Position, and Rank live.
- **Launch Apps card** — large 5-tile launcher pinned to the top of Home Base.
  Tiles: **Mission Control → X-Coin → Core Pathways → Battle Arena →
  DarkCampus**. AI Center is intentionally excluded. Each tile has a 104×104
  icon (with a per-app `iconScale` field for tuning), hover lift, and a
  description chip that fades in. The chip copy is the canonical
  short-description for each app — keep it in sync if you change names:
  - **Mission Control** — "Your season pass and project and task management
    center. Track the projects, jobs, and tasks assigned by your cohort or
    organization."
  - **X-Coin** — "Digital currency system that values your experience across
    PFLX. Earn XC and badges, browse the upgrades and modifiers marketplace,
    and navigate taxes and fines."
  - **Core Pathways** — "Learning and professional development modules. Build
    skills and earn digital badges, credentials, endorsements, and
    certifications."
  - **Battle Arena** — "Esports, challenges, and competitive games. Jump in
    to earn quick XC, compete head-to-head, and rack up achievements."
  - **DarkCampus** — "Global professional network for rising entrepreneurs
    and creators. Network, collaborate, and communicate across cohorts."
- **My Tasks** card (formerly Deadlines) — urgency-coded list of the active
  player's tasks/projects/checkpoints with due dates. Red+slow-flash for
  overdue, yellow for ≤5 days, green for >5 days. Optional `overdueFineXC`
  field shows a `⚠ -N XC` chip. Click any row to deep-link into the
  matching MC detail view. Host clicks open `mcEditCheckpoint/Task/Project`
  on the right MC tab; player clicks route through `ppNav('task-detail', …)`
  etc.
- **Job Board** card replaces the old Goals card. Lists up to 5 open jobs
  from `ppGetJobs()` filtered by the player's cohorts. Click to deep-link
  into the Player Portal job board with the row scrolled into view and
  pulse-highlighted via `data-job-row` attribute.
- **Removed:** Recent Activity, Goals, Season Progress, Investment Summary,
  Projects, and the small App Links tray at the bottom. `renderProjects()` /
  `renderActivityFeed()` / `renderGoals()` / `renderInvestmentSummary()`
  still exist in the file but aren't called by the dashboard build anymore.

### Toolbar
- **Removed:** Portfolio nav button, Settings nav button, the floating ♫
  audio toggle. The audio panel DOM (`#se-player-panel`) stays in place; the
  player-card dropdown's SOUND button toggles it via `seTogglePlayerPanel`.
- **CHECKPOINT % indicator replaced with POSITION** — toolbar slot 2 now
  shows the player's live leaderboard position (`#N / total`) derived from
  PLAYERS sorted on `totalXcoin`. Hosts/admins show `—`. The id is
  `toolbar-position` / `toolbar-position-bar`.

### Player card dropdown (toolbar avatar click)
Order is now: My Wallet → My Tasks → Leaderboard → View Portfolio → **Sound**
→ **Settings** → Sign Out. Sound and Settings were lifted out of the toolbar.

### Login screen
- **Brand input is now a typeable `<input list="brand-datalist">`** with
  autocomplete. `populateBrandSelect` fills the datalist instead of a
  `<select>`. Imported-brand-select on the claim flow stayed a `<select>`.
- **Remember-me row** under the LOGIN button. Stores `{brand, pin, ts}` in
  `localStorage` under `pflx_remember_v1` on successful login (gated by the
  "Keep me signed in on this device" checkbox, default checked). On next
  visit both fields are pre-filled so the player just clicks LOGIN. A small
  "Forget me" link wipes the row and clears the inputs. `pflxSignOut` also
  clears `pflx_remember_v1` so signing out actually signs out.

### Mission Control sidebar
- Task Management order is now **Checkpoints → Projects → Tasks → Job Board
  → Proposals**.
- **Startup Studios removed** from sidebar. Panel + renderer stay in place
  (still backs the Home Base studio card + portfolio studio view).
- **Sessions removed** from sidebar. Reachable via Live Session under
  System when active.
- **Pitches → Proposals.** UI label and page title only; data key still
  `pflx_mc_pitches`, render function still `mcRenderPitches`. The
  Proposals page copy explains the reverse-task framing for future build:
  player proposes a new project (MC) or new module/node (Pathways) → host
  approves from this queue.

### Battle Arena icon swap
- New file: `public/PFLX Battle Arena Icon.png` (4 MB controller artwork)
  added to both `pflx-platform-check/public/` and `pflx-arena-check/public/`.
- All 6 references in preview.html updated. Battle Arena's own
  `PlayGate.tsx` updated to `/PFLX%20Battle%20Arena%20Icon.png`.
- **Global CSS scale rule** for any `img[src*="PFLX Battle Arena Icon"]`
  applies `transform: scale(1.6)` to compensate for the artwork's transparent
  padding. App Hub tile uses its own inline `iconScale: 1.8` which overrides.

## Critical bug fixes shipped this session

### P0 — Page Unresponsive freeze on Launch Apps click
`navigateTo`'s cohort-access Promise gate replaced its sentinel with
`Promise.resolve('ready')` which is still thenable. The recursive
`navigateTo` re-entered the same `.then` branch infinitely. Microtask
loop → browser thread blocked. Fix: sentinel is now the plain string
`'ready'` which has no `.then`. See `navigateTo` around line 18766.

### P0 — Sphinx Link Battle Arena "SYNCING WITH PLATFORM" trap
Fresh self-signups had empty `activeSession.brand` when `buildAppURL` ran.
The URL came out as `?sso=pflx&brand=&...` Battle Arena's PflxIframeGuard
required both `sso=pflx` AND truthy brand — empty string is falsy. Player
sat on a 3.5s safety spinner. Fix is two layers:

1. **`buildAppURL`** now resolves `safeBrand` via fallback chain
   `brand → brandName → name → id → "Player"`. URL param is never empty.
2. **`PflxIframeGuard`** loosened to three fast-paths:
   - `sso=pflx` alone reveals (brand truthy not required).
   - Any localStorage hint (`pflx_user` / `pflx_identity` /
     `pflx_active_session`) reveals.
   - Referrer fallback — `document.referrer` includes prototypeflx.com /
     pflx-platform → reveal.
   Safety timer cut 3500ms → 1500ms. Retry cadence tightened 400/1000/2000
   → 200/600/1200.

### P0 — Cohort access gate (deny-wins)
**`pflxPlayerCanAccessApp`** used a union rule — ANY cohort resolving to
allow granted access. PlayerPool's default-open beat every explicit "off"
toggle on other cohorts for multi-cohort players (which is everyone).
Fix: `resolveCohortApp` now returns `null` for "no setting" and `false` /
`true` for explicit settings. The outer loop short-circuits on the first
`false`. ANY explicit deny → deny. Matches host intuition. Applies to
every gated app (XC / Pathways / Arena / DarkCampus / Portfolio / AI /
MC) and both entry paths (platform navigateTo gate + sub-app bootstrap
`allowedApps` URL param).

### X-Coin Marketplace + Leaderboard
- **Marketplace "NOT ENOUGH"** for a player with 100k XC. The
  `hasEnough` check was `user.xcoin >= cost && user.digitalBadges >= cost`.
  Zero badges → eternal "NOT ENOUGH". Fix: single XC check.
- **Duplicate XC chip** on upgrade cards removed. One chip shows
  `costXcoin` in yellow; a second purple chip shows `costBadge` only
  when non-zero.
- **Leaderboard default sort → Evo Rank.** Rank level descending,
  `totalXcoin` as tiebreaker. Same fix in both `app/player/leaderboard/`
  and `app/admin/leaderboard/`.

### X-Coin Job Board repopulating after wipe (root cause)
`pflx-xcoin-check/app/lib/data.ts` exported `mockJobs` with 3 seed entries
(Class Social Media Manager / Equipment Room Assistant / Peer Tutor —
Adobe Creative Suite). Every X-Coin iframe boot pushed them back into the
shared `mcJobs` collection via cloud sync. Even after wiping Supabase row
+ localStorage, X-Coin re-seeded within seconds. Fix: `mockJobs` is now
`[]`. Job Board only ever holds jobs the host creates through MC.

### Loading screen keyboard bypass
Pressing Space during a loading screen activated whatever button had
focus (a Launch Apps tile, etc.), triggering a scene change mid-load. The
SFX/music kept playing under the new view. Fix: document-level keydown
listener installed in `pflxLoadingScreen.init()` swallows Space/Enter/Tab/
Arrows when the screen has `.active`. Plus `show()` blurs
`document.activeElement` before adding `.active`.

### Toolbar gate stopped telegraphing locked apps
`pflxApplyCohortGatingToToolbar` previously appended "— locked for your
cohort" to `btn.title` for denied apps and dimmed the tile. Hosts saw
the stale tooltip after the role check finally passed because the title
wasn't reset. Fix: no tooltip append, no dim styling, idempotent scrub
removes any legacy "locked for your cohort" tail from `btn.title` on
every gating refresh. Click-time Access Denied modal unchanged.

### Self-signup record hardening
`final-pin-btn` click handler at ~line 16920 now validates the onboarding
`role` against `['Student','Creator','Educator','Explorer']`, normalizes
via `normalizeRole` (always produces `player` for these inputs),
stashes the display value as `roleDisplay`, and explicitly stamps
`rankOverride: null`, `godTier: false`, `evoRank: 1`. Upstream defense
for the Master Admin Evo Rank class of bug.

## Sub-app bootstrap status
The shared `pflx-app-bootstrap.js` lives at
`pflx-pathway-portal/public/pflx-app-bootstrap.js` (served from the
pathway-portal CDN). It reads tier / allowedApps / cohort / role from
the SSO URL params, persists to localStorage, and renders a full-screen
ACCESS DENIED overlay if the current app key isn't in allowedApps. Loaded
via `<Script strategy="beforeInteractive">` in:

- `pflx-arena-check/app/layout.tsx` (`window.PFLX_APP_KEY = 'arena'`)
- `pflx-darkcampus-check/src/app/layout.tsx`
  (`window.PFLX_APP_KEY = 'darkcampus'`)
- `pflx-xcoin-check/app/layout.tsx` (`window.PFLX_APP_KEY = 'xcoin'`)

Pathways is the source — pathway-portal hosts the script but also enforces
the gate inline.

## Latest commit hashes (session end, June 2 2026)

| Repo | Latest |
|------|--------|
| `pflx-platform` | `51725be` (deny-wins cohort gate) |
| `pflx-battle-arena` | `ad916b4` (PflxIframeGuard loosened) |
| `pflx-xcoin-app` | `bd7f242` (marketplace + leaderboard) |
| `pflx-darkcampus` | `ac1fce8` (bootstrap wired) |
| `pflx-pathway-portal` | unchanged from prior session |

## Open work / Known gaps

1. **Core Pathways "Open Space UI"** — next session's focus. Pathway.html
   currently renders a fixed node map. The open-space concept is a more
   exploratory canvas where players can navigate freely. No code shipped
   for this yet. Start from the existing `pathway.html` Detail Overlay
   logic (entry video + tier picker + module launch flow already work).
2. **Proposals workflow** — Sidebar renamed but the player-side submit
   form isn't built yet. Spec: a "Propose" button on Player Home or in
   Core Pathways opens a small form (title / description / target
   checkpoint or pathway / suggested reward). Submit pushes onto
   `mcPitches` with `status: 'pending'`. The MC Proposals queue already
   renders pending items.
3. **Bootstrap iframe-guard parity** — DarkCampus and X-Coin guards
   should get the same loosened fast-paths Battle Arena got. Easy port —
   copy the updated `PflxIframeGuard.tsx` logic. Not yet shipped to those
   two.
4. **X-Coin .git was previously corrupted** — fresh clone was swapped in.
   Future edits should commit cleanly but watch for the `~7 entries vs
   13` pattern in `.git/` listing. See
   `~/Library/Application Support/Claude/.../memory/pflx-subapp-gits-and-clones.md`.
5. **Recent Activity feed** — removed from Home Base. If you want a
   replacement "Recent Wins" motivation feed (badges earned, checkpoints
   completed, XC milestones), the dashboard build is in `renderHome`
   right before the My Tasks card.

## Key file locations for Core Pathways work

```
~/My Apps/PFLX Apps/Core Pathway Development/pflx-pathway-portal/
├── pathway.html                          ← THE entry point
├── public/
│   ├── pflx-app-bootstrap.js             ← shared sub-app gate
│   └── (module / node assets)
├── docs/
│   ├── HANDOFF.md                        ← this file
│   ├── MODULE_STRUCTURE.md               ← tier-aware module spec
│   └── (other specs)
└── modules/                              ← module cartridges live here
```

`pathway.html` key search anchors for the next session:
- `Detail Overlay` — the per-node panel with entry video / tier picker
- `pflxModulePlayer` — the Connector wrapper for embedded modules
- `_pflxNormalizeEntryVideo` — YouTube/Drive/Vimeo URL coercion
- `pflx_mod_init` / `pflx_mod_progress` / `pflx_mod_save` — Connector
  postMessage types
- `detail-tier-btn` — tier picker buttons on the Detail Panel
- `launchTierChip` — the tier confirmation chip on the warp screen
- `_history[]` — module save slot history (cap 12)

## Things to mention to the new Claude session

- Production URL is **`https://prototypeflx.com`**. Vercel auto-deploys
  every push to `main` for each repo within ~1 minute.
- Working copies live in **`~/My Apps/PFLX Apps/`** NOT iCloud Drive.
  iCloud's fileproviderd corrupts `.git/` (refs missing, only HEAD +
  config left). If you see a `.git/` folder with only ~7 entries, do
  a fresh clone to `~/git/<repo>` and swap the `.git/` back into the
  working copy. See the memory note linked above.
- Push commits via the **Control Your Mac MCP** (`osascript`)
  `do shell script "..."` — runs as Ennis and uses his keychain. The
  workspace bash CAN do `git add` + `git commit` but `find .git -name
  '*.lock' -delete` is a frequent prereq.
- Supabase project: **`hyxiagexyptzvetqjmnj`**. Key tables: `app_data`
  (KV blob for cohort_overrides, pflx_mc_jobs, etc.), `users`,
  `module_saves`. SQL fixes via the Supabase MCP `execute_sql` work.
- The **shared cohort access gate** is now deny-wins. If you add a new
  gated app, register it in the `gatedApps` map inside `navigateTo`
  AND in the `allowedApps` loop inside `buildAppURL`.

*End of June 2026 update. Hand off to next session — Fable, Core
Pathways Open Space UI is yours.*

---
---

# Session Update — June 10-11 2026 (Fable) — Open Space UI Phases 1-3 + Endless Space

Seven commits shipped to `pflx-pathway-portal` `main`, all deployed and
verified live on the production URL. Working tree clean at session end.

## Commits (chronological)

| Hash | What |
|------|------|
| `f4f9654` | Phase 1: WebGL deep-space layer (Three.js r128, pinned cdnjs CDN), camera momentum + elastic bounds, `?openspace=1` preview station |
| `9376749` | Flash fix (per-star shader twinkle, static layer opacities, near-zero fog) + horizon planet w/ atmosphere limb glow, 2 moons, sun glow |
| `3bd8a25` | Phase 2: station-city silhouettes on every real node via `pflxStationHTML(n)` |
| `9ba124a` | Phase 3a: true astern chase ship + cockpit orbital command map + blue-lit dashboard w/ HOTAS sticks |
| `edbdf61` | De-crowd: right control rail restack, station auto-scale (`pflxDecrowdStations`), selection-screen responsive shrink (preview.html) |
| `acf6400` | Endless procedural universe: deterministic 2600px chunks (planets/nebulae/spirals + asteroid clusters/black holes/derelicts), bounds widened, ship clamp lifted to ±40k |
| `40f3879` | Hazard gameplay + comet events + CARGO HOLD inventory + X-Coin module contract |

## Architecture decisions (locked with Ennis)

1. **Engine:** Three.js r128 global build from cdnjs, no build step. The GL
   layer is `#spaceGL` (z-index 0); ALL nodes stay DOM/SVG above it. If THREE
   fails to load, `PFLX_GL_ACTIVE` stays false and the legacy DOM background
   (still in the file, gated) boots as fallback.
2. **Camera:** free-form pan/zoom (no orbit). GL camera dollies via
   `pflxSpace.sync(panX, panY, zoom)` called at the end of `applyTransform`.
   `pflxSpace.setMode(mode)` (called from `pflxSetCamera`) pitches the GL
   camera and toggles the cockpit orbital map.
3. **Node visuals:** distinct silhouettes per `nodeType`, one shared kit —
   course=station-city, project=industrial yard, program=ringed citadel,
   quest=stargate, challenge=fortress, untyped=jump beacon. Deterministic
   per-node-id hash; status drives lighting (locked=powered-down grayscale,
   completed=warm windows + green beacon, in_progress=fast beams).
4. **Hazard rewards are ITEMS + pending XC** — real XC crediting awaits a
   Console-side `pflx_space_xc` handler (NOT yet built). Popup/log shows
   "+N XC · PENDING CREDIT". This respects the approval-gated economy.
5. **Reference art** (Ennis supplied 3 images): floating station cities w/
   engine-glow pillars · cockpit w/ orbital rings outside windshield ·
   capital ship from astern over a planet. Match these, don't drift.

## What exists now in pathway.html (search anchors)

- `OPEN SPACE — WebGL deep-space layer` — the whole GL IIFE (`window.pflxSpace`)
- `ENDLESS SPACE — deterministic procedural chunks` — `spawnChunk` /
  `despawnChunk` / `ensureChunks` (5×5 ring, despawn >3 chunks, full disposal)
- `window.pflxSpaceObjects` — live registry of map-plane hazards
  ({type:'asteroids'|'blackhole'|'derelict', x, y, r, chunkKey, gl…})
- `pflxSpaceHazards` — gameplay tick (black-hole pull w/ shield mitigation,
  asteroid mining timer, derelict pickup, comet events); hooked into
  `pflxKeyLoop`; birds-eye click-to-collect via canvas click → guided flight
- `pflxCargo` — inventory: localStorage `pflx_cargo_<playerId>` + debounced
  Supabase mirror to `app_data` key `pflx_cargo_<playerId>`; CARGO button in
  right rail opens drawer w/ ITEMS / SHIPS / LOG tabs + pending-XC footer
- `SHIP_TIER_FEATURES` + `pflxLoadShipState` — now also reads
  `pflx_ship_state.modules[]`: `mining-laser`, `tractor-beam`,
  `deep-scanner`, `shield-booster` (helper `hasModule(id)`)
- `pflxStationHTML` / `pflxStationDefs` — node structure generator
- `pflxDecrowdStations` — neighbor-distance auto-scale, runs in every
  `drawConnectors` pass
- `#chaseShip` — screen-fixed astern hero ship (banks via `--thrust` /
  transform set in `pflxKeyLoop`); map-plane `#pflxShip` hidden in chase only
- `buildOrbital` — cockpit/chase orbital command map in the GL scene

## Open work (priority order)

1. **X-Coin Ship Bay items for the module contract** — add mining-laser /
   tractor-beam / deep-scanner / shield-booster purchasables to
   `pflx-xcoin-check` (`app/lib/data.ts` SHIP_TIERS area + marketplace UI)
   and write `modules[]` into the `pflx_ship_state` broadcast. The pathway
   side already honors them.
2. **Console handler for `pflx_space_xc`** — `pflx-platform-check/preview.html`
   should catch it and credit via `PflxDataBus.award` (or route into the
   Approvals Queue if Ennis prefers host sign-off), then ack so the cargo
   footer clears PENDING.
3. **Original Phase 3 polish still pending:** warp-lane energy beams between
   stations (replace dashed SVG connectors), HUD hover data cards +
   target-lock reticle on real nodes (the `?openspace=1` preview shows the
   intended language), subtle hover/select audio.
4. **Phase 4:** Detail Overlay restyle to HUD language (inputs/outputs are
   FROZEN — only the skin may change), HANDOFF refresh, full live smoke test
   of pathway → module → approval round-trip after all UI work.
5. **Live verification of this session's work by a human** — Ennis confirmed
   smoother + approved direction, but black-hole pull / mining / cargo sync
   have NOT been play-tested end-to-end in a real browser yet.

## Verification facts for the next session

- Test page: `https://pflx-pathway-portal.vercel.app/pathway.html`
  (public, no Vercel auth) — branch-alias URLs are 401-protected.
- Syntax gate that caught every error this session: extract inline
  `<script>` blocks and run `node --check` on each (python one-liner in repo
  history). Run it BEFORE every commit.
- Automated in-browser checks are blocked on this machine: Chrome's "Allow
  JavaScript from Apple Events" is OFF and screencapture lacks Screen
  Recording permission. Don't burn time there; ask Ennis to eyeball.
- Sandbox git: `git add`/`commit` work but `.git` lock/tmp files can't be
  unlinked from the sandbox — run the lock cleanup + commit + push through
  the Control Your Mac osascript pattern (see §14 above).
- IMAGE UPLOADS from Ennis often arrive corrupt through chat. His macOS
  screenshots are HEIC bytes with .png names. He has asked: DO NOT attempt
  image conversion workflows. If a screenshot fails to load, just ask him
  to describe the issue in words.

*End of June 10-11 2026 update.*

---
---

# Session Update — June 11 2026 (Fable) — Per-pathway universes, blasting, RPG prompts, crew presence

Continuation of the Open Space sprint (the prior chat died on an API error;
this session resumed from this handoff). All three repos touched.

## What shipped

### pflx-pathway-portal
1. **Per-pathway distinct space** — `PATH_SEED` (FNV-1a of `pathwaySlug`) is
   XOR'd into `chunkRand` and biases `PVAR` densities + home palettes
   (FAR_PALS / NEB_PALETTE). Every pathway now generates its own endless
   universe instead of all sharing one.
2. **Asteroid blasting** — `pflxBlaster` (search anchor). SPACE fires in
   chase/cockpit at the nearest live cluster in 460px; each bolt knocks a
   rock out of the GL group, pays **+3 XC** (instant-credit path) + ore
   chance; destroying the cluster pays +10 XC + bonus ore. `blaster-mk2`
   module = 2 dmg + 0.22s fire rate. Asteroid objects now carry `hp`.
   Stationary fire works (keyLoop stop-block ticks the blaster and keeps
   looping while `pflxKeys.fire`).
3. **RPG encounter prompts** — bird's-eye is overview/mapping ONLY now.
   Clicking a space object up there raises `pflxSpacePrompt` (PFLX_ENCOUNTERS
   copy per type) with ENGAGE — CHASE VIEW / COCKPIT VIEW / DISMISS buttons.
   Collection/flight interactions require chase or cockpit. Black holes are
   never auto-flown into.
4. **Crew presence v1 (multiplayer)** — `pflxCrew` (search anchor). Supabase
   Realtime presence channel `pflx-space-<pathwaySlug>`; sees other players'
   ships live (brand + initials only — CONNECTOR §7 privacy), WAVE and
   INVITE TO CO-OP broadcasts, invite prompt flies the accepter to the
   sender (and points at the station for co-op). "CREW IN SECTOR: N" chip
   bottom-left (left:240 to clear the progress bar). NOTE: full co-op node
   entry handoff (auto-open Detail Panel as co-op party) is the next step.
5. **Bug fix:** `window._supabase` was never assigned (top-level const isn't
   a window prop) so the cargo cloud mirror silently no-op'd. Now exposed.
6. **De-crowd round 2** — `pflxDecrowdStations` also shrinks `.node-label` /
   `.node-badge` inside 170px neighbor distance; selection screen
   (preview.html) custom pathways no longer default to y:100%+ (off-map,
   piling on the bottom bar) — they fill `CUSTOM_SLOTS` inside the map box.
7. XC ack — `pflx_space_xc_ack` from the Console clears the CARGO HOLD
   PENDING CREDIT figure (`pflxCargo.creditAck`).

### pflx-platform (pflx-platform-check)
- **`pflx_space_xc` handler** (next to `pflx_pathway_node_complete`). DECIDED
  BY ENNIS: **instant credit** — straight through `PflxDataBus.award` so XC
  maps into the player's X-Coin account and fans out to Platform toolbar +
  all sub-apps. Clamped to ≤200 XC per message. Mirrors into mcPlayers,
  acks `pflx_space_xc_ack` to the source iframe.

### pflx-xcoin-app (pflx-xcoin-check)
- **SHIP_MODULES** in `app/lib/data.ts`: blaster-mk2 (400), tractor-beam
  (500, R2), deep-scanner (450, R2), mining-laser (600), shield-booster
  (800, R2). `PlayerShipState.modules?: string[]` (+ default []).
- Marketplace Ship Bay tab: SHIP MODULES purchase grid; `purchaseModule`
  deducts XC, records the transaction, and `saveShipState` broadcasts
  `pflx_ship_state_update` with `modules[]` — pathway side already honors it.

## Open work (priority)
1. **Co-op node entry handoff** — invite accept should carry into the node's
   Detail Panel and start a co-op session (cap 4, project modules only per
   MODULE_STRUCTURE v0.3). Presence + invite plumbing is in; the entry
   wiring is not.
2. **Live human play-test** — blasting, presence (needs 2 browsers), instant
   XC credit round-trip, RPG prompts. None play-tested end-to-end.
3. Warp-lane energy beams, HUD hover cards / target-lock reticle, Detail
   Overlay HUD restyle (Phase 4) — still pending from the prior list.
4. Supabase Realtime presence requires the channel feature enabled on the
   project (hyxiagexyptzvetqjmnj) — if peers never appear, check Realtime
   settings.

*End of June 11 2026 update.*

---

## June 11 2026 — round 2 (same session, after Ennis feedback)

### Terminology — LOCKED
- **"Module" is RESERVED for the cartridge** (course/project/quest) that
  plugs into a Node. The Node is the console, the Module is the cartridge,
  the Connector is the slot. Ship hardware add-ons are **"Ship Systems"**
  (renamed everywhere user-facing; X-Coin exports are now `SHIP_SYSTEMS` /
  `ShipSystem`). The wire/storage key inside `pflx_ship_state` REMAINS
  `modules[]` for cross-app compat only — do not rename it casually.
- **Crew presence shows BRAND NAME ONLY** — no initials, never real names.

### Shipped in round 2 (pflx-pathway-portal)
1. **Node host settings** (node editor → "Multiplayer & Entry Requirements"):
   `coopEnabled`, `coopMax` (2–4, platform cap 4), `entryMinXC`,
   `entryBadge`, `checkpointXC`. Detail Panel lists them; entry gates are
   enforced at launch click (`pflxNodeEntryGate`, hosts/edit-mode bypass);
   `pflx_mod_init` now carries `coop.enabled` + `coop.maxPlayers`; crew
   co-op invites only carry a nodeId when the node allows co-op.
2. **Per-player module progress on the Node** — `pflx_mod_progress` percent
   persists per (player, node) (`pflx_modprog_<nodeId>_<playerId>`); Detail
   Panel shows a "YOUR SAVED PROGRESS" bar (`pflxNodePlayerProgress`).
3. **Progress-point XC** — on `pflx_mod_checkpoint`, if the host set
   `checkpointXC`, the node pays it instantly via the `pflx_space_xc`
   instant-credit path (dupe-guarded per checkpointId per player). The big
   completion reward STILL goes through the Approvals Queue (locked
   decision #7 intact).
4. **Galaxy clusters** — `pflxClusters` (search anchor). Hosts and Evo
   Rank 5+ players can found cluster sites in deep space (8–14k units
   out), rendered as stargate beacons, persisted per pathway
   (localStorage + app_data `pflx_clusters_<pathwaySlug>`). Click beacon →
   info dialog with WARP THERE (warp ships only) and REMOVE (founders).
   Cockpit/chase HUD shows a bearing chip to the nearest cluster.
5. **Warp range gate** — non-warp hulls bounce off a soft wall 6000u from
   map center with an upgrade toast. Warp comes with Tier 4+ ships, which
   are already Evo-rank gated in the Ship Bay — that's the leveling loop.

### Known broken / next major build (from Ennis, this session)
- **Node difficulty functions are NOT working correctly.** Root cause:
  modules aren't built to a common template, so the node's difficulty
  settings have nothing consistent to act on.
- **NEXT MAJOR BUILD: the Module Creation Template app/dashboard** (the
  Builder from locked decision #12). Every module gets authored through
  it so it functions correctly in any node: standard manifest, phase
  structure, AND a difficulty contract — modules adjust to the node's
  difficulty settings and use AI functions to adapt per player. This
  supersedes/absorbs the old "Builder UI" roadmap item.
- Galaxy cluster sites don't yet host actual nodes — node placement at a
  cluster site (host drag/create in deep space) is the follow-up.
- Co-op invite → shared module session (true synchronous co-op via the
  Connector coop context) still pending; cap/enabled flags now flow.

---

## June 11 2026 — round 3: the MODULE CREATION DASH (builder.html) ships

The Builder from locked decision #12 / the round-2 roadmap now exists:
**`builder.html`** at the repo root (live at /builder.html on the portal
deploy). Linked from the node editor's Course Package row ("⬡ BUILDER").

### How it works
- Full FLX (Future Learning Protocol) authoring: 4 strands, Development
  with Ideation+Creation segments, per-phase FLX objective tagging (all
  15 codes with text), UbD Desired Results, host essence lines, approval
  criteria, optional Starter/Pro tiers (the difficulty model), optional
  Practice phases, `aiAdaptation` manifest scaffold for the future AI
  per-player layer.
- Content blocks: markdown (with **links** — viewer now renders
  `[text](url)`), callout, **YouTube video embed** (any watch/share/embed
  URL), **image** (URL or file-upload → embedded dataURL), tool card,
  diagnostic, activity, reflection, submission. Move/delete/reorder.
- Export: fetches the proven runtime templates
  (`modules/storybuilding-storyboarding/viewer.html` + `host.html` — both
  fully manifest-driven), injects the generated schemaVersion-3 manifest
  (JSON `</`-escaped), patches host OBJ/XWALK to the complete 15-code
  crosswalk, zips `manifest.json + viewer.html + host.html` →
  `<moduleId>.pflx` via JSZip (cdnjs). "⬇ manifest.json" exports JSON only.
- Preview: in-dash iframe (player view per tier + host view); the Builder
  answers `pflx_mod_ready` with a synthetic `pflx_mod_init` so the module
  behaves exactly as it will in a Node.
- Drafts autosave to localStorage (`pflx_builder_draft_v1`); Import
  accepts manifest.json or a whole `.pflx`.

### Template fixes made (affect the live Storybuilding module too)
1. `inline()` in viewer.html now renders markdown links.
2. The init handler accepts the tier from `payload.context.tier` (what
   pathway.html actually sends) as well as `payload.tier` — the tier
   picker was silently falling back to Novice in embedded runs.
3. `modules/storybuilding-storyboarding.pflx` re-zipped in sync.

### Selection screen (preview.html) smoothness pass — June 11
Ennis reported glitchiness + "words in the background" overlaying things.
Root causes fixed:
1. The glowing CHOOSE YOUR PATHWAY title was z-index 60 (ABOVE the node
   layer at 30), nowrap at fixed 28px — its words + 150px glow overlapped
   node arms and ran under the info panel on smaller windows. Now z-20
   + pointer-events:none (scenery under the nodes), clamp()-responsive
   font/letter-spacing, glow trimmed to 44px.
2. titleGlow animated 5-layer text-shadows (repaint/frame) → now an
   opacity pulse.
3. animateParticles rewrote box-shadow + background on 55 particles per
   frame → colors/glows set once, per-frame opacity+transform only.
4. animatePulseRings per-frame borderColor/boxShadow → set once.
5. animateScanLines animated `top` (layout/frame) → translateY.
6. animateAurora rebuilt a fullscreen 3-gradient per frame at 60fps →
   throttled to 8fps (slow wash, visually identical).

### Builder follow-ups
- ~~Ingest existing material into draft phases~~ — **SHIPPED June 11**:
  "⬆ Ingest Content" in the Builder top bar accepts PPTX, DOCX, PDF,
  Markdown/TXT, CSV, XLSX. All parsing is client-side: pptx/docx via
  JSZip+DOMParser (pptx slide images embedded as dataURLs, 400KB/img +
  3MB total caps), pdf via pdf.js (lazy cdnjs), xlsx via SheetJS, csv
  via PapaParse. Sections are mapped onto FLX strands by keyword
  scoring (STRAND_KEYWORDS) with positional fallback; CSV/XLSX with a
  `phase` header column map rows directly (columns: phase, segment,
  kind, title, content, url). Auto-adds import-review callout, warm-up
  activity, reflection stub, and default objectives so gates and
  validation work immediately. Google Slides path = export as .pptx.
  Parsers verified against synthetic OOXML in Node (jszip+xmldom).
- **AUTO-TIERS (shipped June 11):** "⚡ Auto-build Starter & Pro from
  Novice" — default ON. The host authors Novice only; `deriveTier()`
  generates the other difficulty levels at export/preview per the §14.1
  semantics: Starter = +Practice Round phase, scaffold callouts, activity
  hints, 1.35x time, 0.5x XC; Pro = Enhancement dropped, Development
  segments collapsed, callouts stripped, markdown trimmed to lead blocks,
  diagnostics capped at 5 items, 0.65x time, 1.75x XC. Unchecking auto
  MATERIALIZES the derived tiers into the editor for hand-editing;
  re-checking returns to Novice-as-source. Import sets auto off when a
  manifest ships its own starter/pro. Verified in Node (12/12 derivation
  assertions).
- **AI ASSIST (shipped June 11):** ✨ buttons throughout the Builder —
  module subtitle+description, per-phase assist (title/essence/UbD
  understandings/essential questions from the phase's own content),
  per-block write/improve (markdown, callout, activity, reflection,
  diagnostic, submission), approval-criteria suggestions. Transport:
  `/api/pflx-ai` Vercel serverless proxy (NEW FILE `api/pflx-ai.js`;
  model claude-sonnet-4-6, override via PFLX_AI_MODEL) — **REQUIRES
  Ennis to set `ANTHROPIC_API_KEY` in the Vercel project env** for the
  shared path. Fallback: the Builder prompts for an Anthropic key and
  stores it in localStorage (`pflx_builder_ai_key`, browser-only,
  direct CORS call). Strict-JSON prompting with defensive parsing
  (fences/chatter stripped). All AI output lands in the normal editors
  — host reviews everything before export.
- The AI difficulty layer that `aiAdaptation` scaffolds (per-player
  runtime adaptation — the auto-tier engine handles authoring-time).

### Platform AI layer (June 11, after Ennis: "keys not saving, X-Bot not working")
- `api/pflx-ai.js` is now **multi-provider**: GET reports
  `providers:{anthropic,openai,gemini}`; POST takes
  `{provider, system, prompt|messages[], maxTokens}`. Env keys:
  ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (+ model
  overrides). **Server-side keys are THE fix for "keys not saving" —
  they work on every device/browser.** Ennis must set them in the
  pflx-pathway-portal Vercel project.
- Console (pflx-platform repo) XBOT_AI upgrades: (1) proxy transport —
  cloud engines are available via the proxy even with no browser key
  (each callX falls through to `callProxy(provider)`); (2) **Local AI
  provider** — any OpenAI-compatible URL (Ollama/LM Studio on the Mac,
  Apple on-device servers); auto-routing prefers Local for
  greetings/quick/short queries so basics are free; (3) localStorage
  backup row `pflx_xbot_ai_keys_bak` restored when the primary is
  missing; (4) UI: Local AI fields + LOCAL engine card + proxy status
  lines in both the X-Bot side panel and the full settings page.
- NOTE: the "Locally AI" iPhone app (locallyai.app) has NO network API
  server — it can't be called by the Console. Apps that DO: "Local LLM
  Server" / "ai.local" (iPhone), Ollama / LM Studio / apple-to-openai
  (Mac). Browser mixed-content rules mean the hosted https Console can
  only reach LOCALHOST endpoints — so the practical setup is a model
  running on the same computer as the browser.
- ElevenLabs TTS key unchanged (browser localStorage,
  `pflx_xbot_elevenlabs_key`); proxying TTS audio is a possible
  follow-up.
- A tools registry for branded tool cards (open question 14.8 #4).
