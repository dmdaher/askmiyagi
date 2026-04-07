import { NextRequest, NextResponse } from 'next/server';
import { getDeviceState } from '@/lib/hosted-storage';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/pipeline/{deviceId}/pull-from-hosted
 *
 * Local-only route: pulls the contractor's approved manifest from
 * hosted Blob and writes it to local manifest-editor.json.
 * Then the existing export-manifest + tutorial pipeline can proceed.
 * Server-side Blob SDK calls — no CORS issues.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  try {
    const state = await getDeviceState(deviceId);
    if (!state) {
      return NextResponse.json({ error: 'Device not found in hosted storage' }, { status: 404 });
    }

    // Write manifest to local filesystem
    const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
    if (!fs.existsSync(pipelineDir)) {
      fs.mkdirSync(pipelineDir, { recursive: true });
    }
    const editorPath = path.join(pipelineDir, 'manifest-editor.json');
    fs.writeFileSync(editorPath, JSON.stringify(state.manifest, null, 2));

    // Also run export-manifest to write production JSON
    const exportRes = await fetch(`http://localhost:3000/api/pipeline/${deviceId}/export-manifest`, {
      method: 'POST',
    });
    const exportOk = exportRes.ok;

    return NextResponse.json({
      ok: true,
      status: state.status,
      exported: exportOk,
      output: `Pulled manifest from hosted (status: ${state.status}). Local manifest-editor.json updated.${exportOk ? ' Production manifest exported.' : ''}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to pull from hosted', details: (err as Error).message },
      { status: 500 },
    );
  }
}
