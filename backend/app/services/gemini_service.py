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
        """Fetches GEMINI_API_KEY_MAGTORQ or GEMINI_API_KEY from environment or .env files."""
        key = (
            os.getenv("GEMINI_API_KEY_MAGTORQ", "").strip()
            or os.getenv("GEMINI_API_KEY", "").strip()
        )
        if not key:
            from pathlib import Path
            from dotenv import dotenv_values
            curr = Path(__file__).resolve().parent
            for _ in range(4):
                env_file = curr / ".env"
                if env_file.exists():
                    vals = dotenv_values(env_file)
                    k = vals.get("GEMINI_API_KEY_MAGTORQ", "").strip() or vals.get("GEMINI_API_KEY", "").strip()
                    if k:
                        key = k
                        os.environ["GEMINI_API_KEY_MAGTORQ"] = k
                        break
                curr = curr.parent
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
    "started_at": "Started time, e.g. 09:30 am or 10:50 am",
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
      "time_label": "Exact time, e.g. 9.30 am, 10.00 am, 11.30 am, 12.00 pm, 12.30 pm, 1.05 pm",
      "direction": "CW or CCW",
      "ambient": 24.6,
      "channel_readings": {
        "Input": 25.1,
        "R1": 25.5,
        "R2": 25.0,
        "R3": 24.3,
        "R4": 24.5,
        "R5": 24.3,
        "O/P Pinion": 25.0
      },
      "noise": 72.0,
      "vibration": 0.59
    }
  ]
}

CRITICAL RULES:
1. DYNAMIC COMPONENT CHANNELS:
   - Identify each individual temperature component column in the table (e.g. Input, R1, R2, R3, R4, R5, O/P Pinion).
   - In 'metadata.channel_labels', return ONLY the array of actual component column names present in the table.
   - DO NOT include 'Ambient'/'Ambt' or 'Noise'/'Noies' or 'Vibration' in channel_labels.

2. AMBIENT, NOISE & VIBRATION SEPARATION:
   - 'Ambt' / 'Ambient' (e.g. 28.0, 24.6...) is the reference ambient. Store this ONLY in 'ambient'. NEVER put ambient into 'channel_readings'!
   - 'Noies' / 'Noise' column (e.g. 72, 72.7, 71.3) is the sound level in dB. Store in 'noise' for each row AND set 'metadata.noise_level_measured' to the peak reading (e.g. '72.7 dB').
   - 'Vibration' column (if present, e.g. 0.59, 0.69, 0.50) is stored in 'vibration' for each row.

3. ACCURATE COLUMN VALUE MAPPING:
   - In 'channel_readings', map each component header name to its exact cell value in that row.
   - Look carefully at handwritten numbers and do not shift columns.

