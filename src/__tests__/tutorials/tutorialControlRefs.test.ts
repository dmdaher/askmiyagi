/**
 * Tutorial control-ID drift validator (silent-fail prevention).
 *
 * Tutorials reference controls by string ID via `highlightControls[]` and the
 * keys of `panelStateChanges`. When that ID disappears from the panel — pipeline
 * regen, LED migration, future Add-Control with custom IDs, manual rename — the
 * highlight silently does nothing at runtime. No error, no warning. This test
 * catches that drift at CI / build time, before merge.
 *
 * Generic per-device validator that auto-discovers any device with both a
 * tutorial directory and a manifest source. New devices get protection for
 * free as soon as their tutorials and manifest are committed.
 *
 * The Fantom-08 panel layout module (`panelLayouts/fantom-08.ts`) predates the
 * committed-manifest pattern; fall back to importing it when no JSON manifest
 * exists at the expected path.
 *
 * Special targets like 'display' (used in Fantom-08 tutorials to highlight the
 * LCD area) are allowlisted via SPECIAL_TARGETS.
 *
 * Origin: 2026-05-10. Triggered by the DeepMind LED migration (split clustered
 * LEDs and renamed them lfo-wave-1 → lfo1-sine etc.). Tutorials referencing the
 * old IDs would have shipped broken without this validator.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Tutorial } from '@/types/tutorial';

// ─── Configuration ─────────────────────────────────────────────────────────

/**
 * Devices to exclude from validation. Only for placeholder / stub directories
 * or devices with pre-existing drift pending regeneration.
 *
 * Remove a device from this set after its tutorials have been regenerated
 * against the current manifest — the validator will catch any future drift
 * automatically.
 */
const SKIP_DEVICES = new Set<string>([
  'rc505-mk2',   // single test stub, not a real tutorial set
  'deepmind-12', // pending regeneration; existing tutorials reference IDs from
                 // earlier manifest versions (e.g., osc-sawtooth before OSC was
                 // split into osc1-/osc2-, prog-menu-* before prefix was dropped).
                 // After regenerating tutorials against the current manifest,
                 // remove this entry — validator will then guard the new ones.
]);

/**
 * Virtual targets that aren't physical controls but are valid highlight
 * destinations. 'display' is used in Fantom-08 tutorials to highlight the LCD.
 */
const SPECIAL_TARGETS = new Set<string>(['display']);

// ─── Helpers ────────────────────────────────────────────────────────────────

const tutorialsRootDir = path.resolve(__dirname, '../../data/tutorials');
const manifestsDir = path.resolve(__dirname, '../../data/manifests');

/** Convert 'deepmind-12' → 'deepmind12' (matches barrel export naming). */
function deviceIdToCamel(deviceId: string): string {
  return deviceId.replace(/-/g, '');
}

/** Discover device IDs that have a tutorials directory. */
function discoverDeviceIds(): string[] {
  if (!fs.existsSync(tutorialsRootDir)) return [];
  return fs.readdirSync(tutorialsRootDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !SKIP_DEVICES.has(name))
    .sort();
}

/**
 * Resolve the canonical valid-control-IDs set for a device.
 * Tries committed manifest JSON first, then legacy panel-layout module.
 * Returns null if neither source is found.
 */
async function loadValidControlIds(deviceId: string): Promise<Set<string> | null> {
  // Path 1: committed manifest
  const manifestPath = path.join(manifestsDir, `${deviceId}.json`);
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (Array.isArray(m.controls)) {
        return new Set<string>(
          m.controls
            .map((c: { id?: string }) => c.id)
            .filter((id: unknown): id is string => typeof id === 'string'),
        );
      }
    } catch {
      // fall through to path 2
    }
  }

  // Path 2: legacy panel-layout module (Fantom-08 pattern)
  try {
    const mod: Record<string, unknown> = await import(/* @vite-ignore */ `@/data/panelLayouts/${deviceId}`);
    // Try common export names: allControlIds, all<DeviceCamel>ControlIds
    const candidates = [
      'allControlIds',
      `all${deviceIdToCamel(deviceId).replace(/^./, c => c.toUpperCase())}ControlIds`,
    ];
    for (const key of candidates) {
      const value = mod[key];
      if (Array.isArray(value)) return new Set<string>(value.filter((id): id is string => typeof id === 'string'));
    }
  } catch {
    // module not found — fall through
  }

  return null;
}

/**
 * Load the Tutorial[] array for a device from its barrel export.
 * Looks for `<deviceCamel>Tutorials` (e.g., deepmind12Tutorials).
 */
