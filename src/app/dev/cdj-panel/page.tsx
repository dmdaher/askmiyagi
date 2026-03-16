'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CDJPanel from '@/components/devices/cdj-3000/CDJPanel';
import { CDJ_PANEL_WIDTH } from '@/lib/devices/cdj-3000-constants';

function CDJPanelPreview() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || undefined;

  // Demo panel state showing the RIGHT-TEMPO section active controls
  const demoPanelState = {
    'master-btn': { active: false, ledOn: true },
    'beat-sync-inst-doubles-btn': { active: false, ledOn: false },
    'master-tempo-btn': { active: false, ledOn: true },
    'vinyl-cdj-indicator': { active: false, ledOn: true },
    'tempo-reset-indicator': { active: false, ledOn: false },
    'tempo-slider': { active: false, value: 64 },
    'jog-adjust-knob': { active: false, value: 64 },
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflowX: 'scroll',
        overflowY: 'auto',
        background: '#000',
      }}
    >
      <div
        style={{
          padding: '20px',
          minWidth: CDJ_PANEL_WIDTH + 200,
        }}
      >
        {/* Dev header */}
        <div
          style={{
            color: '#666',
            fontSize: 12,
            marginBottom: 12,
            fontFamily: 'monospace',
          }}
        >
          CDJ-3000 Panel Dev Preview
          {section && ` — isolated: ${section}`}
        </div>

        {/* Section isolation notice */}
        {section === 'right-tempo' && (
          <div
            style={{
              color: '#0088ff',
              fontSize: 11,
              marginBottom: 12,
              fontFamily: 'monospace',
              padding: '6px 10px',
              border: '1px solid #0088ff44',
              borderRadius: 4,
              display: 'inline-block',
            }}
          >
            Rendering RIGHT-TEMPO section in isolation (Phase 1 QA)
          </div>
        )}

        {/* Panel */}
        <CDJPanel
          panelState={demoPanelState}
          displayState={{ screenType: 'home' }}
          highlightedControls={['master-btn', 'tempo-slider']}
          isolateSection={section}
        />

        {/* Control ID legend */}
        <div
          style={{
            marginTop: 20,
            color: '#555',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          <div style={{ color: '#888', marginBottom: 6 }}>
            RIGHT-TEMPO controls (11 total, manual items 38-48):
          </div>
          {[
            'jog-mode-btn (item 38)',
            'vinyl-cdj-indicator (item 39)',
            'jog-adjust-knob (item 40)',
            'master-btn (item 41)',
            'key-sync-btn (item 42)',
            'beat-sync-inst-doubles-btn (item 43)',
            'tempo-range-btn (item 44)',
            'master-tempo-btn (item 45)',
            'tempo-slider (item 46)',
            'tempo-reset-indicator (item 47)',
            'tempo-reset-btn (item 48)',
          ].map((id) => (
            <div key={id} style={{ paddingLeft: 12, lineHeight: 1.8 }}>
              {id}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CDJPanelDevPage() {
  return (
    <Suspense
      fallback={
        <div style={{ color: '#666', padding: 40 }}>Loading CDJ panel...</div>
      }
    >
      <CDJPanelPreview />
    </Suspense>
  );
}
