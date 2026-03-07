# CORRECTION Gate

Complete this gate IMMEDIATELY when the user corrects a mistake. Do NOT continue building until every step is done. Corrections are opportunities to prevent entire classes of future errors.

**Trigger:** The user corrects any mistake, points out an error, or says something is wrong.

---

## Step 1: Understand the Mistake

1. **What was the exact mistake?**
   - State it clearly and specifically
   - NOT "I made an error" — instead: "I hardcoded #ff4444 instead of using DISPLAY_COLORS.mute" or "I used ledOn: true on the sampling button which has no LED"
   - Be precise about the file, line, and incorrect value

2. **What was the root cause?**
   - Knowledge gap: didn't know a convention or rule existed
   - Process skip: knew the rule but skipped verification
   - Assumption: guessed instead of checking the manual/code
   - Carelessness: rushed through without attention to detail
   - Be honest — identifying the true root cause is how we prevent recurrence

3. **Was this mistake catchable earlier?**
   - Did a test catch it? Which test?
   - Could a test have caught it? What test would detect this?
   - Did you skip a gate question that would have prevented it?
   - Was this pattern already documented in `tasks/lessons.md`? If so, you should have caught it

## Step 2: Fix and Record

4. **What specific, actionable rule prevents this in the future?**
   - NOT "be more careful" — that's not actionable
   - Instead: "always grep display components for hardcoded hex colors before committing"
   - Or: "before writing ledOn, check hasLed in src/data/panelLayouts/fantom-08.ts"
   - The rule must be concrete enough that a different Claude instance could follow it mechanically

5. **Record the rule in ALL of these locations:**

   **a) `tasks/lessons.md` — Add a new pattern entry:**
   ```markdown
   ---

   ## Pattern: [Descriptive Name]

   - **Mistake**: [Exactly what went wrong]
   - **Root cause**: [Why it happened]
   - **Prevention rule**: [Specific actionable rule]
   - **Automated check**: [Test name or "Manual — [gate question]"]
   ```

   **b) `CLAUDE.md` — Add to Corrections & Lessons Learned section:**
   - One-line summary of the lesson
   - This ensures every future Claude instance sees it immediately

   **c) `memory/MEMORY.md` — Update if it's a recurring pattern:**
   - Only if this is a pattern that affects ongoing work, not a one-off

## Step 3: Prevent Recurrence

6. **Can an automated test catch this?**
   - If YES: write the test and add it to `src/__tests__/codeQuality.test.ts`
   - Examples of testable patterns:
     - Hardcoded hex colors → regex scan of display files
     - Missing ScreenType registrations → compare type union vs switch cases
     - Invalid control IDs → check against allFantom08ControlIds
     - ledOn on non-LED buttons → cross-reference panel layout hasLed
   - If NO: explain why and note which manual gate question covers it

7. **Does this change any quality gate question?**
   - Should a new question be added to PRE-BUILD or POST-BUILD?
   - Should an existing question be refined to be more specific?
   - If yes, update the relevant `/pre-build` or `/post-build` command file

## Step 4: Verify the Fix

8. **Fix the actual mistake in the code**
   - Make the correction
   - Run `npm run build` — zero errors
   - Run `npm run test` — all tests pass
   - If you added a new test, verify it catches the original mistake (test with the old code first if possible)

---

## Existing Patterns to Check Against

Before recording a new pattern, check if it already exists in `tasks/lessons.md`. There are currently 19 documented patterns:

1. Hardcoded hex colors in display components
2. Invented tone names
3. Delegating manual PDF reading to agents
4. Forgotten ScreenType registration (5 places)
5. Non-cumulative panel state
6. Identical DisplayState across steps
7. menuItems as plain strings (must be `{label}` objects)
8. Contextually wrong control highlights
9. File already exists (search before creating)
10. Tutorial ID/filename mismatch
11. CSS transform doesn't change layout size
12. Nested scroll containers
13. overflow-hidden clips, doesn't fix
14. Localhost vs production layout differences
15. Scale adjustment vs overflow property wrestling
16. Overlapping zone labels (OPEN BUG)
17. Guessed hardware interaction
18. False LED claims on non-LED buttons
19. Fabricated system parameter lists

**If the mistake matches an existing pattern, note that you failed to check lessons.md before implementing. The root cause is then "process skip" — the prevention rule existed but wasn't consulted.**

---

## Correction Template

Copy and fill in:

```
CORRECTION Report:
- Mistake: [specific description]
- Root cause: [knowledge gap / process skip / assumption / carelessness]
- Prevention rule: [specific actionable rule]
- Recorded in: [lessons.md / CLAUDE.md / MEMORY.md]
- Automated test: [added to codeQuality.test.ts / not possible because...]
- Gate update: [added question to /pre-build or /post-build / not needed]
- Fix verified: build [PASS] tests [PASS]
```

**Do not continue building until this gate is complete. A correction is a gift — it means the user caught something we should have caught ourselves.**
