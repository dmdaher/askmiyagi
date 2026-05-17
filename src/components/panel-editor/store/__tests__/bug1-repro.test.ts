import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';

describe('Bug 1 repro: setLabelPosition after hidden → external should snap on FIRST click', () => {
  beforeEach(() => {
    useEditorStore.setState({
      controlScale: 1,
      snapGrid: 1,
      controls: {
        c1: { id: 'c1', x: 100, y: 100, w: 40, h: 40, type: 'button', sectionId: 's1', label: 'TEST', labelPosition: 'above' } as any,
      } as any,
      editorLabels: [
        { id: 'lbl-c1', controlId: 'c1', text: 'TEST', x: 100, y: 80, w: 40, fontSize: 8, align: 'center', hidden: false } as any,
      ],
      sections: { s1: { id: 's1', x: 0, y: 0, w: 500, h: 500, childIds: ['c1'], archetype: 'grid' } } as any,
    } as any);
  });

  it('drag label → hide → externalize: x/y should be recomputed on FIRST externalize (currently BUGGY — expects to fail before fix)', () => {
    const store = useEditorStore.getState();

    // 1. Drag label down by 50px
    store.moveLabel('lbl-c1', 0, 50);
    let lbl = useEditorStore.getState().editorLabels.find((l: any) => l.id === 'lbl-c1') as any;
    expect(lbl.y).toBe(130);
    console.log('After drag:                 y =', lbl.y, ' hidden =', lbl.hidden);

    // 2. Set position to 'hidden' (sets hidden: true on the label)
    store.setLabelPosition(['c1'], 'hidden' as any);
    lbl = useEditorStore.getState().editorLabels.find((l: any) => l.id === 'lbl-c1') as any;
    expect(lbl.hidden).toBe(true);
    expect(lbl.y).toBe(130);  // dragged y preserved while hidden
    console.log('After setLabelPosition(hidden): y =', lbl.y, ' hidden =', lbl.hidden);

    // 3. FIRST click "above" — bug: existing.hidden=true triggers Case A, x/y NOT updated
    store.setLabelPosition(['c1'], 'above' as any);
    lbl = useEditorStore.getState().editorLabels.find((l: any) => l.id === 'lbl-c1') as any;
    expect(lbl.hidden).toBe(false);
    const yAfterFirstClick = lbl.y;
    console.log('After FIRST setLabelPosition(above):  y =', yAfterFirstClick, ' hidden =', lbl.hidden);

    // 4. SECOND click "above" — existing.hidden=false now, Case B triggers, x/y recomputed
    store.setLabelPosition(['c1'], 'above' as any);
    lbl = useEditorStore.getState().editorLabels.find((l: any) => l.id === 'lbl-c1') as any;
    const yAfterSecondClick = lbl.y;
    console.log('After SECOND setLabelPosition(above): y =', yAfterSecondClick, ' hidden =', lbl.hidden);

    // EVIDENCE: first click leaves stale y; second click fixes it. Bug = first != second.
    if (yAfterFirstClick !== yAfterSecondClick) {
      console.log('🐛 BUG REPRODUCED: first click y=' + yAfterFirstClick + ', second click y=' + yAfterSecondClick);
    } else {
      console.log('✅ BUG NOT REPRODUCED (or fix is live): first==second==' + yAfterFirstClick);
    }
    // Assert the desired behavior: first click should already equal second click (i.e. correct on first try)
    expect(yAfterFirstClick).toBe(yAfterSecondClick);
  });
});
