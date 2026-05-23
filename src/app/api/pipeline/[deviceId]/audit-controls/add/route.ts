import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';
import { initDevice, getDeviceIssues, putDeviceIssues, backupManifest } from '@/lib/hosted-storage';

/**
 * POST /api/pipeline/{deviceId}/audit-controls/add
 *
 * Applies audit findings to manifest-editor.json:
 * - action "add": injects missing controls at (0,0)
 * - action "fix": updates existing control label/type + matching editorLabel
 *
 * Then re-sends to Vercel Blob so the contractor sees the changes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();
  const { controls, issueId } = body as {
    controls: Array<{ id: string; label: string; type: string; section?: string; action?: 'add' | 'fix'; details?: string }>;
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

  // Build lookup for existing controls
  const controlsArray = Array.isArray(manifest.controls);
  const existingIds = new Set<string>();
  if (controlsArray) {
    for (const c of manifest.controls) existingIds.add(c.id);
  } else if (manifest.controls && typeof manifest.controls === 'object') {
    for (const id of Object.keys(manifest.controls)) existingIds.add(id);
  }

  const added: string[] = [];
  const fixed: string[] = [];

  for (const ctrl of controls) {
    const action = ctrl.action ?? (existingIds.has(ctrl.id) ? 'fix' : 'add');

    if (action === 'add' && !existingIds.has(ctrl.id)) {
      // Add new control at default position
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

      if (controlsArray) {
        manifest.controls.push(newControl);
      } else {
        manifest.controls[ctrl.id] = newControl;
      }

      // Create editorLabel so the control's label is visible in the editor
      if (Array.isArray(manifest.editorLabels)) {
        manifest.editorLabels.push({
          text: ctrl.label,
          controlId: ctrl.id,
          x: 0,
          y: -15,
          w: Math.max(ctrl.label.length * 7, 40),
          h: 14,
          fontSize: 9,
        });
      }

      added.push(ctrl.id);

    } else if (action === 'fix' && existingIds.has(ctrl.id)) {
      // Update existing control's label and/or type
      if (controlsArray) {
        const existing = manifest.controls.find((c: { id: string }) => c.id === ctrl.id);
        if (existing) {
          if (ctrl.label) existing.label = ctrl.label;
          if (ctrl.type) existing.type = ctrl.type;
        }
      } else {
        const existing = manifest.controls[ctrl.id];
        if (existing) {
          if (ctrl.label) existing.label = ctrl.label;
          if (ctrl.type) existing.type = ctrl.type;
        }
      }

      // Also update matching editorLabel (the floating text rendered over the control)
      if (ctrl.label && Array.isArray(manifest.editorLabels)) {
        for (const el of manifest.editorLabels) {
          if (el.controlId === ctrl.id) {
            el.text = ctrl.label;
          }
        }
      }

      fixed.push(ctrl.id);
    }
  }

  if (added.length === 0 && fixed.length === 0) {
    return NextResponse.json({ ok: true, controlsAdded: 0, controlsFixed: 0, message: 'No changes needed' });
  }

  // Also update production manifest if it exists
  const prodPath = path.join(process.cwd(), 'src', 'data', 'manifests', `${deviceId}.json`);
  if (fs.existsSync(prodPath)) {
    const prodManifest = JSON.parse(fs.readFileSync(prodPath, 'utf-8'));
    // Apply same fixes to production manifest
    const prodControlIds = new Set<string>();
    if (Array.isArray(prodManifest.controls)) {
      for (const c of prodManifest.controls) prodControlIds.add(c.id);
    }
    for (const ctrl of controls) {
      const action = ctrl.action ?? (prodControlIds.has(ctrl.id) ? 'fix' : 'add');
      if (action === 'fix') {
        // Fix control label
        if (Array.isArray(prodManifest.controls)) {
          const existing = prodManifest.controls.find((c: { id: string }) => c.id === ctrl.id);
          if (existing && ctrl.label) existing.label = ctrl.label;
          if (existing && ctrl.type) existing.type = ctrl.type;
        }
        // Fix editorLabel
        if (ctrl.label && Array.isArray(prodManifest.editorLabels)) {
          for (const el of prodManifest.editorLabels) {
            if (el.controlId === ctrl.id) el.text = ctrl.label;
          }
        }
      }
    }
    fs.writeFileSync(prodPath, JSON.stringify(prodManifest, null, 2) + '\n');
  }

  // Save updated manifest locally
  manifest._source = 'editor';
  fs.writeFileSync(editorPath, JSON.stringify(manifest, null, 2));

  // Build admin note
  const parts: string[] = [];
  if (added.length > 0) parts.push(`Added ${added.length}: ${added.join(', ')}`);
  if (fixed.length > 0) parts.push(`Fixed ${fixed.length}: ${fixed.join(', ')}`);
  const adminNote = `Audit: ${parts.join('. ')}`;

  // Backup contractor's current manifest before overwriting
  await backupManifest(deviceId);

  // Re-send to Blob
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
    controlsFixed: fixed.length,
    addedIds: added,
    fixedIds: fixed,
    sentToContractor: true,
    adminNote,
  });
}