4. DIRECTION & TIME ACCURACY:
   - For direction: handwritten 'cw' or 'co' means 'CW'. 'ccw' means 'CCW'.
   - For time: '12 pm' or '12.00' is '12:00 pm'.
   - Read all digits with 100% precision. Return ONLY valid JSON.
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
            ]
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
    def _format_and_propagate_times(cls, raw_times: List[str], started_at: str = "") -> List[str]:
        """
        Parses all time strings in the table sequence and ensures EVERY interval
        has a clear, standard 12-hour time format with lowercase am/pm (e.g. '12:35 pm', '12:50 pm', '1:05 pm').
        """
        parsed_entries = []
        for raw in raw_times:
            if not raw:
                parsed_entries.append(None)
                continue
            t = str(raw).strip()

            # Handle "12 pm", "12pm", "1 pm", "10 am" without minutes
            m_no_mm = re.match(r'^([0-9]{1,2})\s*(?:(AM|PM|am|pm))$', t, re.I)
            if m_no_mm:
                hh = int(m_no_mm.group(1))
                period = m_no_mm.group(2).upper()
                parsed_entries.append({"hh": hh, "mm": 0, "period": period, "raw": t})
                continue

            # Prefix AM/PM e.g. "PM 12.35", "Pm 12:35", "am 10:00"
            m_pre = re.match(r'^(?:(AM|PM))\s*[:.\-\s]?\s*([0-9]{1,2})[:.]([0-9]{2})$', t, re.I)
            if m_pre:
                period = m_pre.group(1).upper()
                hh = int(m_pre.group(2))
                mm = int(m_pre.group(3))
                parsed_entries.append({"hh": hh, "mm": mm, "period": period, "raw": t})
                continue

            # Postfix AM/PM e.g. "12:35 PM", "12.35pm", "1:05 PM"
            m_post = re.match(r'^([0-9]{1,2})[:.]([0-9]{2})\s*(?:(AM|PM))?$', t, re.I)
            if m_post:
                hh = int(m_post.group(1))
                mm = int(m_post.group(2))
                period = m_post.group(3).upper() if m_post.group(3) else None
                # Handle 24-hr format (e.g. 13:20 -> 1:20 PM)
                if hh >= 13 and hh <= 23:
                    hh = hh - 12
                    period = "PM"
                parsed_entries.append({"hh": hh, "mm": mm, "period": period, "raw": t})
                continue

            parsed_entries.append({"hh": None, "mm": None, "period": None, "raw": t})

        # Determine initial period (AM or PM)
        curr_period = None
        if started_at:
            if "PM" in started_at.upper():
                curr_period = "PM"
            elif "AM" in started_at.upper():
                curr_period = "AM"

        if not curr_period:
            for entry in parsed_entries:
                if entry and entry["period"]:
                    curr_period = entry["period"]
                    break

        if not curr_period:
            for entry in parsed_entries:
                if entry and entry["hh"] is not None:
                    curr_period = "AM" if 8 <= entry["hh"] < 12 else "PM"
                    break
            if not curr_period:
                curr_period = "AM"

        prev_hh = None
        result = []
        for entry in parsed_entries:
            if not entry or entry["hh"] is None:
                result.append(entry["raw"] if entry else "")
                continue

            hh = entry["hh"]
            mm = entry["mm"]
            explicit_period = entry["period"]

            if explicit_period:
                curr_period = explicit_period
            else:
                if prev_hh == 11 and hh == 12 and curr_period == "AM":
                    curr_period = "PM"
                elif prev_hh == 12 and hh == 1 and curr_period == "PM":
                    curr_period = "PM"

            prev_hh = hh
            result.append(f"{hh}:{mm:02d} {curr_period.lower()}")

        return result

    @classmethod
    def _normalize_time(cls, raw_time: str) -> str:
        """Normalizes time format to ensure lowercase am/pm is at the end (e.g. '10:00 am', '1:30 pm')."""
        if not raw_time or raw_time in ["-", "None"]:
            return raw_time or "-"
        res = cls._format_and_propagate_times([raw_time])
        return res[0] if res else raw_time

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
                if l_str and not re.search(r'^(amb|ambt|ambient|noise|noies|sound|db|time|direct|direction|-|\s*)$', l_str, re.I):
                    clean_channel_labels.append(l_str)

        def _get_val(d: dict, *keys, default=0.0) -> float:
            for k in keys:
                if k in d and d[k] is not None:
                    try:
                        return float(d[k])
                    except (ValueError, TypeError):
                        pass
            return default

        raw_time_list = [str(item.get("time_label", "")).strip() for item in raw_intervals]
        started_at_raw = str(meta_dict.get("started_at", "")).strip()
        formatted_times = cls._format_and_propagate_times(raw_time_list, started_at_raw)

        field_names = [
            "input_actual", "body_actual", "body2_actual",
            "bc1_actual", "bc2_actual", "bc3_actual", "bc4_actual",
            "bc5_actual", "output_actual"
        ]

        processed_intervals: List[TimeIntervalReading] = []
        measured_noises: List[float] = []

        for idx, item in enumerate(raw_intervals):
            amb = _get_val(item, "ambient", "ambient_temp", "amb", default=28.0)
            noise_val = _get_val(item, "noise", "noies", "sound", default=None)
            vib_val = _get_val(item, "vibration", "vib", default=None)
            if noise_val is not None and noise_val > 0:
                measured_noises.append(noise_val)

            readings_map = item.get("channel_readings") or {}
            channel_vals = {}

            # 1. Map from channel_readings dict if available
            if isinstance(readings_map, dict) and readings_map:
                for ch_idx, ch_name in enumerate(clean_channel_labels):
                    if ch_idx >= len(field_names):
                        break
                    target_field = field_names[ch_idx]
                    val = 0.0
                    for r_k, r_v in readings_map.items():
                        if str(r_k).strip().lower() == str(ch_name).strip().lower():
                            try:
                                val = float(r_v)
                            except (ValueError, TypeError):
                                pass
                            break
                    channel_vals[target_field] = val
            else:
                # 2. Fallback to direct field mapping
                for f_name in field_names:
                    channel_vals[f_name] = _get_val(item, f_name, default=0.0)

            inp = channel_vals.get("input_actual", 0.0)
            b1 = channel_vals.get("body_actual", 0.0)
            b2 = channel_vals.get("body2_actual", 0.0)
            bc1 = channel_vals.get("bc1_actual", 0.0)
            bc2 = channel_vals.get("bc2_actual", 0.0)
            bc3 = channel_vals.get("bc3_actual", 0.0)
            bc4 = channel_vals.get("bc4_actual", 0.0)
            bc5 = channel_vals.get("bc5_actual", 0.0)
            out = channel_vals.get("output_actual", 0.0)

            raw_dir = str(item.get("direction", "CW") or "CW").strip().upper()
            direction = "CCW" if ("CCW" in raw_dir or "COW" in raw_dir) else "CW"

            time_str = formatted_times[idx] if idx < len(formatted_times) else ""

            processed_intervals.append(TimeIntervalReading(
                time_label=time_str,
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
                output_rise=round(out - amb, 1) if out else 0.0,
                noise=noise_val,
                vibration=vib_val
            ))


        noise_measured = str(meta_dict.get("noise_level_measured") or "").strip()
        if (not noise_measured or noise_measured in ["-", "None"]) and measured_noises:
            noise_measured = f"{max(measured_noises):.1f} dB".replace(".0 dB", " dB")
        elif re.match(r'^\d+(\.\d+)?$', noise_measured):
            noise_measured = f"{noise_measured} dB"
        elif not noise_measured:
            noise_measured = "-"

        noise_limit = str(meta_dict.get("noise_level_limit") or "< 85 dB").strip()

        meta = TestMetadata(
            report_number=meta_dict.get("report_number", "MTGS"),
            serial_number=meta_dict.get("serial_number", ""),
            test_name=meta_dict.get("test_name", "TEST FORMAT FOR GEAR REDUCER (NO LOAD TEST)"),
            test_date=meta_dict.get("test_date", "01/08/2026"),
            product_name=meta_dict.get("product_name", "Planetary Gear Reducer"),
            weight=meta_dict.get("weight", "-"),
            started_at=cls._normalize_time(meta_dict.get("started_at", "10:00 am")),
            direction_changed_at=cls._normalize_time(meta_dict.get("direction_changed_at", "01:30 pm")),
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
