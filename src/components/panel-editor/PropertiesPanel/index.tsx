'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import type { ControlDef, SectionDef } from '../store';
import ControlTypeSelector from './ControlTypeSelector';
import LabelEditor from './LabelEditor';
import GeometryFields from './GeometryFields';
import ColorPickerRow from './ColorPickerRow';
import MixedSelectionPanel from './MixedSelectionPanel';
import {
  selectedControlIds,
  selectedLabelIdFromSelection,
  selectedBannerIdFromSelection,
} from '../store/selection-types';
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
import { ICON_CATEGORIES, HARDWARE_ICONS, HARDWARE_ICON_SVGS } from '@/lib/hardware-icons';

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

function RotationInput({
  value,
  mixed,
  onCommit,
}: {
  value: number;
  mixed: boolean;
  onCommit: (val: number) => void;
}) {
  const [localValue, setLocalValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(mixed ? '' : String(value));
    }
  }, [value, mixed, isFocused]);

  const commit = useCallback(() => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed !== value) {
      onCommit(parsed);
    } else {
      setLocalValue(mixed ? '' : String(value));
    }
  }, [localValue, value, mixed, onCommit]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-gray-500 w-12">Custom</label>
      <input
        type="number"
        value={localValue}
        placeholder={mixed ? 'Mixed' : '0'}
        step={1}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); commit(); }}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
          if (e.key === 'Escape') {
            setLocalValue(mixed ? '' : String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-7 flex-1 rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
        title="Custom rotation angle (degrees)"
      />
      <span className="text-[10px] text-gray-500">°</span>
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

      {/* Section label — text input. The On/Off button used to live
          here but became redundant once Frame Mode added 'body-only'
          and 'hidden' options (those control visibility; this input
          controls the text). Leave the input empty to clear the label. */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Section Label
        </label>
        <input
          type="text"
          value={section.headerLabel ?? ''}
          onChange={(e) => setSectionLabel(section.id, e.target.value || null)}
          onBlur={() => { pushSnapshot(); }}
          className="w-full h-6 rounded border border-gray-700 bg-gray-900 px-2 text-[10px] text-gray-300 outline-none focus:border-blue-500"
          placeholder="Section label text"
        />
      </div>

      {/* Section frame mode */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Frame Mode
        </label>
        <div className="flex gap-1">
          {([
            ['full', 'Full'],
            ['header-only', 'Title Only'],
            ['body-only', 'Body Only'],
            ['hidden', 'Hidden'],
          ] as const).map(([mode, label]) => {
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
                      : mode === 'body-only' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-600'
                      : 'bg-gray-600/30 text-gray-200 border border-gray-500'
                    : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
                }`}
                title={
                  mode === 'full' ? 'Full frame: border + header strip with title'
                    : mode === 'header-only' ? 'Just the title text — no frame body'
                    : mode === 'body-only' ? 'Frame body visible — no title strip'
                    : 'Hidden — section invisible (controls still render)'
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Title banner backdrop toggle — only meaningful for frame modes
            that show a title (Full, Title Only). When off, the title text
            renders without the dark banner background, useful for cleaner
            layouts when the section body already provides visual grouping. */}
        {(() => {
          const currentMode = section.frameMode ?? (section.hidden ? 'hidden' : 'full');
          const titleVisible = currentMode === 'full' || currentMode === 'header-only';
          if (!titleVisible) return null;
          const showBanner = section.showTitleBanner !== false;
          return (
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBanner}
                onChange={(e) => {
                  pushSnapshot();
                  useEditorStore.getState().updateSection(section.id, {
                    showTitleBanner: e.target.checked,
                  });
                }}
                className="h-3 w-3 rounded border-gray-700 bg-gray-800 accent-blue-500"
              />
              <span className="text-[10px] text-gray-400">
                Title banner backdrop
                <span className="text-[9px] text-gray-600 ml-1">
                  (dark strip behind title)
                </span>
              </span>
            </label>
          );
        })()}
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
  const editorLabels = useEditorStore((s) => s.editorLabels) as import('../store/historySlice').EditorLabel[];
  const updateLabel = useEditorStore((s) => s.updateLabel);
  const addStandaloneLabel = useEditorStore((s) => s.addStandaloneLabel);
  const deleteLabel = useEditorStore((s) => s.deleteLabel);
  const controlScale = useEditorStore((s) => s.controlScale);

  const ids = useMemo(() => [control.id], [control.id]);

  // Find ANY editorLabel linked to this control (text or icon — it's the same label)
  const controlLabel = useMemo(() =>
    editorLabels.find(l => l.controlId === control.id),
    [editorLabels, control.id]
  );

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
      // Auto-swap w↔h for faders/sliders on cross-cardinal rotation transitions
      // so the whole component rotates as a unit (bbox + visual together).
      // 0/180 ↔ 90/270 crossing means orientation changed; non-cardinal angles
      // (e.g., 33°) don't touch the bbox — they use CSS rotate() in the wrapper.
      const oldIsCardinal = control.rotation === 90 || control.rotation === 270;
      const newIsCardinal = degrees === 90 || degrees === 270;
      const isFader = control.type === 'fader' || control.type === 'slider';
      if (isFader && oldIsCardinal !== newIsCardinal) {
        resizeControl(control.id, control.h, control.w);
      }
      updateControlProp(ids, 'rotation', degrees);
    },
    [ids, control, updateControlProp, resizeControl, pushSnapshot],
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
              <button
                onClick={() => { pushSnapshot(); updateControlProp(ids, 'ledVariant', 'triple-label'); }}
                className={`flex-1 flex items-center justify-center gap-1 rounded border py-1.5 text-[10px] transition-colors ${
                  control.ledVariant === 'triple-label'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
                title="3-row LED indicator (e.g. CDJ-3000 DIRECTION lever position display)"
                data-testid="led-variant-triple"
              >
                <div className="flex flex-col gap-px">
                  <div className="w-4 h-1 rounded-sm bg-green-800 border border-green-600" />
                  <div className="w-4 h-1 rounded-sm bg-gray-800 border border-gray-600" />
                  <div className="w-4 h-1 rounded-sm bg-gray-800 border border-gray-600" />
                </div>
                Triple
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

      {/* Icon picker — for buttons, LEDs, pads, indicators */}
      {(control.type === 'button' || control.type === 'led' || control.type === 'indicator' || control.type === 'pad') && (
        <>
          {/* Icon picker — creates/updates editorLabel with icon */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Icon</label>
            {(control.icon || controlLabel?.icon) && (
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded border border-blue-500 bg-blue-500/10 flex items-center justify-center text-blue-400">
                  {HARDWARE_ICON_SVGS[control.icon ?? controlLabel?.icon ?? '']
                    ? <div className="w-4 h-4">{HARDWARE_ICON_SVGS[control.icon ?? controlLabel?.icon ?? '']}</div>
                    : <span className="text-xs">{HARDWARE_ICONS[control.icon ?? controlLabel?.icon ?? ''] ?? '?'}</span>}
                </div>
                <span className="text-[9px] text-gray-400 flex-1">{(control.icon ?? controlLabel?.icon ?? '').replace(/-/g, ' ')}</span>
                <button
                  onClick={() => {
                    pushSnapshot();
                    updateControlProp(ids, 'icon', undefined);
                    // Restore text label (icon → text), ensure visible
                    if (controlLabel) {
                      updateLabel(controlLabel.id, { icon: undefined, text: control.label, hidden: false });
                    }
                  }}
                  className="text-[9px] text-gray-600 hover:text-red-400 transition-colors"
                >clear</button>
              </div>
            )}
            {ICON_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p className="text-[8px] text-gray-600 uppercase tracking-wider mb-0.5">{cat.label}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {cat.keys.map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        pushSnapshot();
                        updateControlProp(ids, 'icon', k);
                        if (controlLabel) {
                          // Same label — add icon, keep existing text, ensure visible
                          updateLabel(controlLabel.id, { icon: k, hidden: false });
                        } else {
                          // No label exists — create one with icon
                          const visW = control.w * controlScale;
                          const visH = control.h * controlScale;
                          const iconSize = Math.round(Math.min(visW, visH) * 0.6);
                          const labelId = addStandaloneLabel(
                            control.x + control.w + 4,
                            control.y + (control.h - iconSize) / 2,
                            control.label,
                          );
                          updateLabel(labelId, {
                            icon: k,
                            controlId: control.id,
                            fontSize: Math.max(iconSize, 8),
                          });
                        }
                      }}
                      className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                        (control.icon === k || controlLabel?.icon === k)
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                      }`}
                      title={k.replace(/-/g, ' ')}
                    >
                      {HARDWARE_ICON_SVGS[k]
                        ? <div className="w-3.5 h-3.5">{HARDWARE_ICON_SVGS[k]}</div>
                        : <span className="text-[9px] leading-none">{HARDWARE_ICONS[k] ?? '?'}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {(control.icon || controlLabel?.icon) && (
            <p className="text-[9px] text-gray-600">Drag the icon label to position it. Select from Layers panel (L) if hard to click.</p>
          )}

          <div className="h-px bg-gray-800" />
        </>
      )}

      {/* LED state + color — for type='led' / 'indicator' controls (split LEDs etc.) */}
      {(control.type === 'led' || control.type === 'indicator') && (
        <>
          {/* Default state: on/off — controls how the LED renders at rest */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Default state</label>
            <div className="flex gap-1">
              {([['off', 'Off (dim)'], ['on', 'On (lit)']] as const).map(([mode, lbl]) => {
                const isActive = mode === 'on' ? control.ledOn === true : control.ledOn !== true;
                return (
                  <button
                    key={mode}
                    onClick={() => { pushSnapshot(); updateControlProp(ids, 'ledOn', mode === 'on'); }}
                    className={`flex-1 rounded border py-1 text-[10px] transition-colors ${
                      isActive ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-gray-600 leading-tight">
              In a group, only the active LED is typically &ldquo;On.&rdquo; Tutorial steps can override this for any step.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">LED Color</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ['#22c55e', 'Green'],
                ['#f59e0b', 'Amber'],
                ['#d4a574', 'Tan'],
                ['#fbbf24', 'Yellow'],
                ['#ef4444', 'Red'],
                ['#3b82f6', 'Blue'],
                ['#ec4899', 'Pink'],
                ['#a78bfa', 'Purple'],
                ['#ffffff', 'White'],
              ].map(([color, name]) => (
                <button
                  key={color}
                  onClick={() => { pushSnapshot(); updateControlProp(ids, 'ledColor', color); }}
                  className={`w-5 h-5 rounded-full border transition-colors ${
                    (control.ledColor ?? '#22c55e') === color ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
              <input
                type="text"
                value={control.ledColor ?? ''}
                placeholder="#hex"
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') {
                    pushSnapshot();
                    updateControlProp(ids, 'ledColor', v || undefined);
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v && !/^#[0-9a-fA-F]{6}$/.test(v)) {
                    updateControlProp(ids, 'ledColor', undefined);
                  }
                }}
                className="w-16 h-5 rounded border border-gray-700 bg-gray-900 px-1 text-[9px] text-gray-300 outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
          <div className="h-px bg-gray-800" />
        </>
      )}

      {/* LED — 5-style selector for all buttons/pads (PR EP3) */}
      {(control.type === 'button' || control.type === 'pad') && (
        <>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">LED</label>
            {/* 5 pills in 2 rows (wraps via flex-wrap on narrow viewports) */}
            <div className="grid grid-cols-3 gap-1">
              {([
                // [mode-key, ledStyle-value-or-null, label, tooltip, icon]
                ['none', null, 'None', 'No LED on this button',
                  <div key="none-icon" className="w-3.5 h-2.5" />] as const,
                ['dot', 'dot', 'Dot', 'Separate small LED indicator next to the button',
                  <div key="dot-icon" className="w-2 h-2 rounded-full bg-green-500" />] as const,
                ['face', 'face', 'Face', 'Whole button face lights up (e.g., DJS-1000 SAMPLING/FX/MUTE)',
                  <div key="face-icon" className="w-3.5 h-2.5 rounded-sm bg-green-500/70" />] as const,
                ['label-backlit', 'label-backlit', 'Label', 'Only the label/text glows; button face stays dark',
                  <div key="label-icon" className="w-3.5 h-2.5 rounded-sm border border-gray-700 flex items-center justify-center text-[8px] font-bold text-green-400">A</div>] as const,
                ['edge-glow', 'edge-glow', 'Edge', 'Border/ring lights up (auto-ring on circle buttons)',
                  <div key="edge-icon" className="w-3.5 h-2.5 rounded-sm border-2 border-green-500" />] as const,
              ]).map(([mode, ledStyleValue, label, tooltip, icon]) => {
                // Active-detection: normalize integrated→face for display
                const currentLedStyle = !control.hasLed
                  ? null
                  : control.ledStyle === 'integrated' ? 'face' : (control.ledStyle ?? 'dot');
                const isActive = mode === 'none' ? !control.hasLed : currentLedStyle === ledStyleValue;
                return (
                  <button
                    key={mode}
                    title={tooltip}
                    onClick={() => {
                      pushSnapshot();
                      if (mode === 'none') {
                        updateControlProp(ids, 'hasLed', false);
                        updateControlProp(ids, 'ledStyle', undefined);
                      } else {
                        updateControlProp(ids, 'hasLed', true);
                        updateControlProp(ids, 'ledStyle', ledStyleValue);
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1 rounded border py-1.5 text-[10px] transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* LED Color — only when Dot or Glow is selected */}
          {control.hasLed && (
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">LED Color</label>
              <div className="flex items-center gap-1.5">
                {['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => { pushSnapshot(); updateControlProp(ids, 'ledColor', color); }}
                    className={`w-4 h-4 rounded-full border transition-colors ${
                      (control.ledColor ?? '#22c55e') === color ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="h-px bg-gray-800" />
        </>
      )}

      {/* Label.
          Color routing: when labelPosition === 'on-button' the label renders
          INSIDE the button face via PanelButton — written to control.labelColor.
          For external positions (above/below/right/left/etc.) the visible
          label is the linked editorLabel rendered by LabelLayer — color
          must be written to controlLabel.color or the picker appears to
          do nothing. Single picker, position-aware routing. */}
      <LabelEditor
        label={control.label}
        labelPosition={control.labelPosition}
        secondaryLabel={control.secondaryLabel}
        labelFontSize={control.labelFontSize}
        isDualLabel={control.ledVariant === 'dual-label'}
        isTripleLabel={control.ledVariant === 'triple-label'}
        tertiaryLabel={(control as { tertiaryLabel?: string }).tertiaryLabel}
        onTertiaryLabelChange={(val) => { pushSnapshot(); updateControlProp(ids, 'tertiaryLabel' as never, val as never); }}
        labelAlign={control.labelAlign}
        labelColor={
          control.labelPosition === 'on-button'
            ? control.labelColor
            : controlLabel?.color
        }
        onLabelChange={handleLabelChange}
        onPositionChange={handlePositionChange}
        onSecondaryLabelChange={handleSecondaryLabelChange}
        onFontSizeChange={(val) => { pushSnapshot(); updateControlProp(ids, 'labelFontSize', val); }}
        onAlignChange={(val) => { pushSnapshot(); updateControlProp(ids, 'labelAlign', val); }}
        onColorChange={(val) => {
          pushSnapshot();
          if (control.labelPosition === 'on-button') {
            updateControlProp(ids, 'labelColor', val || undefined);
          } else if (controlLabel) {
            // External label — write to the linked editor label
            updateLabel(controlLabel.id, { color: val || undefined });
          } else {
            // No linked editor label exists yet (rare — usually one exists
            // when labelPosition is external). Fall back to control.labelColor
            // so the value isn't lost.
            updateControlProp(ids, 'labelColor', val || undefined);
          }
        }}
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
      <div className="space-y-1">
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
        <RotationInput
          value={control.rotation ?? 0}
          mixed={false}
          onCommit={handleRotationChange}
        />
        {/* Resize-disabled hint — shown when CSS rotation is active on a
            non-fader-cardinal control. Mirrors the canResize gate in
            ControlNode.tsx so the contractor knows why drag handles vanish. */}
        {(() => {
          const isFaderType = control.type === 'fader' || control.type === 'slider';
          const isCardinalRotation = control.rotation === 90 || control.rotation === 270;
          const hasCssRotation = !!control.rotation && !(isFaderType && isCardinalRotation);
          if (!hasCssRotation) return null;
          return (
            <div className="text-[9px] text-amber-400/80 leading-tight pl-1">
              ℹ Resize is locked while rotated. Set rotation to 0° to resize, then re-apply.
            </div>
          );
        })()}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-800" />

      {/* Lock mode */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Lock
        </label>
        <div className="flex gap-1">
          {([['unlocked', 'Unlocked'], ['size-locked', 'Size'], ['fully-locked', 'Full']] as const).map(([mode, label]) => {
            const currentMode = control.locked ? 'fully-locked' : control.resizeLocked ? 'size-locked' : 'unlocked';
            const isActive = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  pushSnapshot();
                  useEditorStore.getState().setLockMode(ids, mode);
                }}
                className={`flex-1 rounded px-1.5 py-1 text-[9px] font-medium transition-colors ${
                  isActive
                    ? mode === 'fully-locked' ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-600'
                      : mode === 'size-locked' ? 'bg-blue-600/30 text-blue-300 border border-blue-600'
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

      {/* Layer order */}
      <div className="h-px bg-gray-800" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">
          Layer
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 mr-1">{control.zOrder ?? 0}</span>
          <button
            onClick={() => { pushSnapshot(); useEditorStore.getState().bringForward(); }}
            className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-gray-300"
            title="Bring Forward (Cmd+Alt+])"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 2l4 4H2z" /></svg>
          </button>
          <button
            onClick={() => { pushSnapshot(); useEditorStore.getState().sendBackward(); }}
            className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-gray-300"
            title="Send Backward (Cmd+Alt+[)"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 10l4-4H2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Select Properties ─────────────────────────────────────────────────

function MultiControlProperties({ controls }: { controls: ControlDef[] }) {
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const updateControlProp = useEditorStore((s) => s.updateControlProp);
  const resizeControl = useEditorStore((s) => s.resizeControl);
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
  const updateLabel = useEditorStore((s) => s.updateLabel);

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
  const rotations = controls.map((c) => c.rotation ?? 0);

  const typeMixed = !allSame(types);
  const labelMixed = !allSame(labels);
  const positionMixed = !allSame(positions);
  const secondaryMixed = !allSame(secondaryLabels);
  const rotationMixed = !allSame(rotations);

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

  const handleRotationChange = useCallback(
    (degrees: number) => {
      pushSnapshot();
      const newIsCardinal = degrees === 90 || degrees === 270;
      // Per-control: if a fader/slider crosses the cardinal boundary, swap w↔h
      // so its bbox rotates as a unit with its visual.
      for (const ctrl of controls) {
        const oldIsCardinal = ctrl.rotation === 90 || ctrl.rotation === 270;
        const isFader = ctrl.type === 'fader' || ctrl.type === 'slider';
        if (isFader && oldIsCardinal !== newIsCardinal) {
          resizeControl(ctrl.id, ctrl.h, ctrl.w);
        }
      }
      updateControlProp(ids, 'rotation', degrees);
    },
    [ids, controls, updateControlProp, resizeControl, pushSnapshot],
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
        labelColor={allSame(controls.map((c) => c.labelColor)) ? controls[0]?.labelColor : undefined}
        colorMixed={!allSame(controls.map((c) => c.labelColor))}
        onLabelChange={handleLabelChange}
        onPositionChange={handlePositionChange}
        onSecondaryLabelChange={handleSecondaryLabelChange}
        onFontSizeChange={(val) => { pushSnapshot(); updateControlProp(ids, 'labelFontSize', val); }}
        onColorChange={(val) => {
          // Position-aware color routing, matching SingleControlProperties:
          //   - 'on-button' labels → write to control.labelColor (PanelButton
          //     renders inline using this).
          //   - External labels (above/below/etc) → the visible label is the
          //     linked editorLabel rendered by LabelLayer. Write to
          //     editorLabel.color or the picker appears to do nothing.
          // Without this per-control split, multi-select + color pick wrote
          // ONLY to control.labelColor, leaving external labels grey
          // (user-reported regression vs single-control flow).
          pushSnapshot();
          const next = val || undefined;
          for (const c of controls) {
            if (c.labelPosition === 'on-button') {
              updateControlProp([c.id], 'labelColor', next);
            } else {
              const linked = editorLabels.find((l) => l.controlId === c.id);
              if (linked) {
                updateLabel(linked.id, { color: next });
              } else {
                updateControlProp([c.id], 'labelColor', next);
              }
            }
          }
        }}
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

      {/* Rotation (multi-select: applies to all) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Rotate</label>
          <div className="flex gap-1">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => handleRotationChange(deg)}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  !rotationMixed && (rotations[0] ?? 0) === deg
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300 border border-transparent'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
        <RotationInput
          value={rotationMixed ? 0 : (rotations[0] ?? 0)}
          mixed={rotationMixed}
          onCommit={handleRotationChange}
        />
      </div>

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

      {/* ── Lock Mode ─────────────────────────────────────────────── */}
      <div className="h-px bg-gray-800" />
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Lock
        </label>
        <div className="flex gap-1">
          {([['unlocked', 'Unlocked'], ['size-locked', 'Size'], ['fully-locked', 'Full']] as const).map(([mode, label]) => {
            const modes = controls.map(c => c.locked ? 'fully-locked' : c.resizeLocked ? 'size-locked' : 'unlocked');
            const isActive = modes.every(m => m === mode);
            const isMixed = !allSame(modes);
            return (
              <button
                key={mode}
                onClick={() => {
                  pushSnapshot();
                  useEditorStore.getState().setLockMode(ids, mode);
                }}
                className={`flex-1 rounded px-1.5 py-1 text-[9px] font-medium transition-colors ${
                  isActive
                    ? mode === 'fully-locked' ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-600'
                      : mode === 'size-locked' ? 'bg-blue-600/30 text-blue-300 border border-blue-600'
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

// ─── Container Number Field (local state, commit on blur) ───────────────────

function ContainerNumField({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [localVal, setLocalVal] = useState<string>(String(Math.round(value)));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocalVal(String(Math.round(value)));
  }, [value, focused]);

  return (
    <div className="space-y-0.5">
      <label className="text-[9px] text-gray-600 uppercase">{label}</label>
      <input
        type="number"
        value={localVal}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const num = parseFloat(localVal);
          if (!isNaN(num) && num !== value) onCommit(num);
          else setLocalVal(String(Math.round(value)));
        }}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') { setLocalVal(String(Math.round(value))); (e.target as HTMLInputElement).blur(); }
        }}
        className="w-full h-6 rounded border border-gray-700 bg-gray-800 px-1 text-[10px] text-gray-200 text-center outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

// ─── Container Properties ───────────────────────────────────────────────────

function ContainerProperties({ container }: { container: import('../store/manifestSlice').ControlContainer }) {
  const updateContainer = useEditorStore((s) => s.updateContainer);
  const deleteContainer = useEditorStore((s) => s.deleteContainer);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-gray-800 pb-2">
        <h3 className="text-sm font-medium text-gray-200">Container</h3>
        <p className="text-xs text-gray-500 mt-0.5">{container.id}</p>
      </div>

      {/* Style preset */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Style</label>
        <div className="flex gap-1">
          {([['recessed', 'Recessed'], ['raised', 'Raised'], ['outlined', 'Outlined'], ['filled', 'Filled']] as const).map(([style, label]) => (
            <button
              key={style}
              onClick={() => { pushSnapshot(); updateContainer(container.id, { style }); }}
              className={`flex-1 rounded px-1 py-1 text-[9px] font-medium transition-colors ${
                container.style === style
                  ? 'bg-gray-600/30 text-gray-200 border border-gray-500'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Label */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Label</label>
        <input
          type="text"
          value={container.label ?? ''}
          placeholder="Optional label"
          onChange={(e) => updateContainer(container.id, { label: e.target.value || undefined })}
          onBlur={() => pushSnapshot()}
          className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
        />
      </div>

      {/* Border radius */}
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500">Border Radius</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={16}
            value={container.borderRadius ?? 4}
            onChange={(e) => { pushSnapshot(); updateContainer(container.id, { borderRadius: Number(e.target.value) }); }}
            className="h-1 flex-1 cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-gray-500 w-6">{container.borderRadius ?? 4}px</span>
        </div>
      </div>

      {/* Position */}
      <div className="h-px bg-gray-800" />
      <div className="grid grid-cols-4 gap-1">
        {(['x', 'y', 'w', 'h'] as const).map((field) => (
          <ContainerNumField
            key={field}
            label={field}
            value={container[field]}
            onCommit={(val) => { pushSnapshot(); updateContainer(container.id, { [field]: val }); }}
          />
        ))}
      </div>

      {/* Delete */}
      <div className="h-px bg-gray-800" />
      <button
        onClick={() => { pushSnapshot(); deleteContainer(container.id); setSelectedIds([]); }}
        className="flex h-7 items-center justify-center rounded border border-red-700/30 bg-red-900/10 text-[10px] text-red-400 hover:bg-red-900/20 transition-colors"
      >
        Delete Container
      </button>
    </div>
  );
}

// ─── Polish Banner Properties ───────────────────────────────────────────────

function PolishBannerProperties({ banner }: { banner: import('../store/historySlice').PolishBanner }) {
  const updatePolishBanner = useEditorStore((s) => s.updatePolishBanner);
  const deletePolishBanner = useEditorStore((s) => s.deletePolishBanner);
  const setSelectedBanner = useEditorStore((s) => s.setSelectedBanner);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-gray-800 pb-2">
        <h3 className="text-sm font-medium text-gray-200">Polish Banner</h3>
        <p className="text-xs text-gray-500 mt-0.5">Decorative overlay (no tutorial interaction)</p>
      </div>

      {/* Text */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Text</label>
        <input
          type="text"
          value={banner.text ?? ''}
          placeholder="(leave empty for no text)"
          onChange={(e) => updatePolishBanner(banner.id, { text: e.target.value })}
          onBlur={() => pushSnapshot()}
          className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
        />
      </div>

      {/* Font size */}
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500">Font Size</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={10}
            max={72}
            value={banner.fontSize ?? 16}
            onChange={(e) => { pushSnapshot(); updatePolishBanner(banner.id, { fontSize: Number(e.target.value) }); }}
            className="h-1 flex-1 cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-gray-500 w-8">{banner.fontSize ?? 16}px</span>
        </div>
      </div>

      {/* Text color */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Text Color</label>
        <ColorPickerRow value={banner.textColor} onChange={(c) => { pushSnapshot(); updatePolishBanner(banner.id, { textColor: c }); }} />
      </div>

      {/* Background color */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Background</label>
        <ColorPickerRow value={banner.backgroundColor} onChange={(c) => { pushSnapshot(); updatePolishBanner(banner.id, { backgroundColor: c }); }} />
      </div>

      {/* Background opacity */}
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((banner.backgroundOpacity ?? 1.0) * 100)}
            onChange={(e) => updatePolishBanner(banner.id, { backgroundOpacity: Number(e.target.value) / 100 })}
            onMouseUp={() => pushSnapshot()}
            className="h-1 flex-1 cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-gray-500 w-8">{Math.round((banner.backgroundOpacity ?? 1.0) * 100)}%</span>
        </div>
      </div>

      {/* Alignment (horizontal) */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Text Align</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => { pushSnapshot(); updatePolishBanner(banner.id, { align: a }); }}
              className={`flex-1 rounded px-1 py-1 text-[9px] font-medium transition-colors ${
                (banner.align ?? 'center') === a
                  ? 'bg-gray-600/30 text-gray-200 border border-gray-500'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical alignment */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Vertical Align</label>
        <div className="flex gap-1">
          {(['top', 'center', 'bottom'] as const).map((a) => (
            <button
              key={a}
              onClick={() => { pushSnapshot(); updatePolishBanner(banner.id, { verticalAlign: a }); }}
              className={`flex-1 rounded px-1 py-1 text-[9px] font-medium transition-colors ${
                (banner.verticalAlign ?? 'center') === a
                  ? 'bg-gray-600/30 text-gray-200 border border-gray-500'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Border radius */}
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500">Corner Radius</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={20}
            value={banner.borderRadius ?? 4}
            onChange={(e) => { pushSnapshot(); updatePolishBanner(banner.id, { borderRadius: Number(e.target.value) }); }}
            className="h-1 flex-1 cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-gray-500 w-6">{banner.borderRadius ?? 4}px</span>
        </div>
      </div>

      {/* Lock toggle */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Lock Position</label>
        <button
          onClick={() => { pushSnapshot(); updatePolishBanner(banner.id, { locked: !banner.locked }); }}
          className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
            banner.locked
              ? 'bg-amber-900/30 text-amber-300 border border-amber-700/50'
              : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}
        >
          {banner.locked ? '🔒 Locked' : 'Unlocked'}
        </button>
      </div>

      {/* Geometry */}
      <div className="h-px bg-gray-800" />
      <div className="grid grid-cols-4 gap-1">
        <ContainerNumField label="X" value={banner.x} onCommit={(val) => { pushSnapshot(); updatePolishBanner(banner.id, { x: val }); }} />
        <ContainerNumField label="Y" value={banner.y} onCommit={(val) => { pushSnapshot(); updatePolishBanner(banner.id, { y: val }); }} />
        <ContainerNumField label="W" value={banner.w} onCommit={(val) => { pushSnapshot(); updatePolishBanner(banner.id, { w: val }); }} />
        <ContainerNumField label="H" value={banner.h} onCommit={(val) => { pushSnapshot(); updatePolishBanner(banner.id, { h: val }); }} />
      </div>

      {/* Layer order — matches SingleControlProperties pattern */}
      <div className="h-px bg-gray-800" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">
          Layer
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 mr-1">{banner.zIndex ?? 0}</span>
          <button
            onClick={() => { pushSnapshot(); updatePolishBanner(banner.id, { zIndex: (banner.zIndex ?? 0) + 1 }); }}
            className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-gray-300"
            title="Bring Forward — moves banner above other elements"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 2l4 4H2z" /></svg>
          </button>
          <button
            onClick={() => { pushSnapshot(); updatePolishBanner(banner.id, { zIndex: (banner.zIndex ?? 0) - 1 }); }}
            className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-gray-300"
            title="Send Backward — moves banner below other elements"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 10l4-4H2z" /></svg>
          </button>
        </div>
      </div>

      {/* Delete */}
      <div className="h-px bg-gray-800" />
      <button
        onClick={() => { pushSnapshot(); deletePolishBanner(banner.id); setSelectedBanner(null); }}
        className="flex h-7 items-center justify-center rounded border border-red-700/30 bg-red-900/10 text-[10px] text-red-400 hover:bg-red-900/20 transition-colors"
      >
        Delete Banner
      </button>
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

  const handleAlignChange = useCallback((align: 'left' | 'center' | 'right') => {
    if (label.align === align) return;
    pushSnapshot();
    updateLabel(label.id, { align });
  }, [label.id, label.align, updateLabel, pushSnapshot]);

  const handleColorChange = useCallback((color: string) => {
    pushSnapshot();
    // Empty string clears the override → renders at default text-gray-300
    updateLabel(label.id, { color: color || undefined });
  }, [label.id, updateLabel, pushSnapshot]);

  const handleX = useCallback((v: number) => {
    pushSnapshot();
    updateLabel(label.id, { x: Math.round(v) });
  }, [label.id, updateLabel, pushSnapshot]);

  const handleY = useCallback((v: number) => {
    pushSnapshot();
    updateLabel(label.id, { y: Math.round(v) });
  }, [label.id, updateLabel, pushSnapshot]);

  const handleW = useCallback((v: number) => {
    pushSnapshot();
    updateLabel(label.id, { w: Math.max(8, Math.round(v)) });
  }, [label.id, updateLabel, pushSnapshot]);

  const handleAutoWidthToggle = useCallback(() => {
    pushSnapshot();
    if (label.w == null) {
      // Currently auto → switch to explicit width (default to a sensible value)
      updateLabel(label.id, { w: 60 });
    } else {
      // Currently explicit → switch to auto (sizes to text)
      updateLabel(label.id, { w: undefined });
    }
  }, [label.id, label.w, updateLabel, pushSnapshot]);

  const handleIconPick = useCallback((iconKey: string | undefined) => {
    pushSnapshot();
    updateLabel(label.id, { icon: iconKey });
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

  const isAutoWidth = label.w == null;

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

      {/* Icon picker — categorized grid (matches control Properties pattern) */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Icon</label>
        {label.icon && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded border border-blue-500 bg-blue-500/10 flex items-center justify-center text-blue-400">
              {HARDWARE_ICON_SVGS[label.icon]
                ? <div className="w-4 h-4">{HARDWARE_ICON_SVGS[label.icon]}</div>
                : <span className="text-xs">{HARDWARE_ICONS[label.icon] ?? '?'}</span>}
            </div>
            <span className="text-[9px] text-gray-400 flex-1">{label.icon.replace(/-/g, ' ')}</span>
            <button
              onClick={() => handleIconPick(undefined)}
              className="text-[9px] text-gray-600 hover:text-red-400 transition-colors"
            >clear</button>
          </div>
        )}
        {ICON_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-[8px] text-gray-600 uppercase tracking-wider mb-0.5">{cat.label}</p>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {cat.keys.map((k) => (
                <button
                  key={k}
                  onClick={() => handleIconPick(k)}
                  className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                    label.icon === k
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                  title={k.replace(/-/g, ' ')}
                >
                  {HARDWARE_ICON_SVGS[k]
                    ? <div className="w-3.5 h-3.5">{HARDWARE_ICON_SVGS[k]}</div>
                    : <span className="text-[9px] leading-none">{HARDWARE_ICONS[k] ?? '?'}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Font size */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Font Size</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={4}
            max={40}
            value={label.fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-gray-500 w-7">{label.fontSize}px</span>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => handleAlignChange(a)}
              className={`flex-1 h-6 rounded border text-[10px] capitalize transition-colors ${
                label.align === a
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
              title={`Align ${a}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Shared color picker — same UX as control labels in LabelEditor. */}
      <ColorPickerRow value={label.color} onChange={handleColorChange} />

      {/* Position — editable x/y/w with Auto-width toggle */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Position</label>
        <div className="grid grid-cols-3 gap-1.5">
          <ContainerNumField label="X" value={label.x} onCommit={handleX} />
          <ContainerNumField label="Y" value={label.y} onCommit={handleY} />
          {isAutoWidth ? (
            <div className="space-y-0.5">
              <span className="text-[9px] text-gray-600 uppercase">W</span>
              <div className="w-full h-6 rounded border border-gray-800 bg-gray-900/40 px-1 text-[10px] text-gray-600 text-center flex items-center justify-center italic">
                auto
              </div>
            </div>
          ) : (
            <ContainerNumField label="W" value={label.w} onCommit={handleW} />
          )}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAutoWidth}
            onChange={handleAutoWidthToggle}
            className="h-3 w-3 cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-gray-400">Auto width (sizes to text)</span>
        </label>
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
  // Phase 6b — all three legacy slots derived from the unified selection.
  // Routing logic below keeps its previous semantics by construction:
  //   - selectedIds  = control + section ids (legacy mixed bag)
  //   - selectedLabelId = single label id OR null (multi-label → null)
  //   - selectedBannerId = single banner id OR null
  const selection = useEditorStore((s) => s.selection);
  const selectedIds = useMemo(() => selectedControlIds(selection), [selection]);
  const selectedLabelId = useMemo(() => selectedLabelIdFromSelection(selection), [selection]);
  const selectedBannerId = useMemo(() => selectedBannerIdFromSelection(selection), [selection]);
  const editorLabels = useEditorStore((s) => s.editorLabels) as any[];
  const polishBanners = useEditorStore((s) => s.polishBanners);
  const controls = useEditorStore((s) => s.controls);
  const sections = useEditorStore((s) => s.sections);

  // Phase 5 — mixed-type detection. When the unified selection contains
  // entries of 2+ distinct prefixes (e.g. control + label, or banner +
  // section), no single-type form fits. Route to MixedSelectionPanel
  // which shows a count breakdown + safe universal actions.
  // Phase 7 — ALSO route 2+ standalone labels (single-type) to the same
  // panel so contractors can access Align/Distribute on label-only
  // selections (previously fell through to "Unknown selection").
  const isMixedSelection = useMemo(() => {
    const distinct = new Set<string>();
    for (const sid of selection) {
      const colon = sid.indexOf(':');
      if (colon > 0) {
        distinct.add(sid.slice(0, colon));
        if (distinct.size > 1) return true;
      }
    }
    return false;
  }, [selection]);

  // Phase 7 — 2+ same-type labels with no controls. The MixedSelectionPanel
  // handles this case too (Align/Distribute work without an anchor).
  const isMultiLabelOnly = useMemo(() => {
    if (selection.length < 2) return false;
    let labelCount = 0;
    for (const sid of selection) {
      if (sid.startsWith('label:')) labelCount++;
      else return false; // any non-label entry → not pure-label-multi
    }
    return labelCount >= 2;
  }, [selection]);

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

  // Check if a container is selected
  const controlContainers = useEditorStore((s) => s.controlContainers);
  const selectedContainer = useMemo(() => {
    if (selectedIds.length === 1) {
      return controlContainers.find(c => c.id === selectedIds[0]) ?? null;
    }
    return null;
  }, [selectedIds, controlContainers]);

  // Render based on selection state
  let content: React.ReactNode;

  const selectedBanner = useMemo(() => {
    if (!selectedBannerId) return null;
    return polishBanners.find((b) => b.id === selectedBannerId) ?? null;
  }, [selectedBannerId, polishBanners]);

  if (isMixedSelection || isMultiLabelOnly) {
    // Phase 5 — multiple distinct entity types selected.
    // Phase 7 — OR 2+ same-type labels (gives them Align/Distribute UI).
    content = <MixedSelectionPanel />;
  } else if (selectedBanner) {
    // A polish banner is selected — show banner properties
    content = <PolishBannerProperties banner={selectedBanner} />;
  } else if (selectedLabel) {
    // A label is selected — show label properties
    content = <LabelProperties label={selectedLabel} />;
  } else if (selectedIds.length === 0) {
    // Nothing selected — show keyboard offset if keyboard exists
    content = <EmptyStatePanel />;
  } else if (selectedContainer) {
    // A container is selected — show container properties
    content = <ContainerProperties container={selectedContainer} />;
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

  // Only show properties panel when something is selected or keyboard exists.
  // selectedLabelId is checked separately because setSelectedLabel clears
  // selectedIds — without this, clicking a floating label on a keyboardless
  // device (e.g. xdj-rx3) caused the entire panel to unmount.
  const keyboard = useEditorStore((s) => s.keyboard);
  const hasContent = selectedIds.length > 0 || selectedLabelId || keyboard;
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
