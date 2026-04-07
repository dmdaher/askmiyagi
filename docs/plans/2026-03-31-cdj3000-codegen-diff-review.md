# CDJ-3000 Codegen Diff Review — Plan

**Goal:** The CDJ-3000 panel was previously generated with proper sizing, positioning, and layout. Do a full diff between that working codegen output and the current codegen to understand what changed and why the Fantom-06 has issues.

**Tasks:**

1. Check git history for the last known good CDJ-3000 codegen output
2. Diff the generated CDJ-3000 panel files (CDJ3000Panel.tsx, section files, constants)
3. Diff the codegen script (scripts/panel-codegen.ts) between then and now
4. Diff the codegen API (src/app/api/pipeline/[deviceId]/codegen/route.ts)
5. Identify every change that affects positioning, sizing, or layout
6. Document which changes helped vs which broke things
7. Use findings to stabilize the codegen for all instruments

**Key question:** The CDJ-3000 was generated at controlScale=1.0 (100%). The Fantom-06 is at controlScale=0.4. Is the codegen only broken for reduced-scale workflows, or did something break for 100% too?
