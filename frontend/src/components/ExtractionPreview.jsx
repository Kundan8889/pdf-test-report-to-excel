import React, { useState } from 'react';

export default function ExtractionPreview({ data }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!data) {
    return (
      <div className="card">
        <h2 className="card-title">Extraction Details & OCR Preview</h2>
        <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>
          Upload a PDF test report to view document extraction telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>Document Extraction Details</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            onClick={() => setActiveTab('raw')}
          >
            Raw OCR Text
          </button>
        </div>
      </div>

      {activeTab === 'summary' ? (
        <div style={{ fontSize: '0.875rem', color: '#334155' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div><strong>File Name:</strong> {data.original_filename}</div>
            <div><strong>Document Mode:</strong> {data.is_scanned ? 'Scanned / OCR Extracted' : 'Native Digital PDF'}</div>
            <div><strong>Extracted Channels:</strong> {data.readings ? data.readings.length : 0}</div>
            <div><strong>Compliance Status:</strong> <span className={`badge ${data.failed_points === 0 ? 'badge-success' : 'badge-danger'}`}>{data.metadata?.conclusion || 'COMPLIES'}</span></div>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#0f172a', color: '#e2e8f0', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', maxHeight: '140px', overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {data.raw_text_snippet || 'No raw text snippet available.'}
        </div>
      )}
    </div>
  );
}
