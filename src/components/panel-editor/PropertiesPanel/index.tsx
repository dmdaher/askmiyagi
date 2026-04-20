'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import type { ControlDef, SectionDef } from '../store';
import ControlTypeSelector from './ControlTypeSelector';
import LabelEditor from './LabelEditor';
import GeometryFields from './GeometryFields';
import {
  AlignLeftIcon,
  AlignCenterHIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignMiddleVIcon,
  AlignBottomIcon,
  DistributeHIcon,
  DistributeVIcon,
} from '../icons/alignment';
import type { ControlGroup } from '../store/historySlice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check if all values in an array are the same */
function allSame<T>(values: T[]): boolean {
  if (values.length === 0) return true;
  return values.every((v) => v === values[0]);
}

// ─── Gap Input ───────────────────────────────────────────────────────────────

/**
 * Gap input with local state — commits on blur or Enter, not on every keystroke.
 * Without this pattern, typing "20" would fire distributeWithGap(2) first,
 * redistributing controls with gap=2, then the displayed gap becomes 2, making
 * the "0" keystroke impossible to enter.
 */
function GapInput({
  label,
  value,
  mixed,
  onCommit,
  title,
}: {
  label: string;
  value: number | null;
  mixed: boolean;
  onCommit: (val: number) => void;
  title: string;
}) {
  // Local string state — only syncs from props when the external value changes
  const [localValue, setLocalValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync from props when not focused (so external changes reflect in input)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(mixed ? '' : value != null ? String(value) : '');
    }
  }, [value, mixed, isFocused]);

  const commit = useCallback(() => {
    const parsed = parseInt(localValue, 10);
    // Allow negative gaps (overlapping controls — common in hardware panels
    // where knobs/buttons physically overlap at their bounding boxes)
    if (!isNaN(parsed) && parsed !== value) {
      onCommit(parsed);
    } else {
      // Revert to current value on invalid input
      setLocalValue(mixed ? '' : value != null ? String(value) : '');
    }
  }, [localValue, value, mixed, onCommit]);

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-500 w-7">{label}</span>
      <input
        type="number"
        value={localValue}
        placeholder={mixed ? 'Mixed' : '\u2014'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); commit(); }}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
          if (e.key === 'Escape') {
            setLocalValue(mixed ? '' : value != null ? String(value) : '');
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-12 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-[10px] text-gray-200 text-center outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        title={title}
      />
      <span className="text-[9px] text-gray-600">px</span>
    </div>
  );
}

// ─── Section Properties ──────────────────────────────────────────────────────

function SectionProperties({ section }: { section: SectionDef }) {
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const moveSection = useEditorStore((s) => s.moveSection);
  const resizeSection = useEditorStore((s) => s.resizeSection);
  const setSectionLabel = useEditorStore((s) => s.setSectionLabel);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);

  const handleXChange = useCallback(
    (val: number) => {
      pushSnapshot();
      moveSection(section.id, val - section.x, 0);
    },
    [section.id, section.x, moveSection, pushSnapshot],
  );

  const handleYChange = useCallback(
    (val: number) => {
      pushSnapshot();
      moveSection(section.id, 0, val - section.y);
    },
    [section.id, section.y, moveSection, pushSnapshot],
  );

  const handleWChange = useCallback(
    (val: number) => {
      pushSnapshot();
      resizeSection(section.id, val, section.h);
    },
    [section.id, section.h, resizeSection, pushSnapshot],
  );

  const handleHChange = useCallback(
    (val: number) => {
      pushSnapshot();
      resizeSection(section.id, section.w, val);
    },
    [section.id, section.w, resizeSection, pushSnapshot],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-gray-800 pb-2">
        <h3 className="text-sm font-medium text-gray-200">Section</h3>
        <p className="text-xs text-gray-500 mt-0.5">{section.id}</p>
      </div>

      {/* Header label — toggle + editable text */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wide text-gray-500">
            Section Label
          </label>
          <button
            onClick={() => {
              pushSnapshot();
              setSectionLabel(
                section.id,
                section.headerLabel ? null : section.id.toUpperCase(),
              );
            }}
            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
              section.headerLabel
                ? 'bg-blue-600/30 text-blue-300 border border-blue-600'
                : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
            }`}
          >
            {section.headerLabel ? 'On' : 'Off'}
          </button>
        </div>
        {section.headerLabel !== null && section.headerLabel !== undefined && (
          <input
            type="text"
            value={section.headerLabel}
            onChange={(e) => setSectionLabel(section.id, e.target.value || null)}
            onBlur={() => { pushSnapshot(); }}
            className="w-full h-6 rounded border border-gray-700 bg-gray-900 px-2 text-[10px] text-gray-300 outline-none focus:border-blue-500"
            placeholder="Section label text"
          />
        )}
      </div>

      {/* Section frame mode */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Frame Mode
        </label>
        <div className="flex gap-1">
          {([['full', 'Full'], ['header-only', 'Title Only'], ['hidden', 'Hidden']] as const).map(([mode, label]) => {
            const currentMode = section.frameMode ?? (section.hidden ? 'hidden' : 'full');
            const isActive = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  pushSnapshot();
                  useEditorStore.getState().updateSection(section.id, { frameMode: mode });
                }}
                className={`flex-1 rounded px-1.5 py-1 text-[9px] font-medium transition-colors ${
                  isActive
                    ? mode === 'hidden' ? 'bg-amber-600/30 text-amber-300 border border-amber-600'
                      : mode === 'header-only' ? 'bg-blue-600/30 text-blue-300 border border-blue-600'
                      : 'bg-gray-600/30 text-gray-200 border border-gray-500'
                    : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Archetype */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Archetype
        </label>
        <div className="text-xs text-gray-400 rounded bg-gray-900 border border-gray-700 px-2 py-1">
          {section.archetype}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Children count */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Controls
        </label>
        <div className="text-xs text-gray-400">
          {section.childIds.length} control{section.childIds.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Position */}
      <GeometryFields
        x={section.x}
        y={section.y}
        w={section.w}
        h={section.h}
        step={snapGrid}
        onXChange={handleXChange}
        onYChange={handleYChange}
        onWChange={handleWChange}
        onHChange={handleHChange}
      />
    </div>
  );
}

