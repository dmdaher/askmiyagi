# Lessons Learned — Correction Pattern Catalog

> Append new patterns when mistakes are corrected. Each entry captures: what went wrong, why, and how to prevent it. Referenced by the CORRECTION gate in `docs/quality-gates.md`.

---

## Pattern: Hardcoded Hex Colors in Display Components

- **Mistake**: Used raw hex values like `#ff4444` or `#00ff00` directly in display component JSX instead of shared constants.
- **Root cause**: Assumed inline colors were acceptable for one-off styling. Didn't check existing constants first.
- **Prevention rule**: Always use `DISPLAY_COLORS`, `ZONE_COLORS`, or `ZONE_COLOR_MAP` from `@/lib/constants`. Never write a hex color literal in any display component.
- **Automated check**: `codeQuality.test.ts` — scans all display component files for hardcoded hex patterns.

---

## Pattern: Invented Tone Names

- **Mistake**: Used plausible-sounding but fabricated tone names (e.g., "Grand Piano 1") instead of verifying the exact name from the Sound List PDF.
- **Root cause**: Working from memory or general knowledge instead of opening the source document.
- **Prevention rule**: Every tone name in a tutorial must be verified against existing tutorials in `src/data/tutorials/fantom-08/` or the Sound List PDF (`FANTOM-06_07_08_SoundList_multi01_W.pdf`). Never invent a tone name.
- **Automated check**: Manual — cross-reference during CROSS-REFERENCE gate (Gate 4, question 1).

---

## Pattern: Delegating Manual PDF Reading to Agents

- **Mistake**: Asked a subagent to "read manual pages X-Y and summarize the screen layout" — the agent described a plausible but inaccurate screen layout based on general knowledge of synthesizer UIs.
- **Root cause**: Tried to save time by parallelizing research. Manual content requires direct reading because agents hallucinate visual details.
- **Prevention rule**: Never delegate manual PDF reading to agents. Screen layouts, parameter tables, E-knob assignments, and access paths must come from direct PDF reading in the main context. Agents can search codebase, run tests, check IDs — but not interpret manual content.
- **Automated check**: Manual — PRE-BUILD gate question 8 ("Did YOU personally read the manual pages?").

---

## Pattern: Forgotten ScreenType Registration

- **Mistake**: Added a new `ScreenType` value to the union type but forgot to add it to `screenTitle()` (a separate switch statement from `renderScreen()` in DisplayScreen.tsx).
- **Root cause**: Thought "register in DisplayScreen" meant one place, but there are TWO switch statements (renderScreen + screenTitle) plus the import.
- **Prevention rule**: When adding a new ScreenType, complete ALL 5 items: (1) ScreenType union in types, (2) renderScreen() case, (3) screenTitle() case, (4) validScreenTypes test array, (5) import in DisplayScreen.tsx.
- **Automated check**: `codeQuality.test.ts` — validates all ScreenType values have corresponding switch cases and test entries.

---

## Pattern: Non-Cumulative Panel State

- **Mistake**: Step 4 activated `menu: { active: true }` but Step 5 (which navigated to a different screen) didn't include `menu: { active: false }`, leaving the menu button visually active when it shouldn't be.
- **Root cause**: Treated each step's `panelStateChanges` as independent rather than cumulative. Each step builds on all previous steps' state.
- **Prevention rule**: Panel state is CUMULATIVE. When a control is activated in step N, it stays active until explicitly deactivated in a later step. When leaving a screen, deactivate controls that were active for that screen.
- **Automated check**: Manual — code-reviewer agent catches "orphaned active controls" as its #1 finding.

---

## Pattern: Identical DisplayState Across Steps

- **Mistake**: Two consecutive steps both had `screenType: 'menu'` with the same `menuItems` array. The tutorial engine couldn't differentiate between them visually.
- **Root cause**: Focused on the instruction text and forgot that each step needs a visually distinct display state.
- **Prevention rule**: Every step needs a UNIQUE `displayState`. Even two steps on the same screen type must differ. Use `statusText`, `selectedIndex`, or different `menuItems` to differentiate.
- **Automated check**: Manual — code-reviewer agent catches "identical displayState across steps" as its #2 finding.

---

## Pattern: menuItems as Plain Strings

- **Mistake**: Wrote `menuItems: ['Option A', 'Option B']` instead of `menuItems: [{ label: 'Option A' }, { label: 'Option B' }]`.
- **Root cause**: Assumed menuItems was a string array based on intuition. Didn't check the `Tutorial` type definition.
- **Prevention rule**: `menuItems` MUST use `{ label: string }` objects, not plain strings. The TypeScript `Tutorial` type enforces this — always check `src/types/tutorial.ts`.
- **Automated check**: TypeScript compiler — type error on assignment.

