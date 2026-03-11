You are main-agent. Build a new instrument digital twin in this codebase.

---

Build a visual exact replica of the [INSTRUMENT-NAME] [INSTRUMENT-TYPE] panel as a new
device in this existing multi-device music studio codebase. No need for all the tutorials
or sounds. Focus on perfecting everything: the look, the layout, the sizing of all
components, and the elimination of all unintentional dead space. Make one tutorial as an
instrument overview so the page is accessible.

1. AGENTIC PIPELINE REQUIREMENTS
Make sure that before you run the app for me to try, all agents including subagents
(orchestrator, panel-questioner, structural-inspector, gatekeeper, critic) have approved
and confirmed they each have implemented, reviewed, and tested the app fully. They must
drive the web browser locally to test every single component of the instrument before you
ask me to try. It needs to work absolutely flawlessly.
You are forbidden from submitting the work to me unless every agent reaches a minimum
score of 9.5/10.

2. CONTEXT & ASSETS
Use Git repo: https://github.com/dmdaher/askmiyagi.git
Create feature/[instrument-id] from test. All PRs target test, never main.

The manual PDF and instrument image are at:
docs/[Manufacturer]/[Instrument]/
If not found there, recursively search the entire docs/ folder for any PDF or image
matching the instrument name. Read them before doing anything else. Note exact labels,
groupings, and physical arrangement.

3. ARCHITECTURAL DECISION
BEFORE writing any code:

1. Read the manual. Map every control, section, and label. Note whether the device
   has a display — implement it if yes, skip it if no.

2. Evaluate the existing types (src/types/panel.ts, src/types/display.ts) against
   this device before using them. They were shaped by Fantom-08 and may not fit.

3. The PanelLayout type has x/y positions designed for a data-driven renderer that
   was never built — Fantom uses hand-coded JSX instead
   (src/components/devices/fantom-08/FantomPanel.tsx). Evaluate which approach is
   better for this instrument and state your decision before writing code.
   DO NOT choose hand-coded only because Fantom did it. Pick the best option to
   achieve the best visual result.

4. Register the device the same way the RC-505 MK2 was added (it was the second device
   added after Fantom-08 — follow that same pattern) in src/data/devices.ts and
   src/app/tutorial/[deviceId]/[tutorialId]/page.tsx.

4. FINAL VALIDATION
It is imperative you load the dev server to visually compare to the image using your
skills. Do not allow a failed dev server to stop you — rerun it and recheck until you
are 99% sure everything is flawless.

Use Playwright MCP to open the browser and see your work. Check and validate again and
again until perfection. Use the Claude browser to cross-check, and Playwright via CLI
as a fallback if one of those fails.

Before asking me to review:
- npm run test must pass
- npm run build must pass
- Confirm the page loads and panel renders on the dev server
- Every agent must score 9.5/10 or higher

When the build feels complete, trigger the orchestrator to run the full QA pipeline.
You are forbidden from delivering until all agents score 9.5/10 or higher.
Take your time — this should be a minimum 1-2 hours.
