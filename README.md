# PDF Test Report to Excel

Enterprise tool for converting laboratory thermal & temperature rise test reports from PDF into structured Excel (.xlsx) workbooks with automated temperature-rise ($\Delta T = \text{Actual} - \text{Ambient}$) calculations.

## Architecture

```
pdf-test-report-to-excel/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── PdfUploader.jsx
│   │   │   ├── UploadProgress.jsx
│   │   │   ├── ExtractionPreview.jsx
│   │   │   ├── TestInformation.jsx
│   │   │   ├── TemperatureTable.jsx
│   │   │   ├── ValidationWarning.jsx
│   │   │   └── DownloadButton.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── upload.py
│   │   │       ├── extraction.py
│   │   │       └── excel.py
│   │   ├── services/
│   │   │   ├── pdf_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── extraction_service.py
│   │   │   ├── temperature_service.py
│   │   │   └── excel_service.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   ├── utils/
│   │   │   ├── calculations.py
│   │   │   └── file_utils.py
│   │   └── main.py
│   ├── uploads/
│   ├── outputs/
│   ├── requirements.txt
│   └── .env
│
├── README.md
└── .gitignore
```

## Running the Application

### 1. Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend will be accessible at: `http://127.0.0.1:8000`  
Health check endpoint: `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be accessible at: `http://localhost:5173`

cd ~/pdf-test-report-to-excel/frontend
npm run build
sudo rsync -av --delete dist/ /var/www/pdf-test-report/

cd ~/pdf-test-report-to-excel/backend
./venv/bin/python -m compileall app
sudo systemctl restart pdf-test-report
