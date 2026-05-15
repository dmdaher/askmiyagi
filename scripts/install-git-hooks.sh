#!/usr/bin/env bash
# Installs committed git hooks into the local .git/hooks/ directory.
# Run once after cloning the repo, or after adding/updating a hook in .githooks/.
# Auto-run by `npm install` via the package.json `prepare` script.

set -e

# In CI we don't need local git hooks (the CI workflow already gates).
# Also bail silently if we're not inside a git repo (e.g., npm install from
# a tarball, or running inside a sandbox).
if [ "${CI:-}" = "true" ]; then
  exit 0
fi
if ! git rev-parse --show-toplevel > /dev/null 2>&1; then
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
SOURCE_DIR="$REPO_ROOT/.githooks"
TARGET_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "No .githooks/ directory found at: $SOURCE_DIR"
  exit 1
fi

installed=0
for src in "$SOURCE_DIR"/*; do
  [ -f "$src" ] || continue
  name="$(basename "$src")"
  # Skip iCloud duplicate files (e.g., "pre-push 2") — they're sync artifacts,
  # not real hooks. Installing them would put `.git/hooks/pre-push 2` in place
  # which git ignores but pollutes the hooks dir.
  case "$name" in
    *' 2'|*' 2.'*) continue ;;
  esac
  target="$TARGET_DIR/$name"
  cp "$src" "$target"
  chmod +x "$target"
  echo "  installed → .git/hooks/$name"
  installed=$((installed + 1))
done

if [ "$installed" -eq 0 ]; then
  echo "No hooks found in $SOURCE_DIR."
  exit 0
fi

echo "Installed $installed hook(s)."
