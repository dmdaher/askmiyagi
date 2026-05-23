# IMPACT-CHECK — Pre-Change Impact Analysis

Run this checklist before writing code for any non-trivial change. For
each numbered question, **answer out loud in the response to the user**
so they can review and correct before any work begins.

**Trigger:** User invokes `/impact-check`, OR I'm about to touch any of:
- `src/components/panel-editor/` or `src/components/controls/`
- `src/components/panel/` (Shared* primitives)
- `src/lib/` (shared utilities, including `render-helpers.tsx`)
- `.pipeline/<dev>/manifest*.json` (contractor live data)
- `src/data/manifests/*.json` (production committed manifests)
- `scripts/pipeline-runner.ts` or pipeline state
- Anything that crosses editor↔preview boundaries
- Anything that crosses local↔hosted (Vercel Blob) boundaries
- `e2e/editor-preview-baseline.ts` or drift CI infrastructure

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
  Examples: `SharedLabel`, `render-helpers.tsx` (renderLabelText,
  inferPortVariant, mapButtonLabelPosition, resolveDisplayContent),
  `banner-style.ts`, `keyboard-overlap.ts`, `panel-constants.ts`,
  `label-position.ts`.

**Reference**: `docs/architecture/editor-preview-unification.md` —
shared-core + mode-wrapper pattern. If the change spans editor and
preview, the answer is *extract a SharedX core, don't duplicate logic*.

**Anti-pattern guard**: never edit `ControlNode.tsx` (editor) AND
`PanelRenderer.tsx` (preview) for the same visual change without
extracting a shared component. If you find yourself doing this, stop
and propose a SharedX extraction instead.

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
- **Has any new field been added to `ControlDef` in the editor that this
  task should ALSO thread through `storeToManifest`?** Past silent-drift
  bugs (zOrder threading missing for months) came from this.

**Rule**: schema changes need a migration plan. Backward-compatible
additions only need a default fallback in readers. New editor field?
Verify it threads to preview via storeToManifest.

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

### 5. Before/after snapshots (MANDATORY for non-trivial changes)

Three snapshot types — capture ALL THREE before any change that could
touch contractor data or rendering:

#### 5a. Manifest byte-identity (always)

```bash
TS=$(date +%s); BACKUP="/tmp/<task>-pre-$TS"; mkdir -p "$BACKUP"
for d in fantom-06 cdj-3000 deepmind-12 dj-xdj-rr dj-xdj-rx3 minimoog-model-d alphatheta-cdj3000x; do
  cp ".pipeline/$d/manifest-editor.json" "$BACKUP/${d}__pre.json"
  shasum -a 256 ".pipeline/$d/manifest-editor.json" | awk -v d="$d" '{print d, $1}'
done > "$BACKUP/_sha.txt"
```

After the change, re-run the SHA loop and `diff` against `_sha.txt`. If
your change isn't supposed to write manifests, ANY SHA change is a red
flag — investigate before continuing (something fired auto-save).

#### 5b. Drift baseline (editor↔preview parity)

```bash
npm run drift:capture           # save current renders as baseline
# ... make your change ...
npm run drift:verify            # must show editor changes = 0
```

If editor changes ≠ 0 and the change wasn't a render-path refactor, the
change has an unintended effect on layout. Diagnose before pushing.

#### 5c. Playwright UI screenshots (for any rendering / interaction change)

Capture screenshots of all 7 devices in BOTH editor and preview modes
before and after. Compare. Example pattern from past sessions:

