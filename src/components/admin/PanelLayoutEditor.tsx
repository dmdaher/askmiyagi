'use client';

import { useState, useEffect, useCallback } from 'react';

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
  containerAssignment?: Record<string, string[]>;
  heightSplits?: { cluster: number; anchor: number; gap: number };
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
  containerAssignment?: Record<string, string[]>;
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

// ─── Constants ──────────────────────────────────────────────

const ARCHETYPE_OPTIONS = [
  'grid-NxM', 'single-column', 'single-row', 'anchor-layout',
  'cluster-above-anchor', 'cluster-below-anchor', 'dual-column', 'stacked-rows',
];

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

// ─── Mini control renderer ─────────────────────────────────

function MiniControl({ control }: { control: ManifestControl }) {
  const bg = TYPE_COLORS[control.type] ?? 'rgba(107, 114, 128, 0.2)';
  const border = TYPE_BORDERS[control.type] ?? 'rgba(107, 114, 128, 0.4)';
  const label = control.verbatimLabel.length > 12
    ? control.verbatimLabel.slice(0, 10) + '..'
    : control.verbatimLabel;

  return (
    <div
      className="rounded flex items-center justify-center text-center"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        padding: '2px 3px',
        minHeight: '20px',
        fontSize: '7px',
        lineHeight: 1.1,
        color: '#d1d5db',
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
  onClick,
}: {
  section: ManifestSection;
  controls: ManifestControl[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const sectionControls = controls.filter(c => c.section === section.id);
  const assignment = section.containerAssignment;
  const archetype = section.archetype;

  // Determine if this is a multi-container archetype
  const hasContainers = assignment && (archetype.includes('anchor') || archetype.includes('dual'));

  return (
    <div
      className="rounded-lg p-1.5 cursor-pointer transition-all flex flex-col gap-0.5 overflow-hidden"
      style={{
        flex: `0 0 ${section.widthPercent}%`,
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(20, 20, 32, 0.8)',
        border: isSelected ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(42, 42, 58, 0.5)',
        minHeight: '100px',
      }}
      onClick={onClick}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-0.5 mb-0.5">
        <span style={{ fontSize: '8px', fontWeight: 600, color: '#9ca3af' }}>
          {section.headerLabel ?? section.id}
        </span>
        <span style={{ fontSize: '7px', color: '#4b5563' }}>
          {section.widthPercent}%
        </span>
      </div>

      {/* Controls layout */}
      {hasContainers && assignment ? (
        // Multi-container: show cluster and anchor zones
        <div className="flex flex-col gap-0.5 flex-1">
          {Object.entries(assignment).map(([role, ids]) => {
            const roleControls = ids.map(id => sectionControls.find(c => c.id === id)).filter(Boolean) as ManifestControl[];
            const isAnchor = role === 'anchor';
            const split = section.heightSplits?.[role as 'cluster' | 'anchor'];

            return (
              <div
                key={role}
                className="rounded p-0.5 flex flex-col gap-0.5"
                style={{
                  flex: split ? `0 0 ${(split * 100).toFixed(0)}%` : '1',
                  backgroundColor: isAnchor ? 'rgba(52, 211, 153, 0.05)' : 'rgba(96, 165, 250, 0.05)',
                  border: `1px dashed ${isAnchor ? 'rgba(52, 211, 153, 0.2)' : 'rgba(96, 165, 250, 0.2)'}`,
                }}
              >
                <span style={{ fontSize: '6px', color: '#4b5563', textTransform: 'uppercase' }}>{role}</span>
                <div className={isAnchor ? 'flex flex-col gap-0.5' : 'grid gap-0.5'} style={
                  !isAnchor ? { gridTemplateColumns: `repeat(${section.gridCols ?? 2}, 1fr)` } : {}
                }>
                  {roleControls.map(c => <MiniControl key={c.id} control={c} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : archetype === 'single-row' ? (
        <div className="flex flex-row gap-0.5 flex-1">
          {sectionControls.map(c => (
            <div key={c.id} className="flex-1"><MiniControl control={c} /></div>
          ))}
        </div>
      ) : archetype === 'grid-NxM' ? (
        <div className="gap-0.5 flex-1" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${section.gridCols ?? 2}, 1fr)`,
        }}>
          {sectionControls.map(c => <MiniControl key={c.id} control={c} />)}
        </div>
      ) : (
        // Default: vertical stack
        <div className="flex flex-col gap-0.5 flex-1">
          {sectionControls.map(c => <MiniControl key={c.id} control={c} />)}
        </div>
      )}

      {/* Archetype tag */}
      <div className="flex justify-center mt-auto pt-0.5">
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
  onUpdate,
}: {
  section: ManifestSection;
  controls: ManifestControl[];
  onUpdate: (updates: Partial<ManifestSection>) => void;
}) {
  const sectionControls = controls.filter(c => c.section === section.id);

  return (
    <div
      className="rounded-lg p-3 space-y-3"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <h4 className="text-xs font-semibold" style={{ color: 'var(--foreground, #e0e0e0)' }}>
        {section.headerLabel ?? section.id}
      </h4>

      {/* Archetype */}
      <div>
        <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: '#6b7280' }}>Archetype</label>
        <select
          value={section.archetype}
          onChange={(e) => onUpdate({ archetype: e.target.value as ManifestSection['archetype'] })}
          className="w-full text-[10px] rounded px-2 py-1 cursor-pointer"
          style={{
            backgroundColor: 'var(--surface, #1a1a2a)',
            color: 'var(--foreground, #e0e0e0)',
            border: '1px solid var(--card-border, #2a2a3a)',
          }}
        >
          {ARCHETYPE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Width */}
      <div>
        <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: '#6b7280' }}>
          Width: {section.widthPercent}%
        </label>
        <input
          type="range"
          min={5}
          max={70}
          value={section.widthPercent}
          onChange={(e) => onUpdate({ widthPercent: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Grid dimensions (for grid archetypes) */}
      {(section.archetype === 'grid-NxM' || section.archetype.includes('cluster')) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: '#6b7280' }}>Rows</label>
            <input
              type="number"
              min={1}
              max={8}
              value={section.gridRows ?? 2}
              onChange={(e) => onUpdate({ gridRows: parseInt(e.target.value) })}
              className="w-full text-[10px] rounded px-2 py-1"
              style={{
                backgroundColor: 'var(--surface, #1a1a2a)',
                color: 'var(--foreground, #e0e0e0)',
                border: '1px solid var(--card-border, #2a2a3a)',
              }}
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: '#6b7280' }}>Cols</label>
            <input
              type="number"
              min={1}
              max={8}
              value={section.gridCols ?? 2}
              onChange={(e) => onUpdate({ gridCols: parseInt(e.target.value) })}
              className="w-full text-[10px] rounded px-2 py-1"
              style={{
                backgroundColor: 'var(--surface, #1a1a2a)',
                color: 'var(--foreground, #e0e0e0)',
                border: '1px solid var(--card-border, #2a2a3a)',
              }}
            />
          </div>
        </div>
      )}

      {/* Height splits (for anchor archetypes) */}
      {section.heightSplits && (
        <div>
          <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: '#6b7280' }}>
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
            className="w-full"
          />
        </div>
      )}

      {/* Controls list */}
      <div>
        <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: '#6b7280' }}>
          Controls ({sectionControls.length})
        </label>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {sectionControls.map(c => (
            <div key={c.id} className="flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}>
              <span style={{ color: '#d1d5db' }}>{c.verbatimLabel}</span>
              <span style={{ color: '#4b5563' }}>{c.type}</span>
            </div>
          ))}
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
  const [dirty, setDirty] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/pipeline/${deviceId}/manifest`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(setManifest)
      .catch(e => setError(e.message));
  }, [deviceId]);

  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<ManifestSection>) => {
    if (!manifest) return;
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
  }, [manifest]);

  const handleRegenerate = useCallback(async () => {
    if (!manifest) return;
    setRegenerating(true);
    try {
      // Save manifest
      await fetch(`/api/pipeline/${deviceId}/manifest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
      // Re-run layout engine
      await fetch(`/api/pipeline/${deviceId}/regenerate-templates`, { method: 'POST' });
      setDirty(false);
    } catch (e) {
      console.error('Regenerate failed:', e);
    } finally {
      setRegenerating(false);
    }
  }, [manifest, deviceId]);

  const selected = manifest?.sections.find(s => s.id === selectedSection) ?? null;

  if (error) {
    return (
      <div className="rounded-lg p-4 text-xs" style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)', color: '#6b7280' }}>
        Manifest not available — run the pipeline first
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="rounded-lg p-4 text-xs animate-pulse" style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)', color: '#6b7280' }}>
        Loading panel layout...
      </div>
    );
  }

  // Group sections by vertical zone (approximate: top 0-35%, mid 35-55%, bottom 55-100%)
  // This is a simplified layout — a proper implementation would use Parser's vertical zones
  const topSections = manifest.sections.filter(s =>
    ['navigation-bar'].includes(s.id)
  );
  const upperSections = manifest.sections.filter(s =>
    ['media-inputs', 'touch-display', 'browse-navigation', 'mode-buttons'].includes(s.id)
  );
  const midSections = manifest.sections.filter(s =>
    ['loop-section', 'hot-cue', 'performance-right'].includes(s.id)
  );
  const bottomSections = manifest.sections.filter(s =>
    ['transport', 'jog-wheel', 'jog-controls-sync', 'tempo-section'].includes(s.id)
  );
  // Fallback: sections not in any zone
  const allZoned = new Set([...topSections, ...upperSections, ...midSections, ...bottomSections].map(s => s.id));
  const unzoned = manifest.sections.filter(s => !allZoned.has(s.id));

  const rows = [
    { label: 'Top', sections: topSections },
    { label: 'Upper', sections: upperSections },
    { label: 'Middle', sections: midSections },
    { label: 'Bottom', sections: bottomSections },
    ...(unzoned.length > 0 ? [{ label: 'Other', sections: unzoned }] : []),
  ].filter(r => r.sections.length > 0);

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground, #e0e0e0)' }}>
            {manifest.deviceName} — Panel Layout
          </h3>
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            {manifest.sections.length} sections &middot; {manifest.controls.length} controls &middot; {manifest.layoutType}
          </span>
        </div>
        {dirty && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="text-xs px-3 py-1.5 rounded font-medium cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent, #00aaff)', color: '#ffffff' }}
          >
            {regenerating ? 'Regenerating...' : 'Re-generate Templates'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Panel view — 3 cols */}
        <div className="lg:col-span-3">
          <div
            className="rounded-xl p-3 space-y-2"
            style={{
              backgroundColor: '#0a0a14',
              border: '2px solid #1a1a2a',
              minHeight: '400px',
            }}
          >
            {rows.map((row) => (
              <div key={row.label}>
                <div className="text-[7px] uppercase tracking-widest mb-1 px-1" style={{ color: '#333' }}>
                  {row.label}
                </div>
                <div className="flex gap-1.5">
                  {row.sections.map(s => (
                    <PanelSection
                      key={s.id}
                      section={s}
                      controls={manifest.controls}
                      isSelected={selectedSection === s.id}
                      onClick={() => setSelectedSection(selectedSection === s.id ? null : s.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties sidebar — 1 col */}
        <div className="lg:col-span-1">
          {selected ? (
            <PropertiesPanel
              section={selected}
              controls={manifest.controls}
              onUpdate={(updates) => handleSectionUpdate(selected.id, updates)}
            />
          ) : (
            <div
              className="rounded-lg p-4 text-center text-xs"
              style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)', color: '#4b5563' }}
            >
              Click a section to edit its properties
            </div>
          )}

          {/* Type legend */}
          <div
            className="rounded-lg p-3 mt-3"
            style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
          >
            <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>Control Types</div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(TYPE_COLORS).map(([type, bg]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: bg, border: `1px solid ${TYPE_BORDERS[type]}` }} />
                  <span style={{ fontSize: '8px', color: '#9ca3af' }}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
