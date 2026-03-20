import { StateCreator } from 'zustand';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Canvas base size for converting manifest % to px coordinates */
export const CANVAS_BASE_W = 1200;
export const CANVAS_BASE_H = 800;

/** Default pixel dimensions per control type */
const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  button:  { w: 48,  h: 32  },
  knob:    { w: 48,  h: 48  },
  slider:  { w: 32,  h: 120 },
  fader:   { w: 32,  h: 120 },
  led:     { w: 16,  h: 16  },
  wheel:   { w: 120, h: 120 },
  pad:     { w: 48,  h: 48  },
  encoder: { w: 48,  h: 48  },
  lever:   { w: 24,  h: 48  },
  switch:  { w: 24,  h: 48  },
  screen:  { w: 200, h: 120 },
};

// ─── Manifest input types (mirrored from layout-engine.ts) ──────────────────
// scripts/ is excluded from tsconfig so we re-declare the subset we need.

type SubZone = string[] | { controls: string[]; direction: 'row' | 'column' };

interface ManifestControl {
  id: string;
  verbatimLabel: string;
  type: string;
  section: string;
  functionalGroup: string;
  spatialNeighbors: {
    above: string | null;
    below: string | null;
    left: string | null;
    right: string | null;
  };
}

interface ManifestSection {
  id: string;
  headerLabel: string | null;
  archetype: string;
  panelBoundingBox?: { x: number; y: number; w: number; h: number };
  gridRows?: number;
  gridCols?: number;
  controls: string[];
  containerAssignment?: Record<string, string[] | Record<string, SubZone>>;
  heightSplits?: { cluster: number; anchor: number; gap: number };
  widthPercent: number;
  complexity: string;
}

export interface MasterManifestInput {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  layoutType: string;
  sections: ManifestSection[];
  controls: ManifestControl[];
}

// ─── Editor data model (flat maps) ──────────────────────────────────────────

export interface ControlDef {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sectionId: string;
  labelPosition: 'above' | 'below' | 'left' | 'right' | 'on-button';
  locked: boolean;
  secondaryLabel?: string;
}

export interface SectionDef {
  id: string;
  headerLabel: string | null;
  archetype: string;
  x: number;
  y: number;
  w: number;
  h: number;
  childIds: string[];
}

// ─── Slice interface ────────────────────────────────────────────────────────

export interface ManifestSlice {
  // State
  deviceId: string;
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  selectedIds: string[];
  lockedIds: string[];

