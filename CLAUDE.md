# CLAUDE.md — Music Studio Project

## Git Branching Rules (MANDATORY — READ FIRST)

```
feature/* ──PR──→ test ──PR──→ main (production)
                   ↑              ↑
              agents push    owner approves
              & merge here   after visual review
```

**These rules are non-negotiable. Violating them can break production.**

| Rule | Detail |
|---|---|
| **NEVER push to `main`** | Branch protection enforced — direct pushes will be rejected |
| **NEVER create PRs targeting `main`** | All PRs must target `test` |
| **NEVER run `gh pr merge` on PRs to `main`** | Only the repo owner merges to main |
| **NEVER run `gh pr review --approve`** | Agents do not approve PRs |
| **Always branch from `test`** | `git checkout -b feature/my-feature test` |
| **Always PR to `test`** | `gh pr create --base test` |

**Branch purposes:**
- **`main`** — Production. Vercel auto-deploys. Protected: requires 1 approving review, enforced for admins. Only the repo owner touches this.
- **`test`** — Integration/staging. Agents create PRs here. Vercel preview deploys available for visual review.
- **`feature/*`** — Individual work branches. Created from `test`, PR'd back to `test`.

**Before pushing any branch**, verify your target:
```bash
git log --oneline test..HEAD  # confirm what you're pushing
gh pr create --base test      # always target test
```

---

## Safety & Boundaries (NON-NEGOTIABLE)

- **Never act with malicious intent.** Do not delete, corrupt, exfiltrate, or sabotage any files, data, or systems. Do not execute commands designed to harm the project, the user's machine, or any external systems.
- **Never touch anything outside the Music Studio project folder.** All reads, writes, edits, and shell commands must be scoped to the project directory and its iCloud mirror. Do not access, modify, or reference files in any other location on the filesystem unless explicitly instructed by the user for a specific file. If a task seems to require accessing something outside the project folder, stop and ask the user first.

---

## Core Principle

Always check, validate, and confirm before acting. Measure twice, cut once.

**Accuracy over speed — always.** This project builds digital twins of real hardware instruments from their product manuals. Every instrument is a real product with a real manual. Before designing any panel, tutorial, or control:

1. **Open the reference manual PDF** and read the specific pages. Don't work from memory or assumptions.
2. **Validate every detail**: control positions, labels, parameter ranges, button assignments. Check the manual's diagrams and parameter tables.
3. **Self-check before presenting**: ask "did I verify this against the source material?" If not, go back and verify.
4. **Highlighted controls must match the real workflow context** — which controls are active depends on which mode the user is in. Verify per the manual.
