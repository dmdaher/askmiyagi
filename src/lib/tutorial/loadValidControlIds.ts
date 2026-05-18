/**
 * Tutorial validation helpers — extracted from
 * `src/__tests__/tutorials/tutorialControlRefs.test.ts` so they can be reused
 * outside the test runner (e.g., the pipeline's tutorial-review pause phase).
 *
 * Two sources of valid control IDs:
 *   1. Committed manifest at `src/data/manifests/<deviceId>.json` (current world)
 *   2. Legacy panel-layout module at `src/data/panelLayouts/<deviceId>` (Fantom-08)
 *   3. Pipeline-in-progress manifest at `.pipeline/<deviceId>/manifest.json`
 *      — only when `preferPipelineManifest: true` (used during tutorial-review
 *      pause before a manifest has been promoted to src/data/manifests/).
 */
import fs from 'fs';
import path from 'path';
import type { Tutorial } from '../../types/tutorial';

const DEFAULT_MANIFESTS_DIR = path.resolve(__dirname, '../../data/manifests');
const DEFAULT_PIPELINE_DIR = path.resolve(__dirname, '../../../.pipeline');

export interface LoadValidControlIdsOptions {
  /**
   * When true, prefer `.pipeline/<id>/manifest.json` (the in-progress manifest)
   * over the committed copy in `src/data/manifests/`. Used during the
   * tutorial-review pause to validate against the just-built manifest.
   */
  preferPipelineManifest?: boolean;
  /** Override for tests. */
  manifestsDir?: string;
  /** Override for tests. */
  pipelineDir?: string;
}

/** 'deepmind-12' → 'deepmind12' (matches barrel export naming). */
export function deviceIdToCamel(deviceId: string): string {
  return deviceId.replace(/-/g, '');
}

function readManifestIds(manifestPath: string): Set<string> | null {
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (!Array.isArray(m.controls)) return null;
    return new Set<string>(
      m.controls
        .map((c: { id?: string }) => c.id)
        .filter((id: unknown): id is string => typeof id === 'string'),
    );
  } catch {
    return null;
  }
}

/**
 * Resolve the canonical valid-control-IDs set for a device.
 * Tries committed manifest JSON first, then the in-progress pipeline manifest,
 * then the legacy panel-layout module. Returns null if no source is found.
 */
export async function loadValidControlIds(
  deviceId: string,
  opts: LoadValidControlIdsOptions = {},
): Promise<Set<string> | null> {
  const manifestsDir = opts.manifestsDir ?? DEFAULT_MANIFESTS_DIR;
  const pipelineDir = opts.pipelineDir ?? DEFAULT_PIPELINE_DIR;

  const committed = path.join(manifestsDir, `${deviceId}.json`);
  const inProgress = path.join(pipelineDir, deviceId, 'manifest.json');

  const order = opts.preferPipelineManifest
    ? [inProgress, committed]
    : [committed, inProgress];

  for (const p of order) {
    const ids = readManifestIds(p);
    if (ids) return ids;
  }

  // Legacy panel-layout module (Fantom-08 pattern)
  try {
    const mod: Record<string, unknown> = await import(/* @vite-ignore */ `@/data/panelLayouts/${deviceId}`);
    const candidates = [
      'allControlIds',
      `all${deviceIdToCamel(deviceId).replace(/^./, c => c.toUpperCase())}ControlIds`,
    ];
    for (const key of candidates) {
      const value = mod[key];
      if (Array.isArray(value)) {
        return new Set<string>(value.filter((id): id is string => typeof id === 'string'));
      }
    }
  } catch {
    // module not found
  }

  return null;
}

/**
 * Load the Tutorial[] array for a device from its barrel export.
 * Looks for `<deviceCamel>Tutorials` (e.g., deepmind12Tutorials).
 */
export async function loadTutorials(deviceId: string): Promise<Tutorial[]> {
  const mod: Record<string, unknown> = await import(/* @vite-ignore */ `@/data/tutorials/${deviceId}`);
  const exportName = `${deviceIdToCamel(deviceId)}Tutorials`;
  const value = mod[exportName];
  if (!Array.isArray(value)) {
    throw new Error(
      `Expected ${exportName} array export from src/data/tutorials/${deviceId}/index.ts. ` +
      `Found exports: ${Object.keys(mod).slice(0, 5).join(', ')}...`,
    );
  }
  return value as Tutorial[];
}
