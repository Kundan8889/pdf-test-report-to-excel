from pathlib import Path
from typing import Dict, Any, List
import pdfplumber
import pypdf

class PDFService:
    @staticmethod
    def read_pdf(file_path: Path) -> Dict[str, Any]:
        """
        Reads native text, tables, and images from a PDF.
        """
        extracted_text = []
        tables = []
        images = []
        page_count = 0

        try:
            with pdfplumber.open(file_path) as pdf:
                page_count = len(pdf.pages)
                for page_idx, page in enumerate(pdf.pages):
                    txt = page.extract_text(layout=True) or ""
                    if txt.strip():
                        extracted_text.append(txt)

                    extracted_tables = page.extract_tables()
                    if extracted_tables:
                        for tbl in extracted_tables:
                            cleaned = []
                            for row in tbl:
                                if any(cell is not None and str(cell).strip() != "" for cell in row):
                                    cleaned.append([str(c).strip() if c is not None else "" for c in row])
                            if cleaned:
                                tables.append({"page": page_idx + 1, "data": cleaned})
        except Exception as e:
            print(f"pdfplumber reading error: {e}")

        # Fallback & image extraction via pypdf
        try:
            reader = pypdf.PdfReader(file_path)
            page_count = len(reader.pages)
            for page in reader.pages:
                if not extracted_text:
                    t = page.extract_text() or ""
                    if t.strip():
                        extracted_text.append(t)
                for img in page.images:
                    images.append(img)
        except Exception as e:
            print(f"pypdf image extraction error: {e}")

        combined_text = "\n".join(extracted_text)
        return {
            "text": combined_text,
            "tables": tables,
            "images": images,
            "page_count": page_count,
            "has_native_text": len(combined_text.strip()) > 30
        }
