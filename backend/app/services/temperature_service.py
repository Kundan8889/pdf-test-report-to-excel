from typing import List, Tuple
from app.models.schemas import TimeIntervalReading, TestMetadata

class TemperatureService:
    @staticmethod
    def calculate_and_validate(
        metadata: TestMetadata,
        intervals: List[TimeIntervalReading]
    ) -> Tuple[List[TimeIntervalReading], List[str]]:
        """
        Recalculates temp rise for all intervals based on ambient temp.
        """
        warnings = []
        for item in intervals:
            amb = item.ambient
            item.input_rise = round(item.input_actual - amb, 1)
            item.body_rise = round(item.body_actual - amb, 1)
            item.body2_rise = round(getattr(item, 'body2_actual', item.body_actual) - amb, 1)
            item.bc1_rise = round(item.bc1_actual - amb, 1)
            item.bc2_rise = round(item.bc2_actual - amb, 1)
            item.bc3_rise = round(item.bc3_actual - amb, 1)
            item.bc4_rise = round(item.bc4_actual - amb, 1)
            item.bc5_rise = round(item.bc5_actual - amb, 1)
            item.output_rise = round(item.output_actual - amb, 1)

            for comp, rise in [
                ("Input", item.input_rise), ("Body", item.body_rise), ("Body 2", item.body2_rise),
                ("Bearing Cover 1", item.bc1_rise), ("Bearing Cover 2", item.bc2_rise),
                ("Bearing Cover 3", item.bc3_rise), ("Bearing Cover 4", item.bc4_rise),
                ("Bearing Cover 5", item.bc5_rise), ("Output", item.output_rise)
            ]:
                if rise > 40.0:
                    warnings.append(f"{item.time_label} - {comp}: Rise of {rise}°C exceeds limit of 40°C!")

        return intervals, warnings
