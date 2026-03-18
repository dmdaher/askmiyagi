'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────

interface ManifestControl {
  id: string;
  verbatimLabel: string;
  type: string;
  section: string;
}

interface ManifestSection {
  id: string;
  headerLabel: string | null;
  archetype: string;
  gridRows?: number;
  gridCols?: number;
  controls: string[];
  containerAssignment?: Record<string, string[] | Record<string, string[]>>;
  heightSplits?: { cluster: number; anchor: number; gap: number };
  panelBoundingBox?: { x: number; y: number; w: number; h: number };
  widthPercent: number;
  complexity: string;
}

interface MasterManifest {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  layoutType: string;
  sections: ManifestSection[];
  controls: ManifestControl[];
}

interface TemplateSpec {
  sectionId: string;
  archetype: string;
  controlSlots: string[];
  containerAssignment?: Record<string, string[] | Record<string, string[]>>;
  notes: string[];
}

interface LayoutEngineOutput {
  templates: TemplateSpec[];
  panelArchitecture: {
    layoutType: string;
    sectionWidths: Record<string, string>;
    totalSections: number;
    totalControls: number;
  };
}

interface PanelLayoutEditorProps {
  deviceId: string;
}

type ReviewStatus = 'approved' | 'needs-fix' | null;

// ─── Constants ──────────────────────────────────────────────

const ARCHETYPE_OPTIONS = [
  'grid-NxM', 'single-column', 'single-row', 'anchor-layout',
  'cluster-above-anchor', 'cluster-below-anchor', 'dual-column', 'stacked-rows',
];

// Text-prefix icons for <option> elements (HTML doesn't allow children in option)
const ARCHETYPE_ICONS: Record<string, string> = {
  'single-row': '═══',
  'single-column': '║',
  'grid-NxM': '▦',
  'cluster-above-anchor': '▬▃',
  'cluster-below-anchor': '▃▬',
  'anchor-layout': '▃',
  'dual-column': '║║',
  'stacked-rows': '≡',
};

const TYPE_COLORS: Record<string, string> = {
  button: 'rgba(96, 165, 250, 0.35)',
  knob: 'rgba(167, 139, 250, 0.35)',
  slider: 'rgba(52, 211, 153, 0.35)',
  fader: 'rgba(52, 211, 153, 0.35)',
  encoder: 'rgba(251, 191, 36, 0.35)',
  led: 'rgba(251, 113, 133, 0.25)',
  screen: 'rgba(45, 212, 191, 0.35)',
  wheel: 'rgba(249, 115, 22, 0.35)',
  pad: 'rgba(139, 92, 246, 0.35)',
};

const TYPE_BORDERS: Record<string, string> = {
  button: 'rgba(96, 165, 250, 0.6)',
  knob: 'rgba(167, 139, 250, 0.6)',
  slider: 'rgba(52, 211, 153, 0.6)',
  fader: 'rgba(52, 211, 153, 0.6)',
  encoder: 'rgba(251, 191, 36, 0.6)',
  led: 'rgba(251, 113, 133, 0.5)',
  screen: 'rgba(45, 212, 191, 0.6)',
  wheel: 'rgba(249, 115, 22, 0.6)',
  pad: 'rgba(139, 92, 246, 0.6)',
};

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--surface, #1a1a2a)',
  color: 'var(--foreground, #e0e0e0)',
  border: '1px solid var(--card-border, #2a2a3a)',
};

// ─── Helpers ────────────────────────────────────────────────

/** Flatten a containerAssignment into a list of { slot, ids } entries */
function flattenAssignment(
  assignment: Record<string, string[] | Record<string, string[]>>
): Array<{ slot: string; ids: string[] }> {
  const result: Array<{ slot: string; ids: string[] }> = [];
  for (const [role, value] of Object.entries(assignment)) {
    if (Array.isArray(value)) {
      result.push({ slot: role, ids: value });
    } else {
      for (const [subRole, subIds] of Object.entries(value as Record<string, string[]>)) {
        result.push({ slot: `${role}.${subRole}`, ids: subIds });
      }
    }
  }
  return result;
}

/** Return the current slot key for a control id within an assignment */
function getControlSlot(
  controlId: string,
  assignment: Record<string, string[] | Record<string, string[]>> | undefined
): string {
  if (!assignment) return 'unassigned';
  for (const [role, value] of Object.entries(assignment)) {
    if (Array.isArray(value)) {
      if (value.includes(controlId)) return role;
    } else {
      for (const [subRole, subIds] of Object.entries(value as Record<string, string[]>)) {
        if ((subIds as string[]).includes(controlId)) return `${role}.${subRole}`;
      }
    }
  }
  return 'unassigned';
}

