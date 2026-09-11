import React from 'react';

export default function DownloadButton({
  onDownload,
  onDownloadWord,
  isReady,
  isGenerating,
  isGeneratingWord
}) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Excel Download Button */}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!isReady || isGenerating || isGeneratingWord}
        onClick={onDownload}
        style={{
          padding: '0.65rem 1.15rem',
          fontSize: '0.92rem',
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
        }}
        title="Download spreadsheet in Excel (.xlsx) format"
      >
        {isGenerating ? '⏳ Generating Excel...' : '📊 Download Excel (.xlsx)'}
      </button>

      {/* Word Document Download Button */}
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!isReady || isGenerating || isGeneratingWord}
        onClick={onDownloadWord}
        style={{
          padding: '0.65rem 1.15rem',
          fontSize: '0.92rem',
          fontWeight: 600,
          backgroundColor: 'var(--brand-primary)',
          color: '#ffffff',
          borderColor: 'var(--brand-primary)',
          boxShadow: '0 2px 4px rgba(30, 58, 138, 0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
        title="Download print-ready A4 Landscape Microsoft Word (.docx) document"
      >
        {isGeneratingWord ? '⏳ Generating Word...' : '📄 Download Word (.docx) [A4 Fit]'}
      </button>

      {!isReady && (
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          (Upload report to enable export)
        </span>
      )}
    </div>
  );
}
