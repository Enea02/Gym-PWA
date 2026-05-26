// Reusable skeleton block. Animated via `gt-shimmer` keyframe in globals.css.
import type { CSSProperties } from 'react';

interface Props {
  height?: number | string;
  width?: number | string;
  radius?: number;
  style?: CSSProperties;
}

export function Shimmer({ height = 16, width = '100%', radius = 10, style }: Props) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #1A2420 0%, #243028 50%, #1A2420 100%)',
        backgroundSize: '200% 100%',
        animation: 'gt-skeleton 1.4s infinite',
        ...style,
      }}
    />
  );
}

export function PageShimmer() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--page-bg, #0A0F0A)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130 }}>
        <div style={{ padding: '14px 22px 8px' }}>
          <Shimmer height={14} width={160} style={{ marginBottom: 8 }} />
          <Shimmer height={28} width={200} />
        </div>
        <div style={{ margin: '14px 22px 22px' }}>
          <Shimmer height={300} radius={26} />
        </div>
        <div style={{ margin: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map(i => <Shimmer key={i} height={80} radius={12} />)}
        </div>
      </div>
    </div>
  );
}
