# FULL-AUDIT — Comprehensive Content Verification

Audit ALL existing tutorials against the reference manual. Checks every LED claim, tone name, button interaction, E-knob assignment, parameter range, and screen layout across the entire tutorial library.

**Trigger:** When accuracy of existing content needs comprehensive verification. Especially after discovering a systematic error pattern.

**Combines:** `/audit-tutorial` (×N) → `/gap-analysis` → `/verify` → `/self-improve`

**Reference:** `docs/plans/2026-03-02-early-batch-tutorial-audit.md` — the audit that fixed 34 false LED claims across 10 tutorial files.

---

## Phase 1: Preparation

### 1a: Establish Reference Materials

**PDFs (iCloud mirror):**
```
/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/
```
- Reference Manual: `Roland Fantom-0 Series Reference Manual.pdf` (185 pp.)
- Parameter Guide: `FANTOM-06_07_08_Parameter_eng01_W.pdf` (102 pp.)
- Sound List: `FANTOM-06_07_08_SoundList_multi01_W.pdf`

**LED Reference (from `src/data/panelLayouts/fantom-08.ts`):**
| Group | Buttons with LEDs |
|-------|-------------------|
| Zone | zone-1 through zone-8 |
| Zone function | pan-level, ctrl, split, chord-memory, arpeggio |
| Common | write |
| Transport | play (green), stop (red), rec (red) |
| Pads | pad-1 through pad-16 |
| **EVERYTHING ELSE** | **NO LED** |

Non-LED buttons include: transpose, octave-down/up, scene-select, zone-view, zone-select, zone-9-16, assign, menu, tempo, master-fx, motional-pad, daw-ctrl, single-tone, scene-chain, all synth-mode buttons, all tone-cat buttons, all cursor buttons, sampling, pad-mode, clip-board, bank, hold, shift, enter, exit, dec, inc, display, all knobs, all sliders, value dial, wheels.

### 1b: List All Tutorials to Audit
```bash
ls src/data/tutorials/fantom-08/*.ts | grep -v index
```

### 1c: Group by Manual Chapter for Efficient Reading
| Phase | Tutorials | Manual Pages | Focus |
|---|---|---|---|
| 1 | Zones, splits, panel, sliders, pedals | pp. 7-42 | Zones, controls, LED behavior |
| 2 | Scenes, tones, save, search, display, quick-edit | pp. 13-26 | Navigation, browsing |
| 3 | Tone editing, effects, mixer | pp. 47-78 | Sound design, effects chain |
| 4 | Sampling, wave edit, pad modes, multisample | pp. 79-107 | Sampling workflow |
| 5 | Sequencer, piano roll, groups, songs | pp. 108-140 | Sequencer operations |
| 6 | Arpeggio, chord memory, scene chain, system | pp. 39-51, 141-173 | Performance, system |

---

## Phase 2: Per-Phase Audit

For each phase, follow this process:

### 2a: Read Manual Pages (PRE-BUILD)
- Open the Reference Manual to the pages listed for this phase
- Read completely — don't skim
- Document: button interactions, LED behavior, screen access paths, E-knob assignments, parameter names/ranges

### 2b: Audit Each Tutorial

For EVERY step in EVERY tutorial in this phase, check:

**Button Interactions:**
- [ ] Correct physical interaction described (press vs hold vs hold+press vs touch screen)
- [ ] Correct access path (button sequence)

**LED Claims:**
- [ ] `ledOn: true` or `ledColor` only on LED buttons (see reference table)
- [ ] No text claims ("lights up", "LED glows", "stays lit") for non-LED buttons

**E-Knob Assignments:**
- [ ] E1-E6 correct for each screen shown (they change per screen)

**Tone Names:**
- [ ] Verified against Sound List PDF or existing verified tutorials

**Parameter Names & Ranges:**
- [ ] Verified against Parameter Guide

