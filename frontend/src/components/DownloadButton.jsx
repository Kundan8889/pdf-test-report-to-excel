import React from 'react';

export default function DownloadButton({ onDownload, isReady, isGenerating }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!isReady || isGenerating}
        onClick={onDownload}
        style={{
          padding: '0.65rem 1.25rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
        }}
      >
        {isGenerating ? '⏳ Generating Excel...' : '📊 Download Excel Report (.xlsx)'}
      </button>
      {!isReady && (
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          (Upload report to enable export)
        </span>
      )}
    </div>
  );
}
