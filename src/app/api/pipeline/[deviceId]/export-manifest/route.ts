import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/pipeline/{deviceId}/export-manifest
 *
 * Reads manifest-editor.json (editor's saved state) and writes a
 * production-ready PanelManifest JSON to src/data/manifests/{deviceId}.json.
 * Replaces the old codegen flow — no TSX generation, just JSON export.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');
  const mainManifestPath = path.join(pipelineDir, 'manifest.json');

  if (!fs.existsSync(editorPath)) {
    return NextResponse.json({ error: 'No editor manifest found' }, { status: 404 });
  }

  try {
    const editorData = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
    // Read main manifest for fields the editor doesn't store (groupLabels, etc.)
    const mainManifest = fs.existsSync(mainManifestPath)
      ? JSON.parse(fs.readFileSync(mainManifestPath, 'utf-8'))
      : {};

    const sections = editorData.sections ?? {};
    const controls = editorData.controls ?? {};
    const scale = editorData.controlScale ?? 1;

    // Build PanelManifest shape
    const sectionList = typeof sections === 'object' && !Array.isArray(sections)
      ? Object.values(sections)
      : sections;
    const controlList = typeof controls === 'object' && !Array.isArray(controls)
      ? Object.values(controls)
      : controls;

    const manifest = {
      deviceId: editorData.deviceId ?? mainManifest.deviceId ?? deviceId,
      deviceName: editorData.deviceName ?? mainManifest.deviceName ?? deviceId,
      manufacturer: editorData.manufacturer ?? mainManifest.manufacturer ?? '',
      panelWidth: editorData.canvasWidth ?? 1200,
      panelHeight: editorData.canvasHeight ?? 1650,
      controlScale: scale,
      keyboard: editorData.keyboard ?? mainManifest.keyboard ?? null,
      editorSections: (sectionList as any[]).map((s: any) => ({
        id: s.id,
        headerLabel: s.headerLabel ?? undefined,
        frameMode: s.frameMode,
        hidden: s.hidden,
        x: s.x, y: s.y, w: s.w, h: s.h,
      })),
      controls: (controlList as any[]).map((c: any) => {
        const ctrl: Record<string, any> = {
          id: c.id,
          type: c.type,
          label: c.label ?? '',
          editorPosition: { x: c.x, y: c.y, w: c.w, h: c.h },
        };
        // Copy optional fields
        for (const field of [
          'shape', 'surfaceColor', 'buttonStyle', 'labelPosition', 'labelDisplay',
          'icon', 'secondaryLabel', 'ledVariant', 'ledColor', 'hasLed', 'ledPosition',
          'nestedIn', 'encoderHasPush', 'positions', 'positionLabels', 'rotation',
          'ledStyle', 'labelFontSize', 'zOrder', 'ledBehavior', 'labelAlign', 'labelColor',
        ]) {
          if (c[field] != null) ctrl[field] = c[field];
        }
        return ctrl;
      }),
      editorLabels: (editorData.editorLabels ?? []).map((l: any) => ({
        id: l.id,
        text: l.text,
        icon: l.icon ?? undefined,
        x: l.x, y: l.y,
        w: l.w,
        fontSize: l.fontSize,
        align: l.align ?? 'center',
        hidden: l.hidden ?? false,
        lineHeight: (l.fontSize ?? 8) + 2,
      })),
      groupLabels: mainManifest.groupLabels ?? [],
      controlContainers: editorData.controlContainers ?? [],
    };

    // Write to committed location
    const outputDir = path.join(process.cwd(), 'src', 'data', 'manifests');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${deviceId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    // Mark export as completed in pipeline state (for nav gating + pipeline continuation)
    try {
      const { readState, writeState } = await import('@/lib/pipeline/state-machine');
      const pState = readState(deviceId);
      if (pState) {
        (pState as any).codegenCompleted = true;
        writeState(deviceId, pState);
      }
    } catch { /* best effort */ }

    return NextResponse.json({
      ok: true,
      output: `Exported manifest to src/data/manifests/${deviceId}.json (${(controlList as any[]).length} controls, ${(sectionList as any[]).length} sections, ${manifest.editorLabels.length} labels)`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Export failed', details: (err as Error).message },
      { status: 500 },
    );
  }
}
