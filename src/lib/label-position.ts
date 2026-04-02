/**
 * Compute floating label position — shared between editor (ControlNode)
 * and codegen API. Single source of truth for label placement.
 */

export interface LabelPositionResult {
  x: number;
  y: number;
  w: number;
  align: 'left' | 'center' | 'right';
  fontSize: number;
}

export function computeLabelPosition(
  controlX: number,
  controlY: number,
  controlVisW: number,
  controlVisH: number,
  labelPosition: string,
  labelText: string,
  fontSize: number,
  secondaryLabel?: string,
): LabelPositionResult | null {
  if (labelPosition === 'on-button' || labelPosition === 'hidden') return null;

  const lineH = fontSize + 4; // match actual CSS line-height (leading-tight + padding)
  const primaryLines = (labelText ?? '').split('\n').length;
  const secondaryLines = secondaryLabel ? 1 : 0;
  const totalLabelH = (primaryLines + secondaryLines) * lineH;
  const minLabelW = 60;
  const gap = 6;

  let x: number, y: number, w: number;
  let align: 'left' | 'center' | 'right' = 'center';

  switch (labelPosition) {
    case 'above':
    default:
      w = Math.max(controlVisW, minLabelW);
      x = controlX + controlVisW / 2 - w / 2;
      y = controlY - totalLabelH - gap;
      break;
    case 'below':
      w = Math.max(controlVisW, minLabelW);
      x = controlX + controlVisW / 2 - w / 2;
      y = controlY + controlVisH + gap;
      break;
    case 'left':
      w = Math.max(controlVisW * 1.5, minLabelW);
      x = controlX - w - 4;
      y = controlY + controlVisH / 2 - totalLabelH / 2;
      align = 'right';
      break;
    case 'right':
      w = Math.max(controlVisW * 1.5, minLabelW);
      x = controlX + controlVisW + 4;
      y = controlY + controlVisH / 2 - totalLabelH / 2;
      align = 'left';
      break;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    align,
    fontSize,
  };
}
