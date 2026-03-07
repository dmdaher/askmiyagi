# VERIFY — Evidence Checkpoint

The Iron Law: **NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

Don't say "tests pass" — run them and show the output. Don't say "build succeeds" — run it and paste the result. Evidence before assertions, always.

**Trigger:** Before claiming anything is done, fixed, passing, or working. Before committing. Before creating a PR. Before telling the user it's complete.

---

## Step 1: Run Build

```bash
npm run build
```

**Required evidence:** Paste the actual output showing:
- "Compiled successfully" or equivalent success message
- Zero TypeScript errors
- Zero warnings that indicate real problems

**If build fails:** Fix ALL errors before proceeding. Do not skip this.

## Step 2: Run Tests

```bash
npm run test
```

**Required evidence:** Paste the actual test runner output showing:
- Exact count: "X tests passed, 0 failed"
- No skipped tests that shouldn't be skipped
- `codeQuality.test.ts` passes (structural consistency)

**If tests fail:** Fix ALL failures before proceeding. Do not skip this.

**Baseline counts (update as project grows):**
- Total tests: 675+ (as of 2026-02-28)
- Tutorial tests: fantom08Tutorials.test.ts
- Quality tests: codeQuality.test.ts

## Step 3: Verify No Regressions

- Previous test count is maintained or INCREASED
- No tests were deleted or skipped to make the suite pass
- If test count decreased, explain WHY and confirm it's intentional

## Step 4: Registration Check (if applicable)

If you added new content, verify registration is complete:

**New tutorial:**
- [ ] File exists at correct path
- [ ] Imported in index.ts
- [ ] Added to array in index.ts
- [ ] Named export added
- [ ] Test step count added
- [ ] Total count updated
- [ ] Description added to test

**New ScreenType:**
- [ ] In ScreenType union (`types/display.ts`)
- [ ] In renderScreen() switch (`DisplayScreen.tsx`)
- [ ] In screenTitle() switch (`DisplayScreen.tsx`)
- [ ] In validScreenTypes test array
- [ ] Import added in DisplayScreen.tsx

## Step 5: Paste Evidence

**Required format — copy, fill in, and present:**

```
VERIFICATION EVIDENCE:
━━━━━━━━━━━━━━━━━━━━━
Build:  [PASS/FAIL] — [paste key output line]
Tests:  [PASS/FAIL] — [X passed, 0 failed]
Quality: codeQuality.test.ts [PASS/FAIL]
Regressions: [none / describe]
Registrations: [all complete / N/A]
━━━━━━━━━━━━━━━━━━━━━
```

---

## What NOT To Do

- Do NOT say "tests should pass" without running them
- Do NOT say "I verified" without showing the output
- Do NOT say "build succeeds" without pasting proof
- Do NOT claim "no regressions" without comparing counts
- Do NOT mark a task complete without this evidence
- Do NOT push code without this evidence
- Do NOT create a PR without this evidence

**If you catch yourself about to claim something works without evidence, STOP and run the commands.**
