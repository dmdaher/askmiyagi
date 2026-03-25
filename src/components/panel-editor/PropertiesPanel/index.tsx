'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import type { ControlDef, SectionDef } from '../store';
import ControlTypeSelector from './ControlTypeSelector';
import LabelEditor from './LabelEditor';
import GeometryFields from './GeometryFields';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check if all values in an array are the same */
function allSame<T>(values: T[]): boolean {
  if (values.length === 0) return true;
  return values.every((v) => v === values[0]);
}

// ─── Section Properties ──────────────────────────────────────────────────────

function SectionProperties({ section }: { section: SectionDef }) {
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const moveSection = useEditorStore((s) => s.moveSection);
  const resizeSection = useEditorStore((s) => s.resizeSection);
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

      {/* Header label */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Header
        </label>
        <div className="text-xs text-gray-300">
          {section.headerLabel ?? '(none)'}
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
      updateControlProp(ids, 'labelPosition', value);
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleSecondaryLabelChange = useCallback(
    (value: string) => {
      pushSnapshot();
      updateControlProp(ids, 'secondaryLabel', value);
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

  const ids = useMemo(() => controls.map((c) => c.id), [controls]);

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
      updateControlProp(ids, 'labelPosition', value);
    },
    [ids, updateControlProp, pushSnapshot],
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
      updateControlProp(ids, 'w', Math.max(8, val));
      pushSnapshot();
    },
    [ids, updateControlProp, pushSnapshot],
  );

  const handleHChange = useCallback(
    (val: number) => {
      updateControlProp(ids, 'h', Math.max(8, val));
      pushSnapshot();
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
        labelMixed={labelMixed}
        positionMixed={positionMixed}
        secondaryMixed={secondaryMixed}
        onLabelChange={handleLabelChange}
        onPositionChange={handlePositionChange}
        onSecondaryLabelChange={handleSecondaryLabelChange}
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
    useEditorStore.setState({
      keyboard: { ...keyboard, leftPercent: val },
      hasUserEdited: true,
    });
  };

  const handleWidthChange = (val: number) => {
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

export default function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
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

  // Render based on selection state
  let content: React.ReactNode;

  if (selectedIds.length === 0) {
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
    <div className="w-72 border-l border-gray-800 bg-[#0d0d1a] flex-shrink-0">
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
      <div ref={panelRef} className="h-full overflow-y-auto p-3 text-gray-300">{content}</div>
    </div>
  );
}