**Panel State:**
- [ ] Cumulative (activate when used, deactivate when leaving)
- [ ] No orphaned active controls

**Display State:**
- [ ] Unique per step (even same screen type must differ)
- [ ] `menuItems: [{ label: 'X' }]` format

### 2c: Fix Issues
- Fix each tutorial file
- Update test step counts if changed
- Commit per tutorial: `fix(tutorials): audit [id] against manual pp.X-Y`
- If no changes: `audit(tutorials): verify [id] — no changes needed`

### 2d: POST-BUILD Gate
- `npm run build` — zero errors
- `npm run test` — all pass (paste evidence)
- Code review if changes were significant

---

## Phase 3: Global Audits

After all per-tutorial audits are complete:

### 3a: Global LED Audit
```bash
grep -rn 'ledOn: true' src/data/tutorials/fantom-08/
```
For EVERY match:
- Extract the button name from context
- Check against LED reference table
- If no LED → BUG → fix
- Report: "X instances checked, Y bugs found, Z fixed"

### 3b: Global Tone Name Audit
Extract every tone name from all tutorials. For each:
1. Search existing verified tutorials for the same name
2. If not found, verify against Sound List PDF
3. Report: "X names checked, Y verified, Z flagged"

### 3c: Global Text Claim Audit
```bash
grep -rn 'lights up\|LED\|glows\|goes dark\|button lit\|stays lit' src/data/tutorials/fantom-08/
```
For each match:
- Verify the button has an LED
- If not → fix the text
- Report: "X text claims checked, Y accurate, Z fixed"

### 3d: Global menuItems Audit
```bash
grep -rn "menuItems:" src/data/tutorials/fantom-08/ | head -20
```
Verify all use `[{ label: 'X' }]` format, not `['X']`.

### 3e: Global Control ID Audit
Extract all control IDs from `highlightedControls` and `panelStateChanges`. Verify each exists in `allFantom08ControlIds`.

---

## Phase 4: Gap Analysis

Run `/gap-analysis`:
- Cross-reference all manual sections against tutorials
- Update coverage doc
- Document any new gaps

---

## Phase 5: Verification & Self-Improvement

### Run `/verify`
```
FULL-AUDIT Evidence:
━━━━━━━━━━━━━━━━━━━━━━━
Tutorials audited: [N]
Issues found: [N]
Issues fixed: [N]
LED claims checked: [N] — [N] fixed
Tone names checked: [N] — [N] verified
Text claims checked: [N] — [N] fixed
menuItems format: [all correct / N fixed]
Control IDs: [all valid / N fixed]

Build:  [PASS] — [output]
Tests:  [PASS] — [X passed, 0 failed]
Quality: codeQuality.test.ts PASS
━━━━━━━━━━━━━━━━━━━━━━━
```

### Run `/self-improve`
- What systematic patterns were found?
- Should new automated tests be added to catch these?
- Update `tasks/lessons.md` with any new error patterns
- Update quality gate commands if new checks needed

---

## Phase 6: Hardware Spot-Check (Optional)

If real hardware is available, spot-check 5 tutorials:
- Select tutorials with the most complex multi-step interactions
- Follow each step on the real device
- Mark PASS/FAIL per step
- Document discrepancies

See `tasks/hardware-spot-check.md` for the existing spot-check template covering:
1. `split-keyboard-zones` — split workflow
2. `four-zone-setup` — complex zone creation
3. `sampling-basics` — multi-screen sampling workflow
4. `arpeggio-setup` — arpeggiator parameters
5. `effects-routing` — effects signal path

---

## Lessons from Previous Full Audit

The 2026-03-02 audit found:
- **34 false LED claims** across 10 tutorial files
- Multiple fabricated system parameter lists
- Guessed hardware interactions (transpose-octave used wrong button sequence)
- Tone names that couldn't be verified

These are now documented in `tasks/lessons.md` as patterns #17, #18, #19.
