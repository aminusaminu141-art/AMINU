import React from 'react';

/**
 * SkeletonLoader — pulsing placeholder while data loads
 * Props: rows (number), type ('card'|'table'|'list')
 */

const SkeletonBox = ({ w = '100%', h = '14px', rounded = 'var(--radius-sm)', mb = '0' }) => (
  <div style={{
    width: w, height: h,
    borderRadius: rounded,
    marginBottom: mb,
    background: 'linear-gradient(90deg, var(--color-muted) 25%, var(--color-border) 50%, var(--color-muted) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.5s infinite',
  }} />
);

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', flexShrink: 0, background: 'linear-gradient(90deg, var(--color-muted) 25%, var(--color-border) 50%, var(--color-muted) 75%)', backgroundSize: '200% 100%', animation: 'skeletonShimmer 1.5s infinite' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
          <SkeletonBox h="12px" w="60%" />
          <SkeletonBox h="10px" w="40%" />
        </div>
      </div>
      <SkeletonBox h="36px" mb="10px" rounded="var(--radius-md)" />
      <SkeletonBox h="12px" w="80%" mb="6px" />
      <SkeletonBox h="12px" w="55%" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '14px 18px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(90deg, var(--color-muted) 25%, var(--color-border) 50%, var(--color-muted) 75%)', backgroundSize: '200% 100%', animation: 'skeletonShimmer 1.5s infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <SkeletonBox h="11px" w="45%" />
        <SkeletonBox h="10px" w="28%" />
      </div>
      <SkeletonBox h="24px" w="70px" rounded="var(--radius-full)" />
    </div>
  );
}

export default function SkeletonLoader({ rows = 4, type = 'card' }) {
  const items = Array.from({ length: rows });
  return (
    <>
      <style>{`@keyframes skeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {type === 'card' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {items.map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {items.map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}
    </>
  );
}
