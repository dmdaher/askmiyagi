/**
 * `exportManifest(deviceId)` — reads `.pipeline/<deviceId>/manifest-editor.json`
 * (contractor's saved editor state) and writes a production-ready
 * `PanelManifest` JSON to `src/data/manifests/<deviceId>.json` (statically
 * imported by `src/lib/deviceRegistry.ts` for production rendering).
 *
 * Shared between 5 call sites (all best-effort — failures don't block saves):
 *   - `/api/pipeline/[deviceId]/manifest` PUT — auto-export on every save
 *   - `/api/pipeline/[deviceId]/export-manifest` POST — manual override
 *   - `/api/pipeline/[deviceId]/pull-from-hosted` POST — after Blob pull
 *   - `/api/pipeline/[deviceId]/refresh-from-editor` POST — canvas QA refresh
 *   - `/api/pipeline/[deviceId]/manifest-control/[controlId]` DELETE — orphan delete
 *
 * The production allowlist (controls.map below) is the production
 * schema's source of truth — anything not in the list is editor-only and
 * stripped. See `src/__tests__/manifest-field-completeness.test.ts` for
 * the runtime check that catches drift between editor field additions
 * and this list.
 *
 * ## Device metadata fallback chain (PR: state.json fallback fix, 2026-05-23)
 *
 * For `deviceName`, `manufacturer`, `keyboard`, the function tries 4 sources
 * in priority order, falling through only when the previous source is missing
 * the field:
 *   1. `editorData`         — contractor-set (rare for metadata)
 *   2. `mainManifest`       — `.pipeline/<d>/manifest.json` (gatekeeper output, preferred)
 *   3. `devicesRegistry`    — `src/data/devices.ts` (UI registry)
 *   4. `stateJson`          — `.pipeline/<d>/state.json` (pipeline state)
 *   (default — triggers downgrade detector below)
 *
 * ## Downgrade detector (Layer 3 safety net)
 *
 * Before writing, `detectDowngrade()` compares the computed manifest against
 * the EXISTING production manifest (if present). If it would DOWNGRADE or
 * SILENTLY RENAME a non-empty curated value, the export ABORTS with
 * `{ok:false, reason}`. Callers already handle `ok:false` gracefully.
 *
 * This prevents the pre-2026-05-23 bug class where contractors' auto-saves
 * silently corrupted production manifests because the fallback chain skipped
 * authoritative sources. See `memory/project_pipeline_export_fallback_bug.md`.
 *
 * ## Contractor data immutability
 *
 * This function NEVER writes to any manifest-editor.json or any other
 * file inside .pipeline/. The ONLY write target is src/data/manifests/<id>.json.
 * Verified by unit tests in exportManifest.test.ts under the
 * "contractor-data immutability" describe block.
 */
import fs from 'fs';
import path from 'path';
import { devices as devicesRegistry } from '@/data/devices';

export interface ExportManifestResult {
  ok: boolean;
  output?: string;
  error?: string;
  reason?: string; // populated when ok=false due to downgrade-detector abort
  controls?: number;
  sections?: number;
  labels?: number;
}

interface DeviceMetadata {
  deviceName?: string;
  manufacturer?: string;
  keyboard?: unknown;
}

interface PriorProductionManifest {
  deviceId?: string;
  deviceName?: string;
  manufacturer?: string;
  panelWidth?: number;
  panelHeight?: number;
  keyboard?: unknown;
}

const PIPELINE_DIR_NAME = '.pipeline';
const OUTPUT_DIR = path.join('src', 'data', 'manifests');
const DEFAULT_PANEL_WIDTH = 1200;
const DEFAULT_PANEL_HEIGHT = 1650;

/** Read `.pipeline/<deviceId>/state.json` for metadata. Returns null if
 *  file missing, JSON parse fails, or the file lacks expected fields. */
function readStateJson(deviceId: string): DeviceMetadata | null {
  const stateJsonPath = path.join(process.cwd(), PIPELINE_DIR_NAME, deviceId, 'state.json');
  try {
    if (!fs.existsSync(stateJsonPath)) return null;
    const data = JSON.parse(fs.readFileSync(stateJsonPath, 'utf-8'));
    if (typeof data !== 'object' || data === null) return null;
    return {
      deviceName: typeof data.deviceName === 'string' ? data.deviceName : undefined,
      manufacturer: typeof data.manufacturer === 'string' ? data.manufacturer : undefined,
      keyboard: data.keyboard,
    };
  } catch {
    // Corrupt JSON / read failure — treat as missing and fall through to next layer
    return null;
  }
}

/** Read `src/data/devices.ts` registry. Maps the registry's `name` field
 *  to `deviceName` (schema mismatch). Returns null if device not registered. */
function readDevicesRegistry(deviceId: string): DeviceMetadata | null {
  try {
    const entry = devicesRegistry[deviceId];
    if (!entry) return null;
    return {
      deviceName: entry.name, // registry uses `name`, manifest uses `deviceName`
      manufacturer: entry.manufacturer,
    };
  } catch {
    return null;
  }
}

