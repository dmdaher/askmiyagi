'use client';

import { useEditorStore } from './store';
import type { ControlGroup } from './store/historySlice';

export default function GroupOverlay() {
  const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];
  const controls = useEditorStore((s) => s.controls);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const controlScale = useEditorStore((s) => s.controlScale);
  const hoveredGroupId = useEditorStore((s) => s.hoveredGroupId);

  if (controlGroups.length === 0) return null;

  return (
    <>
      {controlGroups.map((group) => {
        // Get member controls
        const members = group.controlIds.map((id) => controls[id]).filter(Boolean);
        if (members.length < 2) return null;

        // Compute bounding box with 4px padding
        const minX = Math.min(...members.map((c) => c.x)) - 4;
        const minY = Math.min(...members.map((c) => c.y)) - 4;
        const maxX = Math.max(...members.map((c) => c.x + c.w * controlScale)) + 4;
        const maxY = Math.max(...members.map((c) => c.y + c.h * controlScale)) + 4;

        // Determine state
        const allMembersSelected =
          group.controlIds.length > 0 &&
          group.controlIds.every((id) => selectedIds.includes(id));
        const isHovered = hoveredGroupId === group.id;

        if (!allMembersSelected && !isHovered) return null;

        return (
          <div
            key={group.id}
            className="absolute"
            style={{
              left: minX,
              top: minY,
              width: maxX - minX,
              height: maxY - minY,
              border: allMembersSelected
                ? '1px dashed rgba(147, 130, 246, 0.5)'
                : '1px solid rgba(147, 130, 246, 0.2)',
              borderRadius: 3,
              pointerEvents: 'none',
              zIndex: allMembersSelected ? 70 : 20,
            }}
          >
            {allMembersSelected && (
              <div
                className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-gray-900/90 border border-violet-500/30 px-1 py-0.5"
                style={{ pointerEvents: 'auto', zIndex: 75 }}
              >
                <span className="text-[8px] text-violet-400 font-medium">
                  {group.name}
                </span>
                <span className="text-[8px] text-gray-600">
                  &times;{group.controlIds.length}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
