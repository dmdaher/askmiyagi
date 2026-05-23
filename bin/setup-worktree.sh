#!/usr/bin/env bash
#
# bin/setup-worktree.sh — one-shot setup for a NEW git worktree.
#
# Run this AFTER creating a new worktree (`git worktree add`) and BEFORE
# running `npm run dev` or any other work in the worktree.
#
# What it does:
#   1. Verifies you're inside a NEW worktree (not the canonical repo)
#   2. Symlinks `.pipeline/` -> canonical's `.pipeline/` (shared contractor
#      state, single source of truth across all worktrees)
#   3. Applies `git update-index --skip-worktree` to all tracked .pipeline
#      files so git operations don't try to materialize the tracked dir
#      and destroy the symlink (the hazard documented in
#      memory/feedback_git_checkout_breaks_pipeline_symlink.md)
#   4. Copies .env.local from canonical (needed for dev server + Playwright)
#
# Idempotent: safe to re-run. Detects existing setup and skips done steps.
#
# Recovery: if `.pipeline/` got destroyed in this worktree (e.g., from a
# bad `git checkout HEAD -- .pipeline/<file>`), run this script to restore.
#
# Usage:
#   cd /path/to/your/new-worktree
#   bin/setup-worktree.sh

set -euo pipefail

# Canonical worktree path (the one that has the REAL .pipeline directory)
CANONICAL_REPO='/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi'

# Color helpers (only when stdout is a tty)
if [ -t 1 ]; then
  RED=$(tput setaf 1); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3)
  BLUE=$(tput setaf 4); BOLD=$(tput bold); RESET=$(tput sgr0)
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; RESET=''
fi

info()  { echo "${BLUE}${BOLD}==>${RESET} $*"; }
ok()    { echo "${GREEN}OK${RESET}  $*"; }
warn()  { echo "${YELLOW}!!${RESET}  $*"; }
err()   { echo "${RED}X${RESET}   $*"; }
fatal() { err "$*"; exit 1; }

CWD=$(pwd)

# ── 1. Safety check ─────────────────────────────────────────────────────────

info "Verifying worktree context"

if [ "$CWD" = "$CANONICAL_REPO" ]; then
  fatal "You are inside the CANONICAL worktree ($CANONICAL_REPO). This script is for NON-canonical worktrees only. Canonical has the REAL .pipeline directory and must NOT have a symlink."
fi

if [ ! -d .git ] && [ ! -f .git ]; then
  fatal "Not inside a git worktree (no .git file or directory)."
fi

if [ -d .git ]; then
  fatal "This appears to be a primary git repo, not a secondary worktree. This script is for 'git worktree add' worktrees."
fi

ok "Confirmed secondary worktree at: $CWD"

# ── 2. Symlink .pipeline ────────────────────────────────────────────────────

info "Setting up .pipeline symlink"

EXPECTED_TARGET="${CANONICAL_REPO}/.pipeline"

if [ -L .pipeline ]; then
  CURRENT_TARGET=$(readlink .pipeline)
  if [ "$CURRENT_TARGET" = "$EXPECTED_TARGET" ]; then
    ok ".pipeline already symlinked correctly"
  else
    warn ".pipeline points to unexpected target: $CURRENT_TARGET"
    warn "Replacing with: $EXPECTED_TARGET"
    rm .pipeline
    ln -s "$EXPECTED_TARGET" .pipeline
    ok ".pipeline re-symlinked"
  fi
elif [ -d .pipeline ]; then
  warn ".pipeline is a real directory. Removing to install symlink."
  warn "(If this directory contains unique data, abort now with Ctrl+C and back it up.)"
  sleep 2
  rm -rf .pipeline
  ln -s "$EXPECTED_TARGET" .pipeline
  ok ".pipeline replaced with symlink -> $EXPECTED_TARGET"
else
  ln -s "$EXPECTED_TARGET" .pipeline
  ok ".pipeline symlinked -> $EXPECTED_TARGET"
fi

# ── 3. Apply skip-worktree to tracked .pipeline files ───────────────────────

info "Applying skip-worktree to tracked .pipeline files"

# Why: .pipeline/<dev>/*.json files (manifest, manifest-editor, templates,
# inferred-layout) are intentionally tracked in git for Vercel deployment +
# contractor backup history. But this worktree uses a symlink, not a real
# dir. Without skip-worktree, every `git status` shows those files as
# "deleted", and `git checkout HEAD --` would destroy the symlink.

TRACKED_PIPELINE_FILES=$(git ls-files .pipeline/ 2>/dev/null || true)

if [ -z "$TRACKED_PIPELINE_FILES" ]; then
  warn "No tracked .pipeline files in this branch. Skipping."
else
  echo "$TRACKED_PIPELINE_FILES" | xargs git update-index --skip-worktree
  COUNT=$(echo "$TRACKED_PIPELINE_FILES" | wc -l | tr -d ' ')
  ok "Applied skip-worktree to $COUNT tracked .pipeline files"
fi

# ── 4. Copy .env.local from canonical ───────────────────────────────────────

info "Setting up .env.local"

if [ -f .env.local ]; then
  ok ".env.local already exists. Skipping."
elif [ -f "${CANONICAL_REPO}/.env.local" ]; then
  cp "${CANONICAL_REPO}/.env.local" .env.local
  ok ".env.local copied from canonical"
else
  warn "No .env.local in canonical either. Skipping."
  warn "You will need to create .env.local manually for the dev server."
fi

# ── 5. Sanity check ─────────────────────────────────────────────────────────

info "Verifying setup"

if [ -L .pipeline ] && [ -f .pipeline/cdj-3000/manifest-editor.json ]; then
  ok ".pipeline symlink works (cdj-3000 manifest accessible)"
else
  err ".pipeline setup is broken. Check the symlink target."
  fatal "Setup incomplete"
fi

echo
ok "${BOLD}Worktree setup complete.${RESET}"
echo "Next steps:"
echo "  1. ${BOLD}npm install${RESET}  (if not yet done)"
echo "  2. ${BOLD}npm run dev${RESET}  (start the dev server)"
