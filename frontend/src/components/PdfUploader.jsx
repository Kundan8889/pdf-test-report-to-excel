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
      className="card enterprise-workflow-card"
      style={{
        minHeight: '235px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            DOCUMENT INTAKE & EXTRACTION
          </div>
          <h2 className="card-title" style={{ margin: 0, fontSize: '1.05rem' }}>
            Upload Laboratory PDF Test Report
          </h2>
        </div>
        <span
          className="badge"
          style={{
            backgroundColor: 'var(--bg-card-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            padding: '0.35rem 0.65rem'
          }}
        >
          Supported: Scanned / Native PDF
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
          borderRadius: '0.5rem',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          backgroundColor: dragOver ? 'var(--info-box-bg)' : 'var(--bg-card-subtle)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: '130px'
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>📄</div>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', margin: 0 }}>
          Click to browse or drag & drop thermal test report (.pdf)
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Automatically extracts test parameters, channels (Input, Body, BC 1–5, Output, Ambient) and multi-tier interval matrix
        </p>
      </div>
    </div>
  );
}

