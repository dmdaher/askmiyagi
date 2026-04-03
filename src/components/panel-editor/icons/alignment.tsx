'use client';

import { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/** Vertical anchor line at x=1, two rects aligned left */
export function AlignLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="1" y1="0" x2="1" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="2" width="7" height="2.5" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="2.5" y="7.5" width="4.5" height="2.5" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}

/** Dashed vertical center line at x=6, two rects centered */
export function AlignCenterHIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="6" y1="0" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
      <rect x="1.5" y="2" width="9" height="2.5" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="3" y="7.5" width="6" height="2.5" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}

/** Vertical anchor line at x=11, two rects aligned right */
export function AlignRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="11" y1="0" x2="11" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="2" width="7" height="2.5" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="5" y="7.5" width="4.5" height="2.5" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}

/** Horizontal anchor line at y=1, two rects aligned top */
export function AlignTopIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="0" y1="1" x2="12" y2="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="2.5" width="2.5" height="7" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="7.5" y="2.5" width="2.5" height="4.5" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}

/** Dashed horizontal center line at y=6, two rects centered */
export function AlignMiddleVIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
      <rect x="2" y="1.5" width="2.5" height="9" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="7.5" y="3" width="2.5" height="6" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}

/** Horizontal anchor line at y=11, two rects aligned bottom */
export function AlignBottomIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="0" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="2.5" width="2.5" height="7" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="7.5" y="5" width="2.5" height="4.5" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}

/** Two vertical anchor lines (x=1, x=11), two small rects evenly spaced */
export function DistributeHIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="1" y1="0" x2="1" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="11" y1="0" x2="11" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.5" y="3" width="2" height="6" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="6.5" y="3" width="2" height="6" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}

/** Two horizontal anchor lines (y=1, y=11), two small rects evenly spaced */
export function DistributeVIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="0" y1="1" x2="12" y2="1" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="3.5" width="6" height="2" fill="currentColor" stroke="none" rx="0.5" />
      <rect x="3" y="6.5" width="6" height="2" fill="currentColor" stroke="none" rx="0.5" />
    </svg>
  );
}
