import io
from pathlib import Path
from typing import List, Dict, Any, Union
from PIL import Image

_ocr_engine = None

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_engine = RapidOCR()
        except Exception as e:
            print(f"RapidOCR initialization error: {e}")
            _ocr_engine = False
    return _ocr_engine

class OCRService:
    @classmethod
    def extract_structured_from_image_bytes(cls, image_bytes: bytes) -> List[Dict[str, Any]]:
        """Runs OCR on image bytes and returns structured items with text, boxes and coordinates."""
        engine = get_ocr_engine()
        if not engine:
            return []

        try:
            import numpy as np
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Scale down large images to max dimension 1500 to prevent ONNX memory errors
            max_dim = 1500
            w, h = img.size
            if max(w, h) > max_dim:
                scale = max_dim / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)

            arr = np.ascontiguousarray(np.array(img))
            res0, _ = engine(arr)
            best_res = res0 or []

            # Check 90 / 270 deg rotation if low count
            if len(best_res) < 15:
                for ang in [90, 270]:
                    try:
                        rot_img = img.rotate(ang, expand=True)
                        arr_rot = np.ascontiguousarray(np.array(rot_img))
                        res_rot, _ = engine(arr_rot)
                        if res_rot and len(res_rot) > len(best_res):
                            best_res = res_rot
                    except Exception:
                        pass

            items = []
            for item in best_res:
                if not item or len(item) < 2 or not item[1]:
                    continue
                box, txt = item[0], item[1].strip()
                ymin = min(pt[1] for pt in box)
                ymax = max(pt[1] for pt in box)
                xmin = min(pt[0] for pt in box)
                xmax = max(pt[0] for pt in box)
                score = float(item[2]) if len(item) > 2 and item[2] else 0.9
                items.append({
                    'text': txt,
                    'ymin': ymin,
                    'ymax': ymax,
                    'xmin': xmin,
                    'xmax': xmax,
                    'yc': (ymin + ymax) / 2.0,
                    'xc': (xmin + xmax) / 2.0,
                    'score': score
                })
            return items
        except Exception as e:
            print(f"OCR execution error: {e}")
            return []

    @classmethod
    def extract_text_from_image_bytes(cls, image_bytes: bytes) -> str:
        """Runs OCR on raw image bytes."""
        items = cls.extract_structured_from_image_bytes(image_bytes)
        return "\n".join(it['text'] for it in items)

    @classmethod
    def extract_text_from_images(cls, images: List[Any]) -> str:
        """Iterates over embedded PDF image objects and runs OCR."""
        all_text = []
        for img_obj in images:
            try:
                data = getattr(img_obj, "data", None)
                if data:
                    txt = cls.extract_text_from_image_bytes(data)
                    if txt.strip():
                        all_text.append(txt)
            except Exception as e:
                print(f"Error processing image object: {e}")
        return "\n".join(all_text)
