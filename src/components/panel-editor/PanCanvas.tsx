'use client';

import { useEditorStore, CANVAS_BASE_W, CANVAS_BASE_H } from './store';

/**
 * Section hue palette — gives each section a distinct colour.
 * Indexed by section position (modulo palette length).
 */
const SECTION_HUES = [210, 30, 150, 330, 90, 270, 60, 180, 0, 120];

export default function PanCanvas() {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const sections = useEditorStore((s) => s.sections);

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
    >
      {/* Canvas background */}
      <div
        className="absolute inset-0 rounded border border-gray-800"
        style={{ backgroundColor: '#111122' }}
      />

      {/* Section rectangles */}
      {sectionEntries.map((section, index) => {
        const hue = SECTION_HUES[index % SECTION_HUES.length];
        return (
          <div
            key={section.id}
            className="absolute flex flex-col items-center justify-center rounded border"
            style={{
              left: section.x,
              top: section.y,
              width: section.w,
              height: section.h,
              backgroundColor: `hsla(${hue}, 60%, 30%, 0.35)`,
              borderColor: `hsla(${hue}, 60%, 50%, 0.6)`,
            }}
          >
            <span
              className="text-xs font-medium leading-tight"
              style={{ color: `hsl(${hue}, 70%, 75%)` }}
            >
              {section.id}
            </span>
            <span className="mt-0.5 text-[10px] text-gray-500">
              {section.childIds.length} control
              {section.childIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