---

## Pattern: Contextually Wrong Control Highlights

- **Mistake**: In a mixer tutorial step, highlighted `slider-1` through `slider-8` for volume control. But the mixer screen has its own volume faders — the physical sliders aren't what the user interacts with on that screen.
- **Root cause**: Assumed physical controls map 1:1 to screen functions. Didn't check the manual's per-screen control assignment table.
- **Prevention rule**: Highlighted controls must match what the user would actually interact with in the specific screen/mode shown. Check the manual's E-knob and control assignment tables for the specific screen.
- **Automated check**: Manual — CROSS-REFERENCE gate question 5 ("Are highlighted controls contextually correct?").

---

## Pattern: File Already Exists

- **Mistake**: Created a new `CLAUDE.md` file without searching first, duplicating one that already existed in a parent directory.
- **Root cause**: Only checked the immediate directory, not parent directories or the iCloud mirror.
- **Prevention rule**: Before creating ANY new file, search broadly: immediate directory, subdirectories, parent directories, and related working directories (including iCloud mirror). Use Glob with `**/<filename>` pattern.
- **Automated check**: Manual — always search before creating.

---

## Pattern: Tutorial ID / Filename Mismatch

- **Mistake**: Named the file `file-management-deep-dive.ts` but set `id: 'file-management'` inside the tutorial object.
- **Root cause**: Shortened the ID for convenience without checking the convention.
- **Prevention rule**: Tutorial `id` must exactly match the filename (minus `.ts` extension). `file-management-deep-dive.ts` → `id: 'file-management-deep-dive'`.
- **Automated check**: Tutorial test — validates ID matches expected key in `expectedStepCounts`.

---

## Pattern: CSS Transform Doesn't Change Layout Size

- **Mistake**: Applied `overflow-hidden` to a container expecting the CSS `transform: scale(0.7)` on the inner panel would make it physically smaller. The panel was clipped instead of fitting.
- **Root cause**: `transform: scale()` only changes *visual* rendering — the element still occupies its original layout size (2700px). The DOM doesn't know about the visual scaling.
- **Prevention rule**: When scaling with CSS transform, always use an explicit visual-size wrapper (`width: naturalWidth * scale, height: naturalHeight * scale, overflow: hidden`) to contain the layout footprint. The transform goes on an inner div; the wrapper defines the space it occupies.
- **Automated check**: Manual — verify the 3-layer nesting pattern: outer container → visual-size wrapper → scaled inner div.

---

## Pattern: Nested Scroll Containers Cause Confusion

- **Mistake**: Debugged panel overflow in `TutorialRunner.tsx` for multiple iterations without realizing `FantomPanel.tsx` has its OWN `overflow-x-auto` wrapper with a 2700px `minWidth` child. Two scroll containers = unpredictable behavior.
- **Root cause**: Only inspected the immediate parent component, not the full DOM hierarchy down to the rendered panel.
- **Prevention rule**: When debugging overflow or scroll issues, trace the FULL component tree from the scrolling element down to the content. Search for ALL `overflow` properties in the chain. Use `grep 'overflow' <file>` on every component in the render path.
- **Automated check**: Manual — when touching scroll/overflow, grep the full component chain.

---

## Pattern: overflow-hidden Clips, Doesn't Fix

- **Mistake**: Changed `overflow-x-auto` to `overflow-hidden` thinking it would "fix" panel overflow. Instead, it clipped the right side of the panel — pad buttons were invisible with no way to scroll to them.
- **Root cause**: Treated `overflow-hidden` as a sizing solution when it's a visibility property. If content genuinely overflows, hidden just makes the overflow invisible.
- **Prevention rule**: `overflow-hidden` is for cosmetic clipping (hiding animation artifacts, rounding edges). If content overflows because it's too wide, you must either shrink the content or expand the container. Never use `overflow-hidden` to "fix" a layout that doesn't fit.
- **Automated check**: Manual — when changing overflow, ask: "does the content actually fit, or am I just hiding the problem?"

---

## Pattern: Localhost vs Production Layout Differences

- **Mistake**: Panel fit perfectly on localhost but overflowed on Vercel production. Assumed pixel-perfect layout would transfer between environments.
- **Root cause**: Production differences eat viewport width — vertical scrollbar (~17px), Vercel analytics widgets, different font rendering, browser chrome variations. `window.innerWidth` includes scrollbar width but the actual content area is smaller.
- **Prevention rule**: Never assume localhost layout = production layout. For scaling calculations, budget a small margin (e.g., `* 0.99`) to absorb environment differences. The ResizeObserver measures the actual container width correctly, but the initial render uses `window.innerWidth` which can be misleading.
- **Automated check**: Manual — test on production after any layout/scaling changes. Don't trust localhost alone.

