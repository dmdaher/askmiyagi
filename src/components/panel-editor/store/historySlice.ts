import { StateCreator } from 'zustand';
import type { ControlDef, SectionDef } from './manifestSlice';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ManifestSnapshot {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
}

const MAX_HISTORY = 100;

export interface HistorySlice {
  // State
  past: ManifestSnapshot[];
  future: ManifestSnapshot[];

  // Actions
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deep clone a snapshot (sections + controls are flat Record<string, obj>) */
function cloneSnapshot(snapshot: ManifestSnapshot): ManifestSnapshot {
  const sections: Record<string, SectionDef> = {};
  for (const [k, v] of Object.entries(snapshot.sections)) {
    sections[k] = { ...v, childIds: [...v.childIds] };
  }

  const controls: Record<string, ControlDef> = {};
  for (const [k, v] of Object.entries(snapshot.controls)) {
    controls[k] = { ...v };
  }

  return { sections, controls };
}

// ─── Combined state shape for get() access ──────────────────────────────────
// The history slice needs to read/write sections and controls from the
// manifest slice. In the composed store both slices share the same state
// object, so we declare the minimal shape needed here.

interface ManifestFields {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  hasUserEdited: boolean;
}

// ─── Slice Creator ──────────────────────────────────────────────────────────

export const createHistorySlice: StateCreator<
  HistorySlice & ManifestFields,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  past: [],
  future: [],

  pushSnapshot: () => {
    // Mark as user-edited — pushSnapshot is called exclusively before user mutations.
    // This enables auto-save (prevents programmatic changes from triggering saves).
    if (!get().hasUserEdited) {
      set({ hasUserEdited: true });
    }
    const { sections, controls, past } = get();
    const snapshot = cloneSnapshot({ sections, controls });
    const newPast = [...past, snapshot];
    // Cap at MAX_HISTORY entries
    if (newPast.length > MAX_HISTORY) {
      newPast.splice(0, newPast.length - MAX_HISTORY);
    }
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, sections, controls } = get();
    if (past.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls });
    const previous = past[past.length - 1];
    const restored = cloneSnapshot(previous);

    set({
      past: past.slice(0, -1),
      future: [...future, currentSnapshot],
      sections: restored.sections,
      controls: restored.controls,
    });
  },

  redo: () => {
    const { past, future, sections, controls } = get();
    if (future.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls });
    const next = future[future.length - 1];
    const restored = cloneSnapshot(next);

    set({
      past: [...past, currentSnapshot],
      future: future.slice(0, -1),
      sections: restored.sections,
      controls: restored.controls,
    });
  },
});
