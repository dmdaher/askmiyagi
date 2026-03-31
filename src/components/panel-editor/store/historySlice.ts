import { StateCreator } from 'zustand';
import type { ControlDef, SectionDef } from './manifestSlice';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ManifestSnapshot {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  canvasWidth?: number;
  canvasHeight?: number;
  keyboard?: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number } | null;
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

  return {
    sections,
    controls,
    canvasWidth: snapshot.canvasWidth,
    canvasHeight: snapshot.canvasHeight,
    keyboard: snapshot.keyboard ? { ...snapshot.keyboard } : snapshot.keyboard,
  };
}

// ─── Combined state shape for get() access ──────────────────────────────────
// The history slice needs to read/write sections and controls from the
// manifest slice. In the composed store both slices share the same state
// object, so we declare the minimal shape needed here.

interface ManifestFields {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  hasUserEdited: boolean;
  canvasWidth: number;
  canvasHeight: number;
  keyboard: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number } | null;
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
    const { sections, controls, past, canvasWidth, canvasHeight, keyboard } = get();
    const snapshot = cloneSnapshot({ sections, controls, canvasWidth, canvasHeight, keyboard });
    const newPast = [...past, snapshot];
    // Cap at MAX_HISTORY entries
    if (newPast.length > MAX_HISTORY) {
      newPast.splice(0, newPast.length - MAX_HISTORY);
    }
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, sections, controls, canvasWidth, canvasHeight, keyboard } = get();
    if (past.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls, canvasWidth, canvasHeight, keyboard });
    const previous = past[past.length - 1];
    const restored = cloneSnapshot(previous);

    const update: Record<string, unknown> = {
      past: past.slice(0, -1),
      future: [...future, currentSnapshot],
      sections: restored.sections,
      controls: restored.controls,
    };
    if (restored.canvasWidth != null) update.canvasWidth = restored.canvasWidth;
    if (restored.canvasHeight != null) update.canvasHeight = restored.canvasHeight;
    if (restored.keyboard !== undefined) update.keyboard = restored.keyboard;
    set(update as any);
  },

  redo: () => {
    const { past, future, sections, controls, canvasWidth, canvasHeight, keyboard } = get();
    if (future.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls, canvasWidth, canvasHeight, keyboard });
    const next = future[future.length - 1];
    const restored = cloneSnapshot(next);

    const update: Record<string, unknown> = {
      past: [...past, currentSnapshot],
      future: future.slice(0, -1),
      sections: restored.sections,
      controls: restored.controls,
    };
    if (restored.canvasWidth != null) update.canvasWidth = restored.canvasWidth;
    if (restored.canvasHeight != null) update.canvasHeight = restored.canvasHeight;
    if (restored.keyboard !== undefined) update.keyboard = restored.keyboard;
    set(update as any);
  },
});
