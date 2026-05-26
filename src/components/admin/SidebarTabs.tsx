'use client';

/**
 * Tab bar for the canvas review sidebar. Pure presentational — caller owns
 * active state. Each tab can carry an optional count badge color-coded by
 * severity ('error' | 'warn' | 'info' | 'success' | null).
 */

export type TabSeverity = 'error' | 'warn' | 'info' | 'success' | null;

export interface TabDef {
  id: string;
  label: string;
  count?: number | null; // null/undefined hides badge
  severity?: TabSeverity;
}

interface SidebarTabsProps {
  tabs: TabDef[];
  activeId: string;
  onChange: (id: string) => void;
}

function badgeColor(severity: TabSeverity): { bg: string; fg: string } {
  switch (severity) {
    case 'error': return { bg: 'rgba(239, 68, 68, 0.15)', fg: '#f87171' };
    case 'warn': return { bg: 'rgba(245, 158, 11, 0.15)', fg: '#fbbf24' };
    case 'success': return { bg: 'rgba(34, 197, 94, 0.15)', fg: '#4ade80' };
    case 'info':
    default: return { bg: 'rgba(96, 165, 250, 0.15)', fg: '#60a5fa' };
  }
}

export default function SidebarTabs({ tabs, activeId, onChange }: SidebarTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Sidebar tabs"
      className="flex flex-shrink-0 border-b border-white/10 bg-[#0a0a14]"
      data-testid="sidebar-tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const showBadge = tab.count !== undefined && tab.count !== null;
        const badge = badgeColor(tab.severity ?? null);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tab-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            data-testid={`sidebar-tab-${tab.id}`}
            data-active={isActive ? 'true' : 'false'}
            className={`flex-1 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              isActive
                ? 'text-cyan-300 border-cyan-400 bg-white/[0.02]'
                : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/[0.02]'
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <span>{tab.label}</span>
              {showBadge && (
                <span
                  data-testid={`sidebar-tab-${tab.id}-badge`}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold leading-none"
                  style={{ backgroundColor: badge.bg, color: badge.fg }}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
