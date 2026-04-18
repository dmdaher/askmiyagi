import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';
import { invokeAgent } from '@/lib/pipeline/runner';
import { getDeviceIssues, putDeviceIssues } from '@/lib/hosted-storage';

// Allow up to 5 minutes for the audit agent to run
export const maxDuration = 300;

/**
 * POST /api/pipeline/{deviceId}/audit-controls
 *
 * Spawns a read-only agent to check the manual for missing controls.
 * The agent reads the manual PDFs and cross-references against the
 * current manifest-editor.json to identify controls that exist in the
 * manual but are absent from the manifest.
 *
 * This runs on localhost only (requires Claude CLI + local files).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();
  const { description, issueId } = body as { description: string; issueId?: string };

  if (!description || description.trim().length < 5) {
    return NextResponse.json({ error: 'Description is required (min 5 chars)' }, { status: 400 });
  }

  // Mark issue as 'investigating' in Blob so both panels see it
  if (issueId) {
    try {
      const issues = await getDeviceIssues(deviceId);
      const updated = issues.map(i => i.id === issueId ? { ...i, status: 'investigating' as const } : i);
      await putDeviceIssues(deviceId, updated);
    } catch { /* best effort */ }
  }

  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  // Find manual PDFs
  const manualPaths = state.manualPaths ?? [];
  if (manualPaths.length === 0) {
    return NextResponse.json({ error: 'No manual PDFs available for this device' }, { status: 400 });
  }

  // Read current manifest to give the agent context
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
  const editorManifestPath = path.join(pipelineDir, 'manifest-editor.json');
  let currentControlIds: string[] = [];
  if (fs.existsSync(editorManifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(editorManifestPath, 'utf-8'));
      const controls = manifest.controls;
      if (Array.isArray(controls)) {
        currentControlIds = controls.map((c: { id: string }) => c.id);
      } else if (controls && typeof controls === 'object') {
        currentControlIds = Object.keys(controls);
      }
    } catch { /* ignore parse errors */ }
  }

  const manualPathsList = manualPaths.map((p: string) => path.resolve(p)).filter((p: string) => fs.existsSync(p));
  if (manualPathsList.length === 0) {
    return NextResponse.json({ error: 'Manual PDF files not found on disk' }, { status: 400 });
  }

  try {
    const prompt = `You are auditing the control manifest for "${state.deviceName}" by ${state.manufacturer}.

A contractor reports: "${description.trim()}"

Your task:
1. Read the manual PDF(s) to verify whether the reported controls exist on the real hardware.
2. Cross-reference against the current manifest controls to confirm they are missing.

Manual PDF location(s):
${manualPathsList.map((p: string) => `- ${p}`).join('\n')}

Current manifest controls (${currentControlIds.length} total):
${currentControlIds.join(', ')}

For EACH confirmed missing control, output a JSON array at the end of your response in a code block:
\`\`\`json
[
  { "id": "control-id", "label": "LABEL TEXT", "type": "button|knob|slider|pad|wheel|encoder|dial|lever", "manualPage": "page number or range", "section": "which section it belongs to" }
]
\`\`\`

Rules:
- Only include controls you CONFIRMED exist in the manual
- Use kebab-case for IDs (e.g., "zone-1", "pitch-bend")
- Use the exact label text from the manual
- If you cannot confirm the controls exist, return an empty array: []
- Do NOT invent controls that aren't in the manual`;

    const result = await invokeAgent({
      prompt,
      deviceId,
      phase: 'phase-4-audit' as any,
      agent: 'control-auditor',
      cwd: process.cwd(),
      allowedTools: ['Read', 'Glob', 'Grep'],
      maxBudgetPerInvocation: 2,
    });

    // Parse findings from agent output — look for JSON array in code block
    let findings: Array<{ id: string; label: string; type: string; manualPage?: string; section?: string }> = [];
    const jsonMatch = result.output.match(/```json\s*\n(\[[\s\S]*?\])\s*\n```/);
    if (jsonMatch) {
      try {
        findings = JSON.parse(jsonMatch[1]);
      } catch { /* couldn't parse — leave empty */ }
    }

    // Filter out any controls already in the manifest
    findings = findings.filter(f => !currentControlIds.includes(f.id));

    // Save findings to Blob issue so both panels can display them
    if (issueId) {
      try {
        const issues = await getDeviceIssues(deviceId);
        const updated = issues.map(i => i.id === issueId ? {
          ...i,
          status: (findings.length > 0 ? 'open' : 'resolved') as 'open' | 'resolved',
          findings: findings.length > 0 ? findings : undefined,
          resolution: findings.length === 0 ? 'Audit found no missing controls' : undefined,
        } : i);
        await putDeviceIssues(deviceId, updated);
      } catch { /* best effort */ }
    }

    return NextResponse.json({
      ok: true,
      findings,
      costUsd: result.costEntry?.costUsd ?? 0,
      agentOutput: result.output.substring(0, 2000), // Truncated for debugging
    });
  } catch (err) {
    // On failure, reset issue status back to open
    if (issueId) {
      try {
        const issues = await getDeviceIssues(deviceId);
        const updated = issues.map(i => i.id === issueId ? { ...i, status: 'open' as const } : i);
        await putDeviceIssues(deviceId, updated);
      } catch { /* best effort */ }
    }
    return NextResponse.json(
      { error: 'Audit agent failed', details: (err as Error).message },
      { status: 500 },
    );
  }
}
