import React, { useState, useRef } from 'react';

export default function PdfUploader({ onFileSelected, onFileUpload, isUploading }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading) setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (onFileUpload) {
      onFileUpload(file);
    } else if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleTriggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className="card card-interactive"
      style={{
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            STEP 1 • DOCUMENT INTAKE
          </div>
          <h2 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>
            Upload Laboratory PDF Test Report
          </h2>
        </div>
        <span
          className="badge badge-primary"
          style={{
            fontSize: '0.75rem',
            padding: '0.35rem 0.75rem'
          }}
        >
          📄 Auto-Extracts Multi-Channel Matrix
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleTriggerBrowse}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px dashed ${dragOver ? 'var(--brand-primary)' : 'var(--border-dashed)'}`,
          borderRadius: '0.85rem',
          padding: '2rem 1.25rem',
          textAlign: 'center',
          backgroundColor: dragOver ? 'var(--brand-light)' : 'var(--bg-card-subtle)',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: dragOver ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none',
          minHeight: '140px'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--brand-light)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
          }}
        >
          📂
        </div>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', margin: 0, letterSpacing: '-0.01em' }}>
          Click to browse or drag & drop thermal test report (.pdf)
        </p>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '560px' }}>
          Instantly recognizes title block, test duration, serials, and calibrated temperature channels with automatic ΔT rise calculation.
        </p>
      </div>
    </div>
  );
}