```ts
// e2e/<task>-snapshot.ts
import { chromium } from 'playwright';
const ADMIN = process.env.ADMIN_PASSWORD;
const DEVICES = ['fantom-06','cdj-3000','deepmind-12','dj-xdj-rr','dj-xdj-rx3','minimoog-model-d','alphatheta-cdj3000x'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
// MANDATORY: admin_access cookie + ?nosave=true URL flag
await ctx.addCookies([{ name: 'admin_access', value: ADMIN, url: 'http://localhost:3000', sameSite: 'Lax' }]);
for (const dev of DEVICES) {
  const p = await ctx.newPage();
  await p.goto(`http://localhost:3000/admin/${dev}/editor?nosave=true`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `/tmp/<task>-pre/${dev}-editor.png` });
  await p.locator('button:has-text("Preview")').first().click();
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `/tmp/<task>-pre/${dev}-preview.png` });
  await p.close();
}
```

**MANDATORY rules for Playwright with the editor**:

1. **Always `?nosave=true` URL flag** — disables the auto-save subscriber.
   WITHOUT THIS, loading `/admin/<dev>/editor` from a script CAN OVERWRITE
   CONTRACTOR DATA. The editor's `useAutoSave` hook fires on store changes
   including programmatic `setState`. Past incident: 2026-05-15 lost
   ~270 lines of fantom-06 contractor data when this guard was missing.
2. **Backup contractor data first** (5a above) — belt-and-suspenders if
   `?nosave=true` is ever forgotten.
3. **Never load `/editor/<deviceId>` (hosted mode)** from a script
   without `?nosave=true` AND explicit user authorization. Hosted writes
   to Vercel Blob = touches production.
4. **Use `admin_access` cookie**, not the signin form, to authenticate
   programmatically. Set via `ctx.addCookies()`.
5. **Programmatic state mutation should NEVER call store actions that
   trigger save**. Use `setState({})` directly if you must mutate, with
   `?nosave=true` as the safety net.

**Reference**: `memory/feedback_playwright_triggers_autosave.md`,
`memory/feedback_before_after_snapshots.md`.

### 6. Verification plan — testing layers (MANDATORY)

Every non-trivial change must pass ALL applicable layers. Larger changes
add more layers. Halt the PR if ANY layer fails.

#### Layer 1 — Static analysis (every change)
- `tsc --noEmit` — type regressions
- `next build` — bundle / SSR breakage
- ESLint — lint regressions

#### Layer 2 — Unit tests (every change)
- `npx vitest run` — must show all existing tests pass + any new ones
- New code requires new test coverage (do not commit untested logic)
- For pure utility functions: pure-function tests
- For React components: render tests covering all prop combinations

#### Layer 3 — Editor interaction tests (any change to editor)
Run a Playwright spec covering:
- Click to select
- Shift+click multi-select
- Drag to move
- Resize handles
- Right-click context menu
- Double-click to edit label
- Lock toggle
- "Bring to front" / "Send to back" (zOrder)
- Properties panel edits
- Undo/redo
- Delete control
- Copy/paste (⌘D)
- Drag-select rectangle

#### Layer 4 — Preview interaction tests (any change to PanelRenderer)
Run a Playwright spec covering:
- Preview toggle on/off
- Floating labels render correctly
- Polish banners render
- Keyboard renders (where applicable)
- Section frame modes (full / header-only / body-only / hidden)
- Container styles (recessed / raised / outlined / filled)

#### Layer 5 — Tutorial production integration (any change to PanelRenderer / shared primitives)
**PanelRenderer is loaded in production tutorials.** Always run:
- `npx vitest run src/__tests__/tutorials/tutorialControlRefs.test.ts`
- `npx vitest run src/__tests__/tutorials/cumulative-state.integration.test.ts`
- Playwright: replay 5 steps of a Fantom-08 tutorial; verify highlights,
  LED state changes, display content updates

#### Layer 6 — Visual regression (any rendering change)
- `npm run drift:verify` — editor side must show 0 changes from baseline
- Per-device screenshot diff (pre/post) on all 7 devices, both modes

#### Layer 7 — Data integrity (every change)
- SHA256 byte-identity on all 7 `.pipeline/<dev>/manifest-editor.json`
  (must match `_sha.txt` from snapshot in 5a)
- If change touches save/load: edit a field, save, reload, verify
  persistence (with `?nosave=true` OFF for this test only)

#### Layer 8 — Cross-device manual smoke (rendering changes)
Walk all 7 devices in editor + preview:
- fantom-06 (synth with keyboard)
- cdj-3000 (29 circle controls, ports, jog wheel)
- deepmind-12 (70+ LEDs, keyboard)
- dj-xdj-rr (129 controls, DJ controller)
- dj-xdj-rx3 (148 controls)
- minimoog-model-d (knob-dominant)
- alphatheta-cdj3000x (large bbox controls)

#### Layer 9 — Performance (informational, not gating)
- Record build time before/after; alert if >10s regression
- Editor load latency on cdj-3000 (most controls) — should not perceptibly
  regress

#### Layer 10 — Final pre-commit gate (every change)
```bash
npx vitest run                              # all tests pass
npm run build                               # build clean
npm run drift:verify                        # editor drift = 0
# SHA256 byte-identity loop (see 5a)
# Playwright e2e on affected layers
```

If ANY layer fails: do not push. Investigate, fix, re-run from top.

---

## Output Format

After answering all six, present to the user like:

```
## Impact Check — <task description>

1. **Architecture**: <answer>
2. **Manifest**: <answer>
3. **Blob**: <answer>
4. **Editor/preview**: <answer>; baseline status: <captured / N/A>
5. **Snapshots**: byte-identity backup at /tmp/<task>-pre-<ts>/, drift baseline captured, Playwright screenshots captured (7 devices × 2 modes)
6. **Verification plan**: layers <list>; new tests <list>; existing tests required to pass <list>

