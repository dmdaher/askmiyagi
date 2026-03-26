'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from './store';

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

// ─── Section item (with collapsible control list) ────────────────────────────

function SectionItem({ sectionId }: { sectionId: string }) {
  const section = useEditorStore((s) => s.sections[sectionId]);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setFocusedSection = useEditorStore((s) => s.setFocusedSection);

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

      {/* Expanded child controls */}
      {expanded && (
        <div className="ml-4 border-l border-gray-800 pl-0.5 py-0.5">
          {(section.childIds ?? []).map((id) => (
            <ControlItem key={id} controlId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Layers Panel ───────────────────────────────────────────────────────────

export default function LayersPanel() {
  const sections = useEditorStore((s) => s.sections);
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
      </div>
    </div>
  );
}
