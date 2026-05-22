# PFLX Module Structure — v0.2 (DRAFT)

**Status:** Draft for review · **Scope:** what is inside a `.pflx` cartridge · **Owner:** PFLX

This document specifies the **internal structure of a Module** — the cartridge
that plugs into a Node. It builds on the **Connector Contract**
(`CONNECTOR_CONTRACT.md`), which defines only the node↔module seam.

> **v0.2 change:** The Module structure is now anchored to the **FLX
> framework** — the Future Learning Protocol you already use in the FLX
> Curriculum Planner. *All* Module types run the four FLX strands
> (Engagement → Development → Enhancement → Fulfillment). The placeholder
> E.P.I.C. and 4-D cycles are dropped. Phases tag **FLX learning objectives**
> per phase, which auto-crosswalk to ISTE, CASEL, 21st-Century Skills, UDL,
> Arts Standards, and MYP Design.

---

## 1. What a Module is

A Module is the swappable content unit loaded into a Node — the cartridge. Per
the Connector, a Node owns identity, the XC wallet, badges, saving, and reward
payout; a Module owns **only its content and its learning arc**.

Every Module runs the **FLX framework**: a four-strand learning arc that ends in
a real submission. The Module reports progress and checkpoints as the player
moves through the strands; the final submission becomes a Completion Record
that a host approves before any reward pays out (Connector §9).

There are exactly **three Module types** — they differ in *purpose and
weighting*, not in framework:

| Type | Purpose | Ends in |
|------|---------|---------|
| **Course** | Learn a skill or topic. Instruction-weighted. | Portfolio submission |
| **Project** | Build a real deliverable. Production-weighted. | Delivered artifact + submission |
| **Quest** | A campaign chaining other Modules + challenges. | Culminating submission / badge |

Course and Project both traverse the same four FLX strands — see §6 for how
they differ. A Quest does not run the framework itself; it chains Modules that
do (§7).

---

## 2. Shared vocabulary

| Term | Meaning |
|------|---------|
| **FLX framework** | The Future Learning Protocol — the four-strand arc that every Module runs. See §3. |
| **Strand** | One of the four FLX phases: Engagement, Development, Enhancement, Fulfillment. |
| **Sub-domain** | A coded competency area inside a strand (CN, ID, CR, RE, PR). |
| **Objective** | A single FLX learning objective, e.g. `FLX.ID.2`. The unit of standards alignment. |
| **Phase** | A strand as it appears inside a Module — holds the content for that strand. |
| **Stage** | One unit of a Quest. Each stage is itself a Course, Project, or Challenge. |
| **Challenge** | A standalone task + submission with no full framework arc. Used as a Quest stage. |
| **Gate** | A condition that must be met to leave a phase. |
| **UbD** | Understanding by Design — the three-stage backward-design structure each phase is authored in. |
| **Crosswalk** | The mapping from an FLX objective to external standards (ISTE, CASEL, etc.). |

---

## 3. The FLX framework — the spine

Every Module is the FLX framework expressed as content. The framework has four
**strands**, each with one or more coded **sub-domains** holding three
**objectives** apiece.

### Engagement — sub-domain *Connection (CN)*

The learner immerses in the topic and builds an empathetic understanding of the
user or situation, identifies key issues and questions, gathers information, and
forms preliminary insights.

- `FLX.CN.1` — Use empathetic understanding to inform and shape solution development.
- `FLX.CN.2` — Generate and communicate precise questions to define the problem.
- `FLX.CN.3` — Research relevant information across cultural, societal, and environmental contexts.

### Development — sub-domains *Ideation (ID)* and *Creation (CR)*

The learner defines the problem concretely and explores solutions — brainstorm,
research, and build initial prototypes or models. Development is the one strand
with **two sub-domains**, so a Development phase has two segments.

*Ideation (ID):*
- `FLX.ID.1` — Engage in divergent thinking; brainstorm a broad range of solutions.
- `FLX.ID.2` — Collaborate with partners and stakeholders to clarify and ideate.
- `FLX.ID.3` — Develop and organize a clear, detailed plan of execution.

*Creation (CR):*
- `FLX.CR.1` — Construct physical or digital representations of multiple solutions.
- `FLX.CR.2` — Develop and leverage skills in various prototyping methods and tools.
- `FLX.CR.3` — Iterate and improve on prototypes based on feedback and self-reflection.

### Enhancement — sub-domain *Reflection (RE)*

The learner refines ideas and prototypes from feedback and self-reflection,
runs comprehensive testing, and seeks feedback from peers, mentors, or users.

- `FLX.RE.1` — Conduct comprehensive testing; gather feedback and self-evaluation.
- `FLX.RE.2` — Refine and improve the solution based on feedback and testing.
- `FLX.RE.3` — Showcase a reflective understanding of the learning process.

