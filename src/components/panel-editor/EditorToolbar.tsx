'use client';

import { useEditorStore } from './store';
import type { SnapGrid } from './store';

const SNAP_OPTIONS: SnapGrid[] = [4, 8, 16, 32];
const ZOOM_STEP = 0.1;

export default function EditorToolbar() {
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showPhoto = useEditorStore((s) => s.showPhoto);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);

  const setZoom = useEditorStore((s) => s.setZoom);
  const setSnapGrid = useEditorStore((s) => s.setSnapGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const togglePhoto = useEditorStore((s) => s.togglePhoto);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex h-10 items-center gap-3 border-b border-gray-800 bg-[#0d0d1a] px-3">
      {/* Snap Grid Selector */}
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] uppercase tracking-wider text-gray-500">
          Snap
        </label>
        <select
          value={snapGrid}
          onChange={(e) => setSnapGrid(Number(e.target.value) as SnapGrid)}
          className="h-6 rounded border border-gray-700 bg-gray-900 px-1.5 text-xs text-gray-300 outline-none focus:border-blue-500"
        >
          {SNAP_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}px
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-gray-800" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoom(zoom - ZOOM_STEP)}
          disabled={zoom <= 0.1}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom out"
        >
          -
        </button>
        <span className="w-10 text-center text-xs text-gray-400">
          {zoomPercent}%
        </span>
        <button
          onClick={() => setZoom(zoom + ZOOM_STEP)}
          disabled={zoom >= 5}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="ml-1 flex h-6 items-center rounded px-1.5 text-[10px] text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          title="Reset zoom"
        >
          Reset
        </button>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-gray-800" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="flex h-6 items-center rounded px-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="flex h-6 items-center rounded px-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo"
        >
          Redo
        </button>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-gray-800" />

      {/* Grid Toggle */}
      <button
        onClick={toggleGrid}
        className={`flex h-6 items-center rounded px-2 text-xs transition-colors ${
          showGrid
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
        }`}
        title="Toggle grid (G)"
      >
        G
      </button>

      {/* Photo Toggle */}
      <button
        onClick={togglePhoto}
        className={`flex h-6 items-center rounded px-2 text-xs transition-colors ${
          showPhoto
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
        }`}
        title="Toggle photo overlay (P)"
      >
        P
      </button>
    </div>
  );
}
