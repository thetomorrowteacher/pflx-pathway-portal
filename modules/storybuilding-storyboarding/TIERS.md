# Storybuilding & Storyboarding — Tier Outline

**Status:** Draft outline · **Scope:** how this Module restructures from v0.2
single-tier (current) → v0.3 three-tier (Starter / Novice / Pro) ·
**Companion to:** `manifest.json` (current) and
`docs/MODULE_STRUCTURE.md` §14 (the tier spec).

This is the **design** of the tier split, not the final content. Once the
outline is locked, the manifest restructure + content authoring happen as
separate work.

---

## Tier philosophy for this Module

Tools don't gate Storybuilding (per design call — the 3D modeling
Tinkercad/Blender example was illustrative). All three tiers can use any
storyboarding tool (Google Slides, Canva, Procreate, etc.). What changes
between tiers is **phase count + scaffolding depth**.

| | Starter | Novice (baseline) | Pro |
|--|---------|-------------------|-----|
| Target learner | Has never built an original story or storyboard | Comfortable with the idea but new to formal structure | Has shipped storyboards before; wants to make another piece |
| Phase count | 5 | 4 | 3 |
| Diagnostic | Same 8-item ranker | Same 8-item ranker | Single-question self-assessment |
| Original work pressure | Low — practice on a known story first | Standard — build an original story from the ground up | High — just ship a piece, no warmup |
| Estimated minutes | ~120 | ~90 | ~60 |
| Suggested reward | 100 XC + `visual-storyteller` | 200 XC + `visual-storyteller` | 350 XC + `visual-storyteller-pro` |
| Auto-granted badge | `storybuilding-storyboarding-starter` | `storybuilding-storyboarding-novice` | `storybuilding-storyboarding-pro` |
| Repeatable? | No (greys out on next launch) | No | **Yes** — unlimited replays |

---

## Phase-by-phase plan

### Starter — 5 phases

