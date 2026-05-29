'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from './store';
import type { ControlGroup, EditorLabel } from './store/historySlice';
import {
  isControlSelected,
  isSectionSelected,
  selectedLabelIdFromSelection,
  selectedControlIds,
} from './store/selection-types';
import { rotateAABB } from './geometry';

/** Truncate a string to maxLen characters, adding ellipsis if needed */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}

/**
 * Is a control rendered outside the visible canvas bounds?
 *
 * Two transforms must be applied to match how `ControlNode` actually renders:
 *   1. **controlScale**: w/h \u00d7 controlScale (devices like XDJ-RR use 0.65)
 *   2. **rotation**: CSS `transform: rotate(angle)` around the control's
 *      center \u2014 the visible AABB after rotation can extend past the
 *      unrotated bbox (e.g., a 246\u00d7123 rectangle rotated 90\u00b0 becomes
 *      effectively 123\u00d7246).
 *
 * Without these, devices hit false positives: their STORED bbox is larger
 * than what's actually visible (controlScale<1), OR a rotated rectangle's
 * unrotated bbox claims more space than what's rendered (and vice versa).
 *
 * Exported as a pure helper so unit tests can verify the math without
 * mocking the editor store. Used by both ControlItem (per-control badge)
 * and SectionItem (bubbled section badge from child overflow).
 *
 * Origin: XDJ-RR investigation 2026-05-29.
 *   - First false positive: jog-dial bbox 1832 > canvasWidth 1800 even
 *     though visible right edge was 1654 (controlScale=0.65 fix).
 *   - Second false positive (crossfader): bbox y+h = 1154 > canvasHeight
 *     1150 even though crossfader has rotation=90 making the visible bbox
 *     narrow + tall (rotateAABB fix).
 *
 * @returns true if control's visible (scaled + rotated) AABB extends past any canvas edge
 */
export function isControlOutOfBounds(
  control: { x: number; y: number; w: number; h: number; rotation?: number },
  canvasWidth: number,
  canvasHeight: number,
  controlScale: number,
): boolean {
  // 1. Scale the stored size to its rendered size
  const visW = control.w * controlScale;
  const visH = control.h * controlScale;
  // The scaled bbox before rotation (positioned at control.x, control.y).
  // Note: position is NOT scaled \u2014 only size is (per ControlNode renderer).
  const scaledBbox = { x: control.x, y: control.y, w: visW, h: visH };

  // 2. If rotated, compute the AABB of the rotated rectangle. CSS rotates
  // around the control's center (`transformOrigin: 'center'`), and so does
  // rotateAABB by default.
  const finalBbox = control.rotation
    ? rotateAABB(scaledBbox, control.rotation)
    : scaledBbox;

  return (
    finalBbox.x < 0 ||
    finalBbox.y < 0 ||
    finalBbox.x + finalBbox.w > canvasWidth ||
    finalBbox.y + finalBbox.h > canvasHeight
  );
}

/**
 * Scroll the canvas viewport so a control's DOM element is centered.
 * Works for any control \u2014 even those outside `canvasWidth \u00d7 canvasHeight`,
 * because the editor's outer container is `overflow-auto` and the control
 * renders at its absolute x/y regardless of canvas bounds.
 *
 * Bug-1 origin (2026-05-06): contractor couldn't find an octave-LED at
 * stale Y position outside canvas bounds without resorting to canvas
 * scaling. This helper makes click-from-Layers-panel a one-step action.
 */
function scrollToControlInCanvas(controlId: string): void {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(`[data-control-id="${controlId}"]`);
  if (el && 'scrollIntoView' in el) {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  }
}

// ─── Label row (used for linked labels under controls AND for standalone labels) ──

