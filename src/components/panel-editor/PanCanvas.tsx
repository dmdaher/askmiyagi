'use client';

import { useEditorStore } from './store';
import SectionFrame from './SectionFrame';
import GroupLabelNode from './GroupLabelNode';
import LabelLayer from './LabelLayer';
import GridOverlay from './GridOverlay';
import PhotoOverlay from './PhotoOverlay';
import DragSelectRect from './DragSelectRect';
import KeyboardSection from './KeyboardSection';

export default function PanCanvas() {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const sections = useEditorStore((s) => s.sections);
  const groupLabels = useEditorStore((s) => s.groupLabels);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  // Sort sections by area: largest first (rendered at bottom), smallest last (on top).
  // This ensures smaller sections in overlapping areas are always clickable.
  const sectionEntries = Object.values(sections).sort(
    (a, b) => (b.w * b.h) - (a.w * a.h)
  );

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

      {/* Section frames with real controls */}
      {sectionEntries.map((section, index) => (
        <SectionFrame key={section.id} sectionId={section.id} zIndex={index + 1} />
      ))}

      {/* Group labels (spanning across controls) */}
      {groupLabels.map((gl) => (
        <GroupLabelNode key={gl.id} groupLabel={gl} />
      ))}

      {/* Floating labels — rendered above controls */}
      <LabelLayer />

      {/* Keyboard section — draggable/resizable */}
      <KeyboardSection />
    </div>
  );
}
