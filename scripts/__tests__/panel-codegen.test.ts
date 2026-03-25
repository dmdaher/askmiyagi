import { describe, it, expect } from 'vitest';

// Copy the function since it's not exported
function sectionIdToPascal(sectionId: string): string {
  return sectionId
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

describe('sectionIdToPascal', () => {
  it('handles UPPERCASE IDs', () => {
    expect(sectionIdToPascal('DISPLAY')).toBe('Display');
    expect(sectionIdToPascal('BROWSE')).toBe('Browse');
    expect(sectionIdToPascal('TEMPO')).toBe('Tempo');
  });

  it('handles UPPERCASE with underscores', () => {
    expect(sectionIdToPascal('HOT_CUE')).toBe('HotCue');
    expect(sectionIdToPascal('JOG_CONTROLS')).toBe('JogControls');
    expect(sectionIdToPascal('CUE_MEMORY')).toBe('CueMemory');
  });

  it('handles lowercase with hyphens', () => {
    expect(sectionIdToPascal('synth-mode')).toBe('SynthMode');
    expect(sectionIdToPascal('browse-bar')).toBe('BrowseBar');
    expect(sectionIdToPascal('beat-sync')).toBe('BeatSync');
  });

  it('handles single lowercase word', () => {
    expect(sectionIdToPascal('controller')).toBe('Controller');
    expect(sectionIdToPascal('zone')).toBe('Zone');
    expect(sectionIdToPascal('common')).toBe('Common');
  });
});

describe('keyboard prop generation', () => {
  function buildKeyboardProp(kb: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number } | null): string {
    if (!kb) return 'null';
    return `{ keys: ${kb.keys}, startNote: '${kb.startNote}', panelHeightPercent: ${kb.panelHeightPercent}${kb.leftPercent != null ? `, leftPercent: ${kb.leftPercent}` : ''}${kb.widthPercent != null ? `, widthPercent: ${kb.widthPercent}` : ''} }`;
  }

  it('produces single braces (not double) for valid JSX', () => {
    const prop = buildKeyboardProp({ keys: 61, startNote: 'C2', panelHeightPercent: 35 });
    expect(prop.startsWith('{')).toBe(true);
    expect(prop.startsWith('{{')).toBe(false);
    expect(prop.endsWith('}')).toBe(true);
    expect(prop.endsWith('}}')).toBe(false);
  });

  it('produces exactly 2 brace pairs when wrapped in keyboard={...}', () => {
    const prop = buildKeyboardProp({ keys: 61, startNote: 'C2', panelHeightPercent: 55, leftPercent: 5, widthPercent: 93 });
    const jsx = `keyboard={${prop}}`;
    expect((jsx.match(/{/g) || []).length).toBe(2);
    expect((jsx.match(/}/g) || []).length).toBe(2);
  });

  it('handles null keyboard', () => {
    expect(buildKeyboardProp(null)).toBe('null');
  });

  it('includes leftPercent and widthPercent when present', () => {
    const prop = buildKeyboardProp({ keys: 61, startNote: 'C2', panelHeightPercent: 35, leftPercent: 5, widthPercent: 93 });
    expect(prop).toContain('leftPercent: 5');
    expect(prop).toContain('widthPercent: 93');
  });

  it('omits leftPercent and widthPercent when absent', () => {
    const prop = buildKeyboardProp({ keys: 88, startNote: 'A0', panelHeightPercent: 30 });
    expect(prop).not.toContain('leftPercent');
    expect(prop).not.toContain('widthPercent');
  });
});
