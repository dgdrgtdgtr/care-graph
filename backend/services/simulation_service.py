import math
from typing import List
from backend.models.schemas import (
    CounterfactualRequest, SimulationResponse, SimulationHourMetric
)

class SimulationService:
    @staticmethod
    def run_counterfactual_simulation(req: CounterfactualRequest) -> SimulationResponse:
        base_icu_capacity = 24
        # Apply capacity change percentage
        effective_icu_cap = max(8, int(round(base_icu_capacity * (1.0 + (req.icu_capacity_delta_pct / 100.0)))))
        
        # Initial state
        initial_icu_occ = 21
        initial_ed_queue = 14
        
        hourly_metrics: List[SimulationHourMetric] = []
        current_occ = initial_icu_occ
        current_queue = initial_ed_queue
        
        # Surge arrivals distribution over next 12 hours (Poisson-like peak at hour 3-5)
        surge_total = req.additional_ed_arrivals
        elective_reduction = 3 if req.reschedule_electives else 0
        
        bottleneck_hour = None
        peak_occ = initial_icu_occ
        diverted_accum = 0

        for h in range(0, req.simulation_horizon_hours + 1):
            if h == 0:
                # Hour 0 is current state
                hourly_metrics.append(SimulationHourMetric(
                    hour=0,
                    baseline_icu_occupancy=initial_icu_occ,
                    simulated_icu_occupancy=initial_icu_occ,
                    ed_queue_length=initial_ed_queue,
                    icu_capacity_limit=effective_icu_cap,
                    diverted_or_delayed_patients=0,
                    nurse_stress_index=0.78
                ))
                continue

            # Influx from surge: distributed over early hours
            surge_hourly_inflow = 0
            if surge_total > 0 and 1 <= h <= 8:
                # Bell shape influx
                weight = math.exp(-0.5 * ((h - 3.5) / 1.8) ** 2)
                surge_hourly_inflow = max(0, int(round((surge_total / 3.5) * weight)))

            # Acuity conversion: approx 25% of surge ED arrivals require ICU transfer within 2-4 hours
            icu_admit_from_surge = 1 if (surge_hourly_inflow >= 2 and h >= 3) else 0

            # Natural internal patient deterioration from ward/stepdown (e.g. Patient B deteriorating at T+4h)
            internal_deteriorations = 1 if h in [3, 7, 14] else 0

            # Normal scheduled discharges / transfers out
            scheduled_discharges = 1 if h in [4, 10, 18, 22] else 0
            if req.reschedule_electives and h in [2, 6]:
                scheduled_discharges += 1  # Frees up step-down/ICU beds by holding electives

            # Update baseline (without surge or capacity cut)
            base_occ = min(base_icu_capacity, max(14, initial_icu_occ + (1 if h in [5, 12] else 0) - (1 if h in [6, 16] else 0)))

            # Update simulated state
            net_change = (icu_admit_from_surge + internal_deteriorations) - scheduled_discharges
            candidate_occ = current_occ + net_change

            if candidate_occ > effective_icu_cap:
                overflow = candidate_occ - effective_icu_cap
                diverted_accum += overflow
                current_occ = effective_icu_cap
                if bottleneck_hour is None:
                    bottleneck_hour = round(h - 0.5, 1)
            else:
                current_occ = max(10, candidate_occ)

            peak_occ = max(peak_occ, candidate_occ)
            current_queue = max(5, current_queue + surge_hourly_inflow - 2)

            # Nurse stress index based on nurse-to-patient load
            staffed_nurses = 12
            stress = round(min(1.0, (current_occ / (staffed_nurses * 2.0)) * 0.95 + (0.15 if candidate_occ > effective_icu_cap else 0.0)), 2)

            hourly_metrics.append(SimulationHourMetric(
                hour=h,
                baseline_icu_occupancy=base_occ,
                simulated_icu_occupancy=candidate_occ,
                ed_queue_length=current_queue,
                icu_capacity_limit=effective_icu_cap,
                diverted_or_delayed_patients=diverted_accum,
                nurse_stress_index=stress
            ))

        bottleneck_detected = peak_occ > effective_icu_cap
        bed_deficit = max(0, peak_occ - effective_icu_cap)

        summary = (
            f"Under scenario (+{req.additional_ed_arrivals} ED surge, {req.icu_capacity_delta_pct:+.0f}% ICU cap), "
            f"ICU capacity drops to {effective_icu_cap} beds. "
        )
        if bottleneck_detected:
            summary += (
                f"CRITICAL BOTTLENECK projected at T+{bottleneck_hour}h. Peak simulated demand reaches "
                f"{peak_occ} beds (deficit of {bed_deficit} ICU beds). Actionable mitigation required."
            )
        else:
            summary += "System remains within operational buffers with no critical saturation projected."

        return SimulationResponse(
            scenario_name=f"Surge: +{req.additional_ed_arrivals} ED | ICU Cap: {req.icu_capacity_delta_pct:+.0f}%",
            horizon_hours=req.simulation_horizon_hours,
            peak_icu_occupancy=peak_occ,
            icu_capacity_ceiling=effective_icu_cap,
            bottleneck_detected=bottleneck_detected,
            bottleneck_time_hours=bottleneck_hour,
            projected_bed_deficit=bed_deficit,
            hourly_projection=hourly_metrics,
            system_impact_summary=summary
        )
