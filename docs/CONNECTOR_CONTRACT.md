# PFLX Connector Contract — v0.4 (DRAFT)

**Status:** Draft for review · **Scope:** the node ↔ module interface · **Owner:** PFLX

> **v0.4 change:** The last two open questions are settled. Modules **are
> playable offline** — the Save Slot buffers locally and syncs on reconnect,
> and an offline completion queues its Completion Record (§10). The Module
> package extension is confirmed as **`.pflx`** (§15).
>
> **v0.3 change:** Three open questions settled. Modules are **uploaded
> per-node** — no shared library (new §15). Co-op Sessions are capped at
> **4 players** (§11). And the `moduleId` is **auto-derived from the manifest**
> (§14 #1).
>
> **v0.2 change:** Module completion is **approval-gated**. Finishing a Module
> no longer pays out directly — it produces a *Completion Record* sent to the
> host **Approvals Queue** (the same panel as every other approval). The reward
> is paid only when a host approves. See §9.

This document specifies *the Connector*: the fixed, versioned contract between a
**Node** and the **Module** loaded into it. It is the single most important
spec in the cartridge system — like the pin layout of a game-console slot, once
it is frozen, every future Module plugs into every Node without custom wiring.

This draft covers the Connector only. The Module manifest format and the co-op
presence layer are separate specs that build on this one.

---

## 1. Why this exists

A Node is a drive. A Module is the cartridge. Today a course is hard-wired into
the pathway; we want the opposite — a Node should be able to load *any* Module,
read its progress, and pay out rewards, without knowing anything about the
Module's internal content.

The Connector makes that possible by drawing one hard line:

- The **Node** owns everything trusted: identity, the XC wallet, badges, saving,
  co-op session membership, and reward payout.
- The **Module** owns only its content. It never touches XC or identity
  directly — it *reports* and *requests*, and the Node decides.

A Module author builds their course and emits a handful of messages. They never
write wallet, badge, or auth code. That is the "fits any slot" guarantee.

---

## 2. Glossary

| Term | Meaning |
|------|---------|
| **Platform** | PFLX itself — the OS. Owns account, identity, XC wallet, badges, toolbar chat. |
| **Console** | An app on the Platform (Core Pathways, X-Coin, Arena…). |
| **Pathway** | A world/map of Nodes inside a Console (e.g. Digital Artist). |
| **Node** | A drive. One slot on a Pathway that loads exactly one Module, reads its progress, and pays rewards. |
| **Module** | The swappable content unit — a Course, Project, Quest, Challenge, or Program. The "cartridge." |
| **Connector** | The versioned message protocol in this document — the node↔module slot. |
| **Co-op Session** | A live shared instance of a Module that 2+ players occupy together. |
| **Save Slot** | Per-player persisted Module state, owned and stored by the Node. |
| **Completion Record** | The signed "credentials" a Node builds when a Module completes — proof of completion plus the final submission and the claimed (clamped) reward. Reviewed by a host before any payout. |
| **Approvals Queue** | The Platform's single, shared host approval panel. Module completions, node submissions, and reward requests all land here together. |

---

## 3. The layer model

```
Platform  (account · identity · XC · badges · chat)
   └─ Console        (Core Pathways)
        └─ Pathway   (Digital Artist — ships, presence)
             └─ Node          (the drive — one Module slot)
                  └─ Module   (the cartridge — Course/Project/Quest…)
                       └─ Co-op Session (live shared instance)
```

Each layer only talks to the layer directly below it. A Module never reaches
past its Node; a Node never reaches past its Console. The Connector is the
contract for exactly one of those seams: **Node ↔ Module**.

---

## 4. Transport & framing

- The Module runs inside an `<iframe>` rendered by the Node.
  - `viewer.html` is loaded for players.
  - `host.html` is loaded when the viewer is a host (HOST VIEW).
- All communication is `window.postMessage`, JSON-encoded.
- The **Node is the host** (parent window); the **Module is the guest** (child).
- Every message is an object with at minimum:

```json
{ "v": 1, "type": "pflx_mod_<name>", "payload": { } }
```

- `v` — Connector protocol version (integer). See §5.
- `type` — always prefixed `pflx_mod_` to namespace it off other PFLX traffic.
- The Node validates `event.origin` against the Module's expected host before
  trusting any message. The Module accepts messages only from `window.parent`.

---

## 5. Protocol versioning

- The Connector version is a single integer (`v`), starting at **1**.
- A Module declares the version it speaks in its `pflx_mod_ready` message.
- A Node declares the range it supports.
- Mismatch handling:
  - Module newer than Node supports → Node shows "This module needs a newer
    version of Core Pathways" and does not load content.
  - Module older than Node's minimum → Node runs a compatibility shim if one
    exists, otherwise shows the same notice.
- New message types may be **added** within a version. Removing or changing the
  shape of an existing message requires a version bump.

---

## 6. Lifecycle

```
1. Node creates the iframe and loads viewer.html (or host.html).
2. Module boots → sends  pflx_mod_ready  (its manifest summary).
3. Node checks version, then sends  pflx_mod_init  (host context).
4. Module renders content and begins emitting progress/stats.
5. (loop) Module emits progress, stats, checkpoints, saves.
   (loop) Node may send commands (pause / resume / reset / force_complete).
6. Module emits  pflx_mod_complete  (carrying the final submission) → Node
   builds a Completion Record and posts it to the host Approvals Queue.
   The node's status becomes "pending approval"; no reward is paid yet.
7. A host reviews it in the Approvals panel:
     approved → Node pays the clamped reward, marks the node completed,
                sends  pflx_mod_approval_result { approved: true }.
     rejected → Node returns the node to in-progress with the host's note,
                sends  pflx_mod_approval_result { approved: false, note }.
8. On close, Node sends  pflx_mod_teardown ; Module flushes a final save.
```

A Module must not assume it received `pflx_mod_init` — if 5 seconds pass after
`pflx_mod_ready` with no `init`, it should show a "waiting for host" state.

---

## 7. Messages — Node → Module

### `pflx_mod_init`
Sent once, in response to `pflx_mod_ready`. The Module's entire world.

```json
{
  "v": 1, "type": "pflx_mod_init",
  "payload": {
    "player":  { "id": "...", "brand": "...", "avatar": "...", "isHost": false },
    "xc":      { "balance": 1000000 },
    "badges":  [ { "id": "...", "name": "..." } ],
    "save":    { },                     // opaque — last state this Module saved
    "context": { "pathwaySlug": "digital-artist", "nodeId": "...",
                 "cohort": "...", "entryMode": "solo" },
    "coop":    { "sessionId": null, "role": null, "peers": [] }
  }
}
```

- `player` carries **brand + avatar only** — never a real name. (Privacy rule.)
- `save` is whatever the Module last handed to `pflx_mod_save`, or `{}` on first run.
- `entryMode` is one of `solo` / `coop` / `coop_required`.

### `pflx_mod_command`
Host controls, issued from the Node's host dashboard.

```json
{ "v": 1, "type": "pflx_mod_command",
  "payload": { "command": "pause" } }   // pause | resume | reset | force_complete
```

### `pflx_mod_peer_join` / `pflx_mod_peer_leave`
Co-op presence inside the Session.

```json
{ "v": 1, "type": "pflx_mod_peer_join",
  "payload": { "peer": { "id": "...", "brand": "...", "avatar": "..." } } }
```

### `pflx_mod_peer_event`
A relayed action from another player in the Co-op Session (see §11).

```json
{ "v": 1, "type": "pflx_mod_peer_event",
  "payload": { "from": "<peerId>", "event": { } } }   // event shape is the Module's own
```

### `pflx_mod_save_ack`
Confirms a save was persisted to the Save Slot.

```json
{ "v": 1, "type": "pflx_mod_save_ack", "payload": { "ok": true } }
```

### `pflx_mod_approval_result`
Sent after a host acts on the Completion Record in the Approvals panel. Lets the
Module show an "Approved ✓" state or a "Needs revision" state with feedback.

```json
{ "v": 1, "type": "pflx_mod_approval_result",
  "payload": { "approved": true, "xcAwarded": 50, "badges": [ "..." ], "note": "" } }
```

On `approved: false` the `note` carries the host's revision feedback and the
node returns to in-progress so the player can resubmit.

### `pflx_mod_teardown`
The Node is closing the Module. The Module should flush a final `pflx_mod_save`.

---

## 8. Messages — Module → Node

### `pflx_mod_ready`
First message the Module sends. Declares who it is and what it can do.

```json
{
  "v": 1, "type": "pflx_mod_ready",
  "payload": {
    "moduleId": "graphic-design-concepts",
    "name": "Graphic Design Concepts",
    "version": "1.2.0",
    "protocolVersion": 1,
    "capabilities": {
      "progress": true, "stats": true, "checkpoints": true,
      "coop": false, "submission": true, "hostDashboard": true
    }
  }
}
```

`capabilities.coop` is the flag the Node editor reads to decide whether the
"Co-op" entry mode can be enabled for this Node.

### `pflx_mod_progress`
Drives the Node's progress bar.

```json
{ "v": 1, "type": "pflx_mod_progress", "payload": { "percent": 42 } }
```

### `pflx_mod_stat`
Arbitrary labelled values. The Node renders them as stat chips on the node.

```json
{ "v": 1, "type": "pflx_mod_stat",
  "payload": { "stats": [ { "key": "milestones", "label": "Milestones",
                            "value": 3, "max": 5 } ] } }
```

### `pflx_mod_checkpoint`
A milestone reached mid-Module. May carry a partial XC value (capped — see §9).

```json
{ "v": 1, "type": "pflx_mod_checkpoint",
  "payload": { "checkpointId": "cp-2", "label": "Draft submitted", "xc": 25 } }
```

### `pflx_mod_save`
Hands the Node an opaque state blob to persist to the Save Slot.

```json
{ "v": 1, "type": "pflx_mod_save", "payload": { "state": { } } }
```

### `pflx_mod_award_request`
Asks the Node to grant XC and/or a badge. **The Node is the authority** — see §9.

```json
{ "v": 1, "type": "pflx_mod_award_request",
  "payload": { "xc": 50, "badgeId": "...", "reason": "course completed" } }
```

### `pflx_mod_submission`
A player work submission. The Node routes it to X-Coin Approvals.

```json
{ "v": 1, "type": "pflx_mod_submission",
  "payload": { "fields": { "link": "...", "screenshot": "...", "description": "..." } } }
```

### `pflx_mod_complete`
The Module is finished. It carries the **final submission**. This does **not**
pay out — the Node turns it into a Completion Record and sends it for host
approval (see §9).

```json
{ "v": 1, "type": "pflx_mod_complete",
  "payload": {
    "score": 92,
    "finalState": { },
    "submission": { "link": "...", "screenshot": "...", "description": "..." }
  } }
```

### `pflx_mod_coop_broadcast`
Asks the Node to relay an action to every peer in the Co-op Session (see §11).

```json
{ "v": 1, "type": "pflx_mod_coop_broadcast", "payload": { "event": { } } }
```

### `pflx_mod_request_dm`
Asks the Platform (via the Node) to open a 1:1 DM with a peer in the toolbar chat.

```json
{ "v": 1, "type": "pflx_mod_request_dm", "payload": { "peerId": "..." } }
```

---

## 9. Reward & completion — the trust model

A Module **cannot mint XC or badges, and it cannot grant its own completion.**
It reports; the Node packages; a host approves; only then is anything paid.

### The ceiling

The Node holds the reward limits the host set in the node editor (**XC Reward**,
**Signature / Tagged Badges**). Every XC figure a Module sends — in
`pflx_mod_checkpoint` or in the completion payload — is **clamped** to that
ceiling. The total awarded for a node can never exceed its configured XC Reward,
and only the node's configured badge IDs can ever be granted.

### Completion is approval-gated

When a Module sends `pflx_mod_complete`:

1. The Node builds a **Completion Record** — the "credentials": player, module
   id + version, timestamp, score, a progress snapshot, the final `submission`
   fields, and the *claimed* reward (already clamped — a proposal, not a payout).
2. The Node posts that record to the Platform's **Approvals Queue** — the same
   panel that already holds node submissions and reward requests. Module
   completions get no separate inbox; hosts review everything in one place.
3. The node's status becomes **pending approval**. No XC, no badge yet.
4. A host acts in the Approvals panel:
   - **Approve** → the Node pays the clamped XC, grants the configured badges,
     marks the node `completed`, writes the result to the Platform (propagating
     to X-Coin and every dashboard), and sends the Module
     `pflx_mod_approval_result { approved: true, … }`.
   - **Reject** → the node returns to `in-progress` with the host's note
     attached, and the Module receives
     `pflx_mod_approval_result { approved: false, note }` so the player can
     revise and resubmit.

### Checkpoints and idempotency

Checkpoint XC follows the same gate: checkpoint values are recorded against the
node but held in **escrow**, released only when the completion is approved. This
closes the farm-and-quit hole.

A Module that reaches `complete` again after approval pays nothing the second
time. A Module that completes again while a record is still pending **replaces**
the pending record rather than queuing a duplicate.

Net effect: a buggy or malicious Module can, at worst, *propose* an early
completion. It can never pay itself, never over-pay, and never bypass the host.
The node-editor settings are the cap; host approval is the gate.

---

## 10. The Save Slot

- The **Node owns persistence.** The Module never writes storage directly.
- The Module hands an opaque `state` object to `pflx_mod_save`; the Node writes
  it to Supabase under a key scoped to module + player
  (proposed: `module_save_<moduleId>_<playerId>`).
- On the next load, the Node feeds it back via `pflx_mod_init.save`.
- This keeps all Modules' storage consistent, quota-managed in one place, and
  syncable across devices for free.
- Co-op shared state is a separate, session-scoped record (see §11).

### Offline play (resolved v0.4)

A Module **is playable with no network.** The Module itself does nothing
special — it just keeps emitting `pflx_mod_save` as normal. Offline handling is
entirely the Node's job, so the Connector contract is unchanged:

- **Solo offline.** When the network is down, the Node writes the Save Slot to a
  local buffer (browser storage) instead of Supabase, and still returns
  `pflx_mod_save_ack { ok: true }` so the Module's UX is identical online or
  off. On reconnect, the Node flushes the buffered state to Supabase. Conflicts
  resolve **last-write-wins on `updatedAt`** — the same rule used everywhere
  else in PFLX — so a newer save on another device is never clobbered by a
  stale offline buffer.
- **Offline completion.** If `pflx_mod_complete` fires while offline, the Node
  builds the Completion Record locally and **queues** it. It is posted to the
  Approvals Queue on reconnect; the node shows "pending sync" until then. No
  reward is ever paid offline — payout still requires host approval (§9).
- **Co-op requires a connection.** The peer relay (§11) is live-only. A Co-op
  Session cannot start or continue offline; if a co-op player drops the
  network, the Node treats it as a `pflx_mod_peer_leave`.
- The manifest's `saveVersion` (Module manifest spec) lets the Node know when a
  buffered offline save is too old to safely apply after a Module update.

---

## 11. Co-op over the Connector

The Connector does **not** implement multiplayer logic — it provides the pipe.

- The **Node** owns the Co-op Session: creating it, tracking membership,
  presence. (Detailed in the separate co-op spec.)
- A Co-op Session is capped at **4 players**. The Node enforces this — a 5th
  player attempting to join an already-full Session is refused before any
  `pflx_mod_peer_join` is sent, so the Module never sees an over-cap room.
- A Module declares `capabilities.coop`. If false, the Node never offers a
  co-op entry mode for that node.
- Inside a Session, the relay is symmetric:
  - Module → Node: `pflx_mod_coop_broadcast { event }`
  - Node → every other peer's Module: `pflx_mod_peer_event { from, event }`
- The **shape of `event` is the Module's own business** — the Connector treats
  it as opaque. Conflict resolution, turn order, shared-cursor semantics: all
  defined by the Module.
- Durable shared state (the "Google-Docs" document) is saved like a Save Slot
  but keyed to the Session, not a single player.

This keeps co-op modular: simple Modules ignore it entirely; rich Modules opt in.

---

## 12. Host view

- When the viewer is a host, the Node loads `host.html` instead of `viewer.html`.
- `pflx_mod_init.player.isHost` is `true`.
- The host build may surface analytics, force-complete, and per-player progress.
- `pflx_mod_command` (pause/reset/force_complete) is only sent from a host build.

---

## 13. Error handling & compatibility

- No `pflx_mod_ready` within 8s of iframe load → Node shows "Module failed to
  start" with a retry.
- Unknown `type` → receiver ignores it silently (forward-compatibility).
- Malformed JSON or missing `v` → dropped, logged.
- Version mismatch → see §5.
- The Module must tolerate never receiving co-op messages (solo is the default).

---

## 14. Open questions — for review

1. ~~Module ID source of truth.~~ **Resolved in v0.3** — because Modules are
   uploaded per-node (see #5), the node owns its own copy of the Module and its
   manifest. The `moduleId` is **auto-derived from the manifest**; nothing needs
   to mint IDs centrally. A node "remembers" its Module by storing the manifest
   alongside the node's editor settings.
2. ~~Partial-XC policy.~~ **Resolved in v0.2** — checkpoint XC is escrowed and
   released only when a host approves the Completion Record.
3. ~~Offline play.~~ **Resolved in v0.4** — Modules are playable offline; the
   Node buffers the Save Slot locally and syncs on reconnect, and an offline
   completion queues its Completion Record. See §10.
4. ~~Co-op Session size.~~ **Resolved in v0.3** — hard cap of **4 players** per
   Co-op Session. See §11.
5. ~~Module distribution.~~ **Resolved in v0.3** — Modules are **uploaded
   per-node**. There is no shared Mission Control library; each Node carries its
   own Module. See §15.
6. ~~File extension.~~ **Resolved in v0.4** — the Module package extension is
   **`.pflx`**. See §15.

All open questions are now resolved. The Connector contract is ready to be
frozen as **v1.0** once reviewed; the Module manifest spec is the next document.

---

## 15. Module distribution — per-node upload

Decided in v0.3: **a Module is uploaded directly to the Node that runs it.**
There is no shared, central Module library that nodes browse and pick from.

What this means in practice:

- In the node editor, the host **uploads a Module package** — a single file
  with the **`.pflx`** extension (manifest + content). It is stored with the
  node's settings and synced to Supabase like every other node field.
- The Node is **self-contained**: its Module travels with it. Two nodes running
  "the same" course each hold their own independent copy.
- The `moduleId` is read straight from the uploaded manifest — see §14 #1.
- **Updating** a Module = re-uploading the package to that node. The Node should
  preserve players' Save Slots across an update as long as the `moduleId` is
  unchanged (the manifest spec will define a `saveVersion` for breaking changes).
- Trade-off accepted: no library means duplication across nodes, but it keeps
  the model simple — a node is a drive with a cartridge physically in it, with
  no registry, no shared-state coupling, and no "which version is live" problem.

A shared library can be layered on later without breaking this contract: it
would just be a *source* hosts upload **from**. The Connector itself never needs
to know where the package came from.

---

*End of draft v0.3. The approval-gated completion flow, the save model, and the
co-op relay are the pieces worth pressure-testing before this is frozen.*
