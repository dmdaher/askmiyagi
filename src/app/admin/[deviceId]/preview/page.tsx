'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DEVICE_REGISTRY } from '@/lib/deviceRegistry';

export default function PreviewPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [panelState, setPanelState] = useState<Record<string, { active: boolean }>>({});
  const [highlightedControls, setHighlightedControls] = useState<string[]>([]);

  if (!deviceId) return null;

  const entry = DEVICE_REGISTRY[deviceId];
  const PanelComponent = entry?.PanelComponent;

  const handleButtonClick = (id: string) => {
    setPanelState(prev => ({
      ...prev,
      [id]: { active: !prev[id]?.active },
    }));
    setHighlightedControls([id]);
    setTimeout(() => setHighlightedControls([]), 1500);
  };

  return (
    <div className="h-full overflow-auto flex items-start justify-center p-8 bg-[#0a0a0f]">
      {PanelComponent ? (
        <div className="shadow-2xl">
          <PanelComponent
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={handleButtonClick}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center mt-20">
          <h2 className="text-xl font-semibold text-gray-300">Panel Not Generated Yet</h2>
          <p className="text-sm text-gray-500 max-w-md">
            Use the Editor tab to position controls, then click &quot;Approve &amp; Build&quot; to generate the panel.
          </p>
        </div>
      )}
    </div>
  );
}
