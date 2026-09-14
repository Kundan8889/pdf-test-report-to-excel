import re
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from pathlib import Path
from typing import List
from app.models.schemas import TestMetadata, TimeIntervalReading
from app.utils.file_utils import get_output_path

class ExcelService:
    @classmethod
    def generate_excel(
        cls,
        metadata: TestMetadata,
        intervals: List[TimeIntervalReading],
        output_filename: str = "Temperature_Rise_Test_Report.xlsx"
    ) -> Path:
        """
        Creates an executive-grade Excel workbook with compact, A4-friendly column dimensions
        and clean Direction ('CW' / 'CCW') values.
        """
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Temperature Rise Report"
        ws.views.sheetView[0].showGridLines = True

        # Styles
        GRAY_HEADER_FILL = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
        NAVY_FILL = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        PASS_FILL = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
        ZEBRA_FILL = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

        FONT_TITLE = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
        FONT_BOLD = Font(name="Calibri", size=9, bold=True, color="0F172A")
        FONT_HEADER = Font(name="Calibri", size=9, bold=True, color="1E293B")
        FONT_SUBHEADER = Font(name="Calibri", size=8.5, bold=True, color="334155")
        FONT_REGULAR = Font(name="Calibri", size=9, color="1E293B")
        FONT_PASS = Font(name="Calibri", size=9.5, bold=True, color="15803D")

        THIN_BORDER = Side(border_style="thin", color="94A3B8")
        BORDER_ALL = Border(left=THIN_BORDER, right=THIN_BORDER, top=THIN_BORDER, bottom=THIN_BORDER)

        ALIGN_CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ALIGN_LEFT = Alignment(horizontal="left", vertical="center")
        ALIGN_RIGHT = Alignment(horizontal="right", vertical="center")

        # Dynamic Component Groups from metadata.channel_labels
        raw_labels = metadata.channel_labels or []
        clean_labels = [
            str(l).strip() for l in raw_labels
            if not re.search(r'^(ambient|amb|ambt|noise|noies|sound|db|time|direction|direct|-|\s*)$', str(l).strip(), re.I)
        ]
        default_names = ["Input", "Body", "Body", "Bearing cover 1", "Bearing Cover 2", "Bearing Cover 3", "Bearing Cover 4", "Bearing Cover 5", "Output"]
        final_names = clean_labels if clean_labels else default_names
        num_channels = len(final_names)

        # Check if Noise / Vibration columns are present
        has_noise_col = any(getattr(item, 'noise', None) not in [None, ''] for item in intervals) or bool(metadata.noise_level_measured and metadata.noise_level_measured != '-')
        has_vib_col = any(getattr(item, 'vibration', None) not in [None, ''] for item in intervals)

        extra_col_count = 1 + (1 if has_noise_col else 0) + (1 if has_vib_col else 0)
        total_cols = max(8, 2 + num_channels * 2 + extra_col_count)

        # Column indices
        ambient_col = 3 + num_channels * 2
        noise_col = ambient_col + 1 if has_noise_col else None
        vib_col = (noise_col + 1) if (has_noise_col and has_vib_col) else (ambient_col + 1 if has_vib_col else None)

        # 1. Title Banner
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=total_cols)
        ws["A1"] = metadata.test_name or "GEARBOX / MOTOR TEMPERATURE RISE TEST REPORT"
        ws["A1"].font = FONT_TITLE
        ws["A1"].fill = NAVY_FILL
        ws["A1"].alignment = ALIGN_CENTER
        ws.row_dimensions[1].height = 26

        # 2. General Info Box (Rows 3-6)
        serial_val = metadata.serial_number or metadata.report_number or ""
        info_pairs = [
            ("Serial / Report No:", serial_val, "Date of Test:", metadata.test_date),
            ("Product / Assembly:", metadata.product_name, "Weight:", metadata.weight),
            ("Started At:", metadata.started_at, "Direction Changed At:", metadata.direction_changed_at),
            ("Test Duration:", metadata.duration, "Conclusion:", metadata.conclusion),
        ]
        mid_split = max(4, total_cols // 2)
        current_row = 3
        for idx, (k1, v1, k2, v2) in enumerate(info_pairs, start=3):
            ws.row_dimensions[idx].height = 20
            # Left block: k1 (Cols 1-2), v1 (Cols 3 to mid_split)
            ws.merge_cells(start_row=idx, start_column=1, end_row=idx, end_column=2)
            cell_k1 = ws.cell(row=idx, column=1, value=k1)
            cell_k1.font = FONT_BOLD
            cell_k1.fill = GRAY_HEADER_FILL
            cell_k1.alignment = ALIGN_LEFT

            ws.merge_cells(start_row=idx, start_column=3, end_row=idx, end_column=mid_split)
            cell_v1 = ws.cell(row=idx, column=3, value=str(v1))
            cell_v1.font = FONT_REGULAR
            cell_v1.alignment = ALIGN_LEFT

            # Right block: k2 (Cols mid_split+1 to mid_split+2), v2 (Cols mid_split+3 to total_cols)
            ws.merge_cells(start_row=idx, start_column=mid_split + 1, end_row=idx, end_column=min(mid_split + 2, total_cols - 1))
            cell_k2 = ws.cell(row=idx, column=mid_split + 1, value=k2)
            cell_k2.font = FONT_BOLD
            cell_k2.fill = GRAY_HEADER_FILL
            cell_k2.alignment = ALIGN_LEFT

            ws.merge_cells(start_row=idx, start_column=min(mid_split + 3, total_cols), end_row=idx, end_column=total_cols)
            cell_v2 = ws.cell(row=idx, column=min(mid_split + 3, total_cols), value=str(v2))
            cell_v2.font = FONT_REGULAR
            cell_v2.alignment = ALIGN_LEFT

            for c in range(1, total_cols + 1):
                ws.cell(row=idx, column=c).border = BORDER_ALL
            current_row = idx + 1

        # 3. Noise Level Row (Row 7)
        noise_row = current_row
        ws.row_dimensions[noise_row].height = 20
        # Left label: Cols 1-2 ("Noise level")
        ws.merge_cells(start_row=noise_row, start_column=1, end_row=noise_row, end_column=2)
        cell_nl = ws.cell(row=noise_row, column=1, value="Noise level")
        cell_nl.font = FONT_BOLD
        cell_nl.alignment = ALIGN_LEFT

        # Left value: Cols 3 to mid_split ("< 85 dB")
        ws.merge_cells(start_row=noise_row, start_column=3, end_row=noise_row, end_column=mid_split)
        cell_nlim = ws.cell(row=noise_row, column=3, value=metadata.noise_level_limit or "< 85 dB")
        cell_nlim.font = FONT_REGULAR
        cell_nlim.alignment = ALIGN_LEFT

        # Right value: Cols mid_split + 1 to total_cols (Measured noise e.g. "78.5 dB"), left-aligned under Date/Weight/Conclusion!
        ws.merge_cells(start_row=noise_row, start_column=mid_split + 1, end_row=noise_row, end_column=total_cols)
        c_nmeas = ws.cell(row=noise_row, column=mid_split + 1, value=metadata.noise_level_measured or "-")
        c_nmeas.font = FONT_BOLD
        c_nmeas.alignment = ALIGN_LEFT

        for c in range(1, total_cols + 1):
            ws.cell(row=noise_row, column=c).border = BORDER_ALL
        current_row += 1

        # 4. Acceptance Criteria Banner (Row 8)
        temp_limit_row = current_row
        ws.row_dimensions[temp_limit_row].height = 20
        ws.merge_cells(start_row=temp_limit_row, start_column=1, end_row=temp_limit_row, end_column=total_cols)
        ws.cell(row=temp_limit_row, column=1, value=f"Temperature rise {metadata.temp_rise_limit or '< 40°C over the ambient ( after 1hour )'}").font = FONT_BOLD
        ws.cell(row=temp_limit_row, column=1).fill = GRAY_HEADER_FILL
        ws.cell(row=temp_limit_row, column=1).alignment = ALIGN_LEFT

        for c in range(1, total_cols + 1):
            ws.cell(row=temp_limit_row, column=c).border = BORDER_ALL

        # 5. Two-Tier Header Matrix (Rows 9-10 / temp_limit_row + 1)
        h_row1 = temp_limit_row + 1
        h_row2 = temp_limit_row + 2
        ws.row_dimensions[h_row1].height = 22
        ws.row_dimensions[h_row2].height = 20

        components = [
            (name, 3 + i * 2, 4 + i * 2)
            for i, name in enumerate(final_names)
        ]

        # Col 1: Time
        ws.merge_cells(start_row=h_row1, start_column=1, end_row=h_row2, end_column=1)
        c_time_head = ws.cell(row=h_row1, column=1, value="Time")
        c_time_head.font = FONT_HEADER
        c_time_head.alignment = ALIGN_CENTER
        c_time_head.fill = GRAY_HEADER_FILL

        # Col 2: Direction
        ws.merge_cells(start_row=h_row1, start_column=2, end_row=h_row2, end_column=2)
        c_dir_head = ws.cell(row=h_row1, column=2, value="Direction")
        c_dir_head.font = FONT_HEADER
        c_dir_head.alignment = ALIGN_CENTER
        c_dir_head.fill = GRAY_HEADER_FILL

        for comp_name, start_c, end_c in components:
            ws.merge_cells(start_row=h_row1, start_column=start_c, end_row=h_row1, end_column=end_c)
            top_cell = ws.cell(row=h_row1, column=start_c, value=comp_name)
            top_cell.font = FONT_HEADER
            top_cell.alignment = ALIGN_CENTER
            top_cell.fill = GRAY_HEADER_FILL

            # Sub headers
            c1 = ws.cell(row=h_row2, column=start_c, value="Actual Temp")
            c1.font = FONT_SUBHEADER
            c1.alignment = ALIGN_CENTER
            c1.fill = GRAY_HEADER_FILL

            c2 = ws.cell(row=h_row2, column=end_c, value="Temp Rise")
            c2.font = FONT_SUBHEADER
            c2.alignment = ALIGN_CENTER
            c2.fill = GRAY_HEADER_FILL

        # Ambient Col
        ws.merge_cells(start_row=h_row1, start_column=ambient_col, end_row=h_row2, end_column=ambient_col)
        amb_cell = ws.cell(row=h_row1, column=ambient_col, value="Ambient")
        amb_cell.font = FONT_HEADER
        amb_cell.alignment = ALIGN_CENTER
        amb_cell.fill = GRAY_HEADER_FILL

        # Noise Col
        if noise_col:
            ws.merge_cells(start_row=h_row1, start_column=noise_col, end_row=h_row2, end_column=noise_col)
            noise_cell = ws.cell(row=h_row1, column=noise_col, value="Noise (dB)")
            noise_cell.font = FONT_HEADER
            noise_cell.alignment = ALIGN_CENTER
            noise_cell.fill = GRAY_HEADER_FILL

        # Vibration Col
        if vib_col:
            ws.merge_cells(start_row=h_row1, start_column=vib_col, end_row=h_row2, end_column=vib_col)
            vib_cell = ws.cell(row=h_row1, column=vib_col, value="Vibration (cm/s)")
            vib_cell.font = FONT_HEADER
            vib_cell.alignment = ALIGN_CENTER
            vib_cell.fill = GRAY_HEADER_FILL

        for r in [h_row1, h_row2]:
            for c in range(1, total_cols + 1):
                ws.cell(row=r, column=c).border = BORDER_ALL

        # 5. Data Rows
        act_keys = ['input_actual', 'body_actual', 'body2_actual', 'bc1_actual', 'bc2_actual', 'bc3_actual', 'bc4_actual', 'bc5_actual', 'output_actual']
        rise_keys = ['input_rise', 'body_rise', 'body2_rise', 'bc1_rise', 'bc2_rise', 'bc3_rise', 'bc4_rise', 'bc5_rise', 'output_rise']

        data_start_row = h_row2 + 1
        current_row = data_start_row
        for row_idx, item in enumerate(intervals):
            ws.row_dimensions[current_row].height = 20
            r_fill = ZEBRA_FILL if row_idx % 2 == 1 else PatternFill(fill_type=None)

            # Col 1: Time
            raw_time = str(item.time_label or '').strip()
            clean_time = re.split(r'\s*\(', raw_time)[0].strip() if '(' in raw_time else raw_time
            c_time = ws.cell(row=current_row, column=1, value=clean_time or raw_time)
            c_time.font = FONT_BOLD
            c_time.alignment = ALIGN_CENTER

            # Col 2: Direction
            raw_dir = str(getattr(item, 'direction', '') or '').strip().upper()
            clean_dir = 'CCW' if 'CCW' in raw_dir else 'CW'
            c_dir = ws.cell(row=current_row, column=2, value=clean_dir)
            c_dir.font = FONT_BOLD
            c_dir.alignment = ALIGN_CENTER

            # Dynamic Channels
            for ch_i in range(num_channels):
                act_k = act_keys[ch_i] if ch_i < len(act_keys) else f"ch_{ch_i}_actual"
                rise_k = rise_keys[ch_i] if ch_i < len(rise_keys) else f"ch_{ch_i}_rise"
                act_v = getattr(item, act_k, 0.0) or 0.0
                rise_v = getattr(item, rise_k, 0.0) or 0.0
                ws.cell(row=current_row, column=3 + ch_i * 2, value=act_v).alignment = ALIGN_CENTER
                ws.cell(row=current_row, column=4 + ch_i * 2, value=rise_v).alignment = ALIGN_CENTER

            # Ambient
            ws.cell(row=current_row, column=ambient_col, value=item.ambient).alignment = ALIGN_CENTER

            # Noise
            if noise_col:
                n_val = getattr(item, 'noise', None)
                if n_val is None or n_val == 0.0:
                    # fallback to max noise if available
                    n_val = metadata.noise_level_measured or "-"
                    try:
                        n_val = float(str(n_val).replace("dB", "").strip())
                    except Exception:
                        pass
                ws.cell(row=current_row, column=noise_col, value=n_val).alignment = ALIGN_CENTER

            # Vibration
            if vib_col:
                v_val = getattr(item, 'vibration', None) or "-"
                ws.cell(row=current_row, column=vib_col, value=v_val).alignment = ALIGN_CENTER

            for c in range(1, total_cols + 1):
                cell = ws.cell(row=current_row, column=c)
                cell.border = BORDER_ALL
                cell.font = FONT_REGULAR if c not in [1, 2] else FONT_BOLD
                cell.alignment = ALIGN_CENTER
                if r_fill.fill_type:
                    cell.fill = r_fill
                if c >= 3 and isinstance(cell.value, (int, float)):
                    cell.number_format = '0.0'

            current_row += 1

        # 6. Lubrication & Inspection Footer
        ws.row_dimensions[current_row].height = 20
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=2)
        ws.cell(row=current_row, column=1, value="Lubrication leakage").font = FONT_BOLD
        ws.cell(row=current_row, column=1).alignment = ALIGN_LEFT

        ws.merge_cells(start_row=current_row, start_column=3, end_row=current_row, end_column=total_cols)
        ws.cell(row=current_row, column=3, value=metadata.lubrication_leakage or "No leakage").font = FONT_REGULAR
        ws.cell(row=current_row, column=3).alignment = ALIGN_CENTER

        for c in range(1, total_cols + 1):
            ws.cell(row=current_row, column=c).border = BORDER_ALL

        # Compact Column Widths optimized for A4 Landscape
        ws.column_dimensions["A"].width = 11.0  # Time
        ws.column_dimensions["B"].width = 9.0   # Direction (CW / CCW)
        for col_idx in range(3, total_cols):
            col_letter = get_column_letter(col_idx)
            ws.column_dimensions[col_letter].width = 7.5  # Actual Temp / Temp Rise
        ws.column_dimensions[get_column_letter(total_cols)].width = 9.0   # Ambient

        # A4 Landscape Print Setup to guarantee 1-page width fitting
        ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE
        ws.page_setup.paperSize = ws.PAPERSIZE_A4
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.sheet_properties.pageSetUpPr.fitToPage = True

        ws.page_margins.left = 0.25
        ws.page_margins.right = 0.25
        ws.page_margins.top = 0.3
        ws.page_margins.bottom = 0.3

        out_path = get_output_path(output_filename)
        wb.save(out_path)
        return out_path
