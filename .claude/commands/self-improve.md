# SELF-IMPROVEMENT Gate

Reflect on the implementation process after completing a major feature or milestone. This is how the project's documentation and quality gates evolve over time.

**Trigger:** After completing a major feature, finishing a tutorial batch, merging a significant PR, or reaching any notable milestone.

---

## Step 1: Reflect on the Process

Answer each question honestly:

1. **What went well?**
   - Which parts of the process worked efficiently?
   - Which patterns or conventions made things easier?
   - Which quality gates caught real issues?
   - Which skills (brainstorming, TDD, verification) added the most value?

2. **What was harder than expected?**
   - Were there surprises? Ambiguities in the manual?
   - Missing data that required extra research?
   - Unexpected complexity in implementation?
   - Tools or processes that slowed you down?

3. **Did you make any assumptions that should have been verified?**
   - List every moment where you proceeded without full certainty
   - Were those assumptions correct? If not, what was the impact?
   - Should a gate question have caught this?

4. **Is there a reusable pattern you discovered?**
   - New component patterns, utility functions, or conventions
   - Should it be documented in the playbook?
   - Should it be extracted into a shared utility?

5. **What would you tell the next Claude instance?**
   - The one thing they should know that ISN'T already documented
   - The non-obvious gotcha that cost you time
   - The shortcut that saved you time

## Step 2: Update Documentation

6. **Should the quality gates be updated?**
   - New questions needed for PRE-BUILD or POST-BUILD?
   - Existing questions that should be refined?
   - If yes, update the relevant command file in `.claude/commands/`
   - Also update `docs/quality-gates.md` (the authoritative source)

7. **Are the memory files current?**
   - Check `memory/MEMORY.md` — does it reflect the latest state?
   - Tutorial counts accurate?
   - Category counts accurate?
   - Project state description current?
   - Key patterns still valid?
   - Stale entries that should be removed?

8. **Does the playbook need updates?**
   - Check `docs/new-instrument-playbook.md` — any new lessons for Appendix B?
   - Check `memory/tutorial-batch-playbook.md` — any new constraints or patterns?
   - New common review findings to add?

9. **Are lessons up to date?**
   - Check `tasks/lessons.md` — any new patterns from this work?
   - Any existing patterns that should be refined?
   - Currently 19 documented patterns — did this work add any?

## Step 3: Update Project State

10. **Update MEMORY.md with current counts:**
    - Total tutorial count
    - Per-category counts
    - Test count
    - Screen type count
    - Any new documentation created

11. **Update gap analysis (if tutorials were added):**
    - Open `docs/plans/2026-02-28-gap-analysis.md`
    - Mark PLANNED → COVERED for completed sections
    - Document any new gaps discovered
    - Update coverage percentages

---

## Self-Improvement Template

Copy and fill in:

```
SELF-IMPROVEMENT Report:
━━━━━━━━━━━━━━━━━━━━━━━━
Feature completed: [name]
Date: [YYYY-MM-DD]

What went well:
- [point 1]
- [point 2]

What was harder than expected:
- [point 1]

Unverified assumptions:
- [assumption] → [correct/incorrect]

New patterns discovered:
- [pattern] → [documented in: file]

Advice for next instance:
- [key insight]

Documentation updates:
- [ ] MEMORY.md updated
- [ ] lessons.md updated (if new patterns)
- [ ] quality gates updated (if new questions)
- [ ] playbook updated (if new lessons)
- [ ] gap analysis updated (if tutorials added)
━━━━━━━━━━━━━━━━━━━━━━━━
```

**This gate exists because projects that don't reflect don't improve. Take 5 minutes to reflect — it saves hours on the next feature.**
