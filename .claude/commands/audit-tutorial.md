# AUDIT-TUTORIAL — Verify Tutorial Against Manual

Audit an existing tutorial step-by-step against the reference manual, checking every hardware interaction, LED claim, tone name, E-knob assignment, and screen layout.

**Trigger:** Verifying existing tutorial content is accurate. Especially important for tutorials written before strict quality gate enforcement.

**Reference:** `docs/plans/2026-03-02-early-batch-tutorial-audit.md` — the comprehensive audit plan that fixed 34 false LED claims across 10 files.

---

## Prerequisites

- [ ] Reference Manual PDF available
- [ ] Parameter Guide PDF available
- [ ] Sound List PDF available
- [ ] LED reference table known (see below)

**PDF paths (iCloud mirror):**
```
/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/
```

---

## Step 1: Read Manual Pages (PRE-BUILD Gate)

For the tutorial being audited, identify which manual pages cover the workflow:
1. Open the Reference Manual to those specific pages
2. Read them completely — don't skim
3. Document:
   - Exact button interactions (press vs hold+press vs simultaneous press vs touch screen)
   - LED behavior (does this button have an LED? what color? when does it light?)
   - Screen access paths (exact button sequence to reach each screen)
   - E-knob assignments (E1-E6 vary per screen — check the "Menu/Explanation" table)
   - Parameter names and ranges (verify against Parameter Guide)
   - Screen layout (what elements appear where)

---

## Step 2: Audit Each Step

For EVERY step in the tutorial, check:

### 2a: Button Interactions
- [ ] Does the tutorial describe the correct physical interaction? (press vs hold vs hold+press)
- [ ] Is the access path correct? (which buttons in what order)
- [ ] Example mistake: "Turn the Value dial to change transpose" when the actual procedure is "Hold [TRANSPOSE] + press Octave [UP/DOWN]"

### 2b: LED Claims
- [ ] Does this step use `ledOn: true` or `ledColor`? If so, is the button in the LED reference table?
- [ ] Does the instruction/details text say "lights up", "LED glows", "stays lit", or "goes dark"?
- [ ] If the button has NO LED, change to `active: true` only and remove LED text claims

**Buttons WITH LEDs (exhaustive list):**
| Group | Buttons |
|-------|---------|
| Zone buttons | zone-1 through zone-8 |
| Zone function | pan-level, ctrl, split, chord-memory, arpeggio |
| Common | write |
| Transport | play, stop, rec |
| Pads | pad-1 through pad-16 |

**EVERYTHING ELSE has NO LED.** Including: transpose, octave-down, octave-up, scene-select, zone-view, zone-select, zone-9-16, assign, menu, tempo, master-fx, motional-pad, daw-ctrl, single-tone, scene-chain, all synth-mode buttons, all tone-cat buttons, all cursor buttons, sampling, pad-mode, clip-board, bank, hold, shift, enter, exit, dec, inc, display, all knobs, all sliders, value dial, wheels.

### 2c: E-Knob Assignments
- [ ] Are E1-E6 assignments correct for each screen shown in this step?
- [ ] E-knob assignments CHANGE between screens — verify from the manual's per-screen table
- [ ] Example mistake: assuming E1 always controls "Type" when it controls different parameters per screen

### 2d: Tone Names
- [ ] Are all tone names verified against the Sound List PDF or existing verified tutorials?
- [ ] Common verified names: "Concert Grand", "Acoustic Bass", "Full Strings", "Saw Lead 1", "Standard Kit 1"
- [ ] If a name can't be verified, flag it

### 2e: Parameter Names & Ranges
- [ ] Are parameter names exact (not paraphrased)?
- [ ] Are parameter ranges correct? (Check Parameter Guide)
- [ ] Example mistake: listing 17 System tab names from memory when the actual tabs are different

### 2f: Panel State
- [ ] Is panel state cumulative? (controls activated when used, deactivated when leaving)
- [ ] Any orphaned active controls? (step N activates but no step deactivates)

### 2g: Display State
- [ ] Does every step have a unique displayState?
- [ ] Do consecutive steps with same screenType differ in statusText, selectedIndex, or menuItems?
- [ ] Are menuItems using `{ label: string }` format (not plain strings)?

### 2h: Screen Layout
- [ ] Does the displayState match what the manual shows for this screen?
- [ ] Are the menu items, tabs, or options listed in the correct order?

---

## Step 3: Fix Issues

For each issue found:
1. Fix the tutorial file
2. Update test step counts if step count changed
3. Run `npm run build` — zero errors
4. Run `npm run test` — all pass
5. Commit: `fix(tutorials): audit [tutorial-id] against manual pp.X-Y`

If no changes needed:
- Commit: `audit(tutorials): verify [tutorial-id] — no changes needed`

---

## Step 4: Global Audits (After All Tutorials Audited)

### LED Audit
```bash
grep -r 'ledOn: true' src/data/tutorials/fantom-08/
```
For every match, verify the button name against the LED reference table. If no LED → BUG.

### Tone Name Audit
Extract every tone name from all tutorials. Cross-reference against Sound List PDF.

### Text Claim Audit
```bash
grep -rn 'lights up\|LED\|glows\|goes dark\|button lit\|stays lit' src/data/tutorials/fantom-08/
```
For each match, verify the button has an LED. If not → fix the text.

---

## Step 5: POST-BUILD Gate

Run `/post-build` after all fixes:
- `npm run build` — paste evidence
- `npm run test` — paste exact count
- All registrations complete

---

## Audit Report Template

```
TUTORIAL AUDIT: [tutorial-id]
Manual pages: pp.XX-YY
━━━━━━━━━━━━━━━━━━━━━━━━
Steps audited: [N]
Issues found: [N]
Issues fixed: [N]

Issues:
1. Step [N]: [description] — [fixed/flagged]
2. Step [N]: [description] — [fixed/flagged]

LED claims checked: [N] — [N] valid, [N] fixed
Tone names checked: [N] — [N] verified, [N] flagged
E-knob assignments: [verified/not applicable]
Panel state: [cumulative check passed/fixed]
DisplayState: [unique check passed/fixed]

Build: [PASS] Tests: [X passed, 0 failed]
━━━━━━━━━━━━━━━━━━━━━━━━
```
