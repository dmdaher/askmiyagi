# Editor UX Improvements Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Make the editor intuitive for contractors — easy section dragging, consistent control resizing, and smooth interaction patterns.

---

## Task 1: Section drag handle

**Problem:** Section frame and child controls overlap. Clicking near a section edge grabs a control resize handle instead of the section. Contractor can't find the draggable area.

**Solution:** Add a visible drag handle bar at the top of each SectionFrame.

**Implementation:**
- Add a header bar (~16px tall) at the top of SectionFrame showing the section name (e.g., "ZONE", "COMMON")
- The header bar is the drag handle — only it initiates section drag
- Clicking inside the section body (below the header) selects child controls, not the section
- Use react-rnd's `dragHandleClassName` prop to restrict drag to the header
- Header shows: grip icon (⋮⋮) + section name + control count
- Subtle styling: dark background, small text, visible on hover

**Files:**
- Modify: `src/components/panel-editor/SectionFrame.tsx`
  - Add header div with `className="section-drag-handle"`
  - Add `dragHandleClassName="section-drag-handle"` to Rnd component
  - Remove section click handler from body (only header selects section)

---

## Note: Individual control resize NOT needed

Controls are fixed physical sizes on real hardware. The contractor uses:
- **sizeClass** property (xs/sm/md/lg/xl) in the properties panel to change a control's size
- **Global scale slider** (30-100%) to shrink everything for positioning mode

This should be explained in the onboarding tutorial (Task 14 in stabilization plan).

Displays (TouchDisplay) are the exception — they vary widely in size and already accept width/height props.

---

## Task 3: Section-by-section editing mode (future)

**Problem:** With 121 controls on screen, the editor is overwhelming. Controls from different sections overlap, making it hard to position individual sections.

**Solution:** Toggle to show one section at a time. Contractor positions controls for that section, marks it done, moves to next.

**Deferred** — design this after Tasks 1 and 2 are working. The section drag handle (Task 1) may reduce the need for this.
