'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from './store';
import type { SnapGrid } from './store';
import VersionHistoryDropdown from './VersionHistoryDropdown';
import ScaleContentsModal from './ScaleContentsModal';
import { isHosted } from '@/lib/env';
import { buildSavePayload } from './hooks/useAutoSave';

const SNAP_OPTIONS: SnapGrid[] = [1, 2, 4, 8, 16, 32];

/** Submit for Review button with note modal */
function SubmitForReviewButton({ deviceId, disabled }: { deviceId: string; disabled: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Flush current editor state to Blob BEFORE changing status.
      // Prevents race where submit fires before the auto-save debounce.
      //
      // Intentionally does NOT pass ?backup=force — the submit checkpoint
      // backup is created by the PATCH status handler with source='submit'.
      // Forcing a backup here would create two entries per submit action.
      const flushRes = await fetch(`/api/hosted/panels/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSavePayload()),
      });
      if (flushRes.status === 409) {
        alert('Another session has newer changes. Please reload the page.');
        setSubmitting(false);
        return;
      }

      const statusRes = await fetch(`/api/hosted/panels/${deviceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted', contractorNote: note.trim() || undefined }),
      });
      if (!statusRes.ok) throw new Error('Submit failed');
      setSubmitted(true);
      setShowModal(false);
      // Auto-clear the submitted badge after 3 seconds so they can re-submit
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      alert('Failed to submit — please try again.');
    }
    setSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled || submitted}
        className={`flex h-7 items-center rounded px-3 text-[10px] font-medium whitespace-nowrap transition-colors ${
          submitted
            ? 'border border-green-700 bg-green-700/20 text-green-400'
            : 'border border-green-600 bg-green-700/30 text-green-300 hover:bg-green-700/50 disabled:opacity-30'
        }`}
        title="Submit panel for owner review"
      >
        {submitted ? 'Submitted ✓' : 'Submit for Review'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#111122] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-200 mb-1">Submit for Review</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add a note for the reviewer (optional) — mention anything they should know about your changes.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={"Example:\n- Aligned all zone buttons and knobs\n- Moved value dial closer to cursor buttons\n- Added arrow icons to cursor labels\n- Common section might need a wider canvas"}
              rows={6}
              autoFocus
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
            />
            <p className="text-[10px] text-gray-600 mt-2">You won't be able to edit until the reviewer responds.</p>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const ZOOM_STEP = 0.1;

interface EditorToolbarProps {
  deviceId: string;
  previewMode: boolean;
  buildStatus: 'idle' | 'building' | 'approved';
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  lastSavedAt?: Date | null;
  onSaveNow?: () => Promise<void>;
  onApproveAndBuild: () => void;
  onCleanUp: () => void;
  onTogglePreview: () => void;
  onReportIssue?: () => void;
  onRestoreVersion?: () => void;
  onToggleHelp?: () => void;
  isSandbox?: boolean;
}

/** Format a Date as relative time string */
function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Not saved yet';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EditorToolbar({
  deviceId,
  previewMode,
  buildStatus,
  saveStatus = 'idle',
  lastSavedAt,
  onSaveNow,
  onApproveAndBuild,
  onCleanUp,
  onTogglePreview,
  onReportIssue,
  onRestoreVersion,
  onToggleHelp,
  isSandbox,
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
  const showHiddenSections = useEditorStore((s) => s.showHiddenSections);
  const toggleHiddenSections = useEditorStore((s) => s.toggleHiddenSections);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);

  const setZoom = useEditorStore((s) => s.setZoom);
  const setSnapGrid = useEditorStore((s) => s.setSnapGrid);
  const setControlScale = useEditorStore((s) => s.setControlScale);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const showRulers = useEditorStore((s) => s.showRulers);
  const toggleRulers = useEditorStore((s) => s.toggleRulers);
  const togglePhoto = useEditorStore((s) => s.togglePhoto);
  const setPhotoMode = useEditorStore((s) => s.setPhotoMode);
  const setPhotoOpacity = useEditorStore((s) => s.setPhotoOpacity);
  const photoOffsetX = useEditorStore((s) => s.photoOffsetX);
  const photoOffsetY = useEditorStore((s) => s.photoOffsetY);
  const setPhotoOffset = useEditorStore((s) => s.setPhotoOffset);
  const setPhotoScale = useEditorStore((s) => s.setPhotoScale);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const cleanupGap = useEditorStore((s) => s.cleanupGap);
  const setCleanupGap = useEditorStore((s) => s.setCleanupGap);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setAllLabelFontSize = useEditorStore((s) => s.setAllLabelFontSize);
  const resetAllSizes = useEditorStore((s) => s.resetAllSizes);
  const scaleCanvas = useEditorStore((s) => s.scaleCanvas);
  const addStandaloneLabel = useEditorStore((s) => s.addStandaloneLabel);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);

  const zoomPercent = Math.round(zoom * 100);

  // Refresh relative time display every 30s
  const [, setTick] = useState(0);
  const [showScaleModal, setShowScaleModal] = useState(false);
  useEffect(() => {
    if (!lastSavedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

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
    <>
    <ScaleContentsModal open={showScaleModal} onClose={() => setShowScaleModal(false)} />
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

      {/* Preview-mode badge — prominent + animated so it's unmistakable
          that the editor is in preview state. Replaces the 40-px banner
          that used to push the canvas down by that amount; this badge
          adds zero layout-shift to the canvas itself. */}
      {previewMode && (
        <div
          className="flex items-center gap-1.5 rounded border border-amber-400 bg-amber-500/25 px-2 py-0.5 mr-0.5 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          title="You are viewing the panel in production preview mode — edit controls are disabled. Click 'Exit Preview' on the right to return."
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 whitespace-nowrap">
            Preview Mode
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

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <button onClick={() => setZoom(zoom - ZOOM_STEP)} disabled={zoom <= 0.1} className={iconBtn} title="Zoom Out">-</button>
        <span className="w-8 text-center text-[10px] text-gray-400">{zoomPercent}%</span>
        <button onClick={() => setZoom(zoom + ZOOM_STEP)} disabled={zoom >= 5} className={iconBtn} title="Zoom In">+</button>
      </div>

      {divider}

      {/* ── MIDDLE: Overlays ───────────────────────────────────── */}

      {/* Grid toggle + snap size — grouped so the relationship is obvious */}
      <div className="flex items-center gap-0.5" data-tutorial="grid">
        <button onClick={toggleGrid} className={toggleBtn(showGrid)} title="Grid (G)" disabled={previewMode}>Grid</button>
        <button onClick={toggleRulers} className={toggleBtn(showRulers)} title="Rulers (R)" disabled={previewMode}>Ruler</button>
        <select
          value={snapGrid}
          onChange={(e) => setSnapGrid(Number(e.target.value) as SnapGrid)}
          className="h-6 rounded border border-gray-700 bg-gray-900 px-1 text-[10px] text-gray-300 outline-none"
          title="Snap grid size — controls snap to this interval when dragging"
          disabled={previewMode}
        >
          {SNAP_OPTIONS.map((v) => (
            <option key={v} value={v}>{v}px</option>
          ))}
        </select>
      </div>

      <button onClick={toggleLabels} className={toggleBtn(showLabels)} title="Labels (T)" disabled={previewMode}>Labels</button>

      {/* Hidden-section ghost visibility — when off, hidden sections vanish
          from the editor (use Layers panel to find them). When on, they
          render as faint amber ghost frames so contractor can re-select. */}
      <button
        onClick={toggleHiddenSections}
        className={toggleBtn(showHiddenSections)}
        title={showHiddenSections
          ? 'Hidden sections are visible as ghost frames — click to hide them from the editor'
          : 'Hidden sections are suppressed — click to show ghost frames'}
        disabled={previewMode}
      >
        Hidden
      </button>

      {/* Add standalone label */}
      <button
        onClick={() => {
          pushSnapshot();
          // Create at center of canvas area; flash + scroll-to so the
          // contractor sees where the new label landed (matches the
          // new-container pattern in ContextMenu.tsx).
          const newId = addStandaloneLabel(canvasWidth / 2 - 30, canvasHeight / 2);
          const store = useEditorStore.getState();
          store.flashLabelCreated(newId);
          store.setSelectedLabel(newId);
          if (typeof document !== 'undefined') {
            setTimeout(() => {
              const el = document.querySelector(`[data-label-id="${newId}"]`);
              if (el && 'scrollIntoView' in el) {
                el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
              }
            }, 50);
          }
        }}
        disabled={previewMode}
        className={iconBtn}
        title="Add standalone label at canvas center"
      >
        +L
      </button>

      {/* Add polish banner — decorative overlay spanning the panel */}
      <button
        onClick={() => {
          pushSnapshot();
          const newId = useEditorStore.getState().addPolishBanner();
          if (typeof document !== 'undefined') {
            setTimeout(() => {
              const el = document.querySelector(`[data-banner-id="${newId}"]`);
              if (el && 'scrollIntoView' in el) {
                el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
              }
            }, 50);
          }
        }}
        disabled={previewMode}
        className={iconBtn}
        title="Add polish banner (decorative overlay) at top of panel"
      >
        +B
      </button>

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
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
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
              <>
                <input
                  type="range" min={0} max={100}
                  value={Math.round(photoOpacity * 100)}
                  onChange={(e) => setPhotoOpacity(Number(e.target.value) / 100)}
                  className="h-1 w-12 cursor-pointer accent-blue-500"
                  title={`Opacity: ${Math.round(photoOpacity * 100)}%`}
                />
                {/* Photo offset inputs — shift the photo without moving controls */}
                <input
                  type="number"
                  value={photoOffsetX}
                  onChange={(e) => setPhotoOffset(Number(e.target.value) || 0, photoOffsetY)}
                  className="w-10 h-5 rounded border border-gray-700 bg-gray-900 px-0.5 text-[9px] text-gray-400 text-center outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Photo X offset (px)"
                />
                <input
                  type="number"
                  value={photoOffsetY}
                  onChange={(e) => setPhotoOffset(photoOffsetX, Number(e.target.value) || 0)}
                  className="w-10 h-5 rounded border border-gray-700 bg-gray-900 px-0.5 text-[9px] text-gray-400 text-center outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Photo Y offset (px)"
                />
                <button
                  onClick={() => { setPhotoOffset(0, 0); setPhotoScale(1); }}
                  className="text-[8px] text-gray-500 hover:text-gray-300 px-1"
                  title="Reset photo offset + scale"
                >Rst</button>
              </>
            )}
          </>
        )}
      </div>

      {/* ── SPACER ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-2" />

      {/* ── RIGHT: Actions ─────────────────────────────────────── */}

      {/* Help — always visible (contractors need this) */}
      <button
        onClick={onToggleHelp}
        className={iconBtn}
        title="Help (?)"
        data-tutorial="help"
      >?</button>

      {/* Report Issue — visible for contractors and admin (not sandbox) */}
      {!isSandbox && onReportIssue && (
        <button
          onClick={onReportIssue}
          className="flex h-6 items-center gap-1 rounded border border-gray-700 px-2 text-[10px] text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
          title="Report Issue"
          data-tutorial="report"
        >
          <span className="text-xs">⚑</span>
          Report Issue
        </button>
      )}

      {/* History + Reset — local only */}
      {!isHosted && !isSandbox && (
        <>
          <VersionHistoryDropdown deviceId={deviceId} onRestore={onRestoreVersion} />

          {/* Reset Sizes */}
          <button
            onClick={() => { pushSnapshot(); resetAllSizes(); }}
            disabled={previewMode}
            className="flex h-6 items-center rounded px-1.5 text-[9px] text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 disabled:opacity-30 whitespace-nowrap"
            title="Reset all controls to default sizes (undoable)"
          >Reset Sizes</button>
        </>
      )}

      {divider}

      {/* Preview */}
      <button
        onClick={onTogglePreview}
        disabled={isHosted && typeof window !== 'undefined' && !!(window as any).__submittedForReview}
        className={`flex h-7 items-center rounded px-3 text-[10px] font-medium whitespace-nowrap transition-colors disabled:opacity-30 ${
          previewMode
            ? 'border border-amber-500 bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
            : 'border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
        title="Preview — see panel as it appears in production"
      >{previewMode ? 'Exit Preview' : 'Preview'}</button>

      {divider}

      {/* Two distinct clusters:
          1. "Scale" cluster — proportional scaling (-/+ shortcuts + ⤢ modal)
          2. "Canvas" cluster — W/H inputs that resize without scaling contents */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Scale cluster — proportional */}
        <span className="text-[9px] text-gray-500">Scale:</span>
        <button
          onClick={() => { pushSnapshot(); scaleCanvas(0.8); }}
          disabled={previewMode}
          className="flex h-6 w-6 items-center justify-center rounded text-[10px] text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
          title="Scale all contents down to 80%"
        >−</button>
        <button
          onClick={() => { pushSnapshot(); scaleCanvas(1.25); }}
          disabled={previewMode}
          className="flex h-6 w-6 items-center justify-center rounded text-[10px] text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
          title="Scale all contents up to 125%"
        >+</button>
        <button
          onClick={() => setShowScaleModal(true)}
          disabled={previewMode}
          className="flex h-6 items-center px-2 rounded text-[9px] text-gray-300 hover:bg-gray-800 hover:text-gray-100 disabled:opacity-30 border border-gray-700"
          title="Scale all contents proportionally to a custom percentage or size"
        >⤢ Scale…</button>

        <span className="mx-1 h-4 w-px bg-gray-800" />

        {/* Canvas cluster — resize-only (no scaling of contents) */}
        <span className="text-[9px] text-gray-500">Canvas:</span>
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            defaultValue={canvasWidth}
            key={`w-${canvasWidth}`}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val !== canvasWidth && val >= 400) {
                pushSnapshot();
                setCanvasSize(val, canvasHeight);
              }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            disabled={previewMode}
            className="w-12 h-6 rounded border border-gray-700 bg-gray-900 px-1 text-[9px] text-gray-300 text-center outline-none focus:border-blue-500 disabled:opacity-30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Canvas width in pixels — resizes the canvas only. Controls keep their position. Min 400."
            placeholder="W"
          />
          <span className="text-[9px] text-gray-600">×</span>
          <input
            type="number"
            defaultValue={canvasHeight}
            key={`h-${canvasHeight}`}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val !== canvasHeight && val >= 300) {
                pushSnapshot();
                setCanvasSize(canvasWidth, val);
              }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            disabled={previewMode}
            className="w-12 h-6 rounded border border-gray-700 bg-gray-900 px-1 text-[9px] text-gray-300 text-center outline-none focus:border-blue-500 disabled:opacity-30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Canvas height in pixels — resizes the canvas only. Controls keep their position. Min 300."
            placeholder="H"
          />
        </div>

        {isSandbox ? (
          <span className="flex h-7 items-center px-3 text-[10px] font-medium text-violet-400 border border-violet-500/30 bg-violet-600/15 rounded whitespace-nowrap">
            Practice Mode
          </span>
        ) : isHosted ? (
          <div data-tutorial="submit" className="flex items-center gap-1.5">
            {/* Persistent "Last saved" timestamp */}
            <span className={`text-[9px] whitespace-nowrap ${
              saveStatus === 'conflict' ? 'text-red-400'
              : !lastSavedAt ? 'text-red-400'
              : (Date.now() - lastSavedAt.getTime()) < 60000 ? 'text-green-400/70'
              : (Date.now() - lastSavedAt.getTime()) < 300000 ? 'text-gray-500'
              : 'text-amber-400/70'
            }`}>
              {saveStatus === 'conflict'
                ? 'Conflict — reload page'
                : `Saved ${formatRelativeTime(lastSavedAt)}`}
            </span>
            {/* Transient save status */}
            {saveStatus === 'saving' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded text-amber-400 bg-amber-900/30">Saving...</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded text-red-400 bg-red-900/30">Save failed</span>
            )}
            {saveStatus === 'conflict' && (
              <button
                onClick={() => window.location.reload()}
                className="rounded border border-red-600 bg-red-900/30 px-2 py-0.5 text-[9px] text-red-300 hover:bg-red-900/50 transition-colors"
              >
                Reload
              </button>
            )}
            {onSaveNow && saveStatus !== 'conflict' && (
              <button
                onClick={onSaveNow}
                disabled={previewMode || saveStatus === 'saving'}
                className="rounded border border-gray-600 bg-gray-800 px-2.5 py-1 text-[10px] font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                title="Save now (flushes to cloud)"
              >
                Save
              </button>
            )}
            <SubmitForReviewButton deviceId={deviceId} disabled={previewMode || saveStatus === 'conflict'} />
            {/* History dropdown — same component as admin sees, now reads hosted Blob backups */}
            <VersionHistoryDropdown deviceId={deviceId} onRestore={onRestoreVersion} />
          </div>
        ) : (
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
            title="Export panel manifest for production"
          >
            {buildStatus === 'building'
              ? 'Exporting...'
              : buildStatus === 'approved'
                ? 'Exported ✓'
                : 'Export Panel'}
          </button>
        )}
      </div>
    </div>
    </>
  );
}
