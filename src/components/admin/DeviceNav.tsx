'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePipelineStore } from '@/store/pipelineStore';
import { hasUsableManifest } from '@/lib/pipeline/phase-order';

interface DeviceNavProps {
  deviceId: string;
}

export default function DeviceNav({ deviceId }: DeviceNavProps) {
  const pathname = usePathname();
  const activePipeline = usePipelineStore((s) => s.activePipeline);

  // Editor button unlocks when a usable manifest exists. See
  // hasUsableManifest — checks phase history AND current-phase position
  // so Restart (which wipes phase history) doesn't falsely gate the
  // Editor button.
  const gatekeeperPassed = activePipeline
    ? hasUsableManifest(
        activePipeline.currentPhase,
        activePipeline.phases as { phase: string; status: string }[] | undefined,
      )
    : false;

  const codegenCompleted = (activePipeline as any)?.codegenCompleted ?? false;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      href: `/admin/${deviceId}`,
      enabled: true,
      tooltip: '',
    },
    {
      id: 'editor',
      label: 'Editor',
      href: `/admin/${deviceId}/editor`,
      enabled: gatekeeperPassed,
      tooltip: 'Waiting for gatekeeper to identify controls...',
    },
    // Preview removed — use toolbar Preview button in the editor instead
  ];

  const isActive = (href: string) => {
    if (href === `/admin/${deviceId}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex h-10 flex-shrink-0 items-center gap-1 border-b border-[var(--card-border)] bg-[var(--background)] px-6">
      {tabs.map((tab) => {
        const active = isActive(tab.href);

        if (!tab.enabled) {
          return (
            <span
              key={tab.id}
              className="cursor-not-allowed rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 opacity-50"
              title={tab.tooltip}
            >
              {tab.label}
            </span>
          );
        }

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
