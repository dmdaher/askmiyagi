'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import — react-joyride exports named `Joyride`, not default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JoyrideComponent: any = dynamic(
  () => import('react-joyride').then((mod) => ({ default: (mod as any).Joyride })),
  { ssr: false }
);

interface EditorTutorialProps {
  deviceId: string;
}

const STORAGE_KEY_PREFIX = 'editor-tutorial-';

const steps = [
  {
    target: '[data-tutorial="canvas"]',
    content: 'This is your instrument canvas. Controls are pre-loaded from the pipeline. Drag them to position on the hardware photo.',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="scale"]',
    content: 'Scale controls down (30-50%) to match the hardware photo proportions. Use [ and ] keys for quick adjustment. Scale back to 100% to see the final result.',
  },
  {
    target: '[data-tutorial="photo"]',
    content: 'Toggle the photo overlay to see the real hardware underneath. Align controls to match the photo.',
  },
  {
    target: '[data-tutorial="grid"]',
    content: 'Show the alignment grid for consistent spacing. Change grid size with the Snap dropdown.',
  },
  {
    target: '[data-tutorial="layers"]',
    content: 'Press L to open the Layers panel — shows sections and controls organized by group. Click a control here to select it on the canvas.',
  },
  {
    target: '[data-tutorial="report"]',
    content: 'Found a missing control or wrong label? Click Report Issue to flag it without touching any code.',
  },
  {
    target: '[data-tutorial="approve"]',
    content: 'When positioning is done, click Approve & Build to generate the final instrument panel from your layout.',
  },
];

export default function EditorTutorial({ deviceId }: EditorTutorialProps) {
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${deviceId}`;

  useEffect(() => {
    setMounted(true);
    // Check if tutorial was already completed
    try {
      const completed = localStorage.getItem(storageKey);
      if (!completed) {
        // Delay start to let editor render first
        setTimeout(() => setRun(true), 2000);
      }
    } catch {
      // localStorage not available
    }
  }, [storageKey]);

  const handleCallback = (data: { status: string; type: string }) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      try {
        localStorage.setItem(storageKey, 'completed');
      } catch { /* ignore */ }
      setRun(false);
    }
  };

  // Re-trigger from outside (via "?" button)
  useEffect(() => {
    const handler = () => {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      setRun(true);
    };
    window.addEventListener('editor-tutorial-replay', handler);
    return () => window.removeEventListener('editor-tutorial-replay', handler);
  }, [storageKey]);

  if (!mounted) return null;

  return (
    <JoyrideComponent
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          backgroundColor: '#1a1a2e',
          textColor: '#e0e0e0',
          primaryColor: '#3b82f6',
          arrowColor: '#1a1a2e',
          zIndex: 200,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 13,
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          fontSize: 12,
        },
        buttonBack: {
          color: '#888',
          fontSize: 12,
        },
        buttonSkip: {
          color: '#666',
          fontSize: 11,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip Tutorial',
      }}
    />
  );
}
