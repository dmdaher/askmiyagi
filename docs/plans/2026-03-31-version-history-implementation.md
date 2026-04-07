# Version History — Safe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add a "History" dropdown to the editor toolbar that lets the contractor browse and restore any previous auto-save backup. No data loss, no race conditions.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## Blockers Identified & Solutions

### BLOCKER 1: Auto-save race condition during restore
**Problem:** After restore loads old data into the store, the 800ms auto-save debounce could fire and overwrite it.
**Solution:** Set `hasUserEdited: false` in the setState call. The auto-save guard (useAutoSave.ts line 71) already blocks saves when `hasUserEdited` is false. No new flags needed.

### BLOCKER 2: Skip guard prevents reload
**Problem:** PanelEditor's useEffect skips disk reload if store already has data for this device.
**Solution:** Don't reload from disk — setState directly from the restore API response. The skip guard stays untouched.

### BLOCKER 3: Stale undo stack after restore
**Problem:** Cmd+Z after restore goes to pre-restore state unexpectedly.
**Solution:** Push pre-restore state as a snapshot before loading restored data. Cmd+Z undoes the restore. Clear `future: []` (redo invalid after version jump).

### BLOCKER 4: _manifestVersion staleness
**Problem:** Old backup has old version hash, staleness check discards it.
**Solution:** Recompute `_manifestVersion` from current pipeline manifest after restore. Or accept staleness — if pipeline re-ran, old edits SHOULD be discarded.

---

## Implementation

### Step 1: API Routes

**File:** Create `src/app/api/pipeline/[deviceId]/versions/route.ts`

```typescript
// GET — list all backups
// Returns: { versions: [{ filename, timestamp, sizeBytes, isCurrent }] }
// Reads .pipeline/{deviceId}/backups/ + current manifest-editor.json
// Sorted newest first, max 50 entries

// POST — not used here (restore is separate)
```

**File:** Create `src/app/api/pipeline/[deviceId]/versions/restore/route.ts`

```typescript
// POST — restore a backup
// Body: { filename: string }
// Steps:
//   1. Validate filename (prevent path traversal)
//   2. Backup current manifest-editor.json (append-only)
//   3. Copy selected backup to manifest-editor.json
//   4. Recompute _manifestVersion from current pipeline manifest
//   5. Read restored file, normalize sections/controls to arrays
//   6. Return full restored data with _source: 'restore'
```

### Step 2: VersionHistoryDropdown Component

**File:** Create `src/components/panel-editor/VersionHistoryDropdown.tsx`

- "History" button opens a dropdown panel (280px wide, max-height scroll)
- Fetches versions on open (not on mount — lazy load)
- Each entry: relative time + absolute timestamp + "Restore" button
- Current version at top with badge
- On restore click:
  1. `useEditorStore.getState().pushSnapshot()` — save pre-restore for undo
  2. POST to restore endpoint
  3. Normalize response (arrays → Records)
  4. `useEditorStore.setState({ sections, controls, ..., future: [], hasUserEdited: false })`
  5. Close dropdown

### Step 3: Toolbar Integration

**File:** Modify `src/components/panel-editor/EditorToolbar.tsx`

- Add `deviceId: string` prop
- Insert `<VersionHistoryDropdown deviceId={deviceId} />` before Report Issue button
- Pass deviceId from PanelEditor → EditorToolbar

**File:** Modify `src/components/panel-editor/PanelEditor.tsx`

- Pass `deviceId` to EditorToolbar: `<EditorToolbar deviceId={deviceId} ... />`

---

## Restore setState — Complete Field List

```typescript
useEditorStore.setState({
  // Content (from restored backup)
  sections,          // Record<id, SectionDef>
  controls,          // Record<id, ControlDef>
  keyboard: data.keyboard ?? null,

  // Canvas (from restored backup, with defaults)
  canvasWidth: data.canvasWidth ?? 1200,
  canvasHeight: data.canvasHeight ?? 1650,
  controlScale: data.controlScale ?? 1.0,
  zoom: data.zoom ?? 1,
  cleanupGap: data.cleanupGap ?? 8,
  panelScale: data.panelScale ?? 1.0,

  // Metadata
  _manifestVersion: recomputedVersion,

  // Reset UI state
  selectedIds: [],
  lockedIds: [],
  focusedSectionId: null,

  // Undo: keep pre-restore snapshot in past, clear redo
  future: [],

  // Safety: block auto-save during restore
  hasUserEdited: false,
});
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/pipeline/[deviceId]/versions/route.ts` | NEW — GET list backups |
| `src/app/api/pipeline/[deviceId]/versions/restore/route.ts` | NEW — POST restore backup |
| `src/components/panel-editor/VersionHistoryDropdown.tsx` | NEW — dropdown component |
| `src/components/panel-editor/EditorToolbar.tsx` | Add deviceId prop + History button |
| `src/components/panel-editor/PanelEditor.tsx` | Pass deviceId to EditorToolbar |

## Files NOT Modified

- `useAutoSave.ts` — hasUserEdited guard handles restore naturally
- `historySlice.ts` — undo/redo logic unchanged
- `canvasSlice.ts` — no changes
- `manifestSlice.ts` — no changes
- `manifest/route.ts` — existing GET/PUT unchanged
