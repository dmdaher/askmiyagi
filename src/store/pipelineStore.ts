'use client';

import { create } from 'zustand';
import {
  PipelineState,
  PipelineRunSummary,
  LogEntry,
} from '@/lib/pipeline/types';

interface PipelineStore {
  runs: Record<string, PipelineRunSummary>;
  activePipeline: PipelineState | null;
  activeDeviceId: string | null;
  logs: LogEntry[];
  sseConnected: boolean;

  fetchRuns: () => Promise<void>;
  fetchPipeline: (deviceId: string) => Promise<void>;
  startPipeline: (deviceId: string) => Promise<void>;
  cancelPipeline: (deviceId: string) => Promise<void>;
  resolveEscalation: (deviceId: string, escalationId: string, resolution: string) => Promise<void>;

  connectSSE: (deviceId: string) => void;
  disconnectSSE: () => void;

  _eventSource: EventSource | null;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  runs: {},
  activePipeline: null,
  activeDeviceId: null,
  logs: [],
  sseConnected: false,
  _eventSource: null,

  fetchRuns: async () => {
    try {
      const res = await fetch('/api/pipeline');
      if (!res.ok) return;
      const summaries: PipelineRunSummary[] = await res.json();
      const runs: Record<string, PipelineRunSummary> = {};
      for (const s of summaries) runs[s.deviceId] = s;
      set({ runs });
    } catch { /* keep existing state */ }
  },

  fetchPipeline: async (deviceId: string) => {
    try {
      const res = await fetch(`/api/pipeline/${deviceId}`);
      if (!res.ok) return;
      const state: PipelineState = await res.json();
      set({ activePipeline: state, activeDeviceId: deviceId });
    } catch { /* network error */ }
  },

  startPipeline: async (deviceId: string) => {
    try {
      await fetch(`/api/pipeline/${deviceId}/start`, { method: 'POST' });
      await get().fetchPipeline(deviceId);
      await get().fetchRuns();
    } catch { /* error */ }
  },

  cancelPipeline: async (deviceId: string) => {
    try {
      await fetch(`/api/pipeline/${deviceId}`, { method: 'DELETE' });
      await get().fetchPipeline(deviceId);
      await get().fetchRuns();
    } catch { /* error */ }
  },

  resolveEscalation: async (deviceId: string, escalationId: string, resolution: string) => {
    try {
      await fetch(`/api/pipeline/${deviceId}/escalation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationId, resolution }),
      });
      await get().fetchPipeline(deviceId);
    } catch { /* error */ }
  },

  connectSSE: (deviceId: string) => {
    const { _eventSource } = get();
    if (_eventSource) _eventSource.close();

    const es = new EventSource(`/api/pipeline/${deviceId}/logs`);

    es.addEventListener('state', (event) => {
      try {
        const state: PipelineState = JSON.parse(event.data);
        set({ activePipeline: state });
      } catch { /* invalid JSON */ }
    });

    es.addEventListener('log', (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        set((s) => ({ logs: [...s.logs.slice(-999), entry] }));
      } catch { /* invalid JSON */ }
    });

    es.onopen = () => set({ sseConnected: true });
    es.onerror = () => set({ sseConnected: false });

    set({ _eventSource: es, activeDeviceId: deviceId, logs: [] });
  },

  disconnectSSE: () => {
    const { _eventSource } = get();
    if (_eventSource) _eventSource.close();
    set({ _eventSource: null, sseConnected: false });
  },
}));
