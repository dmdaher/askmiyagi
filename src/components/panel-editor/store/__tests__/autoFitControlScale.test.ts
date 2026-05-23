import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';

function reset(extra: Record<string, unknown> = {}) {
  useEditorStore.setState({
    deviceDimensions: null,
    canvasWidth: 1875,
    canvasHeight: 564,
    controlScale: 1,
    controls: {},
    sections: {},
    ...extra,
  } as any);
}

function controlsWithMedian(w: number, count = 10) {
  const out: Record<string, any> = {};
  const half = Math.floor(count / 2);
  for (let i = 0; i < half; i++) {
    out[`k${i}`] = { id: `k${i}`, x: 0, y: 0, w, h: w, type: 'knob', sectionId: 's1', label: '' };
  }
  for (let i = 0; i < count - half; i++) {
    out[`b${i}`] = { id: `b${i}`, x: 0, y: 0, w, h: w, type: 'button', sectionId: 's1', label: '' };
  }
  return out;
}

const fantomLikeControls = () => controlsWithMedian(108);
const xdjRrLikeControls = () => controlsWithMedian(62);

describe('autoFitControlScale (Phase 10.1)', () => {
  beforeEach(() => reset());

  it('applies 0.37 for fantom-06-like controls', () => {
    reset({ controls: fantomLikeControls() });
    const ok = useEditorStore.getState().autoFitControlScale();
    expect(ok).toBe(true);
    expect(useEditorStore.getState().controlScale).toBe(0.37);
  });

  it('applies 0.65 for xdj-rr-like controls (the Phase 10.1 fix target)', () => {
    reset({ controls: xdjRrLikeControls() });
    const ok = useEditorStore.getState().autoFitControlScale();
    expect(ok).toBe(true);
    expect(useEditorStore.getState().controlScale).toBe(0.65);
  });

  it('no-ops when no controls present', () => {
    reset({ controls: {}, controlScale: 1 });
    expect(useEditorStore.getState().autoFitControlScale()).toBe(false);
    expect(useEditorStore.getState().controlScale).toBe(1);
  });

  it('no-ops when fewer than 3 button/knob samples', () => {
    reset({
      controls: {
        k1: { id: 'k1', x: 0, y: 0, w: 40, h: 40, type: 'knob', sectionId: 's', label: '' },
        k2: { id: 'k2', x: 0, y: 0, w: 40, h: 40, type: 'knob', sectionId: 's', label: '' },
      },
      controlScale: 1,
    });
    expect(useEditorStore.getState().autoFitControlScale()).toBe(false);
    expect(useEditorStore.getState().controlScale).toBe(1);
  });

  it('clamps to MIN_SCALE for huge controls', () => {
    const huge: Record<string, any> = {};
    for (let i = 0; i < 5; i++) {
      huge[`k${i}`] = { id: `k${i}`, x: 0, y: 0, w: 500, h: 500, type: 'knob', sectionId: 's', label: '' };
    }
    reset({ controls: huge });
    useEditorStore.getState().autoFitControlScale();
    expect(useEditorStore.getState().controlScale).toBe(0.15);
  });

  it('writes only controlScale — never touches sections/controls', () => {
    const controls = fantomLikeControls();
    const sections = {
      s1: { id: 's1', x: 0, y: 0, w: 100, h: 100, childIds: Object.keys(controls), archetype: 'grid' } as any,
    };
    reset({ sections, controls });
    useEditorStore.getState().autoFitControlScale();
    const after = useEditorStore.getState();
    expect(after.sections).toEqual(sections);
    expect(after.controls).toEqual(controls);
  });
});
