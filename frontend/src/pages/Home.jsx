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
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
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

  // Extracted Application State with localStorage persistence
  const STORAGE_KEY = 'pdf_test_report_current_data';
  const ORIG_KEY = 'pdf_test_report_orig_data';

  const [currentFile, setCurrentFile] = useState(null);
  const [processingStage, setProcessingStage] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? 'completed' : 'idle';
    } catch {
      return 'idle';
    }
  });
  const [uploadProgressPercent, setUploadProgressPercent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? 100 : 0;
    } catch {
      return 0;
    }
  });
  const [processingDetails, setProcessingDetails] = useState(null);

  const [extractionResult, setExtractionResult] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [originalExtraction, setOriginalExtraction] = useState(() => {
    try {
      const saved = localStorage.getItem(ORIG_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [metadata, setMetadata] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).metadata || null : null;
    } catch {
      return null;
    }
  });
  const [intervals, setIntervals] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).intervals || [] : [];
    } catch {
      return [];
    }
  });
  const [warnings, setWarnings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).warnings || [] : [];
    } catch {
      return [];
    }
  });

  // Automatically sync to localStorage whenever state changes
  useEffect(() => {
    if (metadata && intervals && intervals.length > 0) {
      try {
        const payload = {
          metadata,
          intervals,
          warnings,
          file_id: extractionResult?.file_id || 'restored_session',
          original_filename: extractionResult?.original_filename || currentFile?.name || 'Report.pdf',
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }, [metadata, intervals, warnings, extractionResult, currentFile]);

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
          technicalStatus: 'Ready for Excel & Word generation • Complies with test limits'
        });
        setExtractionResult(data);
        setOriginalExtraction(JSON.parse(JSON.stringify(data)));
        setMetadata(data.metadata || null);
        setIntervals(data.intervals || []);
        setWarnings(data.warnings || []);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          localStorage.setItem(ORIG_KEY, JSON.stringify(data));
        } catch (e) {
          console.error('Storage error:', e);
        }
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
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ORIG_KEY);
    } catch (e) {
      console.error(e);
    }
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

  const handleDownloadWord = async () => {
    if (!metadata || intervals.length === 0) {
      alert('Please upload a test report first.');
      return;
    }

    setIsGeneratingWord(true);
    try {
      const rawIdent = (metadata.serial_number || metadata.report_number || 'Temperature_Rise_Test_Report').trim();
      const sanitizedName = rawIdent.replace(/[\/\\?%*:|"<>]/g, '_').trim();
      const fileName = `${sanitizedName}.docx`;

      const res = await api.generateWord(metadata, intervals, fileName);

      if (res.success && res.data?.download_url) {
        const downloadLink = document.createElement('a');
        downloadLink.href = res.data.download_url;
        downloadLink.setAttribute('download', res.data.file_name || fileName);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        alert(res.message || 'Failed to generate Word document');
      }
    } catch (err) {
      alert(`Word download error: ${err.message}`);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const isReadyForExport = metadata !== null && intervals.length > 0;

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>PDF Test Report to Excel & Word</h1>
          <p style={{ margin: '0.25rem 0 0 0' }}>Convert laboratory thermal & temperature rise test reports into structured Excel & Word documents</p>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Step 1: Upload Intake or Processing Pipeline */}
        {!currentFile && !isUploading ? (
          <PdfUploader
            onFileSelected={handleFileUpload}
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
          />
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

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="card" style={{ borderLeft: '4px solid var(--danger-color)', backgroundColor: 'var(--danger-bg)' }}>
            <h3 style={{ color: 'var(--danger-text)', margin: '0 0 0.5rem 0' }}>⚠️ System Notice</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{errorMessage}</p>
          </div>
        )}

        {/* Step 2: Measurement Interval Matrix */}
        <TemperatureTable
          metadata={metadata}
          intervals={intervals}
          onIntervalsChange={handleIntervalsChange}
          onMetadataChange={handleMetadataChange}
          onResetToOriginal={originalExtraction ? handleResetToOriginal : null}
          onResetAll={metadata ? handleResetAll : null}
          isUploading={isUploading}
        />

        {/* Warnings & Engineering Threshold Limits */}
        {warnings.length > 0 && (
          <ValidationWarning warnings={warnings} />
        )}

        {/* Step 4: Actions & Export Footer */}
        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            backgroundColor: 'var(--bg-card-subtle)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isReadyForExport ? 'Ready to Export Excel & Word Report' : 'Awaiting Report Extraction'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Generates calibrated .xlsx &amp; .docx with exact 2-tier matrix headers, ΔT rise formulas, noise checks, and compliance status.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {metadata && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetAll}
                style={{
                  borderColor: 'var(--danger-color)',
                  color: 'var(--danger-color)',
                  backgroundColor: 'transparent'
                }}
                title="Reset document and all extracted data"
              >
                🔄 Reset All
              </button>
            )}
            <DownloadButton
              onDownload={handleDownloadExcel}
              onDownloadWord={handleDownloadWord}
              isReady={isReadyForExport}
              isGenerating={isGeneratingExcel}
              isGeneratingWord={isGeneratingWord}
            />
          </div>
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
