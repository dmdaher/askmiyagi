#!/usr/bin/env bash
# One-time hook wiring: point git at the tracked .githooks/ dir directly via
# core.hooksPath. Replaces the previous copy-into-.git/hooks/ approach, which
# was incompatible with git worktrees (`.git` is a file there, not a dir).
#
# Idempotent — setting the same config repeatedly is a no-op. Auto-run by
# `npm install` via the package.json `prepare` script.

[ "${CI:-}" = "true" ] && exit 0
git rev-parse --show-toplevel > /dev/null 2>&1 || exit 0

git config core.hooksPath .githooks
echo "  git hooks → .githooks (via core.hooksPath)"
