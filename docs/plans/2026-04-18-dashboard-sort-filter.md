# Dashboard Sort & Filter — Design

## Context
Admin dashboard has 10+ instruments as flat grid. Need lightweight sort/filter to organize.

## Design
Single row above card grid with 3 controls:

```
[Sort: Status ▾]  [Filter: All Manufacturers ▾]  [□ Ready for Editor]
```

### Sort dropdown (4 options)
- **Status** (default) — running > paused > failed > completed
- **Manufacturer** — alphabetical grouping
- **Cost** — highest spend first
- **Recent** — most recently updated first

### Manufacturer filter
- Auto-populated from data
- "All Manufacturers" default

### "Ready for Editor" toggle
- Filters to instruments at `phase-0-layout-engine` + status `paused`
- These are the ones needing "Send to Contractor"

## Implementation
- All client-side — no API changes
- ~40 lines added to `PipelineDashboard.tsx`
- useState for sort/filter, useMemo for computed list
- No new components or files