/** Move a control to a new slot in the assignment (immutable) */
function moveControlInAssignment(
  controlId: string,
  targetSlot: string,
  assignment: Record<string, string[] | Record<string, string[]>>
): Record<string, string[] | Record<string, string[]>> {
  // Deep clone
  const next = JSON.parse(JSON.stringify(assignment)) as Record<string, string[] | Record<string, string[]>>;

  // Remove from all current locations
  for (const role of Object.keys(next)) {
    const value = next[role];
    if (Array.isArray(value)) {
      next[role] = (value as string[]).filter(id => id !== controlId);
    } else {
      const nested = value as Record<string, string[]>;
      for (const subRole of Object.keys(nested)) {
        nested[subRole] = nested[subRole].filter(id => id !== controlId);
      }
    }
  }

  // Add to target slot
  if (targetSlot !== 'unassigned') {
    const parts = targetSlot.split('.');
    if (parts.length === 1) {
      const existing = next[parts[0]];
      if (Array.isArray(existing)) {
        (existing as string[]).push(controlId);
      }
    } else if (parts.length === 2) {
      const nested = next[parts[0]] as Record<string, string[]>;
      if (nested && Array.isArray(nested[parts[1]])) {
        nested[parts[1]].push(controlId);
      }
    }
  }

  return next;
}

// ─── Mini control renderer ─────────────────────────────────

function MiniControl({
  control,
  isSelected,
  onClick,
}: {
  control: ManifestControl;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const bg = TYPE_COLORS[control.type] ?? 'rgba(107, 114, 128, 0.2)';
  const border = isSelected
    ? 'rgba(59, 130, 246, 0.9)'
    : (TYPE_BORDERS[control.type] ?? 'rgba(107, 114, 128, 0.4)');
  const label = control.verbatimLabel.length > 12
    ? control.verbatimLabel.slice(0, 10) + '..'
    : control.verbatimLabel;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: bg,
        border: `${isSelected ? '2px' : '1px'} solid ${border}`,
        padding: '2px 2px',
        minHeight: '18px',
        fontSize: '6px',
        lineHeight: 1.1,
        color: isSelected ? '#ffffff' : '#d1d5db',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
        outline: isSelected ? '1px solid rgba(59,130,246,0.5)' : 'none',
        outlineOffset: '1px',
      }}
      title={`${control.verbatimLabel} (${control.id}) — ${control.type}`}
    >
      {label}
    </div>
  );
}

// ─── Section renderer within panel ──────────────────────────

