# TDD-TUTORIAL — Single Tutorial TDD Cycle

Create a single tutorial using test-driven development: update test → verify fail → create file → register → verify pass.

**Trigger:** Creating one tutorial for an existing instrument with panel and screens already built.

---

## Prerequisites

- [ ] PRE-BUILD gate completed (manual pages read, evidence gathered) — run `/pre-build` first
- [ ] CROSS-REFERENCE gate completed (tone names, control IDs, E-knobs verified) — run `/cross-ref` first
- [ ] Canonical example reviewed: `src/data/tutorials/fantom-08/split-keyboard-zones.ts`

---

## Step 1: Update the Test File

Edit `src/__tests__/tutorials/fantom08Tutorials.test.ts`:

```typescript
// 1. Add to expectedStepCounts object:
'tutorial-id': N,  // where N = number of steps

// 2. Update total tutorial count in "has correct number of tutorials" test:
expect(fantom08Tutorials.length).toBe(CURRENT_COUNT + 1);

// 3. Add description string to the descriptions test array
```

**Tutorial ID MUST match the filename** (minus `.ts` extension):
- File: `my-tutorial-name.ts` → ID: `my-tutorial-name`
- This is documented error pattern #10

---

## Step 2: Verify Test FAILS

```bash
npm run test
```

**Expected:** The new test should FAIL because the tutorial file doesn't exist yet.

If it doesn't fail, something is wrong with the test setup — investigate before proceeding.

---

## Step 3: Create the Tutorial File

Create `src/data/tutorials/fantom-08/[tutorial-name].ts`:

### Template

```typescript
import { Tutorial } from '@/types/tutorial';

export const tutorialVarName: Tutorial = {
  id: 'tutorial-name',           // MUST match filename
  deviceId: 'fantom-08',
  title: 'Human-Readable Title',
  description: 'One-line description of what this tutorial teaches',
  category: 'basics',            // See categories below
  difficulty: 'beginner',        // beginner | intermediate | advanced
  estimatedTime: '5 min',
  tags: ['tag1', 'tag2'],
  steps: [
    {
      id: 'step-1',
      title: 'Step Title',
      instruction: 'What the user should physically do ("Press the MENU button")',
      details: 'Why this matters and what happens when they do it',
      highlightedControls: ['control-id'],   // Must exist in allFantom08ControlIds
      panelStateChanges: {
        'control-id': { active: true },       // Visual highlight for non-LED buttons
        // OR for LED buttons:
        'zone-1': { active: true, ledOn: true, ledColor: '#4488ff' },
      },
      displayState: {
        screenType: 'home',                   // Must be registered ScreenType
        // Screen-specific fields...
      },
      zones: [],                              // Optional: zone configuration
      tips: ['Optional helpful tip'],          // Optional
    },
    // ... more steps (each MUST have unique displayState)
  ],
};
```

### Categories
| Category | Value | Covers |
|----------|-------|--------|
| Basics | `'basics'` | Navigation, scene selection, basic operations |
| Zones & Splits | `'zones-splits'` | Zone config, keyboard splits, layering |
| Sound Design | `'sound-design'` | Tone editing, oscillators, filters |
| Effects | `'effects'` | MFX, IFX, chorus, reverb |
| MIDI | `'midi'` | MIDI routing, external control |
| Performance | `'performance'` | Live performance features |
| Sequencer | `'sequencer'` | Pattern recording, song mode |
| Sampling | `'sampling'` | Sampling, wave editing |
| Mixer | `'mixer'` | Mixer operations |
| Scene Editing | `'scene-editing'` | Scene-level parameters |

### Critical Rules (Enforced)

**1. Panel state is CUMULATIVE**
- Each step BUILDS on all previous steps' state changes
- Activate controls when used: `{ active: true }`
- Deactivate when leaving: `{ active: false }`
- If step 3 sets `menu: { active: true }` and step 4 navigates away, step 4 MUST set `menu: { active: false }`

**2. Every step needs UNIQUE displayState**
- Even two steps on the same screen MUST differ
- Differentiate using: `statusText`, `selectedIndex`, `menuItems`, `headerText`
- Two consecutive steps with identical displayState = BUG

**3. menuItems format**
```typescript
// WRONG:
menuItems: ['Option A', 'Option B']

// CORRECT:
menuItems: [{ label: 'Option A' }, { label: 'Option B' }]
```

**4. LED buttons only**
Only these buttons can have `ledOn: true` or `ledColor`:
- zone-1 through zone-8
- pan-level, ctrl, split, chord-memory, arpeggio
- write
- play, stop, rec
- pad-1 through pad-16

Everything else: use `active: true` only (visual highlight, no LED claim).

NEVER write "lights up", "LED glows", "stays lit" in text for non-LED buttons.

**5. Control IDs must be valid**
- Check `allFantom08ControlIds` in `src/data/panelLayouts/fantom-08.ts`
- Invalid IDs silently fail to highlight — no error, just nothing happens

**6. Realistic instruction text**
- Describe physical actions: "Press the MENU button", "Turn the Value dial"
- NOT abstract descriptions: "Navigate to the menu"

**7. Highlighted controls must match context**
- In mixer screen: highlight zone buttons for selection, NOT sliders for volume
- In PAN/LEVEL mode: highlighting sliders IS correct
- Always ask: "what would the user physically touch in this screen mode?"

---

## Step 4: Register in index.ts

Edit `src/data/tutorials/fantom-08/index.ts`:

```typescript
// 1. Add import:
import { tutorialVarName } from './tutorial-name';

// 2. Add to fantom08Tutorials array:
export const fantom08Tutorials: Tutorial[] = [
  // ... existing tutorials
  tutorialVarName,
];

// 3. Add named export:
export { tutorialVarName } from './tutorial-name';
```

**ALL THREE are required.** Missing any one will cause test failures.

---

## Step 5: Verify Test PASSES + Build Succeeds

```bash
npm run test
npm run build
```

**Expected:**
- All tests pass (including the new step count test)
- Zero TypeScript errors
- `codeQuality.test.ts` passes

If tests fail, use `superpowers-extended-cc:systematic-debugging`:
1. Investigate — read the error message carefully
2. Pattern analysis — is this a known error pattern from lessons.md?
3. Hypothesis — what specific thing is wrong?
4. Implement fix — fix the root cause, not a symptom

---

## Step 6: Commit

```bash
git add src/data/tutorials/fantom-08/[tutorial-name].ts
git add src/data/tutorials/fantom-08/index.ts
git add src/__tests__/tutorials/fantom08Tutorials.test.ts
git commit -m "feat(tutorials): add [tutorial-name] — [short description]"
```

---

## Quick Checklist

Before moving on, confirm ALL of these:
- [ ] Tutorial file created with correct `Tutorial` type
- [ ] Tutorial `id` matches filename
- [ ] Import added to index.ts
- [ ] Added to `fantom08Tutorials` array
- [ ] Named export added
- [ ] Test step count added (`expectedStepCounts`)
- [ ] Total count updated in test
- [ ] Description added to test
- [ ] `npm run test` — ALL pass
- [ ] `npm run build` — zero errors
- [ ] Panel state cumulative (no orphaned active controls)
- [ ] Every step has unique displayState
- [ ] All control IDs valid
- [ ] All LED claims accurate
- [ ] All tone names verified
