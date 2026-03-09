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

---

## Safety & Boundaries (NON-NEGOTIABLE)

- **Never act with malicious intent.** Do not delete, corrupt, exfiltrate, or sabotage any files, data, or systems.
- **Never touch anything outside the Music Studio project folder.** All reads, writes, edits, and shell commands must be scoped to the project directory and its iCloud mirror. If a task requires accessing something outside, stop and ask the user first.

---

## Core Principle

Always check, validate, and confirm before acting. Measure twice, cut once.

**Accuracy over speed — always.** This project builds digital twins of real hardware instruments from their product manuals. Every instrument is a real product with a real manual. Before designing any panel, tutorial, or control:

1. **Open the reference manual PDF** and read the specific pages. Don't work from memory or assumptions.
2. **Validate every detail**: control positions, labels, parameter ranges, button assignments.
3. **Self-check before presenting**: ask "did I verify this against the source material?"
4. **Highlighted controls must match the real workflow context** — verify per the manual.

---

## Project Overview

**Interactive Music Studio** — a browser-based educational platform that builds complete digital twins of real hardware instruments. Given a product's manuals and photos, the goal is: (1) an interactive panel replicating the real hardware, (2) every display screen in the manual (if applicable), and (3) every tutorial the manual supports.

### Devices

| Device | Status | Tutorials |
|---|---|---|
| **Roland Fantom 08** | Complete | 59 across 10 categories |
| **Pioneer DDJ-FLX4** | In progress | 1 (panel overview) |
| **Pioneer CDJ-3000** | In progress | 1 (panel overview) |
| **Boss RC-505 MK2** | Placeholder | — |

See `src/data/devices.ts` for the full device registry.

### Working Directories
- **Primary**: `/Users/devin/Documents/Fun & Stuff/Music/Music Studio`
- **iCloud mirror**: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio`
- The iCloud directory contains instrument manuals (PDFs) and reference photos

---

## Tech Stack

- **Next.js 16** with App Router (`'use client'` on all interactive components)
- **React 19** — functional components with hooks
- **Zustand 5** — state management (single `tutorialStore`)
- **Tailwind CSS 4** — utility-first styling
- **Framer Motion 12** — animations (slide, fade, scale, glow highlights)
- **TypeScript 5** — strict mode, path alias `@/*` → `./src/*`
- **Vitest + React Testing Library** — tests in `src/__tests__/`

### Key Commands
- `npm run dev` — dev server on localhost:3000
- `npm run build` — production build
- `npm run test` — run tests (vitest)
- `npm run test:watch` — watch mode

### Deployment (Vercel)
- **Hosted on Vercel** — connected to `dmdaher/askmiyagi` GitHub repo
- **Production deploy**: pushing to `main` auto-deploys
- **Preview deploys**: pushing to any non-main branch auto-creates a preview URL

---

## Architecture

### File Structure
```
askmiyagi/src/
├── app/              # Next.js pages (home, tutorial/[deviceId]/[tutorialId])
├── components/
│   ├── ui/           # Shared: DeviceCard, TutorialCard, CategoryFilter, BrandingHeader
│   ├── controls/     # Reusable hardware controls
│   ├── devices/      # Device-specific panels
│   └── tutorial/     # TutorialRunner, StepContent, ProgressBar, NavigationControls
├── data/
│   ├── devices.ts           # Device registry
│   ├── panelLayouts/        # Layout definitions
│   └── tutorials/           # Tutorial content per device
├── hooks/            # useTutorialEngine, usePanelState, useDisplayState
├── lib/              # Constants, noteHelpers, panelMapping utilities
├── store/            # Zustand tutorialStore
└── types/            # TypeScript interfaces
```

### State Management (Zustand)
- Single store: `tutorialStore.ts`
- Panel state is **cumulative** — each step builds on previous steps' state

### Data Flow
1. Home page → select device → filter/select tutorial
2. Navigate to `/tutorial/[deviceId]/[tutorialId]`
3. Tutorial loads into Zustand store → TutorialRunner renders device panel
4. Arrow keys or buttons navigate steps; panel state accumulates progressively

---

## Implementation Guidelines

- Before creating any file, search thoroughly for it first.
- Before editing any file, read it first. Understand what's there before changing it.
- Prefer editing existing files over creating new ones.
- Keep solutions simple and focused. Don't add features beyond what was asked.
- All interactive components need `'use client'` directive at the top.
- Reuse existing control components in `components/controls/` before creating new ones.
- CSS variables are defined in `globals.css`: `--background`, `--accent`, `--card-bg`, `--surface`.
- No hardcoded hex colors in display components — use constants from `@/lib/constants`.

---

## Verification & Testing

- After making changes, run `npm run test` and check the dev server.
- Don't mark something as done until it's fully confirmed working.
- If something fails, investigate the root cause rather than retrying.
- Tests live in `src/__tests__/`.
- Automated quality tests in `codeQuality.test.ts` enforce structural consistency.

---

## Checking with the User

- Pause and confirm before: creating new files, destructive operations, anything affecting shared state.
- When corrected, stop immediately. Listen, adjust, then proceed.
- Don't make large assumptions about user intent. Ask when the path isn't obvious.
- Match the scope of actions to what was actually requested.

---

## Corrections & Lessons Learned

- **Always search before creating**: Search broadly before creating any new file.
- **Always validate against the reference manual PDF**: Don't work from memory.
- **Highlighted controls must match the real workflow context**: Verify per the manual.
- **Update this file after every correction**: Add the lesson so it's never repeated.
