# Admin UX & Pipeline Resilience Reference

> **When to read this file**: anytime you're working on
>
> - `src/app/admin/**` or `src/components/admin/**`
> - `src/lib/pipeline/**` (especially error handling, escalations, validators)
> - `src/app/api/**` manifest routes (GET/PUT)
> - Anything that surfaces a problem to the admin OR decides whether to halt the pipeline
> - The contractor editor's save/load path
>
> CLAUDE.md gives the one-paragraph version. This file is the full reference with examples, anti-patterns, and the decision matrix for "halt vs warn vs silent-fix."

---

## The North Star

**Admin is hands-off by default.** Their attention is scarce and reserved for things only they can decide. Everything mechanical and deterministic should auto-resolve. Everything ambiguous should be classified, logged, and surfaced only when their judgment is genuinely needed.

The pipeline + admin UI is graded on a single metric: *how often does the admin have to think?* Lower is better.

---

## Severity Tier Framework

Every detected issue in the pipeline / manifest / tutorial chain belongs to **exactly one tier**.

### 🔴 CRITICAL — pipeline halts, admin must act

Only these classes:

| Trigger | Why critical |
|---|---|
| Unparseable JSON in manifest | System can't proceed; data corruption |
| Duplicate control IDs | Tutorials may reference the WRONG control (silent teaching bug) |
| Missing control IDs (entirely empty) | Tutorials can't reference at all |
| `NO_CONTROLS` / `NO_SECTIONS` | Pipeline gatekeeper failed upstream — manifest is fundamentally empty |
| Mass corruption (>10 issues in one repair pass) | Blind repair would mass-destruct |

**Behavior**: halt pipeline, set `activeEscalation`, surface in PipelineStatusHero with red tone + recommended action + expandable details.

**Expected frequency** with the systems we've built: ~1 per device per year. Genuine faults only.

### 🟠 HIGH — auto-repair if possible, flag in attention inventory

| Trigger | Repair | Why high |
|---|---|---|
| Orphan `editorLabel.controlId` | Strip controlId (label → standalone) | Loses contractor's intentional teaching attachment — admin should re-link |
| Mutual section disagreement (control.sectionId vs section.childIds) | Don't auto-repair — log as unrepairable | Both targets exist, we can't pick safely |
| Unrepairable finding from repair function | (none) | Manifest persisted as-is; flagged for review |

**Behavior**: repair runs silently; entry added to `repair-log.jsonl` with severity `high`; appears in `/admin` attention inventory. Pipeline does NOT halt.

**Original state must be preserved** in the log so re-linking is possible later (see "Preserve intent" below).

### 🟡 MEDIUM — auto-repair silently, log in inventory

| Trigger | Repair |
|---|---|
| Orphan in `controlContainers.controlIds` | Strip orphan id |
| Empty `controlContainer` after strip | Dissolve container (log `originalControlIds` for rebuild) |
| Orphan in `groupLabels.controlIds` | Strip orphan id |
| Empty group label | Dissolve |
| Orphan in `section.childIds` | Strip orphan id |

**Behavior**: silent repair; appears in inventory but doesn't badge the dashboard.

Why these are medium not high: containers/group labels are visual grouping only — stripping doesn't change which controls render or how tutorials reference them. The contractor likely won't notice.

### 🟢 LOW — audit log only

- Format warnings (`CONTROL_ID_INVALID_FORMAT`)
- Empty labels (`CONTROL_EMPTY_LABEL`)
- Transient warnings from agent output

**Behavior**: written to repair log, no UI surface.

---

## Auto-Repair Philosophy

### Rule: Preserve intent, never silently destroy

When auto-repairing, **always log the original state** so the action is reversible. The `RepairChange` shape carries the recovery info:

```ts
// GOOD — preserves recovery info
{ kind: 'label-orphan-null', severity: 'high', labelId: 'lbl-1', previousControlId: 'lfo1-waveform-leds' }

// BAD — discards original
{ kind: 'label-orphan-null', labelId: 'lbl-1' }
```

The `previousControlId` is what admin needs to re-link later. Without it, the original contractor intent is lost forever.

### Rule: Conservative scope

Auto-repair touches only **cross-reference fields**:
- `controlContainers.controlIds`
- `groupLabels.controlIds`
- `editorLabels.controlId`
- `section.childIds`

Auto-repair NEVER:
- Modifies the `controls` record itself
- Modifies a section's position/dimensions
- Invents new IDs
- Renames IDs
- Deletes top-level entities

If you find yourself reaching for these, your fix doesn't belong in auto-repair. Escalate instead.

### Rule: Bounded blast radius

If a single repair pass would change more than `MAX_AUTO_REPAIRS` (currently 10) items, **bail entirely**. The manifest is likely mass-corrupted from upstream; admin should review before any auto-resolution. This is the "diff cap" safeguard.

### Rule: Mandatory mitigations

