import path from 'path';

// ---------------------------------------------------------------------------
// Pipeline path construction helpers
// ---------------------------------------------------------------------------

/** Paths returned by `pipelinePaths()` for a given device. */
export interface PipelinePaths {
  // Root-level state
  root: string;
  state: string;
  log: string;
  cost: string;

  // Inputs (main repo)
  inputDir: string;
  manualsDir: string;
  photosDir: string;

  // Inputs (worktree — same as main when no worktree supplied)
  wtInputDir: string;
  wtManualsDir: string;
  wtPhotosDir: string;

  // Agent outputs
  agentsDir: string;
  wtAgentsDir: string;

  /** Per-agent paths. */
  agent(name: string): AgentPaths;

  // Diagram Parser
  parserBlueprint: string;
  wtParserBlueprint: string;

  // Control Extractor
  controlInventory: string;
  wtControlInventory: string;

  // Gatekeeper
  gatekeeperManifest: string;
  wtGatekeeperManifest: string;

  // Manual Extractor — sieve pipeline
  sieveDir: string;
  wtSieveDir: string;
  sieveBucket(n: number): string;
  sieveVerified(n: number): string;
  sieveAnchored(n: number): string;
  sievePass(n: number): string;

  // Manual Extractor — sealing
  extractorSealed: string;
  wtExtractorDir: string;

  // Promoted artifacts
  manifest: string;
  wtManifest: string;
  templates: string;
  wtTemplates: string;

  // Editor
  editorManifest: string;
  savedEditorManifest: string;
  backups: string;
}

export interface AgentPaths {
  dir: string;
  wtDir: string;
  checkpoint: string;
  wtCheckpoint: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PIPELINE_DIR = '.pipeline';

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

const SIEVE_PASS_NAMES: Record<number, string> = {
  1: 'pass-1-inventory.md',
  2: 'pass-2-relationships.md',
  3: 'pass-3-curriculum.md',
  4: 'pass-4-batches.md',
};

// ---------------------------------------------------------------------------
// Main helper
// ---------------------------------------------------------------------------

/**
 * Build every pipeline path for a device.
 *
 * When `worktreeCwd` is provided the `wt*` variants resolve inside that
 * worktree directory. Otherwise they point to the same location as the
 * main-repo paths (relative from project root).
 */
export function pipelinePaths(
  deviceId: string,
  worktreeCwd?: string,
): PipelinePaths {
  const root = path.join(PIPELINE_DIR, deviceId);
  const wtRoot = worktreeCwd
    ? path.join(worktreeCwd, PIPELINE_DIR, deviceId)
    : root;

  // -- inputs ---------------------------------------------------------------
  const inputDir = path.join(root, 'input');
  const manualsDir = path.join(inputDir, 'manuals');
  const photosDir = path.join(inputDir, 'photos');

  const wtInputDir = path.join(wtRoot, 'input');
  const wtManualsDir = path.join(wtInputDir, 'manuals');
  const wtPhotosDir = path.join(wtInputDir, 'photos');

  // -- agents ---------------------------------------------------------------
  const agentsDir = path.join(root, 'agents');
  const wtAgentsDir = path.join(wtRoot, 'agents');

  function agent(name: string): AgentPaths {
    const dir = path.join(agentsDir, name);
    const wtDir = path.join(wtAgentsDir, name);
    return {
      dir,
      wtDir,
      checkpoint: path.join(dir, 'checkpoint.md'),
      wtCheckpoint: path.join(wtDir, 'checkpoint.md'),
    };
  }

  // -- sieve ----------------------------------------------------------------
  const sieveDir = path.join(agentsDir, 'manual-extractor', 'sieve');
  const wtSieveDir = path.join(wtAgentsDir, 'manual-extractor', 'sieve');

  function sieveBucket(n: number): string {
    return path.join(sieveDir, `bucket-${pad3(n)}.md`);
  }

  function sieveVerified(n: number): string {
    return path.join(sieveDir, `bucket-${pad3(n)}-verified.md`);
  }

  function sieveAnchored(n: number): string {
    return path.join(sieveDir, `bucket-${pad3(n)}-anchored.md`);
  }

  function sievePass(n: number): string {
    const filename = SIEVE_PASS_NAMES[n];
    if (!filename) {
      throw new Error(`Unknown sieve pass number: ${n}. Expected 1-4.`);
    }
    return path.join(sieveDir, filename);
  }

  // -- specific agent files -------------------------------------------------
  const parserBlueprint = path.join(
    agentsDir, 'diagram-parser', 'spatial-blueprint.json',
  );
  const wtParserBlueprint = path.join(
    wtAgentsDir, 'diagram-parser', 'spatial-blueprint.json',
  );

  const controlInventory = path.join(
    agentsDir, 'control-extractor', 'control-inventory.json',
  );
  const wtControlInventory = path.join(
    wtAgentsDir, 'control-extractor', 'control-inventory.json',
  );

  const gatekeeperManifest = path.join(
    agentsDir, 'gatekeeper', 'manifest.json',
  );
  const wtGatekeeperManifest = path.join(
    wtAgentsDir, 'gatekeeper', 'manifest.json',
  );

  // Sealing renames the extractor directory to prevent auditor contamination
  const extractorSealed = path.join(wtAgentsDir, '.extractor-sealed');
  const wtExtractorDir = path.join(wtAgentsDir, 'manual-extractor');

  // -- promoted artifacts ---------------------------------------------------
  const manifest = path.join(root, 'manifest.json');
  const wtManifest = path.join(wtRoot, 'manifest.json');
  const templates = path.join(root, 'templates.json');
  const wtTemplates = path.join(wtRoot, 'templates.json');

  // -- editor ---------------------------------------------------------------
  const editorManifest = path.join(root, 'manifest-editor.json');
  const savedEditorManifest = path.join(
    PIPELINE_DIR, 'saved', deviceId, 'manifest-editor.json',
  );
  const backups = path.join(root, 'backups');

  return {
    root,
    state: path.join(root, 'state.json'),
    log: path.join(root, 'runner.log'),
    cost: path.join(root, 'cost.json'),

    inputDir,
    manualsDir,
    photosDir,
    wtInputDir,
    wtManualsDir,
    wtPhotosDir,

    agentsDir,
    wtAgentsDir,
    agent,

    parserBlueprint,
    wtParserBlueprint,
    controlInventory,
    wtControlInventory,
    gatekeeperManifest,
    wtGatekeeperManifest,

    sieveDir,
    wtSieveDir,
    sieveBucket,
    sieveVerified,
    sieveAnchored,
    sievePass,

    extractorSealed,
    wtExtractorDir,

    manifest,
    wtManifest,
    templates,
    wtTemplates,

    editorManifest,
    savedEditorManifest,
    backups,
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers for prompt text (relative paths)
// ---------------------------------------------------------------------------

/**
 * Return the relative agent output directory for use in agent prompt text.
 *
 * Example: `.pipeline/cdj-3000/agents/diagram-parser`
 */
export function agentPath(deviceId: string, agentName: string): string {
  return path.join(PIPELINE_DIR, deviceId, 'agents', agentName);
}

/**
 * Return the relative input directories for use in agent prompt text.
 */
export function inputPath(
  deviceId: string,
): { manuals: string; photos: string } {
  const inputDir = path.join(PIPELINE_DIR, deviceId, 'input');
  return {
    manuals: path.join(inputDir, 'manuals'),
    photos: path.join(inputDir, 'photos'),
  };
}
