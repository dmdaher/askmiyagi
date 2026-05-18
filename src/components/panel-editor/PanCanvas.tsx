'use client';

import { useMemo } from 'react';
import { useEditorStore } from './store';
import SectionFrame from './SectionFrame';
import ControlLayer from './ControlLayer';
import PolishBannerLayer from './PolishBannerLayer';
import GroupLabelNode from './GroupLabelNode';
import LabelLayer from './LabelLayer';
import GroupOverlay from './GroupOverlay';
import GridOverlay from './GridOverlay';
import PhotoOverlay from './PhotoOverlay';
import DragSelectRect from './DragSelectRect';
import KeyboardSection from './KeyboardSection';
import ContainerNode from './ContainerNode';
import GuideLayer from './GuideLayer';
import PanelRenderer from '@/components/controls/PanelRenderer';
import type { PanelManifest } from '@/components/controls/PanelRenderer';

/** Convert editor Zustand store state to PanelManifest for PanelRenderer */
function storeToManifest(state: ReturnType<typeof useEditorStore.getState>): PanelManifest {
  const controls = Object.values(state.controls)
    .sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));
  const sections = Object.values(state.sections);
  const scale = state.controlScale ?? 1;

  return {
    deviceId: state.deviceId ?? 'unknown',
    deviceName: state.deviceName ?? 'Unknown',
    manufacturer: state.manufacturer ?? '',
    panelWidth: state.canvasWidth,
    panelHeight: state.canvasHeight,
    controlScale: scale,
    keyboard: state.keyboard ?? null,
    editorSections: sections.map((s) => ({
      id: s.id,
      headerLabel: s.headerLabel ?? undefined,
      hidden: s.hidden,
      frameMode: s.frameMode,
      showTitleBanner: s.showTitleBanner,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
    })),
    controls: controls.map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      shape: c.shape as string | undefined,
      surfaceColor: c.surfaceColor ?? undefined,
      buttonStyle: c.buttonStyle as string | undefined,
      labelPosition: c.labelPosition as string | undefined,
      labelDisplay: c.labelDisplay as string | undefined,
      icon: c.icon ?? undefined,
      secondaryLabel: c.secondaryLabel ?? undefined,
      ledVariant: c.ledVariant as string | undefined,
      ledColor: c.ledColor ?? undefined,
      hasLed: c.hasLed,
      ledPosition: c.ledPosition as string | undefined,
      nestedIn: c.nestedIn ?? undefined,
      encoderHasPush: c.encoderHasPush,
      positions: c.positions,
      positionLabels: c.positionLabels,
      rotation: c.rotation,
      labelFontSize: c.labelFontSize,
      ledStyle: c.ledStyle,
      labelAlign: c.labelAlign,
      labelColor: c.labelColor,
      zOrder: c.zOrder,
      editorPosition: { x: c.x, y: c.y, w: c.w, h: c.h },
    })),
    editorLabels: (state.editorLabels ?? []).map((l: any) => ({
      id: l.id,
      text: l.text,
      icon: l.icon,
      x: l.x,
      y: l.y,
      w: l.w,
      fontSize: l.fontSize,
      align: l.align,
      hidden: l.hidden,
      lineHeight: l.fontSize + 2,
      // Thread controlId so PanelRenderer (preview) can compute per-label
      // zIndex relative to the linked control's zOrder. Without this, all
      // labels are stuck at z=150 and any overlapping control hides them.
      controlId: l.controlId,
    })),
    groupLabels: state.groupLabels ?? [],
    controlContainers: (state.controlContainers ?? []).map((c) => ({
      id: c.id,
      style: c.style,
      x: c.x,
      y: c.y,
      w: c.w,
      h: c.h,
      borderRadius: c.borderRadius,
      label: c.label,
    })),
    polishBanners: (state.polishBanners ?? []).map((b: import('./store/historySlice').PolishBanner) => ({ ...b })),
  };
}

export default function PanCanvas() {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const sections = useEditorStore((s) => s.sections);
  const groupLabels = useEditorStore((s) => s.groupLabels);
  const controlContainers = useEditorStore((s) => s.controlContainers);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const previewMode = useEditorStore((s) => s.previewMode);
  const showHiddenSections = useEditorStore((s) => s.showHiddenSections);

  // Sort sections by area: largest first (rendered at bottom), smallest last (on top).
  const sectionEntries = Object.values(sections).sort(
    (a, b) => (b.w * b.h) - (a.w * a.h)
  );

  // Build manifest for PanelRenderer in preview mode
  const manifest = useMemo(() => {
    if (!previewMode) return null;
    return storeToManifest(useEditorStore.getState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, sections]);

  return (
    <div
      style={{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
        width: canvasWidth,
        height: canvasHeight,
        position: 'relative',
      }}
      onClick={() => setSelectedIds([])}
      onContextMenu={(e) => {
        // Only fire for canvas background clicks (not bubbled from controls)
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.control-node, [data-section-id]') === null) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('editor-context-menu', {
            detail: { controlId: '__canvas__', clientX: e.clientX, clientY: e.clientY },
          }));
        }
      }}
    >
      {previewMode && manifest ? (
        /* Preview mode — PanelRenderer shows exact production output */
        <PanelRenderer manifest={manifest} />
      ) : (
        <>
          {/* Canvas background */}
          <div
            className="absolute inset-0 rounded border border-gray-800"
            style={{ backgroundColor: '#111122' }}
          />

          {/* Photo overlay (behind everything) */}
          <PhotoOverlay />

          {/* Grid overlay */}
          <GridOverlay />

          {/* Drag-select rubber band (behind sections, above grid) */}
          <DragSelectRect />

          {/* Section frames — visual boxes + banners only (no child controls).
              Hidden sections render as a faint ghost outline by default so
              contractor can re-select them. When showHiddenSections is OFF
              (toolbar toggle), they're fully suppressed from the editor —
              contractor must use the Layers panel to reach them.
              PREVIEW always omits hidden sections regardless. */}
          {sectionEntries
            .filter((section) => {
              if (showHiddenSections) return true;
              const mode = section.frameMode ?? (section.hidden ? 'hidden' : 'full');
              return mode !== 'hidden';
            })
            .map((section, index) => (
              <SectionFrame key={section.id} sectionId={section.id} zIndex={index + 1} />
            ))}

          {/* Visual containers — between sections and controls (z=2-4) */}
          {controlContainers.map((c) => (
            <ContainerNode key={c.id} container={c} />
          ))}

          {/* Polish banners — decorative overlay (z=5, above sections + containers, below controls) */}
          <PolishBannerLayer />

          {/* All controls — flat layer above sections, never blocked by overlap */}
          <ControlLayer />

          {/* Group bounding-box overlays (hovered / selected) */}
          <GroupOverlay />

          {/* Group labels (spanning across controls) */}
          {groupLabels.map((gl) => (
            <GroupLabelNode key={gl.id} groupLabel={gl} />
          ))}

          {/* Guide lines — between controls and labels */}
          <GuideLayer />

          {/* Floating labels — rendered above controls */}
          <LabelLayer />

          {/* Keyboard section — draggable/resizable */}
          <KeyboardSection />
        </>
      )}
    </div>
  );
}
