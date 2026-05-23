'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDevice } from '@/data/devices';
import { getGlossary } from '@/data/glossary';
import { DEVICE_REGISTRY } from '@/lib/deviceRegistry';
import TutorialRunner from '@/components/tutorial/TutorialRunner';

export default function TutorialPage() {
  const params = useParams<{ deviceId: string; tutorialId: string }>();
  const deviceId = params.deviceId;
  const tutorialId = params.tutorialId;

  const device = useMemo(() => getDevice(deviceId), [deviceId]);
  const registry = DEVICE_REGISTRY[deviceId];

  const tutorial = useMemo(() => {
    if (!registry) return null;
    return registry.tutorials.find((t) => t.id === tutorialId) ?? null;
  }, [registry, tutorialId]);

  const DevicePanel = registry?.PanelComponent;

  // Handle not found states
  if (!device || !tutorial || !DevicePanel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6">
        <div className="text-center">
          <div className="mb-4 text-6xl text-gray-600">404</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-100">
            {!device ? 'Device Not Found' : 'Tutorial Not Found'}
          </h1>
          <p className="max-w-md text-gray-400">
            {!device
              ? `We couldn't find a device with ID "${deviceId}".`
              : `We couldn't find a tutorial with ID "${tutorialId}" for the ${device.name}.`}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const allTutorials = registry.tutorials;
  const glossary = getGlossary(deviceId);
  const dimensions = registry.dimensions;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      <TutorialRunner
        tutorial={tutorial}
        DevicePanel={DevicePanel}
        panelWidth={dimensions.width}
        panelHeight={dimensions.height}
        allTutorials={allTutorials}
        deviceName={device.name}
        glossary={glossary}
      />
    </div>
  );
}
