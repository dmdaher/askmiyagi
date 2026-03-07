# POST-BUILD Quality Gate

Complete this gate AFTER implementation, BEFORE claiming work is done. Every answer must include actual command output or evidence — not paraphrases, not "should pass", not "I believe it works."

**Trigger:** About to say "done", "complete", "finished", or ready to commit/merge.

---

## Step 1: Build Verification

1. **Does `npm run build` pass?**
   - Run it NOW. Paste the result showing "Compiled successfully" and zero TypeScript errors
   - Do not paraphrase — show the actual output
   - If it fails, fix errors before continuing this gate

2. **Does `npm run test` pass?**
   - Run it NOW. State the exact count: "X tests passed, 0 failed"
   - Do not say "should pass" — run it and confirm
   - If tests fail, fix them before continuing this gate
   - Expected baseline: 675+ tests (as of 2026-02-28)

3. **Did you check the dev server visually?**
   - If applicable, confirm the component renders correctly
   - Describe what you see on screen
   - For tutorials: verify the tutorial plays through from start to finish

## Step 2: Registration Completeness

4. **Is every new item registered everywhere it needs to be?**

   **For new tutorials, ALL of these are required:**
   - [ ] Tutorial file created: `src/data/tutorials/fantom-08/<name>.ts`
   - [ ] Import added to `src/data/tutorials/fantom-08/index.ts`
   - [ ] Added to `fantom08Tutorials` array in index.ts
   - [ ] Named export added: `export { varName } from './<name>';`
   - [ ] Test step count added: `expectedStepCounts['<id>'] = N` in `src/__tests__/tutorials/fantom08Tutorials.test.ts`
   - [ ] Total tutorial count updated in test file
   - [ ] Description string added to descriptions test array

   **For new ScreenTypes, ALL 5 of these are required:**
   - [ ] Added to `ScreenType` union in `src/types/display.ts`
   - [ ] Added switch case in `renderScreen()` in `DisplayScreen.tsx`
   - [ ] Added to `screenTitle()` switch in `DisplayScreen.tsx` (SEPARATE from renderScreen!)
   - [ ] Added to `validScreenTypes` array in `src/__tests__/tutorials/fantom08Tutorials.test.ts`
   - [ ] Import statement added in `DisplayScreen.tsx`

5. **Are all new types/fields documented?**
   - Did you add comments explaining new fields in type interfaces?

## Step 3: Code Quality

6. **Did you use shared constants?**
   - ALL display colors from `DISPLAY_COLORS` in `@/lib/constants`
   - ALL zone colors from `ZONE_COLORS` or `ZONE_COLOR_MAP` in `@/lib/constants`
   - ZERO hardcoded hex colors anywhere in display components
   - The `codeQuality.test.ts` will catch violations, but check proactively

7. **Did you follow existing patterns?**
   - [ ] `'use client'` directive on all interactive components
   - [ ] `font-mono` for all LCD/display text
   - [ ] `text-[10px]` or `text-[11px]` for display text sizes
   - [ ] Framer Motion stagger animations: `delay: i * 0.03`
   - [ ] CSS variables for backgrounds: `var(--background)`, `var(--accent)`, `var(--card-bg)`, `var(--surface)`

8. **Is there any code duplication?**
   - Search for similar logic in other components
   - If you copied patterns, should they be extracted to a shared utility?
   - `ZONE_COLOR_MAP` must ONLY be in `constants.ts` — never duplicate it

9. **Did the automated quality tests pass?**
   - Run `npm run test` and confirm `codeQuality.test.ts` passes with zero violations
   - This test enforces:
     - All ScreenType values registered in DisplayScreen.tsx and test validScreenTypes
     - All display components imported and have 'use client'
     - No hardcoded hex colors in display components
     - No duplicate utility definitions

## Step 4: Tutorial-Specific Checks (if applicable)

10. **Panel state is cumulative?**
    - Each step builds on previous steps' state changes
    - When a control is activated in step N, it stays active until explicitly deactivated
    - When leaving a screen, deactivate controls that were active for that screen
    - Common mistake: setting `menu: { active: true }` in step 3 but not `menu: { active: false }` when navigating away

11. **Every step has unique displayState?**
    - Even two steps on the same screen type MUST differ
    - Use `statusText`, `selectedIndex`, or different `menuItems` to differentiate
    - Common mistake: two consecutive steps with identical `screenType: 'menu'` and same `menuItems`

12. **LED claims are accurate?**
    - Only these buttons have LEDs: zone-1..8, pan-level, ctrl, split, chord-memory, arpeggio, write, play, stop, rec, pad-1..16
    - `ledOn: true` or `ledColor` on any other button is a BUG
    - Text claims like "lights up", "LED glows", "stays lit" for non-LED buttons is a BUG
    - Use `active: true` (visual highlight only) for non-LED buttons

13. **Highlighted controls match the real workflow context?**
    - Which controls are highlighted must match what the user would actually interact with in that specific screen/mode
    - Example: mixer screen highlights zone buttons for selection, NOT sliders for volume
    - Verify against manual's E-knob and control assignment tables

---

## Evidence Template

Copy and fill in:

```
POST-BUILD Evidence:
- Build: [paste "Compiled successfully" line]
- Tests: [X tests passed, 0 failed]
- New registrations: [list what was registered where]
- Quality tests: codeQuality.test.ts [PASS/FAIL]
- Visual check: [describe what renders]
```

**If any check fails, fix it before claiming done. This gate is not optional.**
