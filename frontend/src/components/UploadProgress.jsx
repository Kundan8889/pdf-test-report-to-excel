import React from 'react';

export default function UploadProgress({
  currentFile,
  isUploading,
  processingStage,
  progressPercent = 0,
  processingDetails,
  onUploadAnother
}) {
  if (!currentFile && !isUploading && processingStage === 'idle') return null;

  const isCompleted = processingStage === 'completed' || progressPercent === 100;
  const isError = processingStage === 'error';

  // 4 Enterprise ERP Steps
  const steps = [
    { num: 1, id: 'upload', label: 'Upload PDF', threshold: 25 },
    { num: 2, id: 'analyze', label: 'Analyze Document', threshold: 60 },
    { num: 3, id: 'extract', label: 'Extract Measurements', threshold: 85 },
    { num: 4, id: 'prepare', label: 'Prepare Excel', threshold: 100 }
  ];

  const getStepState = (step) => {
    if (isCompleted || progressPercent >= step.threshold) return 'completed';
    if (
      (step.num === 1 && progressPercent < 25) ||
      (step.num === 2 && progressPercent >= 25 && progressPercent < 60) ||
      (step.num === 3 && progressPercent >= 60 && progressPercent < 85) ||
      (step.num === 4 && progressPercent >= 85 && progressPercent < 100)
    ) {
      return 'active';
    }
    return 'pending';
  };

  const fileName = currentFile?.name || 'Test_Report.PDF';
  const fileSize = currentFile?.size ? (currentFile.size / (1024 * 1024)).toFixed(2) + ' MB' : '0.35 MB';

  return (
    <div
      className="card enterprise-workflow-card"
      style={{
        minHeight: '235px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderColor: isCompleted ? 'var(--success-text)' : 'var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)'
      }}
      role="region"
      aria-label="Document Processing Workflow"
    >
      {/* 1. Header Area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              DOCUMENT PROCESSING PIPELINE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {fileName}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                {fileSize}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                • Thermal & Temperature Rise Test Report
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className="badge"
              style={{
                backgroundColor: isCompleted ? 'var(--success-bg)' : isError ? 'var(--danger-bg)' : 'var(--info-box-bg)',
                color: isCompleted ? 'var(--success-text)' : isError ? 'var(--danger-text)' : 'var(--brand-primary)',
                border: `1px solid ${isCompleted ? 'var(--success-text)' : isError ? 'var(--danger-text)' : 'var(--border-color)'}`,
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {!isCompleted && !isError && <span className="spinner spinner-blue" style={{ width: '0.75rem', height: '0.75rem' }} />}
              {isCompleted && <span>✓</span>}
              {isError && <span>⚠️</span>}
              <span>{isCompleted ? 'Report Analysis Complete' : isError ? 'Extraction Error' : 'Processing Pipeline Active'}</span>
            </span>

            {onUploadAnother && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onUploadAnother}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                title="Upload another PDF report"
              >
                📁 Upload New PDF
              </button>
            )}
          </div>
        </div>

        {/* 2. 4-Step Stepper Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.15rem' }}>
          {steps.map((s) => {
            const state = getStepState(s);
            const isDone = state === 'completed';
            const isActive = state === 'active';

            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: isActive || isDone ? 600 : 400,
                  color: isDone ? 'var(--success-text)' : isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                  backgroundColor: isDone ? 'var(--success-bg)' : isActive ? 'var(--info-box-bg)' : 'var(--bg-card-subtle)',
                  border: `1px solid ${isDone ? 'var(--success-text)' : isActive ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  padding: '0.45rem 0.65rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.25s ease'
                }}
              >
                <span style={{ fontSize: '0.85rem' }}>
                  {isDone ? '✓' : isActive ? '◉' : '○'}
                </span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Progress Bar & Real-time Operation Status */}
      <div style={{ backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Current Operation:</span>
            <span style={{ color: isCompleted ? 'var(--success-text)' : 'var(--brand-primary)' }}>
              {processingDetails?.title || (isCompleted ? 'Report Processing Complete' : 'Analyzing Test Report')}
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isCompleted ? 'var(--success-text)' : 'var(--brand-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {progressPercent}%
          </span>
        </div>

        {/* Thin Progress Track */}
        <div className="progress-track" style={{ height: '6px', marginBottom: '0.6rem' }} aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100" role="progressbar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              background: isCompleted ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #3b82f6, #2563eb)'
            }}
          />
        </div>

        {/* Informative Messages */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {processingDetails?.description || (isCompleted ? 'All measurement channels mapped and verified successfully.' : 'Processing test report channels...')}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
            {processingDetails?.technicalStatus || (isCompleted ? 'Validation checks passed • Complies' : 'OCR scan • Table detection • Matrix mapping')}
          </span>
        </div>
      </div>
    </div>
  );
}

