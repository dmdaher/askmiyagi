/**
 * Cumulative state validator — integration test.
 *
 * Walks every real tutorial across every device and runs the cumulative
 * state validator. Surfaces any drift/state issues in real tutorials.
 *
 * Errors fail the test (so pre-push + CI catch them).
 * Warnings + info are logged but don't fail (admin reviews via attention
 * inventory or audit log).
 *
 * Reuses the device + manifest discovery pattern from
 * `tutorialControlRefs.test.ts`.
 *
 * Origin: 2026-05-10. Catches the class of bugs LLM Tutorial Reviewer
 * can't reliably see (multi-step state drift, leftover LEDs, etc.).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Tutorial } from '@/types/tutorial';
import { validateCumulativeState } from '@/lib/tutorial/cumulative-state-validator';

const SKIP_DEVICES = new Set<string>([
  'rc505-mk2',   // single test stub
  'deepmind-12', // pending tutorial regeneration; covered by sibling test
]);

const tutorialsRootDir = path.resolve(__dirname, '../../data/tutorials');
const manifestsDir = path.resolve(__dirname, '../../data/manifests');

function deviceIdToCamel(deviceId: string): string {
  return deviceId.replace(/-/g, '');
}

function discoverDeviceIds(): string[] {
  if (!fs.existsSync(tutorialsRootDir)) return [];
  return fs.readdirSync(tutorialsRootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !SKIP_DEVICES.has(name))
    .sort();
}

async function loadValidControlIds(deviceId: string): Promise<Set<string> | null> {
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
    } catch { /* fall through */ }
  }
  // Legacy panel-layout module fallback (Fantom-08 pattern)
  try {
    const mod: Record<string, unknown> = await import(/* @vite-ignore */ `@/data/panelLayouts/${deviceId}`);
    const camel = deviceIdToCamel(deviceId).replace(/^./, (c) => c.toUpperCase());
    const candidates = ['allControlIds', `all${camel}ControlIds`];
    for (const key of candidates) {
      const value = mod[key];
      if (Array.isArray(value)) return new Set<string>(value.filter((id): id is string => typeof id === 'string'));
    }
  } catch { /* module not found */ }
  return null;
}

async function loadTutorials(deviceId: string): Promise<Tutorial[]> {
  const mod: Record<string, unknown> = await import(/* @vite-ignore */ `@/data/tutorials/${deviceId}`);
  const exportName = `${deviceIdToCamel(deviceId)}Tutorials`;
  const value = mod[exportName];
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${exportName} from @/data/tutorials/${deviceId}.`);
  }
  return value as Tutorial[];
}

describe('cumulative state across real tutorials', () => {
  const deviceIds = discoverDeviceIds();

  for (const deviceId of deviceIds) {
    describe(deviceId, () => {
      it('every tutorial validates without ERROR-severity state issues', async () => {
        const controlIds = await loadValidControlIds(deviceId);
        if (!controlIds) {
          // No manifest source — skip (covered by SKIP_DEVICES typically)
          return;
        }
        const tutorials = await loadTutorials(deviceId);

        const allErrors: { tutorialId: string; issue: { code: string; stepTitle: string; message: string } }[] = [];

        for (const tutorial of tutorials) {
          const result = validateCumulativeState(tutorial, controlIds);
          for (const issue of result.issues) {
            if (issue.severity === 'error') {
              allErrors.push({ tutorialId: tutorial.id, issue });
            }
          }
        }

        if (allErrors.length > 0) {
          const detail = allErrors
            .slice(0, 15)
            .map((e) => `  [${e.tutorialId}] ${e.issue.code} in step "${e.issue.stepTitle}": ${e.issue.message}`)
            .join('\n');
          throw new Error(
            `${allErrors.length} cumulative-state ERRORS found for ${deviceId}:\n${detail}${
              allErrors.length > 15 ? `\n  …and ${allErrors.length - 15} more` : ''
            }`,
          );
        }

        expect(allErrors).toHaveLength(0);
      });

      it('warnings + info logged for review (does NOT fail)', async () => {
        const controlIds = await loadValidControlIds(deviceId);
        if (!controlIds) return;
        const tutorials = await loadTutorials(deviceId);

        let warningCount = 0;
        let infoCount = 0;
        const sampleMessages: string[] = [];

        for (const tutorial of tutorials) {
          const result = validateCumulativeState(tutorial, controlIds);
          warningCount += result.warningCount;
          infoCount += result.issues.filter((i) => i.severity === 'info').length;
          if (sampleMessages.length < 5) {
            for (const issue of result.issues) {
              if (issue.severity !== 'error' && sampleMessages.length < 5) {
                sampleMessages.push(`  [${tutorial.id}] ${issue.code}: ${issue.message}`);
              }
            }
          }
        }

        // Always passes — this is a log-only check
        if (warningCount > 0 || infoCount > 0) {
          console.log(
            `\n  [${deviceId}] ${warningCount} warning${warningCount === 1 ? '' : 's'}, ${infoCount} info — sample:\n${sampleMessages.join('\n')}\n`,
          );
        }
        expect(true).toBe(true);
      });
    });
  }
});
