# Editor Issue Reporting & Component Recovery

**Goal:** Contractor or owner can report issues (missing components, wrong types, errors) directly from the editor UI. The system finds and fixes the issue without resetting the editor layout. The edited layout is sacred — only component data changes, never positions.

---

## The Problem

After a contractor positions 120+ controls by hand, they or the owner might notice:
- A missing control that should exist (the manual mentions it but it's not in the editor)
- A wrong control type (button rendered as knob, or vice versa)
- Wrong label, wrong shape, wrong color
- A component that the gatekeeper didn't extract from the manual

Currently, fixing this requires:
1. Manually editing the manifest JSON
2. Re-running the gatekeeper (which resets ALL positions)
3. Re-positioning everything from scratch

This is unacceptable. The editor layout is hours of manual work.

---

## Design

### Principle: Editor State is Sacred

The edited layout (positions, sizes, visual overrides) is NEVER reset by a pipeline re-run. If the pipeline needs to re-analyze the manual to find a missing component:
- New components are ADDED to the editor with default positions (bottom of canvas or next to related controls)
- Existing component positions are PRESERVED exactly as the contractor placed them
- Component DATA (type, label, shape, color) can be updated without moving anything

### Feature 1: Issue Reporting from Editor

**UI:** A "Report Issue" button (or flag icon) in the toolbar. When clicked:
- Opens a modal with options:
  - "Missing control" — describe what's missing (e.g., "TEMPO RESET button, mentioned on page 47")
  - "Wrong type" — select a control and report the correct type
  - "Wrong label/color/shape" — select a control and describe the correction
  - "Other issue" — free text

**Storage:** Issues saved to `.pipeline/{deviceId}/issues.json` as an array:
```json
[
  {
    "id": "issue-1",
    "type": "missing-control",
    "description": "TEMPO RESET button missing, referenced on manual page 47",
    "reportedBy": "contractor",
    "createdAt": "2026-03-24T...",
    "status": "open",
    "resolution": null
  }
]
```

**Visibility:** Issues show as badges in the admin panel. Owner can see all reported issues per instrument.

### Feature 2: Component Recovery (Agent-Assisted)

When an issue is reported:
1. **For "missing control":**
   - System shows the issue to the gatekeeper agent with the manual pages referenced
   - Agent reads those pages and produces the missing control definition (id, type, label, shape, etc.)
   - The new control is ADDED to the manifest — existing controls untouched
   - Editor gets the new control at a default position (bottom-right of canvas with a "NEW" badge)
   - Contractor drags it into place

2. **For "wrong type/label/shape":**
   - Contractor can fix directly in the properties panel (already works today)
   - Or: system asks the agent to re-read the manual for that specific control
   - Agent produces corrected data — only the specified fields are updated
   - Position is NEVER changed

3. **For complex issues:**
   - Escalation to owner with the issue description
   - Owner can manually edit the manifest or trigger a targeted agent run

### Feature 3: Additive-Only Manifest Updates

When the pipeline re-runs (e.g., to find a missing control), the manifest update follows this rule:

```
FOR EACH control in the new manifest:
  IF control.id EXISTS in the editor manifest:
    KEEP the editor's position (x, y, w, h)
    UPDATE only: type, label, shape, color, LED data (if changed)
  ELSE (new control):
    ADD to editor with default position
    Mark with "NEW" badge so contractor knows to position it

NEVER remove a control from the editor that the contractor has positioned.
```

This is an ADDITIVE merge, not a replacement. The pipeline can add new controls but never remove or reposition existing ones.

### Feature 4: Editor State Versioning

Every "Approve & Build" creates a version:
```
.pipeline/{deviceId}/editor-versions/
  v1-2026-03-24T10-30-00.json  (first approved layout)
  v2-2026-03-24T15-45-00.json  (after fixing missing control)
  v3-...
```

The contractor can revert to any previous version. The current version is always the latest.

---

## Implementation Notes

- The "Report Issue" modal is a new component in the editor
- Issues API: GET/POST/PUT on `/api/pipeline/{deviceId}/issues`
- Additive manifest merge goes in the manifest API GET handler or in `loadFromManifest`
- Editor versioning uses the existing backup mechanism (already keeps timestamped copies)
- Agent-assisted recovery reuses the gatekeeper with a scoped prompt ("find this specific control on page X")

---

## What This Does NOT Do

- Does NOT re-run the full pipeline (no parser, no layout engine)
- Does NOT reset editor positions
- Does NOT require the contractor to touch JSON files or code
- Does NOT require terminal access

Everything is in the editor UI.
