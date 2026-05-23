import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useEditorStore } from '../../store';
import MixedSelectionPanel from '../MixedSelectionPanel';
import type { SelectableId } from '../../store/selection-types';

/**
 * Phase 5 — MixedSelectionPanel renders count breakdown + Delete CTA.
 * Tests focus on the routing-time contract: given a unified `selection`
 * with mixed entries, render the right breakdown text and protect/expose
 * the Delete button per the control-protection policy.
 */

function setStoreState(selection: SelectableId[], labels: any[] = []) {
  useEditorStore.setState({
    selection,
    editorLabels: labels,
    controls: {},
    sections: {},
    polishBanners: [],
    controlContainers: [],
  } as any);
}

describe('MixedSelectionPanel — breakdown text', () => {
  it('renders "1 control, 1 label" for a control + standalone label', () => {
    setStoreState(
      ['control:c1' as SelectableId, 'label:lbl1' as SelectableId],
      [{ id: 'lbl1', text: 'L1', controlId: null }],
    );
    render(<MixedSelectionPanel />);
    expect(screen.getByTestId('mixed-selection-breakdown').textContent).toBe('1 control, 1 label');
    expect(screen.getByText('2 selected')).toBeTruthy();
  });

  it('plural-izes correctly — "2 controls, 3 labels"', () => {
    setStoreState(
      [
        'control:c1' as SelectableId,
        'control:c2' as SelectableId,
        'label:lbl1' as SelectableId,
        'label:lbl2' as SelectableId,
        'label:lbl3' as SelectableId,
      ],
      [
        { id: 'lbl1', controlId: null },
        { id: 'lbl2', controlId: null },
        { id: 'lbl3', controlId: null },
      ],
    );
    render(<MixedSelectionPanel />);
    expect(screen.getByTestId('mixed-selection-breakdown').textContent).toBe(
      '2 controls, 3 labels',
    );
  });

  it('distinguishes linked vs standalone — "2 labels (1 linked)"', () => {
    setStoreState(
      ['control:c1' as SelectableId, 'label:linkedX' as SelectableId, 'label:standY' as SelectableId],
      [
        { id: 'linkedX', controlId: 'c1' },
        { id: 'standY', controlId: null },
      ],
    );
    render(<MixedSelectionPanel />);
    expect(screen.getByTestId('mixed-selection-breakdown').textContent).toContain(
      '2 labels (1 linked)',
    );
  });

  it('only-linked labels: "1 linked label"', () => {
    setStoreState(
      ['control:c1' as SelectableId, 'label:linkedX' as SelectableId],
      [{ id: 'linkedX', controlId: 'c1' }],
    );
    render(<MixedSelectionPanel />);
    expect(screen.getByTestId('mixed-selection-breakdown').textContent).toContain(
      '1 linked label',
    );
  });

  it('handles control + banner', () => {
    setStoreState(['control:c1' as SelectableId, 'banner:b1' as SelectableId]);
    render(<MixedSelectionPanel />);
    expect(screen.getByTestId('mixed-selection-breakdown').textContent).toBe('1 control, 1 banner');
  });

  it('handles control + section + label combo', () => {
    setStoreState(
      [
        'control:c1' as SelectableId,
        'section:s1' as SelectableId,
        'label:lbl1' as SelectableId,
      ],
      [{ id: 'lbl1', controlId: null }],
    );
    render(<MixedSelectionPanel />);
    const txt = screen.getByTestId('mixed-selection-breakdown').textContent;
    expect(txt).toContain('1 control');
    expect(txt).toContain('1 section');
    expect(txt).toContain('1 label');
  });
});

describe('MixedSelectionPanel — Delete button policy', () => {
  it('shows "Delete 1 item" + "(1 protected)" for control + standalone label', () => {
    setStoreState(
      ['control:c1' as SelectableId, 'label:lbl1' as SelectableId],
      [{ id: 'lbl1', controlId: null }],
    );
    render(<MixedSelectionPanel />);
    const btn = screen.getByTestId('mixed-selection-delete');
    expect(btn.textContent).toContain('Delete 1');
    expect(btn.textContent).toContain('1 protected');
  });

  it('hides Delete button (no deletable items) for control + linked label only', () => {
    setStoreState(
      ['control:c1' as SelectableId, 'label:linkedX' as SelectableId],
      [{ id: 'linkedX', controlId: 'c1' }],
    );
    render(<MixedSelectionPanel />);
    expect(screen.queryByTestId('mixed-selection-delete')).toBeNull();
    expect(
      screen.getByText(/No deletable items.*protected/i),
    ).toBeTruthy();
  });

  it('shows "Delete 2 items" for 2 banners + 1 control', () => {
    setStoreState(
      [
        'control:c1' as SelectableId,
        'banner:b1' as SelectableId,
        'banner:b2' as SelectableId,
      ],
    );
    render(<MixedSelectionPanel />);
    const btn = screen.getByTestId('mixed-selection-delete');
    expect(btn.textContent).toContain('Delete 2 items');
    expect(btn.textContent).toContain('1 protected');
  });
});
