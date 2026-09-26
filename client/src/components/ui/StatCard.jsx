import React from 'react';

/**
 * StatCard — KPI metric tile
 * Props: icon (jsx), label, value, sub, trend ('up'|'down'|'neutral'), trendValue, accentColor
 */
export default function StatCard({ icon, label, value, sub, trend, trendValue, accentColor = 'sky' }) {
  const colors = {
    sky:     { bg: 'rgba(14,165,233,0.10)',  border: 'rgba(14,165,233,0.20)',  text: '#0ea5e9',  glow: 'rgba(14,165,233,0.20)'  },
    green:   { bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.20)',  text: '#10b981',  glow: 'rgba(16,185,129,0.20)'  },
    amber:   { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.20)',  text: '#f59e0b',  glow: 'rgba(245,158,11,0.20)'  },
    rose:    { bg: 'rgba(244,63,94,0.10)',   border: 'rgba(244,63,94,0.20)',   text: '#f43f5e',  glow: 'rgba(244,63,94,0.20)'   },
    violet:  { bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.20)',  text: '#8b5cf6',  glow: 'rgba(139,92,246,0.20)'  },
    neutral: { bg: 'var(--color-muted)',     border: 'var(--color-border)',    text: 'var(--color-secondary)', glow: 'transparent' },
  };
  const c = colors[accentColor] || colors.sky;

  const trendIcon = trend === 'up'
    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />;

  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#f43f5e' : 'var(--color-secondary)';

  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: `1px solid var(--color-border)`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 30px ${c.glow}`;
      e.currentTarget.style.borderColor = c.border;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      e.currentTarget.style.borderColor = 'var(--color-border)';
    }}>
      {/* Background tint */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${c.bg} 0%, transparent 60%)`,
        borderRadius: 'inherit',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon + trend row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          {/* Icon box */}
          <div style={{
            width: '44px', height: '44px',
            borderRadius: 'var(--radius-md)',
            background: c.bg,
            border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: c.text,
            flexShrink: 0,
          }}>
            {icon}
          </div>
          {/* Trend badge */}
          {trendValue && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '3px 8px',
              background: trend === 'up' ? 'rgba(16,185,129,0.10)' : trend === 'down' ? 'rgba(244,63,94,0.10)' : 'var(--color-muted)',
              border: `1px solid ${trend === 'up' ? 'rgba(16,185,129,0.20)' : trend === 'down' ? 'rgba(244,63,94,0.20)' : 'var(--color-border)'}`,
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: trendColor,
            }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>{trendIcon}</svg>
              {trendValue}
            </div>
          )}
        </div>

        {/* Value */}
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.1, marginBottom: '6px', letterSpacing: '-0.04em' }}>
          {value ?? '—'}
        </div>

        {/* Label */}
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: sub ? '4px' : 0 }}>
          {label}
        </div>

        {/* Sub */}
        {sub && <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>{sub}</div>}
      </div>
    </div>
  );
}
