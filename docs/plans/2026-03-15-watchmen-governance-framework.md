# Plan: Watchmen Governance Framework

## Context

The Sieve protocol enforcement (PR #30) added mechanical checkpoint validators — the "Watchmen" that verify agent output between sub-steps. Gemini identified these as the critical shift from "chatting with a PDF" to an industrial ETL pipeline.

But the current watchmen have gaps:

1. **Paraphrase detection**: `validateIndependentChecklist` catches agents that reference extractor file paths, but not agents that anchor to extractor interpretations and reword them. A "clever" agent passes the regex check while providing zero independent value.

2. **No cross-agent validation**: Each validator checks one file in isolation. Nothing verifies consistency *across* agents or *across* pipeline phases.

3. **No process-level oversight**: The validators check output format but not whether the agent followed the right process. An agent could produce correctly-formatted garbage.

This plan adds three layers of governance, from mechanical to cognitive.

---

## Layer 1: Embedding Similarity Scoring (Auditor Independence)

### Problem
The auditor's independent checklist could be a paraphrase of the extractor's output. Current regex validation catches explicit file references but not semantic copying.

### Approach
After the auditor writes `independent-checklist.md` and *before* unsealing the extractor output, compute vector similarity between the auditor's checklist and the extractor's inventory.

```
Phase 1 (sealed):   Auditor reads manual → independent-checklist.md
NEW → Similarity:   Compare independent-checklist.md vs pass-1-inventory.md (from sealed dir)
Phase 2 (unsealed):  Comparative audit begins
```

### Implementation

**New file: `src/lib/pipeline/similarity-checker.ts`**

```ts
interface SimilarityResult {
  cosineSimilarity: number;
  verdict: 'independent' | 'suspicious' | 'compromised';
  details: string;
}

// Option A: Local embeddings via transformers.js (no API cost, ~50ms)
// Option B: Claude API embeddings (higher quality, costs per call)
// Option C: Structural comparison — section headings, feature counts,
//           ordering patterns (no ML needed, surprisingly effective)
```

**Thresholds (to calibrate against real data):**
- `< 0.70` cosine similarity → `independent` (expected: different structure, different emphasis)
- `0.70 - 0.90` → `suspicious` (log warning, proceed but flag in audit report)
- `> 0.90` → `compromised` (escalate, do not proceed to Phase 2)

**Key insight from discussion**: The comparison must happen *before* unseal — read the extractor's inventory from `.extractor-sealed/` for the comparison, not from the live directory. This preserves the temporal isolation.

### Decision needed
- Option A (transformers.js) adds ~50MB to deps but zero API cost
- Option B (Claude API) is lighter but costs per pipeline run
- Option C (structural) is zero-dep and may be sufficient for v1
- **Recommendation**: Start with Option C (structural comparison), upgrade to embeddings only if it proves insufficient

---

## Layer 2: Cross-Agent Consistency Checks

### Problem
Each validator checks one file. Nobody checks whether:
- The extractor's bucket count matches the actual manual pages
- The auditor's feature count is in the same ballpark as the extractor's
- The batch plan's tutorial count matches the curriculum's tutorial count
- Anchoring discrepancies across buckets are consistent (not contradictory)

### Approach
Add a `validatePipelineConsistency()` function that runs after all sub-steps complete, cross-referencing outputs.

**New file or extend `checkpoint-validators.ts`:**

```ts
interface ConsistencyResult {
  valid: boolean;
  warnings: string[];  // non-blocking but logged
  errors: string[];    // blocking — pipeline halts
}

function validatePipelineConsistency(sieveDir: string): ConsistencyResult {
  // 1. Total features across all anchored buckets ≈ pass-1 inventory count (±10%)
  // 2. Pass-3 tutorial count ≈ pass-4 batch tutorial count (exact match expected)
  // 3. No feature appears in MANUAL-ONLY across ALL buckets (suggests panel gap, not extraction gap)
  // 4. Dependency DAG in pass-3 is acyclic (mechanically verifiable from JSON)
  // 5. Batch ordering respects DAG topology (no batch depends on a later batch)
}
```

### When to run
- After all 4 assembly passes complete, before marking extraction as done
- After auditor Phase 2, before verdict

---

## Layer 3: Process Auditor Agent

### Problem
Validators check output *format*. They don't check whether the agent followed the right *process*. An agent could:
- Skip reading the manual and fabricate a plausible table
- Read only the first page of each bucket range
- Copy from a previous device's extraction with name substitution

### Approach
A lightweight "process auditor" that samples agent behavior logs.

**Not a new SOUL** — this runs inside the pipeline runner, not as a Claude CLI invocation.

```ts
function auditAgentProcess(agentLogs: string[], sieveDir: string): ProcessAuditResult {
  // Check 1: Did the agent actually read the manual pages?
  //   → Look for Read tool calls targeting the manual PDF with correct page ranges

  // Check 2: Did the agent read the panel constants during anchoring?
  //   → Look for Read/Grep calls targeting panel-constants.ts

  // Check 3: Did the agent write the output file?
  //   → Look for Write tool call targeting the expected path

  // Check 4: Time-based sanity — did the agent spend >5s per bucket?
  //   → An agent that "extracts" 10 pages in <2s is suspicious
}
```

### Data source
The pipeline runner already captures stream-json events in logs. The `parseStreamEvent` function in `runner.ts` extracts tool calls. We can parse the log to verify the agent actually performed the expected operations.

### Scope
- v1: Log-based heuristics only (no additional agent invocations)
- v2: Dedicated critic agent that reviews process logs (expensive but thorough)

---

## Implementation Order

| Step | Layer | Effort | Dependency |
|------|-------|--------|------------|
| 1 | L2: `validatePipelineConsistency` | ~80 lines | None — pure TypeScript |
| 2 | L1: Structural similarity (Option C) | ~60 lines | Needs real extraction data to calibrate |
| 3 | L3: Process auditor (log parsing) | ~100 lines | Needs agent logs from a real pipeline run |
| 4 | L1: Embedding similarity (if C insufficient) | ~150 lines + dep | Needs Option C failure data |

**Step 1 can be built now.** Steps 2-3 should wait for the CDJ-3000 stress test to provide real data. Step 4 is contingent on Step 2 proving insufficient.

---

## Verification

1. Run CDJ-3000 extraction through the sieve pipeline
2. Deliberately sabotage one bucket (paraphrase extractor output as "independent" checklist) → verify Layer 1 catches it
3. Introduce a feature count mismatch between pass-1 and pass-3 → verify Layer 2 catches it
4. Review agent logs from a real run → verify Layer 3 heuristics are actionable
5. Measure false positive rate — governance that blocks legitimate work is worse than no governance

---

## Open Questions

- **Similarity threshold calibration**: Need 3-5 real extraction runs to determine what "normal" similarity looks like between independent readings of the same manual. Two humans reading the same manual will have *some* overlap.
- **Performance budget**: How much overhead per pipeline run is acceptable? Layer 2 is ~0ms (file reads). Layer 1 Option C is ~50ms. Layer 3 is ~100ms. Embeddings (Option A/B) add 500ms-2s.
- **False positive handling**: Should a "suspicious" similarity score block the pipeline or just flag for human review?
