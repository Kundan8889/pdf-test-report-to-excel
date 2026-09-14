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
                # Only extract the top / first page (Page 1) as requested
                for page_idx, page in enumerate(pdf.pages[:1]):
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

        # 1. Render Full Complete Page 1 as high-res image (via pypdfium2 or pdfplumber)
        page_img_bytes = None
        try:
            import pypdfium2 as pdfium
            import io
            pdf = pdfium.PdfDocument(str(file_path))
            page_count = len(pdf)
            if page_count > 0:
                p0 = pdf[0]
                pil_img = p0.render(scale=1.5).to_pil()
                if pil_img.mode != "RGB":
                    pil_img = pil_img.convert("RGB")
                buf = io.BytesIO()
                pil_img.save(buf, format="JPEG", quality=85, optimize=True)
                page_img_bytes = buf.getvalue()
        except Exception as e:
            print(f"pypdfium2 rendering error: {e}")

        if not page_img_bytes:
            try:
                with pdfplumber.open(file_path) as pdf:
                    page_count = len(pdf.pages)
                    if pdf.pages:
                        p0 = pdf.pages[0]
                        pil_img = p0.to_image(resolution=150).original
                        if pil_img.mode != "RGB":
                            pil_img = pil_img.convert("RGB")
                        import io
                        buf = io.BytesIO()
                        pil_img.save(buf, format="JPEG", quality=85, optimize=True)
                        page_img_bytes = buf.getvalue()
            except Exception as e:
                print(f"pdfplumber rasterization error: {e}")

        if page_img_bytes:
            class PageImage:
                def __init__(self, d):
                    self.data = d
            images.append(PageImage(page_img_bytes))

        # Fallback to pypdf embedded image objects only if page rendering failed
        if not images:
            try:
                reader = pypdf.PdfReader(file_path)
                page_count = len(reader.pages)
                for page in reader.pages[:1]:
                    for img in page.images:
                        images.append(img)
            except Exception as e:
                print(f"pypdf fallback error: {e}")

        combined_text = "\n".join(extracted_text)
        return {
            "text": combined_text,
            "tables": tables,
            "images": images,
            "page_count": page_count,
            "has_native_text": len(combined_text.strip()) > 30
        }
