#!/usr/bin/env tsx
/**
 * Detects local git repository corruption that can silently break `git fetch`.
 *
 * Origin: Bug-6 (2026-05-06). A corrupted ref `refs/heads/feature/dj-djs-1000 2`
 * (literal space + "2", classic iCloud/Finder duplication signature) caused
 * `fatal: bad object` on every fetch — fetches exited without updating ANY
 * refs. Local origin/test stayed 3 days stale; no visible runtime failure.
 *
 * What this script catches:
 *   1. Ref filenames containing a literal space (the iCloud signature)
 *   2. Anything `git fsck --connectivity-only` flags
 */
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function findSpaceContainingRefs(refsDir: string, prefix = ''): string[] {
  const offenders: string[] = [];
  try {
    const entries = readdirSync(refsDir, { withFileTypes: true });
    for (const entry of entries) {
      const refPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.name.includes(' ')) {
        offenders.push(refPath);
      }
      if (entry.isDirectory()) {
        offenders.push(...findSpaceContainingRefs(join(refsDir, entry.name), refPath));
      }
    }
  } catch {
    // unreadable directories are skipped
  }
  return offenders;
}

function main(): void {
  let issues = 0;

  console.log('Checking for corrupted ref names (space-containing)...');
  const spaceRefs = findSpaceContainingRefs('.git/refs');
  if (spaceRefs.length > 0) {
    issues++;
    console.error(`${RED}✗ Found refs with literal spaces:${RESET}`);
    for (const ref of spaceRefs) console.error(`   refs/${ref}`);
    console.error(`${YELLOW}  Likely cause: iCloud/Finder duplicated a file in .git/refs/.`);
    console.error(`  Fix: git update-ref -d 'refs/<offender>'${RESET}`);
  } else {
    console.log(`${GREEN}✓${RESET} No space-containing refs.`);
  }

  console.log('\nRunning git fsck (connectivity check)...');
  try {
    execSync('git fsck --no-progress --connectivity-only --no-dangling', { stdio: 'pipe' });
    console.log(`${GREEN}✓${RESET} git fsck clean.`);
  } catch (err: unknown) {
    issues++;
    const e = err as { stderr?: Buffer; stdout?: Buffer };
    console.error(`${RED}✗ git fsck reported issues:${RESET}`);
    if (e.stdout) console.error(e.stdout.toString());
    if (e.stderr) console.error(e.stderr.toString());
  }

  if (issues === 0) {
    console.log(`\n${GREEN}All git health checks passed.${RESET}`);
    process.exit(0);
  }
  console.error(`\n${RED}${issues} issue(s) found. Fix before pushing.${RESET}`);
  process.exit(1);
}

main();
