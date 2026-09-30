from datetime import datetime
from typing import List
from backend.models.schemas import HospitalState, HospitalUnit

class HospitalService:
    @staticmethod
    def get_current_state() -> HospitalState:
        units = [
            HospitalUnit(
                id="icu",
                name="Medical & Surgical ICU",
                total_beds=24,
                occupied_beds=21,
                staffed_nurses=12,
                ventilators_total=18,
                ventilators_in_use=15,
                target_nurse_ratio="1:2"
            ),
            HospitalUnit(
                id="stepdown",
                name="High-Dependency Step-Down",
                total_beds=32,
                occupied_beds=29,
                staffed_nurses=8,
                ventilators_total=6,
                ventilators_in_use=4,
                target_nurse_ratio="1:4"
            ),
            HospitalUnit(
                id="ed",
                name="Emergency Department",
                total_beds=40,
                occupied_beds=36,
                staffed_nurses=14,
                ventilators_total=8,
                ventilators_in_use=5,
                target_nurse_ratio="1:3"
            ),
            HospitalUnit(
                id="medsurg",
                name="General Medical / Surgical",
                total_beds=120,
                occupied_beds=106,
                staffed_nurses=22,
                ventilators_total=0,
                ventilators_in_use=0,
                target_nurse_ratio="1:5"
            ),
            HospitalUnit(
                id="pacu",
                name="Post-Anesthesia Care Unit (PACU)",
                total_beds=16,
                occupied_beds=11,
                staffed_nurses=6,
                ventilators_total=4,
                ventilators_in_use=2,
                target_nurse_ratio="1:2"
            )
        ]

        total_cap = sum(u.total_beds for u in units)
        total_occ = sum(u.occupied_beds for u in units)
        icu_unit = next(u for u in units if u.id == "icu")

        return HospitalState(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            hospital_name="St. Jude Academic Medical Center - Digital Twin Node",
            total_capacity=total_cap,
            total_occupied=total_occ,
            overall_occupancy_rate=round(total_occ / total_cap, 3),
            icu_occupancy_rate=round(icu_unit.occupied_beds / icu_unit.total_beds, 3),
            ed_queue_count=14,
            average_ed_wait_minutes=48.5,
            active_code_count=1,
            units=units
        )
