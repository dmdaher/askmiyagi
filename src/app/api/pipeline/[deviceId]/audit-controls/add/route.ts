import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';
import { initDevice, getDeviceIssues, putDeviceIssues } from '@/lib/hosted-storage';

/**
 * POST /api/pipeline/{deviceId}/audit-controls/add
 *
 * Injects missing controls into manifest-editor.json and re-sends
 * to Vercel Blob so the contractor sees them in the editor.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();
  const { controls, issueId } = body as {
    controls: Array<{ id: string; label: string; type: string; section?: string }>;
    issueId?: string;
  };

  if (!Array.isArray(controls) || controls.length === 0) {
    return NextResponse.json({ error: 'No controls provided' }, { status: 400 });
  }

  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  // Read current manifest-editor.json
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');
  if (!fs.existsSync(editorPath)) {
    return NextResponse.json({ error: 'No editor manifest found' }, { status: 404 });
  }

  const manifest = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));

  // Get existing control IDs to avoid duplicates
  const existingIds = new Set<string>();
  if (Array.isArray(manifest.controls)) {
    for (const c of manifest.controls) existingIds.add(c.id);
  } else if (manifest.controls && typeof manifest.controls === 'object') {
    for (const id of Object.keys(manifest.controls)) existingIds.add(id);
  }

  // Add new controls (skip duplicates)
  const added: string[] = [];
  for (const ctrl of controls) {
    if (existingIds.has(ctrl.id)) continue;

    const newControl = {
      id: ctrl.id,
      label: ctrl.label,
      type: ctrl.type,
      x: 0,
      y: 0,
      w: 40,
      h: 40,
      sectionId: ctrl.section ?? '',
      locked: false,
      labelPosition: ctrl.type === 'pad' ? 'on-button' : 'above',
    };

    if (Array.isArray(manifest.controls)) {
      manifest.controls.push(newControl);
    } else {
      manifest.controls[ctrl.id] = newControl;
    }
    added.push(ctrl.id);
  }

  if (added.length === 0) {
    return NextResponse.json({ ok: true, controlsAdded: 0, message: 'All controls already exist' });
  }

  // Save updated manifest locally
  manifest._source = 'editor';
  fs.writeFileSync(editorPath, JSON.stringify(manifest, null, 2));

  // Re-send to Blob with admin note
  const adminNote = `Added ${added.length} controls from audit: ${added.join(', ')}`;
  const deviceName = state.deviceName || deviceId;
  const manufacturer = state.manufacturer || '';

  await initDevice(deviceId, deviceName, manufacturer, manifest, { adminNote });

  // Mark issue as resolved in Blob if provided
  if (issueId) {
    try {
      const issues = await getDeviceIssues(deviceId);
      const updated = issues.map(issue =>
        issue.id === issueId
          ? { ...issue, status: 'resolved' as const, resolution: adminNote }
          : issue
      );
      await putDeviceIssues(deviceId, updated);
    } catch { /* ignore — issue resolution is best-effort */ }
  }

  return NextResponse.json({
    ok: true,
    controlsAdded: added.length,
    controlIds: added,
    sentToContractor: true,
    adminNote,
  });
}
