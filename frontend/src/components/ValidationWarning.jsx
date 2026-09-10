import React from 'react';

export default function ValidationWarning({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="card" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-text)' }}>
      <h2 className="card-title" style={{ color: 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '0.5rem' }}>
        <span>⚠️</span> Thermal Compliance & Validation Notices ({warnings.length})
      </h2>
      <ul style={{ paddingLeft: '1.25rem', color: 'var(--warning-text)', fontSize: '0.875rem' }}>
        {warnings.map((w, idx) => (
          <li key={idx} style={{ marginBottom: '0.25rem' }}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
