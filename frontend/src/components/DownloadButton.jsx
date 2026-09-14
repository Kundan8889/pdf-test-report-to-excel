import React from 'react';

export default function DownloadButton({
  onDownload,
  onDownloadWord,
  isReady,
  isGenerating,
  isGeneratingWord
}) {
  return (
    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Excel Download Button */}
      <button
        type="button"
        className="btn btn-excel"
        disabled={!isReady || isGenerating || isGeneratingWord}
        onClick={onDownload}
        style={{
          padding: '0.65rem 1.25rem',
          fontSize: '0.92rem',
          fontWeight: 700
        }}
        title="Download spreadsheet in Excel (.xlsx) format with formula calculations"
      >
        {isGenerating ? (
          <>
            <span className="spinner" style={{ width: '0.9rem', height: '0.9rem' }} />
            <span>Generating Excel...</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '1.05rem' }}>📊</span>
            <span>Download Excel (.xlsx)</span>
          </>
        )}
      </button>

      {/* Word Document Download Button */}
      <button
        type="button"
        className="btn btn-word"
        disabled={!isReady || isGenerating || isGeneratingWord}
        onClick={onDownloadWord}
        style={{
          padding: '0.65rem 1.25rem',
          fontSize: '0.92rem',
          fontWeight: 700
        }}
        title="Download print-ready A4 Landscape Microsoft Word (.docx) report"
      >
        {isGeneratingWord ? (
          <>
            <span className="spinner" style={{ width: '0.9rem', height: '0.9rem' }} />
            <span>Generating Word...</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '1.05rem' }}>📄</span>
            <span>Download Word (.docx)</span>
          </>
        )}
      </button>

      {!isReady && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          (Upload report to export)
        </span>
      )}
    </div>
  );
}

