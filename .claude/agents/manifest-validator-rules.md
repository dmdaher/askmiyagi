# Manifest Completeness Validator — Rules

> This is a mechanical (non-LLM) validator. Rules are implemented in code, not executed by an agent.

## When It Runs

After the Visual Extractor, before the Layout Engine. Pipeline phase: `phase-0-manifest-validator`.

## Scoring

Base score: 10.0. Deductions per issue found.

| Issue type | Deduction |
|---|---|
| Missing required field (shape, sizeClass, labelDisplay) | -0.5 per control |
| Missing LED color on LED-type control | -0.5 |
| Type accuracy error (port labeled as button) | -1.0 |
| Broken pairing (A→B but B↛A) | -1.0 |
| Invalid nestedIn reference (parent doesn't exist) | -1.0 |
| Missing interactionType | -0.25 |
| Missing buttonStyle on button-type control | -0.25 |

**Pass threshold: ≥ 9.0**

If score < 9.0: escalate to Visual Extractor for retry with specific feedback listing which controls need attention.

## Required Field Checks

For EVERY control:
- [ ] `shape` is set (not null/undefined)
- [ ] `sizeClass` is set
- [ ] `labelDisplay` is set

For controls where `type === 'button'`:
- [ ] `buttonStyle` is set

For controls where `type === 'led'` or `type === 'indicator'`:
- [ ] `ledColor` is set

For controls where `hasLed === true`:
- [ ] `ledColor` is set
- [ ] `ledBehavior` is set

For controls where `labelDisplay === 'icon-only'`:
- [ ] `icon` is set and is a valid key from HARDWARE_ICONS

## Type Accuracy Checks

| Condition | Expected | Auto-fix? |
|---|---|---|
| `verbatimLabel` contains "port" AND `type === 'button'` | `type` should be `'port'` | YES — auto-fix |
| `verbatimLabel` contains "slot" AND `type === 'button'` | `type` should be `'slot'` | YES — auto-fix |
| `verbatimLabel` contains "indicator" AND `type === 'button'` | `type` should be `'led'` | YES — auto-fix |
| `type === 'switch'` AND `positions > 2` | Consider `type: 'lever'` | FLAG — don't auto-fix |

## Pairing Checks

- If control A has `pairedWith: 'B'`, then control B MUST have `pairedWith: 'A'`
- If control A has `sharedLabel: 'X'`, then control B (its pair) MUST also have `sharedLabel: 'X'`
- Both controls in a pair MUST be in the same section

## Nesting Checks

- If control A has `nestedIn: 'B'`, control B MUST exist in the manifest
- Control B's type should be a container-capable type (wheel, screen)
- A and B MUST be in the same section

## Group Label Checks

- Every `controlId` in `groupLabels[].controlIds` MUST exist in the manifest
- All controls in a group label MUST be in the same section

## Size Class Checks

- If the parser provided bounding box areas, compute expected sizeClass:
  - Area / section median area → ratio
  - ratio > 2.0 → 'xl', 1.3-2.0 → 'lg', 0.7-1.3 → 'md', 0.4-0.7 → 'sm', < 0.4 → 'xs'
- If Visual Extractor's sizeClass differs from computed by more than 1 step, FLAG

## Auto-Fix Rules (applied before scoring)

1. `verbatimLabel` contains "port" + `type === 'button'` → set `type = 'port'`, set `labelDisplay = 'hidden'`
2. `verbatimLabel` contains "slot" + `type === 'button'` → set `type = 'slot'`, set `labelDisplay = 'hidden'`
3. `verbatimLabel` contains "indicator" + `type === 'button'` → set `type = 'led'`
4. Missing `shape` on `type === 'knob'` or `type === 'encoder'` → set `shape = 'circle'`
5. Missing `shape` on `type === 'pad'` → set `shape = 'square'`
6. Missing `orientation` on `type === 'fader'` or `type === 'slider'` → set `orientation = 'vertical'`
7. Missing `interactionType` on `type === 'knob'` → set `interactionType = 'rotary'`
8. Missing `interactionType` on `type === 'fader'` → set `interactionType = 'slide'`
9. Missing `sizeClass` → compute from parser bounding box area relative to section median

## Output

The validator writes:
1. The corrected manifest (with auto-fixes applied) to `.pipeline/{deviceId}/manifest.json`
2. A validation report to `.pipeline/{deviceId}/validation-report.json`:

```json
{
  "score": 9.5,
  "passed": true,
  "autoFixes": [
    { "controlId": "usb-port", "field": "type", "from": "button", "to": "port", "rule": "label-contains-port" }
  ],
  "flags": [
    { "controlId": "direction-lever", "field": "type", "message": "type is 'switch' but positions > 2, consider 'lever'" }
  ],
  "missing": [
    { "controlId": "shortcut-btn", "field": "surfaceColor", "severity": "minor" }
  ],
  "totalControls": 61,
  "fullyEnriched": 54,
  "partiallyEnriched": 5,
  "unenriched": 2
}
```
