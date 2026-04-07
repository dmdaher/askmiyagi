'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from './store';
import type { ControlGroup } from './store/historySlice';

/** Truncate a string to maxLen characters, adding ellipsis if needed */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}

// ─── Control item (inside expanded section) ─────────────────────────────────

function ControlItem({ controlId }: { controlId: string }) {
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

  return (
    <button
      ref={itemRef}
      onClick={handleClick}
      className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[10px] transition-colors ${
        isSelected
          ? 'bg-blue-600/30 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      <span className="flex-1 truncate">{truncate(control.label || control.id, 22)}</span>
      <span className="flex-shrink-0 text-[8px] text-gray-600 uppercase">{control.type}</span>
    </button>
  );
}

// ─── Group item (collapsible, violet accent) ────────────────────────────────

function GroupItem({ group, sectionChildIds }: { group: ControlGroup; sectionChildIds: string[] }) {
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
            <ControlItem key={id} controlId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section item (with collapsible control list) ────────────────────────────

function SectionItem({ sectionId }: { sectionId: string }) {
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
        <button
          onClick={handleSectionClick}
          className={`flex flex-1 items-center gap-1.5 py-1 pr-2 text-left text-[11px] font-medium ${
            isSelected ? 'text-white' : 'text-gray-300'
          }`}
        >
          <span className="flex-1 truncate">{truncate(displayName, 18)}</span>
          <span className="flex-shrink-0 text-[9px] text-gray-500">{controlCount}</span>
          <span className="flex-shrink-0 rounded bg-gray-700/60 px-1 py-0.5 text-[8px] text-gray-400 uppercase leading-none">
            {truncate(section.archetype, 10)}
          </span>
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

            // Ungrouped controls
            const ungroupedIds = childIds.filter((id) => !groupedIds.has(id));

            return (
              <>
                {sectionGroups.map((g) => (
                  <GroupItem key={g.id} group={g} sectionChildIds={childIds} />
                ))}
                {ungroupedIds.map((id) => (
                  <ControlItem key={id} controlId={id} />
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
  const showLayers = useEditorStore((s) => s.showLayers);
  const toggleLayers = useEditorStore((s) => s.toggleLayers);

  // Sort sections by Y position (top to bottom), then by X (left to right)
  const sortedSectionIds = useMemo(() => {
    return Object.values(sections)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((s) => s.id);
  }, [sections]);

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
            <SectionItem key={id} sectionId={id} />
          ))
        )}
      </div>

      {/* Footer summary */}
      <div className="border-t border-gray-800 px-3 py-2 text-[10px] text-gray-600">
        {sortedSectionIds.length} sections
        {controlGroups.length > 0 && (
          <span className="text-violet-500"> &middot; {controlGroups.length} group{controlGroups.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}