// ─── Single Control Properties ───────────────────────────────────────────────

function SingleControlProperties({ control }: { control: ControlDef }) {
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const updateControlProp = useEditorStore((s) => s.updateControlProp);
  const moveControl = useEditorStore((s) => s.moveControl);
  const resizeControl = useEditorStore((s) => s.resizeControl);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setLabelPosition = useEditorStore((s) => s.setLabelPosition);

  const ids = useMemo(() => [control.id], [control.id]);

  const handleTypeChange = useCallback(
    (type: string) => {
      pushSnapshot();
      updateControlProp(ids, 'type', type);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleLabelChange = useCallback(
    (value: string) => {
      pushSnapshot();
      updateControlProp(ids, 'label', value);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handlePositionChange = useCallback(
    (value: ControlDef['labelPosition']) => {
      pushSnapshot();
      setLabelPosition(ids, value);
    },
    [ids, setLabelPosition, pushSnapshot],
  );

  const handleSecondaryLabelChange = useCallback(
    (value: string) => {
      pushSnapshot();
      updateControlProp(ids, 'secondaryLabel', value);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleRotationChange = useCallback(
    (degrees: number) => {
      pushSnapshot();
      updateControlProp(ids, 'rotation', degrees);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleXChange = useCallback(
    (val: number) => {
      pushSnapshot();
      moveControl(control.id, val - control.x, 0);
    },
    [control.id, control.x, moveControl, pushSnapshot],
  );

  const handleYChange = useCallback(
    (val: number) => {
      pushSnapshot();
      moveControl(control.id, 0, val - control.y);
    },
    [control.id, control.y, moveControl, pushSnapshot],
  );

  const handleWChange = useCallback(
    (val: number) => {
      pushSnapshot();
      resizeControl(control.id, val, control.h);
    },
    [control.id, control.h, resizeControl, pushSnapshot],
  );

  const handleHChange = useCallback(
    (val: number) => {
      pushSnapshot();
      resizeControl(control.id, control.w, val);
    },
    [control.id, control.w, resizeControl, pushSnapshot],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-gray-800 pb-2">
        <h3 className="text-sm font-medium text-gray-200">Control</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate" title={control.id}>
          {control.id}
        </p>
      </div>

      {/* Type */}
      <ControlTypeSelector
        currentType={control.type}
        onChange={handleTypeChange}
      />

      {/* LED Variant (led/indicator only) */}
      {(control.type === 'led' || control.type === 'indicator') && (
        <>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">LED Style</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => { pushSnapshot(); updateControlProp(ids, 'ledVariant', 'dot'); }}
                className={`flex-1 flex items-center justify-center gap-1 rounded border py-1.5 text-[10px] transition-colors ${
                  (control.ledVariant ?? 'dot') === 'dot'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Dot
              </button>
              <button
                onClick={() => { pushSnapshot(); updateControlProp(ids, 'ledVariant', 'dual-label'); }}
                className={`flex-1 flex items-center justify-center gap-1 rounded border py-1.5 text-[10px] transition-colors ${
                  control.ledVariant === 'dual-label'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col gap-px">
                  <div className="w-4 h-1.5 rounded-sm bg-green-800 border border-green-600" />
                  <div className="w-4 h-1.5 rounded-sm bg-gray-800 border border-gray-600" />
                </div>
                Dual
              </button>
            </div>
          </div>
          <div className="h-px bg-gray-800" />
        </>
      )}

      {/* Shape (buttons only) */}
      {control.type === 'button' && (
        <>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Shape</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => { pushSnapshot(); updateControlProp(ids, 'shape', 'rectangle'); }}
                className={`flex-1 flex items-center justify-center gap-1 rounded border py-1.5 text-[10px] transition-colors ${
                  (control.shape ?? 'rectangle') === 'rectangle'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="w-4 h-3 rounded-sm border border-current" />
                Rect
              </button>
              <button
                onClick={() => { pushSnapshot(); updateControlProp(ids, 'shape', 'circle'); }}
                className={`flex-1 flex items-center justify-center gap-1 rounded border py-1.5 text-[10px] transition-colors ${
                  control.shape === 'circle'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-current" />
                Circle
              </button>
            </div>
          </div>
          <div className="h-px bg-gray-800" />
        </>
      )}

      {/* Label */}
      <LabelEditor
        label={control.label}
        labelPosition={control.labelPosition}
        secondaryLabel={control.secondaryLabel}
        labelFontSize={control.labelFontSize}
        onLabelChange={handleLabelChange}
        onPositionChange={handlePositionChange}
        onSecondaryLabelChange={handleSecondaryLabelChange}
        onFontSizeChange={(val) => { pushSnapshot(); updateControlProp(ids, 'labelFontSize', val); }}
      />

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Position */}
      <GeometryFields
        x={control.x}
        y={control.y}
        w={control.w}
        h={control.h}
        step={snapGrid}
        onXChange={handleXChange}
        onYChange={handleYChange}
        onWChange={handleWChange}
        onHChange={handleHChange}
      />

      {/* Rotation */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Rotate</label>
        <div className="flex gap-1">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => handleRotationChange(deg)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                (control.rotation ?? 0) === deg
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300 border border-transparent'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Lock status */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">
          Locked
        </span>
        <span className="text-xs text-gray-400">
          {control.locked ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  );
}

// ─── Multi-Select Properties ─────────────────────────────────────────────────

function MultiControlProperties({ controls }: { controls: ControlDef[] }) {
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const updateControlProp = useEditorStore((s) => s.updateControlProp);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const alignControls = useEditorStore((s) => s.alignControls);
  const distributeControls = useEditorStore((s) => s.distributeControls);
  const createGroup = useEditorStore((s) => s.createGroup);
  const ungroupControls = useEditorStore((s) => s.ungroupControls);
  const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];
  const distributeWithGap = useEditorStore((s) => s.distributeWithGap);
  const alignColumns = useEditorStore((s) => s.alignColumns);
  const alignRows = useEditorStore((s) => s.alignRows);
  const normalizeLabelSpacing = useEditorStore((s) => s.normalizeLabelSpacing);
  const setLabelPosition = useEditorStore((s) => s.setLabelPosition);
  const editorLabels = useEditorStore((s) => s.editorLabels) as any[];

  const ids = useMemo(() => controls.map((c) => c.id), [controls]);

  // Compute current gaps between selected controls.
  // Tolerance: gaps within 2px of each other are treated as equal, since
  // distributeControls rounds positions to integers which can produce
  // 1-2px variance between consecutive gaps. Shows the mode (most common
  // value) when gaps are "approximately equal".
  const computeGaps = (axis: 'x' | 'y', size: 'w' | 'h') => {
    if (controls.length < 2) return null;
    const sorted = [...controls].sort((a, b) => a[axis] - b[axis]);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(Math.round(sorted[i][axis] - (sorted[i - 1][axis] + sorted[i - 1][size])));
    }
    const min = Math.min(...gaps);
    const max = Math.max(...gaps);
    const approxEqual = max - min <= 2;
    if (approxEqual) {
      // Return the mode (most common value) as the representative gap
      const counts = new Map<number, number>();
      for (const g of gaps) counts.set(g, (counts.get(g) ?? 0) + 1);
      let mode = gaps[0];
      let maxCount = 0;
      for (const [v, c] of counts) if (c > maxCount) { mode = v; maxCount = c; }
      return { value: mode, mixed: false };
    }
    return { value: null, mixed: true };
  };

  const gapH = useMemo(() => computeGaps('x', 'w'), [controls]);
  const gapV = useMemo(() => computeGaps('y', 'h'), [controls]);

  const hasGroupInSelection = controlGroups.some((g) =>
    g.controlIds.some((id) => ids.includes(id))
  );

  // Detect rows/columns in selection by clustering
  const { rowCount, columnCount } = useMemo(() => {
    if (controls.length < 2) return { rowCount: 0, columnCount: 0 };
    const tolerance = 20;
    const clusterBy = (axis: 'x' | 'y', size: 'w' | 'h') => {
      const sorted = [...controls].sort((a, b) => (a[axis] + a[size] / 2) - (b[axis] + b[size] / 2));
      const clusters: ControlDef[][] = [];
      for (const c of sorted) {
        const center = c[axis] + c[size] / 2;
        const target = clusters.find((cluster) => {
          const cCenter = cluster.reduce((acc, rc) => acc + rc[axis] + rc[size] / 2, 0) / cluster.length;
          return Math.abs(center - cCenter) <= tolerance;
        });
        if (target) target.push(c);
        else clusters.push([c]);
      }
      return clusters.filter((c) => c.length >= 2).length;
    };
    return {
      rowCount: clusterBy('y', 'h'),
      columnCount: clusterBy('x', 'w'),
    };
  }, [controls]);

  // Count linked labels among selected controls (for Normalize Label Spacing)
  const linkedLabelCount = useMemo(() => {
    const idSet = new Set(controls.map((c) => c.id));
    return editorLabels.filter((l) => l.controlId && idSet.has(l.controlId)).length;
  }, [controls, editorLabels]);

  const types = controls.map((c) => c.type);
  const labels = controls.map((c) => c.label);
  const positions = controls.map((c) => c.labelPosition);
  const secondaryLabels = controls.map((c) => c.secondaryLabel);
  const xs = controls.map((c) => c.x);
  const ys = controls.map((c) => c.y);
  const ws = controls.map((c) => c.w);
  const hs = controls.map((c) => c.h);

  const typeMixed = !allSame(types);
  const labelMixed = !allSame(labels);
  const positionMixed = !allSame(positions);
  const secondaryMixed = !allSame(secondaryLabels);

  const handleTypeChange = useCallback(
    (type: string) => {
      pushSnapshot();
      updateControlProp(ids, 'type', type);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleLabelChange = useCallback(
    (value: string) => {
      pushSnapshot();
      updateControlProp(ids, 'label', value);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handlePositionChange = useCallback(
    (value: ControlDef['labelPosition']) => {
      pushSnapshot();
      setLabelPosition(ids, value);
    },
    [ids, setLabelPosition, pushSnapshot],
  );

  const handleSecondaryLabelChange = useCallback(
    (value: string) => {
      pushSnapshot();
      updateControlProp(ids, 'secondaryLabel', value);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  // For multi-select geometry, we apply the value to all selected controls
  const handleXChange = useCallback(
    (val: number) => {
      pushSnapshot();
      updateControlProp(ids, 'x', val);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleYChange = useCallback(
    (val: number) => {
      pushSnapshot();
      updateControlProp(ids, 'y', val);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleWChange = useCallback(
    (val: number) => {
      pushSnapshot();
      updateControlProp(ids, 'w', Math.max(8, val));
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleHChange = useCallback(
    (val: number) => {
      pushSnapshot();
      updateControlProp(ids, 'h', Math.max(8, val));
    },
    [ids, updateControlProp, pushSnapshot],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-gray-800 pb-2">
        <h3 className="text-sm font-medium text-gray-200">
          {controls.length} Controls Selected
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Shared fields shown. Differing values shown as &quot;Mixed&quot;.
        </p>
      </div>

      {/* Type */}
      <ControlTypeSelector
        currentType={typeMixed ? '' : types[0]}
        onChange={handleTypeChange}
      />

      <div className="h-px bg-gray-800" />

      {/* Label */}
      <LabelEditor
        label={labelMixed ? '' : labels[0]}
        labelPosition={positionMixed ? 'below' : positions[0]}
        secondaryLabel={secondaryMixed ? undefined : secondaryLabels[0]}
        labelFontSize={controls[0]?.labelFontSize}
        labelMixed={labelMixed}
        positionMixed={positionMixed}
        secondaryMixed={secondaryMixed}
        labelDistinctCount={new Set(labels).size}
        secondaryDistinctCount={new Set(secondaryLabels.filter((s) => s !== undefined)).size}
        onLabelChange={handleLabelChange}
        onPositionChange={handlePositionChange}
        onSecondaryLabelChange={handleSecondaryLabelChange}
        onFontSizeChange={(val) => { pushSnapshot(); updateControlProp(ids, 'labelFontSize', val); }}
      />

      <div className="h-px bg-gray-800" />

      {/* Position */}
      <GeometryFields
        x={allSame(xs) ? xs[0] : 0}
        y={allSame(ys) ? ys[0] : 0}
        w={allSame(ws) ? ws[0] : 0}
        h={allSame(hs) ? hs[0] : 0}
        step={snapGrid}
        xMixed={!allSame(xs)}
        yMixed={!allSame(ys)}
        wMixed={!allSame(ws)}
        hMixed={!allSame(hs)}
        onXChange={handleXChange}
        onYChange={handleYChange}
        onWChange={handleWChange}
        onHChange={handleHChange}
      />

      {/* Match Sizes — sets all selected controls to the size of the first */}
      {controls.length > 1 && (!allSame(ws) || !allSame(hs)) && (
        <>
          <div className="h-px bg-gray-800" />
          <button
            onClick={() => {
              pushSnapshot();
              const targetW = controls[0].w;
              const targetH = controls[0].h;
              updateControlProp(ids, 'w', targetW);
              updateControlProp(ids, 'h', targetH);
            }}
            className="flex h-7 items-center justify-center rounded border border-blue-600/30 bg-blue-600/10 px-3 text-[10px] font-medium text-blue-400 transition-colors hover:bg-blue-600/20"
            title={`Set all ${controls.length} controls to ${controls[0].w}×${controls[0].h}`}
          >
            Match Sizes ({controls[0].w}×{controls[0].h})
          </button>
        </>
      )}

      {/* ── Alignment ──────────────────────────────────────────────── */}
      {controls.length >= 2 && (
        <>
          <div className="h-px bg-gray-800" />
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">
              Align
            </label>
            <div className="flex items-center rounded border border-gray-700 bg-gray-900/60 overflow-hidden">
              {/* Horizontal alignment */}
              {([
                { mode: 'left' as const, Icon: AlignLeftIcon, title: 'Align left edges' },
                { mode: 'center-x' as const, Icon: AlignCenterHIcon, title: 'Align horizontal centers' },
                { mode: 'right' as const, Icon: AlignRightIcon, title: 'Align right edges' },
              ]).map(({ mode, Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => { pushSnapshot(); alignControls(mode); }}
                  className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
                  title={title}
                >
                  <Icon className="h-3 w-3" />
                </button>
              ))}

              {/* Divider between H and V */}
              <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

              {/* Vertical alignment */}
              {([
                { mode: 'top' as const, Icon: AlignTopIcon, title: 'Align top edges' },
                { mode: 'center-y' as const, Icon: AlignMiddleVIcon, title: 'Align vertical centers' },
                { mode: 'bottom' as const, Icon: AlignBottomIcon, title: 'Align bottom edges' },
              ]).map(({ mode, Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => { pushSnapshot(); alignControls(mode); }}
                  className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
                  title={title}
                >
                  <Icon className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Gap Input ──────────────────────────────────────────────── */}
      {controls.length >= 2 && (
        <div className="flex items-center gap-3">
          <GapInput
            label="Gap H"
            value={gapH?.value ?? null}
            mixed={gapH?.mixed ?? false}
            onCommit={(val) => { pushSnapshot(); distributeWithGap('horizontal', val); }}
            title="Horizontal gap between controls (px)"
          />
          <GapInput
            label="Gap V"
            value={gapV?.value ?? null}
            mixed={gapV?.mixed ?? false}
            onCommit={(val) => { pushSnapshot(); distributeWithGap('vertical', val); }}
            title="Vertical gap between controls (px)"
          />
        </div>
      )}

      {/* ── Distribute ─────────────────────────────────────────────── */}
      {controls.length >= 3 && (
        <>
          <div className="h-px bg-gray-800" />
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">
              Distribute
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => { pushSnapshot(); distributeControls('horizontal'); }}
                className="flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
                title="Distribute horizontal spacing evenly"
              >
                <DistributeHIcon className="h-3 w-3" />
                Horizontal
              </button>
              <button
                onClick={() => { pushSnapshot(); distributeControls('vertical'); }}
                className="flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
                title="Distribute vertical spacing evenly"
              >
                <DistributeVIcon className="h-3 w-3" />
                Vertical
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Cross-Row / Cross-Column Alignment ───────────────────── */}
      {(rowCount >= 2 || columnCount >= 2) && (
        <>
          <div className="h-px bg-gray-800" />
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">
              Grid Alignment
            </label>
            {rowCount >= 2 && (
              <button
                onClick={() => { pushSnapshot(); alignColumns(); }}
                className="w-full flex h-7 items-center justify-center gap-1.5 rounded border border-violet-600/30 bg-violet-600/10 text-[10px] text-violet-400 hover:bg-violet-600/20 hover:text-violet-300 transition-colors"
                title={`Snap ${rowCount} rows to shared columns (uses topmost row as template)`}
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="3" y1="1" x2="3" y2="11" />
                  <line x1="9" y1="1" x2="9" y2="11" />
                  <rect x="1" y="2" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
                  <rect x="7" y="2" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
                  <rect x="1" y="7.5" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
                  <rect x="7" y="7.5" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
                </svg>
                Align Columns ({rowCount} rows)
              </button>
            )}
            {columnCount >= 2 && (
              <button
                onClick={() => { pushSnapshot(); alignRows(); }}
                className="w-full flex h-7 items-center justify-center gap-1.5 rounded border border-violet-600/30 bg-violet-600/10 text-[10px] text-violet-400 hover:bg-violet-600/20 hover:text-violet-300 transition-colors"
                title={`Snap ${columnCount} columns to shared rows (uses leftmost column as template)`}
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="1" y1="3" x2="11" y2="3" />
                  <line x1="1" y1="9" x2="11" y2="9" />
                  <rect x="2" y="1" width="2.5" height="4" rx="0.5" fill="currentColor" stroke="none" />
                  <rect x="2" y="7" width="2.5" height="4" rx="0.5" fill="currentColor" stroke="none" />
                  <rect x="7.5" y="1" width="2.5" height="4" rx="0.5" fill="currentColor" stroke="none" />
                  <rect x="7.5" y="7" width="2.5" height="4" rx="0.5" fill="currentColor" stroke="none" />
                </svg>
                Align Rows ({columnCount} cols)
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Normalize Label Spacing ────────────────────────────────── */}
      {linkedLabelCount >= 2 && (
        <>
          <div className="h-px bg-gray-800" />
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">
              Label Spacing
            </label>
            <button
              onClick={() => { pushSnapshot(); normalizeLabelSpacing(); }}
              className="w-full flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
              title={`Snap ${linkedLabelCount} labels to matching distance from their controls (grouped by line count)`}
            >
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="1" width="8" height="2" rx="0.5" fill="currentColor" stroke="none" />
                <line x1="6" y1="4" x2="6" y2="6" strokeDasharray="1 1" />
                <rect x="1" y="7" width="10" height="4" rx="0.5" />
              </svg>
              Normalize Label Spacing
            </button>
          </div>
        </>
      )}

      {/* ── Group / Ungroup ────────────────────────────────────────── */}
      {controls.length >= 2 && (
        <>
          <div className="h-px bg-gray-800" />
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">
              Grouping
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => { pushSnapshot(); createGroup(`Group ${controlGroups.length + 1}`); }}
                className="flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
                title="Group selected controls"
              >
                Group
              </button>
              <button
                onClick={() => {
                  if (!hasGroupInSelection) return;
                  pushSnapshot();
                  ungroupControls();
                }}
                className={`flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] transition-colors ${
                  hasGroupInSelection
                    ? 'text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 cursor-pointer'
                    : 'text-gray-400 opacity-30 cursor-not-allowed'
                }`}
                title={hasGroupInSelection ? 'Ungroup selected controls' : 'No group in selection'}
                disabled={!hasGroupInSelection}
              >
                Ungroup
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Empty State (Keyboard Offset) ──────────────────────────────────────────

function EmptyStatePanel() {
  const keyboard = useEditorStore((s) => s.keyboard);

  if (!keyboard) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-gray-500 text-center px-4">
          Select a control or section to edit properties
        </p>
      </div>
    );
  }

  const handleLeftChange = (val: number) => {
    useEditorStore.getState().pushSnapshot();
    useEditorStore.setState({
      keyboard: { ...keyboard, leftPercent: val },
      hasUserEdited: true,
    });
  };

  const handleWidthChange = (val: number) => {
    useEditorStore.getState().pushSnapshot();
    useEditorStore.setState({
      keyboard: { ...keyboard, widthPercent: val },
      hasUserEdited: true,
    });
  };

  return (
    <div className="p-3 space-y-4">
      <p className="text-xs text-gray-500 text-center">
        Select a control or section to edit properties
      </p>
      <div className="border-t border-gray-700 pt-3">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Keyboard
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-500">Left offset %</label>
            <input
              type="number"
              min={0}
              max={50}
              step={1}
              value={keyboard.leftPercent ?? 0}
              onChange={(e) => handleLeftChange(Number(e.target.value))}
              className="w-16 rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-500">Width %</label>
            <input
              type="number"
              min={50}
              max={100}
              step={1}
              value={keyboard.widthPercent ?? 100}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-16 rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Properties Panel ──────────────────────────────────────────────────

// ─── Label Properties ────────────────────────────────────────────────────────

function LabelProperties({ label }: { label: any }) {
  const updateLabel = useEditorStore((s) => s.updateLabel);
  const deleteLabel = useEditorStore((s) => s.deleteLabel);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setSelectedLabel = useEditorStore((s) => s.setSelectedLabel);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const controls = useEditorStore((s) => s.controls);

  const linkedControl = label.controlId ? controls[label.controlId] : null;
  const isStandalone = !label.controlId;

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    pushSnapshot();
    updateLabel(label.id, { text: e.target.value });
  }, [label.id, updateLabel, pushSnapshot]);

  const handleFontSizeChange = useCallback((val: number) => {
    pushSnapshot();
    updateLabel(label.id, { fontSize: val });
  }, [label.id, updateLabel, pushSnapshot]);

  const handleToggleHidden = useCallback(() => {
    pushSnapshot();
    updateLabel(label.id, { hidden: !label.hidden });
  }, [label.id, label.hidden, updateLabel, pushSnapshot]);

  const handleDelete = useCallback(() => {
    pushSnapshot();
    deleteLabel(label.id);
    setSelectedLabel(null);
  }, [label.id, deleteLabel, setSelectedLabel, pushSnapshot]);

  const handleSelectControl = useCallback(() => {
    if (!label.controlId) return;
    setSelectedLabel(null);
    setSelectedIds([label.controlId]);
  }, [label.controlId, setSelectedLabel, setSelectedIds]);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-gray-800 pb-2">
        <h3 className="text-sm font-medium text-gray-200">Label</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {isStandalone ? 'Standalone' : `Linked to ${label.controlId}`}
        </p>
      </div>

      {/* Text */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Text</label>
        <textarea
          value={label.text}
          onChange={handleTextChange}
          rows={Math.max(1, label.text.split('\n').length)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
        />
        <p className="text-[9px] text-gray-600">Shift+Enter for new line</p>
      </div>

      {/* Icon */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Icon</label>
        <select
          value={label.icon ?? ''}
          onChange={(e) => {
            pushSnapshot();
            updateLabel(label.id, { icon: e.target.value || undefined });
          }}
          className="w-full h-6 rounded border border-gray-700 bg-gray-900 px-1 text-[10px] text-gray-300 outline-none focus:border-blue-500"
        >
          <option value="">None</option>
          <option value="arrow-up">▲ Arrow Up</option>
          <option value="arrow-down">▼ Arrow Down</option>
          <option value="arrow-left">◀ Arrow Left</option>
          <option value="arrow-right">▶ Arrow Right</option>
          <option value="triangle-up">△ Triangle Up</option>
          <option value="triangle-down">▽ Triangle Down</option>
          <option value="triangle-left">◁ Triangle Left</option>
          <option value="triangle-right">▷ Triangle Right</option>
          <option value="plus">+ Plus</option>
          <option value="minus">− Minus</option>
          <option value="play">▶ Play</option>
          <option value="stop">■ Stop</option>
          <option value="record">● Record</option>
          <option value="settings-gear">⚙ Gear</option>
        </select>
      </div>

      {/* Font size */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Font Size</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={4}
            max={20}
            value={label.fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-gray-500 w-7">{label.fontSize}px</span>
        </div>
      </div>

      {/* Position info */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Position</label>
        <div className="text-[10px] text-gray-400">
          x: {Math.round(label.x)} · y: {Math.round(label.y)}
          {label.w != null && <> · w: {Math.round(label.w)}</>}
        </div>
      </div>

      <div className="h-px bg-gray-800" />

      {/* Linked control */}
      {linkedControl && (
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wide text-gray-500">Linked Control</label>
          <button
            onClick={handleSelectControl}
            className="flex w-full h-7 items-center justify-between rounded border border-gray-700 bg-gray-900/60 px-2 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
            title="Select the linked control"
          >
            <span className="truncate">{label.controlId}</span>
            <span className="text-gray-600">→</span>
          </button>
        </div>
      )}

      <div className="h-px bg-gray-800" />

      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          onClick={handleToggleHidden}
          className={`flex-1 flex h-7 items-center justify-center rounded border text-[10px] transition-colors ${
            label.hidden
              ? 'border-amber-600/40 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20'
              : 'border-gray-700 bg-gray-900/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
          }`}
          title={label.hidden ? 'Show label' : 'Hide label (preserves position)'}
        >
          {label.hidden ? 'Show' : 'Hide'}
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex h-7 items-center justify-center rounded border border-red-700/30 bg-red-900/10 px-2 text-[10px] text-red-400 hover:bg-red-900/20 transition-colors"
          title="Delete label permanently"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedLabelId = useEditorStore((s) => s.selectedLabelId);
  const editorLabels = useEditorStore((s) => s.editorLabels) as any[];
  const controls = useEditorStore((s) => s.controls);
  const sections = useEditorStore((s) => s.sections);

  // Determine what's selected
  const selectedControls = useMemo(
    () => selectedIds.map((id) => controls[id]).filter(Boolean),
    [selectedIds, controls],
  );

  const selectedSection = useMemo(() => {
    if (selectedIds.length === 1) {
      return sections[selectedIds[0]] ?? null;
    }
    return null;
  }, [selectedIds, sections]);

  const selectedLabel = useMemo(() => {
    if (!selectedLabelId) return null;
    return editorLabels.find((l: any) => l.id === selectedLabelId) ?? null;
  }, [selectedLabelId, editorLabels]);

  // Render based on selection state
  let content: React.ReactNode;

  if (selectedLabel) {
    // A label is selected — show label properties
    content = <LabelProperties label={selectedLabel} />;
  } else if (selectedIds.length === 0) {
    // Nothing selected — show keyboard offset if keyboard exists
    content = <EmptyStatePanel />;
  } else if (selectedSection && selectedControls.length === 0) {
    // A section is selected (not a control)
    content = <SectionProperties section={selectedSection} />;
  } else if (selectedControls.length === 1) {
    // Single control selected
    content = <SingleControlProperties control={selectedControls[0]} />;
  } else if (selectedControls.length > 1) {
    // Multiple controls selected
    content = <MultiControlProperties controls={selectedControls} />;
  } else {
    // Fallback (shouldn't happen)
    content = (
      <div className="text-xs text-gray-500 px-4 text-center">
        Unknown selection
      </div>
    );
  }

  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever selection changes
  useEffect(() => {
    panelRef.current?.scrollTo(0, 0);
  }, [selectedIds]);

  // Only show properties panel when something is selected or keyboard exists
  const keyboard = useEditorStore((s) => s.keyboard);
  const hasContent = selectedIds.length > 0 || keyboard;
  const [collapsed, setCollapsed] = useState(false);

  if (!hasContent) return null;

  if (collapsed) {
    return (
      <div className="flex flex-col border-l border-gray-800 bg-[#0d0d1a]">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-10 w-8 items-center justify-center text-gray-400 hover:text-gray-200"
          aria-label="Expand properties panel"
          title="Show Properties"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 3l-5 5 5 5z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-gray-800 bg-[#0d0d1a] flex-shrink-0 flex flex-col overflow-hidden">
      <div className="flex h-7 items-center justify-between border-b border-gray-800 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Properties
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-gray-300"
          aria-label="Collapse properties panel"
          title="Hide Properties"
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 3l-5 5 5 5z" />
          </svg>
        </button>
      </div>
      <div ref={panelRef} className="flex-1 overflow-y-auto p-3 text-gray-300">{content}</div>
    </div>
  );
}
