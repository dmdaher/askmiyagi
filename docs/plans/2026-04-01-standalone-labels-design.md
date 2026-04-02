# Standalone Labels — Design Brief

> **For Claude:** Use superpowers-extended-cc:brainstorming skill to design this feature fully before implementation.

**Problem:** Labels are computed at render time with different math in editor vs codegen. Despite 5+ attempts to align them, they never match visually. The root cause: computed positions always introduce variance.

**Solution direction:** Labels become stored pixel positions — same approach that fixed component positioning. But the full design needs brainstorming first.

## Questions to Answer Before Implementation

### 1. Label-Component Relationship
- Should labels be linked to their control (move when control moves)?
- Or fully independent (like Figma text layers)?
- Or linked by default but unlinkable?
- What happens when you delete a control — does its label delete too?
- What happens when you duplicate a control — does the label duplicate?

### 2. Figma's Text Layer Model
- How does Figma handle text near components?
- Figma has auto-layout labels (inside components) AND standalone text layers
- Which model fits our use case better?
- What does Figma do for text sizing, font, color, alignment?

### 3. Data Model
- Where do label positions live? On the control (control._label.x/y)? Or in a separate array (editorLabels[])?
- We already have `editorLabels: unknown[]` in the store and undo snapshots
- What fields does each label need? (x, y, w, h, text, fontSize, color, align, controlId?)

### 4. Scale Slider Impact
- When controlScale changes, do label positions scale too?
- Label font size — does it scale with the slider or stay fixed?
- The container=visual rule — does it apply to labels?

### 5. Codegen Impact
- Codegen reads label x/y/w/fontSize directly — no computation
- What CSS does the generated label use? (position:absolute, left, top, width, fontSize)
- How do multi-line labels (\n) render?
- Label text alignment (center/left/right)

### 6. Editor UI
- How does the contractor interact with labels?
- Can they drag labels? Resize them? Edit text inline?
- Properties panel — what label properties are editable?
- How to add/remove labels?

### 7. Migration
- Existing controls have computed label positions
- How to initialize stored positions for all existing controls?
- Default: compute once from current rules, store, never recompute

### 8. What Else Figma Does
- Text auto-sizing (grow/shrink to fit content)
- Text truncation vs overflow
- Text styles (bold, color, letter-spacing, uppercase)
- Text alignment within its bounding box
- Multiple text layers per component (primary + secondary)

## Remaining Active Plans
| Plan | Status |
|------|--------|
| Alignment + Distribution + Grouping | `docs/plans/2026-03-31-alignment-distribution-tools.md` |
| Keyboard Persistence | FIXED this session |
| Missing Common Controls | 22 added this session (need proper positioning) |
| CDJ-3000 Codegen Diff | `docs/plans/2026-03-31-cdj3000-codegen-diff-review.md` |
| Pixel Positioning Migration | DONE this session |
| Container Component Sizing | DONE this session |
