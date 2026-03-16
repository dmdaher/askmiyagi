import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import {
  listPipelineRuns,
  readState,
  writeState,
  createInitialState,
  ensurePipelineDir,
} from '@/lib/pipeline/state-machine';
import { PipelineRunSummary } from '@/lib/pipeline/types';

export async function GET() {
  const deviceIds = listPipelineRuns();
  const summaries: PipelineRunSummary[] = [];

  for (const deviceId of deviceIds) {
    const state = readState(deviceId);
    if (!state) continue;
    summaries.push({
      deviceId: state.deviceId,
      deviceName: state.deviceName,
      manufacturer: state.manufacturer,
      currentPhase: state.currentPhase,
      status: state.status,
      totalCostUsd: state.totalCostUsd,
      totalActualCostUsd: state.totalActualCostUsd ?? 0,
      budgetCapUsd: state.budgetCapUsd,
      subscriptionResetsAt: state.subscription?.windowResetsAt ?? null,
      isUsingOverage: state.subscription?.isUsingOverage ?? false,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      activeEscalation: state.activeEscalation,
    });
  }

  return NextResponse.json(summaries);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deviceName = formData.get('deviceName') as string;
    const manufacturer = formData.get('manufacturer') as string;
    const budgetCapUsd = Number(formData.get('budgetCapUsd') ?? 50);
    const manualFiles = formData.getAll('manuals') as File[];

    if (!deviceName || !manufacturer) {
      return NextResponse.json({ error: 'deviceName and manufacturer are required' }, { status: 400 });
    }

    const deviceId = deviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = readState(deviceId);
    if (existing) {
      return NextResponse.json({ error: `Pipeline already exists for device: ${deviceId}` }, { status: 409 });
    }

    const manualPaths: string[] = [];
    if (manualFiles.length > 0) {
      const deviceDir = `docs/${manufacturer}/${deviceId}`;
      fs.mkdirSync(deviceDir, { recursive: true });
      for (const file of manualFiles) {
        if (!file.name) continue;
        const filePath = `${deviceDir}/${file.name}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        manualPaths.push(filePath);
      }
    }

    ensurePipelineDir(deviceId);
    const state = createInitialState({ deviceId, deviceName, manufacturer, manualPaths, budgetCapUsd });
    writeState(deviceId, state);

    return NextResponse.json({ deviceId, status: 'pending', manualPaths });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
