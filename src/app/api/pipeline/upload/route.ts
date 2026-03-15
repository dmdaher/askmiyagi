import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { readState, writeState } from '@/lib/pipeline/state-machine';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deviceId = formData.get('deviceId') as string;
    const manualFile = formData.get('manual') as File | null;

    if (!deviceId || !manualFile) {
      return NextResponse.json({ error: 'deviceId and manual file are required' }, { status: 400 });
    }

    const state = readState(deviceId);
    if (!state) {
      return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
    }

    const deviceDir = `docs/${state.manufacturer}/${deviceId}`;
    fs.mkdirSync(deviceDir, { recursive: true });
    const manualPath = `${deviceDir}/${manualFile.name}`;
    const buffer = Buffer.from(await manualFile.arrayBuffer());
    fs.writeFileSync(manualPath, buffer);

    state.manualPath = manualPath;
    writeState(deviceId, state);

    return NextResponse.json({ manualPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
