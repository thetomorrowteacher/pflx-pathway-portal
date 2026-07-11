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

### Mission Control: Proposals FULL LOOP (June 11)
The half-built Proposals feature is now end-to-end (pflx-platform):
- Player side: 💡 PROPOSE button on the Home Base My Tasks card opens a
  modal (type: MC Project | Pathway Node, target checkpoint/pathway,
  suggested XC) + a MY PROPOSALS status list with host notes and
  REVISE & RESUBMIT for returned items.
- Host side: Proposals queue gained a RETURNED tab and a Return-for-
  Edits action with a note. **Approve now CREATES the real thing**:
  'project' → a real mcProjects entry (proposer on team, suggested XC);
  'pathway-node' → a record in the X-Coin `projectPitches` collection,
  which pathway.html ALREADY injects as a live node and pays the
  creator 10% residual XC per completion. Also fixed a real bug:
  approve/reject acted on the FILTERED list index, hitting the wrong
  proposal whenever a tab filter was active.

### Tutorials / tours (June 11, Ennis: "improve the tour, each app needs one")
- Console tour v2 (pflx-platform): steps are now ROLE-AWARE (player
  tour vs host tour — host steps cover Approvals, Cohort Manager +
  Evo Rank Bypass, the Builder, X-Bot engines/mimic), copy refreshed to
  the June-2026 reality (open space, Ship Bay, PROPOSE, X-Bot), steps
  with missing/gated targets are filtered at start and skipped at
  runtime. Engine, first-login trigger, ? replay button unchanged.
- Core Pathways tour (NEW, pathway.html): `pflxTour` — 6-step spotlight
  walkthrough (station nodes, camera modes + flight/blast controls,
  cargo hold, minimap, progress, zoom), auto-runs once per browser
  (`pflx_pathway_tour_v1`), ? replay button bottom-right next to the
  minimap.
- ~~In-app tours for X-Coin, Battle Arena, DarkCampus~~ — **SHIPPED
  June 11**: self-contained `PflxTour.tsx` in each app (xcoin
  app/components, arena app/components, darkcampus src/app/components),
  mounted in each layout.tsx. First-visit auto-run per browser
  (pflx_tour_<app>_v1), ? replay button bottom-left, steps with missing
  selectors degrade to centered cards so the tours never break, X-Coin
  tour suppressed in ?embed=mc mode.

### FLIGHT MODEL REWORK (June 11, Ennis: "up should go forward, not up")
pathway.html chase/cockpit controls are now a real flight model:
- UP/W = thrust FORWARD along the ship's heading (deep into space);
  DOWN/S = brake then slow reverse; LEFT/RIGHT = turn; MOUSE/TRACKPAD
  steers (horizontal position past a 16% center dead-zone banks the
  ship; pointer over UI is ignored).
- THE WORLD ROTATES around the ship (`window.pflxViewRotDeg`, applied
  in applyTransform as a rotate() about the ship's map position) so the
  heading is always up-screen; station labels counter-rotate to stay
  readable; the GL backdrop rolls in sync (pflxSpace.sync 4th arg →
  camera.rotation.z lerp). Bird's-eye is unchanged/upright.
- The key loop no longer early-returns when parked — steering, the
  blaster, and the HUD stay live; the loop is started by pflxSetCamera
  when entering a flight mode.
- Game feel: hero ship banks with TURN input; #speedStreaks boost
  vignette + conic streaks fade in above ~80% max speed.
- PER-PATHWAY IDENTITY: the big horizon planet's palette (6 worlds:
  ocean/magma/violet/emerald/desert/rose), atmosphere color, and sky
  side are derived from the pathway slug (HSEED), so each pathway's
  sky reads distinct on arrival. (Chunk dressing was already seeded.)
- FLIGHT HUD DECLUTTER: chase/cockpit hide welcome panel, progress
  bar, zoom controls, tour button, bottom bar, powered-by — pilots see
  space + flight UI only. Bird's-eye keeps the management surface.
- NOT YET PLAY-TESTED: world-rotation sign vs GL roll sign needs a
  human eyeball (if the stars turn the wrong way vs the map, flip the
  sign of rollTarget in pflxSpace.sync).

### CO-OP SESSIONS v1 (June 11) — `pflxCoop` in pathway.html
A crew invite at a co-op-enabled node now mints a real shared session:
- Inviter generates `coop-<id>`, joins Supabase channel
  `pflx-coop-<id>` as leader; accepter joins as member on accept.
  Party cap from node.coopMax enforced at join (PARTY FULL toast).
- `pflx_mod_init` carries `entryMode: 'coop'` + `coop.sessionId/role/
  peers` when a session is active for that node — the Connector
  contract the Module spec defined.
- CO-OP PARTY bar injected into the module header: every member's
  brand + LIVE progress % (presence re-track on pflx_mod_progress),
  LEAVE button. Rewards stay individual + approval-gated.
- v2 ideas: shared activity-field state inside modules (needs viewer
  support), party voice/text via DarkCampus channel auto-creation.

### TRACKPAD THROTTLE (June 11, Ennis feedback)
In chase/cockpit the two-finger swipe is no longer zoom — it IS the
throttle: the old zoom-in gesture direction = forward thrust along the
heading (decaying burst, continuous swipe = continuous thrust,
`window._pflxWheelThrust` consumed in pflxKeyLoop), reverse swipe =
brake/reverse. Bird's-eye keeps classic zoom-at-cursor.

### DEEP-SPACE DIVE + GRAPHICS P1 SHIPPED (June 11, late)
- ↑ and the trackpad swipe now produce the SAME forward feel: both feed
  one thrust value, and thrusting eases the camera zoom IN (the
  "deep-space dive" — GL backdrop dollies with it). Braking eases out.
- **Graphics P1 — 3D hero ship** (`heroShip` in the pflxSpace IIFE):
  procedural metal-hull model (hex fuselage, swept wings, cyan running
  lights, canopy, twin engines with halo flames) attached to the GL
  camera, visible in chase. Banks with turn input, pitches with
  thrust, engine flames scale/flicker with thrust+boost, idle bob,
  subtle full-burn shake. `body.gl-hero` hides the CSS #chaseShip
  (CSS ship remains as the no-WebGL fallback).
- **Graphics P2 SHIPPED (same session):** 3D station structures in the
  GL scene (`stationsRoot` / `buildStation` / `syncStations` in the
  pflxSpace IIFE). Per-nodeType kits: course = station city (towers +
  spinning ring + lit windows), project = industrial yard (gantries +
  cargo), program = ringed citadel, quest = stargate (spinning torus +
  violet portal), challenge = fortress, untyped = jump beacon. Status
  drives materials + beacon color (locked = powered-down gray, no
  beacon; completed = warm windows + green; in_progress = amber).
  Synced from pflxDecrowdStations (signature-cached per node, so drags/
  edits/status changes rebuild only the changed station). Visible in
  chase/cockpit; the flat DOM SVG silhouettes hide there via
  `body.gl-active.cam-chase .station-structure` CSS (bird's-eye keeps
  the SVG look). Beacons breathe + rings spin in tick().
- **Graphics P3 SHIPPED (same session):** post-processing chain —
  EffectComposer + RenderPass + half-res UnrealBloomPass (strength
  0.65 / radius 0.45 / threshold 0.82) + subtle FilmPass grain. The
  r128 examples load as UMD scripts from jsdelivr (pinned 0.128.0; all
  four URLs verified 200). Wrapped in try/catch — if any script fails,
  pflxSpace falls back to plain renderer.render. Resize handled.
- **Graphics P4 SHIPPED (same session):** particle system —
  `pflxSpace.burst(lx, ly, rgb, count, opts)` (Points + additive
  material, velocity decay, auto-dispose). Wired: blaster hits spawn
  rock-debris bursts, cluster destruction fires a hot-core + ember
  cloud double burst, and the ship trails engine exhaust sparks while
  thrusting (every 3rd frame, boost-scaled).
- **THREE.JS VISUAL MIGRATION: P1–P4 COMPLETE.** The original
  docs/THREEJS_MIGRATION_PLAN.md (esbuild bundle, src/pflx3d) is now
  superseded for visuals — everything it targeted (3D ship, 3D world
  objects, postprocessing, particles) ships in-page on the r128 global
  build. OPTIONAL P5 (only if ever needed): move connectors/warp-lanes
  and the remaining DOM map plane fully into GL; keep DOM for UI only.
  src/pflx3d remains as a future TypeScript home if the file outgrows
  inline maintenance.

### GRAPHICS → "PS5 LEVEL" ROADMAP (June 11)
Shipped now: ACES filmic tone mapping + sRGB output + exposure 1.15 on
the GL renderer (filmic highlight rolloff — planets/nebulae stop
clipping to neon), on top of today's rotating chase cam, boost
streaks, per-pathway horizon worlds, and HUD declutter.
The honest ceiling of the current architecture is that NODES + ship
are DOM/CSS sprites composited over a WebGL backdrop. The real PS5
push is the staged Three.js migration (docs/THREEJS_MIGRATION_PLAN.md
+ the src/pflx3d TypeScript scaffold already in the repo):
 P1. 3D hero ship (GLTF) replacing the CSS #chaseShip, engine
     particles, camera shake/lag.
 P2. Station nodes as real 3D structures in the GL scene (DOM keeps
     only the click targets + labels).
 P3. Postprocessing: UnrealBloomPass (needs three examples bundle via
     esbuild — the scripts/build-3d.mjs pipeline exists), god rays on
     the sun, film grain.
 P4. Asteroid/blaster impacts as GPU particles; volumetric nebulae.
Each phase needs iterative in-browser testing on Ennis's machine —
plan one phase per session, P1 first (biggest visible win).

### Cohort app gating — hardened (June 11, "DarkCampus still works when off")
Two silent fail-open paths found and closed in pflx-platform preview.html:
1. **Name drift** — a player session cohort string that didn't EXACTLY
   match a COHORTS key fell back to PlayerPool (open) → access granted.
   Resolution is now case/whitespace-insensitive vs keys AND display
   names (`pflxCohortByName` / `pflxNormCohortName`).
2. **Registry drift** — cloud/local overrides were only merged into
   cohorts present in the build's hard-coded COHORTS; denies for other
   cohorts were dropped. The raw saved map
   (`PFLX_COHORT_OVERRIDES_RAW`) is now consulted FIRST by the gate.
Plus: **re-gate after cloud overrides land** — if the player is already
inside an app that's now denied, they're kicked to Home with the
ACCESS DENIED modal (`window._pflxCurrentGatedView` tracking).
**EVO RANK BYPASS** (new): platform-wide per-app thresholds in the
Cohort Manager (🏆 panel under the app toggles; stored as
`__rankBypass` in the cohort_overrides blob, cloud-synced). A player at
or above the rank passes the cohort deny; the ACCESS DENIED modal shows
"Reach Evolution Rank N to unlock early (you are Rank X)". 0 = absolute
block. Verified in Node: 9/9 gate scenarios incl. drift, multi-cohort
deny-wins, registry drift, bypass, bypass-removal, host exemption.
- A tools registry for branded tool cards (open question 14.8 #4).

### DarkCampus pillars — built (June 12 session)
Repo: pflx-darkcampus (folder pflx-darkcampus-check). What already
existed and was kept: Slack/Discord #missioncontrol bridges (send +
read via notificationSettings tokens / slackResolver), DMs at /api/dm,
threads, xbot-scan.ts regex engine, Host Control Panel. New this
session:
1. **Cross-post registry + host deletion** — api/send/route.ts now
   captures the platform message IDs (`r.ts` Slack / `r.id` Discord)
   for every DC → #missioncontrol cross-post into cloud key
   `dc_crossposts` (cap 200, tokens stored server-side only).
   api/host-actions/route.ts: GET `?action=crossposts` (last 50,
   tokens stripped) and POST `delete_crosspost` → Slack chat.delete /
   Discord DELETE message per target (404 counts as deleted), marks
   rec.deleted + audit entry in dc_host_actions. Host UI: X-BOT tab of
   HostControlPanel → "CROSS-POSTS → #MISSIONCONTROL" list with ✕
   DELETE per entry, 15s poll.
2. **X-Bot reads Slack/Discord** — api/messages/route.ts
   scanInboundMessages(): every GET of a bridged channel feeds fresh
   human messages (not bots, not bridge echoes `[BRAND] ` prefix)
   through xbotScan → pending entries in dc_violations
   (platform "slack-read"/"discord-read") and dc_peer_rewards for the
   host approval queues. Dedupe via `dc_scanned_ids` (capped 2000).
3. **Rank-gated channel creation** — ChannelSidebar perm `rank:N`
   (playerRank from dc_auth user.rank/level, wired in terminal/page).
   HostSettingsModal local-channel perm select now offers Host Only /
   All / rank:3 / rank:5 / rank:7 + free-text custom (e.g. rank:4).
4. Demo messages removed from terminal; boot screen claims honest.
Pending/known: LiveTicker iframe-suppressed; xbot fines from
"-read" violations still flow through the existing approval → fine
pipeline (no auto-fine).

### LinkedIn connection — phases 1+3 live, phase 2 scaffolded (June 12)
Repo: pflx-xcoin (folder pflx-xcoin-check).
**Phase 1+3 (zero-API, works now):**
- `/badge/<playerId>` — PUBLIC server-rendered badge page (brand name
  ONLY, never real name). generateMetadata emits OG tags so LinkedIn's
  crawler previews "BRAND earned the X badge". `?b=<badge name>`
  focuses one badge. Data: cloud `users` + approved `submissions`
  (the same source rank logic uses) + host-customized `coinCategories`
  catalog with static COIN_CATEGORIES fallback. NOTE: cloud app_data
  column is `data` NOT `value` (REST: `select=data`).
- Per-badge buttons: SHARE ON LINKEDIN (share-offsite deep link),
  ADD TO PROFILE (profile/add?startTask=CERTIFICATION_NAME prefill,
  org = "PFLX — The Tomorrow Teacher"), COPY LINK.
- Wallet entry point: "in SHARE TO LINKEDIN" button in the Digital
  Badge Collection header → opens the public page.
- Anonymous visitors are NOT blocked: pflx-app-bootstrap gate only
  denies when launch params carry an allowedApps list.
**Phase 2 (OAuth post-to-feed, needs setup):**
- api/linkedin/{auth,callback,post}/route.ts + lib.ts. Scopes
  `openid profile w_member_social`, UGC Posts API. Tokens AES-256-GCM
  encrypted (key derived from client secret) before persisting to
  `linkedin_tokens` app_data key (table is anon-readable by design).
- Wallet: LinkedInConnect widget (hidden until configured) — CONNECT
  LINKEDIN → OAuth → "⚡ POST LATEST BADGE".
- ENNIS SETUP REQUIRED: developer.linkedin.com → create app attached
  to a verified LinkedIn Company Page → request "Sign In with LinkedIn
  using OpenID Connect" + "Share on LinkedIn" products → add redirect
  URL `https://<xcoin-domain>/api/linkedin/callback` → set
  LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET in Vercel env (xcoin
  project) → redeploy. Limits: ~100 calls/day/member, 60-day tokens.
- No badges exist in cloud yet (submissions empty, badgeCounts all 0)
  — page shows a clean empty state until hosts approve submissions.

### MC stomp incident + recovery (June 12, ~17:03 UTC)
A Console session pushed mock/empty in-memory state over the shared
pflx_mc_* rows (Save All / boot-race; pre-guard build). Damage after
audit: ONLY tasks — cloud held 3 March-mock tasks; the real task was
gone. checkpoints/modifiers/pflxranks/studios/badges/players verified
byte-identical to pre-stomp copies.
RECOVERY: real data carved out of Chrome Profile-1 LevelDB history
(~/Library/.../Local Storage/leveldb — old versions survive compaction)
with a custom SSTable/WAL parser. Restored: task "Complete
Projects/Courses" (task-1779903770394, roundId round-1, flpTracking
"monitoring", 1700 XC, due 2026-06-04, 6 reward badges, deadline fine
100/grace 2) → pflx_mc_tasks + legacy 'tasks'. Snapshots saved:
pflx_backup_pflx_mc_tasks_2026-06-12_pre-task-restore (+tasks). Real
checkpoint "Checkpoint Gamma" (round-1, 2026-03-02→06-02, Schoology
link, banner) was still intact in cloud.
PREVENTION (preview.html, commit d0cb660): mcCloudPush/mcCloudSync now
(1) refuse to run before the boot pull completes (_mcCloudPulledOnce),
(2) refuse to overwrite a cloud row that had items with an EMPTY local
collection (_mcCloudBaseline). recover-mc.html added for
localStorage-based recovery on any device. FLP indicators are CODE
(temporal phases from dates + flpTracking field) — they need no data
restore beyond the task itself.

### Unified host approvals on home screen (June 12)
The host home "🛡 Approvals" card now aggregates EVERY pending stream:
1. X-Tracker reward requests — now CLOUD-SYNCED (key
   pflx_mc_reward_requests; was localStorage-only so cross-device hosts
   saw nothing). Merge rule on pull: resolved status beats pending.
2. MC task submissions (unchanged, mcTasks status='submitted').
3. X-Coin badge submissions — cloud 'submissions' row, pending only.
   Inline approve mirrors X-Coin's pipeline: badge + XC (value from the
   mcBadges catalog, fallback 100 XC / primary) via PflxDataBus.award,
   row saved back so X-Coin admin shows it approved. NOTE: the Console
   path does NOT apply studio tax (X-Coin's earnXCWithTax does) — known
   divergence, approve in X-Coin if tax matters.
4. Core Pathways node submissions — pathway.html's old
   pflxSyncBus.emit('node-submission') was a DEAD PIPE (pflxSyncBus
   never existed; submissions went nowhere). Now: CoinSubmission-shaped
   record appended to the shared cloud 'submissions' row (tagged
   nodeId/pathwayId, shown as "🛰 Pathways: …") + pflx_node_submission
   postMessage to the Console for an instant toast/card entry.
   Screenshot/html data-URLs stay on the node record (not the queue).
5. X-Coin peer trades (cloud 'trades', pending) — display + "REVIEW IN
   X-COIN" deep-link (settlement/escrow logic stays in X-Coin).
Live updates: _pflxPullApprovalFeeds (15s throttle on home refresh) +
Supabase Realtime rows 'submissions'/'trades'/'pflx_mc_reward_requests'
re-render the card. Known race: X-Coin admin saving its whole
submissions array can clobber a node submission appended after X-Coin's
boot — mitigated by Realtime; full fix would be per-item rows.

### Save point system (June 12)
NEW RESTORE REFERENCE: `PFLX Apps/pflx-supabase-backup-2026-06-12.json`
(187 app_data rows, 9.6MB, verified 97 players + recovered task/
checkpoint). The March 31 file is obsolete — use this one for any
future recovery. Code reference: git tag `savepoint-2026-06-12` pushed
on all five repos. On-demand: Host Mission Control → Settings →
"🛟 Create Save Point" button (pflxCreateSavePoint) downloads a full
app_data snapshot JSON (covers EVERY app — shared Supabase) and writes
a pflx_last_savepoint marker row.

### Multiplayer presence fixed (June 12, "players couldn't see each other")
Live-tested with two Node clients + two real tabs: Supabase presence
ITSELF worked (both tabs were in the channel) — three UX/identity
defects made players invisible to each other:
1. IDENTITY DEAD CODE — pflxCrew.init called pflxModulePlayer(), but
   that fn is nested inside showLaunchOverlay's scope → typeof was
   always undefined → EVERY player joined as anonymous "Explorer" with
   a random id (confirmed in live presence payloads). Waves/invites are
   addressed by player id, so they could never reach anyone. Fixed:
   identity resolved inline (PFLX_SESSION → ?pid/&brand → localStorage
   pflxUser → Explorer fallback).
2. SPAWN OVERLAP — every ship spawns at the same world point (2500,
   4250 on prof-entrepreneur); a crewmate at spawn rendered exactly
   under your own ship. Markers now nudge +64/-28 while a peer is
   within 50u.
3. NO WAY TO FIND EACH OTHER in endless space. The CREW chip is now
   clickable → roster panel (brand, distance in units, FLY TO via
   pflxShipFlyTo, WAVE). Join toasts announce arrivals after first
   sync.
Node test harness: two supabase-js clients on channel
'pflx-space-<slug>' (presence keys must differ). Verified A↔B sync.

### Crew presence — ROOT CAUSE found (June 12, round 2)
Presence sync was never the problem (Node test + live channel confirmed
both players present with correct brands). The real bug: peer ship
markers were appended to #nodeCanvas (the OUTER, untransformed
container). The world pan/zoom/rotate transform is applied to
#nodeLayer, and the player's own ship (#pflxShip) + all nodes live
INSIDE #nodeLayer. So peer markers sat in raw screen space while the
world scrolled underneath — correct data, wrong coordinate system,
effectively always off-screen. Fix: pflxCrew.upsertPeer now appends to
#nodeLayer (fallback to canvas). One-line root-cause fix; the earlier
identity/spawn-nudge/roster work stands on top of it.

---
---

# Session Update — July 1 2026 (Sonnet) — MC redesign + hierarchy overhaul

**New persistent rule (Ennis, 2026-07-01):** After **every** PFLX change/upgrade, update this HANDOFF doc with a dated entry so a fresh Claude session or Fable chat can pick up. This entry is the first application of that rule.

## What shipped this session

Focus: Mission Control redesign — cards, hierarchy, progress, redesign toward Notion/Monday/Linear feel.

### `pflx-platform` commits (`pflx-platform-check/`)

| SHA | Subject |
|-----|---------|
| `47fc06f` | MC Projects: cohort UI + task cascade + completion reward |
| `b53d029` | P0 MC project disappearing — Stomp Guard 3 timestamp check |
| `27252b8` | P0 Stop X-Coin bridge from clobbering MC cloud with mock seeds (Stomp Guard 4) |
| `91d6010` | P0 MC project save — Stomp Guard 5 (single mcLoadData/session) + quota-safe setItem + banner downscale |
| `fc4739c` | MC Projects: banner-on-top 16:9 card layout |
| `9e686e3` | MC Checkpoints: hero-tier card treatment (16:9 banner, 28px Orbitron title, wider grid) |
| `40678f6` | MC Hierarchy: visible lineage across Task/Project/Checkpoint cards + helpers |
| `0da7eb7` | MC Redesign v3: Notion-style task rows + progress bars + urgency chips + rewards emphasis |
| `bae4b42` | P0 Fix Uncaught SyntaxError on Projects/Tasks (`_mcJumpAttr` HTML-safe helper) |
| `69f7920` | Bundle B pass 1: Priority levels + ⌘K command palette |

### Data model additions

- **Task.priority** — `urgent` / `high` / `normal` / `low`. Sorted highest first within each FLP bucket.
- **Cohort seed** — 10 cohort groups seeded via SQL into `pflx_mc_cohortgroups` (DD Core 1/2/3/5, DD Studio 2/3/7, Falcon Studios, Falcon Studios (MS Division), Global Digital Intern). `pflx_mc_cohortgroups_seeded` flag added to `mcLoadData` to prevent re-seeding from the legacy `COHORTS` constant on subsequent boots.
- **Task.roundId** still the legacy link Task → Checkpoint. Task ↔ Project link is via `Project.taskIds`.

### New behaviours a downstream agent must know

1. **Stomp Guards 1–5** protect `pflx_mc_*` cloud rows from being wiped by stale writes:
   - #1 no cloud push before boot pull completes
   - #2 empty local collection never overwrites populated cloud row
   - #3 timestamped `_mcLocalLastWrite` blocks stale cloud echoes within the 4s echo window
   - #4 rejects `pflx_cloud_data` messages from X-Coin for MC-owned keys (X-Coin mockProjects et al. would otherwise clobber real data)
   - #5 `mcRenderProjects` (and now all card renders) trust in-memory `mcProjects` after the boot load; do NOT reload from localStorage on every render — quota failures would otherwise wipe fresh writes
2. **`_mcSetItemSafe(key, coll)`** wraps every MC `localStorage.setItem`. On QuotaExceededError it strips large `bannerImage` / `image` data-URLs from the local cache and retries; cloud row still gets the full payload.
3. **`mcUploadProjectBanner`** now downscales uploaded images to 1600×900 max, JPEG @ 82%. A 3MB PNG becomes ~150–300KB. Fallback to raw file if canvas resize errors.
4. **Hierarchy helpers** — `mcFindTaskParentProject`, `mcChildTasksForProject`, `mcChildProjectsForCheckpoint`, `mcChildTasksForCheckpoint`, and `mcJumpToItem(kind, id)` router that scrolls to a `data-mc-<kind>-id="…"` anchor and pulses a gold highlight ring.
5. **`_mcJumpAttr(kind, id)`** — HTML-safe onclick builder. NEVER splice `JSON.stringify(id)` inside `onclick="…"` — id values containing quotes truncate the attribute and produce `Uncaught SyntaxError: Unexpected end of input (line 1)`. Always use `_mcJumpAttr`.
6. **`MC_PRIORITY_META`** + `_mcPriorityFlag(level)` + `_mcPriorityLabelPill(level)` + `_mcPriorityWeight(level)` for the Urgent/High/Normal/Low system.
7. **Command palette** — activated by ⌘K/Ctrl+K anywhere. Fuzzy-search across Navigate, Create, and item jumps (Checkpoints/Projects/Tasks/Players). Exposed globally as `window.mcOpenCommandPalette`.
8. **`_mcUrgencyForDueDate(dateStr)`** returns `{color, rgb, label, days}` on the green/yellow/orange/red scale. Reused across Task, Project, Checkpoint cards.
9. **`_mcProjectProgress(project)` + `_mcCheckpointProgress(cp)`** compute % approved. Checkpoint aggregates across child Projects + direct Tasks (de-duped).
10. **`_mcProgressBarHtml(pct, opts)`** shared bar renderer.
11. **`window._mcInitialLoadDone`** — the boot flag guarding `mcLoadData()` from repeat calls per session.

### UI transformation summary

- **Task cards → rows**: Notion-style horizontal list. Left = checkbox (green ✓ if approved, orange ◐ if submitted+clickable to approve, empty if open) + priority dot + category emoji. Middle = title (strike-through when approved) + one-line description + lineage chips. Right = urgency chip + XC pill (gold glow) + badge count + Edit/Delete. FLP phase pill, checklist, submission panel still render below when relevant.
- **Project cards**: banner-on-top 16:9, edge-to-edge under rounded corners. Lineage chip → parent Checkpoint. "📊 PROGRESS" hero panel with bar + tasks approved + XC earned. "📋 TASKS IN THIS PROJECT" scannable list.
- **Checkpoint cards**: hero tier. 16:9 banner with `◆ CHECKPOINT` corner chip + status pill + 28px Orbitron title overlay. "◆ CHECKPOINT PROGRESS" aggregate bar. "◆ MISSION CONTENTS" tree (Projects with nested Tasks + Standalone Tasks). Wider grid (`minmax(560px, 1fr)`) vs Projects (`minmax(380px, 1fr)`).

## Roadmap — deferred to next commits

Ennis authorized building the full Notion/Monday/Linear-inspired vision (msg 2026-07-01). Bundle B pass 1 shipped Priority + Command palette. Remaining in Bundle B:

- **Season context bar** at top of MC — active Season name, cohort scope, active-checkpoint count
- **My Work widget** on Home Base — for hosts: awaiting approval + overdue; for players: assigned to me sorted by urgency
- **Player Task submission form** — modal with title + description + link + file upload → sends to host approval queue
- **Structural enforcement** — block save of empty Project (needs ≥1 Task) / empty Checkpoint (needs ≥1 Task or Project)

Bundle C:
- **Player Portal parity** — port the row + progress + urgency treatment to `/player/checkpoints`, `/player/projects`, `/player/tasks`
- **Jobs = inverse of Tasks** — Job posted → applied → hired → auto-becomes a Task on the assignee, linked to source Project if any
- **Reward flow audit** — verify XC + badge dispatch at every approval tier (Task, Project, Checkpoint)

Bundle D and beyond:
- **Multiple views toggle** (List/Board/Calendar/Timeline/Table) on Tasks + Projects + Checkpoints
- **Template gallery** — save Checkpoint/Project as reusable template
- **Automations engine** — rule builder ("when task approved AND belongs to Checkpoint X, award badge Y")
- **Dependencies / blocking** between Tasks
- **Recurring Tasks + Sprint framework**
- **X-Bot AI priority suggestion** — analyze description + deadline, propose priority
- **Streak system** — bonus XC for N approvals in a row
- **Player-proposed Tasks** — self-directed learning path with host approval
- **AI Task breakdown** — X-Bot decomposes a goal into sub-tasks
- **Portfolio view per player** — approved Task/Project/Checkpoint rollup as showcase

## How to resume

1. Latest commit is `69f7920` on `pflx-platform` (live at `prototypeflx.com` after Vercel READY).
2. Priority + ⌘K are live but not yet backfilled onto legacy Tasks — existing tasks default to `normal`.
3. Cohort groups row `pflx_mc_cohortgroups` in Supabase (project `hyxiagexyptzvetqjmnj`) has the 10 seeded groups — do NOT wipe.
4. `pflx_mc_projects` cloud row was cleared to `{items:[]}` at 2026-07-01 04:59 UTC to remove legacy stubs.
5. Deploys use `osascript` via the Control-your-Mac MCP to run `git push origin main` from the sandbox — Ennis approved this pattern so I no longer need to hand off push commands.
6. **Push rule:** if a `.git/HEAD.lock` sticks around from a prior interrupted push, delete it before the next attempt.