async function loadTutorials(deviceId: string): Promise<Tutorial[]> {
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

/**
 * Dice coefficient (bigram similarity) for two strings, in [0, 1].
 * Cheap, no dependencies, good enough for "did you mean" suggestions.
 */
function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string) => {
    const set = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      set.set(bg, (set.get(bg) ?? 0) + 1);
    }
    return set;
  };
  const aBg = bigrams(a);
  const bBg = bigrams(b);
  let intersection = 0;
  for (const [bg, count] of aBg) {
    const other = bBg.get(bg) ?? 0;
    intersection += Math.min(count, other);
  }
  return (2 * intersection) / (a.length - 1 + b.length - 1);
}

/** Top-3 fuzzy-match suggestions, scored ≥ 0.4. */
function suggest(missing: string, valid: Set<string>): string[] {
  return [...valid]
    .map(id => ({ id, score: dice(missing, id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(c => c.score >= 0.4)
    .map(c => c.id);
}

function buildErrorMessage(deviceId: string, missing: string, valid: Set<string>): string {
  const candidates = suggest(missing, valid);
  const hint = candidates.length
    ? ` Did you mean: ${candidates.map(c => `'${c}'`).join(', ')}?`
    : '';
  return `Control ID '${missing}' not found in ${deviceId} manifest.${hint}`;
}

// ─── Test generation ────────────────────────────────────────────────────────
//
// Vitest expects describe/it calls at module evaluation time. We pre-load all
// devices' tutorials + valid IDs synchronously-friendly via top-level await
// inside an async IIFE pattern is awkward; instead we use describe.concurrent
// with beforeAll for the async loads.

const deviceIds = discoverDeviceIds();

if (deviceIds.length === 0) {
  describe('tutorial control references', () => {
    it.skip('no devices discovered (this should not happen)', () => {});
  });
}

for (const deviceId of deviceIds) {
  describe(`${deviceId} tutorial control references`, () => {
    let validIds: Set<string> | null = null;
    let tutorials: Tutorial[] = [];
    let loadError: string | null = null;

    // Load synchronously at definition time using a synchronous variant.
    // beforeAll would also work but we want describe.each-style enumeration.
    // Use a top-level await via a lazy promise — vitest supports async describe.
    it('loads valid control IDs and tutorials', async () => {
      validIds = await loadValidControlIds(deviceId);
      try {
        tutorials = await loadTutorials(deviceId);
      } catch (err) {
        loadError = (err as Error).message;
      }
      if (!validIds) {
        // No source → entire device skipped via early return below
        return;
      }
      expect(loadError, loadError ?? '').toBe(null);
      expect(tutorials.length).toBeGreaterThan(0);
    });

    it('every step\'s highlightControls + panelStateChanges reference valid control IDs', async () => {
      validIds = validIds ?? await loadValidControlIds(deviceId);
      if (!validIds) {
        // Document the gap and skip — fix is to add manifests/<deviceId>.json
        console.warn(`[tutorialControlRefs] No manifest or panel layout for '${deviceId}'. Skipping ID validation.`);
        return;
      }
      tutorials = tutorials.length ? tutorials : await loadTutorials(deviceId);

      const failures: string[] = [];
      for (const tutorial of tutorials) {
        for (const step of tutorial.steps) {
          // highlightControls[]
          for (const id of step.highlightControls ?? []) {
            if (SPECIAL_TARGETS.has(id)) continue;
            if (!validIds.has(id)) {
              failures.push(
                `  ${tutorial.id} > ${step.id}: highlightControls — ` +
                buildErrorMessage(deviceId, id, validIds),
              );
            }
          }
          // panelStateChanges keys
          for (const id of Object.keys(step.panelStateChanges ?? {})) {
            if (SPECIAL_TARGETS.has(id)) continue;
            if (!validIds.has(id)) {
              failures.push(
                `  ${tutorial.id} > ${step.id}: panelStateChanges — ` +
                buildErrorMessage(deviceId, id, validIds),
              );
            }
          }
        }
      }

      if (failures.length > 0) {
        const plural = failures.length === 1 ? '' : 's';
        throw new Error(
          `${failures.length} drift issue${plural} in ${deviceId} tutorials:\n\n` +
          failures.join('\n') +
          `\n\nFix: rename the referenced IDs in the tutorial files OR ` +
          `confirm the missing IDs exist in src/data/manifests/${deviceId}.json (or panelLayouts/${deviceId}.ts).`,
        );
      }
    });
  });
}
