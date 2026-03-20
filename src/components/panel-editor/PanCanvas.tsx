'use client';

import { useEditorStore, CANVAS_BASE_W, CANVAS_BASE_H } from './store';
import SectionFrame from './SectionFrame';

export default function PanCanvas() {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const sections = useEditorStore((s) => s.sections);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const sectionEntries = Object.values(sections);

  return (
    <div
      style={{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
        width: CANVAS_BASE_W,
        height: CANVAS_BASE_H,
        position: 'relative',
      }}
      onClick={() => setSelectedIds([])}
    >
      {/* Canvas background */}
      <div
        className="absolute inset-0 rounded border border-gray-800"
        style={{ backgroundColor: '#111122' }}
      />

      {/* Section frames with real controls */}
      {sectionEntries.map((section) => (
        <SectionFrame key={section.id} sectionId={section.id} />
      ))}
    </div>
  );
}
