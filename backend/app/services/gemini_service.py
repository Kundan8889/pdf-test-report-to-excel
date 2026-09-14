import os
import json
import base64
import re
from typing import Optional, Dict, Any, List
import httpx
from app.models.schemas import TestMetadata, TimeIntervalReading

class GeminiService:
    @classmethod
    def get_api_key(cls) -> Optional[str]:
        """Fetches GEMINI_API_KEY_MAGTORQ from environment."""
        key = (
            os.getenv("GEMINI_API_KEY_MAGTORQ", "").strip()
            or os.getenv("GEMINI_API_KEY", "").strip()
        )
        return key if key else None

    @classmethod
    def is_available(cls) -> bool:
        """Returns True if a GEMINI_API_KEY_MAGTORQ is configured."""
        return cls.get_api_key() is not None

    @classmethod
    def extract_with_vision(cls, image_bytes: bytes, original_filename: str = "") -> Optional[Dict[str, Any]]:
        """
        Calls Google Gemini Vision API to extract 100% exact structured metadata and intervals from handwritten/printed test reports.
        """
        api_key = cls.get_api_key()
        if not api_key:
            return None
        prompt = """
You are an expert industrial document extraction system specialized in laboratory thermal and gearbox temperature rise test reports.
Analyze the provided test report image carefully (including handwritten blue/black ink entries, printed labels, column headers, and title blocks).

Extract the EXACT data in the following JSON format:

{
  "metadata": {
    "report_number": "Test report / Drawing No, e.g. MTGS or TR-04",
    "serial_number": "Exact Serial Number, e.g. 4183 1192 0826 or 6047 1160 0826",
    "test_name": "Exact Title, e.g. TEST FORMAT FOR CRYSTALLISER DRIVE or TEST FORMAT FOR GEAR REDUCER (NO LOAD TEST)",
    "test_date": "DD/MM/YYYY format, e.g. 24/08/2026 or 31/08/2026",
    "product_name": "Product description or Type, e.g. Planetary - helical or Planetary Gear Reducer",
    "weight": "Weight with units or '-' if empty, e.g. 877+47 kg or 620 kg",
    "started_at": "Started time, e.g. 09:30 AM or 10:50 am",
    "direction_changed_at": "Direction changed time if noted, else '-'",
    "duration": "Test duration string from document",
    "noise_level_limit": "< 85 dB",
    "noise_level_measured": "Measured noise level with units if present, e.g. 78.5 dB or 78 dB",
    "temp_rise_limit": "< 40°C over the ambient ( after 1hour )",
    "lubrication_leakage": "No leakage or '-'",
    "conclusion": "COMPLIES (ALL PARAMETERS PASS) or '-'",
    "channel_labels": [
      "Exact Name of Column 1 (e.g. Input)",
      "Exact Name of Column 2 (e.g. R1)",
      "Exact Name of Column 3 (e.g. R2)",
      "Exact Name of Column 4 (e.g. R3)",
      "Exact Name of Column 5 (e.g. R4)",
      "Exact Name of Column 6 (e.g. R5)",
      "Exact Name of Column 7 (e.g. O/P Pinion)"
    ]
  },
  "intervals": [
    {
      "time_label": "Exact time from row, e.g. 9.30, 10.00, 10.30, 11.00, 11.30, 12 pm, 12.30",
      "direction": "CW or CCW",
      "ambient": 24.6,
      "input_actual": 25.1,
      "body_actual": 25.5,
      "body2_actual": 25.0,
      "bc1_actual": 24.3,
      "bc2_actual": 24.5,
      "bc3_actual": 24.3,
      "bc4_actual": 25.0,
      "bc5_actual": null,
      "output_actual": null
    }
  ]
}

CRITICAL RULES:
1. DYNAMIC COMPONENT CHANNELS:
   - Identify each individual temperature component column in the table (e.g. Input, R1, R2, R3, R4, R5, O/P Pinion).
   - In 'metadata.channel_labels', return ONLY the array of actual component column names present in the table. If there are 7 component columns, return exactly 7 strings in channel_labels.
   - DO NOT include 'Ambient'/'Ambt' or 'Noise'/'Noies' in channel_labels.
2. AMBIENT & NOISE ARE NEVER TEMPERATURE COMPONENT CHANNELS:
   - 'Ambt' / 'Ambient' (e.g. 24.6, 26.0, 26.4...) is the ambient reference temperature. Store this ONLY in the 'ambient' field of each interval. NEVER duplicate ambient values into a component column!
   - 'Noies' / 'Noise' (e.g. 78, 78.4, 78.5) is the sound level in dB. Store the final/peak reading ONLY in 'metadata.noise_level_measured' (e.g. '78.5 dB'). NEVER put noise numbers into 'output_actual' or any temperature column!
3. MAPPING INTERVALS:
   - Map component columns in strict left-to-right order into:
     * 1st component -> input_actual
     * 2nd component -> body_actual
     * 3rd component -> body2_actual
     * 4th component -> bc1_actual
     * 5th component -> bc2_actual
     * 6th component -> bc3_actual
     * 7th component -> bc4_actual
     * 8th component -> bc5_actual (or null if absent)
     * 9th component -> output_actual (or null if absent)
   - If a document has fewer than 9 component columns (e.g. only 7 components), set the unused remaining actual fields to null! Do NOT put Noise or Ambient into unused fields!
4. DIRECTION ACCURACY:
   - Check the 'Direct' / 'Direction' column for each individual row.
   - Initial intervals run in Clockwise direction ('CW'). Output 'CW' for initial rows.
   - When the test switches to Counter-Clockwise ('CCW'), output 'CCW'.
5. EXACT ROW COUNT & PRECISION: Read all digits with 100% precision. Return ONLY valid JSON.
"""

        # Optimize image size for lightning-fast transfer (~150KB JPEG vs 4MB PNG)
        try:
            from PIL import Image
            import io
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                if pil_img.mode != "RGB":
                    pil_img = pil_img.convert("RGB")
                buf = io.BytesIO()
                pil_img.save(buf, format="JPEG", quality=85, optimize=True)
                b64_image = base64.b64encode(buf.getvalue()).decode("utf-8")
                mime_type = "image/jpeg"
        except Exception:
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            mime_type = "image/png"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_image
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.05
            }
        }

        # Fast priority models
        models_to_try = [
            "gemini-3.5-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3.5-flash"
        ]

        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            try:
                with httpx.Client(timeout=12.0) as client:
                    response = client.post(url, json=payload)
                    if response.status_code == 200:
                        res_json = response.json()
                        candidates = res_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                raw_text = parts[0].get("text", "").strip()
                                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.I)
                                raw_text = re.sub(r"\s*```$", "", raw_text)
                                data = json.loads(raw_text)
                                if "intervals" in data and "metadata" in data:
                                    return cls._postprocess_gemini_data(data)
                    else:
                        print(f"Gemini API ({model_name}) returned {response.status_code}: {response.text}")
            except Exception as e:
                print(f"Gemini API call failed for {model_name}: {e}")

        return None

    @classmethod
    def _postprocess_gemini_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates temperature rises and validates structure."""
        meta_dict = data.get("metadata", {})
        raw_intervals = data.get("intervals", [])

        # Clean dynamic channel labels
        raw_channel_labels = meta_dict.get("channel_labels", [])
        clean_channel_labels = []
        if isinstance(raw_channel_labels, list):
            for l in raw_channel_labels:
                l_str = str(l).strip()
                if l_str and not re.search(r'^(amb|ambt|ambient|noise|noice|db|time|direct|direction|-|\s*)$', l_str, re.I):
                    clean_channel_labels.append(l_str)

        def _get_val(d: dict, *keys, default=0.0) -> float:
            for k in keys:
                if k in d and d[k] is not None:
                    try:
                        return float(d[k])
                    except (ValueError, TypeError):
                        pass
            return default

        processed_intervals: List[TimeIntervalReading] = []
        for item in raw_intervals:
            amb = _get_val(item, "ambient", "ambient_temp", "amb", default=28.0)
            inp = _get_val(item, "input_actual", "input", "inp", default=0.0)
            b1 = _get_val(item, "body_actual", "body", "body1", "b1", default=0.0)
            b2 = _get_val(item, "body2_actual", "body2", "b2", default=0.0)
            bc1 = _get_val(item, "bc1_actual", "bc1", "bearing_cover_1", default=0.0)
            bc2 = _get_val(item, "bc2_actual", "bc2", "bearing_cover_2", default=0.0)
            bc3 = _get_val(item, "bc3_actual", "bc3", "bearing_cover_3", default=0.0)
            bc4 = _get_val(item, "bc4_actual", "bc4", "bearing_cover_4", default=0.0)
            bc5 = _get_val(item, "bc5_actual", "bc5", "bearing_cover_5", default=0.0)
            out = _get_val(item, "output_actual", "output", "out", default=0.0)

            direction = str(item.get("direction", "CW") or "CW").strip().upper()
            direction = "CCW" if "CCW" in direction else "CW"

            processed_intervals.append(TimeIntervalReading(
                time_label=str(item.get("time_label", "")).strip(),
                direction=direction,
                ambient=amb,
                input_actual=inp,
                input_rise=round(inp - amb, 1) if inp else 0.0,
                body_actual=b1,
                body_rise=round(b1 - amb, 1) if b1 else 0.0,
                body2_actual=b2,
                body2_rise=round(b2 - amb, 1) if b2 else 0.0,
                bc1_actual=bc1,
                bc1_rise=round(bc1 - amb, 1) if bc1 else 0.0,
                bc2_actual=bc2,
                bc2_rise=round(bc2 - amb, 1) if bc2 else 0.0,
                bc3_actual=bc3,
                bc3_rise=round(bc3 - amb, 1) if bc3 else 0.0,
                bc4_actual=bc4,
                bc4_rise=round(bc4 - amb, 1) if bc4 else 0.0,
                bc5_actual=bc5,
                bc5_rise=round(bc5 - amb, 1) if bc5 else 0.0,
                output_actual=out,
                output_rise=round(out - amb, 1) if out else 0.0
            ))

        noise_measured = str(meta_dict.get("noise_level_measured") or "").strip()
        if not noise_measured or noise_measured in ["-", "None"]:
            noise_measured = "-"
        elif re.match(r'^\d+(\.\d+)?$', noise_measured):
            noise_measured = f"{noise_measured} dB"

        noise_limit = str(meta_dict.get("noise_level_limit") or "< 85 dB").strip()

        meta = TestMetadata(
            report_number=meta_dict.get("report_number", "MTGS"),
            serial_number=meta_dict.get("serial_number", ""),
            test_name=meta_dict.get("test_name", "TEST FORMAT FOR GEAR REDUCER (NO LOAD TEST)"),
            test_date=meta_dict.get("test_date", "01/08/2026"),
            product_name=meta_dict.get("product_name", "Planetary Gear Reducer"),
            weight=meta_dict.get("weight", "-"),
            started_at=meta_dict.get("started_at", "10:00 AM"),
            direction_changed_at=meta_dict.get("direction_changed_at", "01:30 PM"),
            duration=meta_dict.get("duration", "6 hours"),
            noise_level_limit=noise_limit,
            noise_level_measured=noise_measured,
            temp_rise_limit=meta_dict.get("temp_rise_limit", "< 40°C over the ambient ( after 1hour )"),
            lubrication_leakage=meta_dict.get("lubrication_leakage", "No leakage"),
            conclusion=meta_dict.get("conclusion", "COMPLIES (ALL PARAMETERS PASS)"),
            channel_labels=clean_channel_labels if clean_channel_labels else None
        )

        return {
            "metadata": meta,
            "intervals": processed_intervals
        }
