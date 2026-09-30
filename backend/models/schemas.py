from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class VitalsRecord(BaseModel):
    timestamp: str
    heart_rate: float = Field(..., description="BPM")
    systolic_bp: float = Field(..., description="mmHg")
    diastolic_bp: float = Field(..., description="mmHg")
    mean_arterial_pressure: float = Field(..., description="mmHg")
    resp_rate: float = Field(..., description="breaths/min")
    spo2: float = Field(..., description="% oxygen saturation")
    temperature: float = Field(..., description="Celsius")

class LabPanel(BaseModel):
    timestamp: str
    lactate: float = Field(..., description="mmol/L")
    wbc: float = Field(..., description="10^3/uL")
    creatinine: float = Field(..., description="mg/dL")
    platelets: float = Field(..., description="10^3/uL")
    crp: float = Field(..., description="mg/L")
    pao2_fio2: Optional[float] = Field(None, description="Ratio")

class TrajectoryPoint(BaseModel):
    hour: int = Field(..., description="Hour offset: negative = past observed, positive = forecast")
    deterioration_risk: float = Field(..., ge=0.0, le=1.0)
    lower_ci: float = Field(..., ge=0.0, le=1.0, description="90% Conformal confidence lower bound")
    upper_ci: float = Field(..., ge=0.0, le=1.0, description="90% Conformal confidence upper bound")
    icu_transfer_prob: float = Field(..., ge=0.0, le=1.0)
    ews_score: int = Field(..., description="NEWS2 composite score (0-20)")
    is_forecast: bool = Field(..., description="True if simulated/predicted, False if observed")

class FeatureAttribution(BaseModel):
    feature: str
    current_value: str
    normal_range: str
    shap_impact: float = Field(..., description="Relative contribution to deterioration (+ increases, - decreases)")
    direction: str = Field(..., description="'elevates' or 'protects'")
    clinical_note: str

class KnowledgeNode(BaseModel):
    id: str
    label: str
    category: str = Field(..., description="'patient' | 'condition' | 'medication' | 'lab' | 'risk_factor' | 'complication' | 'resource'")
    details: Optional[str] = None

class KnowledgeEdge(BaseModel):
    source: str
    target: str
    relationship: str

class Patient(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    ward: str
    bed: str
    primary_diagnosis: str
    admit_hours_ago: int
    current_news2: int
    acuity_status: str  # 'Critical', 'Deteriorating', 'Guarded', 'Stable'
    current_vitals: VitalsRecord
    current_labs: LabPanel
    trajectory: List[TrajectoryPoint]
    attributions: List[FeatureAttribution]
    subgraph_nodes: List[KnowledgeNode]
    subgraph_edges: List[KnowledgeEdge]

class HospitalUnit(BaseModel):
    id: str
    name: str
    total_beds: int
    occupied_beds: int
    staffed_nurses: int
    ventilators_total: int
    ventilators_in_use: int
    target_nurse_ratio: str

class HospitalState(BaseModel):
    timestamp: str
    hospital_name: str
    total_capacity: int
    total_occupied: int
    overall_occupancy_rate: float
    icu_occupancy_rate: float
    ed_queue_count: int
    average_ed_wait_minutes: float
    active_code_count: int
    units: List[HospitalUnit]

class CounterfactualRequest(BaseModel):
    scenario_id: Optional[str] = "custom"
    additional_ed_arrivals: int = Field(10, ge=0, le=50, description="Sudden ED surge arrivals")
    icu_capacity_delta_pct: float = Field(-15.0, ge=-50.0, le=50.0, description="ICU bed/staff availability shift %")
    reschedule_electives: bool = Field(True, description="Hold elective surgical post-op beds")
    simulation_horizon_hours: int = Field(24, ge=6, le=72)

class SimulationHourMetric(BaseModel):
    hour: int
    baseline_icu_occupancy: int
    simulated_icu_occupancy: int
    ed_queue_length: int
    icu_capacity_limit: int
    diverted_or_delayed_patients: int
    nurse_stress_index: float

class SimulationResponse(BaseModel):
    scenario_name: str
    horizon_hours: int
    peak_icu_occupancy: int
    icu_capacity_ceiling: int
    bottleneck_detected: bool
    bottleneck_time_hours: Optional[float]
    projected_bed_deficit: int
    hourly_projection: List[SimulationHourMetric]
    system_impact_summary: str

class OptimizationRequest(BaseModel):
    allow_stepdown_transfers: bool = True
    call_in_reserve_nurses: bool = True
    defer_electives: bool = True
    safety_buffer_beds: int = Field(2, ge=1, le=10)

class RecommendedAction(BaseModel):
    action_id: str
    priority: str  # 'IMMEDIATE', 'HIGH', 'CONTINGENT'
    category: str  # 'BED_TRIAGE', 'STAFF_DEPLOYMENT', 'ELECTIVE_SCHEDULE', 'DEVICE_ALLOCATION'
    title: str
    detail: str
    expected_impact: str
    confidence: float
    constraints_honored: List[str]

class OptimizationResponse(BaseModel):
    objective_status: str
    risk_reduction_pct: float
    recovered_icu_beds: int
    recommended_actions: List[RecommendedAction]
    constraint_compliance_rate: float
    assumptions_and_disclaimer: str
