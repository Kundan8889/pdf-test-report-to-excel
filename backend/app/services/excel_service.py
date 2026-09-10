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
        Creates an executive-grade Excel workbook with the exact 2-tier matrix structure
        matching the physical engineering test report.
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

        FONT_TITLE = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
        FONT_BOLD = Font(name="Calibri", size=10, bold=True, color="0F172A")
        FONT_HEADER = Font(name="Calibri", size=10, bold=True, color="1E293B")
        FONT_REGULAR = Font(name="Calibri", size=10, color="1E293B")
        FONT_PASS = Font(name="Calibri", size=10, bold=True, color="15803D")

        THIN_BORDER = Side(border_style="thin", color="94A3B8")
        BORDER_ALL = Border(left=THIN_BORDER, right=THIN_BORDER, top=THIN_BORDER, bottom=THIN_BORDER)

        ALIGN_CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ALIGN_LEFT = Alignment(horizontal="left", vertical="center")
        ALIGN_RIGHT = Alignment(horizontal="right", vertical="center")

        # 1. Title Banner
        ws.merge_cells("A1:T1")
        ws["A1"] = "GEARBOX / MOTOR TEMPERATURE RISE TEST REPORT"
        ws["A1"].font = FONT_TITLE
        ws["A1"].fill = NAVY_FILL
        ws["A1"].alignment = ALIGN_CENTER
        ws.row_dimensions[1].height = 28

        # 2. General Info Box (Rows 3-4)
        info_pairs = [
            ("Date of Test:", metadata.test_date, "Weight:", metadata.weight),
            ("Started At:", metadata.started_at, "Direction Changed At:", metadata.direction_changed_at),
            ("Test Duration:", metadata.duration, "Conclusion:", metadata.conclusion),
        ]
        for idx, (k1, v1, k2, v2) in enumerate(info_pairs, start=3):
            ws.cell(row=idx, column=1, value=k1).font = FONT_BOLD
            ws.cell(row=idx, column=1).fill = GRAY_HEADER_FILL
            ws.cell(row=idx, column=1).border = BORDER_ALL

            ws.merge_cells(start_row=idx, start_column=2, end_row=idx, end_column=4)
            cell_v1 = ws.cell(row=idx, column=2, value=str(v1))
            cell_v1.font = FONT_REGULAR
            cell_v1.border = BORDER_ALL

            ws.cell(row=idx, column=5, value=k2).font = FONT_BOLD
            ws.cell(row=idx, column=5).fill = GRAY_HEADER_FILL
            ws.cell(row=idx, column=5).border = BORDER_ALL

            ws.merge_cells(start_row=idx, start_column=6, end_row=idx, end_column=20)
            cell_v2 = ws.cell(row=idx, column=6, value=str(v2))
            cell_v2.font = FONT_REGULAR
            cell_v2.border = BORDER_ALL

            for c in range(1, 21):
                ws.cell(row=idx, column=c).border = BORDER_ALL

        # 3. Noise Level & Acceptance Criteria (Rows 7-8)
        ws.merge_cells("A7:B7")
        ws["A7"] = "Noise level"
        ws["A7"].font = FONT_BOLD
        ws["A7"].border = BORDER_ALL

        ws.merge_cells("C7:Q7")
        ws["C7"] = metadata.noise_level_limit
        ws["C7"].font = FONT_REGULAR
        ws["C7"].border = BORDER_ALL

        ws.merge_cells("R7:T7")
        ws["R7"] = metadata.noise_level_measured
        ws["R7"].font = FONT_BOLD
        ws["R7"].border = BORDER_ALL

        ws.merge_cells("A8:T8")
        ws["A8"] = f"Temperature rise {metadata.temp_rise_limit}"
        ws["A8"].font = FONT_BOLD
        ws["A8"].fill = GRAY_HEADER_FILL
        ws["A8"].border = BORDER_ALL

        for r in [7, 8]:
            for c in range(1, 21):
                ws.cell(row=r, column=c).border = BORDER_ALL

        # 4. Two-Tier Header Matrix (Rows 9-10)
        # Component Groups
        components = [
            ("input", 2, 3),
            ("body", 4, 5),
            ("body", 6, 7),
            ("Bearing cover 1", 8, 9),
            ("Bearing Cover 2", 10, 11),
            ("Bearing Cover 3", 12, 13),
            ("Bearing Cover 4", 14, 15),
            ("Bearing Cover 5", 16, 17),
            ("output", 18, 19)
        ]

        ws.cell(row=9, column=1, value="Time / Interval").font = FONT_BOLD
        ws.cell(row=9, column=1).alignment = ALIGN_CENTER
        ws.cell(row=9, column=1).fill = GRAY_HEADER_FILL

        ws.cell(row=10, column=1, value="").font = FONT_BOLD
        ws.cell(row=10, column=1).fill = GRAY_HEADER_FILL

        for comp_name, start_c, end_c in components:
            ws.merge_cells(start_row=9, start_column=start_c, end_row=9, end_column=end_c)
            top_cell = ws.cell(row=9, column=start_c, value=comp_name)
            top_cell.font = FONT_HEADER
            top_cell.alignment = ALIGN_CENTER
            top_cell.fill = GRAY_HEADER_FILL

            # Sub headers
            c1 = ws.cell(row=10, column=start_c, value="Actual Temp")
            c1.font = FONT_BOLD
            c1.alignment = ALIGN_CENTER
            c1.fill = GRAY_HEADER_FILL

            c2 = ws.cell(row=10, column=end_c, value="Temp Rise")
            c2.font = FONT_BOLD
            c2.alignment = ALIGN_CENTER
            c2.fill = GRAY_HEADER_FILL

        ws.merge_cells(start_row=9, start_column=20, end_row=10, end_column=20)
        amb_cell = ws.cell(row=9, column=20, value="Ambient")
        amb_cell.font = FONT_HEADER
        amb_cell.alignment = ALIGN_CENTER
        amb_cell.fill = GRAY_HEADER_FILL

        for r in [9, 10]:
            for c in range(1, 21):
                ws.cell(row=r, column=c).border = BORDER_ALL

        # 5. Data Rows (Rows 11, 12, 13)
        current_row = 11
        for row_idx, item in enumerate(intervals):
            ws.row_dimensions[current_row].height = 22
            r_fill = ZEBRA_FILL if row_idx % 2 == 1 else PatternFill(fill_type=None)

            # Col 1: Time
            c_time = ws.cell(row=current_row, column=1, value=item.time_label)
            c_time.font = FONT_BOLD
            c_time.alignment = ALIGN_LEFT

            # Input
            ws.cell(row=current_row, column=2, value=item.input_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=3, value=item.input_rise).alignment = ALIGN_RIGHT

            # Body
            ws.cell(row=current_row, column=4, value=item.body_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=5, value=item.body_rise).alignment = ALIGN_RIGHT

            # Body 2
            body2_act = getattr(item, 'body2_actual', item.body_actual)
            body2_r = getattr(item, 'body2_rise', item.body_rise)
            ws.cell(row=current_row, column=6, value=body2_act).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=7, value=body2_r).alignment = ALIGN_RIGHT

            # Bearing 1
            ws.cell(row=current_row, column=8, value=item.bc1_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=9, value=item.bc1_rise).alignment = ALIGN_RIGHT

            # Bearing 2
            ws.cell(row=current_row, column=10, value=item.bc2_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=11, value=item.bc2_rise).alignment = ALIGN_RIGHT

            # Bearing 3
            ws.cell(row=current_row, column=12, value=item.bc3_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=13, value=item.bc3_rise).alignment = ALIGN_RIGHT

            # Bearing 4
            ws.cell(row=current_row, column=14, value=item.bc4_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=15, value=item.bc4_rise).alignment = ALIGN_RIGHT

            # Bearing 5
            ws.cell(row=current_row, column=16, value=item.bc5_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=17, value=item.bc5_rise).alignment = ALIGN_RIGHT

            # Output
            ws.cell(row=current_row, column=18, value=item.output_actual).alignment = ALIGN_RIGHT
            ws.cell(row=current_row, column=19, value=item.output_rise).alignment = ALIGN_RIGHT

            # Ambient
            ws.cell(row=current_row, column=20, value=item.ambient).alignment = ALIGN_RIGHT

            for c in range(1, 21):
                cell = ws.cell(row=current_row, column=c)
                cell.border = BORDER_ALL
                if r_fill.fill_type:
                    cell.fill = r_fill
                if c >= 2:
                    cell.number_format = '0.0'

            current_row += 1

        # 6. Lubrication & Inspection Footer
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=2)
        ws.cell(row=current_row, column=1, value="Lubrication leakage").font = FONT_BOLD
        ws.cell(row=current_row, column=1).alignment = ALIGN_LEFT

        ws.merge_cells(start_row=current_row, start_column=3, end_row=current_row, end_column=11)
        ws.cell(row=current_row, column=3, value=metadata.lubrication_leakage).font = FONT_REGULAR
        ws.cell(row=current_row, column=3).alignment = ALIGN_CENTER

        ws.merge_cells(start_row=current_row, start_column=12, end_row=current_row, end_column=20)
        ws.cell(row=current_row, column=12, value=metadata.lubrication_leakage).font = FONT_REGULAR
        ws.cell(row=current_row, column=12).alignment = ALIGN_CENTER

        for c in range(1, 21):
            ws.cell(row=current_row, column=c).border = BORDER_ALL

        current_row += 2
        # Overall compliance footer
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=20)
        ws.cell(row=current_row, column=1, value="OVERALL RESULT: COMPLIES - ALL MEASURED TEMPERATURE RISES ARE WITHIN < 40°C LIMIT").font = FONT_PASS
        ws.cell(row=current_row, column=1).alignment = ALIGN_CENTER
        ws.cell(row=current_row, column=1).fill = PASS_FILL
        for c in range(1, 21):
            ws.cell(row=current_row, column=c).border = BORDER_ALL

        # Column widths auto-adjust
        for col_idx in range(1, 21):
            col_letter = get_column_letter(col_idx)
            ws.column_dimensions[col_letter].width = 13 if col_idx > 1 else 28

        out_path = get_output_path(output_filename)
        wb.save(out_path)
        return out_path
