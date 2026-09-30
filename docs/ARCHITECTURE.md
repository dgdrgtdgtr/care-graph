# CareGraph: Architecture & Intelligence Pipeline

**AI Clinical Risk & Hospital Resource Digital Twin**  
*VJ Hackathon 2026 Reference Architecture*

---

## 1. System Vision

Modern clinical workflows are largely reactive: alerts sound when a patient has already decompensated, and hospital operations scramble when the ICU is already full. 

**CareGraph bridges individual clinical trajectories and macro-level hospital capacity into a dual digital twin framework:**
```
Patient Intelligence (Micro) ───┐
                                ├──► Unified Digital Twin ──► Counterfactual Simulation ──► Constrained Optimization
Hospital Operations (Macro)  ───┘
```

---

## 2. End-to-End Pipeline

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           Data Ingestion & Fusion                       │
  │   Longitudinal Vitals • Lab Panels • Meds • Unit Census • Staffing Ratios│
  └────────────────────────────────────┬────────────────────────────────────┘
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           Digital Twins State                           │
  │     Patient Digital Twin (Vitals/Labs/NEWS2)  • Hospital Twin (Units/Beds)│
  └────────────────────────────────────┬────────────────────────────────────┘
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                       Temporal Prediction Engine                        │
  │   - Multi-horizon risk forecasting (6h, 12h, 24h, 48h)                  │
  │   - Conformal Prediction bounds (90% & 95% uncertainty bands)           │
  │   - ICU transfer & Length-of-Stay (LOS) risk estimation                 │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                 Explainable AI & Clinical Knowledge Graph               │
  │   - Model-derived feature attribution (SHAP-inspired weights)           │
  │   - Graph: Patient ➔ Condition ➔ Lab ➔ Med ➔ Risk ➔ Complication ➔ Resource│
  └────────────────────────────────────┬────────────────────────────────────┘
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    Counterfactual Simulation Engine                     │
  │   - "What-if" hospital state evaluation (Surge volume, ICU drop)        │
  │   - Bottleneck hour prediction & resource deficit discovery             │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                 Multi-Objective Resource Optimization                   │
  │   - Mixed-Integer formulation (MILP) with hard clinical safety bounds   │
  │   - Step-down triage, float nurse dispatch, elective surgical hold      │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                       Decision Support Dashboard                        │
  │   Separation of Observed Ground Truth vs Model Predictions vs Simulation │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical Formulation of Resource Optimizer

The CareGraph Optimizer balances predicted hospital overload while honoring strict clinical safety bounds:

$$\min_{x} \quad w_1 \sum_{t} \text{Deficit}_t + w_2 \sum_{u} \text{Stress}_u + w_3 \text{Cancellations}$$

Subject to:
1. **ICU Nurse-to-Patient Ratio Constraint:**
   $$\frac{\text{Occupied Beds}_{\text{ICU}}}{\text{Nurses}_{\text{ICU}}} \le 2.0$$
2. **Step-Down Stability Threshold:**
   $$\text{Transfer}(p) = 1 \implies \text{NEWS2}(p) \le 5 \quad \land \quad \text{Lactate}(p) \le 2.0 \text{ mmol/L}$$
3. **Critical Device Conservation:**
   $$\text{Available Ventilators} \ge \sum \mathbb{I}(\text{Predicted Respiratory Risk}_{12h} > 0.80) + \text{Safety Buffer}$$

---

## 4. Scientific & Safety Positioning

- **Decision Support, Not Autonomous Prescriber:** CareGraph outputs scenarios, prioritization rankings, and feasibility trade-offs. Final diagnostic and clinical decisions reside strictly with licensed human care teams.
- **Data Provenance:** Observed laboratory measurements and vital signs are distinctly marked from temporal model forecasts and counterfactual what-if simulations.
- **Attribution vs Causation:** Feature contributions represent statistical associations learned across time-series sequences, not verified biomedical causality.
