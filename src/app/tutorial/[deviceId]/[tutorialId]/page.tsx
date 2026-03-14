'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDevice } from '@/data/devices';
import { fantom08Tutorials } from '@/data/tutorials/fantom-08';
import { rc505mk2Tutorials } from '@/data/tutorials/rc505-mk2';
import { deepmind12Tutorials } from '@/data/tutorials/deepmind-12';
import { Tutorial } from '@/types/tutorial';
import { getGlossary } from '@/data/glossary';
import { PANEL_DIMENSIONS } from '@/lib/constants';
import TutorialRunner from '@/components/tutorial/TutorialRunner';
import FantomPanel from '@/components/devices/fantom-08/FantomPanel';
import RC505Panel from '@/components/devices/rc505-mk2/RC505Panel';
import DeepMindPanel from '@/components/devices/deepmind-12/DeepMindPanel';

const tutorialsByDevice: Record<string, Tutorial[]> = {
  'fantom-08': fantom08Tutorials,
  'rc505-mk2': rc505mk2Tutorials,
  'deepmind-12': deepmind12Tutorials,
};

const panelComponents: Record<string, React.ComponentType<any>> = {
  'fantom-08': FantomPanel,
  'rc505-mk2': RC505Panel,
  'deepmind-12': DeepMindPanel,
};

export default function TutorialPage() {
  const params = useParams<{ deviceId: string; tutorialId: string }>();
  const deviceId = params.deviceId;
  const tutorialId = params.tutorialId;

  const device = useMemo(() => getDevice(deviceId), [deviceId]);

  const tutorial = useMemo(() => {
    const tutorials = tutorialsByDevice[deviceId];
    if (!tutorials) return null;
    return tutorials.find((t) => t.id === tutorialId) ?? null;
  }, [deviceId, tutorialId]);

  const DevicePanel = panelComponents[deviceId];

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

  const allTutorials = tutorialsByDevice[deviceId] ?? [];
  const glossary = getGlossary(deviceId);
  const dimensions = PANEL_DIMENSIONS[deviceId] ?? { width: 1200, height: 600 };

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
