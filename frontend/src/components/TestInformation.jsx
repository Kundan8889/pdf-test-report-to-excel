import React from 'react';

export default function TestInformation({ metadata, onMetadataChange }) {
  if (!metadata) {
    return (
      <div className="card">
        <h2 className="card-title">Test Metadata & Parameters</h2>
        <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>
          Upload a test report PDF to extract metadata.
        </p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    if (onMetadataChange) {
      onMetadataChange({
        ...metadata,
        [field]: value
      });
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>Test Metadata & Parameters</h2>
        <span className="badge badge-success">Auto-Extracted</span>
      </div>

      <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
            Document / Test Title
          </label>
          <input
            type="text"
            value={metadata.test_name || ''}
            onChange={(e) => handleChange('test_name', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
            Serial No. / S/N
          </label>
          <input
            type="text"
            placeholder="e.g. 4183/1192/0826"
            value={metadata.serial_number || ''}
            onChange={(e) => handleChange('serial_number', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
            Date of Test
          </label>
          <input
            type="text"
            value={metadata.test_date || ''}
            onChange={(e) => handleChange('test_date', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
            Weight / Mass
          </label>
          <input
            type="text"
            value={metadata.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
            Test Duration
          </label>
          <input
            type="text"
            value={metadata.duration || ''}
            onChange={(e) => handleChange('duration', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
            Started At
          </label>
          <input
            type="text"
            value={metadata.started_at || ''}
            onChange={(e) => handleChange('started_at', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
            Direction Changed At
          </label>
          <input
            type="text"
            value={metadata.direction_changed_at || ''}
            onChange={(e) => handleChange('direction_changed_at', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>
      </div>
    </div>
  );
}
