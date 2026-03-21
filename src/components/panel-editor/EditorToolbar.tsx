'use client';

import { useEditorStore } from './store';
import type { SnapGrid } from './store';

const SNAP_OPTIONS: SnapGrid[] = [4, 8, 16, 32];
const ZOOM_STEP = 0.1;

interface EditorToolbarProps {
  previewMode: boolean;
  buildStatus: 'idle' | 'building' | 'approved';
  onApproveAndBuild: () => void;
}

export default function EditorToolbar({
  previewMode,
  buildStatus,
  onApproveAndBuild,
}: EditorToolbarProps) {
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showPhoto = useEditorStore((s) => s.showPhoto);
  const photoMode = useEditorStore((s) => s.photoMode);
  const photoOpacity = useEditorStore((s) => s.photoOpacity);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);

  const setZoom = useEditorStore((s) => s.setZoom);
  const setSnapGrid = useEditorStore((s) => s.setSnapGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const togglePhoto = useEditorStore((s) => s.togglePhoto);
  const setPhotoMode = useEditorStore((s) => s.setPhotoMode);
  const setPhotoOpacity = useEditorStore((s) => s.setPhotoOpacity);
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
          title="Snap Grid Size"
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
          title="Zoom Out (Cmd+-)"
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
          title="Zoom In (Cmd+=)"
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="ml-1 flex h-6 items-center rounded px-1.5 text-[10px] text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          title="Reset Zoom"
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
          title="Undo (Cmd+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="flex h-6 items-center rounded px-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Cmd+Shift+Z)"
        >
          Redo
        </button>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-gray-800" />

      {/* Grid Toggle */}
      <button
        onClick={toggleGrid}
        className={`flex h-6 items-center gap-1 rounded px-2 text-xs transition-colors ${
          showGrid
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
        }`}
        title="Toggle Grid (G)"
      >
        <span className="text-[10px]">Grid</span>
      </button>

      {/* Photo Overlay Toggle + Opacity */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={togglePhoto}
          className={`flex h-6 items-center gap-1 rounded px-2 text-xs transition-colors ${
            showPhoto
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
          }`}
          title="Toggle Photo Overlay (P)"
        >
          <span className="text-[10px]">Photo</span>
        </button>
        {showPhoto && (
          <>
            <div className="flex rounded overflow-hidden border border-gray-700">
              <button
                onClick={() => setPhotoMode('side-by-side')}
                className={`px-1.5 py-0.5 text-[9px] ${
                  photoMode === 'side-by-side'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-900 text-gray-500 hover:text-gray-300'
                }`}
                title="Side-by-side view"
              >
                Side
              </button>
              <button
                onClick={() => setPhotoMode('overlay')}
                className={`px-1.5 py-0.5 text-[9px] ${
                  photoMode === 'overlay'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-900 text-gray-500 hover:text-gray-300'
                }`}
                title="Overlay on canvas"
              >
                Over
              </button>
            </div>
            {photoMode === 'overlay' && (
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(photoOpacity * 100)}
                onChange={(e) => setPhotoOpacity(Number(e.target.value) / 100)}
                className="h-1 w-16 cursor-pointer accent-blue-500"
                title={`Photo Opacity: ${Math.round(photoOpacity * 100)}%`}
              />
            )}
          </>
        )}
      </div>

      {/* Spacer to push Approve button to the right */}
      <div className="flex-1" />

      {/* Approve & Build */}
      <button
        onClick={onApproveAndBuild}
        disabled={previewMode || buildStatus === 'building'}
        className={`flex h-7 items-center rounded px-3 text-xs font-medium transition-colors ${
          previewMode
            ? 'border border-green-700 bg-green-700/20 text-green-400 cursor-default'
            : buildStatus === 'building'
              ? 'border border-gray-600 bg-gray-800 text-gray-400 cursor-wait'
              : 'border border-green-600 bg-green-700/30 text-green-300 hover:bg-green-700/50'
        }`}
        title="Approve & Build Panel"
      >
        {buildStatus === 'building'
          ? 'Building panel...'
          : previewMode
            ? 'In Preview'
            : 'Approve & Build'}
      </button>
    </div>
  );
}
