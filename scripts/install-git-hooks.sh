#!/usr/bin/env bash
# Installs committed git hooks into the local .git/hooks/ directory.
# Run once after cloning the repo, or after adding/updating a hook in .githooks/.

set -e

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
