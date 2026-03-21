import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/pipeline/{deviceId}/inferred-layout
 *
 * Saves the inference results (from the layout inference engine)
 * to .pipeline/{deviceId}/inferred-layout.json.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  if (!body.sections || !Array.isArray(body.sections)) {
    return NextResponse.json(
      { error: 'Request body must contain a "sections" array.' },
      { status: 400 }
    );
  }

  const pipelineDir = path.join('.pipeline', deviceId);

  // Ensure the pipeline directory exists
  if (!fs.existsSync(pipelineDir)) {
    fs.mkdirSync(pipelineDir, { recursive: true });
  }

  const outputPath = path.join(pipelineDir, 'inferred-layout.json');

  try {
    fs.writeFileSync(outputPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true, path: outputPath });
  } catch {
    return NextResponse.json(
      { error: 'Failed to write inferred layout' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pipeline/{deviceId}/inferred-layout
 *
 * Reads the previously saved inference results.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const filePath = path.join('.pipeline', deviceId, 'inferred-layout.json');

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: 'No inferred layout found. Run inference first.' },
      { status: 404 }
    );
  }

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(
      { error: 'Failed to read inferred layout' },
      { status: 500 }
    );
  }
}
