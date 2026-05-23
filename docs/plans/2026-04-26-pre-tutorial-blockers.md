# Plan: Pipeline LED Style Detection + Dual-Label Fix

## Context

Two issues to address:
1. **Pipeline agents don't detect `ledStyle`** — The gatekeeper outputs `hasLed`, `ledColor`, `ledVariant`, `ledPosition`, `ledBehavior` but has no concept of `ledStyle: 'integrated' | 'dot'`. This means every new instrument requires manual correction of LED styles after pipeline extraction.
2. **Dual-label indicator can't edit both parts** — The dual-label LED (e.g., VINYL/CDJ) splits `control.label` on `/` to get top/bottom text. But the label editor is a single text field, and if the label uses `\n` instead of `/`, the split breaks.

## Part 1: Add `ledStyle` to Pipeline Type System

### Add `LEDStyle` type to `src/types/manifest.ts`

```typescript
export type LEDStyle = 'integrated' | 'dot';
```

Add to `ManifestControl` interface:
```typescript
ledStyle?: LEDStyle;
```

This makes `ledStyle` flow through the pipeline → gatekeeper → layout engine → editor, not just exist in the editor's ControlDef.

**File:** `src/types/manifest.ts`

## Part 2: Update Gatekeeper SOUL

The gatekeeper SOUL at `~/.claude/agents/gatekeeper.md` has LED instructions at lines 215-216. Add `ledStyle` detection guidance:

```markdown
- `ledStyle`: `'integrated'` if manual says "button lights up" / "illuminates" / button face changes color. 
  `'dot'` if a separate physical LED indicator sits above/below the button. 
  Default to `'integrated'` for transport buttons (PLAY, CUE), performance pads (HOT CUE), 
  and mode toggles (SLIP, QUANTIZE, SYNC). Default to `'dot'` for synth knobs/faders with LED rings.
```

**File:** `~/.claude/agents/gatekeeper.md`

## Part 3: Update Checkpoint Validators

In `src/lib/pipeline/checkpoint-validators.ts`, add validation that when `hasLed === true`, `ledStyle` should be set. Don't deduct points (it's enrichment), but log a warning.

**File:** `src/lib/pipeline/checkpoint-validators.ts`

## Part 4: Fix Dual-Label Editing + Rendering

### Problem
The dual-label LED (e.g., VINYL/CDJ indicator) has one `label` field that gets split on `/` to produce top and bottom text. The Properties panel only shows a single label text field — the contractor can't edit the top and bottom parts independently.

### Fix: Two Separate Label Fields for Dual-Label LEDs

When a control has `ledVariant === 'dual-label'`, show two text inputs in the Properties panel instead of one:

```
Top Label:  [VINYL    ]
Bottom Label: [CDJ      ]
```

Store as `label: "VINYL/CDJ"` (joined with `/`). The two inputs read from `label.split('/')` and write back as `topValue + '/' + bottomValue`.

**File:** `src/components/panel-editor/PropertiesPanel/index.tsx` — in `SingleControlProperties`, detect `ledVariant === 'dual-label'` and render two inputs instead of `<LabelEditor>`.

### Fix: Splitter Handles Both `/` and `\n`

Update the dual-label renderer to split on both `/` and `\n` for backwards compat:
```typescript
const parts = control.label.split(/[\/\n]/).map(s => s.trim()).filter(Boolean);
```

**Files:** `src/components/panel-editor/ControlNode.tsx`, `src/components/controls/PanelRenderer.tsx`

## Files to Modify

| File | Change |
|------|--------|
| `src/types/manifest.ts` | Add `LEDStyle` type, add `ledStyle` to ManifestControl |
| `~/.claude/agents/gatekeeper.md` | Add `ledStyle` detection rules |
| `src/lib/pipeline/checkpoint-validators.ts` | Add `ledStyle` warning when `hasLed` is true but `ledStyle` missing |
| `src/components/panel-editor/ControlNode.tsx` | Fix dual-label split to handle `\n` |
| `src/components/controls/PanelRenderer.tsx` | Same dual-label split fix |
| `src/components/panel-editor/PropertiesPanel/index.tsx` | Two separate label inputs for dual-label LEDs |

