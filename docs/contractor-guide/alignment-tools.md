# Alignment Tools — Contractor Tutorial Reference

Source material for the contractor onboarding. This is the cheat-sheet that teaches the Align/Distribute/Group tools.

---

## The fundamental distinction: Align vs Distribute

These sound similar but do very different things.

### Align = "straighten onto a line"

Takes your selected controls and moves them so they share one coordinate (X or Y). **Doesn't touch spacing between them.**

**Before Align Center-Y (messy vertical positions):**
```
    [A]
[B]
       [C]
[D]
```

**After Align Center-Y (all vertical centers snap to one line):**
```
[A] [B]    [C] [D]    ← all same Y center
```

Spacing is still uneven — but they're on one horizontal line now.

### Distribute = "space them evenly"

Takes 3+ controls, keeps the outermost ones (leftmost + rightmost, or top + bottom) in place, and redistributes the ones between them so **gaps are equal**.

**Before Distribute Horizontal (uneven spacing):**
```
[A]   [B][C]     [D]
```

**After Distribute Horizontal (equal gaps):**
```
[A]    [B]    [C]    [D]
```

Vertical positions don't change — only the X coordinates of the middle items.

### Use both together for a clean row

Typical polish workflow for a row of buttons:
1. Select all buttons in the row
2. **Align Center-Y** → they snap onto one horizontal line
3. **Distribute Horizontal** → gaps become equal

Result: perfectly aligned, evenly spaced row.

---

## The 8 alignment tools

### Horizontal row alignment (controls arranged left-to-right)

| Tool | What it does |
|---|---|
| **Align Top** | All controls → same Y at their top edge |
| **Align Center-Y** | All controls → same Y at their vertical center |
| **Align Bottom** | All controls → same Y at their bottom edge |
| **Distribute Horizontal** | Equal X-gaps between controls |

### Vertical column alignment (controls arranged top-to-bottom)

| Tool | What it does |
|---|---|
| **Align Left** | All controls → same X at their left edge |
| **Align Center-X** | All controls → same X at their horizontal center |
| **Align Right** | All controls → same X at their right edge |
| **Distribute Vertical** | Equal Y-gaps between controls |

---

## Gap input (exact spacing)

When Distribute's equal-gaps isn't what you want — you need a **specific pixel gap** between controls — use the Gap H / Gap V number fields.

- Type a number (e.g., `20`)
- First control stays anchored
- Rest flow to the right/down with that exact gap between them
- Supports negative values (for overlapping controls like stacked pads)
- Good for: matching spacing across multiple groups (type 20 in group A, type 20 in group B → perfectly consistent)

---

## Cross-row / cross-column alignment

### Align Columns (snap multiple rows to the same column positions)

Use when you have **2+ rows** of controls and want their columns to line up:
```
BEFORE:                    AFTER Align Columns:
[A1] [A2]   [A3] [A4]     [A1]  [A2]  [A3]  [A4]
 [B1] [B2] [B3]  [B4]     [B1]  [B2]  [B3]  [B4]
```

**When it works well:** rows have similar control widths (e.g., 8 knobs all 100px wide + 8 buttons all 107px wide).

**When it produces weird results:** rows with very different widths (e.g., 107px buttons + 60px sliders). The tool aligns **centers**, not visual edges. If widths differ by 40+ pixels, you'll get visual drift even though the math is correct.

**Workaround for mismatched widths:** align each row separately with Distribute H instead.

### Align Rows (symmetric — for columns)

Same idea, flipped: 2+ columns of controls → match their row Y positions.

Same width caveat applies (to heights in this case).

---

## Grouping (Figma-style)

### Create and manage groups

- **Cmd+G** — group selected controls under a name (e.g., "Zone Knobs")
- **Cmd+Shift+G** — ungroup
- Click any group member → selects the entire group
- Double-click a grouped control → "deep selects" just that one
- Cmd+click a grouped control → same, bypasses group
- Shift+click a grouped control → adds the WHOLE group to current selection

### Layers panel group selection

- Click group name in Layers panel → selects all members
- Shift+click another group → adds its members to selection
- Cmd+click → toggles a group's members in/out of selection

### Why groups help

- You can move/align 8 zone buttons as a unit without re-selecting them every time
- Groups persist across sessions
- Groups don't affect the generated panel — purely an editing convenience

---

## Normalize Label Spacing

Shows up when you have 2+ labels selected that are linked to controls.

**What it does:** groups labels by (position: above/below, line count: 1/2/3...), then snaps each group to the tightest distance from its control.

**When to use:** after running Distribute V on a column of controls, labels may have drifted from their buttons. Normalize Label Spacing tightens them back up.

---

## Key principles

1. **Match tool to shape.** Use row tools (horizontal align / distribute H) on rows, column tools (vertical align / distribute V) on columns, cross-row tools on multi-row selections.

2. **Width matters for center alignment.** When controls have very different widths, center-based alignment can look visually misaligned even when mathematically correct. Prefer edge alignment (left/right) in these cases.

3. **Per-group first, cross-group last.** Align controls within each group before trying cross-group alignment.

4. **Cmd+Z is your friend.** Every align operation is reversible.

5. **Trust your eyes.** If it already looks aligned, don't run a tool that will force mathematical alignment and create 0.5-1px drift.

---

## Anti-patterns (don't do these)

- **Don't Align Center-Y on a selection spanning multiple rows.** It averages Y values across rows and collapses them into one row (your rows will "swap" positions).

- **Don't Align Columns on mismatched-width rows.** Creates visible center-offset drift.

- **Don't select 12 controls (2 rows × 6) and hit Distribute H.** It treats them as one flat list, not 2 separate rows of 6.

- **Don't chase pixel-perfect alignment when bounding boxes have different widths.** 0.5-1px rounding drift is normal and invisible to the eye.

---

## Quick reference cheat sheet

| Situation | Tool |
|---|---|
| Row of buttons is wobbly (uneven Y) | Align Center-Y |
| Row has uneven gaps between buttons | Distribute Horizontal |
| Column of sliders is jaggy (uneven X) | Align Center-X |
| Column has uneven vertical spacing | Distribute Vertical |
| Need specific pixel gap between controls | Gap H / Gap V input |
| 2 rows of knobs should share column positions | Align Columns |
| 2 columns of buttons should share row positions | Align Rows |
| Labels drifted after distribute | Normalize Label Spacing |
| Working with same controls repeatedly | Group them (Cmd+G) |

---

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| Group | Cmd+G |
| Ungroup | Cmd+Shift+G |
| Align Left | (shortcut TBD) |
| Align Center | (shortcut TBD) |
| Align Right | (shortcut TBD) |
| Distribute H | (shortcut TBD) |
| Distribute V | (shortcut TBD) |
| Undo | Cmd+Z |
| Redo | Cmd+Shift+Z |

*(Shortcut list to be finalized when contractor onboarding is built.)*
