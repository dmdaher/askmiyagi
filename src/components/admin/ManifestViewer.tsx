'use client';

import { useState, useEffect } from 'react';

interface ManifestControl {
  id: string;
  verbatimLabel: string;
  type: string;
  section: string;
  functionalGroup: string;
}

interface ManifestSection {
  id: string;
  headerLabel: string | null;
  archetype: string;
  controls: string[];
  widthPercent: number;
  complexity: string;
  gridRows?: number;
  gridCols?: number;
  heightSplits?: { cluster: number; anchor: number; gap: number };
}

interface MasterManifest {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  layoutType: string;
  densityTargets: { vertical: string; horizontal: string; horizontalDeadSpaceMax: number };
  sections: ManifestSection[];
  controls: ManifestControl[];
  sharedElements: Array<{ id: string; spans: string[]; expectedInstanceCount: number }>;
  alignmentAnchors: Array<{ sourceId: string; targetId: string; axis: string }>;
}

interface ManifestViewerProps {
  deviceId: string;
}

export default function ManifestViewer({ deviceId }: ManifestViewerProps) {
  const [data, setData] = useState<MasterManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pipeline/${deviceId}/manifest`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [deviceId]);

  if (error) {
    return (
      <div className="rounded-lg p-4 text-xs" style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)', color: '#6b7280' }}>
        Manifest not available yet
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg p-4 text-xs animate-pulse" style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)', color: '#6b7280' }}>
        Loading manifest...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground, #e0e0e0)' }}>
            {data.deviceName}
          </h3>
          <span className="text-[10px]" style={{ color: '#6b7280' }}>{data.manufacturer}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded p-2" style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}>
            <div className="text-lg font-bold" style={{ color: '#60a5fa' }}>{data.sections.length}</div>
            <div className="text-[10px]" style={{ color: '#6b7280' }}>Sections</div>
          </div>
          <div className="rounded p-2" style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}>
            <div className="text-lg font-bold" style={{ color: '#34d399' }}>{data.controls.length}</div>
            <div className="text-[10px]" style={{ color: '#6b7280' }}>Controls</div>
          </div>
          <div className="rounded p-2" style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}>
            <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>{data.layoutType}</div>
            <div className="text-[10px]" style={{ color: '#6b7280' }}>Layout</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--foreground, #e0e0e0)' }}>
          Sections
        </h3>
        <div className="space-y-2">
          {data.sections.map((s) => {
            const sectionControls = data.controls.filter((c) => c.section === s.id);
            const isExpanded = expandedSection === s.id;
            return (
              <div
                key={s.id}
                className="rounded p-3 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isExpanded ? 'rgba(59, 130, 246, 0.08)' : 'var(--surface, #1a1a2a)',
                  border: isExpanded ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                }}
                onClick={() => setExpandedSection(isExpanded ? null : s.id)}
              >
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                      {s.headerLabel ?? s.id}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                      {s.archetype}
                    </span>
                    {s.complexity === 'HIGH' && (
                      <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                        HIGH
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: '#6b7280' }}>
                    <span>{s.controls.length} controls</span>
                    <span>{s.widthPercent}%</span>
                    {s.gridRows && s.gridCols && <span>{s.gridRows}x{s.gridCols}</span>}
                  </div>
                </div>

                {/* Height splits */}
                {s.heightSplits && (
                  <div className="mt-1.5 flex gap-1 h-2 rounded overflow-hidden">
                    <div
                      className="rounded-sm"
                      style={{ flex: s.heightSplits.cluster, backgroundColor: 'rgba(96, 165, 250, 0.4)' }}
                      title={`Cluster: ${(s.heightSplits.cluster * 100).toFixed(0)}%`}
                    />
                    <div
                      className="rounded-sm"
                      style={{ flex: s.heightSplits.gap, backgroundColor: 'rgba(107, 114, 128, 0.2)' }}
                    />
                    <div
                      className="rounded-sm"
                      style={{ flex: s.heightSplits.anchor, backgroundColor: 'rgba(52, 211, 153, 0.4)' }}
                      title={`Anchor: ${(s.heightSplits.anchor * 100).toFixed(0)}%`}
                    />
                  </div>
                )}

                {/* Expanded: controls list */}
                {isExpanded && (
                  <div className="mt-3 space-y-1">
                    {sectionControls.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'var(--card-bg, #141420)' }}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono" style={{ color: '#9ca3af' }}>{c.id}</span>
                          <span style={{ color: 'var(--foreground, #e0e0e0)' }}>{c.verbatimLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--surface, #1a1a2a)', color: '#6b7280' }}>{c.type}</span>
                          <span style={{ color: '#4b5563' }}>{c.functionalGroup}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Density targets */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--foreground, #e0e0e0)' }}>
          Density Targets
        </h3>
        <div className="space-y-1 text-[11px]" style={{ color: '#9ca3af' }}>
          <div>Vertical: {data.densityTargets.vertical}</div>
          <div>Horizontal: {data.densityTargets.horizontal}</div>
          <div>Max dead space: {data.densityTargets.horizontalDeadSpaceMax}%</div>
        </div>
      </div>
    </div>
  );
}
