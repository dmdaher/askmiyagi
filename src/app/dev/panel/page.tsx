'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import DeepMindPanel from '@/components/devices/deepmind-12/DeepMindPanel';
import { DM_PANEL_WIDTH } from '@/lib/devices/deepmind-12-constants';

function PanelPreview() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback((width: number) => {
    if (width > 0) setScale(Math.min(width / DM_PANEL_WIDTH, 1));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => updateScale(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  return (
    <div ref={containerRef} style={{ background: '#000', minHeight: '100vh', padding: 20 }}>
      {section && (
        <div style={{ color: '#666', fontSize: 12, marginBottom: 8, fontFamily: 'monospace' }}>
          Isolated: {section}
        </div>
      )}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <DeepMindPanel
          panelState={{}}
          displayState={{ screenType: 'home' }}
          highlightedControls={[]}
          isolateSection={section}
        />
      </div>
    </div>
  );
}

export default function DevPanelPage() {
  return (
    <Suspense fallback={<div style={{ color: '#666', padding: 40 }}>Loading panel...</div>}>
      <PanelPreview />
    </Suspense>
  );
}
