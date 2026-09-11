import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = "Reset All Data?",
  message = "Are you sure you want to reset? This will clear the currently loaded test report, all extracted thermal channels, and any custom edits.",
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
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '0.85rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header & Icon */}
        <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: isDanger ? 'var(--danger-bg)' : 'var(--warning-bg)',
                color: isDanger ? 'var(--danger-text)' : 'var(--warning-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                flexShrink: 0,
                border: `1px solid ${isDanger ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`
              }}
            >
              {isDanger ? '🗑️' : '⚠️'}
            </div>

            <div style={{ flex: 1 }}>
              <h3
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em'
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Info Note */}
        <div
          style={{
            margin: '0 1.5rem 1.25rem 1.5rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.785rem',
            color: 'var(--text-muted)'
          }}
        >
          ℹ️ <strong>Note:</strong> You will be returned to the PDF upload screen to process a new report.
        </div>

        {/* Modal Action Buttons */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            backgroundColor: 'var(--bg-card-subtle)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: isDanger ? '#dc2626' : 'var(--brand-primary)',
              border: `1px solid ${isDanger ? '#b91c1c' : 'var(--brand-hover)'}`,
              boxShadow: isDanger ? '0 2px 4px rgba(220, 38, 38, 0.25)' : 'none'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
