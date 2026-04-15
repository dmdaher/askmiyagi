'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { isHosted } from '@/lib/env';

// Dynamic import — react-joyride exports named `Joyride`, not default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JoyrideComponent: any = dynamic(
  () => import('react-joyride').then((mod) => ({ default: (mod as any).Joyride })),
  { ssr: false }
);

interface EditorTutorialProps {
  deviceId: string;
}

const DISABLED_KEY = 'editor-tutorial-disabled';

// Every step gets skipBeacon + skip button so users can bail out at any point
const stepDefaults = {
  skipBeacon: true,
  buttons: ['skip' as const, 'back' as const, 'primary' as const],
};

const sharedSteps = [
  {
    ...stepDefaults,
    target: '[data-tutorial="canvas"]',
    content: 'This is your instrument canvas. All controls are pre-loaded — your job is to drag them into position to match the real hardware. Click and drag to move, use corner handles to resize.',
    placement: 'center' as const,
  },
  {
    ...stepDefaults,
    target: '[data-tutorial="photo"]',
    content: 'Toggle the photo overlay to see the real hardware underneath your controls. Use Overlay mode with ~40-50% opacity for the best results. Adjust the X/Y offset to align the photo with your canvas.',
  },
  {
    ...stepDefaults,
    target: '[data-tutorial="grid"]',
    content: 'Show the alignment grid for consistent spacing. Change the snap size with the dropdown — use 1-2px for precision work, 8-16px for rough positioning.',
  },
  {
    ...stepDefaults,
    target: '[data-tutorial="layers"]',
    content: 'Press L to open the Layers panel. It shows all sections and controls in a tree view. Click any control here to select it on the canvas. Shift-click to select multiple.',
  },
];

// Local-only steps (targets hidden in hosted mode)
const localSteps = [
  {
    ...stepDefaults,
    target: '[data-tutorial="report"]',
    content: 'Found a missing control, wrong label, or incorrect type? Click Report Issue to flag it. The admin will see your report and fix it in the pipeline.',
  },
  {
    ...stepDefaults,
    target: '[data-tutorial="approve"]',
    content: 'When you\'re happy with the layout, click Export Panel to generate the final manifest from your layout.',
  },
];

// Hosted-mode steps (contractor sees Submit button, not Export/Report)
const hostedSteps = [
  {
    ...stepDefaults,
    target: '[data-tutorial="submit"]',
    content: 'When you\'re done positioning, click Submit for Review. You can add a note about anything tricky. The admin will review and either approve or send feedback.',
  },
  {
    ...stepDefaults,
    target: '[data-tutorial="help"]',
    content: 'Need help anytime? Click the ? button to open the full editor guide with shortcuts, alignment tools, and a step-by-step workflow.',
  },
];

function getSteps() {
  return isHosted ? [...sharedSteps, ...hostedSteps] : [...sharedSteps, ...localSteps];
}

export default function EditorTutorial({ deviceId: _deviceId }: EditorTutorialProps) {
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tourKey, setTourKey] = useState(0); // Increment to force joyride remount

  useEffect(() => {
    setMounted(true);
    try {
      // Only auto-start if user has never seen/skipped the tour
      const disabled = localStorage.getItem(DISABLED_KEY) === 'true';
      if (!disabled) {
        setTimeout(() => setRun(true), 2000);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleCallback = (data: { status: string }) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      try {
        // Permanently disable auto-start — skip or complete = opted out
        localStorage.setItem(DISABLED_KEY, 'true');
      } catch { /* ignore */ }
      setRun(false);
    }
  };

  // Re-trigger from outside (via help drawer "Replay" button)
  // This is a one-shot replay — doesn't re-enable auto-start
  useEffect(() => {
    const handler = () => {
      setRun(false);
      setTourKey((k) => k + 1);
      setTimeout(() => setRun(true), 500);
    };
    window.addEventListener('editor-tutorial-replay', handler);
    return () => window.removeEventListener('editor-tutorial-replay', handler);
  }, []);

  if (!mounted) return null;

  return (
    <JoyrideComponent
      key={tourKey}
      steps={getSteps()}
      run={run}
      continuous
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          backgroundColor: '#1a1a2e',
          textColor: '#e0e0e0',
          primaryColor: '#3b82f6',
          arrowColor: '#1a1a2e',
          zIndex: 10000,
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