### Fulfillment — sub-domain *Production (PR)*

The learner finalizes and implements the solution in a real-world context,
shares outcomes and process, and considers financial and marketing aspects.

- `FLX.PR.1` — Complete the final solution for real-world implementation on a timeline.
- `FLX.PR.2` — Develop and execute a presentation method showing concept-to-product.
- `FLX.PR.3` — Determine and manage financial implications and marketing strategy.

### Framework variants

The same framework exists in co-branded variants — the Curriculum Planner
carries an `FLX.*` set and a `DIX.*` (ACS Cobham / Tomorrow Teacher) set with
identical structure. A Module declares which objective set it uses; PFLX treats
the code prefix as the variant key.

### UbD — how a phase is authored

Each phase is authored with **Understanding by Design** (backward design), the
same three stages the Curriculum Planner uses:

1. **Stage 1 — Desired Results.** Understandings, Essential Questions, "Students
   will know…", "Students will be able to…", and the FLX objectives targeted.
2. **Stage 2 — Assessment Evidence.** Performance Tasks and Other Evidence — the
   gate of the phase is drawn from here.
3. **Stage 3 — Learning Plan.** The Learning Activities the player actually does.

So a phase's manifest entry mirrors UbD: `desiredResults`, `assessmentEvidence`,
`learningPlan` (§12).

### The crosswalk lives in PFLX, not the cartridge

Each FLX objective crosswalks to **21st-Century Skills, ISTE Standards,
National Coalition of Arts Standards, Universal Design (UDL) Principles, the
CASEL Framework, and MYP Design** (plus the ACS Cobham Student Profile in the
DIX variant). That crosswalk table is **PFLX reference data**, not part of any
`.pflx`. A Module stores only FLX objective *codes*; PFLX expands them. This
keeps cartridges lean and lets the crosswalk be updated without re-uploading a
single Module.

---

## 4. The three Module types

All three run the FLX framework; the type sets the *intent* and the *shape of
the Fulfillment deliverable*.

- **Course** — the framework applied to *learn*. Engagement leans on a
  diagnostic; Development is tutorial- and practice-heavy; Enhancement is
  guided feedback on that practice; Fulfillment is a portfolio piece.
- **Project** — the framework applied to *build and ship*. Development is
  Creation-heavy (real prototyping); Enhancement is real user testing;
  Fulfillment is real-world implementation, presentation, and the financial /
  marketing objectives (`FLX.PR.3`).
- **Quest** — the framework applied across a *campaign*. It chains Courses,
  Projects, and Challenges; each child runs its own framework arc (§7).

---

## 5. The phase model

A Course or Project is exactly **four phases — the four FLX strands, in order**.
The learner moves Engagement → Development → Enhancement → Fulfillment; each
phase has a gate before the next opens.

Every phase carries:

- `kind` — the strand (`engagement` / `development` / `enhancement` / `fulfillment`).
- `flxObjectives` — the objective codes this phase targets (**per-phase tagging**).
- `desiredResults`, `assessmentEvidence`, `learningPlan` — its UbD content.
- `content` — the content blocks the player works through.
- `gate` — the condition to advance.

Recommended gates per strand:

| Phase | Gate type | Meaning |
|-------|-----------|---------|
| Engagement | `activity` | Diagnostic done + discovery/research artifacts logged. A diagnostic places the learner, it never fails them. |
| Development | `activity` *or* mid-module `submission` | Ideation plan + initial prototype logged. A mid-module submission may collect host feedback but never blocks the learner (Connector §6). |
| Enhancement | `activity` | A testing + feedback round completed. |
| Fulfillment | `submission` | The final deliverable is submitted → `pflx_mod_complete` → Completion Record → Approvals Queue. |

The Development phase spans two sub-domains, so it holds two **segments**
(Ideation, then Creation), each with its own objectives and content, under one
phase and one gate.

