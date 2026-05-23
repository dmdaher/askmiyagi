# IMPACT-CHECK — Pre-Change Impact Analysis

Run this checklist before writing code for any non-trivial change. For
each numbered question, **answer out loud in the response to the user**
so they can review and correct before any work begins.

**Trigger:** User invokes `/impact-check`, OR I'm about to touch any of:
- `src/components/panel-editor/` or `src/components/controls/`
- `src/lib/` (shared utilities)
- `.pipeline/<dev>/manifest*.json` (contractor live data)
- `src/data/manifests/*.json` (production committed manifests)
- `scripts/pipeline-runner.ts` or pipeline state
- Anything that crosses editor↔preview boundaries
- Anything that crosses local↔hosted (Vercel Blob) boundaries

Trivial fixes (typo, comment-only, single-line rename) skip this and just
go.

---

## The Six Questions

### 1. Architecture impact

- What component(s), function(s), or render path(s) does this change?
- Does it create new coupling between modules (editor ↔ preview, store ↔
  rendering, pipeline ↔ editor)?
- Does it remove existing coupling (extract a shared component)?
- Does it introduce a "mode-aware monolith" anti-pattern (`if (mode === ...)` branches)?
- Are there existing utilities I should reuse instead of writing new code?
  Examples: `SharedLabel`, `banner-style.ts`, `keyboard-overlap.ts`,
  `panel-constants.ts`.

**Reference**: `docs/architecture/editor-preview-unification.md` —
shared-core + mode-wrapper pattern. If the change spans editor and
preview, the answer is *extract a SharedX core, don't duplicate logic*.

### 2. Manifest impact

- Does this READ from `.pipeline/<dev>/manifest-editor.json` (live
  contractor) or `src/data/manifests/<dev>.json` (production)?
- Does it WRITE to either? If yes:
  - What field(s)?
  - Is the schema change backward-compatible (additive optional field) or
    breaking (required field, renamed field, removed field)?
  - Do existing devices need a migration script?
- Does it change `storeToManifest()` in `PanCanvas.tsx`? If yes, the
  serialization contract between editor and `PanelRenderer` changes —
  every consuming device is affected.

**Rule**: schema changes need a migration plan. Backward-compatible
additions only need a default fallback in readers.

### 3. Blob impact

- Does this read or write Vercel Blob (`/api/hosted/panels/*`)?
- Which Blob keys? (per-device `manifest.json`, `status.json`, history
  files, photos)
- Does it change the throttle / dedup logic in `src/lib/hosted-storage.ts`?
  Past TOCTOU bugs lived here.
- Could this corrupt cross-device data (a write that overwrites another
  device's blob)?

**Rule**: any blob write needs `allowOverwrite: true` with filename-minute
dedup (per the throttle fix in PR #117). Never write per-device data
without a device-id-scoped key.

### 4. Editor / preview impact

- Could any pixel position shift in editor mode, preview mode, or
  production rendering?
- Have I run `npm run drift:capture` BEFORE the change to get a baseline?
- Will `npm run drift:verify` after the change show editor changes = 0?
- If preview drift increases, is that intended (closing a known gap) or
  accidental (regression)?
- Will the CI gate (`.github/workflows/drift-check.yml`) pass on the PR?

**Rule**: editor pixel positions are sacred. Verify always = 0 editor
drift before merge. Preview drift may be intentional (closing gaps) but
must be explained in the PR.

### 5. Before/after backups

- Will I touch any contractor data on disk (`.pipeline/*/manifest-*.json`)
  or committed production manifest (`src/data/manifests/*.json`)?
- If yes: `cp <file> /tmp/<basename>-$(date +%s).bak` BEFORE the
  operation. Log the timestamp.
- Never `git checkout --` these files without a backup.
- Never `git reset --hard` or `git stash drop` without confirming a
  backup exists.

**Rule**: contractor positioning work is irreplaceable. Vercel Blob
history (50 versions) is the final fallback, but local `.bak` is faster
and more granular.

### 6. Verification plan

- What test proves correctness?
- Unit test (`vitest`)? — extract pure functions; test them.
- Integration via `drift:verify`? — for any rendering change.
- Manual smoke in `/admin/<dev>/editor`? — for any editor UX change.
  Always test on **fantom-06** (`controlScale=0.3`) since it surfaces
  scale-related bugs others miss.
- Tutorial replay? — for any tutorial-affecting change.

**Rule**: every PR ships with a verification step the reviewer can run.
"It compiles" is not verification.

---

## Output Format

After answering all six, present to the user like:

```
## Impact Check — <task description>

1. **Architecture**: <answer>
2. **Manifest**: <answer>
3. **Blob**: <answer>
4. **Editor/preview**: <answer>; baseline status: <captured / N/A>
5. **Backups**: <files backed up> at /tmp/<…>-<ts>.bak
6. **Verification**: <test plan>

Proceeding? [yes/no/different approach]
```

Wait for user go-ahead before writing code, **unless** the change is
trivial AND none of the six raise concerns.

---

## Recovery (when something goes wrong)

If a change has unintended impact:

1. **Revert the working tree change**: `git diff` + `git checkout -- <file>` (only if no contractor data is affected).
2. **Restore from backup**: `cp /tmp/<basename>-<ts>.bak <original>`.
3. **Recover from git history**: `git reflog` shows every ref state.
4. **Recover from Vercel Blob**: hosted history has 50 versions; admin
   panel → Version History → restore the pre-change version.

Document the recovery in the PR/commit so future-me knows the
fingerprints.

---

## Historical incidents this prevents

- **2026-05-15**: `git checkout --` on fantom-06 manifest-editor.json
  with no backup. Recovered by re-pulling from contractor's Blob.
  → This skill exists because of that.
- **2026-05-15**: PR #121 stacked on PR #120's branch; when #120 merged
  and its branch deleted, #121's merge commit was orphaned. Content
  never reached `test`. → Question 1 (architecture impact) now includes
  "PR base branch — does this depend on another PR? If yes, retarget to
  the parent's parent after that PR merges."
- **2026-05-13**: Editor↔preview label drift (DEC, INC, SHIFT, EXIT,
  ENTER) on fantom-06. Caused by two independent render paths. →
  Question 1 ("shared core?") is the architectural guard.
- **2026-05-15**: Keyboard overlap detector ignored `controlScale`,
  causing phantom warnings on fantom-06. → Question 4 ("editor/preview
  impact") + always-test-on-fantom-06 rule.