Related memory: [[pflx-repo-location]] [[pflx-subapp-gits-and-clones]] [[pflx-data-sync-architecture]] [[pflx-open-space-ui]].

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle B pass 2

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `23d0794` | Bundle B pass 2: Season context bar + My Work widget + structural enforcement |

## What's new in production

### Season context bar (all MC views)
A pinned strip at the top of `mc-content` shows the active Season name, cohort scope, and roll-up stats. Rendered by `pflxRenderSeasonBar()` on every `mcNav` call.

- **Active Season name** — reads `mcSeasons.find(s => s.active) || mcSeasons[0]`. Falls back to "No Season Set" placeholder.
- **Stats pills** — 👥 players count · 🏁 active checkpoints · 📋 open tasks · 📤 awaiting approval (shown only when > 0, colored amber).
- **Scope pill** — reads `activeSeason.cohortScope` (string or array). Falls back to "All Cohorts".

### My Work widget (MC Dashboard)
Personalized landing card at the top of `mc-panel-dashboard`. Rendered by `pflxRenderMyWork()` on every `mcNav`.

- **Host view** (`pflxRole !== 'player'`):
  - 📤 **AWAITING YOUR APPROVAL** — every `mcTasks` with `status === 'submitted'`. Each row has an inline ✓ APPROVE button that calls `mcApproveTask(index)`.
  - ⚠ **OVERDUE TASKS** — non-approved tasks with negative days-until-due.
  - ⚠ **OVERDUE PROJECTS** — non-completed projects with expired `dueDate/endDate/deadline`.
  - Nice empty state: "Nothing waiting on you. Nice work. 🎉"
- **Player view**:
  - Their assigned open tasks sorted by priority DESC then urgency ASC.
  - Priority dot next to title; urgency chip on the right.
  - Empty state points to Job Board.

### Structural enforcement
Hierarchy contract is now enforced at save time.
- **`mcSaveProjectForm`** — blocks save with alert if no Task checkboxes are ticked ("A Project needs at least one Task…").
- **`mcSaveCPForm`** — blocks save if the Checkpoint has 0 tasks + 0 projects + 0 jobs ("A Checkpoint needs at least one Task, Project, or Job attached…").

## API surface added

- `window.pflxRenderSeasonBar()` — repaint the top strip. Cheap (reads current in-memory MC arrays).
- `window.pflxRenderMyWork()` — repaint the My Work widget. Role-aware (host vs player).
- Both are called automatically at the tail of `mcNav()`. Callers can force a refresh after a data mutation.

## Deferred in this pass (queued for next commit)

- **Player Task submission modal** — title + description + link + file upload, routed to host approval. Existing task submission surface needs a fresh UI to match the vision from the July 1 morning brief.

## Roadmap status

- Bundle B pass 1: ✅ Priority + ⌘K palette (`69f7920`)
- Bundle B pass 2: ✅ Season bar + My Work + enforcement (`23d0794`)
- Bundle B pass 3: ⏳ Player Task submission modal
- Bundle C: ⏳ Player Portal parity + Jobs=inverse + reward audit
- Bundle D: ⏳ Multiple views + Templates + Streaks
- Bundle E: ⏳ X-Bot AI priority + Automations + Dependencies + Sprints + Portfolio

## How to resume

Latest commit `23d0794` on `pflx-platform` live on `prototypeflx.com`. Season bar and My Work render on every navigation to any MC view. `mcSeasons` in Supabase governs the Season name shown — hosts create/toggle-active a Season from the existing Seasons section (surfaced via `mcRenderSeasons`).

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle B pass 3

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `63acc5a` | Bundle B pass 3: Player Task submission — title + description + link + file |

## What's new in production

### Player Task submission modal — enhanced
The existing `mc-player-submit-modal` was upgraded to match the "title / description / link / file upload" spec Ennis called out on July 1 morning.

- **Submission Title** (new required input) — surfaces in the host approval queue so a submission has a meaningful label, not just the task title.
- **Description** (renamed from Notes) — fuller placeholder "Describe what you did, what you learned, what to look for". Persists to both `submission.notes` (backwards-compatible) and `submission.description` (new canonical).
- **Link** — unchanged; still gated by `task.allowLinkSubmit`.
- **File Upload** — routed through `mcPlayerSubmitFilePick(input)`. Images downscaled to 1600×900 max JPEG @ 82% via the existing `_mcDownscaleImageDataUrl` helper. Non-image files size-capped at 4MB. The file-name chip shows the resized KB so the player sees the optimization.
- **`submission.fileType`** persisted alongside `fileData` so host preview can render images inline.
- Field order reshuffled: Title → Description → Checklist → Link → File. Matches Notion / ClickUp conventions where the write-up leads.

### API surface added
- `window.mcPlayerSubmitFilePick(input)` — file input change handler with image downscale.
- Globals: `mcSubmitFileName`, `mcSubmitFileType` alongside pre-existing `mcSubmitFileData`.

### Data model additions on `submission`
- `submission.title` (new, required at save time)
- `submission.description` (new, mirrors notes)
- `submission.fileType`

## Deferred

- **Host approval-queue render updates** — currently displays the task title; a one-line change to show `submission.title` when present. Filed for Bundle C alongside Player Portal parity so both host + player views ship together.

## Roadmap status

- Bundle B pass 1: ✅ Priority + ⌘K palette (`69f7920`)
- Bundle B pass 2: ✅ Season bar + My Work + enforcement (`23d0794`)
- Bundle B pass 3: ✅ Player Task submission (`63acc5a`)
- **Bundle B complete.**
- Bundle C pass 1: ✅ Jobs=inverse core (`fd2900d`)
- Bundle C pass 2: ⏳ Player Portal parity + Applicant/Hire UI + reward audit
- Bundle D: ⏳ Multiple views + Templates + Streaks
- Bundle E: ⏳ X-Bot AI priority + Automations + Dependencies + Sprints + Portfolio

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle C pass 1: Jobs = inverse of Tasks

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `fd2900d` | Bundle C pass 1: Jobs = inverse of Tasks. Hire triggers Task + Project cascade. |

## What's new in production

When a host puts a player in a Job's `hired[]`, a Task is auto-created for that player. If the Job has a linked Project, the new Task also nests inside that Project so it rolls up into the Project's TASKS IN THIS PROJECT panel and its progress bar counts it.

**Job model additions**:
- `job.projectId` (new, optional) — link to a source Project.

**Job form UI**:
- New "🎬 Source Project" dropdown next to Checkpoint. "None (standalone Job)" fallback. Restored on edit.

**Auto-Task creation (in `mcSaveJobForm`)**:
- Fires whenever `hired.length > 0` (not just on `Claimed` status).
- New task fields: `id`, `title: '[JOB] ' + job.title`, `description`, `category: 'collaboration'`, `playerId` (legacy) + `assignedTo` array (canonical), `jobId`, `projectId`, `checkpointId` inherited from job, `status: 'open'` (lowercase matches Notion-row checkbox states), `priority: 'normal'`, `xcReward`, `dueDate = job.endDate`, `backFromJobId + originTaskId` lineage, `allowFileUpload + allowLinkSubmit` default `true`.
- Idempotent — an existing job→player pair is never duplicated.

**Project cascade**:
- If `job.projectId` is set, new task ids are appended to `mcProjects[X].taskIds`. `mcSaveData('projects')` fires alongside `mcSaveData('tasks')`.

**Toast**:
- "Created N Task(s) from Job hires" fires so the host sees the effect immediately.

## Deferred (Bundle C pass 2)

- **Per-applicant Hire UI** — Apply button on player Job Board card, per-applicant Hire button on host Job card.
- **Player Portal parity** — port Notion-row / progress-bar / urgency / lineage treatment to `/player/checkpoints`, `/player/projects`, `/player/tasks`.
- **Reward flow audit** — verify Task, Project, and Checkpoint approval each fire `PflxDataBus.award` (`XC` + `badges`) correctly at every tier.

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle C pass 2: Reward flow audit

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `5c32074` | Bundle C pass 2: Reward flow audit — submitter resolution + Checkpoint completion chain |

## What's fixed

### Task approval — submitter resolution
`mcApproveTask` previously only read `task.submission.submittedBy` (legacy singular). But the new player submission modal writes to `task.submissions[]` (plural array with `playerId`). Result: **fresh player submissions were producing zero reward on approval.**

New three-shape fallback chain in `mcApproveTask`:
1. Legacy: `task.submission.submittedBy`
2. New player modal: `task.submissions[last].playerId || .submittedBy`
3. Job-hired auto-task: `task.assignedTo[0] || task.playerId`

First non-empty wins.

### Checkpoint completion reward chain (new)
Symmetric to the Project-completion chain added on `47fc06f`. When `mcSaveCPForm` transitions `cp.status` to `'completed'`, every player who submitted a task inside the Checkpoint's scope (direct `cp.taskIds` + every `taskId` nested in `cp.projectIds`) gets:
- `cp.xcReward` XC via `PflxDataBus.award(pid, { xc, source:'mc', reason:'checkpoint:<id>' })`
- Each `cp.rewardBadges` entry as a badge grant

Idempotency: `obj._cpRewardedAt` set once so a re-save never double-pays.

Toast: **"Checkpoint completed — rewards dispatched to N players"**.

## Reward tier summary — all three tiers now fire

| Tier | Trigger | Recipients | Route |
|---|---|---|---|
| Task | `mcApproveTask` | Submitter (resolved via 3-shape chain) | `PflxDataBus.award(id, {xc,badge})` reason `task:<id>` |
| Project | `mcSaveProjectForm` when `status → completed` | Team + every child-task submitter | reason `project:<id>` |
| Checkpoint | `mcSaveCPForm` when `status → completed` | Every child-task submitter (direct + via projects) | reason `checkpoint:<id>` |

## Roadmap status

- Bundle B: ✅ complete
- Bundle C pass 1: ✅ Jobs=inverse core (`fd2900d`)
- Bundle C pass 2: ✅ Reward flow audit (`5c32074`)
- Bundle C pass 3a: ✅ per-applicant Hire button now creates Task (`d7e6c7e`)
- Bundle C pass 3b: ✅ Player Portal MyTasks parity (`845eeb1`)
- Bundle C pass 3c: ✅ Player Checkpoint Detail hero + progress (`e692504`)
- Bundle C pass 3d: ✅ Player ProjectDetail + JobBoard apply (`b6e73de`)
- Bundle D pass 1: ✅ Board view toggle for Tasks + streak system (`a415062`)
- Bundle D pass 2: ✅ Templates gallery + host reject flow + streak reset (`2de404d`)
- Bundle D pass 3: ✅ Calendar view + Table view + streak badge on Player Home (`c1b4e11`)
- **Bundle D complete.**
- Bundle E pass 1: ✅ X-Bot AI priority suggestion + task breakdown (`897153c`)
- Bundle E pass 2: ✅ Dependencies + Recurring Tasks (`211d958`)
- Bundle E pass 3: ✅ Dep guard-rails + row chips + Portfolio view (`0fb7a63`)
- Bundle E pass 4: ✅ Sprints framework + Automations engine (`9d0fa38`)
- **BUNDLE E COMPLETE — BUNDLES A THROUGH E ALL SHIPPED.**

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle E pass 4 — **BUNDLE E COMPLETE**

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `9d0fa38` | Bundle E pass 4 — FINAL: Sprints framework + Automations engine |

## Sprints framework

- New `mcSprints` cloud collection. Added to `MC_CLOUD_TYPES`, `_mcCollectionFor`, `_mcApplyCollection`, `mcSaveData`, `mcLoadData`.
- **Sprint shape**: `{ id, name, startDate, endDate, taskIds[], status, createdAt, createdBy }`.
- **`_mcSprintStatus(sp)`** auto-computes lifecycle from date range vs current date. `sp.status === 'completed'` overrides.
- **`mcCreateSprint()`** — 3-prompt wizard (name, start, end). Creates instantly.
- **`pflxOpenSprintsPicker()`** — modal lists every sprint with lifecycle chip (upcoming/active/completed), date range, task count, delete button.
- Command palette: **"Sprints…"** NAVIGATE entry.

## Automations engine

- New `mcAutomations` cloud collection.
- **Rule shape**:
  ```
  { id, name, enabled, trigger,
    conditions: [{ field, op, value }],
    actions:    [{ type, value }] }
  ```
- **Triggers**: `task.approved` | `task.rejected` | `task.submitted` | `project.completed` | `checkpoint.completed`.
- **Condition operators**: `eq` / `neq` / `gte` / `lte` / `in` / `contains`.
- **Action types**:
  - `award_xc` — routes through `PflxDataBus.award` so toolbar + sub-apps update live.
  - `award_badge` — same path.
  - `toast` — surface a message via `pflxToast`.
  - `set_priority` — mutate the task's priority in place.
  - `notify_host` — persistent warning toast for the host.
- **`window.mcAutomationsFire(trigger, ctx)`** — public entry. Currently wired into `mcApproveTask` with full ctx (`taskId, playerId, projectId, checkpointId, priority, xcReward`). Rejection + project/checkpoint completion wiring available for the next commit that touches those paths.
- **`pflxOpenAutomationsPicker()`** — modal lists every rule with `WHEN … IF … → …` summary, ON/OFF pause toggle, delete.
- **`mcCreateAutomation()`** — 5-prompt wizard for a quick rule build. A richer editor form is a natural follow-up but doesn't block use today.
- Command palette: **"Automations…"** NAVIGATE entry.

## Full API surface added (this session)

**Utilities**: `mcJumpToItem`, `_mcJumpAttr`, `_mcUrgencyForDueDate`, `_mcProjectProgress`, `_mcCheckpointProgress`, `_mcProgressBarHtml`, `_mcSetItemSafe`, `_mcDownscaleImageDataUrl`, `hexToRgb`

**Priority + streaks**: `MC_PRIORITY_META`, `_mcPriorityFlag`, `_mcPriorityWeight`, `_mcApplyStreakBonus`, `_mcResetStreak`

**Season / My Work**: `pflxRenderSeasonBar`, `pflxRenderMyWork`

**Command palette**: `mcOpenCommandPalette` (⌘K)

**Templates**: `mcSaveAsTemplate`, `mcSpawnFromTemplate`, `mcDeleteTemplate`, `pflxOpenTemplatePicker`

**X-Bot AI**: `_mcSuggestPriority`, `_mcSuggestBreakdown`, `mcSuggestPriorityFromForm`, `mcBreakdownTaskFromForm`

**Dependencies + Recurring**: `_mcTaskDependenciesMet`, `_mcTaskUnmetDependencies`, `_mcSpawnRecurringNext`

**Jobs=inverse**: `_mcSyncJobHiresToTasks`

**Player Portfolio**: `ppRenderPortfolio`

**Sprints**: `mcCreateSprint`, `mcDeleteSprint`, `pflxOpenSprintsPicker`

**Automations**: `mcCreateAutomation`, `mcToggleAutomation`, `mcDeleteAutomation`, `mcAutomationsFire`, `pflxOpenAutomationsPicker`

## Full commit list (session end)

**`pflx-platform`** — 27 commits, all live on `prototypeflx.com`:

| SHA | Bundle | Subject |
|---|---|---|
| `47fc06f` | pre-A | MC Projects cohort UI + task cascade + completion reward |
| `b53d029` | pre-A | Stomp Guard 3 timestamp check |
| `27252b8` | pre-A | Stomp Guard 4 — X-Coin mock overwrite fix |
| `91d6010` | pre-A | Stomp Guard 5 + quota-safe setItem + banner downscale |
| `fc4739c` | A | Projects banner-on-top 16:9 |
| `9e686e3` | A | Checkpoints hero-tier card |
| `40678f6` | A | Visible lineage across cards |
| `0da7eb7` | A | Notion rows + progress + urgency + rewards |
| `bae4b42` | A | P0 SyntaxError fix (`_mcJumpAttr`) |
| `69f7920` | B | Priority + ⌘K palette |
| `23d0794` | B | Season bar + My Work + enforcement |
| `63acc5a` | B | Player Task submission modal |
| `fd2900d` | C | Jobs=inverse core |
| `5c32074` | C | Reward flow audit |
| `d7e6c7e` | C | Per-applicant Hire button |
| `845eeb1` | C | Player MyTasks Notion rows |
| `e692504` | C | Player Checkpoint Detail hero |
| `b6e73de` | C | Player ProjectDetail + JobBoard apply |
| `a415062` | D | Board view + streak system |
| `2de404d` | D | Templates gallery + reject flow |
| `c1b4e11` | D | Calendar + Table views + streak badge |
| `897153c` | E | X-Bot AI priority + breakdown |
| `211d958` | E | Dependencies + Recurring |
| `0fb7a63` | E | Dep guard-rails + Portfolio |
| `9d0fa38` | E | Sprints + Automations |

**`pflx-pathway-portal`** — 19 HANDOFF updates keeping this doc current.

## Roadmap status — FINAL

| Bundle | Status |
|---|---|
| A · B · C · D · E | ✅ **ALL SHIPPED** |

## How a fresh session picks up

Read this HANDOFF top-to-bottom. Every commit SHA is captured, every API surface is documented, every deferred item (rich Automation form editor, rejection→automation wiring, sprint UI polish) is listed. The full Ennis-July-1 vision is live.

---

## New persistent rule (Ennis, 2026-07-01 late): iCloud backup mirror

**`~/Desktop/PFLX Apps` is a passive iCloud backup mirror of the working copy `~/My Apps/PFLX Apps`.** After any PFLX change bundle:

1. Commit + push to GitHub (as always).
2. Run `~/My Apps/PFLX Apps/REFRESH_ICLOUD_BACKUP.command` (double-click in Finder, or `bash ~/My\ Apps/PFLX\ Apps/REFRESH_ICLOUD_BACKUP.command` from a shell). It rsyncs the working copy → Desktop, `--delete` to keep them exact, excluding `node_modules`, `.next`, `.vercel`, `.turbo`, `out`, `build`, `dist`, `.DS_Store`.
3. **Never run git commands from the iCloud copy** — iCloud fileproviderd breaks git internals (see memory `pflx-repo-location`). The backup exists purely as a snapshot.

**For Claude / Fable sessions:** After making any change to PFLX (platform, sub-apps, Core Pathways, HANDOFF, etc.), invoke `REFRESH_ICLOUD_BACKUP.command` via osascript so the iCloud mirror stays current. Full details in `~/My Apps/PFLX Apps/BACKUP_RULE.md`.

Both `BACKUP_RULE.md` and `REFRESH_ICLOUD_BACKUP.command` live at the top of `~/My Apps/PFLX Apps/` and get rsynced into the backup so they're discoverable from either location.

---

# Session Update — July 2 2026 (Fable) — BATTLE ARENA: Knowledge Decks (Quizlet import)

Ennis vision (locked direction): Battle Arena Side Quest becomes a
Roblox-like platform — an external **Battle Arena Studio** where players
build games that bind imported flashcard decks as their dataset.
Architecture decided with Ennis:
1. **Knowledge Database** — decks in Supabase, imported from Quizlet
   export paste / CSV (Quizlet's official API is DISCONTINUED; the
   supported path is the built-in Export on each set — do NOT scrape).
2. **Arena Game Cartridge standard** — game = HTML5 zip speaking a
   postMessage connector (init w/ deck + player ctx, score → XC through
   the locked economy). The existing arena /cartridges page (HTML upload
   shelf) is the seed. ANY engine that speaks the contract is valid —
   Godot NOT required; core templates ship on Phaser 3 (web-native).
3. **Studio v1** = template-driven builder (like builder.html): card
   duel, lane defense (PvZ-like), monster-tamer quiz battles, roguelite
   runner. v2 visual scripting; v3 open cartridge contract to external
   engines. Real-time MOBA PvP deferred; start turn-based/async on
   Supabase Realtime.

## Shipped this session (`pflx-battle-arena`, folder pflx-arena-check)

1. **`app/lib/decks.ts`** — KnowledgeDeck/KnowledgeCard types;
   `parseDelimited` (Quizlet export: term/def sep Tab|Comma|custom,
   rows Newline|Semicolon|custom, first-separator-only split so
   definitions keep the sep), `parseCsv` (RFC-4180-ish: quotes, escaped
   quotes, header auto-skip, col3 = tags), `autoParse` detection.
   Persistence: Supabase KV row **`pflx_ba_decks`** {decks:[...]} +
   localStorage mirror; upsert/delete are read-modify-write on the
   freshest cloud copy (stomp-guard). Caps: 500 cards/deck, 120 decks.
   Game SDK contract: `deckToGameData()` → games receive
   `{ type: 'pflx_arena_deck', deck }` via postMessage (play-side
   wiring lands with the Studio).
2. **`app/decks/page.tsx`** — 📚 KNOWLEDGE DECKS page: deck grid
   (source badge QUIZLET/CSV/MANUAL, subject chip, card count, search),
   import modal (paste + .csv/.txt upload, separator pickers matching
   Quizlet's export dialog, LIVE PREVIEW with parsed/skipped counts),
   deck detail modal (numbered card table w/ tags). Delete = creator or
   admin. Quizlet how-to hint in the header.
3. **Navbar** — DECKS link between Leaderboard and Cartridges.

## Verification
- Parser unit tests (esbuild→cjs, Node): **15/15 pass** (tab export,
  first-sep-only, comma+semicolon combo, quoted/escaped CSV, tags,
  header skip, autoParse detection, 500-card cap, newDeck/gameData).
- page.tsx + Navbar.tsx transpile clean (esbuild). npm install times
  out in the sandbox, so full `next build` typecheck happens on
  Vercel — **check the deploy status after push**.

## CRITICAL DEPLOY FACT discovered + second pass (same session)

**The deployed Battle Arena is NOT the Next.js app.** `vercel.json` has
`buildCommand: ""`, `outputDirectory: "."`, framework null, and rewrites
`/` → `/public/preview.html` — production is the 537KB single-file
`public/preview.html` (same pattern as the Console). The Next app
(`app/…`) never builds on Vercel. The earlier `app/lib/decks.ts` +
`app/decks/page.tsx` remain in the repo as the future-migration version,
but the LIVE feature had to ship inside `public/preview.html`:

1. **`baDecks` engine** (search anchor `KNOWLEDGE DECKS (July 2026)`) —
   same parsers (Quizlet tab/comma/dash + rows newline/semicolon,
   first-sep-only; RFC-4180 CSV w/ tags col3), Supabase row
   `pflx_ba_decks` via the file's existing supabaseLoad/Save,
   read-modify-write upsert/delete, localStorage mirror, boots 900ms
   after load.
2. **DECKS screen** — nav link + `state.screen === 'decks'` route.
   Deck grid (source badge, subject chip, bound-to-Cipher highlight),
   search (targeted DOM update, no focus loss), import modal (paste +
   file upload + separator selects + LIVE preview via
   `deckUpdatePreview()` — targeted, keystrokes never full-render),
   deck detail modal. Delete = creator or host.
3. **CIPHER IS NOW DECK-POWERED** — `cipherActiveQuestions()` returns
   the bound deck mapped to Cipher's question shape (correct def + 3
   random other defs as distractors, ≥4 cards required) else the
   built-in CIPHER_QUESTIONS. Both `questionPool` build sites swapped.
   Cipher config's mock "Coming Soon" block replaced with a real deck
   selector + "📚 Import / Manage Decks" button. `CIPHER_CONFIG.deckId`
   holds the binding; deck cards also show USE IN CIPHER.
4. Verification: syntax gate 3 blocks 0 failures; Node harness 8/8
   (parsers, cipher mapping, ≥4-card rule, fallback, bound/missing
   deck). NEEDS live check: import a real Quizlet export in the
   browser and run a Cipher session with it.

## Third pass (same session) — QUIZ CARD DUEL: first Arena Game Cartridge

The first playable deck-bound game shipped, establishing the **Arena Game
Cartridge contract v0.1** (postMessage, documented in the game file head):
- game → host: `pflx_game_ready` · host → game: `pflx_arena_deck`
  { deck {id,name,subject,cards[{term,definition}]}, player {id, brand} —
  brand only, never real names } · game → host:
  `pflx_arena_game_result` { game, deckId, score, correct, total,
  bestStreak, won } and `pflx_arena_game_exit`.

1. **`public/games/quiz-card-duel.html`** — self-contained DOM/CSS game
   (deliberately not Phaser: card games read better in DOM; Phaser is
   reserved for the action templates). HP duel vs RIVAL AI: question
   card + 4 answer cards per round, 15s timer bar, speed + streak
   damage (base 12 + speed ≤8 + streak ≤8, cap 30), rival damage ramps
   14→26, deck loops until someone drops. Victory/defeat screen with
   score (correct×10 + bestStreak×5 + 30 win bonus), REMATCH/EXIT.
   Standalone demo deck after 1600ms if no host answers (also playable
   directly at /games/quiz-card-duel.html).
2. **Launcher/connector in preview.html** (anchor `ARENA GAME CARTRIDGE
   LAUNCHER`) — `arenaGameLaunch(deckId)` fullscreen iframe overlay,
   answers `pflx_game_ready` with the bound deck + player (brand only),
   on result proposes XC via the existing `arenaPostAward`
   (`pflx_award_proposed` → Console economy authority):
   xc = clamp(score×0.25, 5, 40), reason `arena.duel.<deckId>.win|loss`;
   standalone mode credits local state.player.xc. Header shows the
   "+N XC PROPOSED" note. **⚔ DUEL** button on every deck card.
3. Verification: syntax gates clean (preview 3 blocks, game 1 block);
   Node tests **12/12** on the game core (round building invariants
   incl. shuffled correctIdx, <4-card refusal, damage/streak/caps, cpu
   ramp, score formula) + **3/3** on the XC clamp mapping. NEEDS live
   browser play-test.

## Fourth pass (same session) — BATTLE ARENA STUDIO v1 SHIPS (the Roblox loop closes)

Players can now BUILD and PUBLISH games. Full loop live: import deck →
open Studio → configure → test → publish → appears in Side Quests for
everyone → plays counted → XC proposed on results.

1. **Studio screen** (`renderStudio`, `state.screen === 'studio'`) —
   template gallery (Quiz Card Duel ready; Lane Defense / Monster Tamer
   / Rogue Runner shown as COMING SOON tiles), config form (game title*,
   deck* ≥4 cards, rival name, round timer 10/15/20s, accent theme ×5),
   🎮 TEST RUN (launches unpublished with config) and 🚀 PUBLISH.
   Published-games grid with ▶ PLAY and ✕ unpublish (creator or host).
2. **`baGames`** — Supabase row `pflx_ba_games` {games:[{id,title,
   template,deckId,config,createdBy,createdByName,createdAt,plays}]},
   read-modify-write (verified it preserves a second client's concurrent
   publish), localStorage mirror, `bumpPlays` on launch, cap 100. Boots
   1100ms after load.
3. **Side Quests shelf** — `arenaStudioCardsHtml()` renders under the
   mode cards: 🛠 PLAYER-MADE GAMES section (title, "by <brand> · N
   plays", deck name, player-made badge, click = play) + a dashed
   "Create a Game" card → Studio. Studio entry point is Side Quests
   (no extra nav link).
4. **Cartridge contract v0.1 extended** — `pflx_arena_deck` now carries
   optional `config { title, accent, rivalName, roundTime }`. The duel
   sanitizes it (`applyConfig`): accent must be #rrggbb (else dropped —
   blocks style injection), roundTime clamped 8–30, rivalName ≤24 chars,
   title ≤60; accent recolors question card, kicker, hover, player HP
   bar; title hits document.title + intro.
5. Verification: syntax gates clean; Node tests **5/5 applyConfig**
   (valid, malicious accent, out-of-range, null) + **5/5 baGames**
   (publish, concurrent-client preservation, remove, bumpPlays, single
   ready template). NEEDS live: publish a game and play it from Side
   Quests in the browser.

## Fifth pass (same session) — LANE DEFENSE: second Studio template

1. **`public/games/lane-defense.html`** — PvZ-style cartridge
   (game id `lane-defense`, contract v0.1, config {title, accent}).
   5 lanes × 7 cols canvas-2D (deliberately dependency-free instead of
   Phaser: zero CDN risk, and the WHOLE game is a pure simulation core
   `window.LD._core` that runs headless in Node). Raiders march left;
   the quiz panel is the economy — correct answer = +40⚡ (+10/streak,
   cap +70), wrong = 4s energy lockout. Defenders: 🔫 BLASTER 100⚡
   (10dmg/1.1s), 🧱 WALL 50⚡ (220hp), 🔋 GENERATOR 75⚡ (3⚡/s).
   3 waves (5/9/13 raiders, hp+speed ramp), 3 lives, last column
   reserved as spawn edge. Score = kills×5 + correct×10 + lives×20 +
   bestStreak×5 + 30 win bonus. Victory "SECTOR HELD" / defeat
   "OVERRUN" screens, REBUILD/EXIT, standalone demo deck fallback.
