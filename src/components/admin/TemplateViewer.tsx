'use client';

import { useState, useEffect } from 'react';

interface TemplateSpec {
  sectionId: string;
  archetype: string;
  cssArchitecture: {
    display: string;
    properties: Record<string, string>;
    childContainers?: Array<{
      role: string;
      display: string;
      properties: Record<string, string>;
    }>;
  };
  componentStructure: string;
  controlSlots: string[];
  notes: string[];
}

interface LayoutEngineOutput {
  deviceId: string;
  deviceName: string;
  generatedAt: string;
  templates: TemplateSpec[];
  panelArchitecture: {
    layoutType: string;
    sectionOrder: string[];
    sectionWidths: Record<string, string>;
    totalSections: number;
    totalControls: number;
  };
  warnings: string[];
}

interface TemplateViewerProps {
  deviceId: string;
}

export default function TemplateViewer({ deviceId }: TemplateViewerProps) {
  const [data, setData] = useState<LayoutEngineOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pipeline/${deviceId}/templates`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [deviceId]);

  if (error) {
    return (
      <div
        className="rounded-lg p-3 text-xs"
        style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)', color: '#6b7280' }}
      >
        Templates not available yet
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-lg p-3 text-xs animate-pulse"
        style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)', color: '#6b7280' }}
      >
        Loading templates...
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-wide mb-2"
        style={{ color: 'var(--foreground, #e0e0e0)' }}
      >
        Layout Engine Templates
      </h3>

      {/* Summary */}
      <div className="flex gap-3 mb-3 text-[10px]" style={{ color: '#6b7280' }}>
        <span>{data.panelArchitecture.layoutType}</span>
        <span>{data.panelArchitecture.totalSections} sections</span>
        <span>{data.panelArchitecture.totalControls} controls</span>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="mb-3 text-[10px] p-2 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
          {data.warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}

      {/* Section cards */}
      <div className="space-y-1.5">
        {data.templates.map((t) => (
          <div
            key={t.sectionId}
            className="rounded p-2 cursor-pointer transition-colors"
            style={{
              backgroundColor: expandedSection === t.sectionId ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface, #1a1a2a)',
              border: expandedSection === t.sectionId ? '1px solid #3b82f6' : '1px solid transparent',
            }}
            onClick={() => setExpandedSection(expandedSection === t.sectionId ? null : t.sectionId)}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                  {t.sectionId}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
                >
                  {t.archetype}
                </span>
              </div>
              <span className="text-[10px]" style={{ color: '#6b7280' }}>
                {t.controlSlots.length} controls
                {data.panelArchitecture.sectionWidths[t.sectionId] && (
                  <> &middot; {data.panelArchitecture.sectionWidths[t.sectionId]}</>
                )}
              </span>
            </div>

            {/* Notes */}
            {t.notes.length > 0 && (
              <div className="mt-1 text-[10px]" style={{ color: '#6b7280' }}>
                {t.notes[0]}
              </div>
            )}

            {/* Expanded view */}
            {expandedSection === t.sectionId && (
              <div className="mt-2 space-y-2">
                {/* CSS Architecture */}
                <div>
                  <div className="text-[9px] font-semibold uppercase mb-1" style={{ color: '#9ca3af' }}>CSS</div>
                  <pre
                    className="text-[10px] p-2 rounded overflow-x-auto"
                    style={{ backgroundColor: '#0d0d1a', color: '#a5b4fc' }}
                  >
                    {`display: ${t.cssArchitecture.display}\n${Object.entries(t.cssArchitecture.properties).map(([k, v]) => `${k}: ${v}`).join('\n')}`}
                    {t.cssArchitecture.childContainers?.map((c, i) => (
                      `\n\n/* ${c.role} */\ndisplay: ${c.display}\n${Object.entries(c.properties).map(([k, v]) => `${k}: ${v}`).join('\n')}`
                    )).join('') ?? ''}
                  </pre>
                </div>

                {/* Component structure */}
                <div>
                  <div className="text-[9px] font-semibold uppercase mb-1" style={{ color: '#9ca3af' }}>JSX</div>
                  <pre
                    className="text-[10px] p-2 rounded overflow-x-auto"
                    style={{ backgroundColor: '#0d0d1a', color: '#86efac' }}
                  >
                    {t.componentStructure}
                  </pre>
                </div>

                {/* Controls */}
                <div>
                  <div className="text-[9px] font-semibold uppercase mb-1" style={{ color: '#9ca3af' }}>Controls</div>
                  <div className="flex flex-wrap gap-1">
                    {t.controlSlots.map((id) => (
                      <span
                        key={id}
                        className="text-[9px] px-1 py-0.5 rounded font-mono"
                        style={{ backgroundColor: 'var(--surface, #1a1a2a)', color: '#9ca3af' }}
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
