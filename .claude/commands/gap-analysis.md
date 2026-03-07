# GAP-ANALYSIS — Tutorial Coverage Audit

Cross-reference implemented tutorials against the reference manual table of contents. Verify every manual section maps to an existing or planned tutorial. Document gaps and update coverage tracking.

**Trigger:** After completing a tutorial batch. Also useful periodically to assess overall coverage.

---

## Step 1: Gather Current State

1. **Count current tutorials:**
   ```bash
   grep -c "export" src/data/tutorials/fantom-08/index.ts
   ```
   Or check the `fantom08Tutorials` array length in the test file.

2. **List all tutorial IDs:**
   ```bash
   grep "id:" src/data/tutorials/fantom-08/*.ts | grep -v node_modules
   ```

3. **Check existing gap analysis:**
   Read `docs/plans/2026-02-28-gap-analysis.md` for the current state of coverage.

---

## Step 2: Cross-Reference Manual TOC

Go through the Reference Manual table of contents section by section. For each section:

| Manual Section | Pages | Status | Mapped Tutorial(s) |
|---|---|---|---|
| [Section name] | p.XX-YY | COVERED / PARTIAL / GAP / N/A | [tutorial-id] or — |

### Status Definitions
- **COVERED** — Existing tutorial fully teaches this section's content
- **PARTIAL** — Tutorial exists but doesn't cover all workflows in this section
- **GAP** — No tutorial covers this section
- **N/A** — Reference material (chord lists, block diagrams, specs) that doesn't need a tutorial
- **PLANNED** — Tutorial planned for an upcoming batch

### What to Check Per Section
- Does at least one tutorial cover the primary workflow described?
- Are sub-workflows covered? (e.g., "Sampling" has: to Pad, to Keyboard, to Storage — all three need coverage)
- Are advanced features covered? (e.g., utilities, batch operations, import/export)

---

## Step 3: Identify and Classify Gaps

For each GAP or PARTIAL found:

### Priority Classification
| Priority | Criteria | Action |
|----------|----------|--------|
| **HIGH** | Core feature with no tutorial at all (e.g., a tone engine type) | Must fix in next batch |
| **MEDIUM** | Workflow exists but a specific sub-workflow is missing | Add steps to existing tutorial or create new |
| **LOW** | Nice-to-have coverage (setup, troubleshooting, reference) | Schedule for future batch |
| **N/A** | Reference material, specs, appendix tables | No tutorial needed |

### Gap Entry Format
```markdown
| # | Gap Description | Pages | Priority | Resolution Plan |
|---|---|---|---|---|
| 1 | [What's missing] | p.XX-YY | HIGH/MED/LOW | [New tutorial / extend existing / N/A] |
```

---

## Step 4: Update Coverage Doc

Update `docs/plans/2026-02-28-gap-analysis.md`:

1. Change PLANNED → COVERED for completed sections
2. Add any newly discovered gaps
3. Update the Coverage Summary table:
   ```markdown
   | Status | Manual Sections | % |
   |---|---|---|
   | Fully Covered | ~N | XX% |
   | Partial | N | XX% |
   | Gap (open) | N | XX% |
   | N/A (reference) | ~N | — |
   ```
4. Add a dated note at the bottom describing what changed

---

## Step 5: Update Memory

Update `memory/MEMORY.md`:
- Total tutorial count
- Per-category counts (see table below)
- Any new gaps or resolved gaps
- Coverage percentage

### Current Category Reference (update after each batch)
| Category | Count |
|---|---|
| Basics | 9 |
| Zones & Splits | 5 |
| Sound Design | 8 |
| Effects | 4 |
| Sequencer | 7 |
| Sampling | 7 |
| Performance | 9 |
| Mixer | 1 |
| Scene Editing | 1 |
| MIDI | 6 |
| **Total** | **59** |

---

## Step 6: Plan Next Batch (if gaps exist)

If open gaps remain:
1. Group HIGH-priority gaps into a batch of 3-5
2. Group MEDIUM-priority gaps into separate batches
3. Consider extending existing tutorials for PARTIAL coverage (adding steps is cheaper than new tutorials)
4. Write the next batch plan using `/tutorial-batch` Phase 1

---

## Fantom 08 Manual TOC Reference

For the Fantom 08, the complete manual TOC structure is:

```
Ch 01: Overview (pp. 7-26)
  - Panel Descriptions, Basic Operation, Units of Sound, Effects Overview, Memory Structure, Getting Ready

Ch 02: Performing (pp. 27-51)
  - Scene Select/Search, Quick Edit, Tone Select/Search, Single Tone, Layering, Splitting, Multiple Zones
  - Key Range, Transpose, Octave, Arpeggios, Chord Memory, Rhythm Patterns, Sliders/Knobs, SYNTH CTRL, Motional Pad

Ch 04: Editing (pp. 53-77)
  - Scene Edit, Zone Edit, Zone Utility, Zone Out Assign, Scene Appearance, Saving
  - Tone Editing (ZEN-Core, Drum Kit, SN-A, VTW, SN-AP, SN-EP, MODEL/JP-8)
  - Saving Tone, Initialize Tone, Partial Copy, Edit Knobs
  - MFX, Effects Signal Flow, IFX/Chorus/Reverb, TFX, Sampling Input FX, Output, Mixer, Scene Chain

Ch 05: Sampler (pp. 79-102)
  - Sampling to Keyboard/Storage/Pad, Import, Multisample, KBD Utility, MODIFY, Memory Info
  - Pad Banks/Hold/Move, Recording to Pad, Pad Quick/Wave Edit, Pad Utility/Export

Ch 06: Pads (pp. 103-107)
  - Sample Pad, Note Pad, Partial Sw/Sel, DAW Control, Zone Mute/Solo, Kbd Sw Group, Rhythm Pattern, Pattern/Variation/Group

Ch 07: Sequencer (pp. 109-140)
  - Pattern/Group/Song, Realtime Recording/Erase, Step REC, TR-REC, Piano Roll, Automation
  - Microscope, Pattern Utility, MODIFY, SMF Import/Export, Groups, Songs, SMF Player

Ch 08: Control (pp. 141-150)
  - USB Driver, Plug-in Synth, USB Audio, External MIDI, Vocoder

Ch 09: Settings (pp. 151-173)
  - Import/Export, Backup/Restore, Factory Reset, Wallpaper, File Utility, System 17 tabs, Expansion

Ch 10: Appendix (pp. 175-188)
  - Chord Memory List, Block Diagram, Error Messages, Troubleshooting, MIDI Implementation, Specs
```

---

## Gap Analysis Report Template

```
GAP ANALYSIS REPORT
Date: [YYYY-MM-DD]
After: [Batch X completion]
━━━━━━━━━━━━━━━━━━━━━━━━
Current tutorials: [N]
Sections fully covered: [N] ([XX%])
Sections partially covered: [N]
Open gaps: [N]
  - HIGH priority: [N]
  - MEDIUM priority: [N]
  - LOW priority: [N]
N/A sections: [N]

New gaps found: [list or "none"]
Gaps resolved this batch: [list or "none"]

Next batch recommendation: [description]
━━━━━━━━━━━━━━━━━━━━━━━━
```
