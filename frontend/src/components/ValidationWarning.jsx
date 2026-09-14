import React from 'react';

export default function ValidationWarning({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--warning-bg)',
        borderColor: 'var(--warning-border)',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)',
        padding: '1.25rem 1.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            color: 'var(--warning-text)'
          }}
        >
          ⚠️
        </div>
        <h2 className="card-title" style={{ color: 'var(--warning-text)', margin: 0, fontSize: '1.05rem' }}>
          Thermal Compliance &amp; Engineering Notices ({warnings.length})
        </h2>
      </div>
      <ul style={{ paddingLeft: '1.5rem', color: 'var(--warning-text)', fontSize: '0.875rem', lineHeight: 1.6 }}>
        {warnings.map((w, idx) => (
          <li key={idx} style={{ marginBottom: '0.25rem' }}>{w}</li>
        ))}
      </ul>
    </div>
  );
}

