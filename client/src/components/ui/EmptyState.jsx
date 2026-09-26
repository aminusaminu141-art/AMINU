import React from 'react';

/**
 * EmptyState — shown when a list/table has no data
 * Props: icon (emoji or jsx), title, description, action (jsx button)
 */
export default function EmptyState({ icon = '', title = 'Nothing here yet', description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      gap: '12px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-muted)',
      border: '1px dashed var(--color-border)',
    }}>
      <div style={{
        width: '72px', height: '72px',
        borderRadius: '50%',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
        marginBottom: '4px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {typeof icon === 'string' ? icon : icon}
      </div>
      <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', margin: 0, maxWidth: '320px' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}
