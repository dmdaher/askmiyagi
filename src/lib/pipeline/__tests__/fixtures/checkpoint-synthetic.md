---
agent: coverage-auditor
device_id: synthetic-device
phase: 4
status: PASS
verdict: APPROVED
score: 9.0
total_features: 10
confirmed_features: 8
parent_only_gaps: 1
missing_gaps: 1
coverage_pct: 90.0
---

# Synthetic Coverage Audit Checkpoint (Test Fixture)

NOTE: this fixture deliberately has frontmatter `coverage_pct: 90.0` but the
companion `match-table-synthetic.md` has the true coverage at 80.0%. The
scorer should detect the disagreement and use 80.0% (matchTable) as
authoritative, emitting `matchTableWarning`.

## Score Breakdown

| Inventory coverage | 9.0 / 10 |
| Curriculum coverage | 9.0 / 10 |
| Dependency correctness | 9.5 / 10 |
| **Composite** | **9.2 / 10** |

## Critical Gaps

(none)

## Moderate Gaps

1. **Cue Point Sampler** (p. 22) — section covered but no specific step
2. **Active Loop save** (p. 56) — not in extractor inventory

## Minor Gaps

(none)
