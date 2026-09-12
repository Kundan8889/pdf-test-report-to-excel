import re
from pathlib import Path
from typing import List
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION, WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

from app.models.schemas import TestMetadata, TimeIntervalReading
from app.utils.file_utils import get_output_path

class WordService:
    @staticmethod
    def _set_cell_background(cell, color_hex: str):
        """Sets cell shading color (e.g. '1E3A8A' or 'E2E8F0')."""
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    @staticmethod
    def _set_cell_margins(cell, top=60, bottom=60, left=80, right=80):
        """Sets compact cell internal margins in twips (20 twips = 1 pt)."""
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/>'
            f'<w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    @staticmethod
    def _set_cell_border(cell, **kwargs):
        """Sets thin borders on a cell."""
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
            f'<w:left w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)

    @classmethod
    def generate_word(
        cls,
        metadata: TestMetadata,
        intervals: List[TimeIntervalReading],
        output_filename: str = "Temperature_Rise_Test_Report.docx"
    ) -> Path:
        """
        Creates an executive-grade Word (.docx) report perfectly fitted to A4 Landscape.
        """
        doc = Document()

        # 1. Configure A4 Landscape Page Setup with compact margins
        section = doc.sections[0]
        section.orientation = WD_ORIENT.LANDSCAPE
        section.page_width = Inches(11.69)   # A4 width in landscape (297 mm)
        section.page_height = Inches(8.27)   # A4 height in landscape (210 mm)
        section.top_margin = Inches(0.35)
        section.bottom_margin = Inches(0.35)
        section.left_margin = Inches(0.40)
        section.right_margin = Inches(0.40)

        # Set default font
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Calibri'
        font.size = Pt(8.5)
        font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

        # Total usable width = 11.69 - 0.80 = 10.89 inches
        # 21 Columns: Time (0.65 in), Direction (0.55 in), 18 channels (0.50 in each = 9.0 in), Ambient (0.60 in)
        col_widths = [
            Inches(0.65),  # 0: Time
            Inches(0.55),  # 1: Direction
            Inches(0.50), Inches(0.50),  # 2,3: Input (Act, Rise)
            Inches(0.50), Inches(0.50),  # 4,5: Body (Act, Rise)
            Inches(0.50), Inches(0.50),  # 6,7: Body 2 (Act, Rise)
            Inches(0.50), Inches(0.50),  # 8,9: BC1
            Inches(0.50), Inches(0.50),  # 10,11: BC2
            Inches(0.50), Inches(0.50),  # 12,13: BC3
            Inches(0.50), Inches(0.50),  # 14,15: BC4
            Inches(0.50), Inches(0.50),  # 16,17: BC5
            Inches(0.50), Inches(0.50),  # 18,19: Output (Act, Rise)
            Inches(0.60),  # 20: Ambient
        ]

        total_cols = 21

        # Calculate total rows required:
        # Title (1) + Info (4) + Noise (1) + Temp Limit (1) + Table Header (2) + Intervals (N) + Lubrication (1)
        num_rows = 1 + 4 + 1 + 1 + 2 + len(intervals) + 1
        table = doc.add_table(rows=num_rows, cols=total_cols)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        # Apply column widths across all cells
        for row in table.rows:
            for c_idx, width in enumerate(col_widths):
                row.cells[c_idx].width = width

        def format_cell(cell, text, bold=False, color_rgb=(0x1E, 0x29, 0x3B), bg_color=None, align=WD_ALIGN_PARAGRAPH.LEFT, font_size=8.0):
            cell.text = ""
            p = cell.paragraphs[0]
            p.alignment = align
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.0
            run = p.add_run(str(text) if text is not None else "")
            run.font.name = 'Calibri'
            run.font.size = Pt(font_size)
            run.font.bold = bold
            run.font.color.rgb = RGBColor(*color_rgb)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            cls._set_cell_margins(cell, top=30, bottom=30, left=40, right=40)
            cls._set_cell_border(cell)
            if bg_color:
                cls._set_cell_background(cell, bg_color)

        current_row_idx = 0

        # 1. Title Banner (Row 0)
        title_cell = table.cell(current_row_idx, 0)
        for c in range(1, total_cols):
            title_cell.merge(table.cell(current_row_idx, c))
        format_cell(title_cell, metadata.test_name or "GEARBOX / MOTOR TEMPERATURE RISE TEST REPORT", bold=True, color_rgb=(0xFF, 0xFF, 0xFF), bg_color="1E3A8A", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=11.0)
        current_row_idx += 1

        # 2. Info Block (Rows 1 to 4)
        serial_val = metadata.serial_number or metadata.report_number or ""
        info_pairs = [
            ("Serial / Report No:", serial_val, "Date of Test:", metadata.test_date),
            ("Product / Assembly:", metadata.product_name, "Weight:", metadata.weight),
            ("Started At:", metadata.started_at, "Direction Changed At:", metadata.direction_changed_at),
            ("Test Duration:", metadata.duration, "Conclusion:", metadata.conclusion),
        ]
        for k1, v1, k2, v2 in info_pairs:
            # k1 (Cols 0-2)
            c_k1 = table.cell(current_row_idx, 0)
            c_k1.merge(table.cell(current_row_idx, 2))
            format_cell(c_k1, k1, bold=True, bg_color="E2E8F0", font_size=8.0)

            # v1 (Cols 3-9)
            c_v1 = table.cell(current_row_idx, 3)
            c_v1.merge(table.cell(current_row_idx, 9))
            format_cell(c_v1, v1, bold=False, font_size=8.0)

            # k2 (Cols 10-13)
            c_k2 = table.cell(current_row_idx, 10)
            c_k2.merge(table.cell(current_row_idx, 13))
            format_cell(c_k2, k2, bold=True, bg_color="E2E8F0", font_size=8.0)

            # v2 (Cols 14-20)
            c_v2 = table.cell(current_row_idx, 14)
            c_v2.merge(table.cell(current_row_idx, 20))
            format_cell(c_v2, v2, bold=False, font_size=8.0)

            current_row_idx += 1

        # 3. Noise Level (Row 5)
        c_n1 = table.cell(current_row_idx, 0)
        c_n1.merge(table.cell(current_row_idx, 2))
        format_cell(c_n1, "Noise level", bold=True, font_size=8.0)

        c_n2 = table.cell(current_row_idx, 3)
        c_n2.merge(table.cell(current_row_idx, 15))
        format_cell(c_n2, metadata.noise_level_limit or "< 85 dB", font_size=8.0)

        c_n3 = table.cell(current_row_idx, 16)
        c_n3.merge(table.cell(current_row_idx, 20))
        format_cell(c_n3, metadata.noise_level_measured or "74.5 dB (1/2 hour)", bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT, font_size=8.0)
        current_row_idx += 1

        # 4. Temp Rise Limit (Row 6)
        c_tlim = table.cell(current_row_idx, 0)
        for c in range(1, total_cols):
            c_tlim.merge(table.cell(current_row_idx, c))
        format_cell(c_tlim, f"Temperature rise {metadata.temp_rise_limit or '< 40°C over the ambient ( after 1hour )'}", bold=True, bg_color="E2E8F0", font_size=8.0)
        current_row_idx += 1

        # 5. Two-Tier Headers (Rows 7 & 8)
        head_row1 = current_row_idx
        head_row2 = current_row_idx + 1

        # Time (Col 0)
        c_time_h = table.cell(head_row1, 0)
        c_time_h.merge(table.cell(head_row2, 0))
        format_cell(c_time_h, "Time", bold=True, bg_color="E2E8F0", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

        # Direction (Col 1)
        c_dir_h = table.cell(head_row1, 1)
        c_dir_h.merge(table.cell(head_row2, 1))
        format_cell(c_dir_h, "Direction", bold=True, bg_color="E2E8F0", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

        # Dynamic Component Groups from metadata.channel_labels (Cols 2 to 19)
        raw_labels = metadata.channel_labels or [
            "Input", "Body", "Body", "Bearing cover 1",
            "Bearing Cover 2", "Bearing Cover 3", "Bearing Cover 4",
            "Bearing Cover 5", "Output"
        ]
        clean_labels = [
            l for l in raw_labels
            if not re.search(r'^(ambient|amb|noise|noice|time|direction|direct)$', str(l).strip(), re.I)
        ]
        default_names = ["Input", "Body", "Body", "Bearing cover 1", "Bearing Cover 2", "Bearing Cover 3", "Bearing Cover 4", "Bearing Cover 5", "Output"]
        final_names = []
        for i in range(9):
            if i < len(clean_labels) and clean_labels[i]:
                final_names.append(str(clean_labels[i]).strip())
            else:
                final_names.append(default_names[i])

        components = [
            (name, 2 + i * 2, 3 + i * 2)
            for i, name in enumerate(final_names)
        ]
        for comp_name, start_c, end_c in components:
            top_c = table.cell(head_row1, start_c)
            top_c.merge(table.cell(head_row1, end_c))
            format_cell(top_c, comp_name, bold=True, bg_color="E2E8F0", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

            sub_c1 = table.cell(head_row2, start_c)
            format_cell(sub_c1, "Actual\nTemp", bold=True, bg_color="E2E8F0", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=7.5)

            sub_c2 = table.cell(head_row2, end_c)
            format_cell(sub_c2, "Temp\nRise", bold=True, bg_color="E2E8F0", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=7.5)

        # Ambient (Col 20)
        c_amb_h = table.cell(head_row1, 20)
        c_amb_h.merge(table.cell(head_row2, 20))
        format_cell(c_amb_h, "Ambient", bold=True, bg_color="E2E8F0", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

        current_row_idx += 2

        # 6. Data Rows
        for row_idx, item in enumerate(intervals):
            r_bg = "F8FAFC" if row_idx % 2 == 1 else None

            # Time
            raw_time = str(item.time_label or '').strip()
            clean_time = re.split(r'\s*\(', raw_time)[0].strip() if '(' in raw_time else raw_time
            format_cell(table.cell(current_row_idx, 0), clean_time, bold=True, bg_color=r_bg, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

            # Direction (Strictly CW / CCW)
            raw_dir = str(getattr(item, 'direction', '') or '').strip().upper()
            clean_dir = "CCW" if "CCW" in raw_dir else "CW"
            format_cell(table.cell(current_row_idx, 1), clean_dir, bold=True, bg_color=r_bg, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

            # Values mapping
            body2_act = getattr(item, 'body2_actual', item.body_actual)
            body2_r = getattr(item, 'body2_rise', item.body_rise)
            val_pairs = [
                (item.input_actual, item.input_rise),
                (item.body_actual, item.body_rise),
                (body2_act, body2_r),
                (item.bc1_actual, item.bc1_rise),
                (item.bc2_actual, item.bc2_rise),
                (item.bc3_actual, item.bc3_rise),
                (item.bc4_actual, item.bc4_rise),
                (item.bc5_actual, item.bc5_rise),
                (item.output_actual, item.output_rise),
            ]

            col_curr = 2
            for act, rise in val_pairs:
                format_cell(table.cell(current_row_idx, col_curr), f"{act:.1f}", bg_color=r_bg, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)
                # Temp rise with subtle red if > 40
                rise_bg = "FEE2E2" if rise > 40.0 else r_bg
                rise_color = (0xDC, 0x26, 0x26) if rise > 40.0 else (0x1E, 0x29, 0x3B)
                format_cell(table.cell(current_row_idx, col_curr + 1), f"{rise:.1f}", color_rgb=rise_color, bg_color=rise_bg, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)
                col_curr += 2

            # Ambient
            format_cell(table.cell(current_row_idx, 20), f"{item.ambient:.1f}", bg_color=r_bg, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)
            current_row_idx += 1

        # 7. Lubrication Leakage Footer
        c_lub_label = table.cell(current_row_idx, 0)
        c_lub_label.merge(table.cell(current_row_idx, 2))
        format_cell(c_lub_label, "Lubrication leakage", bold=True, font_size=8.0)

        c_lub_val1 = table.cell(current_row_idx, 3)
        c_lub_val1.merge(table.cell(current_row_idx, 11))
        format_cell(c_lub_val1, metadata.lubrication_leakage or "No leakage", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

        c_lub_val2 = table.cell(current_row_idx, 12)
        c_lub_val2.merge(table.cell(current_row_idx, 20))
        format_cell(c_lub_val2, metadata.lubrication_leakage or "No leakage", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=8.0)

        out_path = get_output_path(output_filename)
        doc.save(str(out_path))
        return out_path
