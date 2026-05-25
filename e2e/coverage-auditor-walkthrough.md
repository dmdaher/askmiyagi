# Coverage-Auditor Walkthrough — Validate the Feature-Level Matching Fix

**Status**: HUMAN- OR AGENT-RUNNABLE (not auto-executed by CI).

This walkthrough is the end-to-end validation that the section-vs-feature
granularity fix actually works on a real device. The fix is shipped as code
+ agent prompt; this doc proves the fix by re-running the auditor on
cdj-3000 (where we have ground truth) and checking the new `match-table.md`
output classifies the previously-"missing" 8 features as CONFIRMED.

The walkthrough is NOT auto-runnable because invoking the auditor LLM
agent (Opus) has real $$ cost per run. Gated to user-triggered execution.

---

## Pre-conditions

- [ ] You're on a branch that includes the feature-level matching fix
      (see PR for `feature/coverage-auditor-feature-level` or its merged
      commit on `test`).
- [ ] `.pipeline/cdj-3000/agents/coverage-auditor/` exists locally with
      the OLD checkpoint (will be moved aside, not deleted).
- [ ] cdj-3000's pipeline state is past `phase-4-extraction` so the
      auditor has inputs to read (`pass-1-inventory.md`,
      `pass-3-curriculum.md`, `tutorials.json`).

---

## Step 1 — Move the old auditor checkpoint aside

```bash
cd "/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi"
TS=$(date +%s)
mv .pipeline/cdj-3000/agents/coverage-auditor \
   .pipeline/cdj-3000/agents/coverage-auditor.old-${TS}
mkdir .pipeline/cdj-3000/agents/coverage-auditor
```

Keeping the old checkpoint lets us compare before/after.

---

## Step 2 — Invoke the auditor

From the admin UI (recommended) OR from CLI:

**From admin UI**: `http://localhost:3000/admin/cdj-3000` → "Re-run
coverage audit" button (if available in your build).

**From CLI**: trigger via the pipeline runner with phase override:

```bash
npx tsx scripts/pipeline-runner.ts cdj-3000 --phase=phase-4-audit
```

The agent runs against the updated prompt — should produce both
`comparative-audit.md` (existing) AND `match-table.md` (NEW).

Expected runtime: ~3-8 minutes for cdj-3000 (244 features × Opus
processing).

---

## Step 3 — Verify match-table.md was produced

```bash
ls -la .pipeline/cdj-3000/agents/coverage-auditor/
```

Expected files:
- `checkpoint.md`
- `independent-checklist.md`
- `comparative-audit.md`
- **`match-table.md`** ← MUST be present (new output)

If `match-table.md` is missing, the agent didn't pick up the prompt change
or refused to produce it. Investigate the agent's last message before
proceeding.

---

## Step 4 — Verify the 8 previously-"missing" features appear as CONFIRMED

```bash
for feature in 'Touch Preview' 'Touch Cue' 'Cue Point Sampler' \
               'Active Loop' 'Emergency Loop' 'History' \
               'CALL/DELETE' 'CALL_DELETE'; do
  echo "=== $feature ==="
  grep -i "$feature" .pipeline/cdj-3000/agents/coverage-auditor/match-table.md \
    | head -3 || echo "  (not found — REAL GAP)"
done
```

Expected: each feature appears in a row with `match_kind = CONFIRMED` or
`CONFIRMED_BY_PARENT_ONLY`, with a non-empty `tutorial_id` referencing
which tutorial teaches it.

For features that are genuinely missing (some may not be in tutorials yet),
the row should appear with `match_kind = MISSING` or
`CONFIRMED_BY_PARENT_ONLY` — but NOT silently absent.

---

## Step 5 — Verify the recomputed coverage_pct

Read `checkpoint.md` frontmatter:

```bash
head -20 .pipeline/cdj-3000/agents/coverage-auditor/checkpoint.md
```

Look for:
- `total_features`: 244 (or close — agent may recount)
- `confirmed_features`: count of CONFIRMED + RECLASSIFICATION rows
- `parent_only_gaps`: count of CONFIRMED_BY_PARENT_ONLY rows
- `missing_gaps`: count of MISSING rows
- `coverage_pct`: should be ≥ 90% if the tutorials genuinely cover the features

If the auditor's frontmatter says one thing and the match-table math says
another, the scorer (`src/lib/pipeline/coverage-scorer.ts`) will trust the
match-table and emit a `matchTableWarning`. Either way the scorer is now
authoritative — the auditor can't silently claim better coverage than it
actually proved.

---

## Step 6 — Verify the scorer produces the right verdict

```bash
# Inline run of the scorer over the new checkpoint:
npx tsx -e "
  import fs from 'fs';
  import { scoreCoverage } from './src/lib/pipeline/coverage-scorer';
  const checkpoint = fs.readFileSync('.pipeline/cdj-3000/agents/coverage-auditor/checkpoint.md', 'utf-8');
  const matchTable = fs.readFileSync('.pipeline/cdj-3000/agents/coverage-auditor/match-table.md', 'utf-8');
  const result = scoreCoverage(checkpoint, { matchTableMarkdown: matchTable });
  console.log('Verdict:', result.verdict);
  console.log('Reason:', result.reason);
  console.log('MatchTable:', result.matchTable);
  console.log('Warning:', result.matchTableWarning ?? '(none)');
"
```

Expected output:
- Verdict: `APPROVED` or `APPROVED_WITH_WARNINGS`
- MatchTable populated with total/confirmed/parentOnlyGaps/missingGaps/coveragePct
- Warning: `(none)` if the auditor's frontmatter agrees with the recomputed
  percentage; otherwise the warning text explaining the discrepancy

---

## Step 7 — Compare against the old checkpoint

```bash
echo "=== OLD (section-level) ==="
grep -E "verdict:|score:|coverage_pct:|significant_gaps:|minor_gaps:" \
  .pipeline/cdj-3000/agents/coverage-auditor.old-*/checkpoint.md | head -10
echo ""
echo "=== NEW (feature-level) ==="
grep -E "verdict:|score:|coverage_pct:|total_features:|confirmed_features:|parent_only_gaps:|missing_gaps:" \
  .pipeline/cdj-3000/agents/coverage-auditor/checkpoint.md | head -10
```

Expected: the NEW frontmatter has the additional `total_features`,
`confirmed_features`, `parent_only_gaps`, `missing_gaps` fields. The
`coverage_pct` may differ from the OLD value but should be EXPLAINABLE
by the match-table data.

---

## Step 8 — Promote or rollback

If everything checks out:
- Keep the new checkpoint
- Optionally delete the `.old-${TS}` backup once you're confident

If something looks wrong:
- Restore: `rm -rf .pipeline/cdj-3000/agents/coverage-auditor && mv .pipeline/cdj-3000/agents/coverage-auditor.old-${TS} .pipeline/cdj-3000/agents/coverage-auditor`
- Open an issue with the broken match-table + agent transcript

---

## What this walkthrough proves

1. **The agent prompt change actually changes agent behavior** — it now
   produces `match-table.md` and uses feature-level matching.
2. **The scorer correctly consumes the new format** — recomputes coverage
   from the match table, warns on frontmatter mismatch.
3. **The cdj-3000 ground truth is preserved** — the 8 previously-claimed-
   "missing" features (per the now-historical deferred plan) are correctly
   identified as CONFIRMED, because the tutorials DO actually teach them.
4. **The verdict pipeline still works end-to-end** — auditor → scorer →
   verdict → (optional) directives.

If all 8 steps pass, the fix is live and validated. Future devices going
through `phase-4-audit` get the same protection automatically.
