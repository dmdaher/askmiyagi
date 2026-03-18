'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@/lib/pipeline/types';

const AGENT_COLORS: Record<string, string> = {
  preflight: '#94a3b8',
  'diagram-parser': '#2dd4bf',
  'control-extractor': '#f97316',
  gatekeeper: '#facc15',
  'layout-engine': '#a3e635',
  'structural-inspector': '#f97316',
  'panel-questioner': '#a855f7',
  critic: '#ef4444',
  'manual-extractor': '#06b6d4',
  'coverage-auditor': '#22c55e',
  'tutorial-builder': '#3b82f6',
  'tutorial-reviewer': '#ec4899',
};

const LEVEL_COLORS: Record<string, string> = {
  error: '#ef4444',
  warn: '#f59e0b',
  info: '#6b7280',
  agent: '#6b7280', // overridden by agent color when present
};

const ALL_AGENTS = ['all', ...Object.keys(AGENT_COLORS)] as const;

function formatMessage(message: string): React.ReactNode {
  // Tool calls
  if (message.startsWith('[tool] ')) {
    const tool = message.slice(7);
    return <><span className="text-cyan-400 font-medium">TOOL</span> <span className="text-gray-300">{tool}</span></>;
  }
  // Tool results
  if (message.startsWith('[result] ')) {
    const result = message.slice(9);
    return <><span className="text-gray-500 font-medium">RESULT</span> <span className="text-gray-500">{result}</span></>;
  }
  // Completion
  if (message.startsWith('[done] ')) {
    return <><span className="text-emerald-400 font-medium">DONE</span> <span className="text-gray-300">{message.slice(7)}</span></>;
  }
  // Session
  if (message.startsWith('[session] ')) {
    return <><span className="text-blue-400 font-medium">SESSION</span> <span className="text-gray-400">{message.slice(10)}</span></>;
  }
  // Rate limit
  if (message.startsWith('[rate-limit] ')) {
    return <><span className="text-yellow-400 font-medium">RATE</span> <span className="text-yellow-300">{message.slice(13)}</span></>;
  }
  // Regular message
  return message;
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface LogStreamProps {
  logs: LogEntry[];
}

export default function LogStream({ logs }: LogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [agentFilter, setAgentFilter] = useState<string>('all');

  const filteredLogs = agentFilter === 'all' ? logs : logs.filter((l) => l.agent === agentFilter);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll]);

  function handleScroll() {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
  }

  function getMessageColor(entry: LogEntry): string {
    if (entry.level === 'error') return LEVEL_COLORS.error;
    if (entry.level === 'warn') return LEVEL_COLORS.warn;
    if (entry.agent && AGENT_COLORS[entry.agent]) return AGENT_COLORS[entry.agent];
    return 'var(--foreground, #e0e0e0)';
  }

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground, #e0e0e0)' }}>
          Log Stream
        </h3>
        <div className="flex items-center gap-2">
          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="text-[10px] rounded px-2 py-1 outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--surface, #1a1a2a)',
              color: 'var(--foreground, #e0e0e0)',
              border: '1px solid var(--card-border, #2a2a3a)',
            }}
          >
            {ALL_AGENTS.map((a) => (
              <option key={a} value={a}>
                {a === 'all' ? 'All Agents' : a}
              </option>
            ))}
          </select>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="text-[10px] px-2 py-1 rounded cursor-pointer"
            style={{
              backgroundColor: autoScroll ? 'var(--accent, #00aaff)' : 'var(--surface, #1a1a2a)',
              color: autoScroll ? '#ffffff' : '#6b7280',
              border: '1px solid var(--card-border, #2a2a3a)',
            }}
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="max-h-96 overflow-y-auto p-2 font-mono text-[11px] leading-relaxed"
        style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#6b7280' }}>
            No logs to display
          </div>
        ) : (
          filteredLogs.map((entry, i) => (
            <div key={i} className="flex gap-2 py-0.5 hover:bg-white/5 px-1 rounded">
              {/* Timestamp */}
              <span className="flex-shrink-0" style={{ color: '#6b7280' }}>
                {formatTime(entry.timestamp)}
              </span>

              {/* Agent tag */}
              {entry.agent ? (
                <span
                  className="flex-shrink-0 px-1 rounded text-[10px]"
                  style={{
                    color: AGENT_COLORS[entry.agent] ?? '#6b7280',
                    backgroundColor: `${AGENT_COLORS[entry.agent] ?? '#6b7280'}15`,
                  }}
                >
                  [{entry.agent}]
                </span>
              ) : (
                <span className="flex-shrink-0 px-1 text-[10px]" style={{ color: '#6b7280' }}>
                  [system]
                </span>
              )}

              {/* Message — with event type styling */}
              <span style={{ color: getMessageColor(entry) }}>
                {formatMessage(entry.message)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
