# Admin Flow Redesign — Complete Plan

## Route Structure

```
/admin                          → Instrument Dashboard (all instruments + upload)
/admin/{deviceId}               → Instrument Detail (status, timeline, logs)
/admin/{deviceId}/editor        → Visual Editor (contractor)
/admin/{deviceId}/preview       → WYSIWYG Preview (polished panel render)
/admin/review                   → Admin Review Dashboard (pending approvals)
```

No `/pipeline/` prefix — instruments, not pipelines.

## Complete Flow

### Phase 1: Pipeline (Automated)
```
Admin uploads manual + photos → Pipeline runs:
  Parser → Gatekeeper → Visual Extractor → Validator → Layout Engine
  Status: "Ready for Editor"
```

### Phase 2: Editor (Contractor)
```
Contractor opens /admin/{deviceId}/editor
  → Sees controls pre-positioned with colors/icons/shapes
  → Side-by-side photo reference
  → Drags, resizes, adjusts until it matches hardware
  → Clicks "Approve & Build"
  → Inference runs → codegen generates polished panel
  → Redirects to /admin/{deviceId}/preview
```

### Phase 3: Preview (Contractor)
```
Contractor sees /admin/{deviceId}/preview
  → Renders the ACTUAL generated panel component
  → Dark background, no editor chrome
  → Can interact (click buttons, see highlights)
  → "Back to Editor" → more adjustments
  → "Submit for Review" → adds notes → status: "Pending Review"
```

### Phase 4: Admin Review (You)
```
You open /admin/review
  → See all instruments pending review
  → Click CDJ-3000 → see polished panel preview
  → "Request Changes" → sends back with notes → contractor edits again
  → "Approve & Build Tutorials" → triggers tutorial pipeline
```

### Phase 5: Tutorial Pipeline (Automated)
```
Phase 4: Manual Extractor → Coverage Auditor
Phase 5: Tutorial Builder
  → Creates PR targeting test branch
  → Status: "Tutorials Ready"
```

### Phase 6: Final Review (You)
```
You open /admin/review → instrument shows "Tutorials Ready"
  → See panel + tutorial list
  → Preview individual tutorials
  → "Publish to Site" → live at /tutorial/{deviceId}
```

## Status Flow

```
Pipeline Running → Ready for Editor → In Editing → Pending Review
→ Changes Requested (loop) → Panel Approved → Tutorials Building
→ Tutorials Ready → Published
```

## Codegen Feedback Loop

After each instrument completes:

1. **Capture diffs:** Compare codegen's initial output vs contractor's final approved version
2. **Identify patterns:** "Contractor always increases gap on single-row sections from 4px to 12px"
3. **Update codegen rules:** Next instrument gets 12px gap by default
4. **Store corrections:** `.pipeline/{deviceId}/codegen-feedback.json`

```json
{
  "corrections": [
    {
      "section": "hot-cue",
      "field": "gap",
      "codegenValue": 4,
      "contractorValue": 12,
      "pattern": "single-row with pads"
    }
  ]
}
```

After 5+ instruments, analyze patterns:
- If same correction appears 3+ times → auto-apply in codegen
- Store learned rules in `scripts/codegen-rules.json`
- Codegen reads rules and applies before generating

## What Needs to Be Built

### Route Changes
- [ ] Move `/admin/pipeline/[deviceId]` → `/admin/[deviceId]`
- [ ] Keep `/admin/[deviceId]/editor` (exists)
- [ ] Create `/admin/[deviceId]/preview` (WYSIWYG preview)
- [ ] Create `/admin/review` (review dashboard)
- [ ] Update all internal links and redirects

### Preview Page
- [ ] Render the generated panel component dynamically
- [ ] Dark background, centered, no editor chrome
- [ ] Interactive (panelState, highlightedControls work)
- [ ] "Back to Editor" and "Submit for Review" buttons
- [ ] Notes field for contractor on submit

### Admin Review Dashboard
- [ ] List all instruments with status badges
- [ ] Filter by status (Pending Review, Changes Requested, Approved, etc.)
- [ ] Click → full preview with admin controls
- [ ] "Request Changes" with notes textarea
- [ ] "Approve & Build Tutorials" trigger
- [ ] "Publish to Site" for final approval

### Status System
- [ ] Add status field to pipeline state
- [ ] Status transitions with timestamps
- [ ] Status badges on dashboard cards
- [ ] Email/notification when status changes (future)

### Feedback Loop
- [ ] Save codegen output snapshot before contractor edits
- [ ] Capture diff after approval
- [ ] Store corrections in codegen-feedback.json
- [ ] Pattern analyzer (runs after 5+ instruments)
- [ ] Codegen reads learned rules

### API Routes
- [ ] POST /api/pipeline/{deviceId}/submit-review (contractor submits)
- [ ] POST /api/pipeline/{deviceId}/review (admin approves/rejects)
- [ ] POST /api/pipeline/{deviceId}/publish (admin publishes)
- [ ] GET /api/pipeline/{deviceId}/preview (serve generated component data)

## Implementation Order

1. Route restructure (move /pipeline/ to /)
2. WYSIWYG Preview page
3. Submit for Review flow
4. Admin Review dashboard
5. Status system
6. Tutorial pipeline trigger
7. Publish flow
8. Feedback loop

## Branch

Work on: `feature/pipeline-architecture-upgrade` (targets `test`)
