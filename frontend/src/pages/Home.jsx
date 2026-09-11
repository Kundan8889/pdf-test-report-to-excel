import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import logo from '../assets/logo.png';
import PdfUploader from '../components/PdfUploader';
import UploadProgress from '../components/UploadProgress';
import TemperatureTable from '../components/TemperatureTable';
import ValidationWarning from '../components/ValidationWarning';
import DownloadButton from '../components/DownloadButton';
import ConfirmModal from '../components/ConfirmModal';

export default function Home() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [serverStatus, setServerStatus] = useState('checking...');
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync theme with html data-theme and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Extracted Application State
  const [currentFile, setCurrentFile] = useState(null);
  const [processingStage, setProcessingStage] = useState('idle'); // 'idle' | 'uploading' | 'analyzing' | 'extracting' | 'completed' | 'error'
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [processingDetails, setProcessingDetails] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [originalExtraction, setOriginalExtraction] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [intervals, setIntervals] = useState([]);
  const [warnings, setWarnings] = useState([]);

  // Check Backend Health on mount
  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await api.checkHealth();
        if (res.status === 'ok') {
          setServerStatus('Connected (FastAPI)');
          setIsServerOnline(true);
        } else {
          setServerStatus('Offline / Unreachable');
          setIsServerOnline(false);
        }
      } catch (err) {
        setServerStatus('Offline / Unreachable');
        setIsServerOnline(false);
      }
    }
    checkBackend();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setCurrentFile(file);
    setIsUploading(true);
    setProcessingStage('uploading');
    setUploadProgressPercent(20);
    setProcessingDetails({
      title: 'Uploading PDF Test Report',
      description: `Transferring "${file.name}" to extraction pipeline...`,
      technicalStatus: 'Binary stream transfer • Format validation'
    });
    setErrorMessage('');

    const t1 = setTimeout(() => {
      setProcessingStage('analyzing');
      setUploadProgressPercent(55);
      setProcessingDetails({
        title: 'Analyzing Document Structure',
        description: 'OCR scanning, identifying title block, test specifications & serials...',
        technicalStatus: 'Layout parsing • Metadata recognition'
      });
    }, 450);

    const t2 = setTimeout(() => {
      setProcessingStage('extracting');
      setUploadProgressPercent(85);
      setProcessingDetails({
        title: 'Extracting Measurements & Channels',
        description: 'Reading multi-interval matrix (Input, Body, BC 1-5, Output, Ambient)...',
        technicalStatus: 'Tabular matrix extraction • ΔT calculation'
      });
    }, 950);

    try {
      const response = await api.uploadPdf(file);
      clearTimeout(t1);
      clearTimeout(t2);

      if (response.success && response.data) {
        const data = response.data;
        setUploadProgressPercent(100);
        setProcessingStage('completed');
        setProcessingDetails({
          title: 'Report Processing Complete',
          description: `Calibrated 2-tier thermal matrix extracted from "${data.original_filename || file.name}".`,
          technicalStatus: 'Ready for Excel generation • Complies with test limits'
        });
        setExtractionResult(data);
        setOriginalExtraction(JSON.parse(JSON.stringify(data)));
        setMetadata(data.metadata || null);
        setIntervals(data.intervals || []);
        setWarnings(data.warnings || []);
      } else {
        setProcessingStage('error');
        setProcessingDetails({
          title: 'Extraction Error',
          description: response.message || 'Unable to parse test report document.',
          technicalStatus: 'Processing halted'
        });
        setErrorMessage(response.message || 'Upload & extraction failed.');
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setProcessingStage('error');
      setProcessingDetails({
        title: 'Extraction Error',
        description: err.message || 'Error occurred while processing the document',
        technicalStatus: 'Processing halted'
      });
      setErrorMessage(err.message || 'Error occurred while processing the document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAnother = () => {
    setCurrentFile(null);
    setProcessingStage('idle');
    setUploadProgressPercent(0);
    setProcessingDetails(null);
    setExtractionResult(null);
    setOriginalExtraction(null);
    setMetadata(null);
    setIntervals([]);
    setWarnings([]);
    setErrorMessage('');
  };

  const handleResetAll = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    setIsResetModalOpen(false);
    handleUploadAnother();
  };

  const handleResetToOriginal = () => {
    if (originalExtraction) {
      setMetadata(JSON.parse(JSON.stringify(originalExtraction.metadata || null)));
      setIntervals(JSON.parse(JSON.stringify(originalExtraction.intervals || [])));
      setWarnings(JSON.parse(JSON.stringify(originalExtraction.warnings || [])));
    }
  };

  const handleMetadataChange = (updatedMetadata) => {
    setMetadata(updatedMetadata);
  };

  const handleIntervalsChange = (updatedIntervals) => {
    setIntervals(updatedIntervals);
  };

  const handleDownloadExcel = async () => {
    if (!metadata || intervals.length === 0) {
      alert('Please upload a test report first.');
      return;
    }

    setIsGeneratingExcel(true);
    try {
      // Dynamic filename based on Serial No. (e.g. 4183_1192_0826.xlsx) or Report No.
      const rawIdent = (metadata.serial_number || metadata.report_number || 'Temperature_Rise_Test_Report').trim();
      const sanitizedName = rawIdent.replace(/[\/\\?%*:|"<>]/g, '_').trim();
      const fileName = `${sanitizedName}.xlsx`;

      const res = await api.generateExcel(metadata, intervals, fileName);

      if (res.success && res.data?.download_url) {
        const downloadLink = document.createElement('a');
        downloadLink.href = res.data.download_url;
        downloadLink.setAttribute('download', res.data.file_name || fileName);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        alert(res.message || 'Failed to generate Excel file');
      }
    } catch (err) {
      alert(`Excel download error: ${err.message}`);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const isReadyForExport = metadata !== null && intervals.length > 0;

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>PDF Test Report to Excel</h1>
          <p style={{ margin: '0.25rem 0 0 0' }}>Convert laboratory thermal & temperature rise test reports into structured Excel spreadsheets</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <img
            src={logo}
            alt="MAGTORQ Logo"
            style={{
              height: '44px',
              maxWidth: '180px',
              objectFit: 'contain',
              display: 'block',
              filter: 'var(--logo-filter)'
            }}
          />
        </div>
      </header>

      {/* Unified Enterprise Processing / Upload Card */}
      {processingStage === 'idle' && !currentFile ? (
        <PdfUploader onFileSelected={handleFileUpload} isUploading={isUploading} />
      ) : (
        <UploadProgress
          currentFile={currentFile}
          isUploading={isUploading}
          processingStage={processingStage}
          progressPercent={uploadProgressPercent}
          processingDetails={processingDetails}
          onUploadAnother={handleUploadAnother}
          onReset={handleResetAll}
        />
      )}

      {/* Structured Temperature Rise Measurements */}
      <TemperatureTable
        metadata={metadata}
        intervals={intervals}
        onIntervalsChange={handleIntervalsChange}
        onResetToOriginal={originalExtraction ? handleResetToOriginal : null}
        isUploading={isUploading}
      />

      <ValidationWarning warnings={warnings} />

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-color)' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isReadyForExport ? 'Ready to Export Excel Workbook' : 'Awaiting Report Extraction'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Generates calibrated .xlsx with exact 2-tier matrix headers, ΔT rise formulas, noise checks, and compliance status.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isReadyForExport && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetAll}
              style={{
                padding: '0.65rem 1rem',
                fontSize: '0.9rem',
                color: 'var(--danger-text)',
                borderColor: 'var(--border-color)'
              }}
              title="Reset everything and upload a new report"
            >
              🔄 Reset All
            </button>
          )}
          <DownloadButton
            onDownload={handleDownloadExcel}
            isReady={isReadyForExport}
            isGenerating={isGeneratingExcel}
          />
        </div>
      </div>

      {/* Enterprise Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Document & Matrix?"
        message="Are you sure you want to reset? This will clear the currently loaded test report, all extracted thermal channels, and any manual edits."
        confirmLabel="Yes, Reset Everything"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