Every auto-repair endpoint MUST:
1. Write a pre-repair backup of the original manifest (`.pipeline/<id>/backups/manifest-editor-pre-repair-<ts>.json`)
2. Append a structured entry to `repair-log.jsonl` BEFORE writing the repaired manifest
3. Be idempotent (`repair(repair(M)) === repair(M)` — tested)
4. Be a pure function with no I/O (the route does the I/O)

---

## Attention Inventory

A persistent backlog of high/medium repair events across all instruments. **It survives publish** — flagged items remain visible even when an instrument is live for users. Admin reviews on their schedule.

### Storage

- Source: every `.pipeline/<id>/repair-log.jsonl` (append-only JSONL written by manifest API routes)
- Source: every `.pipeline/<id>/state.json` `requiresAdminReview` field (set when unrepairable findings surface)
- Reviewed status: `.pipeline/attention-reviewed.json` (single file, keys = item IDs)

### Aggregator

`src/lib/pipeline/attention-inventory.ts` exports a pure function that walks every `.pipeline/*/` directory and returns sorted `AttentionItem[]`. Used by the `/api/admin/attention-items` route.

### UI rules

- Empty state shows positive copy: "Nothing flagged — pipeline is healthy"
- High items surface a count badge near the dashboard's attention banner
- Medium items don't badge — visible only when admin opens the inventory
- Each item shows: device + severity + what happened + original state (when recoverable) + suggested action + "Mark reviewed" button

### When to add a new item kind

If a new auto-repair case is added to `repairManifest()`:
1. Pick the right severity (cosmetic = medium, loses contractor intent = high)
2. Add to the `RepairChange` discriminated union with the recovery info
3. Add `description` + `suggestedAction` mapping in `attention-inventory.ts`

---

## Admin UI Patterns

### One-glance status hero

Top of every detail page = `PipelineStatusHero`. Translates raw state into:
- One-sentence headline
- Helpful subtext (≤2 lines, explains WHY this state)
- 0–2 action buttons
- Expandable "Show details" with: what's happening / findings / what actions do / when it auto-resolves

Tone:
- GREEN = healthy, nothing required
- BLUE = running or planned hand-off
- AMBER = action needed, recoverable
- RED = genuine fault, halted

**Anti-pattern**: showing 5 panels at equal priority and asking admin to scan. We did this before — it's why the hero exists.

### Default-open advanced (per Devin)

Diagnostics / agent scores section is **open by default** on the detail page. Admin can collapse if they want a cleaner view, but the system shouldn't hide useful info behind a click for power users.

### No duplicate actions

If "Resume Pipeline" exists in the device header (top-right), don't put another one in the diagnostics panel. Each action surface = one place. Forces clear hierarchy.

### No cost UI anywhere

Cost is tracked in `.pipeline/<id>/cost.json` server-side. NEVER show $ amounts in admin views. The `LogStream` component has a `stripCosts()` helper that filters `$N.NN` patterns and `(cost: $X actual: $Y)` parenthetical groups from log lines before render. If you find a `$` figure leaking through, add a pattern to the stripper.

### Action prompt structure

When asking admin to do something:

```
[Headline: what happened in plain English]
[Subtext: 1-2 sentence context]
[Primary action button]    [Optional secondary action]
[Show details ▼]

Expanded:
  WHAT'S HAPPENING — why this state exists
  FINDINGS — specific items (when applicable)
  WHAT THE ACTIONS DO — one sentence per button
  WILL IT AUTO-RESOLVE? — yes/no/conditions
```

Pattern lives in `PipelineStatusHero.tsx`. Reuse it when adding new admin prompts.

---

## Pipeline Resilience Decision Matrix

When you find a new class of issue, classify it before coding the response:

| Question | If yes |
|---|---|
| Can the issue lead to tutorials referencing the wrong control? | **Critical** — halt |
| Can the pipeline finish and produce a working instrument? | **Not critical** — auto-repair or flag |
| Does fixing it require admin judgment (not deterministic)? | **High** if intent-losing; escalate via inventory |
| Is the fix mechanical with no information loss? | **Medium** — silent repair |
| Is it observable to end users? | Promote one tier (medium → high, high → critical) |
| Is the issue diagnostic noise (warnings, formatting)? | **Low** — audit only |

**Default to lower-severity if uncertain.** It's easier to promote later than to recover from a halted pipeline.

---

## Atomic Writes for Cross-References

The manifest has bidirectional links:
- `section.childIds[]` → control IDs (top-down)
- `control.sectionId` → section ID (bottom-up)

These MUST stay in sync. If one updates without the other → mutual disagreement → silent rendering bugs the validator cannot catch.

**Rule**: any code mutating either side uses `setControlSection(controlId, newSectionId)` in `manifestSlice.ts`. The single action updates both sides atomically + de-duplicates childIds + refuses to write dangling references.

**Do not**:
- Directly assign `controls[id].sectionId = 'foo'` in store reducers
- Directly push to `sections[s].childIds` in store reducers
- Skip the action because "this case won't drift" — future code might rely on the invariant

---

## Tutorial → Control Linkage Rules

Tutorials reference controls by string ID:

