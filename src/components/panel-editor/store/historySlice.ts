import { StateCreator } from 'zustand';
import type { ControlDef, SectionDef, ControlContainer } from './manifestSlice';
import type { ScaleBase } from './canvasSlice';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Placeholder types for future features — empty arrays until implemented */
export interface EditorLabel {
  id: string;
  controlId: string | null;  // linked control, or null for standalone
  /**
   * For STANDALONE labels (controlId === null), the section that owns this
   * label in the Layers panel tree. Set on creation via findNearestSection,
   * recomputed on drag, cleared by section-delete cascade. Optional — old
   * data and labels dropped outside any section render in the "Unassigned"
   * bottom block.
   *
   * For LINKED labels (controlId !== null), this field is unused — section
   * is derived dynamically from the linked control's sectionId.
   */
  sectionId?: string;
  text: string;
  icon?: string;  // optional icon key from HARDWARE_ICONS (rendered before text)
  x: number;
  y: number;
  w?: number;  // optional width for text centering
  fontSize: number;
  align: 'left' | 'center' | 'right';
  hidden?: boolean;  // soft-hide: preserves position, just not rendered
  /** Optional text color override. Empty/undefined renders at the default
   *  `text-gray-300`. Set via the Properties panel color picker. */
  color?: string;
}
export interface ControlGroup {
  id: string;
  name: string;
  controlIds: string[];
}

export interface ManifestSnapshot {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  editorLabels?: EditorLabel[];
  controlGroups?: ControlGroup[];
  controlContainers?: ControlContainer[];
  canvasWidth?: number;
  canvasHeight?: number;
  keyboard?: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number; aspectLockMode?: 'auto' | 'manual' } | null;
  /** Ruler guides — included so undo/redo restores them after scaleFromBase moves them. */
  guides?: { id: string; orientation: 'horizontal' | 'vertical'; position: number }[];
  /**
   * Scale state — must travel with positions or undo/redo could leave the
   * editor in an inconsistent state where scaleCumulativeFactor doesn't
   * match the actual control positions. See scaleFromBase in manifestSlice.
   */
  scaleBase?: ScaleBase | null;
  scaleCumulativeFactor?: number;
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

function cloneScaleBase(base: ScaleBase | null | undefined): ScaleBase | null {
  if (!base) return base ?? null;
  const controls: ScaleBase['controls'] = {};
  for (const [k, v] of Object.entries(base.controls)) {
    controls[k] = { ...v };
  }
  const sections: ScaleBase['sections'] = {};
  for (const [k, v] of Object.entries(base.sections)) {
    sections[k] = { ...v };
  }
  return {
    controls,
    sections,
    labels: base.labels.map((l) => ({ ...l })),
    containers: base.containers.map((c) => ({ ...c })),
    guides: base.guides.map((g) => ({ ...g })),
    canvasWidth: base.canvasWidth,
    canvasHeight: base.canvasHeight,
  };
}

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
      controlIds: [...g.controlIds],
    })) ?? [],
    controlContainers: snapshot.controlContainers?.map((c) => ({
      ...c,
      controlIds: [...c.controlIds],
    })) ?? [],
    canvasWidth: snapshot.canvasWidth,
    canvasHeight: snapshot.canvasHeight,
    keyboard: snapshot.keyboard ? { ...snapshot.keyboard } : undefined,
    guides: snapshot.guides?.map((g) => ({ ...g })) ?? [],
    scaleBase: cloneScaleBase(snapshot.scaleBase),
    scaleCumulativeFactor: snapshot.scaleCumulativeFactor ?? 1.0,
  };
}

// ─── Combined state shape for get() access ──────────────────────────────────

interface ManifestFields {
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  editorLabels: unknown[];
  controlGroups: unknown[];
  controlContainers: unknown[];
  hasUserEdited: boolean;
  canvasWidth: number;
  canvasHeight: number;
  keyboard: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number; aspectLockMode?: 'auto' | 'manual' } | null;
  guides: { id: string; orientation: 'horizontal' | 'vertical'; position: number }[];
  scaleBase: ScaleBase | null;
  scaleCumulativeFactor: number;
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
    const { sections, controls, past, canvasWidth, canvasHeight, keyboard, editorLabels, controlGroups, controlContainers, guides, scaleBase, scaleCumulativeFactor } = get();
    const snapshot = cloneSnapshot({ sections, controls, editorLabels: editorLabels as EditorLabel[], controlGroups: controlGroups as ControlGroup[], controlContainers: controlContainers as ControlContainer[], canvasWidth, canvasHeight, keyboard, guides, scaleBase, scaleCumulativeFactor });
    const newPast = [...past, snapshot];
    if (newPast.length > MAX_HISTORY) {
      newPast.splice(0, newPast.length - MAX_HISTORY);
    }
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, sections, controls, canvasWidth, canvasHeight, keyboard, editorLabels, controlGroups, controlContainers, guides, scaleBase, scaleCumulativeFactor } = get();
    if (past.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls, editorLabels: editorLabels as EditorLabel[], controlGroups: controlGroups as ControlGroup[], controlContainers: controlContainers as ControlContainer[], canvasWidth, canvasHeight, keyboard, guides, scaleBase, scaleCumulativeFactor });
    const previous = past[past.length - 1];
    const restored = cloneSnapshot(previous);

    const update: Record<string, unknown> = {
      past: past.slice(0, -1),
      future: [...future, currentSnapshot],
      sections: restored.sections,
      controls: restored.controls,
      editorLabels: restored.editorLabels ?? [],
      controlGroups: restored.controlGroups ?? [],
      controlContainers: restored.controlContainers ?? [],
      scaleBase: restored.scaleBase ?? null,
      scaleCumulativeFactor: restored.scaleCumulativeFactor ?? 1.0,
    };
    if (restored.canvasWidth != null) update.canvasWidth = restored.canvasWidth;
    if (restored.canvasHeight != null) update.canvasHeight = restored.canvasHeight;
    if (restored.keyboard !== undefined) update.keyboard = restored.keyboard;
    if (restored.guides) update.guides = restored.guides;
    set(update as any);
  },

  redo: () => {
    const { past, future, sections, controls, canvasWidth, canvasHeight, keyboard, editorLabels, controlGroups, controlContainers, guides, scaleBase, scaleCumulativeFactor } = get();
    if (future.length === 0) return;

    const currentSnapshot = cloneSnapshot({ sections, controls, editorLabels: editorLabels as EditorLabel[], controlGroups: controlGroups as ControlGroup[], controlContainers: controlContainers as ControlContainer[], canvasWidth, canvasHeight, keyboard, guides, scaleBase, scaleCumulativeFactor });
    const next = future[future.length - 1];
    const restored = cloneSnapshot(next);

    const update: Record<string, unknown> = {
      past: [...past, currentSnapshot],
      future: future.slice(0, -1),
      sections: restored.sections,
      controls: restored.controls,
      editorLabels: restored.editorLabels ?? [],
      controlGroups: restored.controlGroups ?? [],
      controlContainers: restored.controlContainers ?? [],
      scaleBase: restored.scaleBase ?? null,
      scaleCumulativeFactor: restored.scaleCumulativeFactor ?? 1.0,
    };
    if (restored.canvasWidth != null) update.canvasWidth = restored.canvasWidth;
    if (restored.canvasHeight != null) update.canvasHeight = restored.canvasHeight;
    if (restored.keyboard !== undefined) update.keyboard = restored.keyboard;
    if (restored.guides) update.guides = restored.guides;
    set(update as any);
  },
});