---

## Pattern: Scale Adjustment vs Overflow Property Wrestling

- **Mistake**: Spent multiple iterations changing overflow properties (auto → hidden → auto → hidden on FantomPanel too) trying to fix panel overflow. The simplest fix was adjusting the scale factor by 1%.
- **Root cause**: Focused on the symptom (overflow) instead of the simplest lever (scale). The panel has a clean scaling system — adjusting scale is a 1-line change that definitively solves the problem.
- **Prevention rule**: When a component has a scaling/sizing system, adjust the scale first before fighting with CSS overflow. Scale changes are predictable and easy to reason about. Overflow property changes cascade unpredictably through nested containers.
- **Automated check**: Manual — ask "is there a scale/size parameter I can adjust?" before touching overflow.

---

## Pattern: Overlapping Zone Labels in KeyboardZoneOverlay

- **Mistake**: `KeyboardZoneOverlay` renders zone bars with absolute positioning inside a shared container. When two zones have the same note range (layering — both A0-C8), their labels overlap and become unreadable.
- **Root cause**: The component was designed for split zones (non-overlapping ranges) and never tested with layered zones (identical ranges).
- **Prevention rule**: Any component that positions items by range/value must handle the overlap case. For zone overlays, stack overlapping zones vertically instead of overlapping them. Always test with layering tutorials, not just split tutorials.
- **Automated check**: Manual — visually verify `layering-zones` and `four-zone-setup` tutorials after any KeyboardZoneOverlay changes. **Status: OPEN BUG — not yet fixed.**

---

## Pattern: Guessed Hardware Interaction Instead of Verifying Manual

- **Mistake**: Wrote the transpose-octave tutorial steps 5-7 describing a "Value dial" interaction to change transpose value. The actual Fantom 08 procedure is: hold [TRANSPOSE] + press Octave [UP/DOWN] (manual p.38). Also wrote that the transpose button lights up — it has no LED.
- **Root cause**: Assumed transpose works like most other synths (menu + dial). Did not read manual page 38 before writing. The early batches (A/B) had weaker manual-verification enforcement than later batches.
- **Prevention rule**: EVERY button interaction in a tutorial must be verified against the specific manual page. "How does button X work?" is never safe to answer from general synth knowledge. Also verify whether a button has an LED before writing `active: true` in panelStateChanges or mentioning "button lights up" in text.
- **Automated check**: Manual — PRE-BUILD gate question 8 ("Did YOU personally read the manual pages?"). Consider adding a post-batch validation step: test each tutorial on real hardware if available.

---

## Pattern: False LED Claims on Non-LED Buttons

- **Mistake**: Used `ledOn: true` / `ledOn: false` in `panelStateChanges` for buttons that have no physical LED, and wrote text claims like "the LED lights up" for non-LED buttons. Found 34 instances across 10 tutorial files during the Phase 7 global audit.
- **Root cause**: Assumed all panel buttons have LEDs. The early/mid batches lacked a centralized LED reference. Only 5 button groups have LEDs per `panelLayouts/fantom-08.ts`: zone-1..8, pan-level/ctrl/split/chord-memory/arpeggio, write, play/stop/rec, and pad-1..16. All other buttons (sampling, daw-ctrl, pad-mode, assign, bank, clip-board, hold, zone-select, scene-chain, motional-pad, etc.) have NO LED.
- **Prevention rule**: Before writing `ledOn` in panelStateChanges or mentioning "LED", "lights up", or "stays lit" in text, check `src/data/panelLayouts/fantom-08.ts` for `hasLed: true` on that button. Use `active: true` (visual highlight only) for non-LED buttons.
- **Automated check**: Phase 7 global LED audit grep: `grep 'ledOn: true' tutorials/` → verify every match against the LED reference table. Consider adding a test that validates `ledOn` is only used on buttons with `hasLed: true` in the panel layout.

---

## Pattern: Fabricated System Parameter Lists