```ts
{ highlightControls: ['arp-rate'], panelStateChanges: { 'arp-rate': { active: true } } }
```

The linkage is enforced at THREE layers:

1. **Pre-push hook** (`.githooks/pre-push`) runs `tutorialControlRefs.test.ts` — any tutorial referencing an ID not in the manifest is rejected at push time.
2. **Post-editor validator** (PR #104) runs at pipeline phase `phase-0-post-editor-check` — halts the pipeline if duplicate/missing IDs exist before tutorials are generated.
3. **Runtime auto-repair** (this iteration) — orphan references on the manifest side are silently cleaned at save time so PanelRenderer always sees a consistent manifest.

If you add a new place tutorials reference IDs (e.g., a future `highlightSection` field), update `tutorialControlRefs.test.ts` to cover it.

---

## Critical Anti-Patterns

| ❌ Anti-pattern | ✅ Right approach |
|---|---|
| Show admin a CONTROL_ORPHAN_SECTION error code | Translate to plain English in `PipelineStatusHero.deriveState()` |
| Silently strip data without logging | Always emit a `RepairChange` with the original state |
| Halt pipeline on cosmetic issues | Auto-repair + add to inventory |
| Add a duplicate action button "for convenience" | Each action exists in exactly one surface |
| Show cost figures because "they're useful" | Cost in `cost.json` only; UI is cost-free |
| Mutate one side of a bidirectional link | Route through `setControlSection()` |
| Surface every passed-validation event to admin | Healthy state = silent. Only surface things admin can act on. |
| Use console.warn for production issues | Console warnings reach nobody. Use the attention inventory or escalation system. |

---

## Implementation Touchstones

- `src/components/admin/PipelineStatusHero.tsx` — the hands-off hero pattern
- `src/lib/pipeline/manifest-repair.ts` — auto-repair pure function with severity tiers
- `src/lib/pipeline/checkpoint-validators.ts` — `validatePostEditorManifest` is the source of finding codes
- `src/components/panel-editor/store/manifestSlice.ts` `setControlSection` — atomic write pattern
- `.githooks/pre-push` — tutorial drift gate
- `scripts/smoke-test-all.ts` — one-command verification across all instruments

---

## The Auto-Route Pattern (for pipeline phases that score LLM output)

When an LLM agent produces structured output that's followed by a verdict
(APPROVED / REJECTED / SCORE), route the pipeline based on a **deterministic
script**, not on the LLM's own verdict string. LLMs hallucinate verdicts
and invent thresholds inconsistently across runs; scripts apply codified
rules every time.

The pattern:

```
LLM agent  →  produces structured findings (gaps, scores, schema items)
Script     →  applies codified thresholds → verdict + directives
Runner     →  routes based on script verdict:
                ├─ PASSES                → advance to next phase
                ├─ TRIVIALLY FIXABLE     → auto-repair (no LLM re-run)
                ├─ RECOVERABLE w/ DIRECTIVES → auto-retry feedback loop (max N tries)
                ├─ REGRESSION DETECTED   → escalate (LLM not converging)
                ├─ CRITICAL / MASS CORRUPTION → escalate immediately
                └─ HALLUCINATION suspected → optional claim-verifier pass
```

### Apply at

- Any phase where LLM output gets scored or has a PASS/FAIL verdict
- Where the deterministic check can be expressed (counts, set comparisons,
  threshold math, topological sort)

### DO NOT apply at

- **Planned admin gates** — `editor-ready`, `template-review`,
  `curriculum-review`. These are intentional human-judgment moments;
  don't try to route around them.
- **Content / judgment work** — e.g., YouTube content curation. Where
  the value IS the human's editorial decision.
- **Cases with no observable convergence signal** — if the LLM can't
  improve on retry given more directives, don't auto-retry; escalate.

### Reference implementations

- `src/lib/pipeline/coverage-scorer.ts` — coverage auditor verdict
- `src/lib/pipeline/manifest-repair.ts` — post-editor manifest cleanup
- `src/lib/tutorial/cumulative-state-validator.ts` — tutorial state drift
- `src/lib/pipeline/checkpoint-validators.ts:detectBatchCycles` — DAG cycle check

### Convergence safety

When using auto-retry with directives:
1. Cap retries (`MAX_AUDIT_RETRIES = 2` is the current default)
2. Compare current findings against previous run's findings — if NEW
   issues appear that weren't there before, the LLM regressed; escalate
   immediately rather than loop
3. If feedback is consistently ignored across retries, the LLM lacks
   the manual content to bridge the gap; escalate (not the LLM's fault,
   not solvable by more retries)

---

## What This File Doesn't Cover

- Specific component styling (Tailwind colors, font sizes) — see existing components for patterns
- Pipeline phase definitions — see `src/lib/pipeline/state-machine.ts`
- Agent orchestration rules — see CLAUDE.md "Agent Orchestration" section
- Git branching — see CLAUDE.md "Git Branching Rules"

This file is the design philosophy. CLAUDE.md is the rules of engagement.
