'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from './store';
import { selectedControlIds } from './store/selection-types';

/**
 * "Select Controls ▾" dropdown — contractor productivity affordance.
 *
 * Lets the contractor select All controls or any combination of types
 * (Pads / Buttons / Knobs / Sliders+Faders / etc.) in one click. Pairs
 * with the upcoming "Scale Selected ▾" dropdown so "all pads 25% too
 * big" becomes two clicks instead of touching 80 controls one-by-one.
 *
 * Behavior:
 *   - Click "All controls" → REPLACES selection with every control + closes
 *   - Click "Clear selection" → empties selection + closes
 *   - Click a type row → TOGGLES that type in/out of selection,
 *     dropdown STAYS OPEN so you can layer multiple types
 *   - Checkbox shows checked when ALL controls of that type are
 *     currently selected
 *   - Counts are live (recomputed from current manifest each render)
 *   - Zero-count rows are greyed out and unclickable
 *   - Outside-click closes the dropdown
 */

interface TypeGroup {
  label: string;
  // The actual ControlDef.type values this group represents.
  types: string[];
}

/**
 * Type groups in user-facing order. Each entry maps a friendly label
 * to one or more underlying `type` values. Add new types here when
 * a new control category lands.
 */
const TYPE_GROUPS: TypeGroup[] = [
  { label: 'Buttons', types: ['button'] },
  { label: 'Pads', types: ['pad'] },
  { label: 'Knobs', types: ['knob'] },
  { label: 'Sliders / Faders', types: ['slider', 'fader'] },
  { label: 'Encoders / Dials', types: ['encoder', 'dial'] },
  { label: 'Wheels', types: ['wheel'] },
  { label: 'LEDs / Indicators', types: ['led', 'indicator'] },
  { label: 'Screens / Displays', types: ['screen', 'display'] },
  { label: 'Switches / Levers', types: ['switch', 'lever'] },
  { label: 'Ports / Slots', types: ['port', 'slot'] },
];

export default function SelectDropdown() {
  const controls = useEditorStore((s) => s.controls);
  const selection = useEditorStore((s) => s.selection);
  const selectAllControls = useEditorStore((s) => s.selectAllControls);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedIds = selectedControlIds(selection);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const totalCount = Object.keys(controls).length;

  // Per-group: live count + whether all matching controls are in the
  // current selection (drives the checkbox state).
  const groupState = useMemo(() => {
    const counts: Record<string, number> = {};
    const idsByType: Record<string, string[]> = {};
    for (const ctrl of Object.values(controls)) {
      if (!ctrl) continue;
      counts[ctrl.type] = (counts[ctrl.type] ?? 0) + 1;
      (idsByType[ctrl.type] ||= []).push(ctrl.id);
    }
    return TYPE_GROUPS.map((group) => {
      const matchIds = group.types.flatMap((t) => idsByType[t] ?? []);
      const count = matchIds.length;
      const allIncluded = count > 0 && matchIds.every((id) => selectedSet.has(id));
      const someIncluded = !allIncluded && matchIds.some((id) => selectedSet.has(id));
      return { ...group, count, matchIds, allIncluded, someIncluded };
    });
  }, [controls, selectedSet]);

  // Outside-click close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleAll = () => {
    selectAllControls();
    setOpen(false);
  };

  const handleToggleType = (matchIds: string[], allIncluded: boolean) => {
    if (allIncluded) {
      // Remove this group from selection
      const removeSet = new Set(matchIds);
      setSelectedIds(selectedIds.filter((id) => !removeSet.has(id)));
    } else {
      // Add this group to selection (union, deduped)
      setSelectedIds(Array.from(new Set([...selectedIds, ...matchIds])));
    }
    // Stay open so contractor can toggle more types
  };

  const handleClear = () => {
    clearSelection();
    setOpen(false);
  };

  const label = selectedCount > 0
    ? `Select Controls (${selectedCount} selected) ▾`
    : 'Select Controls ▾';

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-7 items-center rounded px-3 text-[10px] font-medium whitespace-nowrap transition-colors ${
          open
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100 border border-gray-700'
        }`}
        title="Select controls by type (Cmd+A for all)"
      >
        {label}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-[1000] min-w-[260px] rounded border border-gray-700 bg-[#15151f] shadow-lg py-1">
          {/* All controls — single action, closes dropdown */}
          <button
            onClick={handleAll}
            disabled={totalCount === 0}
            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-blue-500/10 hover:text-blue-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>All controls</span>
            <span className="flex items-center gap-2">
              <span className="text-gray-500">({totalCount})</span>
              <kbd className="text-[9px] text-gray-500 font-mono">⌘A</kbd>
            </span>
          </button>

          {/* Divider */}
          <div className="my-1 h-px bg-gray-800" />

          {/* "By type:" header */}
          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">
            By type — click to toggle
          </div>

          {/* Type rows with checkboxes */}
          {groupState.map((group) => {
            const disabled = group.count === 0;
            return (
              <button
                key={group.label}
                onClick={() => handleToggleType(group.matchIds, group.allIncluded)}
                disabled={disabled}
                className="w-full flex items-center gap-2 px-3 py-1 text-[11px] text-gray-200 hover:bg-blue-500/10 hover:text-blue-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title={
                  disabled
                    ? `${group.label}: none on this device`
                    : group.allIncluded
                      ? `Click to REMOVE all ${group.label.toLowerCase()} from selection`
                      : `Click to ADD all ${group.label.toLowerCase()} to selection`
                }
              >
                {/* Custom checkbox (3-state: empty, partial, full) */}
                <span
                  className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border ${
                    group.allIncluded
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : group.someIncluded
                        ? 'bg-blue-500/30 border-blue-400/60 text-blue-200'
                        : 'bg-transparent border-gray-600'
                  }`}
                  aria-hidden
                >
                  {group.allIncluded && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5">
                      <path d="M2.5 6.5 L5 9 L9.5 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {group.someIncluded && (
                    <div className="h-[1.5px] w-2 bg-current rounded" />
                  )}
                </span>
                <span className="flex-1 text-left">{group.label}</span>
                <span className="text-gray-500">({group.count})</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-1 h-px bg-gray-800" />

          {/* Clear — single action, closes dropdown */}
          <button
            onClick={handleClear}
            disabled={selectedCount === 0}
            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>Clear selection</span>
            <kbd className="text-[9px] text-gray-500 font-mono">Esc</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