2. **Studio** — template tiles are now CLICKABLE (`studioPickTemplate`,
   `studioSelTemplate` replaces the hidden input); Lane Defense is
   ready:true; config header shows the selected template; Side Quests
   shelf + published list show the correct template icon/name;
   launcher header genericized to "🎮 <title>".
3. Verification: syntax gates clean (3 files); Node sim tests **13/13**
   — wave structure, placement rules (occupied/edge/bounds), reward
   cap, **full undefended game → LOSS**, **full fortified+answering
   game → WIN** (kills counted), score formula, question building.
   NEEDS live: play both templates in the browser, check canvas
   scaling on mobile.

## Sixth pass (same session) — STUDIO EXPANSION: assets + functions (Ennis: "add more assets and functions")

**New Studio assets** (catalogs at the top of the studio block in
preview.html): `STUDIO_BACKGROUNDS`/`STUDIO_BG_CSS` (6 themes: Deep
Space, Neon City, Crimson Nebula, Emerald Grid, Pure Void, Solar
Sunset), `STUDIO_EMBLEMS` (12 emoji emblems), `STUDIO_DIFFICULTY`
(easy/normal/hard). Config form gained: BACKGROUND, DIFFICULTY,
QUESTION ORDER (shuffled / deck-order "lesson mode"), SOUND FX on/off,
DESCRIPTION (140 chars, shown on the shelf card), GAME EMBLEM picker
grid, and a **LIVE THEME PREVIEW strip** (background + accent + emblem
+ title, updates on input without re-render — `studioPreview()`).

**New Studio functions:**
- **✎ EDIT published games** (`studioEditGame`) — loads a game back
  into the form (gold border + "✎ EDITING" header + CANCEL EDIT), SAVE
  CHANGES updates IN PLACE preserving id, creator, createdAt, and play
  count. Edit button on published cards (creator or host).
- `studioConfigOf(c)` — single config shape used by TEST RUN and
  PUBLISH: { accent, background, emblem, difficulty, ordered, sound,
  rivalName, roundTime }. Shelf cards show the game's emblem +
  creator description.

**Both game templates honor the config** (applyConfig extended in each,
all values sanitized in the GAME not just the Studio — whitelisted
backgrounds, emblem ≤4 chars no '<', difficulty whitelist, ordered
bool, sound bool):
- Backgrounds swap document.body background (same 6-theme map baked
  into each cartridge — cartridges stay self-contained).
- Difficulty: duel = rival damage ×0.75/1/1.3; lane defense =
  makeWaves multiplier (more + tougher raiders, verified headless).
- Ordered: rounds/questions re-sorted to deck order (teacher lesson
  flow) while answer choices stay shuffled.
- Sound: tiny dependency-free WebAudio synth (`sfx` in each game) —
  correct = up-chirp, wrong = low buzz, kill/hit = tick; disabled by
  config or if AudioContext unavailable.
- Emblem shows on the intro screen + document.title.

Verification: syntax gates clean ×3 files; Node tests **13/13** (duel
config apply + sanitize + dmgMult + sfx gate + body bg; lane-defense
config + easy-vs-hard wave scaling + sanitize; studio whitelist-at-read
+ edit preserves creator/plays). NEEDS live: theme preview strip,
emblem picker feel, SFX volume taste, edit round-trip.

## Seventh pass (same session) — 10 more background themes (16 total)

Added to `STUDIO_BACKGROUNDS`/`STUDIO_BG_CSS` in preview.html AND the
`BG_CSS` maps baked into BOTH game cartridges (kept in sync — note the
games use 4-space indent inside their IIFEs, preview uses 2-space; a
sync check compares all three maps): Aurora Borealis (layered
teal/violet), Abyssal Ocean, Magma Core, Cyber Dusk, Royal Nebula,
Gilded Vault, Frozen Expanse, Blood Moon, Dark Forest, Ion Storm — on
top of Deep Space, Neon City, Crimson Nebula, Emerald Grid, Pure Void,
Solar Sunset. Whitelist sanitizers in both games untouched (unknown
ids still fall back to 'space'). Verified: syntax gates ×3 clean,
maps aligned 16↔16↔16, labels match css ids.

## Eighth pass (same session) — GIMKIT/BLOOKET DIRECTION (Ennis)

Ennis: Battle Arena Studio should have games like Gimkit/Blooket and
functions/elements from Gimkit Creative. Researched: Gimkit Creative =
2D sandbox w/ terrain/props + DEVICES wired via CHANNELS (event bus),
item granters, up to 60 players. The full device/channel map editor is
the long-term Studio v3 vision (roadmap below); this pass shipped its
portable core elements:

1. **`games/knowledge-tycoon.html`** (template id `knowledge-tycoon`,
   💰 ready in Studio) — THE Gimkit economy loop: answer → cash →
   UPGRADE SHOP → snowball. Upgrades: CASH/ANSWER ×5 lvls
   (+10/25/60/150/400), STREAK BONUS ×4 (+$n × streak, cap ×10),
   AUTO-MINER ×4 ($/sec passive), TIME WARP ×3 (+15s). Win = cash ON
   HAND reaches target before the clock (spend-vs-bank tension). Diff:
   easy $1800/150s · normal $2500/120s · hard $3600/105s. Pure core
   `window.KT._core`; full skilled-player sim WINS easy (verified).
2. **`games/gold-rush.html`** (template id `gold-rush`, 🪙 ready) —
   Blooket Gold Quest luck loop: correct answer → pick 1 of 3 mystery
   chests (weighted: gold 40-100/110-200, jackpot 240-400, DOUBLE
   capped +1200, STEAL 30% of richest rival, SWAP fortunes, CAVE-IN
   −30%, empty) vs 3 AI rivals (NOVA-7/VEX/ORION) who dig every round
   — hard mode rivals raid the player. 12 rounds, most gold wins,
   wrong answer = no chest but rivals still dig. Live leaderboard
   chips. Pure core `window.GR._core`.
3. **POWER-UPS in the duel** (Gimkit items element) — Studio config
   toggle `powerups` (default on): streak milestones grant one-use
   items: 3 → 🔍 50/50 (dims two wrong answers), 5 → 💊 HEAL +22,
   7 → ⚡ 2× NEXT HIT (armed state). #puBar renders under the status
   strip; all gated by config; reset per match.
4. Studio: 4 ready templates now (duel, lane defense, tycoon, gold
   rush) + 2 coming-soon; POWER-UPS select in the form, carried in
   `studioConfigOf`, restored on edit.

Verification: syntax gates ×5 files clean; Node tests **29/29**
(tycoon economy math, buy/afford rules, time warp, auto-miner income,
win/lose conditions, FULL winning sim; gold-rush weighted distribution,
all 8 outcomes, steal/swap/lose/double-cap math, rival bands + hard
raids, 12-round termination + winner calc; duel power-up hooks).
NEEDS live play of both new games + power-up feel.

## Ninth pass (same session) — SCI-FI MANDATE + Escape Protocol (Ennis)