/** Read the existing production manifest for downgrade comparison. */
function readPriorProductionManifest(deviceId: string): PriorProductionManifest | null {
  const priorPath = path.join(process.cwd(), OUTPUT_DIR, `${deviceId}.json`);
  try {
    if (!fs.existsSync(priorPath)) return null;
    return JSON.parse(fs.readFileSync(priorPath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Downgrade detector — the structural safety net. Compares the computed
 *  manifest against the prior production export. Returns a non-null abort
 *  reason if writing the computed value would SILENTLY DOWNGRADE,
 *  CORRUPT, or RENAME a previously-curated non-empty field.
 *
 *  Conservative-by-design: any auto-change to deviceName/manufacturer when
 *  the prior production value was non-empty is treated as suspect and
 *  ABORTS the export. To legitimately rename, the user must delete the
 *  production file first OR explicitly edit it AND update the fallback
 *  sources in sync. */
function detectDowngrade(
  deviceId: string,
  prior: PriorProductionManifest | null,
  computed: { deviceName: string; manufacturer: string; panelWidth: number; panelHeight: number; keyboard: unknown },
): string | null {
  // Corruption signal: deviceName fell back to deviceId. ABORT even on first export.
  if (computed.deviceName === deviceId && (!prior || prior.deviceName !== deviceId)) {
    return `deviceName fell back to deviceId ('${deviceId}') — corruption signal`;
  }

  // First-ever export: nothing to compare against. Already filtered out the
  // corruption signal above, so any other first-export is allowed.
  if (!prior) return null;

  // Wipe signal: prior non-empty → computed empty
  if (prior.deviceName && !computed.deviceName) {
    return `deviceName would be wiped (prior='${prior.deviceName}', computed='')`;
  }
  if (prior.manufacturer && !computed.manufacturer) {
    return `manufacturer would be wiped (prior='${prior.manufacturer}', computed='')`;
  }

  // Auto-rename suspect: prior non-empty AND computed differs
  if (prior.deviceName && prior.deviceName !== computed.deviceName) {
    return `deviceName would change: '${prior.deviceName}' → '${computed.deviceName}' (auto-rename suspect; delete production file to override)`;
  }
  if (prior.manufacturer && prior.manufacturer !== computed.manufacturer) {
    return `manufacturer would change: '${prior.manufacturer}' → '${computed.manufacturer}' (auto-rename suspect; delete production file to override)`;
  }

  // panel dimensions: abort only on default-fallback (likely fallthrough), not on
  // legitimate contractor canvas resize
  if (prior.panelWidth && prior.panelWidth !== DEFAULT_PANEL_WIDTH && computed.panelWidth === DEFAULT_PANEL_WIDTH) {
    return `panelWidth fell to default ${DEFAULT_PANEL_WIDTH} (prior=${prior.panelWidth}) — suspected fallthrough`;
  }
  if (prior.panelHeight && prior.panelHeight !== DEFAULT_PANEL_HEIGHT && computed.panelHeight === DEFAULT_PANEL_HEIGHT) {
    return `panelHeight fell to default ${DEFAULT_PANEL_HEIGHT} (prior=${prior.panelHeight}) — suspected fallthrough`;
  }

  // keyboard loss
  if (prior.keyboard && !computed.keyboard) {
    return `keyboard would be lost (prior was non-null)`;
  }

  return null;
}

export interface ExportManifestOptions {
  /** When true, skip the downgrade detector check. Used by the admin
   *  /api/pipeline/[deviceId]/force-export route after manual review.
   *  Default false — every other caller goes through detector protection. */
  bypassDowngradeCheck?: boolean;
}

export function exportManifest(deviceId: string, options: ExportManifestOptions = {}): ExportManifestResult {
  const pipelineDir = path.join(process.cwd(), PIPELINE_DIR_NAME, deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');
  const mainManifestPath = path.join(pipelineDir, 'manifest.json');

  if (!fs.existsSync(editorPath)) {
    return { ok: false, error: 'No editor manifest found' };
  }

  try {
    const editorData = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
    const mainManifest = fs.existsSync(mainManifestPath)
      ? JSON.parse(fs.readFileSync(mainManifestPath, 'utf-8'))
      : {};

    // Fallback layers (PR: state.json fallback fix, 2026-05-23)
    const devicesEntry = readDevicesRegistry(deviceId);
    const stateJson = readStateJson(deviceId);
    const priorProduction = readPriorProductionManifest(deviceId);

    const sections = editorData.sections ?? {};
    const controls = editorData.controls ?? {};
    const scale = editorData.controlScale ?? 1;

    const sectionList =
      typeof sections === 'object' && !Array.isArray(sections)
        ? Object.values(sections)
        : sections;
    const controlList =
      typeof controls === 'object' && !Array.isArray(controls)
        ? Object.values(controls)
        : controls;

    // Metadata fallback chain: editorData → mainManifest → devicesRegistry → stateJson → default
    const resolvedDeviceName: string =
      editorData.deviceName
      ?? mainManifest.deviceName
      ?? devicesEntry?.deviceName
      ?? stateJson?.deviceName
      ?? deviceId;
    const resolvedManufacturer: string =
      editorData.manufacturer
      ?? mainManifest.manufacturer
      ?? devicesEntry?.manufacturer
      ?? stateJson?.manufacturer
      ?? '';
    const resolvedKeyboard =
      editorData.keyboard
      ?? mainManifest.keyboard
      ?? stateJson?.keyboard
      ?? null;
    const resolvedPanelWidth: number = editorData.canvasWidth ?? DEFAULT_PANEL_WIDTH;
    const resolvedPanelHeight: number = editorData.canvasHeight ?? DEFAULT_PANEL_HEIGHT;

    // Downgrade detector — abort if this export would corrupt/wipe/rename.
    // Bypassed only via admin /force-export route (after manual review).
    if (!options.bypassDowngradeCheck) {
      const downgradeReason = detectDowngrade(deviceId, priorProduction, {
        deviceName: resolvedDeviceName,
        manufacturer: resolvedManufacturer,
        panelWidth: resolvedPanelWidth,
        panelHeight: resolvedPanelHeight,
        keyboard: resolvedKeyboard,
      });
      if (downgradeReason) {
        console.warn(`[exportManifest:${deviceId}] aborted — ${downgradeReason}`);
        return {
          ok: false,
          error: 'Downgrade detected — export aborted to preserve production data',
          reason: downgradeReason,
        };
      }
    } else {
      console.warn(`[exportManifest:${deviceId}] downgrade check BYPASSED via force-export`);
    }

    const manifest = {
      deviceId: editorData.deviceId ?? mainManifest.deviceId ?? deviceId,
      deviceName: resolvedDeviceName,
      manufacturer: resolvedManufacturer,
      panelWidth: resolvedPanelWidth,
      panelHeight: resolvedPanelHeight,
      controlScale: scale,
      keyboard: resolvedKeyboard,
      editorSections: (sectionList as any[]).map((s: any) => ({
        id: s.id,
        headerLabel: s.headerLabel ?? undefined,
        frameMode: s.frameMode,
        hidden: s.hidden,
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
      })),
      controls: (controlList as any[]).map((c: any) => {
        const ctrl: Record<string, any> = {
          id: c.id,
          type: c.type,
          label: c.label ?? '',
          editorPosition: { x: c.x, y: c.y, w: c.w, h: c.h },
        };
        // Production allowlist. Editor-only fields (locked, resizeLocked,
        // ledOn, etc.) intentionally omitted — `ledOn` specifically is
        // editor design-time only because tutorials drive runtime LED
        // state via panelStateChanges (see feedback_ledOn_is_intentional_
        // editor_only memory). Anything not in this list is stripped.
        for (const field of [
          'shape',
          'surfaceColor',
          'buttonStyle',
          'labelPosition',
          'labelDisplay',
          'icon',
          'secondaryLabel',
          'ledVariant',
          'ledColor',
          'hasLed',
          'ledPosition',
          'nestedIn',
          'encoderHasPush',
          'positions',
          'positionLabels',
          'rotation',
          'ledStyle',
          'labelFontSize',
          'zOrder',
          'ledBehavior',
          'labelAlign',
          'labelColor',
        ]) {
          if (c[field] != null) ctrl[field] = c[field];
        }
        return ctrl;
      }),
      editorLabels: (editorData.editorLabels ?? []).map((l: any) => ({
        id: l.id,
        text: l.text,
        icon: l.icon ?? undefined,
        x: l.x,
        y: l.y,
        w: l.w,
        fontSize: l.fontSize,
        align: l.align ?? 'center',
        hidden: l.hidden ?? false,
        lineHeight: (l.fontSize ?? 8) + 2,
        // Thread controlId per PR-2.6 — preview z-index relies on it.
        controlId: l.controlId,
      })),
      groupLabels: mainManifest.groupLabels ?? [],
      controlContainers: editorData.controlContainers ?? [],
    };

    const outputDir = path.join(process.cwd(), OUTPUT_DIR);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${deviceId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    return {
      ok: true,
      output: `Exported manifest to ${OUTPUT_DIR}/${deviceId}.json (${(controlList as any[]).length} controls, ${(sectionList as any[]).length} sections, ${manifest.editorLabels.length} labels)`,
      controls: (controlList as any[]).length,
      sections: (sectionList as any[]).length,
      labels: manifest.editorLabels.length,
    };
  } catch (err) {
    return {
      ok: false,
      error: 'Export failed',
      output: (err as Error).message,
    };
  }
}

// Exported for unit testing (helpers + detector). Not for production use.
export const __internal = {
  readStateJson,
  readDevicesRegistry,
  readPriorProductionManifest,
  detectDowngrade,
  DEFAULT_PANEL_WIDTH,
  DEFAULT_PANEL_HEIGHT,
};
