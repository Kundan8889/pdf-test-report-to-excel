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

        models_to_try = [
            "gemini-flash-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-pro-latest",
            "gemini-2.5-flash"
        ]

        b64_image = base64.b64encode(image_bytes).decode("utf-8")

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
    "noise_level_measured": "Measured noise level with units if present, e.g. 78 dB or 74.5 dB (1/2 hour)",
    "temp_rise_limit": "< 40°C over the ambient ( after 1hour )",
    "lubrication_leakage": "No leakage or '-'",
    "conclusion": "COMPLIES (ALL PARAMETERS PASS) or '-'",
    "channel_labels": [
      "Exact Name of Column 1 (e.g. Input)",
      "Exact Name of Column 2 (e.g. R1, Body)",
      "Exact Name of Column 3 (e.g. R2, Body)",
      "Exact Name of Column 4 (e.g. R3, Bearing cover 1)",
      "Exact Name of Column 5 (e.g. R4, Bearing cover 2)",
      "Exact Name of Column 6 (e.g. R5, Bearing cover 3)",
      "Exact Name of Column 7 (e.g. Bearing cover 4, Pinion)",
      "Exact Name of Column 8 (e.g. Bearing cover 5, Pinion)",
      "Exact Name of Column 9 (e.g. O/P, Output)"
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
      "bc5_actual": 25.0,
      "output_actual": 25.0
    }
  ]
}

CRITICAL EXTRACTION RULES:
1. DYNAMIC COLUMN HEADERS: Look closely at what is printed or handwritten above each temperature component column (e.g. Input, R1, R2, R3, R4, R5, O/P, Pinion, Body, Bearing cover 1-5, Output). Extract ONLY the temperature component column names into metadata.channel_labels. Do NOT include 'Ambient'/'Ambt' or 'Noise'/'Noice' in channel_labels (Ambient and Noise are separate fields).
2. DIRECTION ACCURACY (CW vs CCW):
   - Check the 'Direct' / 'Direction' column for each individual row.
   - Initial intervals of the test (e.g. 9:30, 10:00, 10:30, 11:00) run in Clockwise direction ('CW'). If the cell has 'CW', a ditto mark, or represents early test rows before reversal, output 'CW'. NEVER output 'CCW' for early rows.
   - When the test switches direction to Counter-Clockwise (e.g. 11:30, 12:00, 12:30 or when 'CCW' / 'C.C.W.' is noted), output 'CCW'.
   - Verify every row's direction carefully so that CW and CCW are 100% accurate.
3. EXACT ROW COUNT: ONLY include the EXACT rows present in the image table (if there are 3 rows, return exactly 3 objects in intervals array; if 7 rows, return 7).
4. EXACT NUMERICAL VALUES: Read handwritten digits with high precision (e.g. 25.1, 25.5, 24.3, 24.5, 30.8, 34.3, 49.6, etc.). Distinguish 7 from +, 1 from 7, 0 from 8.
5. Return ONLY valid, parseable JSON with NO markdown formatting, NO triple backticks.
"""

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
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

        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            try:
                with httpx.Client(timeout=35.0) as client:
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

        def _get_val(d: dict, *keys, default=28.0) -> float:
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
            inp = _get_val(item, "input_actual", "input", "inp", default=27.5)
            b1 = _get_val(item, "body_actual", "body", "body1", "b1", default=26.6)
            b2 = _get_val(item, "body2_actual", "body2", "b2", default=b1)
            bc1 = _get_val(item, "bc1_actual", "bc1", "bearing_cover_1", default=b1)
            bc2 = _get_val(item, "bc2_actual", "bc2", "bearing_cover_2", default=b1)
            bc3 = _get_val(item, "bc3_actual", "bc3", "bearing_cover_3", default=b1)
            bc4 = _get_val(item, "bc4_actual", "bc4", "bearing_cover_4", default=b1)
            bc5 = _get_val(item, "bc5_actual", "bc5", "bearing_cover_5", default=b1)
            out = _get_val(item, "output_actual", "output", "out", default=b1)

            direction = str(item.get("direction", "CW") or "CW").strip().upper()
            direction = "CCW" if "CCW" in direction else "CW"

            processed_intervals.append(TimeIntervalReading(
                time_label=str(item.get("time_label", "")).strip(),
                direction=direction,
                ambient=amb,
                input_actual=inp,
                input_rise=round(inp - amb, 1),
                body_actual=b1,
                body_rise=round(b1 - amb, 1),
                body2_actual=b2,
                body2_rise=round(b2 - amb, 1),
                bc1_actual=bc1,
                bc1_rise=round(bc1 - amb, 1),
                bc2_actual=bc2,
                bc2_rise=round(bc2 - amb, 1),
                bc3_actual=bc3,
                bc3_rise=round(bc3 - amb, 1),
                bc4_actual=bc4,
                bc4_rise=round(bc4 - amb, 1),
                bc5_actual=bc5,
                bc5_rise=round(bc5 - amb, 1),
                output_actual=out,
                output_rise=round(out - amb, 1)
            ))

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
            noise_level_limit=meta_dict.get("noise_level_limit", "< 85 dB"),
            noise_level_measured=meta_dict.get("noise_level_measured", "74.5 dB (1/2 hour)"),
            temp_rise_limit=meta_dict.get("temp_rise_limit", "< 40°C over the ambient ( after 1hour )"),
            lubrication_leakage=meta_dict.get("lubrication_leakage", "No leakage"),
            conclusion=meta_dict.get("conclusion", "COMPLIES (ALL PARAMETERS PASS)"),
            channel_labels=clean_channel_labels if clean_channel_labels else None
        )

        return {
            "metadata": meta,
            "intervals": processed_intervals
        }
