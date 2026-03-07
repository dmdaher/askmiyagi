# PRE-BUILD Quality Gate

Complete this gate BEFORE writing any implementation code for a screen, tutorial, or feature. Every question requires a specific, evidence-based answer — not "yes I did it" but "here's the proof."

**Trigger:** Starting any new screen, tutorial, or feature implementation.

---

## Step 1: Reference Validation

Answer ALL of the following with specific evidence:

1. **Which manual pages did you read?**
   - List the specific page numbers from the Reference Manual PDF or Parameter Guide PDF
   - Manual path: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/`
   - Reference Manual: `Roland Fantom-0 Series Reference Manual.pdf` (185 pp.)
   - Parameter Guide: `FANTOM-06_07_08_Parameter_eng01_W.pdf` (102 pp.)
   - Sound List: `FANTOM-06_07_08_SoundList_multi01_W.pdf`
   - If you haven't opened the PDF yet, STOP and open it now

2. **What does the manual screenshot show?**
   - Describe the actual screen layout from the manual screenshot
   - What elements are visible? What's the visual hierarchy?
   - If there's no screenshot, note which pages describe the feature in text

3. **What is the exact access path?**
   - How does the user reach this screen on the real hardware?
   - Which buttons/menus in what order?
   - Example: "Press [MENU] > Touch <ZONE EDIT>" or "Hold [SHIFT] + press [SPLIT]"

4. **Which E-knobs and controls are active in this screen?**
   - The manual's "Menu/Explanation" table lists which E1-E6 knobs do what
   - List them — they vary per screen
   - Example: "E1: Type, E2: Depth, E3: Rate, E4: Pre-Delay, E5: —, E6: Level"

## Step 2: Cross-Reference

5. **Did you cross-reference the screen catalog AND the manual?**
   - Screen catalog location: `docs/fantom-08-screens/` (8 chapter files + master index)
   - The catalog is a summary — the manual has visual details the catalog misses
   - What did the catalog say? What did the manual add?
   - You need BOTH sources together for accuracy

6. **What parameter names, ranges, and defaults did you verify?**
   - Check the Parameter Guide PDF for exact values
   - Every parameter has a defined range (e.g., Level: 0-127, Pan: L64-0-R63)
   - List specific parameters you'll use

7. **Are tone names verified?**
   - Check against existing tutorials: `src/data/tutorials/fantom-08/`
   - Or verify against Sound List PDF
   - NEVER invent a tone name — this is a documented error pattern
   - Known correct names used across tutorials: "Concert Grand", "Acoustic Bass", "Full Strings", "Saw Lead 1", etc.

## Step 3: Manual Reading Verification

8. **Did YOU personally read the manual pages?**
   - Agent-generated summaries of manual content are NOT acceptable
   - Agents hallucinate visual details about hardware screens
   - You MUST read the PDF pages yourself and describe what you see
   - If you delegated manual reading to a subagent, STOP and read the pages now
   - Subagents CAN: search codebase, check control IDs, run tests, explore existing tutorials
   - Subagents MUST NOT: read manual PDFs, describe screen layouts, determine E-knob assignments

## Step 4: Codebase Check

9. **What existing patterns will you reuse?**
   - Check these directories FIRST before writing anything new:
     - `src/components/controls/` — Knob, Slider, PadButton, PanelButton, etc.
     - `src/lib/constants.ts` — DISPLAY_COLORS, ZONE_COLORS, ZONE_COLOR_MAP, PANEL_COLORS
     - `src/hooks/` — useTutorialEngine, usePanelState, useDisplayState
     - `src/types/` — device, tutorial, panel, keyboard, display types
   - List specific files you'll use

10. **Does a similar component already exist?**
    - Search the display directory and related files
    - Extend existing code rather than duplicating
    - Use `Glob` with patterns like `**/*Screen.tsx`, `**/*Section.tsx`

11. **Did you present an ASCII layout to the user?**
    - For ANY visual component, design in the terminal first with ASCII art
    - Get user approval BEFORE writing code
    - Example format:
    ```
    ┌─────────────────────────────────────────┐
    │ ◄ SCREEN NAME                           │
    ├────┬────┬────┬────┬────────────────────┤
    │ C1 │ C2 │ C3 │ C4 │    [Right Panel]   │
    ├────┴────┴────┴────┴────────────────────┤
    │ [Footer with controls/status]           │
    └─────────────────────────────────────────┘
    ```

---

## Critical Reminders

**From lessons learned (19 documented patterns):**
- NEVER hardcode hex colors — use `DISPLAY_COLORS`, `ZONE_COLORS`, or `ZONE_COLOR_MAP` from `@/lib/constants`
- NEVER invent tone names — verify against Sound List PDF or existing tutorials
- NEVER delegate manual PDF reading to agents — they hallucinate screen layouts
- `menuItems` MUST use `{ label: string }` objects, NOT plain strings
- Panel state is CUMULATIVE — each step builds on previous steps
- Every step needs a UNIQUE `displayState` — use `statusText`, `selectedIndex`, or `menuItems` to differentiate
- Tutorial `id` MUST match filename (minus `.ts` extension)
- Control IDs must exist in `allFantom08ControlIds` — check `src/data/panelLayouts/fantom-08.ts`
- Only these buttons have LEDs: zone-1..8, pan-level/ctrl/split/chord-memory/arpeggio, write, play/stop/rec, pad-1..16. Everything else has NO LED.
- Before creating ANY file, search first — check immediate directory, parent dirs, and iCloud mirror

**Canonical tutorial example:** `src/data/tutorials/fantom-08/split-keyboard-zones.ts`

**If you cannot answer any question with evidence, you are not ready to implement. Go back and gather the evidence.**
