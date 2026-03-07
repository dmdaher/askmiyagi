# CROSS-REFERENCE Gate

Use this gate whenever writing data that will be displayed in the UI — tone names, parameter values, control assignments, screen layouts, menu items, button labels, LED states.

**Trigger:** Writing any data that appears in the UI, especially in tutorial steps (highlightedControls, panelStateChanges, displayState, instruction text).

---

## Check 1: Tone Names

**Are tone names verified?**

- Check against existing tutorials in `src/data/tutorials/fantom-08/` first
- Cross-reference with Sound List PDF: `FANTOM-06_07_08_SoundList_multi01_W.pdf`
- NEVER invent a tone name — this is documented error pattern #2

**Known verified tone names (used across tutorials):**
- A.Piano: "Concert Grand", "Grand Piano 1"
- E.Piano: "Classic EP 1"
- Organ: "Full Draw Organ"
- Bass: "Acoustic Bass", "Finger Bass"
- Strings: "Full Strings", "Strings Sect 1"
- Synth: "Saw Lead 1", "Super Saw"
- Pad: "Warm Pad 1"
- Drums: "Standard Kit 1"

**If a tone name is not in existing tutorials, you MUST verify it against the Sound List PDF.**

## Check 2: Parameter Ranges

**Are parameter ranges verified?**

- Check the Parameter Guide PDF: `FANTOM-06_07_08_Parameter_eng01_W.pdf`
- Every parameter has a defined range — never guess
- Common ranges:
  - Level: 0–127
  - Pan: L64–0–R63
  - Velocity: 0–127
  - Cutoff: 0–127
  - Resonance: 0–127
  - Send Level (Chorus/Reverb): 0–127
  - Tempo: 20–300 BPM
  - Note: C-1 to G9 (MIDI 0–127)

## Check 3: Control IDs

**Are control IDs verified?**

- Check against `allFantom08ControlIds` in `src/data/panelLayouts/fantom-08.ts`
- Invalid control IDs won't break tests but will SILENTLY fail to highlight anything
- Common control ID groups:
  - Zone buttons: `zone-1` through `zone-8`, `zone-9-16`, `zone-select`
  - Zone modes: `pan-level`, `ctrl`, `split`, `chord-memory`, `arpeggio`
  - Sliders: `slider-1` through `slider-8`
  - Control knobs: `ctrl-knob-1` through `ctrl-knob-8`
  - Tone categories: `tone-cat-1` through `tone-cat-16`
  - Pads: `pad-1` through `pad-16`
  - Transport: `play`, `stop`, `rec`
  - Navigation: `menu`, `enter`, `exit`, `dec`, `inc`
  - Cursor: `cursor-up`, `cursor-down`, `cursor-left`, `cursor-right`
  - Display: `value-dial`
  - Synth mode: `synth-mode-osc`, `synth-mode-filter`, `synth-mode-amp`, `synth-mode-lfo`, `synth-mode-fx`
  - Common: `write`, `master-fx`, `sampling`, `pad-mode`, `daw-ctrl`, `motional-pad`, `scene-chain`

## Check 4: Button/Knob Assignments Per Screen

**Are E-knob assignments correct for THIS screen?**

- E1-E6 assignments CHANGE between screens
- The manual specifies assignments per screen in "Menu/Explanation" tables
- Verify the manual's assignments table for the SPECIFIC screen mode being shown
- Do NOT assume E-knob assignments are the same across screens

## Check 5: Highlighted Controls Context

**Are highlighted controls contextually correct?**

- Controls highlighted in `highlightedControls` must match what the user would ACTUALLY interact with in that specific screen/mode
- This is documented error pattern #8
- Examples of WRONG highlights:
  - Mixer screen: highlighting `slider-1` through `slider-8` for volume — WRONG, the mixer has its own volume faders on screen
  - Zone View: highlighting `value-dial` for zone selection — WRONG, zone buttons select zones
  - PAN/LEVEL mode: highlighting knobs for pan — CORRECT, physical knobs control pan in this mode
- Always ask: "In this specific screen mode, what physical control would the user actually touch?"

## Check 6: LED States

**Are LED states accurate?**

**Buttons WITH LEDs (can use `ledOn: true` and `ledColor`):**
| Button Group | Buttons | LED Colors |
|---|---|---|
| Zone buttons | zone-1 through zone-8 | Colored (blue, red, green, amber, etc.) |
| Zone function | pan-level, ctrl, split, chord-memory, arpeggio | Green |
| Common | write | Red |
| Transport | play (green), stop (red), rec (red) | As noted |
| Pads | pad-1 through pad-16 | Colored |

**EVERYTHING ELSE has NO LED** — including: transpose, octave-down, octave-up, scene-select, zone-view, zone-select, zone-9-16, assign, menu, tempo, master-fx, motional-pad, daw-ctrl, single-tone, scene-chain, all synth-mode buttons, all tone-cat buttons, all cursor buttons, sampling, pad-mode, clip-board, bank, hold, shift, enter, exit, dec, inc, display, all knobs, all sliders, value dial, wheels.

- Use `active: true` (visual highlight only) for non-LED buttons
- NEVER use `ledOn: true` or `ledColor` on non-LED buttons
- NEVER write text like "lights up", "LED glows", "stays lit" for non-LED buttons

## Check 7: Zone Colors

**Do zone colors follow the formula?**

- Use `ZONE_COLOR_MAP` from `@/lib/constants`
- Zones 1-8 have distinct colors
- Zones 9-16 WRAP AROUND using `((num - 1) % 8) + 1`
- Zone 1: blue, Zone 2: red, Zone 3: green, Zone 4: amber, etc.
- RED = INT (internal) zones, GREEN = EXT (external) zones for zone LEDs

---

## Cross-Reference Template

Copy and fill in for each tutorial step that references UI data:

```
CROSS-REF for Step [N]:
- Tone names: [verified against: existing tutorial X / Sound List PDF]
- Control IDs: [verified against allFantom08ControlIds]
- E-knob assignments: [E1=X, E2=Y... verified from manual p.XX]
- Highlighted controls: [contextually correct for screen mode: YES/NO]
- LED states: [all ledOn buttons have hasLed:true: YES/NO]
- Parameter ranges: [verified against Parameter Guide: YES/NO]
```
