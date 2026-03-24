import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { SectionDef, ControlDef } from '@/components/panel-editor/store/manifestSlice';

/**
 * POST /api/pipeline/{deviceId}/codegen
 *
 * Before running codegen:
 * 1. Read manifest-editor.json (contractor's positions, already cleaned by editor on Approve)
 * 2. Update section bounding boxes in manifest.json from editor positions
 * 3. Merge editor overrides (shape, color, label, etc.) into manifest controls
 * 4. Write editorPosition percentages on each control
 * 5. Backup manifest.json, then write updated version
 * 6. Run codegen
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);

  try {
    const editorPath = path.join(pipelineDir, 'manifest-editor.json');
    const manifestPath = path.join(pipelineDir, 'manifest.json');

    if (fs.existsSync(editorPath) && fs.existsSync(manifestPath)) {
      const editorData = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      if (editorData.sections && editorData.controls) {
        const editorSections = editorData.sections as Record<string, SectionDef>;
        const editorControls = editorData.controls as Record<string, ControlDef>;

        // Determine canvas dimensions — use editor's saved canvas size if available.
        // The editor saves canvasWidth/canvasHeight alongside positions; positions were
        // created for THAT canvas size. Recomputing from deviceDimensions would mismatch
        // (e.g., CDJ-3000 editor used 1650 but deviceDimensions gives 1470).
        let canvasW = (editorData.canvasWidth as number) || 1200;
        let canvasH = (editorData.canvasHeight as number) || 1650;

        // ── Step 1: Use editor positions directly (cleanup already ran in the editor) ──
        // The editor applies geometry cleanup on Approve & Build, then auto-saves
        // the cleaned positions to manifest-editor.json. No need to run cleanup again.

        // Update section bounding boxes from editor section positions
        for (const section of manifest.sections) {
          const editorSection = editorSections[section.id];
          if (editorSection) {
            section.panelBoundingBox = {
              x: Math.round((editorSection.x / canvasW) * 100 * 10) / 10,
              y: Math.round((editorSection.y / canvasH) * 100 * 10) / 10,
              w: Math.round((editorSection.w / canvasW) * 100 * 10) / 10,
              h: Math.round((editorSection.h / canvasH) * 100 * 10) / 10,
            };
          }
        }

        // ── Step 2: Merge editor overrides + positions into controls ──
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

          // Use editor positions directly (already cleaned by the editor on Approve)
          if (editorControl) {
            (control as any).editorPosition = {
              x: Math.round((editorControl.x / canvasW) * 1000) / 10,
              y: Math.round((editorControl.y / canvasH) * 1000) / 10,
              w: Math.round((editorControl.w / canvasW) * 1000) / 10,
              h: Math.round((editorControl.h / canvasH) * 1000) / 10,
            };
          }
        }

        // ── Step 4: Backup manifest.json before overwriting ──
        const backupDir = path.join(pipelineDir, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        fs.copyFileSync(manifestPath, path.join(backupDir, `manifest-pre-codegen-${timestamp}.json`));

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`Merged cleaned editor positions into manifest.json`);
      }
    }

    // ── Step 5: Run codegen ──
    const codegenOutput = execSync(
      `npx tsx scripts/panel-codegen.ts ${deviceId}`,
      {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60_000,
      }
    );

    return NextResponse.json({
      ok: true,
      output: codegenOutput.toString(),
      note: 'Codegen complete. If running dev server, components hot-reload automatically. If running production server, restart with: npm run build && npx next start -p 3000',
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