**Where gates are evaluated.** Quizzes and checks for understanding live
*inside the Module's own content* — there is no Node-readable quiz format
(resolved, §13 #3). So for the Engagement, Development, and Enhancement phases
the Module evaluates its own gate internally and simply emits a
`pflx_mod_checkpoint` when the phase is satisfied; the Node advances on that
signal and does not inspect scores. The **Fulfillment `submission` gate is the
one exception** — it routes through the Node to the Approvals Queue, so it is a
real Node-level contract. In the manifest, a non-final phase's `gate` is a
*hint* describing how the Module gates itself; only the Fulfillment `submission`
gate is enforced by the Node.

---

## 6. Course vs Project — same framework, different weight

Both run all four strands. The difference is emphasis and the Fulfillment bar:

| | Course | Project |
|--|--------|---------|
| Engagement | Gamified diagnostic + light research | Full empathy research, problem brief |
| Development | Tutorials, guided practice, scaffolded builds | Real ideation + substantial prototyping (Creation-heavy) |
| Enhancement | Guided self-check and feedback on practice | Real user testing and iteration |
| Fulfillment | A portfolio piece demonstrating the skill | Real-world implementation, presentation, finance/marketing |
| Typical objectives | Subset, instruction-focused | Full `CN`→`PR` sweep |

A Course can legitimately target only some objectives in a strand; a Project is
expected to sweep the framework end to end.

---

## 7. Quest — chained campaigns

A Quest has **no framework content of its own.** It chains other Modules into a
campaign. A Quest is a list of **stages**; each stage is one of:

| Stage type | Points to |
|------------|-----------|
| `course` | A full Course Module |
| `project` | A full Project Module |
| `challenge` | An inline standalone Challenge — a single task + submission, no full four-strand arc |

Stages can be **sequential** (stage 2 unlocks when stage 1 is approved) or
**grouped** (a set, any/all required), so a Quest mixes courses and projects
freely. A child Course/Project launches in the same Node, runs its full FLX
arc, and waits for its Completion Record approval before the next stage opens.
A Quest completes when its required stages are approved, then emits its own
culminating `pflx_mod_complete` — eligible for a larger reward and a signature
badge. A Quest aggregates the FLX objectives of all its stages for reporting.

---

## 8. How phases map to the Connector

A Module never invents messages — every phase action is an existing
`pflx_mod_*` message:

| Inside a Module… | …emits over the Connector |
|------------------|---------------------------|
| Learner advances within a phase | `pflx_mod_progress { percent }` |
| A phase / segment completed | `pflx_mod_checkpoint { checkpointId, label }` |
| A score, diagnostic result, count | `pflx_mod_stat { stats[] }` |
| Phase content state changes | `pflx_mod_save { state }` |
| A **mid-module** submission (e.g. Development plan) | `pflx_mod_submission` — recorded; learner not blocked |
| The **Fulfillment** submission | `pflx_mod_submission` then `pflx_mod_complete { submission }` |

Only the Fulfillment submission produces a Completion Record and gates the
reward. Checkpoint XC stays escrowed until that final approval (Connector §9).

---

## 9. Standards alignment

Because objectives are tagged **per phase** (§5), every Module automatically
yields a standards report with no extra authoring:

- A phase declares `flxObjectives: ["FLX.ID.1", "FLX.CR.2"]`.
- PFLX expands each code through the crosswalk (§3) into its ISTE, CASEL,
  21st-Century, UDL, Arts, and MYP Design equivalents.
- A Module's coverage = the union of its phases' objectives; a Quest's = the
  union of its stages'.
- Hosts see "this Course covers `CN.1–3`, `ID.1`" and the crosswalked
  standards, mapped to exactly the phase where each is taught and assessed.

The manifest stores codes only. The crosswalk is PFLX reference data.

---

## 10. Mission Control linkage

Any Module — and optionally any phase or stage — can be **linked to a Mission
Control item**: an MC Project, Task, or Checkpoint, via the same `mcTag`
mechanism already in the node detail panel.

Recommended default mapping:

| Module structure | Mission Control item |
|------------------|----------------------|
| A **Quest** | an MC **Project** |
| A **Course** / **Project** | an MC **Project** or major **Task** |
| A **phase** | an MC **Task** or **Checkpoint** |

The link is an `mcLink` object (`{ type, id }`) on the Module and, optionally,
each phase. When a linked phase reaches its gate or a linked Module is approved,
the Node reports it so MC reflects the task/checkpoint as progressed. MC owns
the *assignment*; the Module owns the *work*.

---

## 11. Anatomy of a `.pflx` package

A Module ships as a single `.pflx` file — a zipped bundle:

```
my-course.pflx
├── manifest.json        ← identity + FLX structure + objectives (see §12)
├── viewer.html          ← entry point loaded for players
├── host.html            ← entry point loaded for hosts (optional)
├── content/             ← per-phase content (HTML, JSON, markdown…)
└── assets/              ← images, video, audio, fonts
```

`viewer.html` / `host.html` are the two entry points the Connector names. The
Module may be a single-page app reading `manifest.json`, or load per-phase
files from `content/` — the Connector is indifferent, as long as the entry
points speak the protocol.

---

## 12. The manifest schema

`manifest.json` is the heart of the cartridge. Draft schema (a Course):

```json
{
  "schemaVersion": 2,
  "moduleId": "graphic-design-concepts",
  "moduleType": "course",
  "name": "Graphic Design Concepts",
  "version": "1.2.0",
  "protocolVersion": 1,
  "saveVersion": 3,

  "description": "Learn the core principles of graphic design.",
  "cover": "assets/cover.png",
  "estimatedMinutes": 90,
  "framework": "FLX",

  "capabilities": {
    "progress": true, "stats": true, "checkpoints": true,
    "coop": false, "submission": true, "hostDashboard": true
  },

  "mcLink": { "type": "project", "id": "mc-proj-art-101" },
  "suggestedReward": { "xc": 50, "badgeIds": ["badge-designer"] },

  "structure": {
    "phases": [
      {
        "id": "engagement", "kind": "engagement",
        "title": "Discover the Design Problem",
        "flxObjectives": ["FLX.CN.1", "FLX.CN.2", "FLX.CN.3"],
        "desiredResults": {
          "understandings": ["Design begins with empathy for the user."],
          "essentialQuestions": ["How does empathy shape a solution?"]
        },
        "assessmentEvidence": { "performanceTasks": [], "otherEvidence": [] },
        "learningPlan": { "activities": [] },
        "content": "content/engagement.html",
        "gate": { "type": "activity", "requiredCount": 3 }
      },
      {
        "id": "development", "kind": "development",
        "title": "Ideate and Build",
        "flxObjectives": ["FLX.ID.1", "FLX.ID.3", "FLX.CR.1", "FLX.CR.2"],
        "segments": [
          { "id": "ideation", "subDomain": "ID", "content": "content/ideation.html" },
          { "id": "creation", "subDomain": "CR", "content": "content/creation.html" }
        ],
        "gate": { "type": "activity", "requiredCount": 5 }
      },
      {
        "id": "enhancement", "kind": "enhancement",
        "title": "Test and Refine",
        "flxObjectives": ["FLX.RE.1", "FLX.RE.2", "FLX.RE.3"],
        "content": "content/enhancement.html",
        "gate": { "type": "activity", "requiredCount": 2 }
      },
      {
        "id": "fulfillment", "kind": "fulfillment",
        "title": "Portfolio Piece",
        "flxObjectives": ["FLX.PR.1", "FLX.PR.2"],
        "content": "content/fulfillment.html",
        "gate": { "type": "submission",
                  "fields": ["link", "screenshot", "description"] }
      }
    ]
  }
}
```

Notes:

- `moduleType` selects the `structure` shape — `phases` (the 4 FLX strands, in
  order) for a course/project, `stages` for a quest.
- `framework` is the objective variant (`FLX` or `DIX`).
- `flxObjectives` is required per phase — this drives the standards crosswalk.
- The Development phase uses `segments` for its two sub-domains.
- `moduleId` is auto-derived and authoritative (Connector §14 #1).
- `suggestedReward` is only a suggestion — the node editor's XC Reward is the
  ceiling and the Node clamps.
- A Quest's `structure` uses `stages`:

```json
"structure": {
  "stages": [
    { "id": "s1", "type": "course",    "ref": "graphic-design-concepts",
      "required": true },
    { "id": "s2", "type": "project",   "ref": "brand-identity-build",
      "required": true },
    { "id": "s3", "type": "challenge", "title": "Client Pitch",
      "flxObjectives": ["FLX.PR.2", "FLX.PR.3"],
      "gate": { "type": "submission", "fields": ["link", "description"] },
      "required": true }
  ],
  "unlock": "sequential"
}
```

---

## 13. Open questions — for review

1. **Quest stage references.** A `course`/`project` stage carries a `ref`. Is
   that another `.pflx` bundled *inside* the Quest package, or a Module already
   on a node? (Per-node upload suggests bundled.)
2. ~~Phase content authoring.~~ **Resolved** — hosts author Modules in a **PFLX
   Module Builder UI** that emits the `.pflx` package (manifest + content). The
   builder must be able to *ingest existing material* (slide decks, HTML files)
   and help the host structure it into the four FLX phases. The builder is its
   own spec/build effort — see `MODULE_BUILDER.md` (to be written).
3. ~~CFU / quiz item format.~~ **Resolved** — quizzes and checks for
   understanding live fully inside the Module's own content. There is no
   standard quiz-item JSON and the Node does not read scores; the Module
   evaluates its own gate and emits a checkpoint. See §5.
4. **Objective completion granularity.** Does PFLX track an objective as "met"
   when its phase gate passes, or only on host approval of the whole Module?
5. **DIX variant.** Is the DIX (ACS Cobham) objective set a separate framework
   a Module picks, or an org-level branding overlay on the same FLX codes?
6. **Per-phase reward weighting.** Reward is set per-node. Should phases carry
   their own checkpoint-XC weighting within the node's ceiling?

---

*End of draft v0.2. The FLX-strand phase model, the per-phase objective
tagging, and the Quest composite model are the pieces worth pressure-testing
before the manifest schema is frozen.*

*Framework source: FLX Curriculum Planner 2023–2024 (Learning Framework
Crosswalk + Strand sheets).*
