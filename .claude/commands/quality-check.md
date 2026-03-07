# QUALITY-CHECK — Run All Quality Gates

Run every quality gate on the current work in a single pass. Use this when you want to verify everything is solid before committing, merging, or presenting work.

**Trigger:** Before any commit, merge, or PR. When you want comprehensive validation.

**Combines:** `/pre-build` + `/cross-ref` + `/post-build` + `/verify`

---

## Gate 1: PRE-BUILD — Was the Work Properly Researched?

### Reference Validation
- [ ] **Manual pages read?** List specific page numbers from Reference Manual (`Roland Fantom-0 Series Reference Manual.pdf`, 185 pp.) or Parameter Guide (`FANTOM-06_07_08_Parameter_eng01_W.pdf`, 102 pp.)
- [ ] **Manual screenshot described?** Layout, elements, visual hierarchy
- [ ] **Access path documented?** Exact button sequence (e.g., "Press [MENU] > Touch <ZONE EDIT>")
- [ ] **E-knob assignments listed?** E1-E6 per screen from manual's table (they change per screen!)

### Cross-Reference
- [ ] **Screen catalog AND manual checked?** Catalog: `docs/fantom-08-screens/`. Manual adds visual details catalog misses. Both needed.
- [ ] **Parameters verified?** Names, ranges, defaults from Parameter Guide
- [ ] **Tone names verified?** Against Sound List PDF or existing tutorials. Never invented.

### Process
- [ ] **YOU read the manual?** Agents hallucinate screen layouts. Agent-generated summaries unacceptable.
- [ ] **Existing patterns reused?** Checked `components/controls/`, `lib/constants.ts`, `hooks/`, `types/`
- [ ] **No duplicate components?** Searched before creating

---

## Gate 2: CROSS-REFERENCE — Is All UI Data Accurate?

### Data Verification
- [ ] **Tone names** verified against Sound List PDF or existing tutorials
  - Known verified: "Concert Grand", "Acoustic Bass", "Full Strings", "Saw Lead 1", "Standard Kit 1"
- [ ] **Parameter ranges** verified against Parameter Guide (Level: 0-127, Pan: L64-0-R63, etc.)
- [ ] **Control IDs** verified against `allFantom08ControlIds` in `src/data/panelLayouts/fantom-08.ts`
- [ ] **E-knob assignments** correct for EACH specific screen shown
- [ ] **Highlighted controls** match what user would physically touch in this screen mode
  - Mixer: zone buttons for selection, NOT sliders
  - PAN/LEVEL: sliders ARE correct
- [ ] **LED states** accurate:
  - LED buttons: zone-1..8, pan-level, ctrl, split, chord-memory, arpeggio, write, play, stop, rec, pad-1..16
  - Everything else: `active: true` only, no `ledOn`, no "lights up" text
- [ ] **Zone colors** follow formula: `ZONE_COLOR_MAP`, zones 9-16 wrap `((num-1)%8)+1`

---

## Gate 3: POST-BUILD — Does It Actually Work?

### Build Verification (run commands, paste output)

```bash
npm run build
```
- [ ] "Compiled successfully" — zero TypeScript errors (paste output)

```bash
npm run test
```
- [ ] "X passed, 0 failed" — state exact count (paste output)
- [ ] `codeQuality.test.ts` passes — structural consistency verified
- [ ] No test count regression (previous count maintained or increased)

### Registration Completeness
**If new tutorial:**
- [ ] File created at `src/data/tutorials/fantom-08/[name].ts`
- [ ] Imported in `index.ts`
- [ ] Added to `fantom08Tutorials` array
- [ ] Named export added
- [ ] `expectedStepCounts['id'] = N` in test
- [ ] Total count updated in test
- [ ] Description in test

**If new ScreenType:**
- [ ] ScreenType union in `types/display.ts`
- [ ] renderScreen() case in DisplayScreen.tsx
- [ ] screenTitle() case in DisplayScreen.tsx (SEPARATE switch!)
- [ ] validScreenTypes test array
- [ ] Import in DisplayScreen.tsx

### Code Quality
- [ ] Zero hardcoded hex colors — all from `DISPLAY_COLORS`, `ZONE_COLORS`, `ZONE_COLOR_MAP`
- [ ] `'use client'` on all interactive components
- [ ] `font-mono` for LCD text
- [ ] `text-[10px]`/`text-[11px]` for display text
- [ ] Framer Motion animations (stagger: `delay: i * 0.03`)
- [ ] No code duplication (`ZONE_COLOR_MAP` only in constants.ts)

### Tutorial-Specific (if applicable)
- [ ] Panel state cumulative (no orphaned active controls)
- [ ] Every step has unique displayState
- [ ] `menuItems: [{ label: 'X' }]` format
- [ ] Tutorial `id` matches filename
- [ ] Realistic instruction text

---

## Gate 4: VERIFY — Evidence Before Claims

### Required Evidence (copy, fill, present)

```
QUALITY-CHECK Report:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRE-BUILD:
  Manual pages: [list]
  E-knob assignments: [listed per screen]
  Existing patterns reused: [list]

CROSS-REFERENCE:
  Tone names: [N verified, source]
  Control IDs: [all valid ✓/✗]
  LED claims: [all accurate ✓/✗]
  E-knobs per screen: [verified ✓/✗]
  Highlighted controls: [contextual ✓/✗]

POST-BUILD:
  Build:  [PASS/FAIL] — [paste output]
  Tests:  [PASS/FAIL] — [X passed, 0 failed]
  Quality: codeQuality.test.ts [PASS/FAIL]
  Registrations: [complete ✓ / list missing]

VERDICT: [ALL GATES PASS / BLOCKED BY: list]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If ANY gate fails, fix the issue before proceeding. Do not commit, merge, or claim completion with failed gates.**

---

## Quick Decision: Which Gates Apply?

| What you're doing | Gates to run |
|---|---|
| New screen implementation | ALL 4 |
| New tutorial | ALL 4 |
| New feature (non-tutorial) | PRE-BUILD + POST-BUILD + VERIFY |
| Bug fix | POST-BUILD + VERIFY |
| Refactoring | POST-BUILD + VERIFY |
| Documentation only | N/A (but verify build still passes) |
