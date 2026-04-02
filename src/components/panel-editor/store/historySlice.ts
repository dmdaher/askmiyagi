import { StateCreator } from 'zustand';
import type { ControlDef, SectionDef } from './manifestSlice';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Placeholder types for future features — empty arrays until implemented */
export interface EditorLabel {
  id: string;
  controlId: string | null;  // linked control, or null for standalone
  text: string;
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}
export type ControlGroup = Record<string, unknown> & { controlIds?: string[] };

export interface ManifestSnapshot {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  editorLabels?: EditorLabel[];
  controlGroups?: ControlGroup[];
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

/** Deep clone a snapshot — scalable pattern for adding new fields */

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
    editorLabels: snapshot.editorLabels?.map((l) => ({ ...l })) ?? [],
    controlGroups: snapshot.controlGroups?.map((g) => ({
      ...g,
      controlIds: g.controlIds ? [...g.controlIds] : [],
    })) ?? [],
    canvasWidth: snapshot.canvasWidth,
    canvasHeight: snapshot.canvasHeight,
    keyboard: snapshot.keyboard ? { ...snapshot.keyboard } : undefined,
  };
}

// ─── Combined state shape for get() access ──────────────────────────────────

interface ManifestFields {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  editorLabels: unknown[];
  controlGroups: unknown[];
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
    if (!get().hasUserEdited) {
      set({ hasUserEdited: true });
    }
    const { sections, controls, past, canvasWidth, canvasHeight, keyboard, editorLabels, controlGroups } = get();
    const snapshot = cloneSnapshot({ sections, controls, editorLabels: editorLabels as EditorLabel[], controlGroups: controlGroups as ControlGroup[], canvasWidth, canvasHeight, keyboard });
    const newPast = [...past, snapshot];
    if (newPast.length > MAX_HISTORY) {
      newPast.splice(0, newPast.length - MAX_HISTORY);
    }
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, sections, controls, canvasWidth, canvasHeight, keyboard, editorLabels, controlGroups } = get();
    if (past.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls, editorLabels: editorLabels as EditorLabel[], controlGroups: controlGroups as ControlGroup[], canvasWidth, canvasHeight, keyboard });
    const previous = past[past.length - 1];
    const restored = cloneSnapshot(previous);

    const update: Record<string, unknown> = {
      past: past.slice(0, -1),
      future: [...future, currentSnapshot],
      sections: restored.sections,
      controls: restored.controls,
      editorLabels: restored.editorLabels ?? [],
      controlGroups: restored.controlGroups ?? [],
    };
    if (restored.canvasWidth != null) update.canvasWidth = restored.canvasWidth;
    if (restored.canvasHeight != null) update.canvasHeight = restored.canvasHeight;
    if (restored.keyboard !== undefined) update.keyboard = restored.keyboard;
    set(update as any);
  },

  redo: () => {
    const { past, future, sections, controls, canvasWidth, canvasHeight, keyboard, editorLabels, controlGroups } = get();
    if (future.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls, editorLabels: editorLabels as EditorLabel[], controlGroups: controlGroups as ControlGroup[], canvasWidth, canvasHeight, keyboard });
    const next = future[future.length - 1];
    const restored = cloneSnapshot(next);

    const update: Record<string, unknown> = {
      past: [...past, currentSnapshot],
      future: future.slice(0, -1),
      sections: restored.sections,
      controls: restored.controls,
      editorLabels: restored.editorLabels ?? [],
      controlGroups: restored.controlGroups ?? [],
    };
    if (restored.canvasWidth != null) update.canvasWidth = restored.canvasWidth;
    if (restored.canvasHeight != null) update.canvasHeight = restored.canvasHeight;
    if (restored.keyboard !== undefined) update.keyboard = restored.keyboard;
    set(update as any);
  },
});