function LabelRow({ label, indent = false }: { label: EditorLabel; indent?: boolean }) {
  const selection = useEditorStore((s) => s.selection);
  const setSelectedLabel = useEditorStore((s) => s.setSelectedLabel);
  // Phase 6b — derive single-label id from unified selection to match the
  // legacy selectedLabelId contract (null when 0 or 2+ labels).
  const selectedLabelId = selectedLabelIdFromSelection(selection);
  const isSelected = selectedLabelId === label.id;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Standalone labels: "Assign to nearest section"
    // Linked labels: "Select linked control" (navigation shortcut)
    window.dispatchEvent(new CustomEvent('editor-context-menu-label', {
      detail: {
        labelId: label.id,
        controlId: label.controlId,  // null for standalone, control id for linked
        hasSectionId: !!label.sectionId,
        clientX: e.clientX,
        clientY: e.clientY,
      },
    }));
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setSelectedLabel(label.id); }}
      onContextMenu={handleContextMenu}
      className={`flex w-full items-center gap-1 rounded ${indent ? 'pl-5 pr-2' : 'px-2'} py-1 text-left text-[10px] transition-colors ${
        isSelected
          ? 'bg-blue-500/20 text-blue-300'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      <span className="text-[9px] text-gray-600 flex-shrink-0">T</span>
      <span className="flex-1 truncate">{label.text || '(empty)'}</span>
      <span className="flex-shrink-0 text-[8px] text-gray-600">{label.fontSize}px</span>
    </button>
  );
}

// ─── Control item (inside expanded section) ─────────────────────────────────

function ControlItem({ controlId, linkedLabels = [] }: { controlId: string; linkedLabels?: EditorLabel[] }) {
  const control = useEditorStore((s) => s.controls[controlId]);
  const selection = useEditorStore((s) => s.selection);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const toggleSelected = useEditorStore((s) => s.toggleSelected);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const controlScale = useEditorStore((s) => s.controlScale);

  const isSelected = isControlSelected(selection, controlId);
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey || e.metaKey) {
        toggleSelected(controlId);
      } else {
        setSelectedIds([controlId]);
        // Bug-1 follow-up: click-to-find on canvas. Centers the control in
        // viewport, even for controls outside canvas bounds (renders in the
        // grey area beyond canvas edge — visible via overflow-auto scroll).
        scrollToControlInCanvas(controlId);
      }
    },
    [controlId, toggleSelected, setSelectedIds],
  );

  if (!control) return null;

  const isLocked = control.locked;
  const isResizeLocked = control.resizeLocked;
  const isOutOfBounds = isControlOutOfBounds(control, canvasWidth, canvasHeight, controlScale);

  return (
    <div>
      <button
        ref={itemRef}
        onClick={handleClick}
        className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[10px] transition-colors ${
          isSelected
            ? 'bg-blue-600/30 text-white'
            : isLocked
              ? 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
        }`}
      >
        {(isLocked || isResizeLocked) && (
          <svg className={`h-2.5 w-2.5 flex-shrink-0 ${isLocked ? 'text-yellow-500' : 'text-blue-500'}`} viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 9a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
            {isLocked && <path d="M6 5a2 2 0 1 1 4 0v3H6V5z" />}
          </svg>
        )}
        {isOutOfBounds && (
          <svg
            className="h-2.5 w-2.5 flex-shrink-0 text-red-500"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-label="Outside canvas bounds"
          >
            <title>Outside canvas bounds — click to find on canvas</title>
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          </svg>
        )}
        <span className="flex-1 truncate">{truncate(control.label || control.id, isLocked || isResizeLocked ? 18 : 22)}</span>
        <span className="flex-shrink-0 text-[8px] text-gray-600 uppercase">{control.type}</span>
      </button>
      {linkedLabels.length > 0 && (
        <div className="ml-2 border-l border-gray-800/60 pl-1">
          {linkedLabels.map((label) => (
            <LabelRow key={label.id} label={label} indent />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Group item (collapsible, violet accent) ────────────────────────────────

function GroupItem({ group, sectionChildIds, labelsByControlId }: { group: ControlGroup; sectionChildIds: string[]; labelsByControlId: Map<string, EditorLabel[]> }) {
  const selection = useEditorStore((s) => s.selection);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setHoveredGroup = useEditorStore((s) => s.setHoveredGroup);

  const [expanded, setExpanded] = useState(false);

  // Member IDs that belong to this section
  const memberIds = useMemo(
    () => group.controlIds.filter((id) => sectionChildIds.includes(id)),
    [group.controlIds, sectionChildIds],
  );

  // Phase 6b — derive from unified selection. isControlSelected matches the
  // legacy selectedIds.includes(id) contract for control entries.
  const allSelected = memberIds.length > 0 && memberIds.every((id) => isControlSelected(selection, id));
  const hasSelectedChild = memberIds.some((id) => isControlSelected(selection, id));

  // Auto-expand when a member is selected on canvas
  useEffect(() => {
    if (hasSelectedChild && !expanded) {
      setExpanded(true);
    }
  }, [hasSelectedChild, expanded]);

  const childIds = memberIds;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey) {
        // Shift+click: ADD group members to current selection
        const current = selectedControlIds(useEditorStore.getState().selection);
        const combined = [...new Set([...current, ...childIds])];
        setSelectedIds(combined);
      } else if (e.metaKey) {
        // Cmd+click: TOGGLE group members in/out of selection
        const current = selectedControlIds(useEditorStore.getState().selection);
        const groupSet = new Set(childIds);
        const allIn = childIds.every(id => current.includes(id));
        if (allIn) {
          // Remove all group members
          setSelectedIds(current.filter(id => !groupSet.has(id)));
        } else {
          // Add all group members
          setSelectedIds([...new Set([...current, ...childIds])]);
        }
      } else {
        // Plain click: select only this group's members
        setSelectedIds(childIds);
      }
    },
    [childIds, setSelectedIds],
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    },
    [],
  );

  return (
    <div
      onMouseEnter={() => setHoveredGroup(group.id)}
      onMouseLeave={() => setHoveredGroup(null)}
    >
      {/* Group header */}
      <div
        className={`flex items-center rounded transition-colors ${
          allSelected
            ? 'bg-violet-600/20'
            : hasSelectedChild
              ? 'bg-violet-600/10'
              : 'hover:bg-white/5'
        }`}
      >
        {/* Expand/collapse */}
        <button
          onClick={handleToggle}
          className="flex h-6 w-4 flex-shrink-0 items-center justify-center text-gray-500 hover:text-gray-300"
        >
          <svg
            className={`h-2 w-2 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M4 2l4 4-4 4z" />
          </svg>
        </button>

        {/* Group name + icon */}
        <button
          onClick={handleClick}
          className={`flex flex-1 items-center gap-1 py-0.5 pr-2 text-left text-[10px] ${
            allSelected ? 'text-violet-300' : 'text-gray-400'
          }`}
        >
          {/* Violet dashed-rect icon */}
          <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
            <rect
              x="0.5"
              y="0.5"
              width="11"
              height="11"
              rx="1.5"
              stroke="rgb(147, 130, 246)"
              strokeWidth="1"
              strokeDasharray="2 1.5"
            />
          </svg>
          <span className="flex-1 truncate font-medium">{truncate(group.name, 16)}</span>
          <span className="flex-shrink-0 text-[8px] text-gray-600">&times;{memberIds.length}</span>
        </button>
      </div>

      {/* Expanded members */}
      {expanded && (
        <div className="ml-3 border-l border-violet-500/20 pl-0.5 py-0.5">
          {memberIds.map((id) => (
            <ControlItem key={id} controlId={id} linkedLabels={labelsByControlId.get(id) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section item (with collapsible control list) ────────────────────────────

function SectionItem({
  sectionId,
  labelsByControlId,
  sectionStandaloneLabels = [],
}: {
  sectionId: string;
  labelsByControlId: Map<string, EditorLabel[]>;
  sectionStandaloneLabels?: EditorLabel[];
}) {
  const section = useEditorStore((s) => s.sections[sectionId]);
  const controls = useEditorStore((s) => s.controls);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const controlScale = useEditorStore((s) => s.controlScale);
  const selection = useEditorStore((s) => s.selection);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setFocusedSection = useEditorStore((s) => s.setFocusedSection);
  const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];

  const [expanded, setExpanded] = useState(false);
  // Phase 6b — section row uses isSectionSelected (matches legacy
  // selectedIds.includes(sectionId) since sections live in the unified
  // selection as 'section:' prefix).
  const isSelected = isSectionSelected(selection, sectionId);
  // Also highlight section if any of its children are selected
  const hasSelectedChild = section?.childIds.some((id) => isControlSelected(selection, id)) ?? false;
  // A6.1 follow-up: bubble out-of-bounds badge up to the section header so
  // the contractor sees something is wrong without needing to expand.
  const hasOutOfBoundsChild = section?.childIds.some((id) => {
    const c = controls[id];
    if (!c) return false;
    return isControlOutOfBounds(c, canvasWidth, canvasHeight, controlScale);
  }) ?? false;
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  // Auto-expand when a child control is selected (e.g. from canvas click)
  useEffect(() => {
    if (hasSelectedChild && !expanded) {
      setExpanded(true);
    }
  }, [hasSelectedChild, expanded]);

  const isFocused = focusedSectionId === sectionId;

  const handleSectionClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedIds([sectionId]);
      setFocusedSection(sectionId);
    },
    [sectionId, setSelectedIds, setFocusedSection],
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    },
    [],
  );

  if (!section) return null;

  const displayName = section.headerLabel || section.id;
  const controlCount = (section.childIds ?? []).length;

  return (
    <div ref={itemRef}>
      {/* Section header row */}
      <div
        className={`flex items-center rounded transition-colors ${
          isSelected
            ? 'bg-blue-600/20'
            : isFocused
              ? 'bg-amber-600/15 border-l-2 border-amber-500'
              : hasSelectedChild
                ? 'bg-blue-600/10'
                : 'hover:bg-white/5'
        }`}
      >
        {/* Expand/collapse arrow */}
        <button
          onClick={handleToggle}
          className="flex h-7 w-5 flex-shrink-0 items-center justify-center text-gray-500 hover:text-gray-300"
        >
          <svg
            className={`h-2.5 w-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M4 2l4 4-4 4z" />
          </svg>
        </button>

        {/* Section name + metadata */}
        {(() => {
          const mode = section.frameMode ?? (section.hidden ? 'hidden' : 'full');
          return (
            <button
              onClick={handleSectionClick}
              className={`flex flex-1 items-center gap-1.5 py-1 pr-2 text-left text-[11px] font-medium ${
                mode === 'hidden' ? 'text-gray-600 italic'
                : mode === 'header-only' ? 'text-blue-300/70'
                : isSelected ? 'text-white' : 'text-gray-300'
              }`}
            >
              {hasOutOfBoundsChild && (
                <svg
                  className="h-2.5 w-2.5 flex-shrink-0 text-red-500"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-label="Section contains out-of-bounds control"
                >
                  <title>Section contains out-of-bounds control(s) — expand to find</title>
                  <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                </svg>
              )}
              <span className="flex-1 truncate">{truncate(displayName, 18)}</span>
              {mode === 'hidden' && (
                <span className="flex-shrink-0 text-[8px] text-amber-500/60">hidden</span>
              )}
              {mode === 'header-only' && (
                <span className="flex-shrink-0 text-[8px] text-blue-400/60">title</span>
              )}
              <span className="flex-shrink-0 text-[9px] text-gray-500">{controlCount}</span>
              <span className="flex-shrink-0 rounded bg-gray-700/60 px-1 py-0.5 text-[8px] text-gray-400 uppercase leading-none">
                {truncate(section.archetype, 10)}
              </span>
            </button>
          );
        })()}

        {/* Frame mode cycle toggle: full → header-only → hidden → full */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            useEditorStore.getState().pushSnapshot();
            const mode = section.frameMode ?? (section.hidden ? 'hidden' : 'full');
            const next = mode === 'full' ? 'header-only' : mode === 'header-only' ? 'hidden' : 'full';
            useEditorStore.getState().updateSection(sectionId, { frameMode: next });
          }}
          className={`flex h-7 w-5 flex-shrink-0 items-center justify-center transition-colors ${
            (section.frameMode ?? (section.hidden ? 'hidden' : 'full')) === 'hidden'
              ? 'text-amber-500/60 hover:text-amber-400'
              : (section.frameMode === 'header-only')
                ? 'text-blue-400/60 hover:text-blue-300'
                : 'text-gray-600 hover:text-gray-300'
          }`}
          title={`Frame mode: ${section.frameMode ?? (section.hidden ? 'hidden' : 'full')} (click to cycle)`}
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
            {(section.frameMode ?? (section.hidden ? 'hidden' : 'full')) === 'hidden' ? (
              <path d="M13.5 8s-2.2 3.5-5.5 3.5S2.5 8 2.5 8s2.2-3.5 5.5-3.5S13.5 8 13.5 8zM8 10a2 2 0 100-4 2 2 0 000 4z" opacity="0.3" />
            ) : (section.frameMode === 'header-only') ? (
              <path d="M13.5 8s-2.2 3.5-5.5 3.5S2.5 8 2.5 8s2.2-3.5 5.5-3.5S13.5 8 13.5 8zM8 10a2 2 0 100-4 2 2 0 000 4z" opacity="0.6" />
            ) : (
              <path d="M13.5 8s-2.2 3.5-5.5 3.5S2.5 8 2.5 8s2.2-3.5 5.5-3.5S13.5 8 13.5 8zM8 10a2 2 0 100-4 2 2 0 000 4z" />
            )}
          </svg>
        </button>
      </div>

      {/* Expanded child controls — grouped controls clustered under GroupItem */}
      {expanded && (
        <div className="ml-4 border-l border-gray-800 pl-0.5 py-0.5">
          {(() => {
            const childIds = section.childIds ?? [];
            const childSet = new Set(childIds);

            // Find groups that have 2+ members in this section
            const sectionGroups = controlGroups.filter(
              (g) => g.controlIds.filter((id) => childSet.has(id)).length >= 2,
            );

            // Collect all IDs that belong to a group in this section
            const groupedIds = new Set<string>();
            for (const g of sectionGroups) {
              for (const id of g.controlIds) {
                if (childSet.has(id)) groupedIds.add(id);
              }
            }

            // Ungrouped controls — sorted by zOrder (highest first = top of list, like Figma)
            const controls = useEditorStore.getState().controls;
            const ungroupedIds = childIds
              .filter((id) => !groupedIds.has(id))
              .sort((a, b) => (controls[b]?.zOrder ?? 0) - (controls[a]?.zOrder ?? 0));

            return (
              <>
                {sectionGroups.map((g) => (
                  <GroupItem key={g.id} group={g} sectionChildIds={childIds} labelsByControlId={labelsByControlId} />
                ))}
                {ungroupedIds.map((id) => (
                  <ControlItem key={id} controlId={id} linkedLabels={labelsByControlId.get(id) ?? []} />
                ))}
                {sectionStandaloneLabels.map((label) => (
                  <LabelRow key={label.id} label={label} />
                ))}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Layers Panel ───────────────────────────────────────────────────────────

export default function LayersPanel() {
  const sections = useEditorStore((s) => s.sections);
  const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];
  const controlContainers = useEditorStore((s) => s.controlContainers);
  const editorLabels = useEditorStore((s) => s.editorLabels);
  const selection = useEditorStore((s) => s.selection);
  // Phase 6b — derive both legacy slot values from unified selection so
  // the panel layout below keeps its exact previous routing semantics.
  const selectedIds = useMemo(() => selectedControlIds(selection), [selection]);
  const selectedLabelId = selectedLabelIdFromSelection(selection);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setSelectedLabel = useEditorStore((s) => s.setSelectedLabel);
  const showLayers = useEditorStore((s) => s.showLayers);
  const toggleLayers = useEditorStore((s) => s.toggleLayers);

  // Sort sections by Y position (top to bottom), then by X (left to right)
  const sortedSectionIds = useMemo(() => {
    return Object.values(sections)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((s) => s.id);
  }, [sections]);

  // Indexed lookup of linked labels by their control id (O(1) per control,
  // O(n) total per editorLabels change). Linked labels nest under their
  // control; standalone labels (controlId === null) drop to the bottom block.
  const labelsByControlId = useMemo(() => {
    const map = new Map<string, EditorLabel[]>();
    for (const label of editorLabels) {
      if (label.controlId && !label.hidden) {
        const arr = map.get(label.controlId);
        if (arr) arr.push(label);
        else map.set(label.controlId, [label]);
      }
    }
    return map;
  }, [editorLabels]);

  // Standalone labels with an explicit sectionId nest under that section
  // in the tree. Standalone labels without a sectionId go to the
  // "Unassigned Labels" block at panel bottom.
  const standaloneLabelsBySectionId = useMemo(() => {
    const map = new Map<string, EditorLabel[]>();
    for (const label of editorLabels) {
      if (label.controlId == null && label.sectionId && !label.hidden) {
        const arr = map.get(label.sectionId);
        if (arr) arr.push(label);
        else map.set(label.sectionId, [label]);
      }
    }
    return map;
  }, [editorLabels]);
  const unassignedStandaloneLabels = useMemo(
    () => editorLabels.filter((l) => l.controlId == null && !l.sectionId && !l.hidden),
    [editorLabels],
  );

  if (!showLayers) {
    return (
      <div className="flex flex-col border-r border-gray-800 bg-[#0d0d1a]">
        <button
          onClick={toggleLayers}
          className="flex h-10 w-8 items-center justify-center text-gray-400 hover:text-gray-200"
          aria-label="Expand layers panel"
          title="Show Layers"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 3l5 5-5 5z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-56 flex-col border-r border-gray-800 bg-[#0d0d1a]" data-tutorial="layers">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-gray-800 px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Layers
        </span>
        <button
          onClick={toggleLayers}
          className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-gray-300"
          aria-label="Collapse layers panel"
          title="Hide Layers"
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 3l-5 5 5 5z" />
          </svg>
        </button>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5" data-testid="layers-section-list">
        {sortedSectionIds.length === 0 ? (
          <div className="px-2 py-4 text-center text-[11px] text-gray-600">
            No sections loaded
          </div>
        ) : (
          sortedSectionIds.map((id) => (
            <SectionItem
              key={id}
              sectionId={id}
              labelsByControlId={labelsByControlId}
              sectionStandaloneLabels={standaloneLabelsBySectionId.get(id) ?? []}
            />
          ))
        )}
      </div>

      {/* Containers */}
      {controlContainers.length > 0 && (
        <div className="border-t border-gray-800 px-1 py-1 space-y-0.5">
          <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-600">
            Containers
          </div>
          {controlContainers.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIds([c.id]);
                  // Click-to-find on canvas (parallel to ControlItem behavior).
                  if (typeof document !== 'undefined') {
                    const el = document.querySelector(`[data-container-id="${c.id}"]`);
                    if (el && 'scrollIntoView' in el) {
                      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
                    }
                  }
                }}
                className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[10px] transition-colors ${
                  isSelected
                    ? 'bg-gray-600/30 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <svg className="h-3 w-3 flex-shrink-0 text-gray-500" viewBox="0 0 12 12" fill="none">
                  <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span className="flex-1 truncate">{c.label || truncate(c.id, 16)}</span>
                <span className="flex-shrink-0 text-[8px] text-gray-600 uppercase">{c.style}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Unassigned Labels — standalone labels (no controlId, no sectionId).
          Capped at 33vh with internal scroll so the section list above
          (flex-1) stays visible even when there are many unassigned labels.
          Without this cap, large editor-labels collections could squeeze
          the section list to 0px. Block hidden when count is 0. */}
      {unassignedStandaloneLabels.length > 0 && (
        <div
          className="border-t border-gray-800 px-1 py-1 space-y-0.5 overflow-y-auto"
          style={{ maxHeight: '33vh' }}
          data-testid="layers-unassigned-labels"
        >
          <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-600 sticky top-0 bg-[#0d0d1a]">
            Unassigned Labels ({unassignedStandaloneLabels.length})
          </div>
          {unassignedStandaloneLabels.map((label) => {
            const isSelected = selectedLabelId === label.id;
            return (
              <button
                key={label.id}
                onClick={(e) => { e.stopPropagation(); setSelectedLabel(label.id); }}
                className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[10px] transition-colors ${
                  isSelected
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <span className="text-[9px] text-gray-600 flex-shrink-0">T</span>
                <span className="flex-1 truncate">{label.text || '(empty)'}</span>
                <span className="flex-shrink-0 text-[8px] text-gray-600">{label.fontSize}px</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer summary */}
      <div className="border-t border-gray-800 px-3 py-2 text-[10px] text-gray-600">
        {sortedSectionIds.length} sections
        {controlGroups.length > 0 && (
          <span className="text-violet-500"> &middot; {controlGroups.length} group{controlGroups.length !== 1 ? 's' : ''}</span>
        )}
        {controlContainers.length > 0 && (
          <span className="text-gray-500"> &middot; {controlContainers.length} container{controlContainers.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}
