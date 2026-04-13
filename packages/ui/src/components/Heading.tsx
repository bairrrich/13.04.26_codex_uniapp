import { tokens } from '../tokens';

export interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  textAlign?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
  className?: string;
}

const sizeMap = {
  1: { fontSize: tokens.fontSizes['3xl'], fontWeight: 700 },
  2: { fontSize: tokens.fontSizes['2xl'], fontWeight: 600 },
  3: { fontSize: tokens.fontSizes.xl, fontWeight: 600 },
  4: { fontSize: tokens.fontSizes.lg, fontWeight: 600 },
} as const;

export function Heading({
  children,
  level = 2,
  textAlign,
  style,
  className,
}: HeadingProps) {
  const Component = `h${level}` as const;
  const sizes = sizeMap[level];

  return (
    <Component
      className={className}
      style={{
        margin: 0,
        color: tokens.colors.text,
        textAlign,
        ...sizes,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
