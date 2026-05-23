'use client';

import { useState, useCallback } from 'react';
import type { InferredSection, GeometryCleanupResult } from '@/lib/layout-inference';

// ─── Available Archetypes ──────────────────────────────────────────────────

const ARCHETYPE_OPTIONS = [
  'single-row',
  'single-column',
  'grid-NxM',
  'stacked-rows',
  'transport-pair',
  'cluster-above-anchor',
  'cluster-below-anchor',
  'anchor-layout',
  'dual-column',
  'absolute',
] as const;

// ─── Component Props ───────────────────────────────────────────────────────

interface InferenceReviewProps {
  sections: InferredSection[];
  cleanupResult?: GeometryCleanupResult | null;
  onBack: () => void;
  onGenerate: (sections: InferredSection[]) => void;
}

// ─── Override Editor ───────────────────────────────────────────────────────

interface OverrideEditorProps {
  section: InferredSection;
  onSave: (updated: InferredSection) => void;
  onCancel: () => void;
}

function OverrideEditor({ section, onSave, onCancel }: OverrideEditorProps) {
  const [archetype, setArchetype] = useState(section.archetype);
  const [gap, setGap] = useState(section.parameters.gap ?? 4);
  const [padding, setPadding] = useState(section.parameters.padding ?? 0);
  const [gridCols, setGridCols] = useState(section.parameters.gridCols ?? 2);
  const [gridRows, setGridRows] = useState(section.parameters.gridRows ?? 2);

  const handleSave = useCallback(() => {
    const parameters: InferredSection['parameters'] = {
      gap,
      padding: padding || undefined,
      alignment: section.parameters.alignment,
    };
    if (archetype === 'grid-NxM') {
      parameters.gridCols = gridCols;
      parameters.gridRows = gridRows;
    }
    onSave({
      ...section,
      archetype,
      parameters,
      confidence: 1.0, // Manual override = full confidence
    });
  }, [archetype, gap, padding, gridCols, gridRows, section, onSave]);

  return (
    <div className="mt-2 rounded border border-gray-600 bg-gray-800/50 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 w-20">Archetype</label>
        <select
          value={archetype}
          onChange={(e) => setArchetype(e.target.value)}
          className="flex-1 h-7 rounded border border-gray-600 bg-gray-900 px-2 text-xs text-gray-200 outline-none focus:border-blue-500"
        >
          {ARCHETYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 w-20">Gap (px)</label>
        <input
          type="number"
          min={0}
          max={64}
          value={gap}
          onChange={(e) => setGap(Number(e.target.value))}
          className="w-20 h-7 rounded border border-gray-600 bg-gray-900 px-2 text-xs text-gray-200 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 w-20">Padding (px)</label>
        <input
          type="number"
          min={0}
          max={64}
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-20 h-7 rounded border border-gray-600 bg-gray-900 px-2 text-xs text-gray-200 outline-none focus:border-blue-500"
        />
      </div>

      {archetype === 'grid-NxM' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-20">Columns</label>
            <input
              type="number"
              min={1}
              max={12}
              value={gridCols}
              onChange={(e) => setGridCols(Number(e.target.value))}
              className="w-20 h-7 rounded border border-gray-600 bg-gray-900 px-2 text-xs text-gray-200 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-20">Rows</label>
            <input
              type="number"
              min={1}
              max={12}
              value={gridRows}
              onChange={(e) => setGridRows(Number(e.target.value))}
              className="w-20 h-7 rounded border border-gray-600 bg-gray-900 px-2 text-xs text-gray-200 outline-none focus:border-blue-500"
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs text-gray-400 rounded border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs text-blue-300 rounded border border-blue-600 bg-blue-700/20 hover:bg-blue-700/40 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── Confidence Color ──────────────────────────────────────────────────────

function confidenceColor(confidence: number): string {
  if (confidence > 0.8) return '#22c55e';
  if (confidence > 0.5) return '#f59e0b';
  return '#ef4444';
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function InferenceReview({
  sections: initialSections,
  cleanupResult,
  onBack,
  onGenerate,
}: InferenceReviewProps) {
  const [sections, setSections] = useState<InferredSection[]>(initialSections);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const handleOverride = useCallback((sectionId: string) => {
    setEditingSectionId((prev) => (prev === sectionId ? null : sectionId));
  }, []);

  const handleSaveOverride = useCallback((updated: InferredSection) => {
    setSections((prev) =>
      prev.map((s) => (s.sectionId === updated.sectionId ? updated : s))
    );
    setEditingSectionId(null);
  }, []);

  const handleCancelOverride = useCallback(() => {
    setEditingSectionId(null);
  }, []);

  const handleGenerate = useCallback(() => {
    onGenerate(sections);
  }, [sections, onGenerate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[600px] max-h-[80vh] overflow-y-auto rounded-lg bg-[#141420] border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">
          Build Review
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Geometry has been cleaned up (rows/columns snapped, sizes normalized).
          Review layout detection below, then generate.
        </p>

        {/* Geometry cleanup summary */}
        {cleanupResult && (
          <div className="mb-4 rounded border border-cyan-800/40 bg-cyan-900/10 p-3">
            <h3 className="text-xs font-medium text-cyan-400 mb-2">
              Geometry Cleanup
            </h3>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>
                {cleanupResult.sections.length} sections
              </span>
              <span>
                {cleanupResult.sections.reduce((sum, s) => sum + s.controls.length, 0)} controls cleaned
              </span>
              <span>
                {cleanupResult.canvasWidth}x{cleanupResult.canvasHeight} canvas
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sections.map((s) => (
            <div key={s.sectionId}>
              <div className="flex items-center justify-between rounded p-3 bg-gray-900/50">
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-gray-200">
                    {s.sectionId}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {s.archetype}
                    {s.parameters.gap !== undefined ? `, gap ${s.parameters.gap}px` : ''}
                    {s.parameters.gridCols !== undefined
                      ? `, ${s.parameters.gridCols}x${s.parameters.gridRows}`
                      : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs font-medium"
                    style={{ color: confidenceColor(s.confidence) }}
                  >
                    {Math.round(s.confidence * 100)}%
                  </span>
                  <button
                    onClick={() => handleOverride(s.sectionId)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      editingSectionId === s.sectionId
                        ? 'text-amber-300 bg-amber-700/20 border border-amber-600'
                        : 'text-blue-400 hover:text-blue-300 hover:bg-blue-700/10'
                    }`}
                  >
                    {editingSectionId === s.sectionId ? 'Editing...' : 'Override'}
                  </button>
                </div>
              </div>

              {editingSectionId === s.sectionId && (
                <OverrideEditor
                  section={s}
                  onSave={handleSaveOverride}
                  onCancel={handleCancelOverride}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          >
            Back to Editor
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-sm text-green-300 bg-green-700/30 border border-green-600 rounded hover:bg-green-700/50 transition-colors font-medium"
          >
            Generate Panel
          </button>
        </div>
      </div>
    </div>
  );
}
