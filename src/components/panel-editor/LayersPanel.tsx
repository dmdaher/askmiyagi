'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from './store';
import type { ControlGroup, EditorLabel } from './store/historySlice';

/** Truncate a string to maxLen characters, adding ellipsis if needed */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}

// ─── Label row (used for linked labels under controls AND for standalone labels) ──

function LabelRow({ label, indent = false }: { label: EditorLabel; indent?: boolean }) {
  const selectedLabelId = useEditorStore((s) => s.selectedLabelId);
  const setSelectedLabel = useEditorStore((s) => s.setSelectedLabel);
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
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const toggleSelected = useEditorStore((s) => s.toggleSelected);

  const isSelected = selectedIds.includes(controlId);
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
      }
    },
    [controlId, toggleSelected, setSelectedIds],
  );

  if (!control) return null;

  const isLocked = control.locked;
  const isResizeLocked = control.resizeLocked;

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
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setHoveredGroup = useEditorStore((s) => s.setHoveredGroup);

  const [expanded, setExpanded] = useState(false);

  // Member IDs that belong to this section
  const memberIds = useMemo(
    () => group.controlIds.filter((id) => sectionChildIds.includes(id)),
    [group.controlIds, sectionChildIds],
  );

  const allSelected = memberIds.length > 0 && memberIds.every((id) => selectedIds.includes(id));
  const hasSelectedChild = memberIds.some((id) => selectedIds.includes(id));

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
        const current = useEditorStore.getState().selectedIds;
        const combined = [...new Set([...current, ...childIds])];
        setSelectedIds(combined);
      } else if (e.metaKey) {
        // Cmd+click: TOGGLE group members in/out of selection
        const current = useEditorStore.getState().selectedIds;
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
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setFocusedSection = useEditorStore((s) => s.setFocusedSection);
  const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];

  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedIds.includes(sectionId);
  // Also highlight section if any of its children are selected
  const hasSelectedChild = section?.childIds.some((id) => selectedIds.includes(id)) ?? false;
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
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedLabelId = useEditorStore((s) => s.selectedLabelId);
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
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5">
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
                onClick={(e) => { e.stopPropagation(); setSelectedIds([c.id]); }}
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

      {/* Unassigned Labels — standalone labels (no controlId) that haven't
          been placed in any section yet. Standalone labels with a sectionId
          nest under their section above. Linked labels nest under their
          control. This block is hidden when count is 0. */}
      {unassignedStandaloneLabels.length > 0 && (
        <div className="border-t border-gray-800 px-1 py-1 space-y-0.5">
          <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-600">
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
