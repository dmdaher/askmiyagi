'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePipelineStore } from '@/store/pipelineStore';

interface DeviceNavProps {
  deviceId: string;
}

export default function DeviceNav({ deviceId }: DeviceNavProps) {
  const pathname = usePathname();
  const activePipeline = usePipelineStore((s) => s.activePipeline);

  const gatekeeperPassed = activePipeline?.phases?.some(
    (p: { phase: string; status: string }) => p.phase === 'phase-0-gatekeeper' && p.status === 'passed'
  ) ?? false;

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
    {
      id: 'preview',
      label: 'Preview',
      href: `/admin/${deviceId}/preview`,
      enabled: codegenCompleted,
      tooltip: 'Run Approve & Build in the Editor first',
    },
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
