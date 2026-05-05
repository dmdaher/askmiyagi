'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface StatusEvent {
  type: string;
  timestamp: string;
  note?: string;
  by: 'admin' | 'contractor';
}

interface DeviceState {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: string;
  updatedAt: string;
  adminNote?: string;
  contractorNote?: string;
  events?: StatusEvent[];
}

interface DeviceIssue {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution?: string;
  findings?: AuditFinding[];
}

interface AuditFinding {
  id: string;
  label: string;
  type: string;
  manualPage?: string;
  section?: string;
  action?: 'add' | 'fix';
  details?: string;
}

const STATUS_LABELS: Record<string, { text: string; dot: string }> = {
  ready: { text: 'text-gray-400', dot: 'bg-gray-400' },
  'in-progress': { text: 'text-blue-400', dot: 'bg-blue-400' },
  submitted: { text: 'text-amber-400', dot: 'bg-amber-400' },
  approved: { text: 'text-green-400', dot: 'bg-green-400' },
};

function getLabel(d: DeviceState): string {
  if (d.status === 'ready') return 'Sent to contractor — waiting for edits';
  if (d.status === 'in-progress' && d.adminNote) return 'Changes requested — contractor revising';
  if (d.status === 'in-progress') return 'Contractor editing';
  if (d.status === 'submitted') return 'Submitted — needs your review';
  if (d.status === 'approved') return 'Approved ✓';
  return d.status;
}

