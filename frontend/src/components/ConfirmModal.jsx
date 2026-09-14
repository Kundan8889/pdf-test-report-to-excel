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
        backgroundColor: 'rgba(9, 13, 22, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '1.25rem',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--modal-shadow)',
          overflow: 'hidden',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Top Accent Line */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: isDanger ? 'var(--danger-gradient)' : 'var(--brand-gradient)'
          }}
        />

        {/* Modal Content */}
        <div style={{ padding: '1.75rem 1.75rem 1.25rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.15rem' }}>
            {/* Animated / Glowing Icon Container */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '1rem',
                backgroundColor: isDanger ? 'var(--danger-bg)' : 'var(--warning-bg)',
                color: isDanger ? 'var(--danger-text)' : 'var(--warning-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0,
                border: `1px solid ${isDanger ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                boxShadow: isDanger ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 4px 12px rgba(245, 158, 11, 0.15)'
              }}
            >
              {isDanger ? '🗑️' : '⚠️'}
            </div>

            <div style={{ flex: 1 }}>
              <h3
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em'
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  margin: '0.6rem 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55
                }}
              >
                {message}
              </p>
            </div>
          </div>

          {/* Info Note Pill */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.65rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1rem' }}>ℹ️</span>
            <span>You will return to the upload screen to process a new report.</span>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
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
              padding: '0.6rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            style={{
              padding: '0.6rem 1.35rem',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

