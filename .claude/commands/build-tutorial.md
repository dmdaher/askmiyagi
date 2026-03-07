# BUILD-TUTORIAL — Complete Single Tutorial Creation

Full lifecycle for creating one tutorial with all quality gates: manual verification → cross-reference → TDD → post-build → verification.

**Trigger:** Creating a single tutorial (not a batch). For batches of 3-5, use `/build-batch` instead.

**Combines:** `/pre-build` → `/cross-ref` → `/tdd-tutorial` → `/post-build` → `/verify`

---

## Phase 1: Manual Verification (PRE-BUILD)

### 1a: Open the Manual
- Reference Manual: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/Roland Fantom-0 Series Reference Manual.pdf`
- Parameter Guide: `FANTOM-06_07_08_Parameter_eng01_W.pdf`
- Sound List: `FANTOM-06_07_08_SoundList_multi01_W.pdf`

### 1b: Answer These Questions (with evidence)
1. **Manual pages read:** p.__ to p.__
2. **Screenshot shows:** [describe layout, elements, visual hierarchy]
3. **Access path:** [exact button sequence, e.g., "Press [MENU] > Touch <ZONE EDIT>"]
4. **E-knob assignments:** E1=__, E2=__, E3=__, E4=__, E5=__, E6=__
5. **Screen catalog cross-ref:** checked `docs/fantom-08-screens/[chapter].md` — [what it said vs what manual adds]
6. **Parameters verified:** [list names, ranges from Parameter Guide]
7. **Tone names verified:** [list names, verified against Sound List or existing tutorials]
8. **YOU read the manual:** [confirm — agent summaries are NOT acceptable]

### 1c: Review Canonical Example
Read `src/data/tutorials/fantom-08/split-keyboard-zones.ts` — this is the template for all tutorials.

---

## Phase 2: Cross-Reference All UI Data

For every piece of data that will appear in the UI:

### Tone Names
- [ ] Verified against Sound List PDF or existing tutorials
- Known verified: "Concert Grand", "Acoustic Bass", "Full Strings", "Saw Lead 1", "Standard Kit 1"
- NEVER invent a tone name

### Control IDs
- [ ] All IDs verified against `allFantom08ControlIds` in `src/data/panelLayouts/fantom-08.ts`
- Invalid IDs silently fail — no error, just no highlight

### E-Knob Assignments
- [ ] E1-E6 assignments verified for EACH screen shown (they change per screen)
- Check manual's per-screen "Menu/Explanation" table

### Highlighted Controls
- [ ] Each highlighted control matches what the user would PHYSICALLY TOUCH in that screen mode
- Mixer screen: zone buttons for selection, NOT sliders
- PAN/LEVEL mode: sliders ARE correct
- Ask: "what would the user touch right now?"

### LED States
- [ ] `ledOn: true` ONLY on buttons with LEDs:
  - zone-1..8, pan-level, ctrl, split, chord-memory, arpeggio, write, play, stop, rec, pad-1..16
- [ ] No `ledOn` on: transpose, octave, scene-select, zone-view, zone-select, assign, menu, tempo, master-fx, motional-pad, daw-ctrl, single-tone, scene-chain, synth-mode buttons, tone-cat buttons, cursor buttons, sampling, pad-mode, etc.
- [ ] No text claims ("lights up", "LED glows") for non-LED buttons

### Zone Colors
- [ ] Using `ZONE_COLOR_MAP` from constants
- [ ] Zones 9-16 wrap: `((num-1)%8)+1`

---

## Phase 3: TDD Cycle

### Step 1: Update Test
Edit `src/__tests__/tutorials/fantom08Tutorials.test.ts`:
- Add `'tutorial-id': N` to `expectedStepCounts`
- Update total count: `expect(fantom08Tutorials.length).toBe(CURRENT + 1)`
- Add description string

### Step 2: Verify Test Fails
```bash
npm run test
```
Must FAIL — tutorial doesn't exist yet.

### Step 3: Create Tutorial File
Create `src/data/tutorials/fantom-08/[name].ts`:

```typescript
import { Tutorial } from '@/types/tutorial';

export const varName: Tutorial = {
  id: '[name]',              // MUST match filename
  deviceId: 'fantom-08',
  title: 'Title',
  description: 'One-liner',
  category: '[category]',   // basics, zones-splits, sound-design, effects, midi, performance, sequencer, sampling, mixer, scene-editing
  difficulty: '[level]',     // beginner, intermediate, advanced
  estimatedTime: 'X min',
  tags: ['tag1', 'tag2'],
  steps: [/* ... */],
};
```

**Critical rules:**
- Panel state is CUMULATIVE (activate → deactivate when leaving)
- Every step needs UNIQUE displayState
- `menuItems: [{ label: 'X' }]` not `['X']`
- Realistic instructions: "Press the MENU button" not "Navigate to menu"
- Control IDs must be valid
- LED claims only on LED buttons

### Step 4: Register in index.ts
Edit `src/data/tutorials/fantom-08/index.ts`:
- Import: `import { varName } from './[name]';`
- Array: add to `fantom08Tutorials`
- Export: `export { varName } from './[name]';`

### Step 5: Verify Test Passes + Build
```bash
npm run test && npm run build
```
All tests pass, zero errors.

### Step 6: Commit
```bash
git add src/data/tutorials/fantom-08/[name].ts src/data/tutorials/fantom-08/index.ts src/__tests__/tutorials/fantom08Tutorials.test.ts
git commit -m "feat(tutorials): add [name] — [description]"
```

---

## Phase 4: Post-Build Verification

### Build & Tests (paste ACTUAL output)
1. `npm run build` — "Compiled successfully"
2. `npm run test` — "X passed, 0 failed"
3. `codeQuality.test.ts` — PASS

### Registration Complete
- [ ] Tutorial file at correct path
- [ ] Imported in index.ts
- [ ] In fantom08Tutorials array
- [ ] Named export added
- [ ] Test step count added
- [ ] Total count updated
- [ ] Description in test

### Tutorial-Specific Quality
- [ ] Panel state cumulative (no orphaned active controls)
- [ ] Every step has unique displayState
- [ ] All control IDs valid
- [ ] All LED claims accurate (only on LED buttons)
- [ ] All tone names verified
- [ ] Highlighted controls match screen context
- [ ] menuItems format correct (`{ label }` objects)

### Evidence
```
BUILD-TUTORIAL Evidence:
━━━━━━━━━━━━━━━━━━━━━━━
Tutorial: [id]
Steps: [N]
Category: [category]
Difficulty: [level]

Build:  [PASS] — Compiled successfully
Tests:  [PASS] — [X] passed, 0 failed
Quality: codeQuality.test.ts PASS

Registration: all 7 items complete
Panel state: cumulative ✓
DisplayState: unique per step ✓
LED claims: accurate ✓
Tone names: verified ✓
Control IDs: valid ✓
━━━━━━━━━━━━━━━━━━━━━━━
```