## Part 5: Pre-Tutorial Blockers — LED State Wiring

These must be done before CDJ-3000 (or any manifest-based) tutorials can show LED feedback.

### 5a. Integrated LED responds to `ledOn`

**Problem:** PanelButton's integrated glow (`ledStyle: 'integrated'`) is a static dim tint. It doesn't change when `ledOn=true` in panelState. Tutorials need buttons to visibly light up.

**Fix:** In PanelButton.tsx, make `integratedGlow` conditional on `ledOn`:
```typescript
const integratedGlow = (ledStyle === 'integrated' && hasLed && ledColor) ? {
  backgroundColor: ledOn ? `${ledColor}40` : `${ledColor}18`,
  border: `1px solid ${ledOn ? ledColor : `${ledColor}50`}`,
  boxShadow: ledOn
    ? `0 0 10px ${ledColor}80, inset 0 0 6px ${ledColor}40`
    : `0 0 6px ${ledColor}40, inset 0 0 3px ${ledColor}20`,
} : undefined;
```

**File:** `src/components/controls/PanelButton.tsx`

### 5b. LED indicators respond to `ledOn`

**Problem:** PanelRenderer's LED/indicator controls (dual-label, dot, bar) are hardcoded "always on". They ignore `ledOn` from panelState.

**Fix:** In PanelRenderer.tsx `renderControl`, the `case 'led'` / `case 'indicator'` block receives `ledOn` as a parameter but never uses it. Wire it:

- **dual-label:** When `ledOn=false`, swap which row is lit (bottom becomes active). Or when `ledOn=true` show top lit, `ledOn=false` show bottom lit.
- **dot:** When `ledOn=false`, show dimmed dot (`backgroundColor: '#333'`).
- **bar:** When `ledOn=false`, show dimmed bar.

**File:** `src/components/controls/PanelRenderer.tsx`

### 5c. Circle button integrated LED responds to `ledOn`

**Problem:** Same as 5a but for circle buttons rendered directly in PanelRenderer (not via PanelButton).

**Fix:** In PanelRenderer.tsx circle button case, make the integrated glow conditional on `ledOn`.

**File:** `src/components/controls/PanelRenderer.tsx`

### Existing blockers (from MEMORY.md, still pending)

- **PanelRenderer: displayState** — wire screen content so tutorials show live display (~100 LOC)
- **PanelRenderer: zones** — wire keyboard zone coloring for split/layer tutorials (~30 LOC)

## All Pre-Tutorial Blockers Summary

| Blocker | Status | Effort |
|---------|--------|--------|
| displayState for screens | Pending (memory/project_panelrenderer_displaystate.md) | ~100 LOC |
| Keyboard zone coloring | Pending (memory/project_panelrenderer_zones.md) | ~30 LOC |
| Integrated LED responds to ledOn | **NEW** — not tracked | ~10 LOC |
| LED indicators respond to ledOn | **NEW** — not tracked | ~30 LOC |
| Circle button integrated LED | **NEW** — not tracked | ~5 LOC |
| CDJ-3000 editor sizing | DONE (fixed this session) | — |

## Verification

1. Run gatekeeper on a test instrument → manifest includes `ledStyle` field
2. Dual-label indicator renders correctly with both `VINYL/CDJ` and `VINYL\nCDJ` labels
3. Existing instruments unaffected (ledStyle defaults to undefined → `'dot'` backwards compat)
4. PanelButton integrated LED brightens when ledOn=true, dims when false
5. LED indicators toggle on/off based on ledOn
6. Dual-label indicator flips active row based on ledOn