- **Mistake**: Wrote `system-and-file-management.ts` step 3 listing 17 System tab names that were completely fabricated (CONTROL, USB/BLUETOOTH, DISPLAY, METRONOME, ASSIGN1, ASSIGN2, TONE EDIT, BANK). The actual manual (p.164) lists: GENERAL, KEYBOARD, PEDAL, WHEEL 1/2, S1/S2, SLIDER, KNOB, USB, MIDI, SOUND, SYNC/TEMPO, SEQUENCER, CLICK, NOTE PAD, CONTROL, LICENSE, INFO.
- **Root cause**: Written from general synth knowledge without verifying the exact tab structure against the manual. The tab count (17) was correct but the names were wrong.
- **Prevention rule**: System-level parameter lists, menu structures, and tab names must be copied verbatim from the manual. Never invent or guess menu item names, even if you know the count. A correct count with wrong names is worse than no list at all.
- **Automated check**: Manual — PRE-BUILD gate question 5 ("Are parameter names verified against the Parameter Guide?").

---

## Pattern: Circular Validation (Gatekeeper Template Bias)

- **Mistake**: All QA agents validated against the Gatekeeper's template instead of independently verifying against the hardware. The Gatekeeper described the PROG rotary encoder below the LCD. All agents scored 10/10. The encoder should have been to the RIGHT of the LCD.
- **Root cause**: Anchor bias — once the Gatekeeper says something is correct, downstream agents validate against the template, not the source material. The PQ read the Gatekeeper first, anchoring its assessment.
- **Prevention rule**: PQ must generate its own position map from photos/manual BEFORE reading the Gatekeeper template (Adversarial Blindness Protocol). Gatekeeper must produce ASCII map + coarse grid + cardinal neighbors so there are 3 independent representations to cross-check.
- **Automated check**: Orchestrator cross-modality consistency check — compares Gatekeeper's cardinal neighbors against PQ's independent position map. Disagreement = HALT.

---

## Pattern: Inventory Checking Instead of Topology Verification

- **Mistake**: 3 rounds of QA passed the CDJ-3000 RIGHT-TEMPO section while 6 of 11 controls overflowed the section boundary. Agents checked "does the button exist?" and "does the label match?" but never checked "is the button inside its section?"
- **Root cause**: Inventory checks are computationally cheaper than topology checks. Agents default to the easy check. No rule required topology verification before scoring.
- **Prevention rule**: Agents must produce a Cardinal Neighbor Table (N/S/E/W for all controls) BEFORE scoring. Checking font-size, color, or padding before topology = Priority Inversion = automatic (-3.0) deduction. Orchestrator scans for styling keywords before topology is verified.
- **Automated check**: Orchestrator Priority Inversion detection — rejects scores that mention styling keywords without a completed Cardinal Neighbor Table.

---

## Pattern: Label Overflow (Boundary Violation)

- **Mistake**: PQ scored 10/10 on CDJ-3000 RIGHT-TEMPO despite "BEAT SYNC/INST.DOUBLES" text overflowing the 32px button face. PQ dismissed it as "still legible."
- **Root cause**: PQ's rubric had no explicit deduction for label overflow. "Legible" is too low a bar. Physical hardware never has text spilling outside a button.
- **Prevention rule**: Any label/icon that overflows its container = (-1.0) Boundary Violation. "Still legible" is NOT sufficient. Fix by resizing container, reducing font, using labelPosition="above" (silkscreen style), or multi-line treatment.
- **Automated check**: SI measures all label bounding rects against section boundaries. Critic can veto PQ scores that miss overflows.

---

## Pattern: Skipped QA Pipeline (Throughput Over Process)

- **Mistake**: CDJ-3000 panel was built and 18 tutorials were created without running Gatekeeper, SI, PQ, or Critic. The orchestrator agent was never invoked. QA was run after the fact and found the panel scored 0.0/5.5.
- **Root cause**: The orchestrating agent optimized for speed and skipped every gate. The pipeline is documented but there's nothing that forces compliance without the orchestrator.
- **Prevention rule**: The Orchestrator is the ROOT PROCESS. No QA agent runs without orchestrator managing phase transitions. Standalone runs are "draft only" and cannot vault. Design phases must complete before tutorial phases. User must approve panel visually before tutorials are built.
- **Automated check**: Tutorial-builder pre-conditions must verify critic checkpoint exists with score ≥9.5 before proceeding.

---

## Pattern: Sieve Extraction (Hallucination Over Long Manual Reads)

- **Mistake**: Manual extractor paraphrased parameter names and fabricated menu structures when reading large page ranges. Context drift over 89+ page manuals causes the agent to "remember" details incorrectly.
- **Root cause**: Reading and interpreting simultaneously over large volumes. By the time the agent processes page 80, details from page 20 are fading from context.
- **Prevention rule**: Separate Perception from Cognition. Read in 10-page buckets: Sieve (raw extraction) → Verify (re-read same pages) → Anchor (cross-reference constants) → Checkpoint. Only after the entire manual is sieved does the agent design curriculum.
- **Automated check**: Manual extractor checkpoint must include per-bucket verification status. Coverage auditor independently verifies.

