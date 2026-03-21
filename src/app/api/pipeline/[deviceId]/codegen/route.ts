import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/pipeline/{deviceId}/codegen
 *
 * Before running codegen:
 * 1. If manifest-editor.json exists, merge editor positions into manifest.json
 * 2. This ensures codegen uses the contractor's positioning work
 *
 * Then runs: npx tsx scripts/panel-codegen.ts {deviceId}
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);

  try {
    // Merge editor positions into manifest before codegen
    const editorPath = path.join(pipelineDir, 'manifest-editor.json');
    const manifestPath = path.join(pipelineDir, 'manifest.json');

    if (fs.existsSync(editorPath) && fs.existsSync(manifestPath)) {
      const editorData = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // The editor stores flat Records: { sections: Record<id, SectionDef>, controls: Record<id, ControlDef> }
      // The manifest has arrays: { sections: ManifestSection[], controls: ManifestControl[] }
      // Merge: update manifest control/section positions from editor data

      if (editorData.sections && editorData.controls) {
        const editorSections = editorData.sections as Record<string, any>;
        const editorControls = editorData.controls as Record<string, any>;

        // Update section bounding boxes from editor positions
        // Editor uses pixel coords, manifest uses percentages
        // We need to know the canvas size to convert back
        const canvasW = 1200; // CANVAS_BASE_W
        const canvasH = 1650; // CANVAS_BASE_H — or use deviceDimensions if available

        if (manifest.deviceDimensions) {
          const aspect = manifest.deviceDimensions.widthMm / manifest.deviceDimensions.depthMm;
          // canvasH would be CANVAS_BASE_W / aspect
        }

        for (const section of manifest.sections) {
          const editorSection = editorSections[section.id];
          if (editorSection) {
            // Convert pixel coords back to percentages
            section.panelBoundingBox = {
              x: Math.round((editorSection.x / canvasW) * 100 * 10) / 10,
              y: Math.round((editorSection.y / canvasH) * 100 * 10) / 10,
              w: Math.round((editorSection.w / canvasW) * 100 * 10) / 10,
              h: Math.round((editorSection.h / canvasH) * 100 * 10) / 10,
            };
          }
        }

        // Update control enriched fields from editor (in case contractor changed type, shape, etc.)
        for (const control of manifest.controls) {
          const editorControl = editorControls[control.id];
          if (editorControl) {
            // Merge editor overrides back into manifest control
            if (editorControl.shape) control.shape = editorControl.shape;
            if (editorControl.surfaceColor !== undefined) control.surfaceColor = editorControl.surfaceColor;
            if (editorControl.buttonStyle) control.buttonStyle = editorControl.buttonStyle;
            if (editorControl.labelDisplay) control.labelDisplay = editorControl.labelDisplay;
            if (editorControl.icon !== undefined) control.icon = editorControl.icon;
            if (editorControl.label) control.verbatimLabel = editorControl.label;
            if (editorControl.secondaryLabel !== undefined) control.secondaryLabel = editorControl.secondaryLabel;
            if (editorControl.ledVariant) control.ledVariant = editorControl.ledVariant;
            if (editorControl.ledColor !== undefined) control.ledColor = editorControl.ledColor;
            if (editorControl.hasLed !== undefined) control.hasLed = editorControl.hasLed;
            if (editorControl.type) control.type = editorControl.type;
          }
        }

        // Write the merged manifest back (backup the original first)
        const backupDir = path.join(pipelineDir, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        fs.copyFileSync(manifestPath, path.join(backupDir, `manifest-pre-codegen-${timestamp}.json`));

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`Merged editor positions into manifest.json`);
      }
    }

    // Run codegen
    const output = execSync(
      `npx tsx scripts/panel-codegen.ts ${deviceId}`,
      {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60_000,
      }
    );

    return NextResponse.json({
      ok: true,
      output: output.toString(),
    });
  } catch (err) {
    const error = err as Error & { stdout?: Buffer; stderr?: Buffer };
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';

    return NextResponse.json(
      {
        error: 'Codegen failed',
        details: error.message,
        stdout,
        stderr,
      },
      { status: 500 }
    );
  }
}