function PanelSection({
  section,
  controls,
  isSelected,
  selectedControlId,
  reviewStatus,
  onClick,
  onControlClick,
  onReviewCycle,
  absoluteMode,
}: {
  section: ManifestSection;
  controls: ManifestControl[];
  isSelected: boolean;
  selectedControlId: string | null;
  reviewStatus: ReviewStatus;
  onClick: () => void;
  onControlClick: (id: string) => void;
  onReviewCycle: () => void;
  absoluteMode: boolean;
}) {
  const sectionControls = controls.filter(c => c.section === section.id);
  const assignment = section.containerAssignment;
  const archetype = section.archetype;
  const hasContainers = assignment && (archetype.includes('anchor') || archetype.includes('dual'));

  const reviewIcon = reviewStatus === 'approved'
    ? { char: '✓', color: '#34d399' }
    : reviewStatus === 'needs-fix'
      ? { char: '!', color: '#fbbf24' }
      : null;

  const inset = 0.5; // Visual breathing room — doesn't change manifest data
  const boxStyle: React.CSSProperties = absoluteMode && section.panelBoundingBox
    ? {
        position: 'absolute',
        left: `${section.panelBoundingBox.x + inset}%`,
        top: `${section.panelBoundingBox.y + inset}%`,
        width: `${Math.max(1, section.panelBoundingBox.w - inset * 2)}%`,
        height: `${Math.max(1, section.panelBoundingBox.h - inset * 2)}%`,
      }
    : {
        flex: `${section.widthPercent} 1 0%`,
        minHeight: '100px',
        minWidth: '60px',
      };

  return (
    <div
      onClick={onClick}
      style={{
        ...boxStyle,
        borderRadius: '6px',
        padding: '4px 6px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflow: 'hidden',
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(20, 20, 32, 0.8)',
        border: isSelected ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(42, 42, 58, 0.5)',
      }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ fontSize: '8px', fontWeight: 600, color: '#9ca3af' }}>
          {section.headerLabel ?? section.id}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '7px', color: '#4b5563' }}>
            {section.widthPercent}%
          </span>
          {/* Review status badge */}
          <span
            onClick={(e) => { e.stopPropagation(); onReviewCycle(); }}
            title={reviewStatus ?? 'Click to mark reviewed'}
            style={{
              fontSize: '9px',
              width: '12px',
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              cursor: 'pointer',
              border: reviewIcon ? `1px solid ${reviewIcon.color}` : '1px dashed #374151',
              color: reviewIcon?.color ?? '#374151',
              flexShrink: 0,
            }}
          >
            {reviewIcon?.char ?? ''}
          </span>
        </div>
      </div>

      {/* Controls layout */}
      {hasContainers && assignment ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {Object.entries(assignment).map(([role, value]) => {
            const isAnchor = role === 'anchor';
            const split = section.heightSplits?.[role as 'cluster' | 'anchor'];
            const isNested = value && !Array.isArray(value) && typeof value === 'object';
            const flatIds: string[] = Array.isArray(value)
              ? value
              : Object.values(value as Record<string, string[]>).flat();
            const roleControls = flatIds
              .map(id => sectionControls.find(c => c.id === id))
              .filter(Boolean) as ManifestControl[];

            return (
              <div
                key={role}
                style={{
                  flex: split ? `0 0 ${(split * 100).toFixed(0)}%` : '1',
                  borderRadius: '3px',
                  padding: '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  backgroundColor: isAnchor ? 'rgba(52, 211, 153, 0.05)' : 'rgba(96, 165, 250, 0.05)',
                  border: `1px dashed ${isAnchor ? 'rgba(52, 211, 153, 0.2)' : 'rgba(96, 165, 250, 0.2)'}`,
                }}
              >
                <span style={{ fontSize: '6px', color: '#4b5563', textTransform: 'uppercase' }}>{role}</span>
                {isNested ? (
                  <div style={{ display: 'flex', gap: '2px', flex: 1, overflow: 'hidden' }}>
                    {Object.entries(value as Record<string, string[]>).map(([subRole, subIds]) => {
                      const subControls = (subIds as string[])
                        .map(id => sectionControls.find(c => c.id === id))
                        .filter(Boolean) as ManifestControl[];
                      return (
                        <div key={subRole} style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '5px', color: '#374151', textTransform: 'uppercase' }}>{subRole}</span>
                          {subControls.map(c => (
                            <MiniControl
                              key={c.id}
                              control={c}
                              isSelected={selectedControlId === c.id}
                              onClick={(e) => { e.stopPropagation(); onControlClick(c.id); }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={
                    !isAnchor
                      ? { display: 'grid', gridTemplateColumns: `repeat(${section.gridCols ?? 2}, 1fr)`, gap: '2px' }
                      : { display: 'flex', flexDirection: 'column', gap: '2px' }
                  }>
                    {roleControls.map(c => (
                      <MiniControl
                        key={c.id}
                        control={c}
                        isSelected={selectedControlId === c.id}
                        onClick={(e) => { e.stopPropagation(); onControlClick(c.id); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : archetype === 'single-row' ? (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', flex: 1 }}>
          {sectionControls.map(c => (
            <div key={c.id} style={{ flex: 1 }}>
              <MiniControl
                control={c}
                isSelected={selectedControlId === c.id}
                onClick={(e) => { e.stopPropagation(); onControlClick(c.id); }}
              />
            </div>
          ))}
        </div>
      ) : archetype === 'grid-NxM' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${section.gridCols ?? 2}, 1fr)`,
          gap: '2px',
          flex: 1,
        }}>
          {sectionControls.map(c => (
            <MiniControl
              key={c.id}
              control={c}
              isSelected={selectedControlId === c.id}
              onClick={(e) => { e.stopPropagation(); onControlClick(c.id); }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {sectionControls.map(c => (
            <MiniControl
              key={c.id}
              control={c}
              isSelected={selectedControlId === c.id}
              onClick={(e) => { e.stopPropagation(); onControlClick(c.id); }}
            />
          ))}
        </div>
      )}

      {/* Archetype tag */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', paddingTop: '2px' }}>
        <span style={{
          fontSize: '6px',
          padding: '1px 4px',
          borderRadius: '2px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#60a5fa',
          fontFamily: 'monospace',
        }}>
          {archetype}
        </span>
      </div>
    </div>
  );
}

// ─── Properties sidebar ─────────────────────────────────────

function PropertiesPanel({
  section,
  controls,
  selectedControlId,
  onUpdate,
  onSelectControl,
  onDeleteControl,
  onAddControl,
}: {
  section: ManifestSection;
  controls: ManifestControl[];
  selectedControlId: string | null;
  onUpdate: (updates: Partial<ManifestSection>) => void;
  onSelectControl: (id: string | null) => void;
  onDeleteControl: (controlId: string) => void;
  onAddControl: (controlId: string) => void;
}) {
  const sectionControls = controls.filter(c => c.section === section.id);
  const [addControlId, setAddControlId] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddInput) addInputRef.current?.focus();
  }, [showAddInput]);

  // Build slot options for containerAssignment dropdown
  const slotOptions: string[] = ['unassigned'];
  if (section.containerAssignment) {
    const flat = flattenAssignment(section.containerAssignment);
    for (const { slot } of flat) slotOptions.push(slot);
  }

  const handleBboxChange = (key: keyof NonNullable<ManifestSection['panelBoundingBox']>, value: number) => {
    const current = section.panelBoundingBox ?? { x: 0, y: 0, w: 10, h: 10 };
    onUpdate({ panelBoundingBox: { ...current, [key]: value } });
  };

  const handleReassign = (controlId: string, targetSlot: string) => {
    if (!section.containerAssignment) return;
    const next = moveControlInAssignment(controlId, targetSlot, section.containerAssignment);
    onUpdate({ containerAssignment: next });
  };

  const handleAddControl = () => {
    const id = addControlId.trim();
    if (!id) return;
    onAddControl(id);
    setAddControlId('');
    setShowAddInput(false);
  };

  const labelStyle: React.CSSProperties = { fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', display: 'block', marginBottom: '4px' };
  const rowStyle: React.CSSProperties = { marginBottom: '10px' };

  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg, #141420)',
        border: '1px solid var(--card-border, #2a2a3a)',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground, #e0e0e0)', marginBottom: '12px' }}>
        {section.headerLabel ?? section.id}
      </h4>

      {/* Archetype */}
      <div style={rowStyle}>
        <label style={labelStyle}>Archetype</label>
        <select
          value={section.archetype}
          onChange={(e) => onUpdate({ archetype: e.target.value })}
          style={{ ...INPUT_STYLE, width: '100%', fontSize: '10px', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
        >
          {ARCHETYPE_OPTIONS.map(a => (
            <option key={a} value={a}>
              {ARCHETYPE_ICONS[a] ? `${ARCHETYPE_ICONS[a]}  ${a}` : a}
            </option>
          ))}
        </select>
      </div>

      {/* Width — updates panelBoundingBox.w in absolute mode, widthPercent in fallback */}
      <div style={rowStyle}>
        <label style={labelStyle}>Width: {section.panelBoundingBox?.w ?? section.widthPercent}%</label>
        <input
          type="range"
          min={5}
          max={80}
          value={section.panelBoundingBox?.w ?? section.widthPercent}
          onChange={(e) => {
            const w = parseInt(e.target.value);
            if (section.panelBoundingBox) {
              onUpdate({ panelBoundingBox: { ...section.panelBoundingBox, w }, widthPercent: w });
            } else {
              onUpdate({ widthPercent: w });
            }
          }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Height — only in absolute mode */}
      {section.panelBoundingBox && (
        <div style={rowStyle}>
          <label style={labelStyle}>Height: {section.panelBoundingBox.h}%</label>
          <input
            type="range"
            min={3}
            max={60}
            value={section.panelBoundingBox.h}
            onChange={(e) => {
              const h = parseInt(e.target.value);
              onUpdate({ panelBoundingBox: { ...section.panelBoundingBox!, h } });
            }}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Position X/Y — only in absolute mode */}
      {section.panelBoundingBox && (
        <div style={{ ...rowStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={labelStyle}>X: {section.panelBoundingBox.x}%</label>
            <input
              type="range"
              min={0}
              max={90}
              value={section.panelBoundingBox.x}
              onChange={(e) => onUpdate({ panelBoundingBox: { ...section.panelBoundingBox!, x: parseInt(e.target.value) } })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Y: {section.panelBoundingBox.y}%</label>
            <input
              type="range"
              min={0}
              max={90}
              value={section.panelBoundingBox.y}
              onChange={(e) => onUpdate({ panelBoundingBox: { ...section.panelBoundingBox!, y: parseInt(e.target.value) } })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Grid dimensions */}
      {(section.archetype === 'grid-NxM' || section.archetype.includes('cluster')) && (
        <div style={{ ...rowStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={labelStyle}>Rows</label>
            <input
              type="number"
              min={1}
              max={8}
              value={section.gridRows ?? 2}
              onChange={(e) => onUpdate({ gridRows: parseInt(e.target.value) })}
              style={{ ...INPUT_STYLE, width: '100%', fontSize: '10px', borderRadius: '4px', padding: '4px 8px' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Cols</label>
            <input
              type="number"
              min={1}
              max={8}
              value={section.gridCols ?? 2}
              onChange={(e) => onUpdate({ gridCols: parseInt(e.target.value) })}
              style={{ ...INPUT_STYLE, width: '100%', fontSize: '10px', borderRadius: '4px', padding: '4px 8px' }}
            />
          </div>
        </div>
      )}

      {/* Height splits */}
      {section.heightSplits && (
        <div style={rowStyle}>
          <label style={labelStyle}>
            Cluster / Anchor: {(section.heightSplits.cluster * 100).toFixed(0)}% / {(section.heightSplits.anchor * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min={10}
            max={90}
            value={Math.round(section.heightSplits.cluster * 100)}
            onChange={(e) => {
              const cluster = parseInt(e.target.value) / 100;
              const anchor = Math.max(0, 1 - cluster - (section.heightSplits?.gap ?? 0.06));
              onUpdate({ heightSplits: { cluster, anchor, gap: section.heightSplits?.gap ?? 0.06 } });
            }}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Panel Bounding Box */}
      <div style={rowStyle}>
        <label style={labelStyle}>Panel Bounding Box</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {(['x', 'y', 'w', 'h'] as const).map(key => (
            <div key={key}>
              <label style={{ ...labelStyle, fontSize: '8px', marginBottom: '2px' }}>{key} (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={section.panelBoundingBox?.[key] ?? ''}
                placeholder="—"
                onChange={(e) => handleBboxChange(key, parseFloat(e.target.value) || 0)}
                style={{ ...INPUT_STYLE, width: '100%', fontSize: '10px', borderRadius: '4px', padding: '3px 6px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls list with reassignment */}
      <div style={rowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Controls ({sectionControls.length})</label>
          <button
            onClick={() => setShowAddInput(v => !v)}
            style={{
              fontSize: '9px',
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              cursor: 'pointer',
            }}
          >
            + Add
          </button>
        </div>

        {showAddInput && (
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            <input
              ref={addInputRef}
              type="text"
              value={addControlId}
              onChange={(e) => setAddControlId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddControl(); if (e.key === 'Escape') setShowAddInput(false); }}
              placeholder="control-id"
              style={{ ...INPUT_STYLE, flex: 1, fontSize: '9px', borderRadius: '3px', padding: '3px 6px' }}
            />
            <button
              onClick={handleAddControl}
              style={{
                fontSize: '9px',
                padding: '2px 8px',
                borderRadius: '3px',
                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#34d399',
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '220px', overflowY: 'auto' }}>
          {sectionControls.map(c => {
            const isSelectedCtrl = selectedControlId === c.id;
            const currentSlot = getControlSlot(c.id, section.containerAssignment);
            return (
              <div
                key={c.id}
                onClick={() => onSelectControl(isSelectedCtrl ? null : c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  backgroundColor: isSelectedCtrl ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface, #1a1a2a)',
                  border: isSelectedCtrl ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  gap: '4px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ color: '#d1d5db', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.verbatimLabel}
                  </span>
                  <span style={{ color: '#4b5563', fontSize: '8px' }}>{c.type}</span>
                </div>

                {/* Container reassignment dropdown */}
                {section.containerAssignment && slotOptions.length > 1 && (
                  <select
                    value={currentSlot}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); handleReassign(c.id, e.target.value); }}
                    style={{
                      ...INPUT_STYLE,
                      fontSize: '8px',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      flexShrink: 0,
                      maxWidth: '80px',
                    }}
                  >
                    {slotOptions.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                )}

                {/* Delete control button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteControl(c.id); }}
                  title="Remove control from section"
                  style={{
                    fontSize: '9px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '2px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    cursor: 'pointer',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────

export default function PanelLayoutEditor({ deviceId }: PanelLayoutEditorProps) {
  const [manifest, setManifest] = useState<MasterManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Ghost overlay state
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoMode, setPhotoMode] = useState<'overlay' | 'side-by-side'>('overlay');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Review status per section
  const [reviewStatus, setReviewStatus] = useState<Record<string, ReviewStatus>>({});

  useEffect(() => {
    fetch(`/api/pipeline/${deviceId}/manifest`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(setManifest)
      .catch(e => setError(e.message));
  }, [deviceId]);

  // Fetch photo list when showPhoto is toggled on
  useEffect(() => {
    if (!showPhoto || photoUrl) return;
    setPhotoLoading(true);
    fetch(`/api/pipeline/${deviceId}/photos`)
      .then(r => r.json())
      .then((data: { photos: Array<{ name: string; path: string }> }) => {
        const list = data.photos ?? [];
        const topView = list.find(p =>
          /top.?view/i.test(p.name) || /official/i.test(p.name)
        ) ?? list[0];
        if (topView) {
          setPhotoUrl(`/api/pipeline/${deviceId}/photos?file=${encodeURIComponent(topView.name)}`);
        }
      })
      .catch(() => { /* no photos available */ })
      .finally(() => setPhotoLoading(false));
  }, [showPhoto, deviceId, photoUrl]);

  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<ManifestSection>) => {
    setManifest(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      };
    });
    setDirty(true);
  }, []);

  const handleDeleteControl = useCallback((sectionId: string, controlId: string) => {
    setManifest(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id !== sectionId) return s;
          const next: ManifestSection = {
            ...s,
            controls: s.controls.filter(id => id !== controlId),
          };
          // Remove from containerAssignment too
          if (next.containerAssignment) {
            next.containerAssignment = moveControlInAssignment(controlId, 'unassigned', next.containerAssignment);
          }
          return next;
        }),
        controls: prev.controls.filter(c => !(c.id === controlId && c.section === sectionId)),
      };
    });
    if (selectedControl === controlId) setSelectedControl(null);
    setDirty(true);
  }, [selectedControl]);

  const handleAddControl = useCallback((sectionId: string, controlId: string) => {
    setManifest(prev => {
      if (!prev) return prev;
      // Avoid duplicates within the section
      const existsInSection = prev.controls.some(c => c.id === controlId && c.section === sectionId);
      if (existsInSection) return prev;
      const newControl: ManifestControl = {
        id: controlId,
        verbatimLabel: controlId,
        type: 'button',
        section: sectionId,
      };
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, controls: [...s.controls, controlId] } : s
        ),
        controls: [...prev.controls, newControl],
      };
    });
    setDirty(true);
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!manifest) return;
    setRegenerating(true);
    try {
      await fetch(`/api/pipeline/${deviceId}/manifest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
      await fetch(`/api/pipeline/${deviceId}/regenerate-templates`, { method: 'POST' });
      setDirty(false);
    } catch (e) {
      console.error('Regenerate failed:', e);
    } finally {
      setRegenerating(false);
    }
  }, [manifest, deviceId]);

  const cycleReviewStatus = useCallback((sectionId: string) => {
    setReviewStatus(prev => {
      const current = prev[sectionId] ?? null;
      const next: ReviewStatus = current === null ? 'approved' : current === 'approved' ? 'needs-fix' : null;
      return { ...prev, [sectionId]: next };
    });
  }, []);

  const selected = manifest?.sections.find(s => s.id === selectedSection) ?? null;

  // Review progress
  const reviewedCount = manifest
    ? manifest.sections.filter(s => reviewStatus[s.id] != null).length
    : 0;
  const totalSections = manifest?.sections.length ?? 0;

  if (error) {
    return (
      <div style={{
        backgroundColor: 'var(--card-bg, #141420)',
        border: '1px solid var(--card-border, #2a2a3a)',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        color: '#6b7280',
      }}>
        Manifest not available — run the pipeline first
      </div>
    );
  }

  if (!manifest) {
    return (
      <div style={{
        backgroundColor: 'var(--card-bg, #141420)',
        border: '1px solid var(--card-border, #2a2a3a)',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        color: '#6b7280',
      }}>
        Loading panel layout...
      </div>
    );
  }

  // Whether we can use absolute spatial positioning
  const hasBoundingBoxes = manifest.sections.some(s => s.panelBoundingBox);

  // ── Build row groups for fallback (non-absolute) mode ──
  const rows: { label: string; sections: ManifestSection[] }[] = [];

  if (!hasBoundingBoxes) {
    const chunkSize = 4;
    for (let i = 0; i < manifest.sections.length; i += chunkSize) {
      const chunk = manifest.sections.slice(i, i + chunkSize);
      rows.push({ label: `Row ${Math.floor(i / chunkSize) + 1}`, sections: chunk });
    }
  } else {
    // Group by Y-position bands for labeled row display (still used for the label overlay)
    const sorted = [...manifest.sections]
      .filter(s => s.panelBoundingBox)
      .sort((a, b) => (a.panelBoundingBox?.y ?? 0) - (b.panelBoundingBox?.y ?? 0));

    let currentRow: ManifestSection[] = [];
    let currentY = sorted[0]?.panelBoundingBox?.y ?? 0;

    for (const s of sorted) {
      const sy = s.panelBoundingBox?.y ?? 0;
      if (sy - currentY > 10 && currentRow.length > 0) {
        currentRow.sort((a, b) => (a.panelBoundingBox?.x ?? 0) - (b.panelBoundingBox?.x ?? 0));
        rows.push({ label: `y=${currentY.toFixed(0)}%`, sections: currentRow });
        currentRow = [];
        currentY = sy;
      }
      currentRow.push(s);
    }
    if (currentRow.length > 0) {
      currentRow.sort((a, b) => (a.panelBoundingBox?.x ?? 0) - (b.panelBoundingBox?.x ?? 0));
      rows.push({ label: `y=${currentY.toFixed(0)}%`, sections: currentRow });
    }

    const withBoxes = new Set(sorted.map(s => s.id));
    const without = manifest.sections.filter(s => !withBoxes.has(s.id));
    if (without.length > 0) {
      rows.push({ label: 'Unpositioned', sections: without });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground, #e0e0e0)', margin: 0 }}>
            {manifest.deviceName} — Panel Layout
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>
              {manifest.sections.length} sections &middot; {manifest.controls.length} controls &middot; {manifest.layoutType}
            </span>
            {totalSections > 0 && (
              <span style={{
                fontSize: '10px',
                color: reviewedCount === totalSections ? '#34d399' : '#9ca3af',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {reviewedCount}/{totalSections} reviewed
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Show Photo toggle */}
          <button
            onClick={() => setShowPhoto(v => !v)}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '5px',
              backgroundColor: showPhoto ? 'rgba(251, 191, 36, 0.15)' : 'rgba(107, 114, 128, 0.1)',
              border: `1px solid ${showPhoto ? 'rgba(251, 191, 36, 0.4)' : 'rgba(75, 85, 99, 0.4)'}`,
              color: showPhoto ? '#fbbf24' : '#9ca3af',
              cursor: 'pointer',
            }}
          >
            {photoLoading ? 'Loading photo...' : showPhoto ? 'Hide Photo' : 'Show Photo'}
          </button>

          {showPhoto && (
            <button
              onClick={() => setPhotoMode(m => m === 'overlay' ? 'side-by-side' : 'overlay')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '5px',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(75, 85, 99, 0.4)',
                color: '#9ca3af',
                cursor: 'pointer',
              }}
            >
              {photoMode === 'overlay' ? 'Side-by-Side' : 'Overlay'}
            </button>
          )}

          {dirty && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '5px',
                fontWeight: 500,
                cursor: regenerating ? 'default' : 'pointer',
                opacity: regenerating ? 0.5 : 1,
                backgroundColor: 'var(--accent, #00aaff)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              {regenerating ? 'Regenerating...' : 'Re-generate Templates'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Side-by-side photo */}
        {showPhoto && photoUrl && photoMode === 'side-by-side' && (
          <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '2px solid #1a1a2a' }}>
            <img
              src={photoUrl}
              alt="Hardware reference"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        )}

        {/* Panel view */}
        <div
          style={{
            backgroundColor: '#0a0a14',
            border: '2px solid #1a1a2a',
            borderRadius: '12px',
            padding: '12px',
            flex: 1,
            minHeight: '300px',
          }}
        >
          {hasBoundingBoxes ? (
            // Spatial absolute-position mode
            <div>
              {/* Absolute panel canvas with fixed aspect ratio */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: (() => {
                    // Compute aspect ratio from bounding box extents
                    const bboxes = manifest.sections.map(s => s.panelBoundingBox).filter(Boolean) as Array<{x:number;y:number;w:number;h:number}>;
                    if (bboxes.length === 0) return '100%';
                    const maxY = Math.max(...bboxes.map(b => b.y + b.h));
                    const maxX = Math.max(...bboxes.map(b => b.x + b.w));
                    return `${Math.min(150, (maxY / Math.max(maxX, 1)) * 100)}%`;
                  })(),
                  overflow: 'hidden',
                  borderRadius: '6px',
                  backgroundColor: '#06060f',
                  border: '1px solid #1a1a2a',
                  marginBottom: '8px',
                }}
              >
                {/* Ghost photo overlay */}
                {showPhoto && photoUrl && photoMode === 'overlay' && (
                  <img
                    src={photoUrl}
                    alt="Hardware panel reference"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'fill',
                      opacity: 0.5,
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Sections as absolutely positioned boxes */}
                {manifest.sections
                  .filter(s => s.panelBoundingBox)
                  .map(s => (
                    <PanelSection
                      key={s.id}
                      section={s}
                      controls={manifest.controls}
                      isSelected={selectedSection === s.id}
                      selectedControlId={selectedControl}
                      reviewStatus={reviewStatus[s.id] ?? null}
                      absoluteMode={true}
                      onClick={() => {
                        setSelectedSection(selectedSection === s.id ? null : s.id);
                        setSelectedControl(null);
                      }}
                      onControlClick={(id) => setSelectedControl(selectedControl === id ? null : id)}
                      onReviewCycle={() => cycleReviewStatus(s.id)}
                    />
                  ))
                }
              </div>

              {/* Unpositioned sections below canvas */}
              {manifest.sections.filter(s => !s.panelBoundingBox).length > 0 && (
                <div>
                  <div style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#333', marginBottom: '4px', paddingLeft: '4px' }}>
                    Unpositioned
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {manifest.sections.filter(s => !s.panelBoundingBox).map(s => (
                      <PanelSection
                        key={s.id}
                        section={s}
                        controls={manifest.controls}
                        isSelected={selectedSection === s.id}
                        selectedControlId={selectedControl}
                        reviewStatus={reviewStatus[s.id] ?? null}
                        absoluteMode={false}
                        onClick={() => {
                          setSelectedSection(selectedSection === s.id ? null : s.id);
                          setSelectedControl(null);
                        }}
                        onControlClick={(id) => setSelectedControl(selectedControl === id ? null : id)}
                        onReviewCycle={() => cycleReviewStatus(s.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Row-based fallback mode
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Ghost photo overlay for row mode — shown above rows */}
              {showPhoto && photoUrl && (
                <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', overflow: 'hidden', borderRadius: '4px', marginBottom: '4px' }}>
                  <img
                    src={photoUrl}
                    alt="Hardware panel reference"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'fill',
                      opacity: 0.5,
                    }}
                  />
                </div>
              )}

              {rows.map((row) => (
                <div key={row.label}>
                  <div style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#333', marginBottom: '4px', paddingLeft: '4px' }}>
                    {row.label}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', overflow: 'hidden' }}>
                    {row.sections.map(s => (
                      <PanelSection
                        key={s.id}
                        section={s}
                        controls={manifest.controls}
                        isSelected={selectedSection === s.id}
                        selectedControlId={selectedControl}
                        reviewStatus={reviewStatus[s.id] ?? null}
                        absoluteMode={false}
                        onClick={() => {
                          setSelectedSection(selectedSection === s.id ? null : s.id);
                          setSelectedControl(null);
                        }}
                        onControlClick={(id) => setSelectedControl(selectedControl === id ? null : id)}
                        onReviewCycle={() => cycleReviewStatus(s.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Type legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', marginTop: '8px', borderTop: '1px solid #1a1a2a' }}>
            {Object.entries(TYPE_COLORS).map(([type, bg]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: bg, border: `1px solid ${TYPE_BORDERS[type]}` }} />
                <span style={{ fontSize: '7px', color: '#6b7280' }}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Properties sidebar */}
        {selected && (
          <div style={{ width: '288px', flexShrink: 0 }}>
            <PropertiesPanel
              section={selected}
              controls={manifest.controls}
              selectedControlId={selectedControl}
              onUpdate={(updates) => handleSectionUpdate(selected.id, updates)}
              onSelectControl={setSelectedControl}
              onDeleteControl={(controlId) => handleDeleteControl(selected.id, controlId)}
              onAddControl={(controlId) => handleAddControl(selected.id, controlId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