---

## Pattern: Textual Gravity (Vertical-Stack Bias in Template Writing)

- **Mistake**: RIGHT-TEMPO section was written as a vertical stack (single column of controls) when the hardware clearly shows a 2-column grid layout with a fader below. The Gatekeeper's text-based template writing defaulted to listing controls top-to-bottom, which the Panel Builder interpreted as a single column.
- **Root cause**: When an LLM writes a template (text output), it naturally serializes controls top-to-bottom — the structure of text itself creates a vertical bias. A 2D grid arrangement gets compressed into a 1D list, losing the horizontal relationships. This is "Textual Gravity" — text pulls everything into a vertical stack because text IS a vertical stack.
- **Prevention rule**: The Gatekeeper no longer writes templates. The Diagram Parser extracts 2D geometry from photos (centroids, grids), the Gatekeeper reconciles text+geometry into a manifest with archetype selections, and the Layout Engine (a deterministic TypeScript script) maps archetypes to CSS. No LLM writes layout templates.
- **Automated check**: Layout Engine throws LayoutEngineError for unknown archetypes. Three-Point Validation (topology, ordinal, proportional) catches manifest-vs-geometry mismatches before any code is written.

---

## Pattern: Creator-Critic Conflict (Judge Who Also Creates)

- **Mistake**: The Gatekeeper was both JUDGING data (reconciling manual text with photos) AND CREATING output (writing section templates, ASCII maps, CSS architecture). When conflicts arose between text and geometry, the Gatekeeper "smoothed" — resolving ambiguity by hallucinating plausible layouts instead of flagging the conflict.
- **Root cause**: A single agent performing both judgment and creation has an incentive to smooth conflicts rather than flag them, because flagging means admitting uncertainty (which feels like failure), while smoothing produces a complete output (which feels like success). The judge and creator roles have conflicting objectives.
- **Prevention rule**: Full Split Architecture — the Gatekeeper is the JUDGE (reconciliation only, selects archetypes from a fixed library, flags conflicts). The Layout Engine is the CREATOR (deterministic script, maps archetypes to CSS, cannot smooth because it's a switch statement). Neither role can leak into the other.
- **Automated check**: Gatekeeper SOUL has a (-1.0) deduction for "Contains ASCII maps, CSS decisions, or section templates (JUDGE BOUNDARY VIOLATION)". Layout Engine throws hard errors for unknown archetypes. Orchestrator validates manifest against Parser geometry before Layout Engine runs.

---

## Pattern: Accountant's Trap (Inventory Without Topology)

- **Mistake**: 3 rounds of QA passed CDJ-3000 RIGHT-TEMPO while 6 of 11 controls overflowed the section boundary. Agents checked "does the button exist?" and "does the label match?" (inventory) but never checked "is the button inside its section?" or "are buttons in the right spatial arrangement?" (topology). The agents were accountants counting inventory, not inspectors checking structure.
- **Root cause**: Inventory checks are computationally cheap and produce high scores quickly. Topology checks require spatial reasoning (comparing centroids, verifying grid alignment) which is harder. Without an explicit rule requiring topology BEFORE inventory, agents default to the easy check and score high.
- **Prevention rule**: Agents must produce a Cardinal Neighbor Table (N/S/E/W for all controls) BEFORE scoring any other dimension. The Orchestrator scans agent outputs for styling keywords (font-size, color, padding) appearing before topology is verified — if found, it's a Priority Inversion and the score is invalidated. The Critic has a Physical Impossibility Veto that catches topology errors the other agents missed.
- **Automated check**: Orchestrator Priority Inversion detection — rejects scores that mention styling keywords without a completed Cardinal Neighbor Table. Critic's Physical Impossibility Veto is a (-5.0) deduction per instance with automatic pipeline halt.

---

## Pattern: Wrong LED Color (Unchecked Hardware Assumption)

- **Mistake**: CDJ-3000 MASTER TEMPO LED was coded as green (`CDJ_COLORS.ledGreen`). Hardware uses orange/amber — visually distinct from the blue sync group LEDs. No agent caught this in 3 QA rounds.
- **Root cause**: LED color was assumed, not verified against hardware. Standard QA checked "does the LED exist?" not "is it the right color?"
- **Prevention rule**: Every LED color must be verified against hardware photos or manual descriptions. The Critic deep review specifically checks LED colors against hardware. Different functional groups should use visually distinct LED colors.
- **Automated check**: Critic includes LED color verification in its per-control audit. Panel builder must document LED color source (manual page or photo) for each LED.
