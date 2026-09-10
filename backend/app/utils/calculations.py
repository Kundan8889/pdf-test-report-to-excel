from typing import List, Tuple
from app.models.schemas import TemperatureReading, TestMetadata

def calculate_temp_rise(actual_temp: float, ambient_temp: float) -> float:
    """Calculates ΔT = Actual Temperature - Ambient Temperature."""
    if actual_temp is None:
        return 0.0
    amb = ambient_temp if ambient_temp is not None else 25.0
    return round(float(actual_temp) - float(amb), 2)

def evaluate_status(temp_rise: float, max_limit: float = None) -> str:
    """Evaluates whether temperature rise is within permissible limit."""
    if max_limit is None or max_limit <= 0:
        return "PASS"
    if temp_rise > max_limit:
        return "FAIL"
    return "PASS"

def recalculate_dataset(
    metadata: TestMetadata,
    readings: List[TemperatureReading]
) -> Tuple[List[TemperatureReading], int, int, List[str]]:
    """
    Recalculates temp rise for all readings and generates validation warnings.
    Returns: (updated_readings, passed_count, failed_count, warnings_list)
    """
    default_amb = metadata.ambient_temp if metadata.ambient_temp is not None else 25.0
    updated = []
    passed = 0
    failed = 0
    warnings = []

    for r in readings:
        amb = r.ambient_temp if (r.ambient_temp is not None and r.ambient_temp > 0) else default_amb
        rise = calculate_temp_rise(r.actual_temp, amb)
        status = evaluate_status(rise, r.max_limit)

        if status == "PASS":
            passed += 1
        else:
            failed += 1
            warnings.append(f"{r.location} (Channel {r.channel}): Temp rise of {rise}°C exceeds maximum limit of {r.max_limit}°C.")

        if r.actual_temp > 120.0:
            warnings.append(f"High Temperature Warning: {r.location} measured at {r.actual_temp}°C.")

        updated.append(
            TemperatureReading(
                channel=r.channel,
                location=r.location,
                actual_temp=round(float(r.actual_temp), 2),
                ambient_temp=round(float(amb), 2),
                temp_rise=rise,
                max_limit=r.max_limit,
                status=status,
                remarks=r.remarks or ""
            )
        )

    if failed > 0:
        metadata.conclusion = "DOES NOT COMPLY"
    else:
        metadata.conclusion = "COMPLIES"

    return updated, passed, failed, warnings