**LOCKED DIRECTION: every Battle Arena game is future/sci-fi/tech
themed.** Ennis referenced Archero 2, Project Entropy, Kingshot, Wittle
Defender, Planet Defense TD, Blooket CryptoHack, Gimkit Don't Look Down
/ No Way Out, escape rooms, Geometry Dash, D&D, Haypi Monsters — and
asked about engines (Godot? Gimkit Creative's stack? CoSpaces?).

**Engine decision (researched):** Gimkit does NOT publish its stack —
custom in-house web tech w/ own physics (staff-built), on Google Cloud.
CoSpaces Edu = browser WebGL 3D + Blockly-style CoBlocks. Conclusion
UNCHANGED: stay web-native. Our cartridge contract already IS the
platform; Phaser 3 gets adopted per-template when a game needs real
physics (Void Ranger/Pulse Runner); three.js (already in pathway.html)
is the CoSpaces-like 3D path later; Godot stays optional for advanced
creators via future cartridge upload — never a platform dependency.

**Shipped:**
1. **Gold Rush → CRYPTO HEIST** (sci-fi retheme, = Blooket CryptoHack):
   encrypted caches 🗄, ₵RYPTO, COLD WALLET, MOTHERLODE, OVERCLOCK,
   HACK RIVAL, WALLET SWAP, FIREWALL TRACE, CORRUPTED cache; blocks not
   rounds; "MASTER NETRUNNER"/"OUT-MINED". Mechanics, weights, and
   game id `gold-rush` UNCHANGED (verified: steal math + weight sum
   100 intact) so published games keep working.
2. **Knowledge Tycoon sci-fi copy**: CREDITS BANKED, 💳 CREDITS/ANSWER,
   🛰 ORBITAL MINER, 🧪 UPGRADE LAB, BOOT THE STARTUP, UNICORN STATUS /
   SERVERS SEIZED.
3. **`games/escape-protocol.html`** (template id `escape-protocol`,
   🔓 ready) — No Way Out/escape room: 5 bulkheads (CARGO BAY → REACTOR
   → LAB DECK → BRIDGE → ESCAPE POD), each needs N correct codes
   (easy 2/2/2/3/3 · normal 2/2/3/3/4 · hard 2/3/3/4/4), O₂ timer
   (320/260/210s, red pulse <25%), wrong code = security lockout
   (6/8/10s, O₂ keeps draining), 3 hint chips (50/50). Terminal
   aesthetic w/ scanlines. Score = doors×20 + correct×8 + O₂/2 +
   streak×5 + 50 win. Pure core `window.EP._core`.
4. **Studio: 5 ready templates** (Duel, Lane Defense, Tycoon, Crypto
   Heist, Escape Protocol) **+ 4 sci-fi coming-soon tiles** telegraphing
   the agreed roadmap: 🤖 Mecha Tamer (Haypi/Dislyte), 🎯 Void Ranger
   (Archero — Phaser), ⚡ Pulse Runner (Geometry Dash — Phaser),
   🎲 Star Saga (sci-fi D&D campaign).

Verification: syntax gates ×6 files clean; Node **16/16** (escape door
progression, lockout+O₂ concurrent drain, hint depletion, full
14-answer escape WIN, O₂-death LOSS, post-death input ignored, score;
heist mechanics unchanged post-retheme; studio 5+4 registration).
NEEDS live play of Escape Protocol + retheme eyeballs.

## Tenth pass (same session) — VOID RANGER: first Phaser 3 template (Archero-style)

**`games/void-ranger.html`** (template id `void-ranger`, 🎯 READY in
Studio — 6 playable templates now). The first cartridge on a real game
engine: **Phaser 3.55.2 pinned from cdnjs** (URL verified HTTP 200),
arcade physics, procedural textures via generateTexture (hero circle /
drone triangle / bolt rect — zero asset files), transparent canvas over
the shared BG themes, Scale.FIT for mobile. Graceful fallback message
if Phaser fails to load.

Gameplay (Archero 2 signature): drones spawn from the arena edges and
chase; the ranger **auto-fires at the nearest drone ONLY while
standing still** — move (WASD/arrows/hold-pointer) to dodge, stop to
shoot. Contact damage per second. Between the 5 waves: a deck question
gates the ABILITY DRAFT — correct → pick 1 of 3 from: 🔱 MULTISHOT
(+1 bolt, spread volley), ⏩ RAPID FIRE (25% faster), 💥 POWER CELL
(+40% dmg), 🚀 THRUSTERS (+20% speed), 🧬 NANOREPAIR (+40 HP, +10 max),
🗡 PIERCE (+1 passthrough); wrong → "DECODE FAILED — NO UPGRADE".
Difficulty scales wave count/hp (0.8/1/1.3). Score = kills×4 + wave×15
+ correct×10 + streak×5 + 50 win.

Pure core `window.VR._core` (abilities, waves, draft, score) tested
headlessly: **13/13** incl. ability stacking, wave/difficulty ramps,
deterministic draft, and a balance proof (multishot+power+rapid hero
clears the final wave's HP budget in <60s of fire). Phaser scene logic
(overlap, spawn queue, chase, cull) is conventional arcade code but is
the ONE part that truly needs Ennis's browser play-test — first Phaser
usage in the ecosystem.

## Eleventh pass (same session) — ALL 9 GAMES DONE + HOST LIVE SESSIONS (Ennis)

Ennis locked the distribution model: **hosts bind decks and LAUNCH games
to Side Quests for a time window (Gimkit/Blooket class-session style);
players play while it's live.** Free-play by players is NOT the model —
the host controls what's live and when.

### Three final game templates shipped (all 9 tiles now READY):
1. **`games/pulse-runner.html`** (`pulse-runner` ⚡, Geometry Dash) —
   canvas auto-runner, speed ramps 230→520, TAP/SPACE/↑ jump firewalls,
   crash = KNOWLEDGE CHECKPOINT (correct = free resume + 28% slowdown +
   grace zone; wrong = burn 1 of 3 shield cores), reach 1500/2000/2600m.
   Bug found by test + fixed: instant double-jump before first physics
   step (now requires vy<=0 grounded).
2. **`games/mecha-tamer.html`** (`mecha-tamer` 🤖, Haypi/Dislyte) —
   turn-based battler: correct = strike (atk + streak×2 ≤+12), wrong =
   counter (reduced by stage armor). 4 wild machines (RUST CRAWLER →
   ION WASP → PLASMA GOLEM → VOID LEVIATHAN), mech EVOLVES 🐕 SPARK PUP
   → 🐺 VOLT HOUND → 🦾 STORM TITAN after battles 1 & 3 (full heal),
   25% field repair otherwise, one 🔧 repair-kit revive at 50%.
3. **`games/star-saga.html`** (`star-saga` 🎲, sci-fi D&D) — 8 authored
   chapters aboard the derelict megaship VANTA, 2 approaches each
   (DC / fail dmg / xp tradeoffs), question sets the dice: correct =
   ADVANTAGE (2d20 keep highest +4), wrong = 1d20−2; animated die roll;
   boss (THE HELMSMAN) needs 2 successful strikes; difficulty adjusts
   DC ±2, fail dmg, and starting HP 34/30/26.

### LIVE SESSIONS system (`baSessions`, Supabase row `pflx_ba_sessions`)
- Session = { id, title, template, deckId, config, launchedBy(+Name),
  startsAt, endsAt }. Read-modify-write like decks/games; long-expired
  (>2d) pruned on write; boots 1300ms.
- **Host launch controls in the Studio config form** (isHostUser only):
  duration select (15m/30m/1h/2h/6h/24h/1week) + 🔴 LAUNCH LIVE — uses
  the SAME form (template, deck, all asset config), so a launch carries
  full theming. ACTIVE SESSIONS list below with ⏳ countdown + ✕ END
  (sets endsAt to now).
- **Side Quests "🔴 LIVE NOW — HOST SESSIONS" shelf** (above player-made
  games): red-glow cards w/ emblem, host brand, countdown, LIVE badge;
  click = play with the session's deck+config; expired sessions vanish
  (45s auto re-render on side_quests/studio keeps countdowns fresh).
- `arenaSessionPlay` guards: ended → alert+refresh; deleted deck /
  missing template → alert.

### Verification
Syntax gates: preview.html + ALL NINE game files clean. Node: **26/26**
(runner physics/crash/cores/win + double-jump regression; tamer
evolve/repair/loss/full-win-to-TITAN; saga advantage math, chapter
advance, boss 2-hit, death; sessions active-window filter incl. future
sessions, countdown labels, early end, pruning, 1-week duration).
NEEDS live browser pass on the 3 new games + a real host launch.

## Twelfth pass (same session) — HOST LAUNCHPAD + SEASON MODE (Ennis model lock)

**Ennis confirmed the full distribution model** (now all live):
- Studio = PLAYERS create games from assets/templates → publish →
  🛠 PLAYER-MADE GAMES panel in Side Quests (was already live).
- Hosts see ALL game modes in a dedicated dashboard and must LAUNCH a
  mode (deck attached + time frame) before players can play it —
  Gimkit/Blooket style.
- A launch can span a FULL SEASON and be replayable at higher levels.

**Shipped:**
1. **🎛 HOST LAUNCHPAD** (`renderHostModes`, screen `host_modes`,
   host-only button in the Side Quests header) — grid of all 9 READY
   game modes, each card with: session title, deck attach (≥4 cards),
   duration (15m→1week + **Full Season 90 days**), base difficulty,
   and **Season mode toggle**; 🔴 LAUNCH per mode. ACTIVE SESSIONS
   management strip on top (countdowns + ✕ END).
2. **SEASON MODE — level-up replays**: `sessionLevelFor/LevelUp/
   DifficultyFor` — a season session starts every player at LVL 1
   (easy); each WIN advances their level (normal → hard, capped);
   level stored per (session, browser) `pflx_sess_lvl_<id>`; the
   result handler bumps it on `won && seasonMode`. LIVE cards show
   "🎚 YOUR LVL n/3".
3. **6 new sci-fi coming-soon tiles** registering Ennis's requested
   game types: 🧗 Sky Climb (Don't Look Down), 🥷 Stick Circuit
   (stickman fighter), 🏟 Nexus Legends (Mobile Legends MOBA),
   🛡 Cyber Agents (co-op beat-em-up — ENNIS REJECTED the TMNT angle;
   the 4 playable characters are CyberSecurity Agents of the STARTUP
   STUDIOS: MINDFORGE, INNOV8, GENTECH, eMAGINATION — pull studio
   names/branding from the platform's Startup Studios data when
   building), 🏙 Neo City (SimCity builder),
   🤼 Circuit Brawl (Brawlhalla platform fighter). NOTE for next
   sessions: Sky Climb + Neo City are canvas-feasible next; the three
   real-time fighters (Stick Circuit / Shell Strike / Circuit Brawl)
   and the MOBA need Phaser + iterative browser testing — build one
   per session with Ennis play-testing.
Verification: syntax gate clean; Node 16/16 (level ladder easy→normal→
hard w/ cap, non-season respects configured difficulty, Full Season
registered, route + win-hook + 9 ready/6 soon tiles). Studio's own
launch controls remain as a shortcut for hosts.

## Thirteenth pass (July 3-4 2026) — BATTLE ARENA CREATOR + covers + model corrections (Ennis)

Ennis corrections this pass:
1. **Rift & Cipher reported missing from Side Quests.** Code audit: they
   were never removed (getAllModes/MODES intact); a runtime throw in the
   injected LIVE/player-made sections would blank the whole screen.
   FIX: both injected sections + the host Launchpad button are now
   wrapped in try/catch — a failure logs a console warning and returns
   '' so the built-in mode cards can NEVER be taken down. If Ennis still
   sees them missing after deploy, check browser console for
   '[sq] ... render failed' and the CUSTOM_MODES/mode-admin data.
2. **Player model confirmed**: Side Quests = host-launched active
   sessions + player-published games only. Players NEVER configure.
   (Already true; template studio remains for creation, not play.)
3. **BATTLE ARENA CREATOR** (renamed from Studio; Ennis) —
   **`public/creator.html`** NEW: standalone three.js r128 game-creation
   engine (Gimkit Creative / Delightex / Roblox Studio direction):
   - 12-asset palette (floor tile, wall, pillar, cargo block, spawn
     pad, question terminal, energy core, gate, turret, hazard zone,
     ramp, glow beacon) — all procedural sci-fi meshes w/ emissive
     materials, no asset files.
   - Click-asset → click-map placement w/ grid snap; click select;
     drag move; R rotate; raise/lower; duplicate; Del delete; Esc.
   - Custom orbit camera (drag orbit, wheel zoom, shift-drag pan),
     fog, 3-light rig, spinning energy cores, point-light beacons.
   - Maps saved to Supabase row **`pflx_ba_maps`** (read-modify-write,
     cap 60) + localStorage; LOAD picker w/ delete; EXPORT/IMPORT JSON.
   - Opens in a NEW TAB from the Side Quests "Battle Arena Creator"
     card and from the Template Studio header button. **Ennis then
     said it could also live in the Console** — it's a standalone
     page (arena vercel.json already sets frame-ancestors *), so the
     Console can iframe it as an app tile whenever wanted; note both
     entry points remain valid.
   - v2 roadmap: device/channel logic wiring, play-test mode with a
     walking character, PUBLISH map as a playable cartridge.
4. **Game-mode COVER IMAGES** — `img` field on STUDIO_TEMPLATES + the
   Launchpad cards render 16:7 covers (onerror-hidden if missing).
   **9 covers generated programmatically (PIL) and committed** to
   `public/games/covers/<id>.png` (per-game palette + motif art).
   IMAGE PIPELINE ANSWER (Ennis asked for an MCP that creates images
   "from GitHub"): no such MCP exists — the flow is generate → commit
   to GitHub → Vercel serves. Options: (a) these committed PIL covers
   (live now), (b) **Adobe for creativity connector (Firefly)** once
   Ennis authorizes it — premium AI covers, then commit, (c) Canva
   connector (also needs auth).
5. **QUALITY-GRAPHICS MANDATE (Ennis)**: every game should use quality
   three.js graphics or better. Roadmap: Creator + Void Ranger lead;
   progressively upgrade each 2D cartridge with WebGL scenes (three.js
   background layers first, then full scenes), one per session with
   Ennis play-testing. Logged as the standing graphics direction.
6. **Quizlet datasets**: importer is live (DECKS screen paste flow) —
   Ennis will supply real exported sets; no code needed.

## Fourteenth pass (July 4 2026) — P0: ALL GAME LAUNCHES 404'D IN PROD — FIXED

Ennis screenshot: Vercel 404 NOT_FOUND when playing a live session.
ROOT CAUSE: arena vercel.json serves the repo ROOT (outputDirectory
'.') with only `/` rewritten to /public/preview.html — the launcher
iframes `games/<id>.html` → /games/... = 404. EVERY game launch,
cover image, and creator.html was affected (games were never
browser-launched in prod until now). FIX: rewrites added →
/games/:path* → /public/games/:path* and /creator.html →
/public/creator.html. **VERIFIED LIVE: all three URL classes return
200.** RULE for future arena work: any new file in public/ that the
app references by URL needs a rewrite entry.
Also this pass: Launchpad shows all 15 modes (dev tiles dimmed
🚧 IN DEVELOPMENT) + visible build stamp (v2026-07-04.1) in the Side
Quests header for cache diagnosis.

## Fifteenth pass (July 4 2026) — STORYLINES + GRAPHICS LAYER + GAME MUSIC (Ennis)

All NINE game cartridges upgraded in one universal injection pass:
1. **MISSION BRIEFING intros** — every game now leads with an
   in-universe STORYLINE (typewriter effect, accent-colored lore
   panel; unique fiction per game — Cognition Circuit, Outpost K-77,
   Neo City startup, abandoned blockchain, station VANTA-9, void
   sector, collapsing data-highway, scrapworld tamers, megaship VANTA)
   + a "▸ HOW TO PLAY" panel with 4 concrete gameplay instructions.
   Injected before #introSub; intro screens now overflow-y:auto.
2. **Animated graphics layer** — #bgfx fixed canvas behind gameplay:
   110-star parallax field w/ twinkle + 3 drifting accent-tinted
   nebula glows. Ennis then said: use the layer only AS IT SUITS each
   game and push real 3D per game — logged as the graphics directive
   (see priorities below).
3. **PROCEDURAL GAME MUSIC** (Ennis: "standard game mode music") —
   WebAudio synth soundtrack engine baked into every cartridge, NO
   audio files: bass + arpeggio (mood scale) + pad chords + hats on an
   8th-note scheduler. Per-game identity: duel tense 112bpm · lane
   march 100 · tycoon upbeat 122 · heist dark 96 · escape eerie 84 ·
   ranger drive 128 · runner drive 140 · mecha march 108 · saga eerie
   76. 🎵 toggle button top-right (persists localStorage
   pflx_bgm_muted), starts on first gesture (autoplay policy), and a
   **GAME MUSIC on/off option in Studio config + Launchpad launches**
   (config.music → engine disables). All gates clean ×10 files.

## GRAPHICS DIRECTIVE (Ennis, July 4): per-game 3D upgrades
- Starfield layer only where it fits; each game gets REAL 3D (three.js)
  as suits it: Mecha Tamer = 3D mechs in arena; Crypto Heist = vault
  room; Duel = 3D card table; Lane Defense/Void Ranger = 3D fields.
  One game per session with Ennis play-testing. Engine guidance:
  stay three.js/Phaser web-native (cartridge iframes); Godot/Unity
  desktop downloads DON'T fit the iframe platform; useful GitHub
  resources: three.js examples repo, Kenney.nl CC0 asset packs
  (kenney.nl — downloadable, commit into public/), Quaternius CC0
  low-poly GLTF packs, pmndrs/drei patterns. GLTF models + Kenney/
  Quaternius assets committed to the repo = the fastest real-3D lift.

## NEXT SESSION PRIORITIES (Ennis: "continue to develop the new games")
1. Live play-test pass with Ennis — launches actually work now.
2. Graphics mandate: three.js scenes into the 2D cartridges one at a
   time (start w/ Mecha Tamer arena or Crypto Heist vault room).
3. Build Sky Climb + Neo City (canvas-feasible), then Phaser fighters
   (Stick Circuit, Circuit Brawl, Nexus Legends, Cyber Agents w/
   Startup Studios characters MINDFORGE/INNOV8/GENTECH/eMAGINATION).
4. Creator v2: logic devices, play-test mode, publish-to-Side-Quests.
5. Adobe Firefly covers once Ennis authorizes the connector.

## Roadmap — Gimkit Creative-style Studio v3 (discussed, not built)
- Device/channel event system ("when X → transmit on channel → Y
  listens"): portable as a visual RULES BUILDER on top of templates
  (trigger: streak/score/time/hp → action: grant item, spawn wave,
  bonus, message). The Automations engine in MC (`mcAutomationsFire`)
  is the in-house pattern to mirror.
- Multiplayer live sessions (Gimkit is class-live): host starts a
  lobby, players join via Supabase Realtime — reuse the cipher lobby
  plumbing.
- Map/terrain editor (top-down or platformer) = the full Creative
  vision; only after the rules layer proves out.

## Next steps (Battle Arena Studio roadmap)
1. First game template: **Quiz Card Duel** (Phaser 3) bound to a deck +
   the `pflx_arena_deck` play-side wiring in /cartridges.
2. Deck picker on cartridge config (bind deck ↔ game).
3. Studio shell (template picker → configure → export cartridge).
4. Score → XC connector through the approvals/instant-credit economy.
- Nova-inspired later: component rarity for ship/game items, daily
  mission points tied to MC streaks.

---

# Session Update — July 2 2026 (Fable) — EVE-STYLE COMBAT COMMAND LAYER (Open Space Phase A+B)

Ennis directive: Core Pathways UI + game mechanics should mimic Eve Online
and Nova: Space Armada — controls, graphics, interactions, weapon controls.
Researched Nova (fleet builder: Shield→Armor→Hull layers, Accuracy/Evasion,
kinetic/missile/laser weapon triangle, component rarity + daily loops).
Eve supplies the command layer. Phase A+B shipped this session.

## What shipped (`pflx-pathway-portal`, pathway.html — `pflxCombat` IIFE)

Search anchor: `EVE-STYLE COMBAT COMMAND LAYER`. Window API: `window.pflxCombat`.

1. **Target locking** (`pflxCombat._tgt`) — clicking a contact in chase/
   cockpit now LOCKS it (was: auto-fly). Animated lock cycle 1.4s (0.7s
   with deep-scanner), max 3 simultaneous locks, Tab cycles the active
   target. Target cards top-right: icon, name, live distance, HP bar
   (asteroids), ▸ APPROACH and ✕ unlock buttons; destroyed targets linger
   1.4s with 💥 DESTROYED then drop. In-world spinning lock reticle on the
   active target (in #nodeLayer, hidden in bird's-eye). Approach REFUSES
   black holes ("NAV REFUSAL").
2. **Capacitor** (`pflxCombat._cap`) — pool 90 + speedMult×30, regen 7/s;
   modules drain it; empty cap deactivates modules + "CAPACITOR LOW"
   toast. Eve-style circular gauge (gold arc, segmented base ring).
3. **Module rack** (`pflxCombat._rack`) — bottom-center HUD hub, F1–F4 or
   1–4, click too. Slots: F1 BLASTER (always owned; auto-cycles on active
   asteroid target 520u; accuracy 0.85 / 0.95 mk2 — misses fire an offset
   bolt + MISS floater — Nova accuracy/evasion), F2 MINING (mining-laser
   system; 3s ranged cycle, ×2 payout, mirrors hazard-mining rewards),
   F3 TRACTOR (tractor-beam; collects derelicts/comets at 620u), F4
   SHIELD (shield-booster or shieldAura; toggle, 6 cap/s, cuts black-hole
   pull to 0.12 — patched into pflxSpaceHazards force calc). Cooldown
   conic-gradient sweep, active glow, unowned slots show 🔒 → Ship Bay
   toast. Legacy SPACE blaster untouched.
4. **HUD hub** also shows SHD/ARM/HULL tri-bars (Nova layered defense —
   cosmetic scaffolding until Phase D wires damage; SHD shows OFFLINE
   without shield hardware; refreshed on pflx_ship_state_update) and a
   speed readout in the capacitor ring.
5. **Overview panel** (`pflxCombat.toggleOverview`, O key, ☰ OVERVIEW rail
   button at bottom:280px) — Eve overview: sortable table (name/dist/
   status) of stations (all), space objects <5200u, crew ships. Click =
   lock, double-click = approach, black holes marked ⚠ AVOID. Refreshes
   0.9s while open. Works in every camera mode.
6. **Integration** — pflxCombat.tick(1/60) driven from pflxKeyLoop after
   pflxBlaster.tick. Combat HUD/target bar CSS-gated to cam-chase/
   cam-cockpit.

## Verification
- Syntax gate: 4 inline blocks, node --check, 0 failures.
- Node behavioral harness (stubbed DOM): **20/20 pass** — lock lifecycle,
  max locks, Tab cycle, cap spend/regen/refusal, ownership gating,
  blaster cycle damage, destroyed-target linger/drop, shield drain,
  black-hole nav refusal.
- NEEDS Ennis live play-test: visuals/layout of the hub + target bar,
  key conflicts, feel of lock-then-shoot loop vs old click-to-fly.

## Roadmap agreed with Ennis (phases)
- **Phase C** — Approach/Orbit-at-range/Keep-at-range autopilot + radial
  context menu on contacts.
- **Phase D** — NPC pirates/drones (orbit+fire AI), real damage to the
  SHD/ARM/HULL bars, weapon-type triangle (kinetic/missile/laser — Nova),
  loot drops, hit feedback (camera shake, damage numbers).
- **Phase E** — graphics: GLTF hulls, warp-lane beams, volumetric
  nebulae, instanced asteroids; move engine to src/pflx3d if the inline
  file gets too heavy.
- **Nova-inspired later**: component rarity tiers for ship systems in the
  Ship Bay; daily mission points tied to the MC streak system.
- IP note: mimic the FEEL, never Eve/Nova assets, names, or art.

---

# Session Update — July 2 2026 (Fable) — Video calling FIXED + Project cohort chat

## The bug (Ennis: "I tried to call a player and it did not go through")

**Root cause found and confirmed against the live Supabase project with a
two-client Node test:** every chat participant holds a passive invite-listener
channel on topic `pflx-call-<threadId>`. Starting/joining a call created a
SECOND channel on the SAME topic on the SAME client — Phoenix allows one join
per topic per socket, so the second `subscribe()` callback NEVER fires
(verified: 8s hang, no status). The old code did a bare
`await new Promise(... if SUBSCRIBED resolve ...)` → hung forever → the
invite was never broadcast → callee never rang. No error surfaced.

Second defect: the realtime `postgres_changes` thread-sync handler never
called `_pcCallAttachInbound()`, so a callee whose client learned about a
brand-new DM via realtime had NO invite listener for it — calls on fresh
threads were unreceivable.

## Fixes shipped (`pflx-platform`, preview.html)

1. `_pcCallDetachInbound(threadId)` — removes the passive listener BEFORE
   creating the active call channel (both caller + joiner paths). Re-attached
   on hangup (600ms defer).
2. `_pcCallSubscribe(ch)` — subscribe wrapped in a promise that actually
   settles: SUBSCRIBED resolves; CHANNEL_ERROR / TIMED_OUT / CLOSED or 12s
   rejects → surfaced as a toast instead of a silent hang.
3. Realtime thread-sync handler now calls `_pcCallAttachInbound()` so new
   threads ring immediately.
4. Ring feedback — 45s `ringTimer` on the caller: "No answer — they may be
   offline" + toast. Cleared when any peer materialises and on hangup.
5. `offer` payload now carries `fromName` so call tiles show names, not ids.

## Project cohort chat + group calls

- New engine API `window.pflxChatEnsureGroupThread(name, participantIds,
  {projectId, open})` — dedupes by name, syncs membership (new cohort
  members get added on re-open), creates inside `_pcThreads` (the engine's
  source of truth), saves via `_pcSave`, attaches the call invite listener,
  opens the thread. Caps-gated (`enabled` + `group`).
- `pflxStartProjectChat` now DELEGATES to it. The old path wrote
  localStorage + cloud behind the engine's back — the engine's next
  `_pcSave` clobbered the new group with its stale in-memory copy, and
  `pflxChatOpenThread` couldn't find the thread. Legacy path kept only as
  fallback when the engine isn't booted.
- Group calls from a project thread already work (mesh, CALL/SHARE buttons
  show for groups; invite prompt says "in <group name>").

## Verification

- Live Supabase test (Node, 2 clients): duplicate-topic subscribe = HANG
  (old bug reproduced); detach-then-create = SUBSCRIBED; cross-client
  invite delivery = OK.
- Syntax gate: 12 inline blocks, node --check, 0 failures.
- STILL NEEDS a human 2-browser play-test (camera/mic permissions + real
  WebRTC media can't be exercised from the sandbox). No TURN yet — calls
  across symmetric NAT still need a TURN server (known Bundle F item).

---

# Session Update — July 2 2026 (Fable) — MC Project card: Progress hero panel

## What shipped (`pflx-platform`, preview.html, `mcRenderProjects`)

Ennis request: on the MC Project card, Progress must sit ABOVE "Tasks in this
Project" and be more visually distinct.

1. **Reorder** — `progressPanel` now renders first in the card body (before
   `projTasksPanel`, FLP pill, checklist, submissions).
2. **Hero treatment** — new panel design:
   - **SVG progress ring** (58px, r=23) with the percent inside (✓ at 100%).
   - **Dynamic accent** by completion: cyan 0% → orange >0 → gold ≥33 →
     light-green ≥66 → green 100%. Drives gradient background, border,
     left accent bar, glow shadow, ring, and the kicker color.
   - Kicker renamed **📊 MISSION PROGRESS**; bar bumped to 14px height;
     XC readout upgraded to a framed gold pill; COMPLETE chip at 100%.
   - Panel uses `margin-bottom:14px` (it leads the stack now).
3. Verified with the standard syntax gate (12 inline script blocks,
   `node --check`, 0 failures).

4. **Player Portal parity (same session)** — ProjectDetail's flat purple
   progress panel replaced with the identical hero treatment (ring +
   dynamic accent). Uses `done` / `totalUnits` ("assignments completed").
5. **Clickable links (Ennis, same session)** — new global helper
   `window.pflxLinkify(text)` (defined next to `_mcProgressBarHtml`):
   escapes HTML first, then wraps `https://` / `http://` / `www.` URLs in
   cyan `target="_blank" rel="noopener noreferrer"` anchors with
   `event.stopPropagation()` so links inside clickable rows/cards don't
   trigger row navigation. Trailing punctuation is excluded from the URL.
   Applied to 8 description render sites: MC Project card, MC task row
   (CSS-clamped), task board card, Player ProjectDetail, Player Task
   Detail, secondary project card (~32985), and the two template-literal
   player-portal sites (~44996/45024). Substring-truncated previews keep
   plain `escapeHtml` (a cut URL would produce a broken link). Use
   `pflxLinkify` for any future user-entered description render.

---

# Session Update — July 2 2026 (Opus, morning) — Bundle F pass 2

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| _pending push_ | Bundle F pass 2: @mentions + push_slack/discord + WebRTC calls + host presence + cohort chat controls |

## What shipped

### Automations engine — outbound push actions
`_mcAutomationRunActions` gained two new action types:
- **`push_slack`** — POSTs the interpolated `value` to the webhook stored at `localStorage['pflx_chat_slack_webhook']` (same key used by the Chat bridge bar).
- **`push_discord`** — same, keyed on `pflx_chat_discord_webhook`, payload shape `{content: ...}` per Discord.

Template variables `{{taskId}}`, `{{playerId}}`, `{{xcReward}}`, etc. are interpolated from the automation `ctx`. Missing webhook → silent `console.warn` (no user-visible error).

### PFLX Chat — @mentions
- `pflxChatSend` scans the outgoing text for `@name` tokens, resolves them against thread participants (case-insensitive brand match), and stores the resolved IDs in `msg.mentions[]`.
- `_pcCheckMentionsForMe` runs on every cloud pull and every realtime push. When an unseen message mentions the current player, it fires a `pflxToast('💬 X mentioned you: …', 'info', 6000)` and plays the nav SFX. `_pcPrimeSeen` baselines the seen-set on boot so old messages don't retro-toast.
- Bubble render highlights every `@name` as an amber chip; the bubble itself gets an amber border when it mentions the current player.

### PFLX Chat — Video calls + screen sharing (WebRTC)
- New CALL and SHARE buttons in the chat header (shown only when a DM thread is open and cohort caps allow).
- New in-panel overlay (`#pflx-chat-call-overlay`) with remote video, floating local PIP, and Mute / Camera / Share / End controls plus a call timer.
- Signaling piggybacks on Supabase Realtime broadcast per-thread channel: `pflx-call-<threadId>` with events `offer`, `answer`, `ice`, `hangup`.
- STUN: Google's public servers. **No TURN yet** — calls behind symmetric NAT will fail (add a TURN service if this becomes an issue).
- `pflxChatCallToggleScreen` swaps the outgoing video track between camera and `getDisplayMedia()` via `RTCRtpSender.replaceTrack` — no renegotiation needed.
- Incoming call is announced via a `confirm()` banner tied to a passive per-thread inbound channel. Group-thread calls are deferred (calls are 1:1 for now).
- A short **system** message (`system: true`) drops into the thread when a call starts — rendered as a centered subdued line ("📹 Started a call · 3:42pm").

### Host cohort Chat Controls
- New **💬 Chat Controls** button on each cohort card in the Cohort Groups admin view.
- Modal toggles six caps on `cg.chat`: `enabled`, `dm`, `group`, `video`, `screen`, `bridges`. Defaults are all-on.
- `_pcMyCaps()` reads the active player's cohort and returns the resolved caps. Admins/hosts always bypass caps.
- Every user-facing entry point is gated:
  - `pflxChatToggle()` refuses to open when `enabled=false`.
  - `pflxChatShowCompose()` refuses to make DMs / groups per caps.
  - CALL / SHARE header buttons hidden per `video` / `screen`.
  - `pflxChatPushBridge()` refuses without `bridges`.
- Cohort card summary chip surfaces which caps are off ("no video · no bridges") or an "all chat on" pill when everything is default.

### Host Live Roster + presence
- New **🟢 LIVE** toolbar button — visible only for admin / host / teacher / instructor roles. Badge count colored by highest active state (cyan = someone in a call, orange = someone chatting, green = idle-online).
- Supabase Realtime **Presence** channel `pflx-presence` tracked per player. Payload includes playerId, name, role, cohort, image, activity (`online` / `chatting` / `in-call` / `sharing`), threadId, threadName, timestamp.
- `window.pflxChatState()` is exposed by the chat IIFE and read by the presence IIFE every 8s (plus on `visibilitychange`) — activity mirrors the chat panel + call state without tight coupling.
- Live Roster panel (top-right) lists everyone currently online sorted by activity: in-call → chatting → online. Each row shows avatar, name (+ HOST badge for staff), cohort chip, and a colored activity line.
- Hosts get a `pflxToast('📞 X started a video call with …', 'info')` the moment a player's activity transitions into `in-call` / `sharing`.

## Files touched

- `PFLX Overlay/pflx-platform-check/preview.html` — all chat/presence/cohort work is in this single file.

## Deferred (Bundle F pass 3+)

- **TURN server** so calls work behind symmetric NAT.
- **Group calls** (>2 participants; mesh or SFU).
- **Supabase edge function** for live `webcal://` calendar subscription.
- **DarkCampus ↔ PFLX Chat bridge** — bidirectional mirror between DC channels and PFLX Chat groups.
- **Slack/Discord inbound** — receive replies posted to the bridged channel back into the PFLX thread (needs an edge function per platform).
- **Call recording** — server-side capture of the media stream.

---

# Session Update — July 1 2026 (Sonnet, late) — Bundle F pass 1

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `8d82559` | Bundle F pass 1: Standalone PFLX Chat + Calendar .ics export |

## Standalone PFLX Chat

Toolbar CHAT button no longer opens DarkCampus Quick Chat. It opens a new standalone PFLX Chat panel with DMs, group chats, and outbound bridges.

**Data model** — Supabase row `pflx_chat_threads`:
```
{ threads: [{
    id, type: 'dm'|'group', name, participants: [playerId],
    messages: [{ id, senderId, senderName, text, at, readBy: [] }],
    createdAt, updatedAt, createdBy
}] }
```
- localStorage mirror `pflx_chat_threads` for offline / boot speed.
- Debounced 700ms cloud push. `_pcSelfWriting` flag guards against realtime echo.
- Realtime channel `pflx-chat-live` with `postgres_changes` filter.

**UI** — bottom-right 420×560 slide panel.
- Header: back arrow, thread title, `+ NEW` button, close.
- **Thread list**: last-message preview, pink unread pill, GROUP chip when applicable.
- **Message view**: bubble style, own messages cyan-gradient right-aligned, others grey left-aligned. Sender label surfaces in group chats.
- **Composer**: Enter sends, Shift+Enter newline.
- **Bridge bar** — 📧 EMAIL (mailto: link), 💼 SLACK (webhook POST), 🎮 DISCORD (webhook POST). Webhook URLs stored in localStorage per user.
- **+ NEW** flow: number-list picker of the roster. Pick one for DM, several for group (prompts for group name). DM creation is idempotent — picking an existing DM partner jumps to that thread.

**API surface**:
- `window.pflxChatToggle()` — open/close panel
- `window.pflxChatShowCompose()` — new-message picker
- `window.pflxChatOpenThread(id)` — jump to a thread
- `window.pflxChatSend()` — send from composer
- `window.pflxChatBackToList()` — back to thread list
- `window.pflxChatPushBridge('email'|'slack'|'discord')` — outbound push
- `window.pflxChatRender()` — repaint

## Calendar export (`.ics`)

- **`mcExportCalendarIcs()`** builds a full VCALENDAR with:
  - VEVENT per Task with `dueDate` (all-day, `PRIORITY` mapped from urgent/high/normal/low → 1/3/5/7, `CONFIRMED` if approved else `TENTATIVE`)
  - VEVENT per Checkpoint spanning `startDate → endDate`
- Downloads `pflx-mc-YYYY-MM-DD.ics`. Google Calendar Import + Apple Calendar double-click both consume it.
- **`mcCalendarSubscribeInfo()`** alert explains the webcal:// live-sync path needs a Supabase edge function (queued for pass 2).

## Command palette additions

- **Open Chat** (💬)
- **Export MC to Calendar (.ics)** (📅)
- **Subscribe MC Calendar (webcal)** (📅)

## Deferred (Bundle F pass 2+)

- **Supabase edge function** serving live `webcal://` so Google/Apple Calendar auto-refresh MC events without re-importing.
- **X-Bot outbound bridges** — automations engine action `push_slack` / `push_discord` firing on `task.approved` / `checkpoint.completed` via the same webhook pattern.
- **@mention** with push toast to the mentioned player.
- **DarkCampus ↔ PFLX Chat bridge** — messages posted in a DarkCampus channel show up in a matching PFLX Chat group (bi-directional).

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle E pass 3

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `0fb7a63` | Bundle E pass 3: Dep guard-rails + row chips + Portfolio view |

## Dependency guard-rails

- `mcApproveTask` now calls `_mcTaskUnmetDependencies(task)` before proceeding. Unmet blockers → error sfx + alert listing the blocking task titles.
- Task List row gets a **⛔ N blocker(s)** chip inline (right after the priority dot). Tooltip enumerates the blockers by title.
- **🔁 Recurring** chip renders alongside when `task.recurring.frequency` is set, so the host sees at a glance the task will respawn.

## Portfolio view (Player)

- New `ppRenderPortfolio(el)` render + `playerPortalView === 'portfolio'` route.
- **Hero header** — 80px avatar + PORTFOLIO kicker + big Orbitron name + rank + XC earned.
- **Big stats row** — Approved Tasks / Completed Projects / Badges Earned / XC From Approvals / Best Streak.
- **COMPLETED PROJECTS** section — purple cards, clickable → ProjectDetail. ✓ COMPLETED chip.
- **APPROVED TASKS** section — green-accented rows sorted by `approvedAt` DESC. "Approved [date]" line + gold XC pill. Caps at 40 with overflow message.
- Empty-state copy for new players: *"No approved work yet — as tasks get approved they will build up here as your résumé."*
- ⌘K palette gains **"My Portfolio"** NAVIGATE action.

## API surface added

- `window.ppRenderPortfolio(el)` — player-side render.
- `_ppPortfolioStat(label, value, color, icon)` — small stat card renderer.
- `hexToRgb(hex)` — utility (kept local to portfolio scope).

## Deferred (Bundle E pass 4+)

- **Automations engine** — rule builder ("when task approved AND belongs to Checkpoint X → award badge Y"). Requires a small DSL model + rule editor UI + evaluator that fires on `pflx_task_approved` / `pflx_task_rejected` events. Biggest single remaining feature; deserves its own commit.
- **Sprints framework** — new `mcSprints` collection + list view + form. Simple lifecycle (upcoming → active → completed) with a start/end date range and a taskIds bundle.

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle E pass 1 + 2

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `897153c` | Bundle E pass 1: X-Bot AI priority suggestion + task breakdown |
| `211d958` | Bundle E pass 2: Dependencies + Recurring Tasks |

## Pass 1 — X-Bot AI assist (heuristic, no network)

### Priority suggestion
- **`_mcSuggestPriority({ description, dueDate, xcReward })`** scores against three signals:
  1. Description keywords (urgent/asap/blocking/deadline +3; important/key/launch +2; optional/stretch/bonus -2)
  2. Due-date proximity (overdue +4, ≤2d +3, ≤7d +1, >30d -1)
  3. XC pool (≥500 +2, ≥200 +1)
- Score ≥5 → `urgent`, ≥3 → `high`, ≤-2 → `low`, else `normal`.
- Returns `{ priority, reasons, score, summary }` for the toast.
- Task form: **🤖 SUGGEST** pill button next to the Priority label. Fills the dropdown + toasts the reasoning (up to 3 top reasons).

### Task breakdown
- **`_mcSuggestBreakdown(description)`** tries four strategies in order:
  1. Numbered list (`1. do this 2. do that`) — cleanest signal
  2. Bullet lines (`- * •`)
  3. Connector-based (`then / and then / next / after that / finally`) when 3+ steps
  4. Sentence boundaries (2–8 sentences)
- Falls through to single-step fallback.
- Task form: dedicated purple **🤖 BREAK DOWN** panel below Priority. Populates `mcTaskChecklist` so the existing checklist pipeline is untouched.

## Pass 2 — Structural task features

### Dependencies (`task.dependsOn`)
- Array of task IDs. This task can't be submitted / approved until all listed tasks are approved.
- **`_mcTaskDependenciesMet(task)`** and **`_mcTaskUnmetDependencies(task)`** helpers.
- Task form: 🔒 **Depends On** multi-select panel listing every other task. Approved deps show a green ✓ marker.

### Recurring (`task.recurring = { frequency }`)
- Frequencies: `daily`, `weekly`, `monthly`.
- On `mcApproveTask` (after streak-bonus), **`_mcSpawnRecurringNext(task)`** clones the just-approved task, resets per-instance state (`submission`, `submissions`, `approvedAt`, `startedAt`, `status:'open'`, `completed:false`), and pushes the deadline forward by the frequency.
- Preserves the recurring config so the chain continues forever until the host clears the dropdown.
- Stamps `spawnedFrom` for analytics.
- Task form: 🔁 **Recurring** dropdown (One-time / Daily / Weekly / Monthly).

## API surface added

- `window._mcSuggestPriority(opts)`
- `window._mcSuggestBreakdown(description)`
- `window.mcSuggestPriorityFromForm()` and `window.mcBreakdownTaskFromForm()`
- `window._mcTaskDependenciesMet(task)` and `window._mcTaskUnmetDependencies(task)`
- `window._mcSpawnRecurringNext(task)` — invoked automatically from `mcApproveTask`

## Deferred (Bundle E pass 3+)

- **Automations engine** — rule builder ("when X AND Y → do Z"). Big scope; deserves its own commit.
- **Sprints framework** — new `mcSprints` collection + view + form.
- **Portfolio view per player** — approved Task/Project/Checkpoint rollup as a showcase page.
- Task-row rendering: show ⛔ locked chip when unmet dependencies exist; block `pflxSubmitTaskPhaseUI` / `mcApproveTask` when deps unmet.

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle D pass 3 — **Bundle D complete**

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `c1b4e11` | Bundle D pass 3: Calendar view + Table view + streak badge in player Home |

## Calendar view (Tasks)

- Third view mode alongside List / Board. Month grid with **← PREV / NEXT →** nav.
- Tasks land on their `dueDate` cell as compact chips colored by priority (uses `MC_PRIORITY_META` rgb). Approved chips get strike-through.
- **Today cell** highlighted with a 2px cyan border + cyan-tinted background.
- Max 3 chips per day, plus a "+ N more" overflow.
- Header: month name + year + scheduled task count.
- `_mcCalMoveMonth(delta)` handles cross-year navigation.

## Table view (Tasks)

- Fourth view mode. Dense sortable columns: **Priority · Task · Status · Due · XC · Edit**.
- Click any column header to sort. Sticky ↑/↓ arrow on the active column. `_mcTableSortBy(field)` toggles asc/desc.
- Due column color-codes by urgency (green > 7d, yellow 3–7d, orange 1–2d, red overdue).
- Approved rows: strike-through + dimmed.
- Cyan hover tint on rows so the click target is obvious.

## Streak badge on Player Home

- Reads from canonical `mcPlayers[me].streak` + `longestStreak`.
- 🔥 badge next to the player greeting with current streak in Orbitron gold.
- Subtitle: "STREAK" or "STREAK · BEST N" (when longest > current).
- Only appears once there's at least one approval on record.
- Tooltip explains "every 5 grants bonus XC" so the mechanic is discoverable.

## API surface added

- `window._mcCalMoveMonth(delta)` — Calendar month step.
- `window._mcTableSortBy(field)` — Table sort toggle.
- Fields sortable in Table: `priority` · `title` · `status` · `due` · `xc`.

## Roadmap status

- Bundle A: ✅ complete
- Bundle B: ✅ complete
- Bundle C: ✅ complete
- **Bundle D: ✅ complete**
- Bundle E: ⏳ X-Bot AI priority + Automations + Dependencies + Sprints + Portfolio

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle D pass 2

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `2de404d` | Bundle D pass 2: Templates gallery + host reject flow + streak reset |

## Templates gallery

- New `mcTemplates` cloud collection (`pflx_mc_templates`, in `MC_CLOUD_TYPES`). Stomp-guarded like every other MC row.
- **Save as Template** buttons on every Project and Checkpoint card:
  - Project card: 📄 icon button in the action row.
  - Checkpoint card: 📄 Template pill in the action row.
- `mcSaveAsTemplate(kind, index)` prompts for a template name, strips run-scoped fields via `_mcStripForTemplate` (child `taskIds`, `hired[]`, `phaseSubmissions`, timestamps, `_rewardedAt` / `_cpRewardedAt`), and pushes to `mcTemplates`.
- **`pflxOpenTemplatePicker()`** modal lists every template with **✨ USE** (spawn + navigate) and **🗑** (delete) buttons.
- Command palette gains **"New from Template…"** as a CREATE action — ⌘K → type "template" → open picker.

## Host reject flow

- New `mcRejectTask(index, note?)` marks task rejected (`status: 'rejected'`), records `rejectedAt` + `rejectionReason`, and resets submitter's streak via `_mcResetStreak`.
- Submitter resolution uses the same 3-shape chain approve uses (legacy singular, new plural array, job-hired assignedTo/playerId).
- Toast: **"Task rejected — streak reset"** + `pflx_task_rejected` broadcast.

## API surface added

- `window.mcSaveAsTemplate(kind, index)` — kind: `'project'` or `'checkpoint'`
- `window.mcSpawnFromTemplate(templateId)`
- `window.mcDeleteTemplate(templateId)`
- `window.pflxOpenTemplatePicker(filterKind?)` — filterKind optional
- `window.mcRejectTask(index, note?)`
- New data type: `pflx_mc_templates` row (Supabase + localStorage). Template shape: `{ id, type, name, data, createdAt, createdBy }`.

## Deferred (Bundle D pass 3)

- **Calendar view** for Tasks (third view mode alongside List/Board).
- **Table view** — dense sortable columns.
- **Streak badge display** in player profile / portfolio.
- Home strip refresh with priority ordering.

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle C pass 3d + Bundle D pass 1

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `b6e73de` | Bundle C pass 3d: Player ProjectDetail + JobBoard apply parity |
| `a415062` | Bundle D pass 1: Board view toggle for Tasks + streak system |

## Bundle C pass 3d — Player-side polish

### Player Project Detail
- Lineage chip up top → parent Checkpoint (clickable).
- PROGRESS hero panel: fat bar, "✓ X of Y tasks approved", XC earned/total pool.
- Task rows are Notion-style: filled green ✓ (approved with strike-through), orange ◐ (submitted), empty (open). Priority dot, urgency chip, gold XC pill. Sort by priority DESC then urgency ASC.

### Player Job Board
- **`ppApplyForJob` now actually applies.** Pushes `{playerId, playerName, appliedAt}` into `job.applicants[]` and persists. Idempotent — repeat clicks toast "Already applied".
- **Array-aware hired detection.** Was `job.hired || false` (boolean fallback). Now checks `job.hired.indexOf(activeSession.id)`.
- **Three states surface distinctly**:
  - **Hired** — `✓ HIRED — ASSIGNED AS TASK` chip + `→ Open My Task` button that jumps to the auto-created Task Detail.
  - **Applied** — `◐ APPLIED — AWAITING HOST REVIEW` chip + soft italic "Your application is with the host".
  - **Slots filled (not picked)** — italic "All slots have been filled".
  - **Open** — enlarged `📝 Apply for This Job` button.
- Slot fill count + applicant count pills for context.
- Gold XC pill + urgency chip stacked in the right rail.

## Bundle D pass 1 — Views + Streaks

### View mode toggle (Tasks)
- `☰ LIST` (default) vs `▤ BOARD` (Kanban) buttons above the Task search bar.
- Selection persists in `localStorage['pflx_mc_tasks_view']`.
- `mcRenderTasks` branches to `_mcRenderTasksBoard` in board mode. Three columns: Open / Submitted / Approved.
- Board cards are compact — priority dot + title + urgency chip + XC pill. Click to jump via `mcJumpToItem`.
- Same sort rule as List and My Work (priority DESC → urgency ASC).

### Streak system
- `player.streak` counter + `player.longestStreak` tracker.
- `_mcApplyStreakBonus(submitterId, task)` runs after every `mcApproveTask` reward chain. Every **5 consecutive approvals** grants a **20% bonus XC** (min 10) via `PflxDataBus.award` reason `streak:N`.
- Toast: **"🔥 N-approval streak! +M bonus XC"**.
- `_mcResetStreak(submitterId)` clears streak (call from rejection path — wire-up follows in next commit).

## API surface added

- `window.mcSetTasksView(mode)` — `'list'` or `'board'`.
- `window._mcApplyStreakBonus(playerId, task)` — invoke from any approval path.
- `window._mcResetStreak(playerId)` — invoke on rejection.
- `MC_STREAK_TIER = 5` and `MC_STREAK_BONUS_PCT = 0.20` — tunable constants.
- New data-model fields on `mcPlayer`: `streak`, `longestStreak`.

## Deferred

- Templates gallery (save Checkpoint / Project as template).
- Calendar + Table view modes (button + renderer).
- Home strip refresh with priority ordering.
- Streak badges surface in player profile / portfolio.
- Rejection flow wiring for `_mcResetStreak`.

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle C pass 3c

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `e692504` | Bundle C pass 3c: Player Portal Checkpoint Detail — hero banner + progress panel |

## What's new in production

The Player-side Checkpoint Detail view (the screen that used to show the tall banner and a mostly-empty page under it) now gets the same hero treatment as MC.

- **16:9 banner** edge-to-edge under rounded corners. Was a fixed 200px block.
- **◆ CHECKPOINT hierarchy tag** in top-left with backdrop-blur.
- **● Active Now pill** in top-right when live.
- **28px Orbitron title** overlaying the banner bottom third.
- No-banner fallback is also 16:9 with a gradient block + ◆ CHECKPOINT tag.
- **◆ CHECKPOINT PROGRESS hero panel** — computed by `_mcCheckpointProgress` across every player task in scope (direct + via child projects, de-duped). Big 18px percent readout, "approved / total tasks" text, urgency chip against `endDate`.
- **Meta row** (start / deadline / reward) preserved below the hero. Deadline text turns red when overdue.

Defensive fallback: if `_mcCheckpointProgress` or `_mcProgressBarHtml` haven't loaded yet (Player Portal fires ahead of MC boot), falls back to legacy `cp.progress` and `ppProgressBar`. No hard crash.

## Deferred (Bundle C pass 3d)

- `ppRenderProjectDetail` — banner-on-top + child tasks list + progress panel (parity with MC Project card).
- `ppRenderJobBoard` — Apply button surface + application state.
- `ppRenderHome` — mission-strip refresh with priority ordering.
- Task rows inside Checkpoint Detail — currently 🔴 required / ⬜ optional icons; port to Notion-row treatment.

---

# Session Update — July 1 2026 (Sonnet, evening) — Bundle C pass 3a + 3b

## New commits (`pflx-platform`)

| SHA | Subject |
|-----|---------|
| `d7e6c7e` | Bundle C pass 3a: per-applicant Hire button now creates Task + cascades |
| `845eeb1` | Bundle C pass 3b: Player Portal MyTasks parity |

## Pass 3a: `mcHireApplicant` now triggers the auto-Task flow

Before: `mcHireApplicant` only pushed the applicant into `job.hired[]` and saved. The auto-Task creation lived inside `mcSaveJobForm`, so clicking the inline HIRE button on an applicant produced no Task.

After: Refactored the task-creation logic into a shared helper `_mcSyncJobHiresToTasks(job)` called from both `mcSaveJobForm` and `mcHireApplicant`. Identical output either way. Click Hire → applicant added → Task created for the assignee → Task nested into `job.projectId`'s Project taskIds → toast **"Hired &lt;name&gt; — Task created"**.

## Pass 3b: Player MyTasks list renders Notion-style rows

Ported the MC row treatment to `ppRenderMyTasks`:
- Empty-outline status square + priority dot (same visual language as MC checkbox).
- Sort by priority DESC then urgency ASC — matches My Work widget.
- Urgency chip using `_mcUrgencyForDueDate` (green > 7d, yellow 3–7d, orange 1–2d, red overdue/today).
- Gold-glow XC pill.
- ◐ SUBMITTED chip when the task is awaiting host review.
- Checkpoint indicator upgraded to ◆ to match the hierarchy tag language.

## Deferred (Bundle C pass 3c)

- `ppRenderCheckpoints` and `ppRenderCheckpointDetail` — port hero banner + aggregate progress bar + MISSION CONTENTS treatment.
- `ppRenderProjectDetail` — banner-on-top + child tasks list + progress panel.
- `ppRenderJobBoard` — player-side Apply UI.
- `ppRenderHome` — mission-strip refresh with priority ordering.

---

## 2026-07-04 — Sixteenth pass: 3D asset packs downloaded + installed (repo-hosted, CC0)

User: "Ok download the repos and install for use."

### What was downloaded (all CC0 / MIT, committed into `pflx-arena-check`)
- `public/vendor/three.min.js` — three.js **r128** (same pinned build as CDN) + `public/vendor/GLTFLoader.js` (r128 examples loader). The platform no longer depends on cdnjs for the Creator; CDN kept as document.write fallback.
- `public/assets/models/` — **215 CC0 GLB models (~4.4 MB total)**:
  - `space/` 153 models — Kenney **Space Kit** (craft_speeder/racer/miner/cargo ships, corridors, hangar, astronauts, alien, terrain, rocket parts, machines, desks/computers)
  - `blasters/` 40 models — Kenney **Blaster Kit 2.1** (blaster-a…p, scopes, clips, grenades, targets)
  - `units/` 7 models — Kenney Starter Kits (character, enemy-flying, blaster, blaster-repeater, coin, flag, block-coin)
  - `city/` 15 models — Kenney **City Builder Kit** (buildings a–d, roads, pavement, grass-trees) → reserved for Neo City
  - `models.json` — generated manifest {version, base, license, categories{cat:[files]}} — single source for palettes
  - `LICENSES.md` — attribution table (CC0, Kenney.nl; three.js MIT)
- Quaternius: no usable GitHub source (site downloads are JS-gated) — skipped this pass; Kenney coverage is sufficient.

### Install-for-use wiring
- `vercel.json`: NEW rewrites `/vendor/:path*` → `/public/vendor/:path*` and `/assets/:path*` → `/public/assets/:path*` (static-deploy rule: every URL-referenced public/ path needs a rewrite).
- `creator.html` (Battle Arena Creator) upgrades:
  - Loads local `vendor/three.min.js` (+ CDN fallback) and `vendor/GLTFLoader.js`.
  - NEW **3D MODEL LIBRARY (CC0)** palette section: search box + collapsible categories (🛸 SPACE / 🔫 BLASTERS / 🤖 UNITS / 🏙️ CITY), all 215 models placeable.
  - `buildGlb(path)`: placeholder shimmer cube → async GLTF load → cached master (`glbCache`) → per-instance clone with cloned materials (so select-glow doesn't leak across instances) → `fitAndGround` normalizes to ≤4.5 units and sits on y=0.
  - Object `type` for models is `glb:<cat>/<file>` — round-trips through save/load/export/import unchanged (`assetDef()` resolves icon/name for both procedural and glb types).
- Syntax gate passed (2 inline script blocks, node --check OK).

### Engine question (answered again for the record)
Unity/Godot as the platform: **no** — cartridges are instant-load browser iframes; desktop-engine exports are heavy and break the deck/postMessage contract. If Ennis installs Godot anyway, games CAN be authored there and exported to HTML5, but they'd need the cartridge contract shim; three.js + these committed GLB packs is the recommended path (now fully local, no CDN).

### Next
- Use `units/character.glb` + space-kit craft in per-game 3D upgrades (Mecha Tamer arena first).
- Creator v2: play-test mode walking `character.glb` around the map.

---

## 2026-07-04 — Seventeenth pass: 3D redesign of the game modes (using the installed CC0 packs)

User: "ok use the new installs to redesign all game modes."

### New shared engine
- `public/vendor/pflx-stage3d.js` — reusable three.js scene helper for every cartridge. API: `PFLXStage.create(el, {ground, accent, cam})` → stage with `load()` (cached GLB, per-instance material clones, auto fit+ground), `spin/bob/lunge/hitFlash/shake/burst/tween/onFrame/dispose`; plus `PFLXStage.hero(screenEl, path, opts)` which drops a spinning showcase model onto any intro screen. Degrades silently when THREE is missing (games never break).
- Games load `../vendor/three.min.js` + `GLTFLoader.js` + `pflx-stage3d.js` (all local; /vendor rewrite). Models stream from `/assets/models/`.
- All 3D UI is gated behind `body.has3d` — if WebGL/three fails, layouts fall back to the previous 2D design untouched.

### Per-game redesigns (directive honored: 3D only where it suits)
1. **Mecha Tamer — full 3D battle arena** (`#arena3d`, 220px): emoji sprites hidden; player mech vs wild machine on a glowing ring. Stage models: rover → character → character-large (evolve = model swap + cyan flash). Foes: machine_barrel / enemy-flying (hovers) / turret_double / alien. Correct = lunge+burst on foe; wrong = counter-lunge, red flash, camera shake; defeat/evolve/revive all have particle bursts. Hooks: `arenaInit/arenaSync/fxStrike/fxCounter/fxDefeated/fxEvolve/fxRevive` inside `answer()` + `MT.start`.
2. **Quiz Card Duel — 3D duel deck** (`#duel3d`): craft_speederA (you) vs craft_speederD (rival) bobbing over the ring; every hit lunges the attacker, flashes + bursts the target, shakes the camera on incoming. Hooks `d3Init/d3Fire` in resolve + `QCD.start`.
3. **Crypto Heist (gold-rush) — 3D vault room** (`#vault3d`): machine_generatorLarge core (slow spin) flanked by barrel machines; every cache outcome bursts in the outcome's color and flashes the core; bad outcomes shake. Hooks `v3Init/v3Outcome` in `pick()`.
4. **Knowledge Tycoon — living 3D mining base** (`#base3d`): every upgrade purchased erects the next structure (12-model build order: generator→hangars→dishes→rocket parts→monorail cargo) on a fixed spot layout with a gold burst. Rematch clears holders. Hooks `b3Init/b3Build` in the buy handler.
5. **Escape Protocol — 3D corridor scene** (`#room3d`): corridor_detailed slow-pan + astronautA bobbing; bulkhead UNSEALED banner triggers green breach burst + shake. Hooks `r3Init/r3Breach` via banner().
6. **Star Saga — per-chapter 3D diorama** (`#saga3d`): 8 encounter models (gate → corridor_cross → machine_wirelessCable → hangar_roundGlass → monorail_trainFront → rock_crystalsLargeA → satelliteDish_detailed → alien boss), swapped in `showEncounter()`; d20 success/fail bursts green/red via `s3Roll`.
7-9. **Pulse Runner / Void Ranger / Lane Defense** — kept on their purpose-built canvas/Phaser gameplay engines (fast-twitch 2D is the right layer there) but each intro now shows a spinning 3D hero model (craft_racer / enemy-flying / turret_double). ALL nine games got intro hero models with matching accents.
- Build stamp bumped → `2026-07-04.2`.

### Verification
- Syntax gate: 38 inline script blocks across 10 files + pflx-stage3d.js — all `node --check` clean.
- 3D containers hidden by default (`display:none` until `body.has3d`) so nothing shifts if 3D unavailable.

### Next
- Deeper passes: lane-defense full 3D lane, pulse-runner 3D track, per-stage distinct mech models (attach blaster GLBs), Creator play-test mode.

---

## 2026-07-04 — Eighteenth pass: two NEW game modes — Scouter Break + Planet Defense: Space TD

User: "scouter break: combat" → clarified: "make a game mode like this" (Dragon-Ball-style scouter/power-level combat). Also: "also build the planet defense like game."

### 🥽 Scouter Break (`games/scouter-break.html`, id `scouter-break`, window.SB)
Power-level combat with a push-your-luck core: correct answers CHARGE ⚡ power (600 + streak×250, streak cap 8); the UNLEASH button fires a beam anytime — dmg = 34 × (power/foe rating), cap 120; at ≥150% of the foe's rating the foe's SCOUTER SHATTERS (×1.5 crit + banner "READING OFF THE SCALE"). Unleashing keeps 40% of charge. Wrong answers = foe blast + up to 400 power drained. Five rated fighters (1200/2400/4200/6400/**9001** — the wink); 130 HP, +35 corner recovery between bouts, one 🔧 nano-repair. 3D fight ring: character.glb vs [enemy-flying, astronautB, turret_double, rover, alien]; the beam is a real translucent cylinder between fighters (fxBeam), crits burst gold + shake. BGM drive 132bpm. Balance (500-run sims): expert(90%) 100% · skilled(80%) 89% · average ~4% normal / 22% easy · poor 0%. Score: battle×30 + correct×8 + bestStreak×5 + breaks×12 + won×60.

### 🪐 Planet Defense: Space TD (`games/planet-defense.html`, id `planet-defense`, window.PD)
Real tower defense on canvas 2D (right layer per graphics directive; 3D hero turret on intro). Deterministic sim core (Node-tested): planet center (100 HP), 6 turret slots on a ring (L1/2/3: dps 7/13/22, range 110/130/150, cost 50/80/120⚡), raiders spawn on random bearings and dive radially; 10 waves (count 3+wave×2, hp 10+wave×7, speed 27+wave×2.5); wave 10 = 👑 DREADNOUGHT (420hp, 34 planet dmg). Correct answers = +⚡ (18 + streak×4, cap 6); wrong = 3s RAIDER SURGE (×1.45 speed). Wave clear pays 14+wave×3⚡; kills pay 3⚡. Renderer: gradient planet w/ HP-tinted ring, turret triangles by level, beam lines to targets, boss hp bars, surge tint, inter-wave countdown. Balance (150-run sims, fortified build order): expert 99% · skilled(75%) 84% · average(50%) 13% · poor 0%; undefended dies wave 2. Score: wave×20 + kills×2 + correct×6 + won×80.

### Wiring
- Both registered in STUDIO_TEMPLATES as ready w/ PIL covers (`games/covers/scouter-break.png`, `planet-defense.png`); the planet-defense 🚧 tile from earlier today became the real entry. Build stamp → `2026-07-04.3`.
- Both speak cartridge contract v0.1 (ready/deck/result/exit), full config sanitizer incl. music, briefing typewriter, starfield, BGM, hero models. Cores exported under `window.SB._core` / `window.PD._core`.
- Mapping note for Ennis: Void Ranger = Archero-2-style; Lane Defense = Wittle-Defender-style; Planet Defense = the Space TD; Scouter Break = the DBZ-style combat. 15 modes → 11 ready / 5 in development.

### Next
- Play-test both; possible rename pass (Void Ranger/Lane Defense) if Ennis wants names closer to inspirations.

---

## 2026-07-04 — Nineteenth pass: ALL 15 GAME MODES PLAYABLE + rename pass

User: "now build the others and re name the last 2" (clarified: rename the 2 newest).

### Renames (display names only — ids/files/XC pipeline unchanged)
- `scouter-break` → **Overlimit 9001** 🥽 (title, intro, template name, cover regenerated)
- `planet-defense` → **Last Colony TD** 🪐 (same)

### Six NEW cartridges (all chassis-transformed, all node --check clean, all sim-balanced)
1. **🧗 Sky Climb** (`sky-climb.html`, window.SK) — Don't-Look-Down: canvas spire, climber pinned at 62% viewport, DATASTORM void rises continuously (3.5 + alt/90 m/s, accelerating); correct = vault 58+streak×12m; wrong = slip 28m + void +22m; SUMMIT 1000m. Sims: expert@6s 95% · skilled@7s 34% · average 3%.
2. **🌆 Neo City** (`neo-city.html`, window.NC) — SimCity on the LIVE 3D SKYLINE (city/ GLB pack on a 12-spot grid + road strip): ₡ from answers (34+streak×6+SHOP income), buildings HAB 45₡/+90👥 · SHOP 65₡/+40👥+12₡/✓ · PARK 35₡/+60👥 · SPIRE 150₡/+260👥; blackout −40👥; target 1,000👥 in 24 sessions. KEY DESIGN: 12-plot cap makes hab-spam a TRAP — shop→spire strategy wins (smart 55% acc → 86% win; greedy 90% acc → 0%).
3. **🥊 Circuit Brawl** (`circuit-brawl.html`, window.CB) — Brawlhalla: DAMAGE % instead of HP, launchChance = clamp((pct−50)/160, 0, 0.9), 3 stocks; KO = 3D model launched off the platform (tween arc + respawn drop-in). Rival combo 22×mult. Sims: 90%→100 · 75%→98 · 55%→57 · 35%→2.
4. **🛡 Cyber Agents** (`cyber-agents.html`, window.CA) — pick MINDFORGE 🔨 (dmg ×1.35) / INNOV8 ⚡ (streak bonus ×2) / GENTECH 🧬 (+5hp per strike) / eMAGINATION 🌈 (halves first 3 hits); purge 👻 Firewall Phantom → 🪱 Worm Nest → 👑 Breach King; agent-accented 3D floor. Agent balance @70% acc: 84–96% win.
5. **⚔ Nexus Legends** (`nexus-legends.html`, window.NL) — MOBA lane-push sim: two cores (100hp), minions march/brawl autonomously (tick sim, blocked-melee model), tiers GRUNT/SOLDIER(streak 3)/CHAMPION(streak 5); wrong = enemy soldier; enemy spawner accelerates (5.5s → 3.2s). Sims: 90%@5s 98% · 75% 43% · 55% 3%.
6. **🥋 Stick Circuit** (`stick-circuit.html`, window.ST) — canvas STICK-FIGURE fighter: pose-lerp animation system (POSES: idle/jab/kick/hit/down/win as joint-angle sets, 5-param lerp, lunge on attack), 3-round ladder (Novice Proxy/Volt Duelist/Grid Master, color-coded fighters). Sims: 85%→100 · 65%→76 · 45%→7.

### Wiring
- All 6 registered ready in STUDIO_TEMPLATES with PIL covers (`covers/{sky-climb,neo-city,stick-circuit,nexus-legends,circuit-brawl,cyber-agents}.png`).
- **ALL 15 GAME MODES NOW PLAYABLE** — the 🚧 roadmap is empty. Build stamp → `2026-07-04.4`.
- Lesson recorded: chassis-transform pattern (copy nearest sibling → python region replacements → stale-ref grep → node gate → core sim) ships a full cartridge in ~5 tool calls; watch for `onclick="XX.` handles hiding in showQuestion (caught MT.answer leak in cyber-agents/stick-circuit).

### Next
- Ennis full play-test of all 15; per-mode difficulty knobs already flow from Launchpad.
- Possible upgrades: Cyber Agents true co-op (shared session), Neo City districts/adjacency, Creator play-test mode.

---

## 2026-07-04 — Twentieth pass: Fortnite-style mode select + LIVE PLAY v1 + co-op rooms

User: side-by-side Fortnite/Roblox-style selection cards, Live Play last; Live Play = host launches a ONE-SHOT live collaborative event pushed to player dashboards; join code HIDDEN by default (private), host can unhide → open join; same game modes as Side Quests; co-op Side Quests where a player opens a room others can join; team/vs adjustments in-game.

### Choose Your Battle (renderHome)
- `.cat-grid` → 3 side-by-side tall cards (min-height 400px, repeat(3,1fr), stacks <860px) with cover-art backgrounds (`cat-art` + fade overlay + hover zoom/lift). Order: Creator Showdown → Side Quests → **Live Play last**. Live Play is ENABLED (was Coming Soon); its badge becomes "● N LIVE NOW" when events run.

### Live Play v1 (KV row `pflx_ba_live`, manager `baLive` — baSessions pattern incl. read-modify-write upsert)
- Event: {id, kind:'live'|'room', gameId, deckId, title, hostId/Name, code (6-char A-Z/2-9), **open:false by default (private)**, startsAt, endsAt, players[{id,brand,score,won,at}]}
- HOST (renderLivePlay launch panel): pick any of the 17 ready modes + deck + 30/60/120min + title → 🔴 GO LIVE. Event card shows the big dashed CODE, toggle 🔒 PRIVATE ↔ 🔓 OPEN JOIN (`baLiveToggleOpen`), ✕ END EVENT, and the live leaderboard (players sorted by score, 👑 leader, 🏆 winners).
- PLAYER: Live Play screen lists LIVE NOW events: open events → "▶ JOIN EVENT"; private → INVITE CODE input + 🔒 JOIN (client-side code check; host bypasses). Join = roster add (RMW) + `arenaGameLaunch(..., {liveId})`. REJOIN — BEAT YOUR SCORE for returning players (score = max).
- Scores: game-result handler now calls `baLiveReportScore(liveId, score, won)` → RMW into event players → live leaderboard. XC pipeline unchanged on top.
- Push to dashboards: Side Quests LIVE NOW shelf appends `arenaLiveEventsShelfHtml()` (events + rooms, JOIN → live_play screen); home Live Play card shows live count; `baLive.load()` at boot + 20s refresh interval while on home/side_quests/live_play.

### Co-op rooms (kind:'room', open:true by default)
- "👥 START CO-OP ROOM" button on every LIVE NOW session card + "👥 CO-OP" on player-published shelf games → `baRoomCreate` creates the room and drops the creator straight in; the room then appears on everyone's shelf/Live Play with open join and its own shared leaderboard (compete mode v1).

### Not done yet (next passes)
- In-game TEAM/VS mechanics (needs per-cartridge work — e.g. team-tagged scores, duel pairing); currently rooms/events compete on a shared score board.
- Realtime push (currently 20s poll); host kick/lock; spectate.
- Build stamp → `2026-07-04.5`. Gate: all preview.html script blocks node --check clean.

## LOCKED DIRECTIVE (2026-07-04, Ennis): GAMEPLAY-FIRST, QUIZ AT NATURAL BEATS
"The games seem too heavily driven by the knowledge decks. There should be more opportunities to play the games without needing to answer questions to make the gameplay more natural and engaging. Then whenever the time is right game-wise then you should need to answer more questions."
→ Redesign target for EVERY cartridge: continuous/free gameplay as the default loop; deck questions appear at game-appropriate moments (checkpoints, boss gates, power unlocks, revives, big purchases) — the Pulse Runner model (run freely, question only on crash) and Void Ranger model (real-time action, questions as reload/power gates) are the reference implementations.
Per-game sketch for next session:
- Mecha Tamer / Overlimit / Stick Circuit / Cyber Agents / Circuit Brawl: real-time auto-battle exchanges (timed attacks both ways); questions gate SPECIAL moves, evolutions, revives, finishers.
- Last Colony TD / Nexus Legends: sim already runs continuously — let basic income/spawns accrue on a timer, questions only for BIG buys (L3 turrets, champions, boss-wave shields).
- Sky Climb: free tap-to-jump platform hops (Pulse-Runner-style), questions at 200m checkpoint gates + after slips.
- Neo City: passive ₡ drip per second, questions for permits on SPIRE-class builds + blackout recovery.
- Crypto Heist / Gold Rush: free cache-picking on a cooldown, questions to unlock bonus digs/power-ups.
- Escape Protocol / Star Saga / Quiz Card Duel: question-driven by nature — keep, but add free exploration/dialogue choices between locks.

---

## 2026-07-04 — Twenty-first pass: GAMEPLAY-FIRST rework, wave 1 (4 games)

Per the locked directive (free play by default, questions at natural beats):
1. **Sky Climb — full conversion**: TAP / SPACE / click = free vaulting (14m/tap, 160ms rhythm cap); quiz panel HIDDEN during free climb; every 200m a ⛩ CHECKPOINT GATE seals the spire → quiz appears; correct = unseal +20m; wrong = gate holds + void +30m (void continues rising while you think — real pressure). Void retuned 5 + alt/65. Core: tap()/answerGate()/GATE_EVERY exported. Sims (tap-rate + answer-latency model): expert 99% · skilled 71% · average 19% · poor 1%.
2. **Mecha Tamer — real-time auto-battle**: `autoExchange(s)` every 3.5s — mechs trade light blows (you 3+stage, foe max(3, atk/2 − stage×2)) with lunge fx; auto kills/evolutions/revives flow through the same pipeline; questions remain the SPECIAL strikes. Balance verified: idle-never-answers 0% win (autos can't carry), poor 10%, average 84%, skilled 100%.
3. **Last Colony TD**: passive reactor drip +1.6⚡/s in tick (floor-displayed) — the grid funds itself slowly; answers = big surges.
4. **Nexus Legends**: barracks auto-trains an ally GRUNT every 9s — the lane war never stalls; answers deploy extra/elite minions.
All gates node --check clean. Remaining conversions queued: Neo City ₡ drip, Crypto Heist free digs on cooldown, fighters (Overlimit/Stick/Brawl/Agents) real-time exchanges like Mecha Tamer.

---

## 2026-07-04 — Twenty-second pass: gameplay-first wave 2 + in-game ❓ HOW TO PLAY everywhere

### Gameplay-first conversions (wave 2)
- **Overlimit 9001**: live bout — `autoExchange` every 3.5s (power trickles +60, light trades: you 2, foe atk×0.35); answers charge power MUCH faster; unleash unchanged. Idle can't out-trickle the chip damage.
- **Circuit Brawl**: live scrap — both chip % every 4.2s (rival favored ×mult), auto-launch rolls at 0.35× the normal launch odds w/ full 3D launch fx; answers land the big combos.
- **Stick Circuit + Cyber Agents**: mecha-style autoExchange every 4s (you 3, foe atk×0.5 − mitigation) with pose/3D fx, auto kills flow through round pipeline.
- **Crypto Heist**: ⛏ FREE DIG — rig auto-charges every 18s → opens a bonus cache with NO question and NO block advance (button w/ live countdown, starts charged after 10s).
- **Neo City**: passive economy — ₡2/s drip + ₡1/s per 🌳 PARK (parks now matter!) via 1s interval; answer payout rebased 34→26.
- All autoTimers cleared in reportResult; briefings updated to describe the live loops. Gate: every script block in all 17 games node --check clean.

### In-game details & instructions (user: "more in game details and instructions for gameplay")
- EVERY game (17/17) now has a floating ❓ button (below the 🎵 toggle) that opens a mid-game HOW TO PLAY overlay: the mission storyline + the full ▸ HOW TO PLAY list, captured from the intro before it unmounts; click-outside or ✕ to return. Zero per-game code — one shared injected block (`howtoOverlay`).
- Combined with the live log narration (auto-battle trades, gate distances, drip notices) every game now teaches itself during play.

### Next
- Remaining directive items: Escape/Saga exploration beats; team/vs splits in Live Play rooms.

---

## 2026-07-04 — Twenty-third pass: LIVE PLAY TEAM BATTLES + Escape Protocol exploration

### 🔵🔴 Team battles in Live Play (preview.html, build 2026-07-04.6)
- Launch panel checkbox "TEAM BATTLE" → ev.teams. Joiners auto-balanced into 🔵 NOVA / 🔴 ION (player.team, assigned at join by squad counts).
- Event card: teams mode renders a two-column squad leaderboard (per-squad totals + members) with a live "🔵 NOVA LEADS / 🔴 ION LEADS / ⚖ TIED" headline; card meta shows "YOUR SQUAD".
- Works for host events AND co-op rooms (same event object). Scores still flow via baLiveReportScore.

### 🔦 Escape Protocol exploration beats (per gameplay-first directive)
- New 'search' phase: every UNSEALED bulkhead (except the final escape) → "SECTION CLEAR — SEARCH THE ROOM": pick 1 of 3 random spots (locker/console/vent/crate/bunk/med) — NO questions; O₂ keeps draining. Loot: 40% +12s O₂ · 25% +1 hint · 20% +5s · 15% dust. `startSearch/doSearch`, EP.search exported; resumes questions after.
- Gates: escape-protocol + preview.html script blocks all node --check clean.

---

## 2026-07-04 — Twenty-fourth pass: cinematic 3D engine upgrade (pflx-stage3d)

User: "Are you effectively using the three.js graphics and features in each game? I want the best graphics and gameplay possible." Honest audit: scenes were wired to gameplay but rendered on defaults. Central upgrade (one file → all 10 3D-scene games + all 17 heroes improve):
- Renderer: ACESFilmicToneMapping (exposure 1.15), sRGBEncoding, PCFSoft shadow maps.
- Key light casts 1024px soft shadows (bias −0.002, 24×24 ortho bounds); ground discs receiveShadow; ALL GLB instances now castShadow (was explicitly off).
- Scene fog (0x04070d, 16–55) + 240-point star dome inside every scene for depth.
- Cinematic idle camera drift (sin 0.22/0.15, ±0.5/±0.2 units, suppressed during shake), opts.drift/fog opt-outs.
- Graphics status ledger: full 3D fields (Mecha Tamer, Overlimit, Circuit Brawl, Cyber Agents, Duel, Heist, Neo City, Tycoon, Saga dioramas, Escape corridor) · engine-appropriate 2D (Pulse Runner, Void Ranger/Phaser, Lane Defense, Sky Climb, Nexus, Stick Circuit canvas) with 3D heroes.
- Next graphics frontier (noted for Ennis): Sky Climb 3D spire, Last Colony 3D battlefield, post-processing bloom (needs EffectComposer vendor), GLTF-rigged characters (Quaternius animated packs when a clean source is found).

---

## 2026-07-04 — Twenty-fifth pass: RIGGED ANIMATED CHARACTERS (the big visual leap)

- **New asset**: `assets/models/units/robot-expressive.glb` (464KB) — RobotExpressive by Tomás Laulhé, CC0, sourced from the three.js r128 examples tree. 14 skeletal animation clips: Idle, Punch, Jump, Death, Dance, ThumbsUp, Wave, No, Walking, Running, etc. Registered in models.json + LICENSES.md (also placeable in the Creator's model library).
- **Engine** (`pflx-stage3d.js`): new `st.loadAnimated(path, {scale,x,rotY,tint,idle}, cb(holder, api))` — fresh (non-cloned) load per instance to keep SkinnedMesh bindings intact; THREE.AnimationMixer per instance updated in the render tick; `api.play(name)` crossfades (0.15/0.2s), one-shot clips clamp + auto-return to Idle via the mixer 'finished' event; optional emissive `tint`.
- **Mecha Tamer**: player is now the living robot — breathing Idle, PUNCH on specials, "No" flinch when hit, JUMP + tint swap on evolve (cyan→green→gold, growing 2.3→3.0→3.8), ThumbsUp on nano-repair, DANCE on victory, DEATH collapse on defeat.
- **Cyber Agents**: your agent is the robot tinted with the agent's accent (MINDFORGE orange / INNOV8 gold / GENTECH green / eMAGINATION purple), WAVES on deploy, punches/flinches/dances/dies; re-picks rebuild the model with the new tint.
- Gates clean. Remaining graphics queue: same treatment for Stick Circuit foe? (canvas by design), Sky Climb 3D spire, Last Colony 3D field, EffectComposer bloom.

---

## 2026-07-05 — Twenty-sixth pass: TITLE ART + SUNO MUSIC PIPELINE (drop-in, zero-code)

User: 16:9 title graphics (Nano Banana) + gameplay music (Suno) per game mode; prompts + the feature.
- **Title art**: every game auto-probes `games/art/<game-id>.png` (Image.onload); if present, renders it as a 16:9 banner (600px, rounded, glow) at the top of the intro screen. Missing file = silent no-op.
- **Music**: BGM block in all 17 games now tries `games/music/<game-id>.mp3` first (Audio, loop, vol 0.35, canplaythrough/readyState gate); if present it REPLACES the procedural score; 🎵 toggle + host GAME MUSIC config still govern both paths; fallback to procedural when absent.
- Dirs `public/games/art/` + `public/games/music/` created with README naming guides (served via existing /games rewrite).
- **`ART_AND_MUSIC_PROMPTS.md`** (repo root): 17 Nano Banana image prompts (shared cinematic style block, 16:9, no text) + 17 Suno style prompts (instrumental, loopable, per-game BPM/mood matching the procedural scores) + menu-theme bonus. Ennis workflow: generate → drop files with the game-id names → push. No code ever needed.

---

## 2026-07-05 — Twenty-seventh pass: Side Quests grid + live event durations 3–30 min

- **Side Quests Fortnite-style grid**: new `.sq-grid` (auto-fill minmax(340px,1fr), max-width 1160px, 1-col <760px) applied to the mode cards (Cipher/Rift), 🔴 LIVE NOW sessions, 🔴 LIVE EVENTS & CO-OP ROOMS, and 🛠 PLAYER-MADE GAMES shelves — all headers widened to match. Live Play screen event lists use the same grid.
- **Live event durations (Ennis: "3 min to 30 mins")**: launch select now 3/5/10/15/20/30 min (default 10); `baLiveLaunch` clamps 3–30; co-op rooms 60→30 min; `baLiveTimeLeft` shows seconds under 10 min. Build → 2026-07-05.1.

---

## 2026-07-05 — Twenty-eighth pass: MC IS THE SINGLE SOURCE FOR SEASONAL DATA

Ennis: launched Side Quests not visible; "a season is not 90 days — most run 10 weeks; Battle Arena must read seasonal data from MC"; "There should be no Seasons active — if there are it's reading old data. All Seasons, Checkpoints, Projects, Tasks originate through Mission Control."

### Root causes found (live Supabase audit)
1. The "missing" Side Quest launches: 3 short sessions expired on schedule (60-min windows from Jul 3); the 2 "Full Season" test launches were phantom 90-day sessions from the old hardcoded duration. DATA WAS INTACT — nothing was lost.
2. **Stale active data**: KV row `checkpoints` had "Checkpoint Gamma" status:'active' with endDate 2026-06-02 (ended a month ago, never flipped) — this is what every ticker displayed. KV `seasons` row is EMPTY (correct — no seasons exist yet).

### Fixes
- **Arena reads MC seasons** (`mcSeasons` manager, KV key 'seasons', loaded at boot): a season counts ACTIVE only if MC flags it active AND today is inside startDate..endDate (stale flags can't leak). No more hardcoded "Full Season (90 days)" — SESSION_DURATIONS caps at 1 week; the Launchpad season select lists each active MC season ("🏆 <name> — ends <date> (level-up replays)") or a disabled "no active Season in Mission Control" notice. Season launches store seasonId/seasonName and endsAt = the season's endDate 23:59:59 (10-week seasons Just Work — length comes from MC, never the arena).
- **baSessions.active()**: seasonMode sessions are only visible while their MC season is active (legacy season sessions without a valid seasonId are hidden). Season cards show 🏆 season name.
- **Purged**: the 2 phantom 90-day test sessions removed from `pflx_ba_sessions` (row: 5→3).
- **MC auto-expiry (platform preview.html)**: on data load, checkpoints past endDate flip status→'completed' and seasons past endDate flip active→false, then save — expired things can never read as active anywhere again. Applied retroactively: **Checkpoint Gamma marked completed in Supabase**.
- Build → 2026-07-05.2. All gates clean (arena + platform script blocks).
### Rule going forward: Battle Arena never invents seasonal/checkpoint/project/task data — it reads MC's KV rows ('seasons', 'checkpoints', …) with date-validated activity checks.

## 2026-07-05 — addendum: game titles INSIDE the title art
- ART_AND_MUSIC_PROMPTS.md: shared style block now instructs a bold chrome-neon AAA-style logo of the title across the upper third ("spelled EXACTLY"); every game prompt (all 17 + menu bonus) begins with `Title text (must appear in the image, spelled exactly): "<TITLE>"`.
- All 17 games: when art/<id>.png loads, the intro's `.big` text title is hidden — the artwork carries the title, no doubling.

## 2026-07-05 — addendum: profile dropdown reorder (platform preview)
- VIEW PORTFOLIO moved to the TOP of the profile-card dropdown (above MY WALLET / MY TASKS / LEADERBOARD / SOUND / SETTINGS / SIGN OUT), per Ennis.

---

# Session Update — July 6 2026 (Opus) — Open Space Combat Phase C + Nova defense substrate

Continuation of the EVE-style combat layer (Phase A+B shipped July 2). This
pass adds Phase C (autopilot flight commands + radial context menu) and lays
the **real** Nova: Space Armada defense model under the SHD/ARM/HULL HUD so
Phase D NPCs drop straight in. All in `pathway.html`, inside the `pflxCombat`
IIFE. Ennis also asked to research Nova's controls/mechanics — done (see below).

## Nova mechanics folded in (from the official help center)
Nova is a fleet-strategy game (tap-select, auto-combat) — it supplies the
STAT model, not the piloting (Eve supplies piloting). Confirmed rules now
implemented in `defense.apply()`:
- **Shields absorb damage and BLOCK hull hits while up** — only a weapon's
  shield-penetration fraction leaks through until shields drop.
- **Armor REDUCES body damage**; a weapon's armor-penetration ignores part of
  that mitigation. Armor chips down over a fight.
- **Hull** is the last layer; **shields regenerate after a lull**, armor/hull
  are repaired at stations / by pickups (not passively).
- **Ship Energy** (engine budget powering weapons) = our existing capacitor.
- Roaming **pirates** of varying strength = Phase D NPCs (not built yet).

## What shipped (search anchors in pathway.html)
1. **`autop`** (anchor `AUTOPILOT (Phase C`) — continuous flight commands that
   hold a relationship to the ACTIVE locked target:
   - **Approach** (Q) — fly straight in, auto-disengage within 120u.
   - **Orbit-at-range** (E, default 460u) — tangential heading + radial
     correction holds a circular orbit; great for keeping weapons on target.
   - **Keep-at-range** (R, default 820u) — hold distance, no circling.
   - **Cancel** (C). Range +/- on the chip (orbit/keep).
   `autop.drive()` returns `{heading, thrust}` each frame; `pflxKeyLoop`'s
   flight model applies it (3 surgical edits: heading branch, thrust branch,
   friction gate). **ANY manual input (WASD/arrows/mouse-steer) cancels it**
   (Eve behavior). Bird's-eye falls back to the one-shot `pflxShipFlyTo`.
2. **Autopilot HUD chip** (`#pflxAutoChip`, bottom-center above the module
   hub) + **in-world desired-range ring** (`#pflxRangeRing`, dashed, follows
   the target; cyan orbit / gold keep).
3. **Radial context menu** (`#pflxRadial`, anchor `RADIAL CONTEXT MENU`) —
   Eve-style ring of actions around the cursor: APPROACH / ORBIT / KEEP AT /
   MINE or TRACTOR (context-aware) / UNLOCK. Opens on: right-click anywhere in
   flight (acts on active target), right-click a target card, the ⊙ button on
   each target card, or right-click an Overview row. Esc / scrim click closes.
4. **Nova defense substrate** (`defense`, anchor `DEFENSE (Nova`) — the
   SHD/ARM/HULL bars are now **live state**, not cosmetic:
   - `defense.recompute()` derives maxes from ship tier/modules (shield only if
     shield hardware present; armor/hull scale with tier speedMult).
   - `defense.apply(dmg, {shieldPen, armorPen, type})` — the Nova resolution
     above. Exposed as `pflxCombat.applyDamage(...)` — **this is the Phase D
     wiring point** for NPC weapons.
   - `defense.regenTick(dt)` shield regen (faster + shorter lull with the F4
     shield-boost module active).
   - **Hull-breach recovery is non-punitive**: at hull 0 the ship emergency-
     warps to the nearest station, hull limps back to 40%, shields down, brief
     invuln window. **Never costs XC or items.** (Death-consequence design is
     an OPEN QUESTION for Ennis — see below.)
   - `pflxCombat.repair({shield,armor,hull,full})` for station/pickup repairs.

## Verification
- Syntax gate: 4 inline `<script>` blocks, `node --check`, **0 failures**.
- Behavioral harness (`/tmp/combat_harness.js` — extracts the REAL `autop` +
  `defense` source from pathway.html and runs it under stubs): **26/26 pass** —
  approach heading/thrust/arrival, keep-at-range toward/away/hold, orbit
  tangential + always-thrusting, black-hole approach refusal, lost-target
  cancel; Nova shield-gating (no-pen vs shield-pen), armor mitigation +
  armor-pen dealing more hull damage, breach recovery to 40% + invuln window,
  shield regen after lull vs no-regen during the delay.
- **NOT play-tested in a browser** (sandbox limitation). Ennis must eyeball on
  `https://pflx-pathway-portal.vercel.app/pathway.html`: orbit/keep feel, the
  manual-override cancel, radial menu placement, range-ring visibility.

## Open for Ennis / Phase D
- **Player-death consequence** — current default is a soft hull-breach warp-to-
  station with no penalty. Decide if you want stakes (repair cost, brief
  cooldown, XC-at-risk) before NPC combat makes hull damage common.
- **Phase D** — NPC pirates (orbit+fire AI) calling `pflxCombat.applyDamage`
  with weapon-type profiles (kinetic = high armor-pen, laser = high shield-pen,
  missile = balanced — the Nova triangle), loot drops, hit feedback (camera
  shake, damage numbers). The defense substrate + autopilot are ready for it.

---

# Session Update — July 6 2026 (Opus) — TIERED HOST ACCESS, Phase 1 (platform)

New workstream (Ennis): a five-tier host access model on the Console
(`pflx-platform`, `preview.html`). Decisions locked with Ennis:
existing `admin` accounts become **Master Host** (keep everything); assignment
of tier + scope will live in the **Player Manager**; build **foundation
first**, one phase per pass with play-testing between.

## The five tiers (capability matrix)
| Capability | Master | Admin | Co-Host | Instructor | Guest |
|---|---|---|---|---|---|
| Full Console control | ✓ | ✓ | scoped | scoped | scoped |
| Plus: history / auto-backup / override / restore | ✓ | — | — | — | — |
| Approve X-Tracker reward requests | ✓ | ✓ | — | — | — |
| Approve MC task submissions | all | all | ✓ | ✓ | ✓ |
| Approve Core Pathway nodes | all | all | ✓ | ✓ | ✓ |
| Approve X-Coin trades | ✓ | ✓ | ✓ | ✓ | — |
| Approve X-Coin barter | ✓ | ✓ | — | ✓ | — |
| Manage cohorts' Mission Control | all | all | multiple | single | — |
| Manage a Project | ✓ | ✓ | ✓ | ✓ | ✓ (one) |
| Scope | global | global | cohort set | 1 cohort | 1 project/node |

## What shipped — Phase 1 foundation ONLY (purely additive, no gate changed)
Inserted right after `normalizeRole` (search `TIERED HOST ACCESS — Phase 1`).
A self-contained IIFE exposing a tier + capability engine on `window`:
- **`pflxHostTier(session?)`** → `master|admin|cohost|instructor|guest|null`.
  Resolves an explicit `session.hostTier` if valid, else DERIVES from the legacy
  role: `admin`→`master`, `host`→`admin`, `instructor`/`teacher`→`instructor`,
  else `null`. So **existing accounts are unchanged** (admins keep everything).
  `cohost` and `guest` only ever come from an explicit `hostTier` assignment.
- **`pflxCan(capability, ctx?)`** — the single gate Phase 3 will route every
  host check through. `ctx` may carry `{cohort, nodeId, projectId}` for scoped
  tiers. Capability list: `console.full`, `plus.history|backup|override|restore`,
  `approve.reward|task|node|trade|barter`, `manage.cohorts|project|nodes|players`,
  `assign.tiers`.
- **Scope model** (Phase 2 UI will populate): `session.managedCohorts[]`
  (cohost/instructor), `session.managedNodes[]` (any scoped tier),
  `session.managedProjectId` (guest). **Unset scope = permissive in Phase 1**
  so nothing is prematurely restricted; Phase 3 flips these strict at the call
  sites.
- Also: `pflxIsHostTier`, `pflxTierMeta`, `pflxTierRank`, `pflxHasPlus`,
  `pflxAccessDebug(session?)` (console diagnostic → tier/label/plus/scope/caps),
  and the `window.pflxAccess` namespace + `PFLX_TIER_META` / `PFLX_TIER_ORDER`.

**Phase 1 changes NO existing behavior** — the ~5 legacy host helpers
(`mcIsHost`, `pflxIsHost`, `_pflxRoleIsHost`, `isHostOrCohost`, `isHostRole`)
and the `pflxPlayerCanAccessApp` host short-circuit are untouched. New tiers
(cohost/guest) get an underlying host `role`, so those helpers still treat them
as host; the finer restriction arrives in Phase 3 via `pflxCan`.

## Verification
- Node harness (`/tmp/tier_harness.js`, extracts the REAL IIFE from preview.html
  and runs it under stubs): **34/34 pass** — tier derivation (incl. bogus
  hostTier fallback + explicit-wins), plus-feature gating (master only),
  full approvals matrix per tier (reward master/admin-only, barter excludes
  cohost, guest excludes trade/cohort-mgmt), and scope enforcement (in/out of
  managedCohorts, guest project scope, node scope, master ignores scope,
  unset-scope permissive).
- `node --check` on the extracted IIFE and on the full 94k-char containing
  `<script>` block: **both clean**. (Full-file gate is too slow on 55k lines;
  preview.html is served static — the browser is the runtime check.)
- Nothing to play-test yet (no UI surface in Phase 1). Inspect in the browser
  console: `pflxAccessDebug()` shows the signed-in user's resolved tier.

## Next — Phase 2 (assignment) → 3 (enforcement) → 4 (plus gating)
- **Phase 2:** Player Manager gains a **Tier** dropdown (Master/Admin/Co-Host/
  Instructor/Guest) + a scope picker (multi-cohort for Co-Host, single cohort
  for Instructor, node/module multiselect, single Project for Guest). Writes
  `hostTier` + `managedCohorts/managedNodes/managedProjectId` onto the PLAYERS
  record. Only `assign.tiers` holders (master/admin) see it.
- **Phase 3:** route the cohort/player/approval renderers + the
  `pflxPlayerCanAccessApp` short-circuit through `pflxCan(...)` with scope
  context; flip `inScope` unset-behavior from permissive → strict for scoped
  tiers. Filter each approval stream per `approve.*` capability + scope.
- **Phase 4:** gate the plus features (Save Point / lockdown-freeze-override
  maintenance panel / restore) behind `pflxCan('plus.*')` — Master only.

---

# Session Update — July 6 2026 (Opus) — TIERED HOST ACCESS, Phase 2 (assignment UI)

Phase 2 of the five-tier host access model (`pflx-platform`, `preview.html`).
Assignment lives in the **Player Manager edit modal** (Platform → Settings →
host, `mc-player-edit-modal`), per Ennis's decision.

## What shipped
1. **ACCESS & ROLE section** in the player edit modal (`#mc-player-access-section`)
   — visible ONLY to users who hold `assign.tiers` (Master/Admin). Contains:
   - **Access Tier** dropdown (`#mc-player-form-tier`): Player / Guest Instructor
     / Instructor / Co-Host / Admin Host / Master Host, with a live description.
   - **Scope pickers** that show/hide by tier (`mcTierScopeRefresh()`):
     Co-Host → Managed Cohort(s) (comma-separated, multiple); Instructor →
     Managed Cohort (single — extra cohorts trimmed on save); Guest → Managed
     Project (select, populated from `mcProjects`); all scoped tiers → Managed
     Node/Module IDs (comma-separated, from the Core Pathways editor).
2. **Load** (`mcPopulateTierUI(p)`) — called from `mcEditPlayer`/`mcAddPlayer`.
   Resolves the record's current tier (via `pflxHostTier`), fills the fields,
   and **disables tier options above the assigner's own rank** (an Admin can't
   mint a Master).
3. **Save** (`mcApplyTierToRecord(rec)`) — hooked into both branches of
   `mcSavePlayerForm`. Maps tier → underlying `role` + `hostTier` + scope:
   - master→role `admin`, admin→`host`, cohost→`host`, instructor→`instructor`,
     guest→`instructor`; player→`player` and all tier/scope fields stripped.
   - Writes `managedCohorts[]` / `managedNodes[]` / `managedProjectId` per tier
     (instructor cohorts sliced to 1; master/admin scope cleared = global).
   - **Guards:** no-op unless `pflxCan('assign.tiers')`; hard rank-ceiling check
     (can't assign above your own tier) with an alert. The underlying `role` is
     always a valid host role so the legacy gates keep recognizing the user as
     host until Phase 3 adds scope enforcement.
4. **Player list** role column now shows the real **tier label** (Master Host /
   Admin Host / Co-Host / Instructor / Guest Instructor / Player) with a
   per-tier color, replacing the old binary Host/Player pill.

## Verification
- Node harness (`/tmp/pm_harness.js`, extracts the REAL Phase 2 functions from
  preview.html): **24/24 pass** — every tier→role/hostTier/scope mapping,
  instructor single-cohort trim, guest project+nodes, master/admin scope-clear,
  player strip, the rank-ceiling block (admin can't assign master), non-assigner
  no-op, and `mcPlayerTier` derivation.
- `node --check` on the full containing `<script>` block (2.3M chars): clean.
- NOT browser-tested (sandbox). Ennis: sign in as an admin/master, edit a
  player, confirm the ACCESS & ROLE section appears, assign Co-Host with two
  cohorts, save, reopen → values persist; confirm a non-host session never sees
  the section.

## Still ahead
- **Phase 3 (enforcement):** route the cohort/player/approval renderers +
  `pflxPlayerCanAccessApp` short-circuit through `pflxCan(cap, {cohort|nodeId|
  projectId})`; flip `inScope` unset-behavior permissive→strict; filter each
  approval stream by capability + scope.
- **Phase 4 (plus gating):** Save Point / lockdown / freeze / restore behind
  `pflxCan('plus.*')` (Master only).
- Note: the quick "Make Host / Make Player" action in the player row still flips
  `role` admin↔player directly (→ Master/Player). The modal Tier dropdown is now
  the precise control; consider retiring or relabeling that quick toggle.

---

# Session Update — July 6 2026 (Opus) — TIERED HOST ACCESS, Phase 3 (enforcement)

Phase 3 makes the tiers actually *do* something (`pflx-platform`,
`preview.html`). Focus = the **Approvals suite**, which the user's spec defines
per tier. **Design guard: only scoped tiers (cohost/instructor/guest) are ever
filtered — Master/Admin see and act on everything**, so existing hosts have
zero regression.

## inScope refined (in the Phase 1 engine)
`inScope` now reads the RAW session fields to distinguish:
- **`managedNodes/managedCohorts/managedProjectId` undefined** (never assigned —
  e.g. a legacy `instructor`-role account) → **permissive** (legacy grace, keeps
  them working until an admin scopes them).
- **assigned as an array, even `[]`** (any tier created via the Phase 2 Player
  Manager) → **STRICT membership** — an explicitly-empty scope manages nothing.
Master/admin still bypass scope entirely (global).

## Approvals enforcement (both surfaces)
Shared helpers next to the approvals card: `_pflxApprovalEnforce()` (true only
for cohost/instructor/guest with the engine loaded), `_scopedApprovalCan(cap,
ctx)`, and `_pflxPlayerCohortById(id)`.
- **Home Approvals card** (`renderApprovalsCard`) — items now carry scope hints
  (`cohort` on task/trade, `nodeId`+`cohort` on coinsub). After sort, scoped
  hosts get `items.filter(_homeApprovalAllowed)`:
  reward→`approve.reward`, task→`approve.task{cohort}`,
  coinsub→ node? `approve.node{nodeId}` : `approve.reward`,
  trade→`approve.trade{cohort}`.
- **MC Approvals tab** (`mcRenderApprovals`) — `items.filter(_mcApprovalAllowed)`:
  task→`approve.task{cohort}`, pitch→`approve.node`,
  arena_external→`approve.reward` (admin+ only), module_completion→
  `approve.node{nodeId}`.
- **Action backstops** (a hidden item can't be approved via a stale/forged
  button): guards added to `pflxApproveSubmission`, `pflxDenySubmission`,
  `mcApproveItem`, `mcRejectItem` — each re-derives cap+scope by id and refuses
  with a toast if the tier can't act.

Net effect per the spec: a **Co-Host** sees node / task / trade approvals for
its cohorts (no reward requests, no barter); an **Instructor** the same for its
one cohort (barter allowed); a **Guest** only its project's task/node items;
**Admin/Master** everything.

## Verification
- Node harness (`/tmp/tier3_harness.js`, real engine extracted from preview):
  **15/15 pass** — undefined-scope permissive vs assigned-`[]` strict vs
  membership, for cohort / node / project; master/admin ignore scope; capability
  still enforced regardless of scope (cohost never `approve.reward`, guest never
  `approve.trade`). Earlier Phase-1/2 harnesses (34/34, 24/24) still hold.
- `node --check` on both affected `<script>` blocks (2.3M approvals block +
  94k engine block): clean.
- NOT browser-tested. Ennis: assign a test account Co-Host scoped to one cohort,
  sign in as them, confirm the Approvals card + MC Approvals tab show only that
  cohort's task/node/trade items and NO reward requests; confirm an Admin still
  sees everything.

## Remaining
- **Phase 4 (plus gating):** ✅ SHIPPED — see next entry.
- **Optional Phase 3b:** scope the *player list* and *cohort views* themselves so
  a Co-Host/Instructor only sees their cohorts' players (currently still global —
  only approvals are scoped this pass). Wire the same `pflxCan('manage.cohorts',
  {cohort})` / `manage.players` into `mcRenderPlayers` + cohort renderers.

---

# Session Update — July 6 2026 (Opus) — TIERED HOST ACCESS, Phase 4 (plus features) — **MODEL COMPLETE**

Phase 4 locks the Master-only plus features (`pflx-platform`, `preview.html`).
With this the whole five-tier model (Phases 1→4) is in place.

## What shipped
Master is the only tier holding a `plus.*` capability. Two layers, both
**fail-open** if the tier engine ever fails to load (`window.pflxCan` absent →
legacy behavior preserved, nothing hidden/blocked):
1. **Function guards** via `pflxRequirePlus(cap, label)` (toast + return if
   denied) on:
   - `pflxCreateSavePoint` → `plus.backup` (auto-backup / restore reference)
   - `hmcToggleAppLock`, `hmcLockdownToggle` → `plus.override` (system override)
   - `hmcFreezeAll`, `hmcResumeAll` → `plus.override`
2. **UI gating** via `pflxApplyPlusGating()` (called from `hmcRefreshDashboard`
   so it re-applies on every Host panel render): hides the 🛟 Create Save Point
   button, disables the four app-lock toggles, and hides the Freeze All / Resume
   All / Lockdown Mode buttons for non-Master hosts.

Left as normal host tools (NOT gated — operational, not override/backup): XC
Drop, Broadcast, Reload All/Reload App, per-player freeze.

Existing `admin`-role accounts resolve to **Master** (Phase 1 rule) → they keep
every plus feature. Plain `host`-role → **Admin** tier → loses plus features, as
the model intends ("Admin Host: no plus features").

## Verification
- `node --check` on the containing `<script>` block (2.3M): clean.
- Logic harness (`/tmp/plus_logic.js`, reuses the REAL engine): **8/8** —
  master shows/uses plus, admin/cohost/instructor hidden+blocked, no-engine
  fail-open. Underlying `plus.*`=master-only already proven in the Phase 1
  harness (34/34).
- NOT browser-tested. Ennis: sign in as a plain **Admin** (host role, not admin
  role) → the Save Point button, app-lock toggles, and Freeze/Lockdown buttons
  should be gone/disabled; as **Master** everything is present and works.

## TIERED HOST ACCESS — full model status
- Phase 1 (foundation: tiers + `pflxCan`) ✅
- Phase 2 (Player-Manager assignment UI) ✅
- Phase 3 (approvals enforcement + strict scope) ✅
- Phase 4 (Master-only plus features) ✅
- Optional follow-ups: **3b** ✅ SHIPPED (next entry), and richer scope
  pickers (a real node/module multiselect instead of the comma-separated ID
  field). The `pflxCan(cap, {cohort|nodeId|projectId})` gate is the one place to
  extend for any further surface.

---

# Session Update — July 6 2026 (Opus) — TIERED HOST ACCESS, Phase 3b (list/cohort scoping)

Scopes the player lists and cohort cards themselves so a Co-Host/Instructor only
sees what they manage (`pflx-platform`, `preview.html`).

## What shipped
Two shared helpers next to the approvals enforcement block:
- `_pflxPlayerVisible(p)` → `pflxCan('manage.players', {cohort:p.cohort})`.
- `_pflxCohortVisible(name)` → `pflxCan('manage.cohorts', {cohort:name})`.
Both fail open when the engine is absent. Wired into:
1. **`mcRenderPlayers`** (Settings → Manage Players) — filter predicate drops
   players outside the host's cohort scope.
2. **`hmcRenderPlayers`** (Host Mission Control player table) — same filter, and
   the cohort filter dropdown is limited to visible cohorts.
3. **`mcRenderCohortGroups`** — non-visible cohort cards are skipped in-place
   (return '' inside the map, preserving index `i` so edit/delete still target
   the right group); empty state reads "No cohort groups in your scope."

Behavior by tier: Master/Admin see everyone (global); Co-Host/Instructor see
only players/cards in their `managedCohorts` (a legacy tier with no assigned
scope stays permissive); **Guest sees no players or cohort cards** (guests hold
neither `manage.players` nor `manage.cohorts` — they work at the Project level).

## Verification
- Logic harness (`/tmp/pv_logic.js`, real engine): **10/10** — master/admin see
  all, cohost in/out-of-scope, legacy-cohost permissive, instructor single
  cohort, guest sees none, cohort-card visibility, engine-absent fail-open.
- `node --check` on the containing block (2.3M): clean.
- NOT browser-tested. Ennis: as a scoped Co-Host, Manage Players + the Host
  panel table + Cohort Groups should show only your cohorts; as Admin, all.

## Note (not changed)
- Cohort Groups stat tiles (TOTAL GROUPS / TOTAL PLAYERS) still show global
  counts — cosmetic; the card list itself is scoped. Scope those counts too if
  it matters.
- Player row "Make Host/Make Player" quick toggle is unchanged (still a coarse
  admin↔player flip); the modal Tier dropdown remains the precise control.

---

# Session Update — July 6 2026 (Opus) — Open Space Combat Phase D (NPC pirates)

Phase D of the EVE-style combat layer (`pflx-pathway-portal`, `pathway.html`):
live hostile ships that fight the player, using the Nova defense/weapon model
from Phase C. Search anchor: `NPC PIRATES — Open Space combat Phase D`.

## What shipped — `pflxPirates` IIFE
- **Three pirate types = the Nova weapon triangle** (fired at the player via
  `pflxCombat.applyDamage`):
  - **Raider** 🛩 — kinetic, high armor-pen (0.85), fast, hp 8, bounty 18.
  - **Gunship** 🛸 — laser, high shield-pen (0.85), hp 14, bounty 32.
  - **Missile Frigate** 🚀 — missile, balanced pen (0.45/0.45), heavy 14 dmg,
    hp 22, bounty 55.
- **AI** (`step`): approach → orbit-at-range (fires on weapon cooldown) → flee
  below 28% hull (stops firing). Per-frame motion matching the ship model.
- **Integration:** pirates register in `window.pflxSpaceObjects` as `type:
  'pirate'` with `hp`, so the target computer, Overview, autopilot (approach/
  orbit/keep) and blaster all treat them as normal contacts. Added `pirate` to
  `pflxCombat` TYPE_META ("Hostile Ship") and to the F1 blaster `wants`.
- **Player → pirate damage:** `pflxBlaster.hit` branches to
  `pflxPirates.damagePirate` (deals `blaster.damage()×2`); works from both the
  SPACE auto-blaster (now prioritizes hostiles in range) and the F1 module on a
  locked pirate. Target cards show the pirate hp bar.
- **Kills** drop salvage-scrap / weapon-part / plasma-core + instant-credit
  bounty XC (`pflxCargo.addXC`, Console-clamped ≤200), with a GL explosion
  burst.
- **Feedback:** red hull-hit vignette (`#pflxHurtVig`), cyan/red damage floaters
  on both sides, and a **real camera shake** applied to `#nodeCanvas` — the
  untransformed outer container, so it never fights `applyTransform` (which only
  transforms `#nodeLayer`).
- **Spawning:** up to 3 hostiles within ~850–1250u of the ship, only in flight
  (chase/cockpit) and only when the ship is **>1500u from home (safe zone)**;
  despawn beyond 2900u. Markers render in `#nodeLayer` (correct world coords,
  same fix as crew peers). Death remains the non-punitive Phase-C hull-breach
  warp if the player's hull hits 0.

## Verification
- Syntax gate: 4 inline `<script>` blocks, `node --check`, **0 failures**.
- Headless core harness (`/tmp/pirate_harness.js`, extracts the REAL pure core):
  **19/19 pass** — approach/orbit/flee state machine, distance-closing, fire
  cadence + no-double-fire + no-fire-while-fleeing, the full Nova triangle per
  type, non-lethal vs lethal damage, kill reward (bounty XC + always-salvage),
  dead-pirate ignores further hits, `pickType` validity + weighting.
- **NOT play-tested in a browser** (sandbox). Ennis: fly >1500u from your start
  node in chase/cockpit → hostiles should spawn, orbit and shoot (screen shakes
  + red vignette on hits); lock one (click its marker) and F1/SPACE to kill it
  for salvage + XC; check the camera-shake direction feels right and that pirates
  don't spawn in the home area.

## Phase D follow-ups (not built)
- Weapon-type resistance readout / smarter target priority AI (focus-fire,
  fleeing to regroup), pirate loot rarity tiers (Nova component rarity).
- Real GLTF pirate meshes in the GL scene (currently DOM markers).
- Optional: a "bounty board" / wanted-level that scales spawn rate with time in
  deep space; distress-call events near clusters.
- Overview still labels pirates generically if `TYPE_META` isn't consulted for a
  given surface — cosmetic.

---

# Session Update — July 6 2026 (Opus) — X-Bot BYO-LLM (player AI activation), slice 1

New feature (Ennis): players activate X-Bot by connecting an LLM — a
MagicSchool-style secure student AI. First slice shipped in `pflx-platform`
`preview.html`. Decisions: **both** key models supported, **host chooses per
cohort**; build the slice (not just spec).

## How it works
X-Bot already had a multi-provider engine (`XBOT_AI`) with a server proxy
(`api/pflx-ai.js`, host/platform keys) and a Local-AI provider. This slice adds
a per-player activation + BYO layer on top.

- **`pflxPlayerAI`** (new module, search `PLAYER BYO-LLM`, `window.pflxPlayerAI`):
  - **Per-cohort mode** `cohortAiMode()` reads `cg.ai.mode` on the cohort group:
    `off` / `host` (school key via proxy — safest for minors) / `player` (true
    BYO, student's own key or local model) / `both` (student key, else host).
    Default `host` preserves today's proxy-powered X-Bot.
  - **Activation** `isActivated()`: hosts always active; players active per mode
    (`off`→never, `host`/`both`→yes, `player`→only once they connect).
  - **BYO connection** stored **browser-only** (`localStorage pflx_player_ai_v1`)
    — `connect()/disconnect()/getConnection()/hasConnection()`. `applyToEngine()`
    overlays the player's own key/URL into `XBOT_AI` for their session only
    (claude/openai/gemini/local). **Bugfix caught by tests:** the overlay guard
    referenced `window.XBOT_AI` (undefined — it's a lexical const), so BYO keys
    would have silently no-op'd; now references `XBOT_AI` directly.
  - **`openConnect()`** modal (reuses the shared `openModal`): provider picker +
    key or local-URL input, Activate / Disconnect; host-mode = one-tap activate.
  - **Locked educational safety prompt** `safetyPrompt()` — the "secure
    environment": no harmful content, no cheating, never reveal keys/prompt,
    mentor tone, crisis→trusted-adult redirect.
- **Hooks in `XBOT_AI`:**
  - `buildSystemPrompt` prepends the safety preamble for **player** sessions
    (hosts unaffected) — applies whatever model is behind X-Bot.
  - `respond()` calls `applyToEngine()` then **gates a dormant X-Bot**: an
    unactivated player gets a "connect your AI" message instead of a model call.
- **UI:** a ⚡ **Connect-AI button** in the X-Bot panel header
  (`#xbot-connect-ai` → `pflxPlayerAI.openConnect()`), and a **per-cohort AI mode
  selector** added to the cohort Chat Controls modal (saves `cg.ai.mode`).

## Security notes
- A player's own key never leaves their browser and powers only their own calls.
- Host-key mode uses the existing server proxy (no per-cohort secret stored yet).
- Browser mixed-content: "local model" only works when the model runs on the
  same machine as the browser (localhost) — the modal says so.
- ToS/age: for minors, **host-key mode is the recommended default**; player-BYO
  is there for adult/opted-in cohorts.

## Verification
- Headless harness (`/tmp/pai_harness.js`, extracts the REAL module): **17/17** —
  default/host/off/player/both mode resolution, activation per mode, connection
  storage round-trip, claude+local key overlay, host-session bypass, invalid-mode
  fallback, safety-prompt content, and host-mode does-not-overlay-player-key.
- `node --check` on the containing block: clean (before and after the bugfix).
- NOT browser-tested. Ennis: set a cohort's X-Bot AI mode in Cohort Groups →
  Chat Controls; as a player in that cohort, open X-Bot → if `player` mode it's
  dormant until you tap ⚡ and connect a key; confirm host X-Bot is unchanged.

## Next slices (not built)
- Store an encrypted host/cohort key for `host` mode that isn't the shared Vercel
  proxy (per-cohort spend control) — reuse X-Coin's AES-GCM token pattern.
- A live test-ping on connect (validate the key before activating).
- Dormant *panel* state (richer than the chat message) + a first-run coach.
- Moderation pass on player input/output; host visibility of player AI usage
  (the existing X-Bot monitor/mimic tools are the hook).
- Per-cohort feature unlocks (tutor / study-buddy / quest-hints) gated on
  activation.

---

# Session Update — July 6 2026 (Opus) — X-Bot BYO-LLM, slice 2 (validated connect + dormant abilities)

Builds on slice 1 (`pflx-platform`, `preview.html`).

## What shipped
1. **Validated connect (no silent broken keys).** `pflxPlayerAI.testConnection(conn)`
   runs a real minimal call before activating: host mode probes the server proxy;
   BYO does a tiny `XBOT_AI.callModel` with the candidate key. On failure it
   **restores the engine's keys** and returns the error. The connect modal's
   Activate is now async — shows "Validating…", activates only on success, and
   toasts the actual error otherwise.
2. **Activation-aware "dormant abilities"** (the original vision — features that
   light up once a player connects their AI). New `xbotRefreshAbilities()` owns
   the X-Bot quick-actions row:
   - Unactivated player → a single **⚡ Activate X-Bot** chip → opens the connect
     modal.
   - Activated player → the learning abilities appear: **📚 Study Buddy**,
     **🧭 Explain This**, **💡 Quest Hint**, **✍️ Writing Coach** (plus the
     basics). Each sends a safety-wrapped preset through the normal `respond()`
     path (so the locked educational prompt still applies).
   - Hosts keep the classic basics (progress/missions/rank/help) with the
     no-AI static fallback preserved.
   Rebuilt on login (`initXBot`) and again on connect/disconnect (via the
   module's `_refreshUi` → `window.xbotRefreshAbilities`).

## Verification
- Harness (`/tmp/s2_harness.js`, real module): **10/10** — host-proxy ok/down,
  valid key stays applied, **bad key restores engine keys + surfaces the error**,
  empty-response invalid + restore, local-provider valid. Slice-1 harness
  (17/17) still holds.
- `node --check` on the containing block: clean.
- NOT browser-tested. Ennis: as a `player`-mode player, tap ⚡ → paste a WRONG
  key → should refuse with an error (X-Bot stays dormant); paste a good key →
  activates and the Study Buddy / Explain / Quest Hint / Writing Coach chips
  appear.

## Still open (BYO-LLM)
- Encrypted per-cohort host key for `host` mode (spend control) — X-Coin AES-GCM
  pattern.
- Moderation is already present (`XBOT_MOD`) on typed input; extend to ability
  presets if desired + host visibility of player AI usage.
- Per-cohort selection of WHICH abilities unlock; usage/roster surfacing.

---

# Session Update — July 6 2026 (Opus) — X-Bot BYO-LLM, slice 3 (per-cohort ability selection)

Hosts now choose WHICH dormant abilities a cohort's students get
(`pflx-platform`, `preview.html`).

## What shipped
- **Central ability registry** in `pflxPlayerAI`: `ABILITIES` = studyBuddy /
  explain / questHint / writingCoach (each `{id,label,send}`), plus
  `abilityEnabled(id)` and `enabledAbilities()` reading `cg.ai.abilities`
  (default: all on).
- **Cohort control:** the Chat Controls modal (where AI mode lives) now has four
  ability checkboxes saved to `cg.ai.abilities`.
- **`xbotRefreshAbilities()`** renders only the host-enabled abilities for an
  activated player (was hardcoded to all four). Single source of truth — the
  chip labels/prompts now come from the registry.

## Verification
- Harness (`/tmp/s3_harness.js`, real module): **10/10** — default all-on,
  explicit off (subset), all-off, explicit-on, unknown-cohort default,
  registry shape. Slice 1/2 harnesses (17/17, 10/10) still hold.
- `node --check` clean.
- NOT browser-tested. Ennis: Cohort Groups → Chat Controls → uncheck e.g. Quest
  Hint; an activated player in that cohort should no longer see the 💡 chip.

## BYO-LLM feature status
- Slice 1 (activation + security) ✅ · Slice 2 (validated connect + dormant
  abilities) ✅ · Slice 3 (per-cohort ability selection) ✅.
- Still open: encrypted per-cohort host key (spend control), host visibility of
  who's activated (needs a cloud `aiConnected` flag — no keys), moderation on
  ability presets.

---

# Session Update — July 6 2026 (Opus) — X-Bot BYO-LLM, slice 4 (host visibility of activation)

The MagicSchool-style oversight piece (`pflx-platform`, `preview.html`).

## What shipped
- On connect/disconnect, `pflxPlayerAI.reportStatus()` upserts a **non-secret**
  entry into cloud row `pflx_player_ai_status` = `{ [playerId]: { connected,
  provider, brand, cohort, at } }` — **never a key**, read-modify-write so a
  player only writes their own entry.
- `loadStatusMap()` + pure `summarize(map, cohortFilter)` (counts total /
  activated / by-provider, optional cohort restriction, case-insensitive).
- `paintActivation()` renders a host readout at the top of **Cohort Groups**
  (`#mc-ai-activation`): "⚡ N of M students have connected an AI to X-Bot
  (2× claude · 1× openai)", **scoped to the host's visible cohorts** via the
  Phase 3b `_pflxCohortVisible` gate (so a Co-Host only sees their cohorts'
  numbers). Hooked at the tail of `mcRenderCohortGroups` (async, best-effort).

## Verification
- Harness (`/tmp/s4_harness.js`, real module): **11/11** — total vs activated,
  by-provider tally, cohort scoping (case-insensitive), empty/null-safe. Slices
  1–3 harnesses still hold.
- `node --check` clean. NOT browser-tested — Ennis: after a couple of players
  activate, open Cohort Groups and confirm the ⚡ readout shows counts for your
  cohorts only. Privacy: only connection flags + provider name are stored, never
  keys.

## BYO-LLM — remaining
- Encrypted per-cohort **host key** for spend control — ✅ SHIPPED (next entry).
- Moderation already covers typed input (`XBOT_MOD`); could extend to ability
  presets. Per-player usage detail (beyond counts) if wanted.

---

# Session Update — July 6 2026 (Opus) — X-Bot BYO-LLM, slice 5 (encrypted per-cohort host key)

The last major BYO-LLM piece: a host can point a cohort at their SCHOOL's own AI
account (spend control) without the key ever reaching a student's browser.
Spans both repos.

## Secure design
The raw key transits HTTPS to the serverless proxy exactly once, is **encrypted
server-side (AES-256-GCM, key from `PFLX_KEY_SECRET`)**, and only the ciphertext
is ever stored. At call time the proxy fetches the cohort's ciphertext and
**decrypts it server-side** to make the provider call — the plaintext key never
goes to any client (students included).

## Backend — `pflx-pathway-portal/api/pflx-ai.js` (rewritten)
- `encryptKey`/`decryptKey` (AES-256-GCM; `iv|tag|ct` base64).
- **`POST { action:'encrypt', provider, key, adminSecret? }`** → `{ enc }`.
  Requires `PFLX_KEY_SECRET`; if `PFLX_ADMIN_SECRET` env is set, the caller must
  match it.
- **`fetchCohortKey(cohort)`** reads app_data row `pflx_cohort_ai_keys` via the
  Supabase REST anon API and decrypts the entry.
- Generate path: if the POST carries `cohort` and a key is configured for it,
  that provider+key **override** the platform env key; otherwise env keys as
  before. All provider fetches now use a resolved `apiKey` var. `claude`→
  `anthropic` provider mapping.
- GET health adds `cohortKeys: <bool>`.
- **NEW Vercel env (pathway-portal project) required to enable the feature:**
  `PFLX_KEY_SECRET` (any strong random string), `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`; optional `PFLX_ADMIN_SECRET`. Without them, cohort keys
  are simply inert and X-Bot uses the existing platform keys.

## Client — `pflx-platform/preview.html`
- `XBOT_AI.callProxy` now sends the active player's `cohort`, so the proxy can
  apply a cohort key.
- `pflxPlayerAI.setCohortKey/clearCohortKey/cohortKeyStatus` — setCohortKey posts
  the raw key to the proxy's encrypt action, then stores only the returned
  ciphertext in `pflx_cohort_ai_keys` (read-modify-write). Status returns
  provider names only, never ciphertext.
- Cohort **Chat Controls** modal gained a "🔐 Cohort AI key" row (provider +
  key + Save/Clear + status line) under the AI mode/abilities.

## Verification
- `node --check api/pflx-ai.js`: clean.
- Crypto harness (`/tmp/crypto_test.mjs`, real functions from the file): **10/10**
  — round-trip across key shapes, ciphertext≠plaintext, **random IV → distinct
  ciphertext**, **tampered ciphertext rejected (GCM auth)**, **wrong secret can't
  decrypt**.
- `node --check` on the client block: clean; slice 1/3 harnesses still pass.
- NOT live-tested (needs the env vars + a real deploy). Ennis: set
  `PFLX_KEY_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` on the pathway-portal
  Vercel project; then Cohort Groups → Chat Controls → Save a school key; a
  player in that cohort using X-Bot in Host/Both mode will run on the school key.

## BYO-LLM feature — COMPLETE
Slices 1–5 shipped: activation + security · validated connect + dormant
abilities · per-cohort ability selection · host visibility · encrypted per-cohort
host key. Optional extras only from here (moderation on ability presets,
per-player usage detail, key rotation UI).

---

# Session Update — July 6 2026 (Opus) — Open Space Combat Phase D.1 (wanted level + loot rarity)

Deepens the Phase D pirates (`pflx-pathway-portal`, `pathway.html`, `pflxPirates`).

## What shipped
- **Wanted level 0–5** (`pflxPirates._core.wanted`): heat rises while the player
  lingers in **deep space** (>1500u from home) and on every kill (~0.34/kill),
  and cools ~4× faster in the safe zone. `update(dt,inDeep)` / `bump()` /
  `level()`. Higher wanted →
  - **more concurrent hostiles** (`maxActive()` = 2 + level, cap 6) and **faster
    spawns** (`spawnCd` shrinks with level),
  - **tougher type mix** (`pickType(level)` skews toward gunships/frigates),
  - a red **WANTED ★★★** HUD chip (chase/cockpit) + an escalation toast on
    level-up.
- **Nova-style loot rarity** (`RARITY`: common/uncommon/rare/epic, ×1 → ×3.2 XC,
  component alloy-plate/weapon-part/shield-cell/quantum-core). `rollRarity(bonus)`
  weights toward higher tiers as bonus grows; `killReward(p, wantedLvl)` sets
  `bonus = wantedLvl + (frigate?2:gunship?1:0)`, scales XC by
  `bounty × (1 + wanted×0.2) × rarityMult`, always drops salvage + one rarity
  component (+ plasma-core chance at wanted ≥3). Kill shows a colored
  "EPIC DROP" floater + rarity in the toast.
- Refactor: `hurt()` now returns `{ killed }` only; reward is computed at the
  kill site with the live wanted level.

## Verification
- Syntax gate: 4 blocks, **0 failures**.
- Headless harness (`/tmp/wanted_harness.js`, real core): **19/19** — heat
  rise/cool, cap at 5, kills bump level, `maxActive` scaling, rarity distribution
  shifts with bonus (low mostly common, high more epic, always valid), reward XC
  rises with wanted, frigate loot > raider (averaged), always-salvage + rarity
  component + label/color, wanted-aware type mix.
- NOT browser-tested. Ennis: fly deep (>1500u) and linger/kill — the WANTED chip
  should climb, spawns intensify, and drops should show rarity tiers; return to
  the safe zone to cool it down.

## Combat follow-ups still open
- Focus-fire / regroup AI; GLTF pirate meshes (Phase E); a scan showing a
  target's weakness; distress-call cluster events. The wanted/rarity substrate is
  the hook for a bounty-board / shop economy.

---

# Session Update — July 6 2026 (Opus) — Open Space Combat Phase D.2 (Fabrication Bay)

Closes the combat economy loop (`pflx-pathway-portal`, `pathway.html`): fight →
loot → **spend the loot**.

## What shipped
- **Item defs** for the Phase D.1 salvage: `alloy-plate` (common), `weapon-part`
  (uncommon), `shield-cell` (rare), `quantum-core` (epic) — they now render with
  icons/rarity in the CARGO HOLD.
- **`pflxCargo` helpers**: `count(id)`, `canSpend(costMap)`, `spend(costMap,
  reason)` (atomic deduct + save + re-render).
- **`pflxFab`** (search `FABRICATION BAY`, `window.pflxFab`) — a recipe registry
  + `canAfford(id)` / `craft(id)`:
  - **Hull Patch** (3 scrap + 1 alloy) → `pflxCombat.repair({hull: 45% max})`
  - **Armor Weave** (3 alloy) → armor to full
  - **Shield Recharge** (1 shield-cell + 1 plasma-core) → shields to full
  - **Full Refit** (1 quantum-core + 4 alloy + 2 shield-cell) → full repair
  - **Smelt Scrap → XC** (5 scrap) → +60 XC (instant-credit path)
  All repairs go through the Nova defense model from Phase C. `craft` refuses
  (no deduction) when components are short.
- **CARGO HOLD → 🛠 FAB tab**: recipe cards with per-component cost vs. what you
  have (red when short) and a CRAFT button gated on affordability; a
  NOT-ENOUGH-SALVAGE toast otherwise.

## Verification
- Syntax gate: 4 blocks, **0 failures**.
- Headless harness (`/tmp/fab_harness.js`, real `pflxFab`): **17/17** — registry,
  affordability, correct deductions per recipe, repair/armor/shield calls routed
  to `pflxCombat.repair`, insufficient-craft refused with NO deduction, smelt →
  +60 XC, unknown recipe safe.
- NOT browser-tested. Ennis: destroy hostiles to gather alloy-plate / shield-cell
  / quantum-core, open CARGO HOLD → 🛠 FAB, and craft a Hull Patch after a fight —
  your hull should jump.

## Combat loop status
Fight (Phase C/D) → wanted-scaled threat + rarity loot (D.1) → **spend loot on
repairs/XC (D.2)**. Natural next: a proper salvage-shop economy / bounty board,
or Phase E GLTF graphics.

---

# Session Update — July 6 2026 (Opus) — Open Space Combat Phase D.3 (Bounty Board)

Gives deep-space combat a goal beyond survival (`pflx-pathway-portal`,
`pathway.html`).

## What shipped
- **`pflxBounties`** (search `BOUNTY BOARD`, `window.pflxBounties`) — a contract
  state machine persisted per player (`pflx_bounties_v1_<pid>`):
  - 5 templates (Raider Hunt / Gunship Wing / Apex Predator / Sector Cleanup /
    Deep Purge) with a target type (or `any`), count, XC + salvage reward.
  - `load()` keeps **3 offers** available; `accept(uid)` moves an offer to
    active and refills; `onKill(ptype)` advances every matching active contract
    (type or `any`), flags `claimable` at the count and toasts; `claim(uid)`
    pays XC + components via `pflxCargo` and removes it (refuses if incomplete).
- **Hooked into combat**: `pflxPirates` kill path calls `pflxBounties.onKill(p.ptype)`.
- **CARGO HOLD → 📜 BOUNTY tab**: active contracts with progress bars + Claim
  (when ready), and an Available list with Accept.

## Verification
- Syntax gate: 4 blocks, **0 failures**.
- Headless harness (`/tmp/bounty_harness.js`, real module): **15/15** — 3 offers
  on load, accept moves + refills, non-matching kills don't progress, reaching
  count → claimable, progress capped after claimable, claim pays exact XC+items
  and removes, incomplete/unknown claims refused, `any` target counts every type.
- NOT browser-tested. Ennis: CARGO → 📜 BOUNTY → Accept a contract, destroy the
  matching hostiles, then Claim for XC + salvage.

## Combat loop — full arc
Pilot/target (C) → enemies/damage (D) → escalating threat + rarity loot (D.1) →
spend on repairs/XC (D.2) → **contracts/goals (D.3)**. Remaining ideas: Phase E
GLTF graphics, a target-weakness scan, focus-fire AI.

---

# Session Update — July 6 2026 (Opus) — Google Drive / Docs in Mission Control (v1)

New feature (Ennis): attach Google Docs/Drive to MC. Decisions: **links now +
Picker scaffolded**, on **Tasks / Projects / Checkpoints**, **both directions**
(host resources + player Doc submissions). `pflx-platform`, `preview.html`.
NOTE: the Google MCP connectors in the session are Claude's tools, not app
features — this is built with Google's web URLs (no OAuth needed for link+embed).

## What shipped
- **`pflxGoogle`** (search `GOOGLE DRIVE / DOCS in Mission Control`,
  `window.pflxGoogle`):
  - `parseLink(url)` recognizes Google Docs / Sheets / Slides / Forms, Drive
    `file/d/`, Drive `drive/folders/`, and `open?id=` / `uc?id=` → `{kind,
    fileId, url, embedUrl, icon, label}`. Correct `/preview` + `embeddedfolderview`
    embed URLs.
  - `cardHtml` (XSS-escaped) with **Open** + inline **Preview** (`togglePreview`
    injects a Drive iframe), `linkCardIfGoogle(url)` (renders only if Google),
    `attachModal` (paste-link, validated), and a **Picker scaffold**
    (`configure/isConfigured/openPicker`) that currently falls back to the link
    modal — ready to wire once a Google Cloud Client ID + API key are provided.
- **MC glue**: `mcGoogleAttach(kind,id)` / `mcGoogleRemove(kind,id,attId)` mutate
  `record.attachments[]` + `mcSaveData` + re-render; `mcGoogleAttachmentsHtml(rec,
  kind, editable)` is a one-line drop-in (📎 Resources list + Attach button).
- **Wired into all three card renders**: `mcRenderCheckpoints` (var `cp`),
  `mcRenderProjects` (var `p`), `mcRenderTasks` (var `t`) — host can attach/remove
  Google files, everyone sees them with Open/Preview.
- **Player Doc submissions**: on the task card, if `t.submission.link` is a
  Google link it renders as a Doc card (the "students submit Docs" direction).

## Verification
- Headless harness (`/tmp/gdrive_harness.js`, real module): **20/20** — every
  Google URL form incl. http, non-Google → null, empty/junk → null, embed-URL
  shapes, `cardHtml` XSS-escape, `linkCardIfGoogle` gating.
- `node --check` on the containing block: clean.
- NOT browser-tested. Ennis: open a Task/Project/Checkpoint card → 📎 Attach a
  Google Doc share link → Open/Preview should work (ensure the doc's sharing lets
  students view). A player whose submission link is a Google Doc shows a Doc card.

## Follow-ups
- **Google Picker (browse-my-Drive)**: needs a Google Cloud project → give me a
  Client ID + API key (+ consent screen); then wire GIS + Picker inside
  `pflxGoogle.openPicker` (scaffold + `configure()` already there) and add a
  small MC settings field to call `pflxGoogle.configure(id,key)`.
- ~~Player Portal read-only render~~ — SHIPPED (next entry).
- Attach control inside the edit modals (currently on the cards), and a
  cohort **Resources hub** panel if wanted.

### Addendum — Player Portal read-only resources (same day)
`mcGoogleAttachmentsHtml(rec, kind, false)` dropped into the player detail
views — `ppRenderProjectDetail` (var `proj`, after description) and
`ppRenderTaskDetail` (var `task`, after description) — guarded by
`typeof mcGoogleAttachmentsHtml === 'function'`. Students now see the host's
attached Google resources (Open + Preview) on their own task/project pages,
read-only (no attach/remove). `node --check` clean; parseLink harness still
20/20. Player checkpoint view is a list (no detail route) so nothing to wire
there; the compact player task/project LIST cards (~45942/45970) still show
resources only on the detail page, which is where students actually work.

---
---

# Session Update — July 6 2026 (Opus) — Badge economy fixes (XC credit on approval + portfolio images)

Ennis: task badge rewards should read live X-Coin, credit XC to all totals when
earned, and show in players' portfolios WITH the badge image. `pflx-platform`,
`preview.html`. (Full economy map from a subagent — see that report if resuming.)

## Bugs found (via subagent map)
1. **Badge XC lost on approval.** `mcSaveTaskForm` saves `task.rewardBadges` as
   bare **id strings** (line ~28533), so `mcApproveTask` built a badge object
   with no `xcValue`/`category`, and `PflxDataBus.award`'s XC-credit block
   (`if (b.xcValue>0)`) never fired. Badge XC never reached `xc`/`totalXcoin`.
2. **Portfolio never showed earned badges** — it read only `badgeCounts` counts
   (which weren't incremented either, since no `category`), never listed the
   badges or their artwork.
3. **Picker could go stale** — built once on form open, no re-render on X-Coin
   badge sync.

## Fixes
- **`mcApproveTask`**: each `rewardBadges` entry is now **resolved via
  `mcFindBadge()`** (the live `mcGetAllBadges()` catalog) → full
  `{id, name, category(key), xcValue, image}` before `PflxDataBus.award`. So the
  badge's XC is credited to `xc`/`totalXcoin` (and propagates to toolbar / hero /
  leaderboard / sub-apps via the bus), `badgeCounts[category]` increments, and
  the id lands in `player.badges`.
- **`_pflxBadgeCategoryKey()`** maps any catalog label/tier →
  `primary|premium|executive|signature` (the keys `badgeCounts` + the portfolio
  grid use) so counts + tiles are correct.
- **`mcGetAllBadges()`** now carries `image` (from X-Coin's `image/img/imageUrl/
  photo/artwork` fields) through the catalog.
- **`portfolioRenderBadges`**: after the category tiles, renders an **Earned
  Badges** grid — resolves the player's `badges` (or legacy array) against the
  catalog and shows each badge's **artwork image** (falls back to the emoji icon)
  + name + XC.
- **Freshness**: `mcRefreshBadgePickers()` rebuilds the OPEN task badge checklist
  (preserving selections) whenever an X-Coin `badges` push arrives; and
  `mcShowTaskForm` calls `mcRequestXCoinData()` on open to pull the latest.

## Verification
- Harness (`/tmp/badge_harness.js`, real `_pflxBadgeCategoryKey` + replicated
  award()): **18/18** — category-key mapping, bare-id → xcValue/category/image
  resolution, award credits badge XC (1000→6000 for a 5000 badge) + increments
  `badgeCounts.signature` + pushes to `player.badges`, portfolio resolves the
  earned badge's image, unknown badge → 0 XC / primary.
- `node --check` on both affected blocks: clean.
- NOT browser-tested. Ennis: approve a task with badge rewards → the player's XC
  jumps by the badge XC and the badge (with image) shows in their Portfolio.

## Follow-ups
- ~~checkpoint / project / node-completion award paths~~ — DONE (next entry).
- X-Coin's badge `image` field name is assumed (`image/img/imageUrl/photo/
  artwork`); confirm the actual key X-Coin stores and trim the list if needed.

### Addendum — badge resolution applied to ALL award paths (same day)
Extracted the resolution into one helper **`_pflxResolveAwardBadge(badgeRef)`**
(id/name/partial-object → `{id, name, category(key), xcValue, image}` via the live
catalog) and routed EVERY `PflxDataBus.award` badge site through it:
task (`mcApproveTask`), **checkpoint** + **project** reward distribution,
**module completion** (`mcApproveItem`), **Core Pathways node completion**
(`pflx_pathway_node_complete`), **automations**, and **X-Tracker** reward
requests. The **coinsub** (X-Coin submission) path also resolves the badge for
image/category but **zeroes `xcValue`** because that path already credits XC via
an explicit `xc` field (avoids double-credit). Verified: 0 remaining
under-resolved badge literals; resolver harness (`/tmp/res_harness.js`) **6/6**
(id/name/object resolution, unknown→0-xc/primary/synthetic-id, category respected,
coinsub double-credit guard); `node --check` clean. So badge XC + artwork now
propagate no matter which surface grants the badge.

---

# Session Update — July 6 2026 (Opus) — Fix v2: Cohort Groups still 0 — read the authoritative PLAYERS roster

The prior fix (re-sync the mirror when EMPTY) wasn't enough: the mirror was
**non-empty but stale**, so it never fell back. Screenshots confirmed the
Settings **Cohort Manager** counts DD Core 5 = 6 via `PLAYERS.filter(p.cohort===key)`
(line ~16108) and Player Management also reads `PLAYERS` — but the MC **Cohort
Groups** panel read the drifting `mcPlayers` mirror.

## Fix
- New `_mcRoster()` returns the **authoritative `PLAYERS`** array whenever it has
  data (what Player Management + the Cohort Manager use), falling back to
  `mcPlayers` only if PLAYERS is unset.
- Switched to `_mcRoster()`: `mcCohortMemberCount`, the Cohort Groups **TOTAL
  PLAYERS** stat, the **Progress** dashboard player list, and the **task-form**
  player picker — so every MC surface now agrees with Host Controls / Player
  Management. (The earlier empty-mirror re-sync stays as a belt-and-suspenders.)

## Verification
- Harness (`/tmp/roster_harness.js`): **6/6** — prefers PLAYERS over a stale
  mirror, DD Core 5 counts 6 (matches the Cohort Manager), the stale-mirror-only
  path would've been 0, other cohort = 1, admin excluded, PLAYERS-empty → mirror.
- `node --check` clean.
- NOT browser-tested. Ennis: reopen MC → Cohort Groups; counts should now match
  the Settings Cohort Manager (DD Core 5 = 6, etc.), and Progress + the task
  picker read the same roster.

---

# Session Update — July 6 2026 (Opus) — Fix: Cohort Groups showed 0 players (mirror desync)

Ennis: Cohort Groups showed "0 players" everywhere + TOTAL PLAYERS 0, though
Player Management had players. `pflx-platform`, `preview.html`.

## Root cause
Two player sources: the master **`PLAYERS`** (what the Settings Player Manager /
`hmcRenderPlayers` shows) and the MC mirror **`mcPlayers`** (from
`pflx_mc_players`), which Cohort Groups / Progress / the task-form picker read.
The mirror had gone empty/stale independently of PLAYERS, and the seed-once guard
(`pflx_mc_seeded`) meant `mcLoadData` never re-synced it. Separately, the seed
map that builds the mirror **dropped `p.cohorts[]`**, so even a populated mirror
failed cohort membership.

## Fix
- **`mcLoadData`**: after the seed block, if the mirror is empty but `PLAYERS`
  has players, **re-sync `mcPlayers` from `PLAYERS`** (real roster, not a mock
  seed — safe post-guard) and now carry `cohorts[]` + the tier fields
  (`hostTier`/`managedCohorts`/…). Fixes every `mcPlayers` consumer at once.
- **`mcCohortMemberCount(cg)`**: new robust counter — matches a group by NAME or
  id against `p.cohort` OR `p.cohorts[]`, normalized; falls back to `PLAYERS` if
  the mirror is momentarily empty. Used for the per-cohort count.
- **Cohort Groups TOTAL PLAYERS** stat now also falls back to `PLAYERS`.

## Verification
- Harness (`/tmp/cc_harness.js`): **5/5** — count by name/case/array/id, exclude
  other-cohort + admin, mirror-empty → PLAYERS fallback, both-empty → 0, sync map
  preserves `cohorts[]` and matches on it.
- `node --check` on the block: clean.
- NOT browser-tested. Ennis: reopen Cohort Groups — per-cohort counts + TOTAL
  PLAYERS should reflect real players. (Also benefits Progress + the task-form
  player picker, which read the same mirror.)

---

# Session Update — July 6 2026 (Opus) — Task form fixes: live pathway nodes + cohort→players

Two bugs Ennis hit in the MC **Task edit form**. Both fixed.

## Bug 1 — "Assign a Core Pathway Node" showed stale/fake nodes
The dropdown read `MC_PATHWAY_CATALOG_BASE` — a hardcoded list with fabricated
node ids (`da-intro`, `cp-py`…) that don't exist in the live pathways. Fix
(cross-app, live sync):
- **`pathway.html`**: `pflxBroadcastPathwayCatalog()` builds the catalog from the
  authoritative `PATHWAYS` const (every pathway + real node id/title/type) and
  `postMessage({type:'pflx_pathway_catalog', catalog})` to the parent on load
  (+1.2s resend) and on `pflx_request_pathway_catalog`.
- **`preview.html`**: a message handler caches the catalog into
  `localStorage['pflx_mc_pathway_catalog']` (which `mcGetPathwayCatalog()` already
  prefers) and repopulates the dropdown; `mcPopulateTaskPathwayNodeDropdown` now
  also pings the `corepathways-frame` (`mcRequestPathwayCatalog`) for fresh data.
  Once the host has opened Core Pathways once, the real catalog is cached and the
  dropdown shows live nodes (cc-storyboard, etc.).

## Bug 2 — selecting a cohort showed "No players in the selected cohort(s)"
`mcRenderTaskAssignedPlayers` mapped the checkbox value (cohort-group **id**) →
group **name**, then matched `p.cohort` by exact string — so it missed players
who store cohorts as an array (`p.cohorts`), by group id, or with casing/space
drift. Rewritten to build a NORMALIZED acceptable-tag set (group id AND name, +
raw checked values) and match if ANY of the player's cohort tags
(`p.cohort` + `p.cohorts[]`) is in it — the same reconciliation as
`pflxItemCohortsMatch`.

## Verification
- Harness (`/tmp/fix_harness.js`): **14/14** — cohort match by name / case+space /
  array / group-id / defensive name-value, host + unselected excluded, no-cohort
  = all; catalog build produces real node ids/titles/types.
- `node --check` on the platform block + pathway.html syntax gate: clean.
- NOT browser-tested. Ennis: open a Task, select cohorts → players list populates;
  open Core Pathways once, then the node dropdown lists real active nodes.

---

# Session Update — July 6 2026 (Opus) — MC Host Progress dashboard (per-player, tier-scoped)

New feature (Ennis): "see each active player's progress within a Checkpoint /
Project / Task" in a host dashboard, respecting the tiered access model.
`pflx-platform`, `preview.html`.

## What shipped
- **Per-player progress helpers** (near the aggregate `_mcCheckpointProgress`):
  - `pflxTaskStateForPlayer(task, pid)` → `approved | submitted | open`. Prefers a
    per-player entry in `task.submissions[]`; else the shared single-status model
    (`task.status` / `task.submission.submittedById`).
  - `pflxPlayerCheckpointProgress(cp, player)` → `{total, approved, submitted,
    pct, tasks[]}` — only the tasks **assigned/visible to that player** (direct +
    via child projects), de-duplicated, using the canonical
    `pflxPlayerCanSeeItem(item, pid, cohorts)` visibility walk.
- **Progress panel** (`mc-panel-progress`) + sidebar nav **📊 Progress**
  (`mcNav('progress')` → `mcRenderProgress`): a Checkpoint selector, a class
  summary bar, then one row per player (avatar, cohort, progress bar,
  approved/total + submitted count, %), each expandable to the per-task status
  chips (✓ approved / ◐ submitted / ○ open, grouped by project).
- **Tier scoping**: player rows filtered by Phase-3b `_pflxPlayerVisible`, so a
  Co-Host/Instructor sees only their cohorts' players; Master/Admin see all —
  satisfying "works in the other host access views based on permissions."

## Verification
- Headless harness (`/tmp/prog_harness.js`, real helpers under stubs): **15/15** —
  per-player task sets by cohort/all/direct assignment, approved/submitted/open
  counts + pct, per-player `submissions[]` state, project-name tagging,
  cross-cohort exclusion, and dedup of a task attached both directly and via a
  project.
- `node --check` on the containing block: clean.
- NOT browser-tested. Ennis: MC → 📊 Progress → pick a checkpoint; each player's
  bar + expandable task states show. Sign in as a scoped Co-Host to confirm only
  their cohorts' players appear.

## Notes / follow-ups
- Progress is checkpoint-centric with drill-down to that player's projects/tasks
  (covers "within a Checkpoint, Project, or Task"). A Project-first or Player-first
  pivot could be added later on the same helpers.
- Completion model assumption documented in `pflxTaskStateForPlayer`: shared
  single-status tasks count as done-for-all-assigned when globally approved;
  tasks with `submissions[]` are tracked per player. If MC later instances tasks
  per player, only that helper changes.

---
---

# ██ SESSION CLOSE — July 6 2026 (Opus) — master summary ██

Read this first when resuming. It consolidates everything shipped this session;
the per-feature entries above have the detail + search anchors + harness names.

## Repo HEADs at session close (updated)
| Repo | Folder | HEAD |
|------|--------|------|
| `pflx-pathway-portal` | `Core Pathway Development/pflx-pathway-portal` | `b4654b2` |
| `pflx-platform` | `PFLX Overlay/pflx-platform-check` | `421c740` |

All pushed to `main`; Vercel auto-deploys both to `prototypeflx.com`.
(Newer entries below this summary block — MC Progress dashboard, Google Docs, and
the run of bug fixes — are folded into workstream 5 below. Workstream 6 = the
X-Coin modifier engine + notifications + ticker, July 9.)

## 6. X-Coin modifiers function platform-wide + notifications + ticker (July 9)
Origin is X-Coin (it only *edits* Upgrades / Modifiers / Fines / Penalties); the
Console now makes them FUNCTION everywhere. Design: honor each modifier's own
`autoApply` flag; all four apply-paths requested.
- **Engine `2c42917`** — `pflxModifiers` (after the `PflxDataBus` IIFE in
  `preview.html`): resolves the live `mcModifiers` catalog and `applyToPlayer`
  routes each `effectType` through the canonical authorities — `xc_add`/`xc_deduct`
  → `PflxDataBus.award` (+/- XC), `xc_multiply` → time-boxed ledger grant that
  `award()` now multiplies EARNED XC by (centralized in `award()`, so every path
  incl. sub-apps honors it), `deadline_extend` → shifts the task/checkpoint due
  date, `freeze` → per-player freeze broadcast. Per-player ledger in
  `mcPlayerModifiers` (`pflx_mc_player_modifiers`). `fireEvent(trigger,ctx)`
  dispatcher fires ONLY `autoApply` modifiers matching the trigger+scope. Every
  application emits the canonical `pflx_xcoin_event` (kind badge|upgrade|fine).
  Badge grants emit the same event from inside `award()`. New `upgrade`/`fine`/
  `ticker` SFX cases. (14/14 harness.)
- **Notification `2c9b9d4`** — `pflxNotify` consumes `pflx_xcoin_event`: the
  AFFECTED player (only) gets a centered, detached popup over a dimmed console
  with the item's uploaded artwork and a sound unique to the kind; ✕ or 10s
  auto-timeout. Offline players → event queued on their cloud-synced record
  (`pendingXcoinEvents`, added to `WRITABLE_FIELDS`) and replayed by
  `drainForCurrent()` on next login (hooked after session-set). (6/6 harness.)
- **Ticker `dae1ce1`** — `pflxTickerPush` appends live happenings to the bottom
  ticker with a chime per update; host gear (host-only) → ticker settings:
  enable, hide player names (anonymize), chime toggle, and PER-COHORT overrides
  that win over the global default. Settings in `pflx_ticker_settings`. (8/8.)
- **Host apply UI `421c740`** — 🎁 Apply Modifier on the player-detail actions
  opens a picker of the live catalog (Upgrades/Bonuses vs Fines/Penalties, with
  artwork + effect summary); selecting fires `applyToPlayer`. Closes the loop.

Remaining in this workstream (next `continue`): **Slice 3** auto-trigger wiring
(call `pflxModifiers.fireEvent` at the real event sites — task_approved,
checkpoint_completed, incomplete_submission, missed-deadline scans); **Slice 4**
player upgrade store (buy with XC/badges → consume grants); **Slice 5** cross-app
enforcement (sub-apps honor freeze / multiplier / deadline via the broadcast, +
pathway.html consumer).

## What shipped this session (4 workstreams)

**1. Open Space combat (`pathway.html`)** — a full gameplay loop:
- Phase C `3a01761` — EVE autopilot (approach/orbit/keep, keys Q/E/R/C) + radial
  context menu + **real Nova defense model** (`pflxCombat.applyDamage`,
  shields gate hull, armor/shield penetration).
- Phase D `a976075` — **NPC pirates** (`pflxPirates`): Raider/Gunship/Frigate =
  kinetic/laser/missile triangle, approach→orbit→flee AI, blaster kills + loot,
  camera shake + hurt vignette.
- D.1 `cac66b9` — **wanted level 0–5** (deep-space escalation → more/tougher
  spawns) + **loot rarity** (common→epic, scaled XC).
- D.2 `ff35210` — **Fabrication Bay** (`pflxFab`, CARGO → 🛠 FAB): spend salvage
  on Nova-model repairs / smelt → XC.
- D.3 `348b4e8` — **Bounty Board** (`pflxBounties`, CARGO → 📜 BOUNTY): accept
  contracts, track on kills, claim XC + salvage.

**2. Tiered host access (`preview.html`)** — 5 tiers, one gate:
- Phase 1 `9b7eb42` — `pflxHostTier()` + `pflxCan(cap, {cohort|nodeId|projectId})`
  engine (existing admins → Master automatically).
- Phase 2 `0337f57` — assignment UI in Player Manager (tier + scope, rank ceiling).
- Phase 3 `e902c07` — approvals suite enforced by tier + scope (scoped tiers only).
- Phase 4 `614eeda` — Master-only plus features (save point / lockdown / restore).
- Phase 3b `6a9c342` — player lists + cohort cards scoped by managed cohorts.

**3. X-Bot BYO-LLM (`preview.html` + `api/pflx-ai.js`)** — "bring your own AI":
- Slice 1 `7499335` — per-player activation (off/host/player/both per cohort) +
  locked educational safety prompt + connect modal + dormant gate.
- Slice 2 `23e7894` — validated connect (test-ping, key-restore on fail) +
  dormant abilities (Study Buddy / Explain / Quest Hint / Writing Coach).
- Slice 3 `46cb541` — per-cohort ability selection.
- Slice 4 `e543d35` — host visibility of activation (non-secret cloud status).
- Slice 5 `3e0a0d6` (backend) / `3656246` (client) — **encrypted per-cohort host
  key** (AES-256-GCM, decrypted server-side only).

**4. Google Drive/Docs in Mission Control (`preview.html`)**:
- v1 `f56e80c` — `pflxGoogle` link+embed, attach on Tasks/Projects/Checkpoints,
  Doc-submission cards, Picker scaffolded.
- `177a3e7` — player-portal read-only resources on task/project detail.

**5. Mission Control features + bug fixes (`preview.html`, some `pathway.html`)**:
- **Host Progress dashboard** `9283996` — MC → 📊 Progress: per-player checkpoint
  progress (only tasks assigned to each player, per-task states), tier-scoped
  rows (`_pflxPlayerVisible`).
- **Fix: task form node dropdown** `61125d3`/`fcdd26d` — read the LIVE Core
  Pathways node catalog (pathway.html broadcasts `PATHWAYS` → Console caches into
  `pflx_mc_pathway_catalog`), replacing the stale hardcoded list.
- **Fix: task form cohort→players** `61125d3` — robust cohort match (id/name/
  array/case) so selecting a cohort surfaces its players.
- **Fix: Cohort Groups showed 0 players** `b253abe` → `dc01751` — read the
  authoritative `PLAYERS` roster (`_mcRoster()`) in cohort count / Progress /
  task picker, matching the Settings Cohort Manager (the MC mirror `mcPlayers`
  had drifted stale).
- **Fix: badge economy** `40ba21c` → `6263118` — badge rewards resolve against
  the live X-Coin catalog via `_pflxResolveAwardBadge` on EVERY award path (task/
  checkpoint/project/module/node/automation/xtracker/coinsub), so badge XC is
  credited to all totals + `badgeCounts` increments; the **portfolio now shows
  earned badges with their artwork image**; the badge picker refreshes live on
  X-Coin sync. (coinsub zeroes badge xcValue to avoid double-credit.)
- **Fix: badge sync shape mismatch** `9ce8389` — the piece that makes the artwork
  fix work end-to-end. X-Coin's `PflxBridge` answers the `badges` request with the
  **nested** `COIN_CATEGORIES` (`[{ name, coins:[{ name, xc, image }] }]`), but MC's
  `mcBadges` is a **flat** list that `mcGetAllBadges` / `mcFindBadge` / the pickers /
  the portfolio grid / the XC resolver all read. Receipt stored the nested payload
  raw, so every real badge (and its uploaded `image` + `xc`) was stranded inside
  `cat.coins[]` and the catalog surfaced only empty category shells. New
  `mcNormalizeBadges()` flattens the nested shape (carries each coin's `image`+`xc`,
  derives `tier`/`color`/`icon` from its category; already-flat input passes
  through) and is applied at all three assignment sites (cloud receipt, localStorage
  load, generic setter). `_pflxCoinDef` rewritten to read the flat unified catalog.
  Confirmed X-Coin source: artwork field is `image`, reward field is `xc`. 13/13
  Node harness + `node --check`.

## ⚠ ACTION ITEMS FOR ENNIS (blocking full functionality)
1. **Play-test on `prototypeflx.com`** — none of this session's work was
   browser-tested (sandbox limitation); each piece has passing Node harnesses +
   `node --check`, but a human pass is the real verification. Priority:
   combat loop (fly deep, fight, fabricate, bounties), tier scoping (sign in as a
   scoped Co-Host), BYO-LLM (activate X-Bot in a `player`-mode cohort), Google
   attach/preview.
2. **Encrypted cohort keys** need Vercel env on the **pflx-pathway-portal**
   project: `PFLX_KEY_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (optional
   `PFLX_ADMIN_SECRET`). Inert until set — X-Bot keeps using platform keys.
3. **Google Picker** (browse-my-Drive) needs a Google Cloud project → a Client ID
   + API key (+ consent screen). Link+embed already works without it.
4. ~~**Badge artwork field**~~ ✅ **RESOLVED `9ce8389`** — confirmed against the
   X-Coin source: badge artwork is stored under `image` (base64 or URL) on the
   `Coin` type (`app/lib/data.ts`), reward under `xc`. Both were already the
   first-priority fields in the Console mapping, BUT confirming this surfaced the
   real bug (see workstream 5, badge-sync fix below): X-Coin's PflxBridge ships the
   `badges` payload as the **nested** `COIN_CATEGORIES` while MC's `mcBadges` is a
   **flat** schema — the raw nested payload stranded every real badge (and its
   uploaded image) inside `cat.coins[]`, so the catalog surfaced only empty
   category shells. Fixed. Portfolio artwork now renders from live X-Coin badges.

## Verification method used throughout
Every module has a pure/testable core run headlessly via extracted-from-source
Node harnesses (all passing this session), plus `node --check` on the affected
`<script>` block. Full-file gate is too slow on the 55k-line `preview.html`;
`preview.html` is served static (browser is the runtime check).

## Cleanest next threads (all optional)
Combat Phase E (GLTF ships / warp-lane graphics — needs browser iteration) ·
target-weakness scan · Google Picker wiring once creds exist · a cohort Resources
hub · Progress dashboard Project-first / player-first pivots. Otherwise the
platform is at a solid, coherent checkpoint.

## Late-session bug-fix run (all fixed + pushed)
Task-form node dropdown (live Core Pathways nodes) · task-form cohort→players
match · Cohort Groups 0-players (authoritative PLAYERS roster) · badge economy
(XC credit on approval + portfolio artwork across every award path). Details in
the per-feature entries above the master summary.

---

# Session Update — July 6 2026 — Cleanup + persistence audit (arena build 2026-07-06.1)

## Folder + backup cleanup (Ennis-approved)
- Deleted permanently (not in git, confirmed with Ennis): root `PFLX Apps/preview.html` (Apr 23 orphan), `PFLX Overlay/preview.html` (Apr 19 orphan), `pflx-supabase-backup-2026-03-31.json` (superseded — **2026-06-12 backup kept**).
- Deleted (git history keeps them): 4× `preview-savepoint-2026-04-04-*.html` + `preview-checkpoint-2026-04-03.html` (pflx-overlay), `Dashboard copy.png` ×2. Commits 9d07a96 (overlay) / c9e8c83 (platform), pushed.
- Junk: 13× .DS_Store, 184+ git tmp_obj_* removed. `git gc --prune=now`: platform-check .git 514→369MB, overlay 140→125MB (~160MB reclaimed). iCloud mirror re-synced via REFRESH_ICLOUD_BACKUP (rsync --delete propagated all removals).

## Persistence audit — Supabase KV is the cross-device truth
VERIFIED GOOD: baDecks/baGames/baSessions/baLive/baMaps, esports config+media (arena_esports_config/_media), MC data (players/checkpoints/tasks/projects/seasons via the sync map + upserts), mcSeasons reader.
INTENTIONALLY DEVICE-LOCAL (fine): pflx_sess_lvl_* (per-player season level), pflx_bgm_muted, pflx_user (session identity).
FIXED THIS PASS (were localStorage-only → host-created content never reached players' devices):
1. **CUSTOM_MODES** → new KV row `pflx_ba_custom_modes` {modes[]}; saveCustomModes writes cloud+cache; loadCustomModes boots from cache then overrides from cloud + re-renders.
2. **Esports matches** → new KV row `pflx_esports_matches` {matches[]}; saveEsportsState writes cloud+cache; boot loads cloud-first. (Simple whole-row write — single-host editing assumed; RMW upgrade if co-hosting matches becomes real.)

---

# Session Update — July 9 2026 — STARTUP STUDIOS: cross-platform house/faction system, wave 1

Ennis's vision (LOCKED): Studios = fraternity/sorority-style houses for EVERY player, cross-cohort. Auto-placed by diagnostic/vision directive; recruitable by high-evo members scouting quality portfolios; each studio's XC value fluctuates like a stock from its members' seasonal activity; brand + portfolio building is THE core PFLX goal; visible everywhere (Home Base logo-in-color indicator per his reference cards).

## What already existed (audit)
- Canonical PFLX_STUDIOS defs in console (from Studios Guide PDF) + `cadAssignStudio(diagnostic)` matrix (pathways × storyteller/technologist × vision keywords) wired into onboarding → `player.studioId`.
- `studioId` lives on the shared **'users' KV row** — console → X-Coin roster → Arena buildPlayers all read it. That row is the cross-app identity backbone.
- X-Coin: host Studios panel (pools/tax/stakes) + card view; logos `studio-*.png` (now copied into platform + arena public/).
- MC: Studios panel (mcRenderStudios), player bulk-assign, MC_STUDIO_LABELS; player view already has a primary-studio stake/equity panel.

## Wave 1 shipped (console `pflx-platform`, arena build 2026-07-09.1)
1. **Visual canon unified** to Ennis's reference: MindForge SILVER #94a3b8 (was red in console), eMagination #2563eb, GenTech #06b6d4, Innov8 #9333ea. `PFLX_STUDIO_VISUAL` + `pflxStudioMeta(sid)`.
2. **`pflxStudioChipHtml(sid)`** — the logo-in-color chip (white logo tile on the studio's color, name + live market quote with ▲/▼). **Rendered on Home Base player header** next to the streak flame.
3. **Auto-assign backfill `pflxStudioBackfill()`** (boots +2.5s with market): any player without studioId → pathway-vs-corePathways match, balanced by house size, stable hash tiebreak → saved to players + 'users' sync. Diagnostic assignment at onboarding remains primary; backfill guarantees NOBODY floats houseless.
4. **Studio Market `pflxStudioMarket`** (KV `pflx_studio_market` {history[≤160], snap, updatedAt}): every studio starts at index 100; one tick max per 6h (any host boot): price moves on REAL activity — studio's share of all member XC earned since last tick vs even split (drive clamped −5%..+8%) + small deterministic daily wobble. `quote(sid)` {value,prev,delta}, `sparkHtml(sid)` SVG. **Market strip in MC Studios panel** (per-studio card: logo, index, ▲/▼ %, 30-pt sparkline).
5. **Arena**: roster now carries studioId; `ARENA_STUDIOS` + `arenaStudioChip()`; nav avatar shows the member's studio chip. Logos in arena public/.

## Wave 2 blueprint (NEXT SESSION — build in this order)
1. **Recruitment** (KV `pflx_studio_recruit` {invites:[{id,playerId,studioId,byId,byName,at,status,note}]}): DarkCampus is the scouting floor — high-evo members (rank ≥ 5) browsing portfolios get a "🏢 RECRUIT TO <STUDIO>" button on portfolio cards; invitee sees invite card on Home Base (studio chip + recruiter + accept/decline); accept → studioId change (LIMIT: one house-change per season; joining logged to studio history). Roster/portfolio quality signal = badges + totalXC + portfolio item count.
2. **X-Coin market chart**: Next.js studios page reads `pflx_studio_market` → full line chart + member roll; pool value display = xcPool × (index/100).
3. **Studio effects**: members earn small XC bonus when their studio index is #1 for a full week ("house pride dividend"); Battle Arena Live Play team mode option "STUDIO WAR" (squads = studios, not NOVA/ION).
4. **DarkCampus profile headers** show the studio chip; studio-mates surface first in network suggestions ("brothers/sisters of the house").
5. Cyber Agents game already uses the four studios as its agents — link agent pick to the player's ACTUAL studio (default agent = your house).

## Studios wave 2a — RECRUITMENT shipped (July 9, console)
- `pflxStudioRecruit` (KV `pflx_studio_recruit` {invites[≤200]}): MIN_RANK 5 to scout; portfolioScore = badges×50 + totalXC/20 + level×30.
- Home Base, senior members: "🏢 SCOUTING — GROW <HOUSE>" panel — top-4 prospects from OTHER/no houses (name, badges, XC, portfolio score) + RECRUIT button (`pflxRecruitSend`) → pending invite (deduped per studio+player).
- Home Base, invitee: house-colored "You've been scouted!" card (studio chip + recruiter) with JOIN HOUSE / DECLINE (`pflxRecruitRespond`). Accept → studioId change + mcSaveData('players') → flows to 'users' row → X-Coin/Arena. **One house-change per active MC season** (p.studioChangeSeason), 30-day cooldown fallback when no season.
- Remaining wave 2: X-Coin market chart page, house pride dividend, STUDIO WAR Live Play mode, DarkCampus profile chips + house-first suggestions, Cyber Agents default agent = player's house.

## Studios wave 2b — 🏢 STUDIO WAR shipped (arena build 2026-07-09.2)
- Live Play team select is now: Solo / 🔵🔴 NOVA vs ION / 🏢 STUDIO WAR. ev.teams = false | 'duo' | 'studios' (legacy true handled as duo).
- STUDIO WAR joins: player's squad = their REAL house (state.player.studioId from the roster); unaffiliated players get drafted into the smallest studio squad for that event.
- Event leaderboard in studios mode: up to 4 house columns (logo, color, member scores, house total) + "🏢 <HOUSE> LEADS THE WAR" headline; card meta shows YOUR HOUSE.
- Remaining wave 2: X-Coin market chart page, house pride dividend, DarkCampus chips + house-first suggestions, Cyber Agents default agent = house.

## Studios wave 2c — STAKE ECONOMY + house pride dividend + Cyber Agents = your house (July 9)
Ennis: "a certain amount gained goes into the Startup Studio investment funding as a stake from each player; that stake raises as the player's evo rank grows."
- **Stake ladder** (`pflxStudioMarket.stakeRate`): rank 1-2→5%, 3-4→7%, 5-6→10%, 7-8→12%, 9+→15% of XC GAINED each tick period.
- **collectStakes()** (runs inside every market tick): per-player totalXcoin snapshot (`row.psnap`) → gained since last tick → stake deducted from spendable `xcoin`, credited to `row.funds[studioId]` AND to the player's `studioStakeXC`; `studioStakePercent` = their share of the house fund (feeds the existing player-view equity panel). Saved via mcSaveData('players') → 'users' row.
- **Price formula (the answer to "how does the value fluctuate")**: newIndex = lastIndex × (1 + activity + capital + wobble), where activity = clamp((studio's share of ALL member XC earned since last tick − 25%) × 0.6, −5%, +8%); capital = clamp(freshStakes / fund × 0.5, 0, +5%); wobble = deterministic ±1.2% daily texture. One tick max per 6h. Outperform the other houses → price climbs; go quiet → it decays.
- **House Pride Dividend**: each new ISO week, top-priced studio's members each get +25 XC (row.lastDividend/{Week}); MC market strip shows 👑 WEEKLY CHAMPION + 💰 fund size.
- **Cyber Agents**: cartridge deck payload now carries player.studioId (contract-additive, arena 2026-07-09.3); the game pre-selects YOUR house's agent (MindForge/Innov8/GenTech/eMagination) — recruits fight for home.
- NOTE for X-Coin alignment: X-Coin's flat corporateTaxRate 10% should later defer to this rank ladder (avoid double collection); its xcPool can display base pool + row.funds.

## Studios wave 2d — X-COIN MARKET PAGE (July 9)
- `pflx-xcoin-check/app/admin/studios/page.tsx`: reads `pflx_studio_market` KV via supabase client; new 4-card MARKET INDEX strip above the studio cards — per-house index, ▲/▼ delta, 30-pt SVG sparkline, 💰 fund (stake capital), 👑 weekly champion. esbuild-transpile clean (Vercel is final typecheck).
- Remaining Studios work: DarkCampus profile chips + house-first suggestions; X-Coin flat 10% corporateTaxRate → defer to the rank stake ladder (double-collection guard).

## Studios wave 2e — BOTTOM TICKER carries the Studios economy live (July 9)
- New generic `window.pflxTickerRaw(icon, color, text)` on the unified ticker engine — any PFLX system can push a line the moment something happens (joins _liveEvents, capped 40, sfx + immediate re-render).
- **Rotation items** (buildMCTickerEvents): every house's live quote "🏢 INNOV8 112.4 ▲3.1% · fund 1,240 XC" in its color + "👑 House Pride: <house> won the week".
- **Instant pushes**: market re-price → "📈/📉 STUDIO MARKET: <house> +x.x% → index" (biggest mover); dividend payout → "👑 HOUSE PRIDE DIVIDEND…"; recruit sent → "🏢 <HOUSE> is scouting new talent…"; recruit accepted → "🎉 @player joined <House>!".
