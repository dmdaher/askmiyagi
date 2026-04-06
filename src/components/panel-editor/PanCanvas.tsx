'use client';

import { useMemo } from 'react';
import { useEditorStore } from './store';
import SectionFrame from './SectionFrame';
import ControlLayer from './ControlLayer';
import GroupLabelNode from './GroupLabelNode';
import LabelLayer from './LabelLayer';
import GroupOverlay from './GroupOverlay';
import GridOverlay from './GridOverlay';
import PhotoOverlay from './PhotoOverlay';
import DragSelectRect from './DragSelectRect';
import KeyboardSection from './KeyboardSection';
import PanelRenderer from '@/components/controls/PanelRenderer';
import type { PanelManifest } from '@/components/controls/PanelRenderer';

/** Convert editor Zustand store state to PanelManifest for PanelRenderer */
function storeToManifest(state: ReturnType<typeof useEditorStore.getState>): PanelManifest {
  const controls = Object.values(state.controls);
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
      editorPosition: { x: c.x, y: c.y, w: c.w, h: c.h },
    })),
    editorLabels: (state.editorLabels ?? []).map((l: any) => ({
      id: l.id,
      text: l.text,
      x: l.x,
      y: l.y,
      w: l.w,
      fontSize: l.fontSize,
      align: l.align,
      hidden: l.hidden,
      lineHeight: l.fontSize + 2,
    })),
    groupLabels: state.groupLabels ?? [],
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
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const previewMode = useEditorStore((s) => s.previewMode);

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

          {/* Section frames — visual boxes + banners only (no child controls) */}
          {sectionEntries.map((section, index) => (
            <SectionFrame key={section.id} sectionId={section.id} zIndex={index + 1} />
          ))}

          {/* All controls — flat layer above sections, never blocked by overlap */}
          <ControlLayer />

          {/* Group bounding-box overlays (hovered / selected) */}
          <GroupOverlay />

          {/* Group labels (spanning across controls) */}
          {groupLabels.map((gl) => (
            <GroupLabelNode key={gl.id} groupLabel={gl} />
          ))}

          {/* Floating labels — rendered above controls */}
          <LabelLayer />

          {/* Keyboard section — draggable/resizable */}
          <KeyboardSection />
        </>
      )}
    </div>
  );
}
