'use client';

import { useEditorStore } from './store';
import ControlNode from './ControlNode';

/**
 * Flat control layer — renders ALL controls as direct siblings above sections.
 * Controls use absolute canvas coords, not section-relative positioning.
 * This ensures overlapping sections never block control clicks.
 */
export default function ControlLayer() {
  const controls = useEditorStore((s) => s.controls);

  // Filter out nested controls (rendered by their parent ControlNode)
  const topLevelControls = Object.values(controls).filter((c) => !c.nestedIn);

  return (
    <div className="absolute inset-0" style={{ zIndex: 200, pointerEvents: 'none' }}>
      {topLevelControls.map((control) => (
        <ControlNode key={control.id} controlId={control.id} sectionId={control.sectionId} />
      ))}
    </div>
  );
}