export default function ContractorSubmissions() {
  const [devices, setDevices] = useState<DeviceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string>>({});
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [deviceIssues, setDeviceIssues] = useState<Record<string, DeviceIssue[]>>({});
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [auditRunning, setAuditRunning] = useState<string | null>(null);
  const [auditFindings, setAuditFindings] = useState<Record<string, AuditFinding[]>>({});
  const [auditResult, setAuditResult] = useState<Record<string, string>>({});
  const [deviceHistory, setDeviceHistory] = useState<Record<string, Array<{ name: string; url: string; timestamp: string; sizeBytes: number }>>>({});
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchDevices = useCallback(() => {
    fetch('/api/hosted/panels')
      .then(r => r.ok ? r.json() : [])
      .then((data) => {
        const list: DeviceState[] = Array.isArray(data) ? data : [];
        setDevices(list);
        setLoading(false);
        // Fetch issues for each device
        for (const d of list) {
          fetch(`/api/hosted/panels/${d.deviceId}/issues`)
            .then(r => r.ok ? r.json() : [])
            .then((issues: DeviceIssue[]) => {
              setDeviceIssues(prev => ({ ...prev, [d.deviceId]: issues }));
            })
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // 30s for issues (less frequent)
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleApprove = async (deviceId: string) => {
    setActing(deviceId);
    try {
      const res = await fetch(`/api/hosted/panels/${deviceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      setResult(prev => ({ ...prev, [deviceId]: '✓ Approved' }));
      fetchDevices();
    } catch (err) {
      setResult(prev => ({ ...prev, [deviceId]: `✗ ${(err as Error).message}` }));
    }
    setActing(null);
  };

  const handleSendFeedback = async (deviceId: string) => {
    setActing(deviceId);
    try {
      const res = await fetch(`/api/hosted/panels/${deviceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress', adminNote: feedbackText }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      setResult(prev => ({ ...prev, [deviceId]: '↩ Sent back with feedback' }));
      setFeedbackFor(null);
      setFeedbackText('');
      fetchDevices();
    } catch (err) {
      setResult(prev => ({ ...prev, [deviceId]: `✗ ${(err as Error).message}` }));
    }
    setActing(null);
  };

  const handleReview = async (deviceId: string) => {
    if (!confirm('This will pull the contractor\'s latest version from Blob. Any local edits you made will be overwritten. Continue?')) return;
    setActing(deviceId);
    try {
      await fetch(`/api/pipeline/${deviceId}/pull-from-hosted`, { method: 'POST' });
    } catch { /* pull failed — open editor with local state */ }
    setActing(null);
    window.open(`/admin/${deviceId}/editor?reload=${Date.now()}`, '_blank');
  };

  const handleOpenEditor = (deviceId: string) => {
    // Open editor WITHOUT pulling from Blob — preserves local admin edits
    window.open(`/admin/${deviceId}/editor?reload=${Date.now()}`, '_blank');
  };

  const handlePullBuild = async (deviceId: string) => {
    setActing(deviceId);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/pull-from-hosted`, { method: 'POST' });
      const data = await res.json();
      setResult(prev => ({ ...prev, [deviceId]: data.ok ? '✓ Pulled + exported' : `✗ ${data.error}` }));
    } catch (err) {
      setResult(prev => ({ ...prev, [deviceId]: `✗ ${(err as Error).message}` }));
    }
    setActing(null);
  };

  // ── Audit Actions ─────────────────────────────────────────────────────────

  const handleRunAudit = async (deviceId: string, issue: DeviceIssue) => {
    setAuditRunning(issue.id);
    setAuditResult(prev => ({ ...prev, [issue.id]: '' }));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
      const res = await fetch(`/api/pipeline/${deviceId}/audit-controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: issue.description, issueId: issue.id }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Audit failed');
      if (data.findings && data.findings.length > 0) {
        setAuditFindings(prev => ({ ...prev, [issue.id]: data.findings }));
        setAuditResult(prev => ({ ...prev, [issue.id]: `Found ${data.findings.length} missing controls` }));
      } else {
        setAuditResult(prev => ({ ...prev, [issue.id]: 'No missing controls found in manual' }));
      }
      fetchDevices(); // Refresh from Blob
    } catch (err) {
      setAuditResult(prev => ({ ...prev, [issue.id]: `Error: ${(err as Error).message}` }));
    }
    setAuditRunning(null);
  };

  const handleAddAndSend = async (deviceId: string, issueId: string) => {
    const findings = auditFindings[issueId];
    if (!findings?.length) return;
    setAuditRunning(issueId);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/audit-controls/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controls: findings, issueId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add controls');
      setAuditResult(prev => ({ ...prev, [issueId]: `✓ ${data.controlsAdded} controls added and sent to contractor` }));
      setAuditFindings(prev => { const next = { ...prev }; delete next[issueId]; return next; });
      fetchDevices(); // Refresh to show updated status
    } catch (err) {
      setAuditResult(prev => ({ ...prev, [issueId]: `Error: ${(err as Error).message}` }));
    }
    setAuditRunning(null);
  };

  const handleCancelAudit = async (deviceId: string, issueId: string) => {
    if (!window.confirm('Cancel this audit? It will stop the running Claude agent and you\'ll lose any progress so far.')) return;
    try {
      await fetch(`/api/pipeline/${deviceId}/audit-controls?issueId=${encodeURIComponent(issueId)}`, {
        method: 'DELETE',
      });
    } catch { /* best effort — server-side state will reconcile */ }
    setAuditRunning(null);
    setAuditResult(prev => ({ ...prev, [issueId]: 'Audit cancelled' }));
    fetchDevices();
  };

  const handleDismissIssue = async (deviceId: string, issueId: string) => {
    if (!window.confirm('Dismiss this issue? It will be marked resolved without action and removed from the open issues list.')) return;
    try {
      const issues = deviceIssues[deviceId] ?? [];
      const updated = issues.map(i => i.id === issueId ? { ...i, status: 'resolved' as const, resolution: 'Dismissed by admin' } : i);
      await fetch(`/api/hosted/panels/${deviceId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _replace: true, issues: updated }),
      });
      setDeviceIssues(prev => ({ ...prev, [deviceId]: updated }));
    } catch { /* best effort */ }
  };

  // ── History Actions ───────────────────────────────────────────────────────

  const fetchHistory = async (did: string) => {
    try {
      const res = await fetch(`/api/hosted/panels/${did}/history`);
      const data = await res.json();
      setDeviceHistory(prev => ({ ...prev, [did]: Array.isArray(data) ? data : [] }));
    } catch { /* ignore */ }
  };

  const handleRestore = async (did: string, url: string) => {
    if (!confirm('Restore this backup? Current manifest will be backed up first.')) return;
    setRestoring(did);
    try {
      const res = await fetch(`/api/hosted/panels/${did}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Restore failed');
      setResult(prev => ({ ...prev, [did]: '✓ Restored from backup' }));
      fetchDevices();
    } catch (err) {
      setResult(prev => ({ ...prev, [did]: `✗ ${(err as Error).message}` }));
    }
    setRestoring(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return null;

  const isEmpty = devices.length === 0;
  const needsReview = devices.filter(d => d.status === 'submitted').length;
  const sorted = [...devices].sort((a, b) => {
    const order: Record<string, number> = { submitted: 0, 'in-progress': 1, ready: 2, approved: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mb-10"
    >
      {/* Header with badge */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Contractor Submissions</h2>
        {needsReview > 0 && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            {needsReview} needs review
          </span>
        )}
      </div>

      {/* Alert banner */}
      {needsReview > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 mb-3 flex items-center gap-2">
          <span className="text-amber-400 text-sm">⚠</span>
          <span className="text-sm text-amber-300">
            {needsReview === 1 ? 'A panel is ready for your review' : `${needsReview} panels are ready for your review`}
          </span>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-lg border border-gray-800 bg-[#111122] px-4 py-6 text-center">
          <p className="text-sm text-gray-500">No instruments sent to contractor yet</p>
          <p className="text-xs text-gray-600 mt-1">Use "Send to Contractor" on a pipeline detail page to get started</p>
        </div>
      )}

      {/* Device list */}
      <div className="flex flex-col gap-2">
        {sorted.map((d) => {
          const style = STATUS_LABELS[d.status] ?? STATUS_LABELS.ready;
          const label = getLabel(d);
          const isSubmitted = d.status === 'submitted';
          const isApproved = d.status === 'approved';

          return (
            <div
              key={d.deviceId}
              className={`rounded-lg border px-4 py-3 ${
                isSubmitted ? 'border-amber-600/40 bg-amber-900/10' : 'border-gray-800 bg-[#111122]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <div>
                    <span className="text-sm font-medium text-gray-200">
                      {d.manufacturer} {d.deviceName}
                    </span>
                    <p className={`text-[10px] ${style.text}`}>{label}</p>
                    {d.contractorNote && d.status === 'submitted' && (() => {
                      const submitEvent = [...(d.events ?? [])].reverse().find(e => e.type === 'submitted');
                      return (
                        <p className="text-[11px] text-blue-400/70 mt-0.5">
                          Contractor{submitEvent ? ` (${new Date(submitEvent.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}: {d.contractorNote}
                        </p>
                      );
                    })()}
                    {d.adminNote && d.status === 'in-progress' && (() => {
                      const reviewEvent = [...(d.events ?? [])].reverse().find(e => e.type === 'changes-requested');
                      return (
                        <p className="text-[11px] text-amber-400/70 mt-0.5">
                          Your feedback{reviewEvent ? ` (${new Date(reviewEvent.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}: {d.adminNote}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {result[d.deviceId] && (
                    <span className={`text-[10px] ${result[d.deviceId].startsWith('✓') ? 'text-green-400' : result[d.deviceId].startsWith('↩') ? 'text-amber-400' : 'text-red-400'}`}>
                      {result[d.deviceId]}
                    </span>
                  )}

                  {/* Pull & Review — pulls contractor's latest from Blob then opens editor */}
                  <button
                    onClick={() => handleReview(d.deviceId)}
                    disabled={acting === d.deviceId}
                    className={`rounded px-3 py-1.5 text-[10px] font-medium transition-colors disabled:opacity-50 ${
                      isSubmitted
                        ? 'border border-amber-600 bg-amber-700/30 text-amber-300 hover:bg-amber-700/50'
                        : 'border border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    title="Pull contractor's latest edits from Blob, then open editor"
                  >
                    {acting === d.deviceId ? 'Pulling...' : isSubmitted ? 'Pull & Review' : 'Pull Latest'}
                  </button>

                  {/* Open Editor — opens with local state, no Blob pull */}
                  <button
                    onClick={() => handleOpenEditor(d.deviceId)}
                    className="rounded px-3 py-1.5 text-[10px] font-medium border border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                    title="Open editor with local state — won't overwrite your edits"
                  >
                    Edit →
                  </button>

                  {/* Approve + Request Changes — submitted only */}
                  {isSubmitted && (
                    <>
                      <button
                        onClick={() => handleApprove(d.deviceId)}
                        disabled={acting === d.deviceId}
                        className="rounded border border-green-600 bg-green-700/30 px-3 py-1.5 text-[10px] font-medium text-green-300 hover:bg-green-700/50 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => { setFeedbackFor(d.deviceId); setFeedbackText(''); }}
                        disabled={acting === d.deviceId}
                        className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-[10px] font-medium text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                    </>
                  )}

                  {/* Pull & Build — approved only */}
                  {isApproved && (
                    <button
                      onClick={() => handlePullBuild(d.deviceId)}
                      disabled={acting === d.deviceId}
                      className="rounded border border-green-600 bg-green-700/30 px-3 py-1.5 text-[10px] font-medium text-green-300 hover:bg-green-700/50 transition-colors disabled:opacity-50"
                    >
                      Pull & Build Tutorials
                    </button>
                  )}
                </div>
              </div>

              {/* Inline issues section */}
              {(() => {
                const issues = (deviceIssues[d.deviceId] ?? []).filter(i => i.status !== 'resolved');
                if (issues.length === 0) return null;
                const isExpanded = expandedIssues.has(d.deviceId);
                return (
                  <>
                    <button
                      onClick={() => setExpandedIssues(prev => {
                        const next = new Set(prev);
                        next.has(d.deviceId) ? next.delete(d.deviceId) : next.add(d.deviceId);
                        return next;
                      })}
                      className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      <span>⚠</span>
                      <span>{issues.length} issue{issues.length > 1 ? 's' : ''} reported</span>
                      <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        {issues.map((issue) => (
                          <div key={issue.id} className="rounded border border-red-800/30 bg-red-900/10 px-3 py-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-medium text-red-400">
                                    {issue.type.replace('-', ' ')}
                                  </span>
                                  <span className="text-[9px] text-gray-500">
                                    {new Date(issue.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[12px] text-gray-300 whitespace-pre-wrap">{issue.description}</p>
                              </div>
                            </div>

                            {/* Audit running state (local OR Blob status) */}
                            {(auditRunning === issue.id || issue.status === 'investigating') && (
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-blue-400">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                                <span>Checking manual...</span>
                                <button
                                  onClick={() => handleCancelAudit(d.deviceId, issue.id)}
                                  className="ml-auto rounded border border-red-500/40 bg-red-900/20 px-2 py-0.5 text-[10px] font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors"
                                  title="Cancel this audit"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {/* Audit findings (from local state or Blob) */}
                            {((auditFindings[issue.id] && auditFindings[issue.id].length > 0) || issue.findings?.length) && (
                              <div className="mt-2 rounded border border-green-800/30 bg-green-900/10 px-3 py-2">
                                {(() => {
                                  const findings = auditFindings[issue.id] ?? issue.findings ?? [];
                                  const adds = findings.filter(f => f.action === 'add' || (!f.action && !f.details));
                                  const fixes = findings.filter(f => f.action === 'fix');
                                  const buttonLabel = adds.length > 0 && fixes.length > 0
                                    ? `Add ${adds.length} + Fix ${fixes.length} & Send`
                                    : adds.length > 0 ? `Add ${adds.length} & Send to Contractor`
                                    : `Fix ${fixes.length} & Send to Contractor`;
                                  return (
                                    <>
                                      {adds.length > 0 && (
                                        <>
                                          <p className="text-[11px] font-medium text-green-400 mb-1.5">Missing ({adds.length})</p>
                                          <div className="flex flex-wrap gap-1.5 mb-2">
                                            {adds.map((f) => (
                                              <span key={f.id} className="rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] text-green-300">
                                                {f.label} ({f.type})
                                              </span>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                      {fixes.length > 0 && (
                                        <>
                                          <p className="text-[11px] font-medium text-amber-400 mb-1.5">Needs fix ({fixes.length})</p>
                                          <div className="flex flex-wrap gap-1.5 mb-2">
                                            {fixes.map((f) => (
                                              <span key={f.id} className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300" title={f.details}>
                                                {f.id}: → {f.label} ({f.type})
                                              </span>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                      <button
                                        onClick={() => handleAddAndSend(d.deviceId, issue.id)}
                                        disabled={auditRunning === issue.id}
                                        className="rounded bg-green-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                                      >
                                        {buttonLabel}
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Audit result message (local state or Blob resolution) */}
                            {!auditFindings[issue.id]?.length && !issue.findings?.length && auditRunning !== issue.id && issue.status !== 'investigating' && (auditResult[issue.id] || issue.resolution) && (
                              <p className={`mt-2 text-[11px] ${(auditResult[issue.id] ?? '').startsWith('✓') ? 'text-green-400' : (auditResult[issue.id] ?? '').startsWith('Error') ? 'text-red-400' : 'text-gray-400'}`}>
                                {auditResult[issue.id] || issue.resolution}
                              </p>
                            )}

                            {/* Action buttons */}
                            {auditRunning !== issue.id && issue.status !== 'investigating' && !auditFindings[issue.id]?.length && !issue.findings?.length && (
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleRunAudit(d.deviceId, issue)}
                                  className="rounded border border-blue-600/40 bg-blue-700/20 px-2.5 py-1 text-[10px] font-medium text-blue-300 hover:bg-blue-700/40 transition-colors"
                                >
                                  Run Audit
                                </button>
                                <button
                                  onClick={() => handleDismissIssue(d.deviceId, issue.id)}
                                  className="rounded border border-gray-700 px-2.5 py-1 text-[10px] text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* History section */}
              <button
                onClick={() => {
                  const next = new Set(expandedHistory);
                  if (next.has(d.deviceId)) {
                    next.delete(d.deviceId);
                  } else {
                    next.add(d.deviceId);
                    fetchHistory(d.deviceId);
                  }
                  setExpandedHistory(next);
                }}
                className="mt-2 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                History {expandedHistory.has(d.deviceId) ? '▾' : '▸'}
              </button>

              {expandedHistory.has(d.deviceId) && (
                <div className="mt-1.5 space-y-1">
                  {(deviceHistory[d.deviceId] ?? []).length === 0 ? (
                    <p className="text-[10px] text-gray-600">No backups yet</p>
                  ) : (
                    (deviceHistory[d.deviceId] ?? []).map((h) => (
                      <div key={h.name} className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500">
                          {new Date(h.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          <span className="text-gray-600 ml-1">({Math.round(h.sizeBytes / 1024)}KB)</span>
                        </span>
                        <button
                          onClick={() => handleRestore(d.deviceId, h.url)}
                          disabled={restoring === d.deviceId}
                          className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                        >
                          Restore
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback modal */}
      {feedbackFor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setFeedbackFor(null)}>
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#111122] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-200 mb-1">Request Changes</h3>
            <p className="text-xs text-gray-500 mb-4">
              Describe what the contractor needs to fix — be specific about controls, alignment, labels, or any issues.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={"Example:\n- Zone buttons aren't aligned horizontally\n- SCENE CTRL label should be hidden\n- Cursor up/down need arrow icons\n- Value dial is too far right"}
              rows={8}
              autoFocus
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setFeedbackFor(null)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendFeedback(feedbackFor)}
                disabled={!feedbackText.trim() || acting === feedbackFor}
                className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {acting === feedbackFor ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
