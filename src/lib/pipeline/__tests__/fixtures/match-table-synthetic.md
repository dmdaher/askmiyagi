<!-- Synthetic match-table.md fixture for coverage-scorer-match-table.test.ts -->
<!-- 10 features: 7 CONFIRMED, 1 RECLASSIFICATION (counts as confirmed), 1 CONFIRMED_BY_PARENT_ONLY, 1 MISSING -->
<!-- Total: 10, Confirmed (incl reclass): 8, Parent-only gaps: 1, Missing gaps: 1 -->
<!-- True coverage_pct = 80.0% -->

| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | Power on | 5 | CONFIRMED | basics | step-1 | Press the POWER button |
| 1.2 | Volume knob | 6 | CONFIRMED | basics | step-2 | Turn the VOLUME knob clockwise |
| 2.1 | Browse menu | 12 | CONFIRMED | browse | step-1 | Touch BROWSE to open the source list |
| 2.2 | Source select | 13 | CONFIRMED | browse | step-2 | Tap SOURCE to switch input |
| 3.1 | Cue point set | 20 | CONFIRMED | cue-points | step-1 | Press CUE while paused to set a point |
| 3.2 | Cue point jump | 21 | CONFIRMED | cue-points | step-2 | Tap CUE to jump back to the saved position |
| 3.5 | Cue Point Sampler | 22 | CONFIRMED_BY_PARENT_ONLY | cue-points |  | parent-coverage-only: true |
| 4.1 | Loop in | 30 | CONFIRMED | loops | step-1 | Press LOOP IN to mark the start |
| 4.2 | Loop out | 31 | RECLASSIFICATION | loops | step-2 | (auditor: workflow / extractor: parameter — both refer to LOOP OUT button) |
| 5.7 | Active Loop save | 56 | MISSING |  |  |  |
