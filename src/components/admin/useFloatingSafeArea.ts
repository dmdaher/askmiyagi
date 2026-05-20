'use client';

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * useFloatingSafeArea — computes dynamic `padding-bottom` / `padding-top`
 * for a scroll container so that any viewport-fixed floating UI element
 * overlapping it doesn't hide scrollable content.
 *
 * Solves the third (and trickiest) of the three canvas scroll bugs
 * documented in `~/.claude/plans/prancy-dreaming-comet.md`:
 * `position: fixed` floating UI like the mini step pill / draggable
 * floating card sits in the viewport's bottom-right corner. The panel
 * preview scroll container shares that viewport region. At max scroll,
 * the bottom of the panel renders behind the floating UI — admin can't
 * see or click those controls.
 *
 * Hardcoded mode-aware padding doesn't work because:
 *  - the floating card's height depends on its content (StepContent
 *    expand/collapse)
 *  - admin can drag the floating UI anywhere on screen
 *  - viewport size + chrome state change the relative positions
 *
 * This hook measures both elements' actual bounding rects via
 * ResizeObserver and computes the minimum padding needed to push
 * scroll content above the floating UI's top edge.
 *
 * Returns `{ paddingBottom, paddingTop }` to be applied as inline style
 * on the scroll container — overrides any Tailwind pb-X class.
 *
 * Behavior:
 *  - No floating ref (anchored mode) → returns default (`16, 0`)
 *  - Floating UI present but not horizontally overlapping the scroll
 *    container → returns default
 *  - Floating UI overlaps the scroll container's bottom region →
 *    `paddingBottom = max(16, scrollContainer.bottom - floatingUI.top + 8)`
 *  - Floating UI overlaps the scroll container's top region →
 *    `paddingTop = max(0, floatingUI.bottom - scrollContainer.top + 8)`
 *  - Both top and bottom can be non-zero (rare; e.g., two floating UIs)
 *  - Clamped to `[default, scrollContainer.clientHeight * 0.7]` so admin
 *    can't scroll content entirely off-screen.
 */
interface Opts {
  scrollRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLElement | null>;
}

interface SafeArea {
  paddingBottom: number;
  paddingTop: number;
}

// Tailwind pb-16 = 64px. Default keeps that breathing room even when
// no floating UI is present (universal "scroll-content shouldn't sit
// flush against container bottom" pattern).
const DEFAULT_PADDING_BOTTOM = 64;
const DEFAULT_PADDING_TOP = 0;
const GAP_PX = 8;

function computeSafeArea(scroll: HTMLElement, floating: HTMLElement | null): SafeArea {
  if (!floating) return { paddingBottom: DEFAULT_PADDING_BOTTOM, paddingTop: DEFAULT_PADDING_TOP };
  const s = scroll.getBoundingClientRect();
  const f = floating.getBoundingClientRect();

  // Horizontal overlap check — if floating UI is completely off to one
  // side of the scroll container, no padding needed.
  const horizontalOverlap = f.right > s.left && f.left < s.right;
  if (!horizontalOverlap) {
    return { paddingBottom: DEFAULT_PADDING_BOTTOM, paddingTop: DEFAULT_PADDING_TOP };
  }

  // Vertical overlap: floating UI inside or partially inside the scroll
  // container's vertical range.
  const cap = s.height * 0.7;

  let paddingBottom = DEFAULT_PADDING_BOTTOM;
  // Floating UI's top is within or above the scroll container's bottom?
  // i.e., floating UI overlaps the BOTTOM region of the scroll container.
  if (f.top < s.bottom && f.bottom > s.bottom - cap) {
    paddingBottom = Math.max(DEFAULT_PADDING_BOTTOM, s.bottom - f.top + GAP_PX);
    paddingBottom = Math.min(paddingBottom, cap);
  }

  let paddingTop = DEFAULT_PADDING_TOP;
  // Floating UI's bottom is within or below the scroll container's top?
  // i.e., floating UI overlaps the TOP region.
  if (f.bottom > s.top && f.top < s.top + cap) {
    paddingTop = Math.max(DEFAULT_PADDING_TOP, f.bottom - s.top + GAP_PX);
    paddingTop = Math.min(paddingTop, cap);
  }

  return { paddingBottom, paddingTop };
}

export function useFloatingSafeArea({ scrollRef, floatingRef }: Opts): SafeArea {
  const [safeArea, setSafeArea] = useState<SafeArea>({ paddingBottom: DEFAULT_PADDING_BOTTOM, paddingTop: DEFAULT_PADDING_TOP });
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<SafeArea>(safeArea);

  // useLayoutEffect so the first paint already has the right padding.
  // Plain useEffect would briefly show default padding, then update —
  // creating a single-frame visual jiggle on every mount.
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const measure = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const next = computeSafeArea(scroll, floatingRef.current);
        const prev = lastRef.current;
        // Skip if delta is sub-pixel — avoids ResizeObserver feedback loop
        // (setting padding triggers layout, which triggers ResizeObserver).
        if (Math.abs(next.paddingBottom - prev.paddingBottom) < 1 && Math.abs(next.paddingTop - prev.paddingTop) < 1) return;
        lastRef.current = next;
        setSafeArea(next);
      });
    };

    // Observe both elements + the window (in case viewport resizes)
    const ro = new ResizeObserver(measure);
    ro.observe(scroll);
    if (floatingRef.current) ro.observe(floatingRef.current);
    window.addEventListener('resize', measure);
    // Also re-measure on scroll of the container itself, in case the
    // floating UI's relative position changes (it shouldn't — fixed
    // positioning — but defensively).
    scroll.addEventListener('scroll', measure, { passive: true });

    // Initial measure
    measure();

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      scroll.removeEventListener('scroll', measure);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // Intentionally re-run when refs change — the inner functions
    // capture the current ref values.
  });

  // Re-run when floatingRef.current changes (mode switches anchored ↔
  // floating ↔ mini ↔ hidden cycle different DOM elements in/out).
  useEffect(() => {
    // No-op — just establishes a dependency so the layout effect above
    // re-runs when the floating element changes identity. React handles
    // ref.current changes lazily; this useEffect+state-set pair forces
    // a re-render and thus a re-run of the layout effect.
  }, [floatingRef.current]);

  return safeArea;
}
