'use client';

import { useEffect, useState, useCallback } from 'react';

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
}

interface IssuesPanelProps {
  deviceId: string;
}

export default function IssuesPanel({ deviceId }: IssuesPanelProps) {
  const [issues, setIssues] = useState<DeviceIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditRunning, setAuditRunning] = useState<string | null>(null);
  const [auditFindings, setAuditFindings] = useState<Record<string, AuditFinding[]>>({});
  const [auditResult, setAuditResult] = useState<Record<string, string>>({});

  const fetchIssues = useCallback(() => {
    fetch(`/api/hosted/panels/${deviceId}/issues`)
      .then(r => r.ok ? r.json() : [])
      .then((data: DeviceIssue[]) => { setIssues(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [deviceId]);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 30000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleRunAudit = async (issue: DeviceIssue) => {
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
      if (data.findings?.length > 0) {
        setAuditFindings(prev => ({ ...prev, [issue.id]: data.findings }));
        setAuditResult(prev => ({ ...prev, [issue.id]: `Found ${data.findings.length} missing controls` }));
      } else {
        setAuditResult(prev => ({ ...prev, [issue.id]: 'No missing controls found in manual' }));
      }
      fetchIssues(); // Refresh from Blob
    } catch (err) {
      setAuditResult(prev => ({ ...prev, [issue.id]: `Error: ${(err as Error).message}` }));
    }
    setAuditRunning(null);
  };

  const handleAddAndSend = async (issueId: string) => {
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
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setAuditResult(prev => ({ ...prev, [issueId]: `✓ ${data.controlsAdded} controls added & sent` }));
      setAuditFindings(prev => { const next = { ...prev }; delete next[issueId]; return next; });
      fetchIssues();
    } catch (err) {
      setAuditResult(prev => ({ ...prev, [issueId]: `Error: ${(err as Error).message}` }));
    }
    setAuditRunning(null);
  };

  const handleCancelAudit = async (issueId: string) => {
    if (!window.confirm('Cancel this audit? It will stop the running Claude agent and you\'ll lose any progress so far.')) return;
    try {
      await fetch(`/api/pipeline/${deviceId}/audit-controls?issueId=${encodeURIComponent(issueId)}`, {
        method: 'DELETE',
      });
    } catch { /* best effort — server-side state will reconcile */ }
    setAuditRunning(null);
    setAuditResult(prev => ({ ...prev, [issueId]: 'Audit cancelled' }));
    fetchIssues();
  };

  const handleDismiss = async (issueId: string) => {
    const updated = issues.map(i => i.id === issueId ? { ...i, status: 'resolved' as const, resolution: 'Dismissed' } : i);
    setIssues(updated);
    try {
      await fetch(`/api/hosted/panels/${deviceId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _replace: true, issues: updated }),
      });
    } catch { /* best effort */ }
  };

  // Load findings from Blob into local state on fetch
  useEffect(() => {
    const blobFindings: Record<string, AuditFinding[]> = {};
    for (const issue of issues) {
      if (issue.findings?.length) {
        blobFindings[issue.id] = issue.findings;
      }
    }
    if (Object.keys(blobFindings).length > 0) {
      setAuditFindings(prev => ({ ...prev, ...blobFindings }));
    }
  }, [issues]);

  const openIssues = issues.filter(i => i.status !== 'resolved');

  if (loading) return null;

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--foreground, #e0e0e0)' }}
        >
          Issues
        </h3>
        <div className="flex items-center gap-2">
          {openIssues.length > 0 && (
            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
              {openIssues.length}
            </span>
          )}
          <button
            onClick={fetchIssues}
            className="rounded px-1.5 py-0.5 text-[9px] text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            title="Refresh issues"
          >
            ↻
          </button>
        </div>
      </div>

      {openIssues.length === 0 ? (
        <p className="text-[11px] text-gray-500">No open issues</p>
      ) : (
        <div className="space-y-2">
          {openIssues.map((issue) => (
            <div key={issue.id} className="rounded border border-red-800/30 bg-red-900/10 px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-medium text-red-400">
                  {issue.type.replace('-', ' ')}
                </span>
                <span className="text-[9px] text-gray-500">
                  {new Date(issue.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 whitespace-pre-wrap mb-2">{issue.description}</p>

              {/* Audit running (local state or Blob status) */}
              {(auditRunning === issue.id || issue.status === 'investigating') && (
                <div className="flex items-center gap-2 text-[11px] text-blue-400 mb-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  <span>Checking manual...</span>
                  <button
                    onClick={() => handleCancelAudit(issue.id)}
                    className="ml-auto rounded border border-red-500/40 bg-red-900/20 px-2 py-0.5 text-[10px] font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors"
                    title="Cancel this audit"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Audit findings */}
              {auditFindings[issue.id]?.length > 0 && (
                <div className="rounded border border-green-800/30 bg-green-900/10 px-2 py-1.5 mb-2">
                  <p className="text-[10px] font-medium text-green-400 mb-1">
                    Found {auditFindings[issue.id].length} controls
                  </p>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {auditFindings[issue.id].map((f) => (
                      <span key={f.id} className="rounded bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 text-[9px] text-green-300">
                        {f.label}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddAndSend(issue.id)}
                    disabled={auditRunning === issue.id}
                    className="rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                  >
                    Add & Send to Contractor
                  </button>
                </div>
              )}

              {/* Result message (local state or Blob resolution) */}
              {!auditFindings[issue.id]?.length && !issue.findings?.length && auditRunning !== issue.id && issue.status !== 'investigating' && (auditResult[issue.id] || issue.resolution) && (
                <p className={`text-[10px] mb-2 ${(auditResult[issue.id] ?? '').startsWith('✓') ? 'text-green-400' : (auditResult[issue.id] ?? '').startsWith('Error') ? 'text-red-400' : 'text-gray-400'}`}>
                  {auditResult[issue.id] || issue.resolution}
                </p>
              )}

              {/* Action buttons */}
              {auditRunning !== issue.id && issue.status !== 'investigating' && !auditFindings[issue.id]?.length && !issue.findings?.length && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunAudit(issue)}
                    className="rounded border border-blue-600/40 bg-blue-700/20 px-2 py-0.5 text-[10px] font-medium text-blue-300 hover:bg-blue-700/40 transition-colors"
                  >
                    Run Audit
                  </button>
                  <button
                    onClick={() => handleDismiss(issue.id)}
                    className="rounded border border-gray-700 px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-800 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
