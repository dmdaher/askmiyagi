/**
 * In-memory tracker for running audit subprocesses.
 *
 * Keyed by `${deviceId}:${issueId}`. Used by the audit-controls POST route
 * to register the spawned `claude` CLI's PID, and by the audit-controls
 * DELETE route to kill it for user-initiated cancellation.
 *
 * This is process-local state — it does NOT survive a server restart or
 * a Next.js dev-mode hot reload of this module. That is acceptable for
 * the admin-facing audit feature, which runs only on the local dev server
 * and is short-lived (audits complete in 1–5 minutes).
 */

const runningAudits = new Map<string, number>();

function key(deviceId: string, issueId: string): string {
  return `${deviceId}:${issueId}`;
}

export function trackAudit(deviceId: string, issueId: string, pid: number): void {
  runningAudits.set(key(deviceId, issueId), pid);
}

export function untrackAudit(deviceId: string, issueId: string): void {
  runningAudits.delete(key(deviceId, issueId));
}

export function getAuditPid(deviceId: string, issueId: string): number | undefined {
  return runningAudits.get(key(deviceId, issueId));
}

/**
 * Attempt to kill the running audit subprocess.
 * Returns true if a tracked PID existed and the kill signal was sent.
 * Returns false if no PID was tracked (audit already finished or never started).
 */
export function killAudit(deviceId: string, issueId: string): boolean {
  const k = key(deviceId, issueId);
  const pid = runningAudits.get(k);
  if (!pid) return false;
  try {
    // SIGTERM lets the claude CLI exit cleanly. If it ignores SIGTERM we'd
    // need SIGKILL, but in practice it shuts down immediately.
    process.kill(pid, 'SIGTERM');
  } catch {
    // Process may have already exited — treat as no longer tracked.
  }
  runningAudits.delete(k);
  return true;
}
