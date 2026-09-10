from typing import Any, List, Optional, Dict
from pydantic import BaseModel, Field

class TimeIntervalReading(BaseModel):
    time_label: str = Field(..., description="e.g. 13:20 (0 min), 13:50 (30 min CW), 14:20 (1 hr CCW)")
    ambient: float = Field(28.0, description="Ambient temperature in °C")
    input_actual: float = Field(27.5, description="Input Actual Temp")
    input_rise: float = Field(-0.5, description="Input Temp Rise")
    body_actual: float = Field(26.6, description="Body Actual Temp")
    body_rise: float = Field(-1.4, description="Body Temp Rise")
    body2_actual: float = Field(26.8, description="Body 2 Actual Temp")
    body2_rise: float = Field(-1.2, description="Body 2 Temp Rise")
    bc1_actual: float = Field(27.0, description="Bearing Cover 1 Actual Temp")
    bc1_rise: float = Field(-1.0, description="Bearing Cover 1 Temp Rise")
    bc2_actual: float = Field(26.9, description="Bearing Cover 2 Actual Temp")
    bc2_rise: float = Field(-1.1, description="Bearing Cover 2 Temp Rise")
    bc3_actual: float = Field(26.3, description="Bearing Cover 3 Actual Temp")
    bc3_rise: float = Field(-1.7, description="Bearing Cover 3 Temp Rise")
    bc4_actual: float = Field(26.9, description="Bearing Cover 4 Actual Temp")
    bc4_rise: float = Field(-1.1, description="Bearing Cover 4 Temp Rise")
    bc5_actual: float = Field(26.5, description="Bearing Cover 5 Actual Temp")
    bc5_rise: float = Field(-1.5, description="Bearing Cover 5 Temp Rise")
    output_actual: float = Field(26.5, description="Output Actual Temp")
    output_rise: float = Field(-1.5, description="Output Temp Rise")

class TestMetadata(BaseModel):
    report_number: str = Field("TR-2026-001", description="Test Report Reference Number")
    test_name: str = Field("GEARBOX / MOTOR TEMPERATURE RISE TEST REPORT", description="Test Name")
    test_date: str = Field("05/09/2026", description="Date of test execution")
    product_name: str = Field("Gearbox / Motor Assembly", description="Product description")
    weight: str = Field("620 kg", description="Weight / Mass")
    started_at: str = Field("13:20", description="Started Time")
    direction_changed_at: str = Field("13:50", description="Direction Changed Time")
    duration: str = Field("1 hour (30 minutes CW & 30 minutes CCW)", description="Test duration")
    noise_level_limit: str = Field("< 85 dB", description="Noise level limit")
    noise_level_measured: str = Field("72.1 dB (1/2 hour)", description="Noise level measured")
    temp_rise_limit: str = Field("< 40°C over ambient (after 1 hour)", description="Acceptance criteria")
    lubrication_leakage: str = Field("No leakage", description="Lubrication check")
    conclusion: str = Field("COMPLIES", description="Overall Test Result")

class ExtractionData(BaseModel):
    file_id: str
    original_filename: str
    is_scanned: bool = True
    metadata: TestMetadata
    intervals: List[TimeIntervalReading]
    raw_text_snippet: Optional[str] = ""
    warnings: List[str] = []

class ExtractRequest(BaseModel):
    file_id: str

class ValidateRequest(BaseModel):
    metadata: TestMetadata
    intervals: List[TimeIntervalReading]

class GenerateExcelRequest(BaseModel):
    metadata: TestMetadata
    intervals: List[TimeIntervalReading]
    file_name: Optional[str] = "Temperature_Rise_Test_Report.xlsx"

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
