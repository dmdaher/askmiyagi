/**
 * Tutorial validator orchestrator — runs the existing per-tutorial validator
 * (`validateCumulativeState`) across all tutorials for a device and returns
 * an aggregated summary suitable for the tutorial-review pause UI.
 *
 * Pure data — no I/O beyond the file reads done by loadValidControlIds /
 * loadTutorials. Caller (pipeline-runner) persists the result to
 * `.pipeline/<deviceId>/agents/tutorial-review/summary.json`.
 */
import { loadValidControlIds, loadTutorials } from '../tutorial/loadValidControlIds';
import { validateAllTutorials, type Severity } from '../tutorial/cumulative-state-validator';

export interface TutorialIssue {
  tutorialId: string;
  stepIndex?: number;
  stepTitle?: string;
  severity: Severity;
  code: string;
  message: string;
  controlId?: string;
}

export interface TutorialIssueCounts {
  errors: number;
  warnings: number;
  infos: number;
  title: string;
  stepCount: number;
}

export interface TutorialReviewSummary {
  deviceId: string;
  totalTutorials: number;
  totalSteps: number;
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  byTutorial: Record<string, TutorialIssueCounts>;
  issues: TutorialIssue[];
  generatedAt: string;
}

export interface ValidateGeneratedTutorialsOptions {
  /** Use `.pipeline/<id>/manifest.json` instead of committed manifest. */
  preferPipelineManifest?: boolean;
  /** Absolute path to a tutorials base dir (e.g. worktree src/data/tutorials). */
  tutorialsBaseDir?: string;
}

export async function validateGeneratedTutorials(
  deviceId: string,
  opts: ValidateGeneratedTutorialsOptions = {},
): Promise<TutorialReviewSummary> {
  const controlIds = await loadValidControlIds(deviceId, {
    preferPipelineManifest: opts.preferPipelineManifest,
  });

  if (!controlIds) {
    throw new Error(
      `Cannot validate tutorials for "${deviceId}" — no manifest found at ` +
      `src/data/manifests/${deviceId}.json or .pipeline/${deviceId}/manifest.json.`,
    );
  }

  const tutorials = await loadTutorials(deviceId, { tutorialsBaseDir: opts.tutorialsBaseDir });
  const results = validateAllTutorials(tutorials, controlIds);

  const issues: TutorialIssue[] = [];
  const byTutorial: Record<string, TutorialIssueCounts> = {};
  let totalSteps = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfos = 0;

  for (let i = 0; i < tutorials.length; i++) {
    const tutorial = tutorials[i];
    const result = results[i];
    totalSteps += tutorial.steps.length;

    let errors = 0;
    let warnings = 0;
    let infos = 0;

    for (const issue of result.issues) {
      if (issue.severity === 'error') errors++;
      else if (issue.severity === 'warning') warnings++;
      else infos++;

      issues.push({
        tutorialId: tutorial.id,
        stepIndex: issue.stepIndex >= 0 ? issue.stepIndex : undefined,
        stepTitle: issue.stepTitle,
        severity: issue.severity,
        code: issue.code,
        message: issue.message,
        controlId: issue.controlId,
      });
    }

    totalErrors += errors;
    totalWarnings += warnings;
    totalInfos += infos;

    byTutorial[tutorial.id] = {
      errors,
      warnings,
      infos,
      title: tutorial.title,
      stepCount: tutorial.steps.length,
    };
  }

  return {
    deviceId,
    totalTutorials: tutorials.length,
    totalSteps,
    totalErrors,
    totalWarnings,
    totalInfos,
    byTutorial,
    issues,
    generatedAt: new Date().toISOString(),
  };
}
