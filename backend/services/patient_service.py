import numpy as np
from typing import List, Optional
from backend.models.schemas import (
    Patient, VitalsRecord, LabPanel, TrajectoryPoint,
    FeatureAttribution, KnowledgeNode, KnowledgeEdge
)

# Realistic clinical cohort representing digital twin states
DEMO_PATIENTS: List[Patient] = [
    Patient(
        id="PT-2026-B",
        name="Eleanor Vance (Patient B)",
        age=68,
        gender="Female",
        ward="Step-Down Ward 4B",
        bed="Bed 12",
        primary_diagnosis="Severe Sepsis secondary to Pyelonephritis",
        admit_hours_ago=36,
        current_news2=9,
        acuity_status="Deteriorating",
        current_vitals=VitalsRecord(
            timestamp="2026-09-30 22:30",
            heart_rate=118.0,
            systolic_bp=92.0,
            diastolic_bp=58.0,
            mean_arterial_pressure=69.3,
            resp_rate=26.0,
            spo2=89.0,
            temperature=38.9
        ),
        current_labs=LabPanel(
            timestamp="2026-09-30 21:00",
            lactate=4.1,
            wbc=18.4,
            creatinine=2.1,
            platelets=112.0,
            crp=142.0,
            pao2_fio2=210.0
        ),
        trajectory=[
            # -24h to 0h: Observed
            TrajectoryPoint(hour=-24, deterioration_risk=0.15, lower_ci=0.10, upper_ci=0.20, icu_transfer_prob=0.08, ews_score=3, is_forecast=False),
            TrajectoryPoint(hour=-18, deterioration_risk=0.22, lower_ci=0.16, upper_ci=0.28, icu_transfer_prob=0.12, ews_score=4, is_forecast=False),
            TrajectoryPoint(hour=-12, deterioration_risk=0.38, lower_ci=0.30, upper_ci=0.45, icu_transfer_prob=0.22, ews_score=6, is_forecast=False),
            TrajectoryPoint(hour=-6,  deterioration_risk=0.58, lower_ci=0.50, upper_ci=0.66, icu_transfer_prob=0.41, ews_score=7, is_forecast=False),
            TrajectoryPoint(hour=0,   deterioration_risk=0.74, lower_ci=0.68, upper_ci=0.81, icu_transfer_prob=0.65, ews_score=9, is_forecast=False),
            # +1h to +48h: Model Forecast with widening conformal prediction bounds
            TrajectoryPoint(hour=6,   deterioration_risk=0.82, lower_ci=0.72, upper_ci=0.91, icu_transfer_prob=0.78, ews_score=10, is_forecast=True),
            TrajectoryPoint(hour=12,  deterioration_risk=0.88, lower_ci=0.76, upper_ci=0.95, icu_transfer_prob=0.85, ews_score=11, is_forecast=True),
            TrajectoryPoint(hour=24,  deterioration_risk=0.91, lower_ci=0.78, upper_ci=0.98, icu_transfer_prob=0.89, ews_score=12, is_forecast=True),
            TrajectoryPoint(hour=48,  deterioration_risk=0.85, lower_ci=0.68, upper_ci=0.96, icu_transfer_prob=0.80, ews_score=10, is_forecast=True),
        ],
        attributions=[
            FeatureAttribution(
                feature="Serum Lactate Elevation",
                current_value="4.1 mmol/L",
                normal_range="0.5 - 2.0 mmol/L",
                shap_impact=+0.32,
                direction="elevates",
                clinical_note="Sign of tissue hypoperfusion & anaerobic metabolism; strong predictor of septic shock."
            ),
            FeatureAttribution(
                feature="Refractory Hypoxemia (SpO2)",
                current_value="89%",
                normal_range="95 - 100%",
                shap_impact=+0.26,
                direction="elevates",
                clinical_note="Desaturation despite 4L nasal cannula; impending acute respiratory failure."
            ),
            FeatureAttribution(
                feature="Tachypnea (Resp Rate)",
                current_value="26 breaths/min",
                normal_range="12 - 20 breaths/min",
                shap_impact=+0.18,
                direction="elevates",
                clinical_note="Compensatory respiratory alkalosis for metabolic acidosis."
            ),
            FeatureAttribution(
                feature="Hypotension (MAP)",
                current_value="69.3 mmHg",
                normal_range="70 - 105 mmHg",
                shap_impact=+0.14,
                direction="elevates",
                clinical_note="Borderline MAP; fluid resuscitation has reached limit without vasopressor support."
            ),
            FeatureAttribution(
                feature="Leukocytosis (WBC)",
                current_value="18.4 x10³/µL",
                normal_range="4.5 - 11.0 x10³/µL",
                shap_impact=+0.09,
                direction="elevates",
                clinical_note="Severe systemic inflammatory response."
            ),
            FeatureAttribution(
                feature="Renal Function Trend (Creatinine)",
                current_value="2.1 mg/dL",
                normal_range="0.6 - 1.2 mg/dL",
                shap_impact=+0.08,
                direction="elevates",
                clinical_note="Stage 2 AKI onset secondary to hypoperfusion."
            ),
        ],
        subgraph_nodes=[
            KnowledgeNode(id="pt_b", label="Patient B (Eleanor)", category="patient", details="68yo F, Day 2 admission"),
            KnowledgeNode(id="c_sepsis", label="Severe Sepsis", category="condition", details="Septic response to urinary source"),
            KnowledgeNode(id="c_aki", label="Stage 2 AKI", category="complication", details="Oliguria, Cr 2.1 mg/dL"),
            KnowledgeNode(id="c_shock", label="Septic Shock Risk", category="complication", details="82% probability in 6h"),
            KnowledgeNode(id="l_lac", label="Serum Lactate 4.1", category="lab", details="Critical value > 4 mmol/L"),
            KnowledgeNode(id="l_wbc", label="WBC 18.4", category="lab", details="Marked leukocytosis"),
            KnowledgeNode(id="m_mero", label="Meropenem IV", category="medication", details="Broad spectrum coverage"),
            KnowledgeNode(id="m_norepi", label="Norepinephrine", category="medication", details="First line vasopressor (Pending ICU)"),
            KnowledgeNode(id="rf_hypox", label="PaO2/FiO2 < 250", category="risk_factor", details="Mild ARDS criteria"),
            KnowledgeNode(id="r_icu", label="ICU Bed w/ Invasive Line", category="resource", details="Urgent need within 4h"),
            KnowledgeNode(id="r_vent", label="High-Flow / Ventilator", category="resource", details="Standby for intubation"),
        ],
        subgraph_edges=[
            KnowledgeEdge(source="pt_b", target="c_sepsis", relationship="diagnosed_with"),
            KnowledgeEdge(source="c_sepsis", target="l_lac", relationship="exhibits"),
            KnowledgeEdge(source="c_sepsis", target="l_wbc", relationship="exhibits"),
            KnowledgeEdge(source="c_sepsis", target="m_mero", relationship="prescribed"),
            KnowledgeEdge(source="l_lac", target="c_shock", relationship="elevates_risk"),
            KnowledgeEdge(source="c_sepsis", target="c_aki", relationship="leads_to"),
            KnowledgeEdge(source="c_sepsis", target="rf_hypox", relationship="exhibits"),
            KnowledgeEdge(source="c_shock", target="r_icu", relationship="requires"),
            KnowledgeEdge(source="c_shock", target="m_norepi", relationship="requires"),
            KnowledgeEdge(source="rf_hypox", target="r_vent", relationship="may_require"),
        ]
    ),
    Patient(
        id="PT-2026-A",
        name="Arthur Pendelton (Patient A)",
        age=74,
        gender="Male",
        ward="Cardiothoracic Step-Down",
        bed="Bed 04",
        primary_diagnosis="Post-CABG Day 3, New-Onset Atrial Fibrillation",
        admit_hours_ago=72,
        current_news2=5,
        acuity_status="Guarded",
        current_vitals=VitalsRecord(
            timestamp="2026-09-30 22:15",
            heart_rate=104.0,
            systolic_bp=128.0,
            diastolic_bp=82.0,
            mean_arterial_pressure=97.3,
            resp_rate=19.0,
            spo2=96.0,
            temperature=37.3
        ),
        current_labs=LabPanel(
            timestamp="2026-09-30 19:30",
            lactate=1.4,
            wbc=11.2,
            creatinine=1.1,
            platelets=195.0,
            crp=48.0,
            pao2_fio2=380.0
        ),
        trajectory=[
            TrajectoryPoint(hour=-24, deterioration_risk=0.45, lower_ci=0.35, upper_ci=0.55, icu_transfer_prob=0.30, ews_score=6, is_forecast=False),
            TrajectoryPoint(hour=-12, deterioration_risk=0.38, lower_ci=0.28, upper_ci=0.48, icu_transfer_prob=0.22, ews_score=5, is_forecast=False),
            TrajectoryPoint(hour=0,   deterioration_risk=0.32, lower_ci=0.24, upper_ci=0.40, icu_transfer_prob=0.18, ews_score=5, is_forecast=False),
            TrajectoryPoint(hour=6,   deterioration_risk=0.25, lower_ci=0.16, upper_ci=0.35, icu_transfer_prob=0.12, ews_score=4, is_forecast=True),
            TrajectoryPoint(hour=12,  deterioration_risk=0.20, lower_ci=0.12, upper_ci=0.30, icu_transfer_prob=0.08, ews_score=3, is_forecast=True),
            TrajectoryPoint(hour=24,  deterioration_risk=0.15, lower_ci=0.08, upper_ci=0.24, icu_transfer_prob=0.05, ews_score=2, is_forecast=True),
            TrajectoryPoint(hour=48,  deterioration_risk=0.10, lower_ci=0.04, upper_ci=0.18, icu_transfer_prob=0.03, ews_score=1, is_forecast=True),
        ],
        attributions=[
            FeatureAttribution(
                feature="Ventricular Rate Control",
                current_value="104 bpm",
                normal_range="60 - 100 bpm",
                shap_impact=+0.15,
                direction="elevates",
                clinical_note="Amiodarone infusion successfully slowing rapid ventricular response."
            ),
            FeatureAttribution(
                feature="Normal Serum Lactate",
                current_value="1.4 mmol/L",
                normal_range="0.5 - 2.0 mmol/L",
                shap_impact=-0.22,
                direction="protects",
                clinical_note="Adequate systemic end-organ perfusion confirmed."
            ),
            FeatureAttribution(
                feature="Stable Mean Arterial Pressure",
                current_value="97.3 mmHg",
                normal_range="70 - 105 mmHg",
                shap_impact=-0.18,
                direction="protects",
                clinical_note="Hemodynamically stable without inotropes."
            )
        ],
        subgraph_nodes=[
            KnowledgeNode(id="pt_a", label="Patient A (Arthur)", category="patient", details="74yo M, Post-CABG"),
            KnowledgeNode(id="c_afib", label="Post-Op Afib", category="condition", details="RVR controlled on Amiodarone"),
            KnowledgeNode(id="m_amio", label="Amiodarone IV", category="medication", details="Rate and rhythm management"),
            KnowledgeNode(id="r_stepdown", label="Telemetry Bed", category="resource", details="Ready for ward step-down in 12h")
        ],
        subgraph_edges=[
            KnowledgeEdge(source="pt_a", target="c_afib", relationship="diagnosed_with"),
            KnowledgeEdge(source="c_afib", target="m_amio", relationship="prescribed"),
            KnowledgeEdge(source="pt_a", target="r_stepdown", relationship="currently_uses")
        ]
    ),
    Patient(
        id="PT-2026-C",
        name="Marcus Brody (Patient C)",
        age=59,
        gender="Male",
        ward="Medical ICU",
        bed="ICU Bed 03",
        primary_diagnosis="Acute Respiratory Distress Syndrome (ARDS) & Bilateral Viral Pneumonia",
        admit_hours_ago=48,
        current_news2=11,
        acuity_status="Critical",
        current_vitals=VitalsRecord(
            timestamp="2026-09-30 22:45",
            heart_rate=122.0,
            systolic_bp=102.0,
            diastolic_bp=64.0,
            mean_arterial_pressure=76.6,
            resp_rate=32.0,
            spo2=86.0,
            temperature=38.4
        ),
        current_labs=LabPanel(
            timestamp="2026-09-30 21:30",
            lactate=3.6,
            wbc=22.1,
            creatinine=1.8,
            platelets=145.0,
            crp=210.0,
            pao2_fio2=145.0
        ),
        trajectory=[
            TrajectoryPoint(hour=-24, deterioration_risk=0.70, lower_ci=0.62, upper_ci=0.78, icu_transfer_prob=0.90, ews_score=9, is_forecast=False),
            TrajectoryPoint(hour=-12, deterioration_risk=0.82, lower_ci=0.74, upper_ci=0.89, icu_transfer_prob=0.95, ews_score=10, is_forecast=False),
            TrajectoryPoint(hour=0,   deterioration_risk=0.89, lower_ci=0.82, upper_ci=0.96, icu_transfer_prob=0.99, ews_score=11, is_forecast=False),
            TrajectoryPoint(hour=6,   deterioration_risk=0.92, lower_ci=0.85, upper_ci=0.98, icu_transfer_prob=0.99, ews_score=12, is_forecast=True),
            TrajectoryPoint(hour=12,  deterioration_risk=0.94, lower_ci=0.86, upper_ci=0.99, icu_transfer_prob=0.99, ews_score=13, is_forecast=True),
            TrajectoryPoint(hour=24,  deterioration_risk=0.91, lower_ci=0.80, upper_ci=0.97, icu_transfer_prob=0.98, ews_score=11, is_forecast=True),
            TrajectoryPoint(hour=48,  deterioration_risk=0.83, lower_ci=0.70, upper_ci=0.93, icu_transfer_prob=0.92, ews_score=9, is_forecast=True),
        ],
        attributions=[
            FeatureAttribution(
                feature="Severe Hypoxemia PaO2/FiO2",
                current_value="145",
                normal_range="> 300",
                shap_impact=+0.38,
                direction="elevates",
                clinical_note="Moderate-to-severe ARDS; prone positioning protocol indicated."
            ),
            FeatureAttribution(
                feature="Hypercapnic Tachypnea",
                current_value="32 bpm",
                normal_range="12 - 20 bpm",
                shap_impact=+0.28,
                direction="elevates",
                clinical_note="Severe work of breathing on invasive ventilator (PEEP 14)."
            ),
            FeatureAttribution(
                feature="Lactate Clearence Delay",
                current_value="3.6 mmol/L",
                normal_range="0.5 - 2.0 mmol/L",
                shap_impact=+0.20,
                direction="elevates",
                clinical_note="Ongoing microvascular hypoperfusion."
            )
        ],
        subgraph_nodes=[
            KnowledgeNode(id="pt_c", label="Patient C (Marcus)", category="patient", details="59yo M, ARDS"),
            KnowledgeNode(id="c_ards", label="Severe ARDS", category="condition", details="Berlin criteria PaO2/FiO2 145"),
            KnowledgeNode(id="r_vent_inv", label="Invasive Ventilator", category="resource", details="Engaged PEEP 14, FiO2 70%"),
            KnowledgeNode(id="r_nurse_1to1", label="1:1 Critical Care Nurse", category="resource", details="Continuous titration requirement"),
            KnowledgeNode(id="r_ecmo", label="V-V ECMO Standby", category="resource", details="Cannulation alert if PaO2/FiO2 < 100")
        ],
        subgraph_edges=[
            KnowledgeEdge(source="pt_c", target="c_ards", relationship="diagnosed_with"),
            KnowledgeEdge(source="c_ards", target="r_vent_inv", relationship="requires"),
            KnowledgeEdge(source="c_ards", target="r_nurse_1to1", relationship="requires"),
            KnowledgeEdge(source="c_ards", target="r_ecmo", relationship="risk_of_requiring")
        ]
    ),
    Patient(
        id="PT-2026-D",
        name="Sophia Martinez (Patient D)",
        age=32,
        gender="Female",
        ward="General Medical 2A",
        bed="Bed 08",
        primary_diagnosis="Diabetic Ketoacidosis (DKA) - Resolved Acidosis",
        admit_hours_ago=28,
        current_news2=2,
        acuity_status="Stable",
        current_vitals=VitalsRecord(
            timestamp="2026-09-30 22:00",
            heart_rate=78.0,
            systolic_bp=116.0,
            diastolic_bp=74.0,
            mean_arterial_pressure=88.0,
            resp_rate=16.0,
            spo2=99.0,
            temperature=36.8
        ),
        current_labs=LabPanel(
            timestamp="2026-09-30 20:00",
            lactate=1.1,
            wbc=8.9,
            creatinine=0.9,
            platelets=240.0,
            crp=12.0,
            pao2_fio2=420.0
        ),
        trajectory=[
            TrajectoryPoint(hour=-24, deterioration_risk=0.55, lower_ci=0.45, upper_ci=0.65, icu_transfer_prob=0.45, ews_score=7, is_forecast=False),
            TrajectoryPoint(hour=-12, deterioration_risk=0.30, lower_ci=0.22, upper_ci=0.38, icu_transfer_prob=0.15, ews_score=4, is_forecast=False),
            TrajectoryPoint(hour=0,   deterioration_risk=0.12, lower_ci=0.06, upper_ci=0.18, icu_transfer_prob=0.04, ews_score=2, is_forecast=False),
            TrajectoryPoint(hour=6,   deterioration_risk=0.08, lower_ci=0.03, upper_ci=0.14, icu_transfer_prob=0.02, ews_score=1, is_forecast=True),
            TrajectoryPoint(hour=12,  deterioration_risk=0.05, lower_ci=0.02, upper_ci=0.10, icu_transfer_prob=0.01, ews_score=1, is_forecast=True),
            TrajectoryPoint(hour=24,  deterioration_risk=0.04, lower_ci=0.01, upper_ci=0.08, icu_transfer_prob=0.01, ews_score=0, is_forecast=True),
            TrajectoryPoint(hour=48,  deterioration_risk=0.03, lower_ci=0.01, upper_ci=0.06, icu_transfer_prob=0.01, ews_score=0, is_forecast=True),
        ],
        attributions=[
            FeatureAttribution(
                feature="Normalized Anion Gap & pH",
                current_value="pH 7.39, Gap 10",
                normal_range="7.35 - 7.45",
                shap_impact=-0.42,
                direction="protects",
                clinical_note="Resolution of ketoacidosis, transitioned from IV insulin to subcutaneous."
            ),
            FeatureAttribution(
                feature="Hemodynamic Stability",
                current_value="HR 78, MAP 88",
                normal_range="HR 60-100, MAP > 65",
                shap_impact=-0.25,
                direction="protects",
                clinical_note="Fluid deficit fully corrected."
            )
        ],
        subgraph_nodes=[
            KnowledgeNode(id="pt_d", label="Patient D (Sophia)", category="patient", details="32yo F, DKA"),
            KnowledgeNode(id="c_dka", label="DKA (Recovered)", category="condition", details="Anion gap closed"),
            KnowledgeNode(id="m_subq_ins", label="Subcutaneous Insulin", category="medication", details="Gargline + Lispro regimen"),
            KnowledgeNode(id="r_gen_bed", label="General Ward Bed", category="resource", details="Discharge candidate in 24h")
        ],
        subgraph_edges=[
            KnowledgeEdge(source="pt_d", target="c_dka", relationship="diagnosed_with"),
            KnowledgeEdge(source="c_dka", target="m_subq_ins", relationship="prescribed"),
            KnowledgeEdge(source="pt_d", target="r_gen_bed", relationship="currently_uses")
        ]
    )
]

class PatientService:
    @staticmethod
    def get_all_patients() -> List[Patient]:
        return DEMO_PATIENTS

    @staticmethod
    def get_patient_by_id(patient_id: str) -> Optional[Patient]:
        for pt in DEMO_PATIENTS:
            if pt.id.lower() == patient_id.lower() or patient_id.lower() in pt.name.lower():
                return pt
        return None
