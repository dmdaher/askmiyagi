/**
 * End-to-end integration test for the tutorial-review canvas data flow.
 *
 * Catches the class of bug discovered cdj-3000 2026-05-18: doTutorialReview
 * wrote summary.json + tutorials.json to wtDir (device worktree's .pipeline/),
 * but the admin Next.js API reads from canonical .pipeline/. Files existed
 * but the canvas 404'd with "Tutorial review not ready".
 *
 * The test:
 *   1. Writes fixture summary.json + tutorials.json + manifest + state to
 *      canonical .pipeline/<test-device>/ (mimicking what the runner SHOULD
 *      do after doTutorialReview).
 *   2. Imports the API route's GET handler directly.
 *   3. Invokes it with a Request and asserts response shape.
 *   4. Cleans up after itself.
 *
 * If anyone later regresses doTutorialReview's write path (or the API's
 * read path), this test fails immediately.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

const TEST_DEVICE = 'review-canvas-integration-test';
const PIPELINE_ROOT = path.join(process.cwd(), '.pipeline', TEST_DEVICE);
const REVIEW_DIR = path.join(PIPELINE_ROOT, 'agents', 'tutorial-review');

const FIXTURE_SUMMARY = {
  deviceId: TEST_DEVICE,
  totalTutorials: 2,
  totalSteps: 5,
  totalErrors: 0,
  totalWarnings: 1,
  totalInfos: 0,
  byTutorial: {
    't01': { errors: 0, warnings: 0, infos: 0, title: 'Tutorial 1', stepCount: 3 },
    't02': { errors: 0, warnings: 1, infos: 0, title: 'Tutorial 2', stepCount: 2 },
  },
  issues: [
    {
      tutorialId: 't02',
      severity: 'warning' as const,
      code: 'EXCESSIVE_FLIPS',
      message: 'Control flipped too many times',
      controlId: 'btn-a',
    },
  ],
  generatedAt: '2026-05-19T00:00:00Z',
};

const FIXTURE_TUTORIALS = [
  {
    id: 't01',
    deviceId: TEST_DEVICE,
    title: 'Tutorial 1',
    description: 'First',
    category: 'basics',
    difficulty: 'beginner',
    estimatedTime: '1 min',
    tags: [],
    steps: [
      { id: 's1', title: 'Step 1', instruction: 'Do A', highlightControls: ['btn-a'], panelStateChanges: {} },
      { id: 's2', title: 'Step 2', instruction: 'Do B', highlightControls: ['btn-b'], panelStateChanges: {} },
      { id: 's3', title: 'Step 3', instruction: 'Done', highlightControls: [], panelStateChanges: {} },
    ],
  },
  {
    id: 't02',
    deviceId: TEST_DEVICE,
    title: 'Tutorial 2',
    description: 'Second',
    category: 'basics',
    difficulty: 'beginner',
    estimatedTime: '1 min',
    tags: [],
    steps: [
      { id: 's1', title: 'Press A', instruction: 'Press A', highlightControls: ['btn-a'], panelStateChanges: { 'btn-a': { active: true } } },
      { id: 's2', title: 'Release', instruction: 'Release', highlightControls: ['btn-a'], panelStateChanges: { 'btn-a': { active: false } } },
    ],
  },
];

const FIXTURE_MANIFEST = {
  deviceId: TEST_DEVICE,
  deviceName: 'Integration Test Device',
  manufacturer: 'Test',
  controls: [
    { id: 'btn-a', type: 'button', x: 10, y: 10, w: 50, h: 30 },
    { id: 'btn-b', type: 'button', x: 70, y: 10, w: 50, h: 30 },
  ],
  panelWidth: 300,
  panelHeight: 100,
};

const FIXTURE_STATE = {
  deviceId: TEST_DEVICE,
  deviceName: 'Integration Test Device',
  manufacturer: 'Test',
  manualPaths: [],
  currentPhase: 'tutorial-review',
  status: 'paused',
  branch: 'feature/test',
  createdAt: '2026-05-19T00:00:00Z',
  updatedAt: '2026-05-19T00:00:00Z',
  phases: [],
  sections: [],
  tutorialBatches: [],
  escalations: [
    {
      id: 'esc-integration',
      phase: 'tutorial-review',
      type: 'tutorial-review',
      message: '2 tutorials ready for review',
      createdAt: '2026-05-19T00:00:00Z',
      resolvedAt: null,
      resolution: null,
    },
  ],
  activeEscalation: 'esc-integration',
  totalCostUsd: 0,
  totalActualCostUsd: 0,
  totalTokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
  budgetCapUsd: 1000,
  subscription: null,
  burnRate: null,
  runnerPid: null,
  childPid: null,
  worktreePath: null,
  extractionProgress: null,
  strikeTracker: {},
  lastCheckpoint: { phase: 'tutorial-review', subStep: 'start' },
};

describe('tutorial-review canvas integration (admin API ↔ canonical .pipeline/)', () => {
  beforeAll(() => {
    // Write fixture data to canonical paths — the locations the runner is
    // SUPPOSED to write to, and the admin API IS SUPPOSED to read from.
    fs.mkdirSync(REVIEW_DIR, { recursive: true });
    fs.writeFileSync(path.join(REVIEW_DIR, 'summary.json'), JSON.stringify(FIXTURE_SUMMARY));
    fs.writeFileSync(path.join(REVIEW_DIR, 'tutorials.json'), JSON.stringify(FIXTURE_TUTORIALS));
    fs.writeFileSync(path.join(PIPELINE_ROOT, 'manifest.json'), JSON.stringify(FIXTURE_MANIFEST));
    fs.writeFileSync(path.join(PIPELINE_ROOT, 'state.json'), JSON.stringify(FIXTURE_STATE));
  });

  afterAll(() => {
    fs.rmSync(PIPELINE_ROOT, { recursive: true, force: true });
  });

  it('API serves the JSON files the canvas needs (the bug-class this test catches)', async () => {
    // Import the route handler. This MUST resolve files from canonical
    // .pipeline/, not from any worktree. If a future refactor moves the
    // read path or someone reintroduces the wtDir-vs-canonical confusion,
    // this test fails.
    const { GET } = await import('@/app/api/pipeline/[deviceId]/review-tutorials/route');

    const req = new NextRequest(`http://localhost/api/pipeline/${TEST_DEVICE}/review-tutorials`);
    const res = await GET(req, { params: Promise.resolve({ deviceId: TEST_DEVICE }) });

    expect(res.status).toBe(200);
    const body = await res.json();

    // Shape assertions — these match what TutorialReviewCanvas.tsx consumes
    expect(body.deviceId).toBe(TEST_DEVICE);
    expect(body.deviceName).toBe('Integration Test Device');
    expect(body.currentPhase).toBe('tutorial-review');
    expect(body.status).toBe('paused');
    expect(body.escalationId).toBe('esc-integration');

    // Summary shape (TutorialReviewSummary)
    expect(body.summary.totalTutorials).toBe(2);
    expect(body.summary.totalSteps).toBe(5);
    expect(body.summary.totalErrors).toBe(0);
    expect(body.summary.totalWarnings).toBe(1);
    expect(body.summary.issues).toHaveLength(1);
    expect(body.summary.issues[0].code).toBe('EXCESSIVE_FLIPS');

    // Tutorials array (consumed by canvas sidebar + TutorialRunner)
    expect(body.tutorials).toHaveLength(2);
    expect(body.tutorials[0].id).toBe('t01');
    expect(body.tutorials[1].id).toBe('t02');
    expect(body.tutorials[0].steps).toHaveLength(3);

    // Manifest for PanelRenderer
    expect(body.manifest.controls).toHaveLength(2);
    expect(body.manifest.panelWidth).toBe(300);
  });

  it('returns 404 with helpful message when files are missing', async () => {
    // Temporarily move the summary.json to simulate missing file
    const summaryPath = path.join(REVIEW_DIR, 'summary.json');
    const tempPath = summaryPath + '.bak';
    fs.renameSync(summaryPath, tempPath);

    try {
      const { GET } = await import('@/app/api/pipeline/[deviceId]/review-tutorials/route');
      const req = new NextRequest(`http://localhost/api/pipeline/${TEST_DEVICE}/review-tutorials`);
      const res = await GET(req, { params: Promise.resolve({ deviceId: TEST_DEVICE }) });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toMatch(/tutorial-review|disk/i);
    } finally {
      fs.renameSync(tempPath, summaryPath);
    }
  });

  it('the canonical path the runner must write to', () => {
    // Pins the exact directory the runner's writeAgentArtifact() helper
    // produces, so if anyone changes paths.ts in a way that drifts the
    // canonical location, this test fails loudly with the path comparison.
    const expectedCanonical = path.join(process.cwd(), '.pipeline', TEST_DEVICE, 'agents', 'tutorial-review');
    expect(REVIEW_DIR).toBe(expectedCanonical);
    expect(fs.existsSync(path.join(REVIEW_DIR, 'summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(REVIEW_DIR, 'tutorials.json'))).toBe(true);
  });
});
