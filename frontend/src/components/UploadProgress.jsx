import React from 'react';

export default function UploadProgress({
  currentFile,
  isUploading,
  processingStage,
  progressPercent = 0,
  processingDetails,
  onUploadAnother,
  onReset
}) {
  if (!currentFile && !isUploading && processingStage === 'idle') return null;

  const isCompleted = processingStage === 'completed' || progressPercent === 100;
  const isError = processingStage === 'error';

  // 4 Enterprise Steps
  const steps = [
    { num: 1, id: 'upload', label: 'Upload PDF', threshold: 25 },
    { num: 2, id: 'analyze', label: 'Analyze Document', threshold: 60 },
    { num: 3, id: 'extract', label: 'Extract Measurements', threshold: 85 },
    { num: 4, id: 'prepare', label: 'Ready for Export', threshold: 100 }
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
      className="card"
      style={{
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderColor: isCompleted ? 'var(--success-border)' : 'var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}
      role="region"
      aria-label="Document Processing Workflow"
    >
      {/* 1. Header Area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              STEP 1 • DOCUMENT PROCESSING PIPELINE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {fileName}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                {fileSize}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                • Thermal &amp; Temperature Rise Report
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span
              className={`badge ${isCompleted ? 'badge-success' : isError ? 'badge-danger' : 'badge-primary'}`}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                boxShadow: isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none'
              }}
            >
              {!isCompleted && !isError && <span className="spinner spinner-blue" style={{ width: '0.75rem', height: '0.75rem' }} />}
              {isCompleted && <span style={{ fontSize: '0.9rem' }}>✓</span>}
              {isError && <span>⚠️</span>}
              <span>{isCompleted ? 'Report Analysis Complete' : isError ? 'Extraction Error' : 'AI Engine Active'}</span>
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {onUploadAnother && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onUploadAnother}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  title="Upload another PDF report"
                >
                  📁 New PDF
                </button>
              )}
              {onReset && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onReset}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.4rem 0.75rem',
                    color: 'var(--danger-text)',
                    borderColor: 'var(--danger-border)',
                    backgroundColor: 'var(--danger-bg)'
                  }}
                  title="Reset and clear all current data"
                >
                  🗑️ Reset All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. 4-Step Stepper Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
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
                  gap: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: isActive || isDone ? 700 : 500,
                  color: isDone ? 'var(--success-text)' : isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                  backgroundColor: isDone ? 'var(--success-bg)' : isActive ? 'var(--brand-light)' : 'var(--bg-card-subtle)',
                  border: `1px solid ${isDone ? 'var(--success-border)' : isActive ? 'var(--border-focus)' : 'var(--border-color)'}`,
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.65rem',
                  boxShadow: isActive ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>
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
      <div
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          padding: '1rem 1.15rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Status:</span>
            <span style={{ color: isCompleted ? 'var(--success-text)' : 'var(--brand-primary)' }}>
              {processingDetails?.title || (isCompleted ? 'Report Processing Complete' : 'Analyzing Test Report')}
            </span>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isCompleted ? 'var(--success-text)' : 'var(--brand-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {progressPercent}%
          </span>
        </div>

        {/* Animated Progress Track */}
        <div className="progress-track" style={{ height: '7px', marginBottom: '0.65rem' }} aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100" role="progressbar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              background: isCompleted ? 'var(--excel-gradient)' : 'var(--brand-gradient)'
            }}
          />
        </div>

        {/* Informative Messages */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.825rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            {processingDetails?.description || (isCompleted ? 'All measurement channels mapped and verified successfully.' : 'Processing test report channels...')}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
            {processingDetails?.technicalStatus || (isCompleted ? 'Validation checks passed • Complies' : 'OCR scan • Table detection • Matrix mapping')}
          </span>
        </div>
      </div>
    </div>
  );
}


