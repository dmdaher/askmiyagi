# Canvas Test Scenarios

Scenario-based walkthrough of every feature on `/admin/<deviceId>/review-tutorials`.
Reflects the PR-N action-feedback patterns + simplified step control.

## Setup once
```
Terminal → npm run dev
Browser  → http://localhost:3000/admin
Login    → password from .env.local ADMIN_PASSWORD (default: miyagi2026)
Pick     → cdj-3000 (most QA findings to test against)
Click    → "Review Tutorials" button
```

---

## PR-F · End-user-feel canvas

### S1: Walk through a tutorial like a real user
```
Click any tutorial in left sidebar
   ↓
Press → arrow (next step) or click any progress dot
   ↓
Watch the panel preview light up the correct controls
   ↓
Expected: instruction text changes, highlights move, no flicker
```

### S2: Approve or Request Changes
```
Top-right toolbar
   ↓
Click "✓ Approve & Open PR"  (advances pipeline → tutorial-pr)
   OR  "✗ Request Changes"  → type feedback → Send
   ↓
Expected: pipeline state updates back in /admin
```

---

## PR-G + PR-G-rev · Scale, auto-refresh, compact

### S3: Resize the panel preview
```
Top toolbar → "Scale: [−] [%] [+]"
   ↓
Click [+] a few times (zoom 100% → 150%)
   OR Cmd+wheel inside the panel preview
   OR click ⤢ → "Auto-fit" / "Scale to 50%" presets
   ↓
Expected: panel resizes smoothly, scrollbars appear if needed
Persistence: refresh → scale persists (sessionStorage)
```

### S4: Hide the chrome for more screen
```
Top toolbar → "Compact" button (or press `c`)
   ↓
Expected: top banner + device row disappears
   ↓
Press `c` again → back to normal
```

### S5: Step control modes (PR-N3 — simplified to 2 modes)
```
Default: anchored mode (full step content at bottom of preview)
   ↓
Click "▴ Collapse"
   ↓
Expected: compact-strip mode shows "Step N · ← → · title"
   ↓
Press ← / → arrow keys (also j/k vi-style)
   ↓
Expected: step changes immediately, works in BOTH modes
   ↓
Click "▾ Expand"
   ↓
Expected: back to anchored mode with full step content
Persistence: mode persists per-device in sessionStorage
```

### S6: Edit panel in editor tab → canvas auto-refreshes
```
Tab 1: /admin/cdj-3000/review-tutorials (canvas open)
Tab 2: /admin/cdj-3000/editor (drag a control, save)
   ↓
Back to Tab 1 (don't refresh)
   ↓
Within 5s: panel preview updates, QA findings re-fetch (PR-N1 fix)
Expected: no manual reload needed
```

---

## PR-Scroll · Single sidebar scroll

### S7: Reach every sidebar section
```
Open canvas
   ↓
Click QA Findings header (expand)
   ↓
Click Reviewer Notes header (expand)
   ↓
Click Layer 5 header (expand)
   ↓
Scroll the WHOLE sidebar with one wheel motion
   ↓
Expected: reaches Layer 5 + reviewer notes at the bottom
No "wheel hijack" between nested scroll boxes
```

---

## PR-H · Diagnose orphan controls

### S8: Find out why a control is unreferenced
```
Sidebar → QA Findings → expand "1b. manifest→tutorial coverage"
   ↓
Find an orphan control row
   ↓
Click 🛠 Diagnose
   ↓
Expected (PR-N2):
  • ⏳ progress toast appears: "Diagnosing X… (≈$0.20, ≈60s)"
  • 30-60s later: ✅ success toast: "Diagnosed X · Category B (paired-state-indicator)"
  • Toast includes actionable button: [✓ Mark intentional] (or [🗑 Delete] for cat A)
  • Row shows category badge + reason text
   ↓
Click toast's action button → that action fires + second confirmation toast
```

---

## PR-I · 🛠 Fix button — agent fixes one finding

### S9: Fix a Layer 1a / 3a / 3b finding
```
Sidebar → QA Findings → expand "3a." (or 1a/3b)
   ↓
Click 🛠 Fix next to one finding
   ↓
Modal opens → Phase 1 spinner "Asking tutorial-fixer agent…" (~60s)
   ↓
Review proposed JSON patch + confidence badge + manual citation
   ↓
Click "Apply fix"
   ↓
Expected (PR-N1 + N2):
  • Modal closes
  • ✅ success toast: "Fix applied — tutorials.json updated"
  • Finding disappears from QA list (canvas re-fetched, PR-N1)
Cancel preserves the agent's proposal (sessionStorage cache, 10min TTL)
```

### S10: Re-ask the agent with more context
```
Modal open → "Ask agent again with more context" disclosure
   ↓
Expand → type: "use TEMPO_SLIDER not MASTER_TEMPO"
   ↓
Click "↻ Re-run with this context"
Expected: cache busts, new proposal arrives with hint applied
```

---

## PR-J · .ts regeneration + OrphanList delete

### S11: Fix → Approve → fix actually reaches production
```
Run S9: apply a Fix patch (changes title to "TEST")
   ↓
Top toolbar → "✓ Approve & Open PR"
   ↓
Pipeline advances → tutorial-pr phase runs regen
   ↓
Open: src/data/tutorials/cdj-3000/<that-tutorial>.ts
   ↓
Expected: regenerated .ts file contains "TEST"
```