| # | Phase | What changes from Novice |
|---|-------|--------------------------|
| 1 | **Engagement** — *Why Stories Move Us* | **Same diagnostic, easier warm-up.** Replace the "tell us about a story that stuck with you" reflection with "**pick a story you already love and tell us one thing that makes it work**" — lower barrier, doesn't require introspection on your own creative process yet. |
| 2 | **Practice Round** *(Starter-only — NEW)* | **The training-wheels phase.** Pick a story you already know (Goldilocks, Spider-Man's origin, *The Three Little Pigs*, your favorite movie) and storyboard *that*. Goal: learn the structure on a story whose plot you don't have to invent. Includes a **worked example** of one frame walking the learner through what a storyboard cell shows: action, framing, beat, dialogue. Gate: storyboard at least 4 frames of the chosen story. No original creation pressure. |
| 3 | **Development** — *Build Your Story, Then Storyboard It* | Same Ideation + Creation segments as Novice, but **with more scaffolds**: pre-filled story templates (hero's journey skeleton, three-act skeleton), character/setting prompt lists that suggest 3–5 options for each, and the Plot Factory activity is broken into smaller substeps with check-ins between them. |
| 4 | **Enhancement** — *Test, Share, Refine* | Same flow but **feedback is structured, not open-ended**. Instead of "ask peers for feedforward", the player uses a worksheet — "What's confusing? What works? What's missing?" — and brings filled worksheets from 2 peers. Easier to do, more concrete than an open feedback ask. |
| 5 | **Fulfillment** — *Finalize & Present* | Identical to Novice. Finalize the storyboard + record a screencast walkthrough + submit. |

**Why this shape:** Starter never asks the learner to invent and structure simultaneously. They learn structure on a known story (Phase 2), *then* invent (Phase 3), then iterate with scaffolded feedback (Phase 4).

### Novice — 4 phases (current implementation)

The existing Storybuilding module is the Novice tier. No restructuring.
Migration: wrap the current `structure.phases` array under
`structure.tiers.novice.phases` in the manifest.

| # | Phase | Notes |
|---|-------|-------|
| 1 | Engagement — *Why Stories Move Us* | Diagnostic + "story that stuck with you" warm-up reflection |
| 2 | Development — *Build Your Story, Then Storyboard It* | Ideation segment (7 elements + Plot Factory) + Creation segment (storyboard draft using Slides/Canva templates) |
| 3 | Enhancement — *Test, Share, Refine* | Peer feedforward + refinement pass + reflection |
| 4 | Fulfillment — *Finalize & Present* | Finalize + screencast + submission |

### Pro — 3 phases

| # | Phase | What changes from Novice |
|---|-------|--------------------------|
| 1 | **Engagement** — *Why Stories Move Us* | **Collapsed to a single self-assessment**: "What's your story about? What are you trying to make the audience feel?" Two-sentence answer. Skip the multi-item diagnostic ranker (Pro players don't need to be placed; they self-selected by picking Pro). Skip the warmup reflection. |
| 2 | **Development** — *Build Your Story AND Storyboard It* | **Merged Ideation + Creation into a single pass** (no two-segment split). The 7-elements panel is collapsed into a checklist sidebar — present as reference, but no exercise around it. Player goes straight to storyboard. No templates, no scaffolds — they bring their own structure. |
| 3 | **Fulfillment** — *Finalize & Present* | Identical to Novice. Finalize + screencast + submit. |

**Skipped:** Enhancement (peer feedback / refinement). Pro learners iterate independently as part of Development; an explicit Enhancement phase is scaffolding they don't need.

**Why this shape:** Pro is for the player who knows the craft. They want minimum process overhead and a final deliverable. The phase is "open the tool, ship the piece, get evaluated."

---

## Open content questions

1. **Practice Round content (Starter).** Which 3–4 known stories should the
   worked example use? Goldilocks is universal but feels infantile for older
   learners. Spider-Man origin / *The Three Little Pigs* / *Coco* / *The
   Lion King* opening are all viable. Recommend offering a menu of 4–6 so
   the learner picks one that feels age-appropriate.

2. **Pro Engagement length.** Is a single-question self-assessment really
   enough? Or should Pro still gather one diagnostic data point (e.g.,
   "Rate your comfort with shot framing — none / some / fluent") so the host
   has *some* placement signal even for Pro? Default proposal: keep it to
   one self-assessment; Pro's whole point is to skip placement.

3. **Reward asymmetry.** Pro pays 350 XC; Starter pays 100. Is that ratio
   right? Argument for narrower: Starter put in *more time*. Argument for
   wider: Pro shipped a *more rigorous artifact*. Recommend keeping the
   spread (100 / 200 / 350) — it incentivizes the harder path and matches
   the spirit of the tier system. Hosts can clamp per-node via `xcReward`.

4. **Pro badge name.** `storybuilding-storyboarding-pro` is the auto-derived
   name. Should it instead be `visual-storyteller-pro` (a brand-name variant
   matching the `suggestedReward.badgeIds`)? Per §14.3 of MODULE_STRUCTURE,
   the convention is `<moduleId>-<tier>`. Sticking with that for consistency.

---

## Migration plan

When this outline is locked:

1. **Manifest restructure (Storybuilding).** Wrap existing 4 phases under
   `structure.tiers.novice.phases`. Add a sibling `structure.tiers.starter`
   with 5 phases (4 existing + the new Practice Round in slot 2). Add
   `structure.tiers.pro` with 3 phases (Engagement collapsed, Development
   merged, Fulfillment). Set per-tier `suggestedReward` and `estimatedMinutes`.

2. **Embedded viewer manifest.** Mirror the change in `viewer.html`'s
   `<script id="module-manifest">` block.

3. **Viewer rendering.** Update `viewer.html` to read `tier` from
   `pflx_mod_init.payload` (or fall back to `novice` in standalone mode)
   and render that tier's phases. Diagnostic-suggests-downgrade UX comes in
   a separate task.

4. **Content authoring.** Write the Practice Round content (Starter), the
   single-question Engagement and merged Development for Pro, and any new
   scaffold copy for Starter's other phases. This is the largest piece.

5. **Rebuild `.pflx`.** Zip up the updated module folder.

6. **Standalone test.** Open `viewer.html` in Chrome with
   `?tier=starter` / `?tier=novice` / `?tier=pro` URL params to spot-check
   each tier renders correctly. Then full standalone flow walkthrough.

7. **Tier picker code in pathway.html.** This is the separate parallel
   stream — until it lands, hosts can switch the live nodes to use the
   module via the in-app node editor and the module will run as Novice (the
   default if no tier is passed in `pflx_mod_init`).

---

*End of outline. Review and push back on tier shapes, phase counts, or the
content questions in §3 before manifest restructure starts.*
