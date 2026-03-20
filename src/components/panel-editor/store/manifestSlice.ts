import { StateCreator } from 'zustand';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Canvas base size for converting manifest % to px coordinates.
 *  Bounding boxes in the manifest are 0-100% normalized.
 *  These values define the pixel space and the panel's aspect ratio. */
export const CANVAS_BASE_W = 1200;
export const CANVAS_BASE_H = 1650;

/** Default pixel dimensions per control type */
const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  button:  { w: 64,  h: 40  },
  knob:    { w: 64,  h: 64  },
  slider:  { w: 40,  h: 160 },
  fader:   { w: 40,  h: 160 },
  led:     { w: 24,  h: 24  },
  wheel:   { w: 160, h: 160 },
  pad:     { w: 64,  h: 64  },
  encoder: { w: 64,  h: 64  },
  lever:   { w: 32,  h: 64  },
  switch:  { w: 32,  h: 64  },
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

      // ── Archetype-aware control placement ──────────────────────────────
      const padding = 8;
      const headerOffset = ms.headerLabel ? 16 : 0;
      const MIN_CONTROL_H = 28;
      const MIN_CONTROL_W = 28;

      // Calculate minimum section height needed to fit controls
      const controlCount = ms.controls.length;
      const archetype = ms.archetype;
      let neededRows = 1;
      if (archetype === 'single-column') {
        neededRows = controlCount;
      } else if (archetype === 'single-row') {
        neededRows = 1;
      } else if (archetype.startsWith('grid') || archetype === 'dual-column') {
        const cols = archetype === 'dual-column' ? 2 : (ms.gridCols ?? 2);
        neededRows = Math.ceil(controlCount / cols);
      } else if (archetype === 'stacked-rows' && ms.containerAssignment) {
        neededRows = Object.keys(ms.containerAssignment).length;
      } else {
        neededRows = Math.ceil(Math.sqrt(controlCount));
      }
      const minNeededH = neededRows * (MIN_CONTROL_H + 4) + padding * 2 + headerOffset;
      // Expand section if too small
      if (sectionH < minNeededH) {
        sections[ms.id].h = minNeededH;
      }
      const finalSectionH = Math.max(sectionH, minNeededH);

      const availW = sections[ms.id].w - padding * 2;
      const availH = finalSectionH - padding * 2 - headerOffset;
      const startX = sectionX + padding;
      const startY = sectionY + padding + headerOffset;

      const placeControl = (
        controlId: string,
        cx: number,
        cy: number,
        maxW?: number,
        maxH?: number,
      ) => {
        const mc = mcById.get(controlId);
        if (!mc) return;
        const size = defaultSize(mc.type);
        const fitW = Math.max(MIN_CONTROL_W, maxW ? Math.min(size.w, maxW - 4) : size.w);
        const fitH = Math.max(MIN_CONTROL_H, maxH ? Math.min(size.h, maxH - 4) : size.h);
        controls[controlId] = {
          id: controlId,
          label: mc.verbatimLabel,
          type: mc.type,
          x: cx,
          y: cy,
          w: fitW,
          h: fitH,
          sectionId: ms.id,
          labelPosition: defaultLabelPosition(mc.type),
          locked: false,
        };
      };

      const placeRow = (ids: string[], rowX: number, rowY: number, rowW: number, rowH: number) => {
        const cellW = rowW / ids.length;
        ids.forEach((id, i) => {
          const mc = mcById.get(id);
          const size = mc ? defaultSize(mc.type) : { w: 48, h: 32 };
          const fitW = Math.min(size.w, cellW - 4);
          const fitH = Math.min(size.h, rowH - 4);
          placeControl(id, rowX + i * cellW + (cellW - fitW) / 2, rowY + (rowH - fitH) / 2, cellW, rowH);
        });
      };

      const placeColumn = (ids: string[], colX: number, colY: number, colW: number, colH: number) => {
        const cellH = colH / ids.length;
        ids.forEach((id, i) => {
          const mc = mcById.get(id);
          const size = mc ? defaultSize(mc.type) : { w: 48, h: 32 };
          const fitW = Math.min(size.w, colW - 4);
          const fitH = Math.min(size.h, cellH - 4);
          placeControl(id, colX + (colW - fitW) / 2, colY + i * cellH + (cellH - fitH) / 2, colW, cellH);
        });
      };

      const placeGrid = (ids: string[], gx: number, gy: number, gw: number, gh: number, cols: number) => {
        const rows = Math.ceil(ids.length / cols);
        const cellW = gw / cols;
        const cellH = gh / rows;
        ids.forEach((id, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const mc = mcById.get(id);
          const size = mc ? defaultSize(mc.type) : { w: 48, h: 32 };
          const fitW = Math.min(size.w, cellW - 4);
          const fitH = Math.min(size.h, cellH - 4);
          placeControl(id, gx + col * cellW + (cellW - fitW) / 2, gy + row * cellH + (cellH - fitH) / 2, cellW, cellH);
        });
      };


      if (archetype === 'single-row') {
        // All controls in one horizontal row
        placeRow(ms.controls, startX, startY, availW, availH);

      } else if (archetype === 'single-column') {
        // All controls stacked vertically
        placeColumn(ms.controls, startX, startY, availW, availH);

      } else if (archetype.startsWith('grid') || archetype === 'dual-column') {
        // grid-NxM or dual-column
        const cols = archetype === 'dual-column' ? 2 : (ms.gridCols ?? 2);
        placeGrid(ms.controls, startX, startY, availW, availH, cols);

      } else if (archetype === 'stacked-rows' && ms.containerAssignment) {
        // Each container row is a horizontal flex row, stacked vertically
        const rowEntries = Object.entries(ms.containerAssignment).sort(([a], [b]) => a.localeCompare(b));
        const rowCount = rowEntries.length;
        const rowH = availH / rowCount;
        rowEntries.forEach(([, ids], rowIdx) => {
          const rowIds = Array.isArray(ids) ? ids : [];
          placeRow(rowIds, startX, startY + rowIdx * rowH, availW, rowH);
        });

      } else if (
        (archetype === 'cluster-above-anchor' || archetype === 'cluster-below-anchor') &&
        ms.containerAssignment
      ) {
        const splits = ms.heightSplits ?? { cluster: 0.5, anchor: 0.45, gap: 0.05 };
        const cols = ms.gridCols ?? 2;
        const clusterH = availH * splits.cluster;
        const anchorH = availH * splits.anchor;
        const gapH = availH * (splits.gap ?? 0.05);

        const clusterIds = ms.containerAssignment.cluster;
        const anchorValue = ms.containerAssignment.anchor;

        // Get flat anchor IDs (handle nested sub-zones)
        const anchorIds: string[] = [];
        if (Array.isArray(anchorValue)) {
          anchorIds.push(...anchorValue);
        } else if (anchorValue && typeof anchorValue === 'object') {
          // Nested sub-zones — flatten for positioning
          Object.values(anchorValue).forEach((sz) => {
            if (Array.isArray(sz)) {
              anchorIds.push(...sz);
            } else if (sz && typeof sz === 'object' && 'controls' in sz) {
              anchorIds.push(...(sz as { controls: string[] }).controls);
            }
          });
        }

        if (archetype === 'cluster-above-anchor') {
          // Cluster on top, anchor on bottom
          if (Array.isArray(clusterIds)) {
            placeGrid(clusterIds, startX, startY, availW, clusterH, cols);
          }
          placeRow(anchorIds, startX, startY + clusterH + gapH, availW, anchorH);
        } else {
          // Anchor on top, cluster on bottom
          placeRow(anchorIds, startX, startY, availW, anchorH);
          if (Array.isArray(clusterIds)) {
            placeGrid(clusterIds, startX, startY + anchorH + gapH, availW, clusterH, cols);
          }
        }

      } else if (archetype === 'anchor-layout' && ms.containerAssignment) {
        // Secondary controls then anchor
        const anchorIds = ms.containerAssignment.anchor;
        const secondaryIds = ms.containerAssignment.secondary ?? ms.containerAssignment.cluster;
        const secondaryH = availH * 0.4;
        const anchorH = availH * 0.55;
        if (Array.isArray(secondaryIds)) {
          placeRow(secondaryIds, startX, startY, availW, secondaryH);
        }
        if (Array.isArray(anchorIds)) {
          placeColumn(anchorIds, startX, startY + secondaryH + availH * 0.05, availW, anchorH);
        }

      } else {
        // Fallback: generic grid (for any unrecognized archetype)
        const fallbackCols = Math.ceil(Math.sqrt(ms.controls.length));
        placeGrid(ms.controls, startX, startY, availW, availH, fallbackCols);
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