### S12: Delete an orphan from the canvas
```
Layer 1b → Diagnose → category A (editor garbage)
   ↓
Click 🗑 Delete → confirm dialog
   ↓
Expected (PR-N1 + N2):
  • ✅ success toast: "Deleted X from manifest (backup saved)"
  • Row disappears from QA list
  • Backup file created in .pipeline/<id>/backups/
  • Production manifest auto-exported
```

---

## PR-L · Cumulative-state safety + Layer 4 readability

### S13: Try a patch that would break a later step
```
Run S9 with a "bad" patch (e.g. add a ghost control)
   ↓
Click "Apply fix"
   ↓
Modal shows RED violations pane:
   "⚠ Cumulative-state verification — 1 violation"
   "[step 3] highlight-not-in-manifest · __GHOST__"
   ↓
Original Apply button is REPLACED with "⚠ Apply anyway"
   ↓
Click "⚠ Apply anyway" → confirm dialog
   ↓
Expected (PR-N2):
  • Modal closes
  • ⚠ warning toast (sticky 8s): "Applied despite 1 cumulative-state violation — audit-logged"
  • Patch lands, audit-logged to fix-log.jsonl
   ↓
OR click "Cancel" → tutorials.json unchanged (auto-rolled-back)
```

### S14: Spot Layer 4 readability findings
```
Sidebar → QA Findings → look for "4a." or "4b." entries
   ↓
"4a. step instruction exceeds 200 chars" → expand to see which steps
"4b. step has no highlights AND no displayState" → dead-step candidates
   ↓
Click 🛠 Fix → agent proposes rewrite (uses PR-I modal flow)
```

---

## PR-K · Layer 5 conceptual coherence

### S15: Did the agent build the RIGHT workflow?
```
Sidebar → scroll to bottom → "Layer 5: Conceptual Coherence"
   ↓
Click ▸ to expand
   ↓
On one tutorial → click "🔍 Assess"
   ↓
Expected (PR-N2):
  • ⏳ progress toast: "Assessing X… (≈$0.20, ≈60s)"
  • 30-60s later: ✅ success toast: "Assessed X — 4/5 ✓ pass"
  • If findings exist, toast has actionable button [📋 Open N findings]
  • Clicking that button: opens Layer 5 section + expands the tutorial row + scrolls to it
   ↓
Click 🛠 Fix on a finding → QaFixModal opens (same UX as PR-I)
   ↓
Apply → can include /steps/<idx> reorder/insert/delete
Cumulative-state still gates (PR-L)
```

### S16: Re-assess after editing
```
Layer 5 row shows "4/5 · ✓ pass" (cached)
   ↓
Apply some PR-I fixes that change tutorial text
   ↓
Layer 5 cache auto-invalidates (key includes tutorials.json mtime)
   ↓
Click "↻ Re-assess" → spawn agent with new content
```

---

## PR-M · Click-to-toggle highlight

### S17: Toggle a highlight with one click
```
Sidebar top → "⚪ Edit Highlights mode · OFF" → click → "🟢 ON"
   ↓
Navigate to any tutorial step
   ↓
Click any control on the panel preview
   ↓
Expected: glow appears/disappears INSTANTLY
   tutorials.json updates, QA re-runs in background
   ↓
Click another control → also toggles
   ↓
Click toggle → back to OFF → clicks now FLASH the control (PR-H behavior)
```

### S18: Toggle blocked by cumulative-state
```
Edit Highlights ON → click a control that would break a downstream step
   ↓
Red toast appears: "Cumulative-state violation: <message>"
   ↓
tutorials.json unchanged (already rolled back)
   ↓
Use 🛠 Fix on the related finding to override properly
```

---

## Editor-side bonus

### S19: Verify the JOG WHEEL section fix
```
Open: /admin/cdj-3000/editor
   ↓
Layers panel → scroll to "Jog Wheel" row
   ↓
Click the row
   ↓
Expected: Properties panel shows SECTION fields (frameMode, archetype, dimensions)
NOT control fields (label, type, shape)
   ↓
Click 👁 frame mode cycle icon → full → header-only → hidden
   ↓
Section frame changes accordingly in the panel preview
```

---

## 10-minute full smoke (the minimum that exercises everything)

```
1. Load canvas → tutorial walkthrough works                          [PR-F]
2. Scale to 150%, switch step control collapse/expand                 [PR-G-rev / PR-N3]
3. Scroll sidebar to bottom — Layer 5 visible                         [PR-Scroll]
4. Layer 1b → Diagnose an orphan → toast with action button           [PR-H + PR-N2]
5. Layer 3a → 🛠 Fix on one finding → Apply → success toast           [PR-I + PR-N2]
6. Edit Highlights ON → click a control → toggle persists             [PR-M]
7. Layer 5 → Assess one tutorial → actionable "Open findings" toast   [PR-K + PR-N2]
8. Try a bad patch → see violations pane + ⚠ Apply anyway toast       [PR-L + PR-N2]
9. Approve → pipeline advances → .ts contains your edits              [PR-J]
10. Editor → click JOG WHEEL row → see section properties             [editor fix]
11. Use ← / → arrow keys for step navigation (anchored AND compact)   [PR-N3]
```

All 11 green → stack is functionally + visually proven.