  // Actions
  loadFromManifest: (manifest: MasterManifestInput) => void;
  moveControl: (id: string, dx: number, dy: number) => void;
  resizeControl: (id: string, w: number, h: number) => void;
  moveSection: (id: string, dx: number, dy: number) => void;
  resizeSection: (id: string, w: number, h: number) => void;
  moveSelectedControls: (dx: number, dy: number) => void;
  updateControlProp: (ids: string[], field: string, value: unknown) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  toggleLock: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  addControl: (sectionId: string, type: string, label: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function defaultLabelPosition(type: string): ControlDef['labelPosition'] {
  if (type === 'button' || type === 'pad') return 'on-button';
  if (type === 'led') return 'right';
  return 'below';
}

function defaultSize(type: string): { w: number; h: number } {
  return DEFAULT_SIZES[type] ?? { w: 48, h: 32 };
}

let addCounter = 0;

// ─── Slice Creator ──────────────────────────────────────────────────────────

export const createManifestSlice: StateCreator<
  ManifestSlice,
  [],
  [],
  ManifestSlice
> = (set, get) => ({
  // Default state
  deviceId: '',
  sections: {},
  controls: {},
  selectedIds: [],
  lockedIds: [],

  // ── Actions ─────────────────────────────────────────────────────────────

  loadFromManifest: (manifest) => {
    const sections: Record<string, SectionDef> = {};
    const controls: Record<string, ControlDef> = {};

    // Build a lookup of manifest controls by ID
    const mcById = new Map<string, ManifestControl>();
    for (const mc of manifest.controls) {
      mcById.set(mc.id, mc);
    }

    for (const ms of manifest.sections) {
      // Convert panelBoundingBox % to pixel coordinates
      const bbox = ms.panelBoundingBox ?? { x: 0, y: 0, w: 20, h: 20 };
      const sectionX = (bbox.x / 100) * CANVAS_BASE_W;
      const sectionY = (bbox.y / 100) * CANVAS_BASE_H;
      const sectionW = (bbox.w / 100) * CANVAS_BASE_W;
      const sectionH = (bbox.h / 100) * CANVAS_BASE_H;

      sections[ms.id] = {
        id: ms.id,
        headerLabel: ms.headerLabel,
        archetype: ms.archetype,
        x: sectionX,
        y: sectionY,
        w: sectionW,
        h: sectionH,
        childIds: [...ms.controls],
      };

      // Place controls within the section. Simple grid layout based on order.
      const controlCount = ms.controls.length;
      const cols = Math.ceil(Math.sqrt(controlCount));

      for (let i = 0; i < ms.controls.length; i++) {
        const controlId = ms.controls[i];
        const mc = mcById.get(controlId);
        if (!mc) continue;

        const size = defaultSize(mc.type);
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Offset within the section with some padding
        const padding = 8;
        const headerOffset = ms.headerLabel ? 16 : 0;
        const availH = sectionH - padding * 2 - headerOffset;
        const rows = Math.ceil(controlCount / cols);
        const cellW = (sectionW - padding * 2) / cols;
        const cellH = rows > 1 ? availH / rows : availH;

        // Clamp control size to fit within cell (with 4px gap)
        const fitW = Math.min(size.w, cellW - 4);
        const fitH = Math.min(size.h, cellH - 4);

        controls[controlId] = {
          id: controlId,
          label: mc.verbatimLabel,
          type: mc.type,
          x: sectionX + padding + col * cellW + (cellW - fitW) / 2,
          y: sectionY + padding + headerOffset + row * cellH + (cellH - fitH) / 2,
          w: fitW,
          h: fitH,
          sectionId: ms.id,
          labelPosition: defaultLabelPosition(mc.type),
          locked: false,
        };
      }
    }

    set({
      deviceId: manifest.deviceId,
      sections,
      controls,
      selectedIds: [],
      lockedIds: [],
    });
  },

  moveControl: (id, dx, dy) => {
    const ctrl = get().controls[id];
    if (!ctrl || ctrl.locked) return;
    set((s) => ({
      controls: {
        ...s.controls,
        [id]: { ...ctrl, x: ctrl.x + dx, y: ctrl.y + dy },
      },
    }));
  },

  resizeControl: (id, w, h) => {
    const ctrl = get().controls[id];
    if (!ctrl || ctrl.locked) return;
    set((s) => ({
      controls: {
        ...s.controls,
        [id]: { ...ctrl, w: Math.max(8, w), h: Math.max(8, h) },
      },
    }));
  },

  moveSection: (id, dx, dy) => {
    const section = get().sections[id];
    if (!section) return;
    const controls = { ...get().controls };

    // Move section + all child controls
    for (const childId of section.childIds) {
      const child = controls[childId];
      if (child && !child.locked) {
        controls[childId] = { ...child, x: child.x + dx, y: child.y + dy };
      }
    }

    set({
      sections: {
        ...get().sections,
        [id]: { ...section, x: section.x + dx, y: section.y + dy },
      },
      controls,
    });
  },

  resizeSection: (id, w, h) => {
    const section = get().sections[id];
    if (!section) return;
    set((s) => ({
      sections: {
        ...s.sections,
        [id]: { ...section, w: Math.max(24, w), h: Math.max(24, h) },
      },
    }));
  },

  moveSelectedControls: (dx, dy) => {
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const updated = { ...controls };
    let changed = false;

    for (const id of selectedIds) {
      if (lockedSet.has(id)) continue;
      const ctrl = updated[id];
      if (ctrl) {
        updated[id] = { ...ctrl, x: ctrl.x + dx, y: ctrl.y + dy };
        changed = true;
      }
    }

    if (changed) {
      set({ controls: updated });
    }
  },

  updateControlProp: (ids, field, value) => {
    const controls = { ...get().controls };
    for (const id of ids) {
      const ctrl = controls[id];
      if (ctrl) {
        controls[id] = { ...ctrl, [field]: value };
      }
    }
    set({ controls });
  },

  duplicateSelected: () => {
    const { selectedIds, controls, sections } = get();
    if (selectedIds.length === 0) return;

    const updatedControls = { ...controls };
    const updatedSections = { ...sections };
    const newIds: string[] = [];

    for (const id of selectedIds) {
      const original = controls[id];
      if (!original) continue;

      const copyId = `${id}-copy`;
      const copy: ControlDef = {
        ...original,
        id: copyId,
        x: original.x + 16,
        y: original.y + 16,
        locked: false,
      };
      updatedControls[copyId] = copy;
      newIds.push(copyId);

      // Add to parent section's childIds
      const section = updatedSections[original.sectionId];
      if (section) {
        updatedSections[original.sectionId] = {
          ...section,
          childIds: [...section.childIds, copyId],
        };
      }
    }

    set({
      controls: updatedControls,
      sections: updatedSections,
      selectedIds: newIds,
    });
  },

  deleteSelected: () => {
    const { selectedIds, controls, sections } = get();
    if (selectedIds.length === 0) return;

    const deleteSet = new Set(selectedIds);
    const updatedControls = { ...controls };
    const updatedSections = { ...sections };

    for (const id of selectedIds) {
      const ctrl = updatedControls[id];
      if (!ctrl) continue;

      // Remove from parent section's childIds
      const section = updatedSections[ctrl.sectionId];
      if (section) {
        updatedSections[ctrl.sectionId] = {
          ...section,
          childIds: section.childIds.filter((cid) => !deleteSet.has(cid)),
        };
      }

      delete updatedControls[id];
    }

    // Also remove from lockedIds
    const lockedIds = get().lockedIds.filter((lid) => !deleteSet.has(lid));

    set({
      controls: updatedControls,
      sections: updatedSections,
      selectedIds: [],
      lockedIds,
    });
  },

  toggleLock: (id) => {
    const { lockedIds, controls } = get();
    const isLocked = lockedIds.includes(id);
    const ctrl = controls[id];
    if (!ctrl) return;

    set({
      lockedIds: isLocked
        ? lockedIds.filter((lid) => lid !== id)
        : [...lockedIds, id],
      controls: {
        ...controls,
        [id]: { ...ctrl, locked: !isLocked },
      },
    });
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelected: (id) => {
    const { selectedIds } = get();
    const idx = selectedIds.indexOf(id);
    if (idx >= 0) {
      set({ selectedIds: selectedIds.filter((sid) => sid !== id) });
    } else {
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  addControl: (sectionId, type, label) => {
    const section = get().sections[sectionId];
    if (!section) return;

    addCounter++;
    const id = `${sectionId}-new-${addCounter}`;
    const size = defaultSize(type);

    const newControl: ControlDef = {
      id,
      label,
      type,
      x: section.x + section.w / 2 - size.w / 2,
      y: section.y + section.h / 2 - size.h / 2,
      w: size.w,
      h: size.h,
      sectionId,
      labelPosition: defaultLabelPosition(type),
      locked: false,
    };

    set((s) => ({
      controls: { ...s.controls, [id]: newControl },
      sections: {
        ...s.sections,
        [sectionId]: {
          ...section,
          childIds: [...section.childIds, id],
        },
      },
    }));
  },
});