Proceeding? [yes/no/different approach]
```

Wait for user go-ahead before writing code, **unless** the change is
trivial AND none of the six raise concerns.

---

## Recovery (when something goes wrong)

If a change has unintended impact:

1. **Revert the working tree change**: `git diff` + `git checkout -- <file>` (only if no contractor data is affected — and never `git checkout` a `.pipeline/*/manifest-editor.json` without backup, per `memory/feedback_never_checkout_contractor_data.md`).
2. **Restore from backup**: `cp /tmp/<task>-pre-<ts>/<file>.bak <original>`.
3. **Recover from git history**: `git reflog` shows every ref state.
4. **Recover from Vercel Blob**: hosted history has 50 versions; admin
   panel → Version History → restore the pre-change version.

Document the recovery in the PR/commit so future-me knows the
fingerprints.

---

## Recent gotchas (from 2026-05 sessions — bake into impact analysis)

| Gotcha | Detection / mitigation |
|---|---|
| `background: undefined` in a React style object CLEARS `backgroundColor` from the rendered inline style (CSS shorthand semantics). Bug #140 Bug 2. | Conditionally spread shorthand properties: `...(condition && { background: ... })`. NEVER set them to undefined. DOM inspection (`getComputedStyle`) catches this. |
| `.tsx` not `.ts` when a file contains JSX. esbuild errors with "Expected > but found key" on `<span key={i}>` etc. | Always `.tsx` for any React-returning helper. |
| `.pipeline/*/manifest-editor.json` writes during Playwright sessions silently corrupt contractor data. | Always `?nosave=true`; SHA256 byte-identity check post-session. |
| State drift fields (`zOrder` was un-threaded for months until PR #138 fixed it). | When adding any field to `ControlDef`, verify it threads through `storeToManifest` in `PanCanvas.tsx`. PR-4 of the A1 plan adds a unit test that enforces this. |
| Editor and preview using separate render paths for same control type drifts over time (9 parity bugs shipped in May 2026 alone). | If extending rendering, extract a shared component in `src/components/panel/SharedX.tsx` — don't duplicate JSX between ControlNode.tsx and PanelRenderer.tsx. |
| macOS TCC (Privacy → Full Disk Access) can revoke Terminal's access mid-session — symptoms: EPERM on `.pipeline/`, dev server 500. | User must fully quit Terminal + reopen (not just close window). `killall cfprefsd` refreshes daemon but won't re-grant a running process. |
| `git stash` fails with "beyond a symbolic link" when worktrees symlink `.pipeline/` to canonical. | Use `cp <file> /tmp/<file>.bak` instead, or stash only specific tracked files with `git stash push -- <file>`. |
| Worktrees inherit `.pipeline/` from their initial state — fresh worktrees off `test` need a symlink: `rm -rf .pipeline && ln -s "/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.pipeline" .pipeline` |
| `.env.local` is NOT copied into new worktrees automatically — Playwright + dev server need it. | `cp askmiyagi-wt-phase-10/.env.local <new-wt>/.env.local` first thing in any new worktree. |

---

## Historical incidents this prevents

- **2026-05-15**: `git checkout --` on fantom-06 manifest-editor.json
  with no backup. Recovered by re-pulling from contractor's Blob.
  → Question 5 / Recovery section exists because of that.
- **2026-05-15**: PR #121 stacked on PR #120's branch; when #120 merged
  and its branch deleted, #121's merge commit was orphaned. Content
  never reached `test`. → Question 1 (architecture impact) now includes
  "PR base branch — does this depend on another PR? If yes, retarget to
  the parent's parent after that PR merges." See `memory/feedback_pr_base_retargeting.md`.
- **2026-05-13**: Editor↔preview label drift (DEC, INC, SHIFT, EXIT,
  ENTER) on fantom-06. Caused by two independent render paths. →
  Question 1 ("shared core?") is the architectural guard.
- **2026-05-15**: Keyboard overlap detector ignored `controlScale`,
  causing phantom warnings on fantom-06. → Question 4 ("editor/preview
  impact") + always-test-on-fantom-06 rule.
- **2026-05-16**: Three editor bugs shipped to PR #140 — label-position
  after-drag (state branching), circle preview empty (background:
  undefined shorthand bug), z-order missing in preview. → Layer 6 visual
  regression + Layer 3/4 interaction tests now mandatory for editor
  changes.
- **2026-05-16/17**: macOS TCC revoked filesystem access twice mid-
  session. → Recovery section + Layer 7 byte-identity check catches
  partial corruption, gotcha table documents the user-recovery path.
