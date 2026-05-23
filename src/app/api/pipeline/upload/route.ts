import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { readState, writeState } from '@/lib/pipeline/state-machine';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deviceId = formData.get('deviceId') as string;
    const manualFiles = formData.getAll('manuals') as File[];

    if (!deviceId || manualFiles.length === 0) {
      return NextResponse.json({ error: 'deviceId and at least one manual file are required' }, { status: 400 });
    }

    const state = readState(deviceId);
    if (!state) {
      return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
    }

    const deviceDir = `docs/${state.manufacturer}/${deviceId}`;
    fs.mkdirSync(deviceDir, { recursive: true });

    const newPaths: string[] = [];
    for (const file of manualFiles) {
      if (!file.name) continue;
      const filePath = `${deviceDir}/${file.name}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      newPaths.push(filePath);
    }

    // Append to existing paths, avoiding duplicates
    for (const p of newPaths) {
      if (!state.manualPaths.includes(p)) {
        state.manualPaths.push(p);
      }
    }
    writeState(deviceId, state);

    return NextResponse.json({ manualPaths: state.manualPaths });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
