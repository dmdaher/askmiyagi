'use client';

import { useEditorStore } from './store';
import type { SnapGrid } from './store';
import VersionHistoryDropdown from './VersionHistoryDropdown';

const SNAP_OPTIONS: SnapGrid[] = [1, 2, 4, 8, 16, 32];
const ZOOM_STEP = 0.1;

interface EditorToolbarProps {
  deviceId: string;
  previewMode: boolean;
  buildStatus: 'idle' | 'building' | 'approved';
  onApproveAndBuild: () => void;
  onCleanUp: () => void;
  onReportIssue?: () => void;
  onRestoreVersion?: () => void;
}

export default function EditorToolbar({
  deviceId,
  previewMode,
  buildStatus,
  onApproveAndBuild,
  onCleanUp,
  onReportIssue,
  onRestoreVersion,
}: EditorToolbarProps) {
  const manufacturer = useEditorStore((s) => s.manufacturer);
  const deviceName = useEditorStore((s) => s.deviceName);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showPhoto = useEditorStore((s) => s.showPhoto);
  const photoMode = useEditorStore((s) => s.photoMode);
  const photoOpacity = useEditorStore((s) => s.photoOpacity);
  const controlScale = useEditorStore((s) => s.controlScale);
  const showLabels = useEditorStore((s) => s.showLabels);
  const toggleLabels = useEditorStore((s) => s.toggleLabels);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);

  const setZoom = useEditorStore((s) => s.setZoom);
  const setSnapGrid = useEditorStore((s) => s.setSnapGrid);
  const setControlScale = useEditorStore((s) => s.setControlScale);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const togglePhoto = useEditorStore((s) => s.togglePhoto);
  const setPhotoMode = useEditorStore((s) => s.setPhotoMode);
  const setPhotoOpacity = useEditorStore((s) => s.setPhotoOpacity);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const cleanupGap = useEditorStore((s) => s.cleanupGap);
  const setCleanupGap = useEditorStore((s) => s.setCleanupGap);
  const panelScale = useEditorStore((s) => s.panelScale);
  const setPanelScale = useEditorStore((s) => s.setPanelScale);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setAllLabelFontSize = useEditorStore((s) => s.setAllLabelFontSize);
  const resetAllSizes = useEditorStore((s) => s.resetAllSizes);

  const zoomPercent = Math.round(zoom * 100);

  // Shared styles
  const toggleBtn = (active: boolean) =>
    `flex h-6 items-center rounded px-1.5 text-[10px] transition-colors whitespace-nowrap ${
      active
        ? 'bg-blue-500/20 text-blue-400'
        : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
    }`;
  const iconBtn =
    'flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30';
  const divider = <div className="h-5 w-px bg-gray-800 flex-shrink-0" />;

  return (
    <div className="flex h-10 items-center gap-1 border-b border-gray-800 bg-[#0d0d1a] px-2">

      {/* ── LEFT: Device + View ────────────────────────────────── */}

      {/* Device name */}
      {deviceName && (
        <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-0.5 flex-shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
            {manufacturer}
          </span>
          <span className="text-[10px] font-semibold text-gray-300 whitespace-nowrap">
            {deviceName}
          </span>
        </div>
      )}

      {/* Undo / Redo */}
      <button onClick={undo} disabled={past.length === 0} className={iconBtn} title="Undo (Cmd+Z)">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 2L1 5.5 4.5 9V6.5C8.5 6.5 11 8 12.5 11c-1-3.5-3.5-6-8-6.5V2z" /></svg>
      </button>
      <button onClick={redo} disabled={future.length === 0} className={iconBtn} title="Redo (Cmd+Shift+Z)">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 2L15 5.5 11.5 9V6.5C7.5 6.5 5 8 3.5 11c1-3.5 3.5-6 8-6.5V2z" /></svg>
      </button>

      {divider}

      {/* Snap */}
      <select
        value={snapGrid}
        onChange={(e) => setSnapGrid(Number(e.target.value) as SnapGrid)}
        className="h-6 rounded border border-gray-700 bg-gray-900 px-1 text-[10px] text-gray-300 outline-none"
        title="Snap Grid"
      >
        {SNAP_OPTIONS.map((v) => (
          <option key={v} value={v}>{v}px</option>
        ))}
      </select>

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <button onClick={() => setZoom(zoom - ZOOM_STEP)} disabled={zoom <= 0.1} className={iconBtn} title="Zoom Out">-</button>
        <span className="w-8 text-center text-[10px] text-gray-400">{zoomPercent}%</span>
        <button onClick={() => setZoom(zoom + ZOOM_STEP)} disabled={zoom >= 5} className={iconBtn} title="Zoom In">+</button>
      </div>

      {/* Scale */}
      <div className="flex items-center gap-0.5" data-tutorial="scale">
        <input
          type="range" min={30} max={100} step={10}
          value={Math.round(controlScale * 100)}
          onChange={(e) => setControlScale(Number(e.target.value) / 100)}
          className="h-1 w-12 cursor-pointer accent-blue-500"
          title="Control Scale ([ / ])"
        />
        <span className="w-6 text-center text-[9px] text-gray-500">{Math.round(controlScale * 100)}%</span>
      </div>

      {divider}

      {/* ── MIDDLE: Overlays ───────────────────────────────────── */}

      <button data-tutorial="grid" onClick={toggleGrid} className={toggleBtn(showGrid)} title="Grid (G)">Grid</button>

      <button onClick={toggleLabels} className={toggleBtn(showLabels)} title="Labels (T)">Labels</button>

      {/* Label size (only when labels visible) */}
      {showLabels && (
        <select
          value=""
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            pushSnapshot();
            setAllLabelFontSize(val === 'auto' ? undefined : Number(val));
          }}
          className="h-6 rounded border border-gray-700 bg-gray-900 px-0.5 text-[9px] text-gray-400 outline-none"
          title="Set all label sizes"
        >
          <option value="">Sz</option>
          <option value="auto">Auto</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="10">10</option>
        </select>
      )}

      {/* Photo */}
      <div className="flex items-center gap-1" data-tutorial="photo">
        <button onClick={togglePhoto} className={toggleBtn(showPhoto)} title="Photo (P)">Photo</button>
        {showPhoto && (
          <>
            <div className="flex rounded overflow-hidden border border-gray-700">
              <button
                onClick={() => setPhotoMode('side-by-side')}
                className={`px-1 py-0.5 text-[8px] ${photoMode === 'side-by-side' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-900 text-gray-500'}`}
              >Side</button>
              <button
                onClick={() => setPhotoMode('overlay')}
                className={`px-1 py-0.5 text-[8px] ${photoMode === 'overlay' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-900 text-gray-500'}`}
              >Over</button>
            </div>
            {photoMode === 'overlay' && (
              <input
                type="range" min={0} max={100}
                value={Math.round(photoOpacity * 100)}
                onChange={(e) => setPhotoOpacity(Number(e.target.value) / 100)}
                className="h-1 w-12 cursor-pointer accent-blue-500"
                title={`Opacity: ${Math.round(photoOpacity * 100)}%`}
              />
            )}
          </>
        )}
      </div>

      {/* ── SPACER ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-2" />

      {/* ── RIGHT: Actions ─────────────────────────────────────── */}

      {/* History + Report + Help */}
      <VersionHistoryDropdown deviceId={deviceId} onRestore={onRestoreVersion} />

      {onReportIssue && (
        <button onClick={onReportIssue} className={iconBtn} title="Report Issue" data-tutorial="report">
          <span className="text-[10px]">⚑</span>
        </button>
      )}

      <button
        onClick={() => window.dispatchEvent(new Event('editor-tutorial-replay'))}
        className={iconBtn}
        title="Help"
      >?</button>

      {/* Reset Sizes */}
      <button
        onClick={() => { pushSnapshot(); resetAllSizes(); }}
        disabled={previewMode}
        className="flex h-6 items-center rounded px-1.5 text-[9px] text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 disabled:opacity-30 whitespace-nowrap"
        title="Reset all controls to default sizes (undoable)"
      >Reset Sizes</button>

      {divider}

      {/* Gap + Clean Up */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <label className="text-[9px] text-gray-500">Gap</label>
        <input
          type="number" min={0} max={32}
          value={cleanupGap}
          onChange={(e) => setCleanupGap(Number(e.target.value))}
          className="h-6 w-8 rounded border border-gray-700 bg-gray-900 px-1 text-[10px] text-gray-300 outline-none focus:border-blue-500"
          title="Gap px (used by Clean Up)"
        />
        <button
          onClick={onCleanUp}
          disabled={previewMode || buildStatus === 'building'}
          className="flex h-7 items-center rounded px-2 text-[10px] font-medium whitespace-nowrap transition-colors border border-blue-600 bg-blue-700/30 text-blue-300 hover:bg-blue-700/50 disabled:opacity-30"
          title="Clean Up — snap rows, equalize spacing (Cmd+Z to undo)"
        >Clean Up</button>
      </div>

      {divider}

      {/* Panel Scale + Approve & Build */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <label className="text-[9px] text-gray-500">Panel</label>
        <input
          type="range" min={50} max={200} step={10}
          value={Math.round(panelScale * 100)}
          onChange={(e) => setPanelScale(Number(e.target.value) / 100)}
          className="h-1 w-10 cursor-pointer accent-blue-500"
          title={`Panel Scale: ${Math.round(panelScale * 100)}%`}
        />
        <span className="text-[9px] text-gray-500 w-6">{Math.round(panelScale * 100)}%</span>
        <button
          data-tutorial="approve"
          onClick={onApproveAndBuild}
          disabled={previewMode || buildStatus === 'building'}
          className={`flex h-7 items-center rounded px-2 text-[10px] font-medium whitespace-nowrap transition-colors ${
            previewMode
              ? 'border border-green-700 bg-green-700/20 text-green-400 cursor-default'
              : buildStatus === 'building'
                ? 'border border-gray-600 bg-gray-800 text-gray-400 cursor-wait'
                : 'border border-green-600 bg-green-700/30 text-green-300 hover:bg-green-700/50'
          }`}
          title="Approve & Build Panel"
        >
          {buildStatus === 'building'
            ? 'Building...'
            : previewMode
              ? 'Preview'
              : 'Approve & Build'}
        </button>
      </div>
    </div>
  );
}
