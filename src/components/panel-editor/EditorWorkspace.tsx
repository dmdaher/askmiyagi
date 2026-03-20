'use client';

import { useZoomPan } from './hooks/useZoomPan';
import PanCanvas from './PanCanvas';

interface EditorWorkspaceProps {
  /** Used by photo overlay (Task 8) to load the device reference image. */
  deviceId: string;
}

export default function EditorWorkspace({ deviceId: _deviceId }: EditorWorkspaceProps) {
  const { onWheel, onPointerDown, onPointerMove, onPointerUp } = useZoomPan();

  return (
    <div
      className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <PanCanvas />
    </div>
  );
}
