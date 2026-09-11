/**
 * API Service for communication with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
  /**
   * Health check endpoint
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) {
        throw new Error(`Health check failed: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  /**
   * Uploads and automatically processes a PDF report
   * @param {File} file
   */
  async uploadPdf(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to process PDF report');
    }
    return data;
  },

  /**
   * Generates formatted Excel workbook and returns download URL
   */
  async generateExcel(metadata, intervals, fileName) {
    const res = await fetch(`${API_BASE_URL}/generate-excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata,
        intervals,
        file_name: fileName || 'Temperature_Rise_Test_Report.xlsx'
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to generate Excel document');
    }
    return data;
  },

  /**
   * Generates formatted A4 Landscape Word document (.docx) and returns download URL
   */
  async generateWord(metadata, intervals, fileName) {
    const res = await fetch(`${API_BASE_URL}/generate-word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata,
        intervals,
        file_name: fileName || 'Temperature_Rise_Test_Report.docx'
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to generate Word document');
    }
    return data;
  },

  /**
   * Returns download URL for a document file
   */
  getDownloadUrl(fileId) {
    return `${API_BASE_URL}/download/${fileId}`;
  }
};
