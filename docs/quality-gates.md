# Quality Gates

Mandatory checkpoints for every Claude instance working on this project. These gates enforce the #1 rule: **accuracy over speed**.

Each gate has questions that must be answered **with evidence** — not "yes I did it" but "here's the proof." If you can't provide evidence for a question, you haven't completed the gate.

> **Context**: These gates apply at every phase of building a complete digital twin — panel design, screen implementation, tutorial creation, and feature work. See `tasks/lessons.md` for the correction pattern catalog that these gates are designed to prevent.

---

## Gate 1: PRE-BUILD (Before implementing any screen, tutorial, or feature)

Complete this gate BEFORE writing any code. Every question requires a specific answer.

### Reference Validation
1. **Which manual pages did you read?** — List the specific page numbers from the device's reference manual or parameter guide that cover this feature. If you didn't open the PDF, stop and open it now.
2. **What does the manual screenshot show?** — Describe the actual screen layout from the manual. What elements are visible? What's the visual hierarchy? If there's no screenshot, note which pages describe the feature.
3. **What is the exact access path?** — How does the user reach this screen on the real hardware? Which buttons/menus in what order?
4. **Which controls are active in this screen?** — The manual specifies which knobs, buttons, and faders do what per screen. List them. They vary per screen/mode.

### Cross-Reference
5. **Did you cross-reference the screen catalog AND the manual?** — The screen catalog is a summary. The manual has visual details the catalog misses. You need both. What did the catalog say? What did the manual add?
6. **What parameter names, ranges, and defaults did you verify?** — List specific parameters from the device's parameter guide. Don't guess ranges or default values.
7. **Are preset/sound names verified?** — If the feature references preset names, verify them against the device's sound list documentation. Never invent preset names.

### Manual Reading Verification
8. **Did YOU personally read the manual pages?** — Agent-generated summaries of manual content are not acceptable. You must read the PDF pages yourself and describe what you see. If you delegated this to an agent, stop and read the pages now.

### Codebase Check
9. **What existing patterns will you reuse?** — Which components, utilities, constants, or hooks already exist that apply? List specific files.
10. **Does a similar component already exist?** — Search first. Extend existing code rather than duplicating.
11. **Did you present an ASCII layout to the user?** — For any visual component, design in the terminal first with ASCII art. Get user approval before writing code.

---

## Gate 2: POST-BUILD (Before claiming work is done)

Complete this gate AFTER implementation. Every answer must include the actual command output or evidence.

### Build Verification
1. **Does `npm run build` pass?** — Run it. Paste the result showing "Compiled successfully" and zero TypeScript errors. No paraphrasing — show the output.
2. **Does `npm run test` pass?** — Run it. State the exact count: "X tests passed, 0 failed." Don't say "should pass" — run it and confirm.
3. **Did you check the dev server visually?** — If applicable, confirm the component renders. Describe what you see.

### Registration Completeness
4. **Is the new screen type registered everywhere?** — For new screen types, check ALL required registration points for the device (ScreenType union, renderScreen switch, screenTitle switch, validScreenTypes test array, component import). Missing any one will cause test failures.
5. **Are all new types/fields documented?** — Did you add comments explaining new fields in type interfaces?

### Code Quality
6. **Did you use shared constants?** — Colors and magic numbers should come from the device's constants file. Zero hardcoded hex colors in display components.
7. **Did you follow existing patterns?** — Check font sizing, animation patterns, and directive conventions used elsewhere in the codebase.
8. **Is there any code duplication?** — Search for similar logic in other components. If you copied patterns, should they be extracted to a shared utility?
9. **Did the automated quality tests pass?** — Run `npm run test` and check that `codeQuality.test.ts` passes with zero violations.

---

## Gate 3: CORRECTION (After any mistake or user correction)

Complete this gate IMMEDIATELY when corrected. Do not continue building until this is done.

### Understand
1. **What was the exact mistake?** — State it clearly and specifically. Not "I made an error" but describe the specific wrong thing.
2. **What was the root cause?** — Why did this happen? Was it a knowledge gap, a process skip, an assumption, or carelessness?
3. **Was this mistake caught before or could it have been caught?** — Did a test catch it? Could a test have caught it? Did you skip a gate question that would have prevented it?

### Fix
4. **What rule prevents this in the future?** — Write a specific, actionable rule. Not "be more careful" but a concrete check.
5. **Where did you record this rule?**
   - [ ] Added to `CLAUDE.md` Corrections & Lessons Learned section
   - [ ] Added to `tasks/lessons.md` pattern catalog
   - [ ] Updated `memory/MEMORY.md` (if it's a recurring pattern)

### Prevent
6. **Can an automated test catch this?** — If yes, write the test and add it to `codeQuality.test.ts`. If no, explain why.
7. **Does this change any gate question?** — Should a new question be added to PRE-BUILD or POST-BUILD to prevent this class of mistake?

---

## Gate 4: CROSS-REFERENCE (For any data that appears in the UI)

Use this gate whenever you're writing data that will be displayed — preset names, parameter values, control assignments, screen layouts.

1. **Are preset/sound names verified?** — Check against the device's official sound list documentation. Never invent a preset name.
2. **Are parameter ranges verified?** — Check the device's parameter guide. Every parameter has a defined range and default.
3. **Are control IDs verified?** — Check against the device's panel layout data file. Invalid control IDs will fail tests silently (no highlight) or explicitly.
4. **Are control assignments correct for THIS screen?** — The manual specifies which controls do what per screen. Assignments change between screens. Verify the assignments for the specific screen/mode.
5. **Are highlighted controls contextually correct?** — In tutorial steps, which controls are highlighted must match what the user would actually interact with in that specific screen/mode.
6. **Do colors follow the device's color scheme?** — Use constants from the device's constants file. No hardcoded hex values in display components.

---

## Gate 5: SELF-IMPROVEMENT (After completing any major feature)

Reflect on the implementation process to improve for next time.

1. **What went well?** — What parts of the process worked efficiently? What patterns or conventions made things easier?
2. **What was harder than expected?** — Were there surprises? Ambiguities in the manual? Missing data? Unexpected complexity?
3. **Did you make any assumptions that should have been verified?** — List any moment where you proceeded without full certainty. Were those assumptions correct?
4. **Is there a reusable pattern you discovered?** — Should it be documented or extracted into a shared utility?
5. **What would you tell the next Claude instance?** — If another instance picks up similar work, what's the one thing they should know that isn't already documented?
6. **Should the quality gates be updated?** — Based on this experience, are there new questions that should be added, or existing ones that should be refined?
7. **Are the memory files current?** — Does `memory/MEMORY.md` reflect the latest state of the project? Are there stale entries that should be updated?

---

## Quick Reference: When to Use Each Gate

| Trigger | Gate |
|---------|------|
| Starting any new screen implementation | PRE-BUILD |
| Starting any new tutorial | PRE-BUILD + CROSS-REFERENCE |
| About to say "done" or "complete" | POST-BUILD |
| User corrects a mistake | CORRECTION |
| Writing preset names, parameter values, control highlights | CROSS-REFERENCE |
| Finishing a major feature or milestone | SELF-IMPROVEMENT |
| Unsure if you should verify | **Always verify** |

---

## The Bottom Line

**No claims without evidence. No designs without manual pages. No completion without verification.**

When in doubt: slow down, open the PDF, read the page, cross-reference, and verify. Speed without accuracy wastes everyone's time.
