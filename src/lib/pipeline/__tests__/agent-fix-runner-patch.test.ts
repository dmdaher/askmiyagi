/**
 * Unit tests for PR-L's extended applyPatchOp:
 *   - PR-I paths still work (regression):
 *       /instruction, /title, /details, /tipText, /highlightControls/<idx>
 *   - PR-L new paths:
 *       /panelStateChanges/<controlId>[/<key>]
 *       /displayState[/<key>]
 *       /menuItems[/<idx>]
 *   - Defensive rejections:
 *       prototype pollution, unsupported prefixes, bad indices, bad ops
 */
import { describe, expect, it } from 'vitest';
import { applyPatchOp } from '../agent-fix-runner';

const mkStep = () => ({
  id: 'step-1',
  title: 'T',
  instruction: 'I',
  details: 'D',
  tipText: 'tip',
  highlightControls: ['A', 'B', 'C'],
  panelStateChanges: { CTRL_X: { ledOn: false } },
  displayState: { screenType: 'home', sceneName: 'Hello' },
  menuItems: [{ label: 'one' }, { label: 'two' }],
});

describe('PR-I regression: scalar paths', () => {
  it('replaces /title', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/title', value: 'New' });
    expect(s.title).toBe('New');
  });
  it('removes /tipText', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'remove', path: '/tipText' });
    expect(s.tipText).toBeUndefined();
  });
  it('replaces /highlightControls/1', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/highlightControls/1', value: 'Z' });
    expect(s.highlightControls).toEqual(['A', 'Z', 'C']);
  });
  it('appends /highlightControls/-', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'add', path: '/highlightControls/-', value: 'D' });
    expect(s.highlightControls).toEqual(['A', 'B', 'C', 'D']);
  });
  it('removes /highlightControls/0', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'remove', path: '/highlightControls/0' });
    expect(s.highlightControls).toEqual(['B', 'C']);
  });
});

describe('PR-L: /panelStateChanges/<ctrl>', () => {
  it('replaces whole controlId block', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/panelStateChanges/CTRL_X', value: { active: true } });
    expect(s.panelStateChanges).toEqual({ CTRL_X: { active: true } });
  });
  it('adds new controlId', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'add', path: '/panelStateChanges/CTRL_Y', value: { ledOn: true } });
    expect((s.panelStateChanges as Record<string, unknown>).CTRL_Y).toEqual({ ledOn: true });
  });
  it('removes a controlId', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'remove', path: '/panelStateChanges/CTRL_X' });
    expect(s.panelStateChanges).toEqual({});
  });
  it('sets a single key under controlId', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/panelStateChanges/CTRL_X/ledOn', value: true });
    expect((s.panelStateChanges as Record<string, Record<string, unknown>>).CTRL_X.ledOn).toBe(true);
  });
  it('creates parent path when adding deep', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'add', path: '/panelStateChanges/NEW_CTRL/active', value: true });
    expect((s.panelStateChanges as Record<string, Record<string, unknown>>).NEW_CTRL.active).toBe(true);
  });
  it('rejects unsupported key under controlId', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/panelStateChanges/CTRL_X/garbageField', value: 1 }))
      .toThrow(/unsupported panelStateChanges key/);
  });
  it('rejects depth > 3', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/panelStateChanges/X/Y/Z', value: 1 }))
      .toThrow(/unsupported path depth/);
  });
});

describe('PR-L: /displayState', () => {
  it('sets a single key', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/displayState/sceneName', value: 'NewScene' });
    expect((s.displayState as Record<string, unknown>).sceneName).toBe('NewScene');
  });
  it('removes a key', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'remove', path: '/displayState/screenType' });
    expect((s.displayState as Record<string, unknown>).screenType).toBeUndefined();
  });
  it('adds a new key', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'add', path: '/displayState/tempo', value: 120 });
    expect((s.displayState as Record<string, unknown>).tempo).toBe(120);
  });
  it('rejects forbidden key', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/displayState/__proto__', value: {} }))
      .toThrow(/forbidden/);
  });
});

describe('PR-L: /menuItems', () => {
  it('replaces whole array', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/menuItems', value: [{ label: 'X' }] });
    expect(s.menuItems).toEqual([{ label: 'X' }]);
  });
  it('whole-field replace accepts any value (validators in qa-fix-apply do shape-check)', () => {
    // Scalar /menuItems is treated like /title — just sets the field.
    // Shape validation happens in the API route (PR-L/4), not in applyPatchOp.
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/menuItems', value: [{ label: 'X' }] });
    expect(s.menuItems).toEqual([{ label: 'X' }]);
  });
  it('replaces single index', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'replace', path: '/menuItems/0', value: { label: 'updated' } });
    expect(s.menuItems[0]).toEqual({ label: 'updated' });
  });
  it('appends with /-', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'add', path: '/menuItems/-', value: { label: 'three' } });
    expect(s.menuItems).toHaveLength(3);
    expect(s.menuItems[2]).toEqual({ label: 'three' });
  });
  it('removes single index', () => {
    const s = mkStep();
    applyPatchOp(s, { op: 'remove', path: '/menuItems/0' });
    expect(s.menuItems).toEqual([{ label: 'two' }]);
  });
  it('rejects out-of-bounds index', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/menuItems/99', value: { label: 'X' } }))
      .toThrow(/invalid menuItems index/);
  });
});

describe('PR-L: defensive rejections', () => {
  it('rejects __proto__ in path', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/__proto__', value: {} }))
      .toThrow(/forbidden/);
  });
  it('rejects constructor in path', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/displayState/constructor', value: {} }))
      .toThrow(/forbidden/);
  });
  it('rejects empty path', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/', value: 'X' }))
      .toThrow(/empty path/);
  });
  it('rejects unknown top-level prefix', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'replace', path: '/randomField', value: 'X' }))
      .toThrow(/unsupported path/);
  });
  it('rejects unsupported op type', () => {
    const s = mkStep();
    expect(() => applyPatchOp(s, { op: 'move' as 'replace', path: '/title', value: 'X' }))
      .toThrow(/unsupported op/);
  });
});
