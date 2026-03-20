'use client';

import { useEditorStore } from './store';
import SectionFrame from './SectionFrame';
import GridOverlay from './GridOverlay';
import PhotoOverlay from './PhotoOverlay';
import DragSelectRect from './DragSelectRect';

export default function PanCanvas() {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const sections = useEditorStore((s) => s.sections);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const sectionEntries = Object.values(sections);

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
      {sectionEntries.map((section) => (
        <SectionFrame key={section.id} sectionId={section.id} />
      ))}
    </div>
  );
}
