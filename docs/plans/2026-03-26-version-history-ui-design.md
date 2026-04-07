# Version History UI — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Let the contractor browse and restore any previous editor save from a toolbar dropdown.

**Architecture:** Server-side disk backups (already exist in `.pipeline/{id}/backups/`) served via a new API endpoint. Frontend dropdown component in the editor toolbar. No git, no localStorage — purely disk-based.

**Tech Stack:** Next.js API route, React dropdown component, existing backup infrastructure.

---

## Storage (Already Implemented)

- Every auto-save creates a timestamped backup: `.pipeline/{id}/backups/manifest-editor-YYYY-MM-DDTHH-MM-SS.json`
- Backups are **append-only** — never deleted (per never-delete-editor rule)
- Current state lives in `.pipeline/{id}/manifest-editor.json`
- Undo stack (Cmd+Z) stays in localStorage — separate concern, in-session only

## API

### `GET /api/pipeline/{deviceId}/versions`

Returns sorted array (newest first):

```json
{
  "versions": [
    { "filename": "current", "timestamp": "2026-03-26T21:15:00Z", "sizeBytes": 63580, "isCurrent": true },
    { "filename": "manifest-editor-2026-03-26T21-11-50.json", "timestamp": "2026-03-26T21:11:50Z", "sizeBytes": 63580 },
    { "filename": "manifest-editor-2026-03-26T21-11-48.json", "timestamp": "2026-03-26T21:11:48Z", "sizeBytes": 63596 }
  ]
}
```

### `POST /api/pipeline/{deviceId}/versions/restore`

Request: `{ "filename": "manifest-editor-2026-03-26T21-11-50.json" }`

Behavior:
1. Backup current manifest-editor.json (append-only, never delete)
2. Copy the selected backup to manifest-editor.json
3. Return the restored data so the frontend can reload without a round-trip

## Frontend: `VersionHistoryDropdown`

- **Location:** Editor toolbar, right side (near Report Issue / Help buttons)
- **Trigger:** "History" button, same style as Grid/Labels/Photo toggles
- **Dropdown:** Fixed-width panel (280px), max-height with scroll
- **Each entry shows:**
  - Relative time: "2 min ago", "1 hour ago", "Yesterday 3:15 PM"
  - Absolute timestamp: "Mar 26, 3:15:50 PM"
  - "Restore" button (only on non-current entries)
- **Current version:** Shown at top with "Current" badge, no restore button
- **Max display:** 50 versions, scrollable. If more exist, show "Showing 50 of N versions"
- **On restore:** Calls POST endpoint, then reloads editor state from response (no full page refresh)

## Edge Cases

- **Empty backups dir:** Show "No previous versions" message
- **Restore while editing:** Backup current state first (server handles this), then load. `hasUserEdited` resets to false.
- **Concurrent sessions:** Each auto-save creates a new backup regardless. Restore always creates a pre-restore backup.
- **Disk space:** Auto-saves fire every 800ms during active editing. Each file is ~60KB. 1 hour of active editing ≈ 4,500 files ≈ 270MB. Consider throttling backups to max 1 per 5 seconds in a future iteration if disk becomes a concern.

## Not In Scope

- Diff view between versions (future)
- Named/tagged versions (future)
- Pruning old backups (violates never-delete rule)
