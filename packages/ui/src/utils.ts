import { tokens } from './tokens';

export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface SpacingProps {
  padding?: keyof typeof tokens.space | string;
  margin?: keyof typeof tokens.space | string;
  paddingX?: keyof typeof tokens.space | string;
  paddingY?: keyof typeof tokens.space | string;
  marginX?: keyof typeof tokens.space | string;
  marginY?: keyof typeof tokens.space | string;
}

export interface LayoutProps {
  flex?: number | string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: keyof typeof tokens.space | string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  minWidth?: number | string;
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
}

export interface BorderProps {
  borderRadius?: keyof typeof tokens.radius | number | string;
  borderWidth?: number;
  borderColor?: string;
}

export function resolveSpacing(spacing: SpacingProps): React.CSSProperties {
  const style: React.CSSProperties = {};
  const { space } = tokens;

  if (spacing.padding) style.padding = typeof spacing.padding === 'string' && space[spacing.padding as keyof typeof space] ? `${space[spacing.padding as keyof typeof space]}px` : spacing.padding;
  if (spacing.margin) style.margin = typeof spacing.margin === 'string' && space[spacing.margin as keyof typeof space] ? `${space[spacing.margin as keyof typeof space]}px` : spacing.margin;
  if (spacing.paddingX) {
    const v = typeof spacing.paddingX === 'string' && space[spacing.paddingX as keyof typeof space] ? `${space[spacing.paddingX as keyof typeof space]}px` : spacing.paddingX;
    style.paddingLeft = v;
    style.paddingRight = v;
  }
  if (spacing.paddingY) {
    const v = typeof spacing.paddingY === 'string' && space[spacing.paddingY as keyof typeof space] ? `${space[spacing.paddingY as keyof typeof space]}px` : spacing.paddingY;
    style.paddingTop = v;
    style.paddingBottom = v;
  }
  if (spacing.marginX) {
    const v = typeof spacing.marginX === 'string' && space[spacing.marginX as keyof typeof space] ? `${space[spacing.marginX as keyof typeof space]}px` : spacing.marginX;
    style.marginLeft = v;
    style.marginRight = v;
  }
  if (spacing.marginY) {
    const v = typeof spacing.marginY === 'string' && space[spacing.marginY as keyof typeof space] ? `${space[spacing.marginY as keyof typeof space]}px` : spacing.marginY;
    style.marginTop = v;
    style.marginBottom = v;
  }

  return style;
}

export function resolveLayout(layout: LayoutProps): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (layout.flex) style.flex = layout.flex;
  if (layout.flexDirection) style.flexDirection = layout.flexDirection;
  if (layout.justifyContent) style.justifyContent = layout.justifyContent;
  if (layout.alignItems) style.alignItems = layout.alignItems;
  if (layout.gap) style.gap = typeof layout.gap === 'string' && tokens.space[layout.gap as keyof typeof tokens.space] ? `${tokens.space[layout.gap as keyof typeof tokens.space]}px` : layout.gap;
  if (layout.width) style.width = typeof layout.width === 'number' ? `${layout.width}px` : layout.width;
  if (layout.height) style.height = typeof layout.height === 'number' ? `${layout.height}px` : layout.height;
  if (layout.maxWidth) style.maxWidth = typeof layout.maxWidth === 'number' ? `${layout.maxWidth}px` : layout.maxWidth;
  if (layout.minWidth) style.minWidth = typeof layout.minWidth === 'number' ? `${layout.minWidth}px` : layout.minWidth;
  if (layout.flexWrap) style.flexWrap = layout.flexWrap;

  return style;
}

export function resolveBorder(border: BorderProps): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (border.borderRadius) {
    const { radius } = tokens;
    style.borderRadius = typeof border.borderRadius === 'string' && radius[border.borderRadius as keyof typeof radius] ? `${radius[border.borderRadius as keyof typeof radius]}px` : border.borderRadius;
  }
  if (border.borderWidth) style.borderWidth = border.borderWidth;
  if (border.borderColor) style.borderColor = border.borderColor;

  return style;
}
