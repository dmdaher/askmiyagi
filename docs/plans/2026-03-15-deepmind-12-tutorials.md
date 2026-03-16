# DeepMind 12 Tutorial Build Plan

Created: 2026-03-15
Status: Pending (panel PR #19 must merge to `test` first)

## Prerequisites

- [x] Panel component complete (DeepMindPanel.tsx, ~180 controls)
- [x] Panel overview tutorial (#1) complete
- [x] Device registry integration
- [ ] PR #19 merged to `test`

## Manual Reference

Source: `docs/Behringer/DeepMind 12 - User Manual.pdf` (135 pages)

| Chapter | Pages | Content |
|---------|-------|---------|
| 3. Controls | 7-10 | Covered by panel-overview |
| 4. Program Management | 11-14 | Programs, browser, saving, compare, categories |
| 5. Playing Guide | 15-16 | Display, keyboard, wheels, octave, portamento, pedals |
| 6. Signal Path | 17-18 | Voice structure, mod matrix overview, MIDI routing |
| 7. Menu System | 19-35 | PROG menu, FX menu (4 engines), GLOBAL menu (5 pages) |
| 8. Programming | 36-78 | OSC, VCF, VCA, HPF, envelopes, LFOs, ARP, sequencer, poly/unison, mod matrix |
| 9. Effects Reference | 79-101 | 30+ algorithms, 10 routing configs |
| 10. Short-cuts | 102 | Quick-access combos |
| 11. Applications | 103-107 | Practical scenarios |
| 12. DAW MIDI | 108 | DAW configuration |

## Proposed Tutorials (25 total, 7 categories)

### Basics (4 tutorials)

| # | ID | Title | Difficulty | Manual Ref |
|---|---|---|---|---|
| 1 | `panel-overview` | Getting to Know the DeepMind 12 Panel | beginner | Ch 3 |
| 2 | `display-navigation` | Understanding the Display & Menus | beginner | §5.1, §7.1 |
| 3 | `selecting-programs` | Browsing & Selecting Programs | beginner | §4.2 |
| 4 | `keyboard-performance` | Keyboard, Velocity & Aftertouch | beginner | §5.2-5.4 |

### Synthesis (6 tutorials)

| # | ID | Title | Difficulty | Manual Ref |
|---|---|---|---|---|
| 5 | `oscillator-fundamentals` | Oscillator Basics — Waveforms, PWM & Sync | beginner | §8.1 |
| 6 | `filter-fundamentals` | VCF Filter — Frequency, Resonance & Modes | beginner | §8.2 |
| 7 | `envelope-shaping` | Shaping Sound with ADSR Envelopes | intermediate | §8.4 |
| 8 | `oscillator-mixing` | OSC Mixing, Noise & Detune | intermediate | §8.1 |
| 9 | `hpf-bass-boost` | High-Pass Filter & Bass Boost | beginner | §8.3 |
| 10 | `signal-path` | Understanding the Signal Path | intermediate | Ch 6 |

### Modulation (4 tutorials)

| # | ID | Title | Difficulty | Manual Ref |
|---|---|---|---|---|
| 11 | `lfo-basics` | LFO Modulation — Rate, Waveforms & Delay | beginner | §8.5 |
| 12 | `mod-matrix` | The Modulation Matrix — Sources & Destinations | intermediate | §8.9 |
| 13 | `pitch-mod-wheels` | Pitch Bend & Mod Wheel Setup | beginner | §5.3 |
| 14 | `poly-unison` | Polyphony, Unison & Voice Modes | intermediate | §8.6 |

### Effects (3 tutorials)

| # | ID | Title | Difficulty | Manual Ref |
|---|---|---|---|---|
| 15 | `effects-overview` | Effects Engine — 4 FX Slots | beginner | §7.2, Ch 9 |
| 16 | `effects-routing` | Effects Routing — Insert, Send & Bypass | intermediate | §9 routing |
| 17 | `effects-deep-dive` | Reverb, Delay & Chorus In-Depth | intermediate | §9 algorithms |

### Presets (3 tutorials)

| # | ID | Title | Difficulty | Manual Ref |
|---|---|---|---|---|
| 18 | `saving-programs` | Writing & Saving Programs | beginner | §4.8 |
| 19 | `compare-function` | Compare & Fader Matching | intermediate | §4.10 |
| 20 | `program-management` | Categories, Backup & Default Program | intermediate | §4.3-4.6 |

### Performance (4 tutorials)

| # | ID | Title | Difficulty | Manual Ref |
|---|---|---|---|---|
| 21 | `arpeggiator-basics` | Arpeggiator — Patterns & Gate Time | beginner | §8.7 |
| 22 | `chord-poly-chord` | Chord Memory & Poly Chord | intermediate | §8.8 |
| 23 | `control-sequencer` | 32-Step Control Sequencer | intermediate | §8.10 |
| 24 | `portamento-glide` | Portamento & Glide Modes | beginner | §5.6, §8.11 |

### MIDI (1 tutorial)

| # | ID | Title | Difficulty | Manual Ref |
|---|---|---|---|---|
| 25 | `midi-setup` | MIDI, USB & Wi-Fi Connectivity | intermediate | §7.4, Ch 12 |

## Build Batches

| Batch | Tutorials | Theme | Manual Pages |
|-------|-----------|-------|-------------|
| **A** | #2-4 (display-navigation, selecting-programs, keyboard-performance) | Core basics | §4-5, §7.1 |
| **B** | #5-7 (oscillator-fundamentals, filter-fundamentals, envelope-shaping) | Sound design foundations | §8.1-8.2, §8.4 |
| **C** | #8-10, #21 (oscillator-mixing, hpf-bass-boost, signal-path, arpeggiator-basics) | Intermediate synthesis + ARP | §8.1, §8.3, Ch 6, §8.7 |
| **D** | #11-14 (lfo-basics, mod-matrix, pitch-mod-wheels, poly-unison) | Modulation | §8.5, §8.9, §5.3, §8.6 |
| **E** | #15-20, #22-25 (effects, presets, performance, MIDI) | Everything else | Ch 9, §4, §8.8-8.11, Ch 12 |

## Workflow Per Batch

1. Read relevant manual chapters
2. Build tutorials using TDD (test-first)
3. Register in `index.ts` (import + array + named export)
4. Update test counts
5. `npm test` — all tests pass
6. Playwright verification — tutorials render, controls highlight correctly
7. PR each batch to `test`

## Control ID Reference

All control IDs are defined in `src/components/devices/deepmind-12/deepmind-12-constants.ts`.
The panel-overview tutorial (`src/data/tutorials/deepmind-12/panel-overview.ts`) demonstrates usage of all section control IDs.
