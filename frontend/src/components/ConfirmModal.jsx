import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = "Reset Document & Matrix?",
  message = "Are you sure you want to reset? This will clear the currently loaded test report, all extracted thermal channels, and any manual edits.",
  confirmLabel = "Yes, Reset Everything",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger"
}) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(9, 13, 22, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '1.25rem',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--modal-shadow)',
          overflow: 'hidden',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Top Accent Strip */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: isDanger ? 'var(--danger-gradient)' : 'var(--brand-gradient)'
          }}
        />

        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.25rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'var(--bg-card-subtle)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            lineHeight: 1,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          ✕
        </button>

        {/* Modal Main Content */}
        <div style={{ padding: '1.75rem 1.75rem 1.25rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.15rem' }}>
            {/* Vector SVG Icon Badge */}
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '1rem',
                backgroundColor: isDanger ? 'var(--danger-bg)' : 'var(--warning-bg)',
                color: isDanger ? 'var(--danger-text)' : 'var(--warning-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${isDanger ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                boxShadow: isDanger
                  ? '0 4px 14px rgba(239, 68, 68, 0.2)'
                  : '0 4px 14px rgba(245, 158, 11, 0.2)'
              }}
            >
              {isDanger ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>

            <div style={{ flex: 1, paddingRight: '1.5rem' }}>
              <h3
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em'
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55
                }}
              >
                {message}
              </p>
            </div>
          </div>

          {/* Clean SVG Info Pill */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--brand-light)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              i
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              You will be returned to the PDF upload screen to process a new report.
            </span>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div
          style={{
            padding: '1.15rem 1.75rem',
            backgroundColor: 'var(--bg-card-subtle)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '0.65rem'
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            style={{
              padding: '0.65rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              borderRadius: '0.65rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            {isDanger && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


