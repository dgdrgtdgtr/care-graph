<div align="center">

# CareGraph
### AI Clinical Risk & Hospital Resource Digital Twin

[![Hackathon](https://img.shields.io/badge/VJ%20Hackathon-2026%20National-blueviolet?style=for-the-badge)](https://github.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://fastapi.tiangolo.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![UI](https://img.shields.io/badge/UI-Cyber--Clinical%20Glassmorphism-06b6d4?style=for-the-badge)](frontend/index.html)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

**An uncertainty-aware AI digital twin connecting micro-level patient clinical trajectories with macro-level hospital operational capacity.**

[Live Interactive Demo](frontend/index.html) • [System Architecture](docs/ARCHITECTURE.md) • [Judge Presentation Script](docs/JUDGE_DEMO_SCRIPT.md) • [Clinical Dataset](data/synthetic_patients.json)

---

</div>

## 1. Executive Summary & Core Idea

Hospital clinical monitoring and resource management are traditionally isolated and reactive:
- **Clinical care** alerts staff only after a patient has already deteriorated into acute septic shock or respiratory collapse.
- **Operations teams** react only after the Intensive Care Unit (ICU) is already 100% saturated and the Emergency Department (ED) is forced onto ambulance diversion.

**CareGraph resolves this disconnect by integrating two levels of intelligence into a unified digital twin:**
1. **Patient Digital Twin (Micro):** Models changing longitudinal vitals, lab panels, and multi-horizon deterioration risk across 6h, 12h, 24h, and 48h horizons with conformal prediction uncertainty bands.
2. **Hospital Digital Twin (Macro):** Models operational capacity across the ICU, Emergency Department, Step-Down / HDU, and Med-Surg wards, tracking nurse staffing ratios and ventilator fleet utilization.

```
       PATIENT CLINICAL INTELLIGENCE (Micro)
       [Vitals • Labs • Medications • Trajectory]
                          │
                          ▼
            CareGraph Unified Digital Twin  ◄───  HOSPITAL OPERATIONS (Macro)
                          │                       [Beds • ICU • Staff • Ventilators]
                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Observe ──► Predict (6-48h) ──► Explain (XAI) ──► Simulate (What-If) ──► Optimize    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Modules & Technical Innovations

### 1. Patient Trajectory Forecasting & Early Warning System (EWS)
- **Multi-Horizon Risk Prediction:** Forecasts patient decompensation risk at **6h, 12h, 24h, and 48h** intervals rather than relying on static point-in-time threshold alerts.
- **Uncertainty Quantification:** Employs **conformal prediction bands (90% and 95% confidence intervals)** that widen into future forecast horizons to reflect clinical uncertainty.
- **Dynamic NEWS2 / qSOFA Integration:** Tracks physiological trend dynamics rather than isolated spikes.

### 2. Explainable AI (XAI) & Attribution Pipeline
- **Model-Derived Feature Importance:** Computes SHAP-inspired feature attributions for every prediction (e.g., *Serum Lactate jump to 4.1 mmol/L contributes +32% to 12h septic shock risk*).
- **Strict Data Provenance:** Visually distinguishes:
  - 🔵 **Observed Ground Truth** (Laboratory assays, physical vitals)
  - 🟣 **Temporal AI Model Forecasts** (Risk projections with uncertainty bands)
  - 🟠 **Counterfactual Simulations** (Hypothetical operational shocks)

### 3. Heterogeneous Clinical Knowledge Graph
- Formalizes clinical reasoning into a structured graph:
  $$\text{Patient} \longrightarrow \text{Condition} \longrightarrow \text{Lab Abnormality} \longrightarrow \text{Medication} \longrightarrow \text{Risk Factor} \longrightarrow \text{Complication} \longrightarrow \text{Required Resource}$$
- Connects medical pathophysiology to operational assets (e.g., linking severe urosepsis and oliguric AKI directly to an urgent ICU resuscitation bed with Continuous Renal Replacement Therapy [CRRT]).

### 4. Counterfactual "What-If" Hospital Simulator *(The "WOW" Feature)*
Instead of merely forecasting passive metrics, CareGraph lets hospital leaders and judges interactively stress-test the facility:
- **What if 10 emergency patients arrive due to a sudden surge or mass-casualty incident?**
- **What if ICU capacity drops by 15% due to sudden nurse shortages or equipment maintenance?**
- **What if elective surgical admissions are rescheduled?**
The discrete-event simulation engine recomputes occupancy curves, nurse stress indices, and pinpoint-detects the exact **bottleneck hour** (e.g., *saturation predicted at hour T+4.5h*).

### 5. Multi-Objective Constrained Resource Optimizer
Converts forecasts into proactive, constrained decision support using Mixed-Integer Linear Programming (MILP):
- **Safety Constraints Honored:**
  - Maximum ICU Nurse-to-Patient ratio $\le 1:2$
  - Step-down transfer allowed only if $\text{NEWS2} \le 5$ and patient is euvolemic
  - Minimum ventilator safety reserve $\ge 2$ units
- **Actionable Allocations:** Recommends step-down ward transfers for stabilized patients, mobilizes on-call float nurses, and prioritizes device staging.

---

## 3. The 5-Step Hackathon Judge Walkthrough

CareGraph includes an interactive **"Judge Walkthrough Mode"** directly inside the UI, implementing the demonstration flow from the hackathon specification:

| Step | Judge Question | System Digital Twin Response |
| :--- | :--- | :--- |
| **Step 1: Patient Intelligence** | *"Which patient needs attention?"* | **Eleanor Vance (Patient B)** shows an elevated predicted deterioration trajectory reaching **91% risk at 12–24h**, despite moderate current score. |
| **Step 2: Explainability** | *"Why is Patient B deteriorating?"* | XAI reveals that acute **Serum Lactate elevation (+0.32)** and **refractory hypoxemia (+0.26)** are driving decompensation toward septic shock. |
| **Step 3: Hospital Twin** | *"How does this affect operations?"* | Hospital Twin shows ICU occupancy is already at **87.5% (21/24 beds)**; Eleanor's transfer leaves only 2 beds remaining. |
| **Step 4: Counterfactual Simulation** | *"What if 10 emergency patients arrive & ICU drops 15%?"* | The simulator detects a **critical bottleneck at T+4.5h**, causing a deficit of 5 critical beds without intervention. |
| **Step 5: Resource Optimization** | *"What should the hospital do?"* | The optimizer solves a constrained allocation: safely transfers stabilized **Patient A** to cardiac ward, activates 2 on-call float nurses, and holds elective surgery post-op beds, **mitigating 75.5% of projected risk**. |

---

## 4. Software Architecture & Intelligence Flow

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         Clinical Data Sources                          │
  │     MIMIC-IV / eICU Data • Bed Census • Telemetry • Staffing Roster    │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        CareGraph Core Engine                           │
  │  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
  │  │     Patient Digital Twin     │    │     Hospital Digital Twin    │  │
  │  │  - Longitudinal Vitals       │    │  - ICU / Step-Down / ED / OR │  │
  │  │  - Multi-Horizon Trajectory  │    │  - Nurse Staffing Ratios     │  │
  │  │  - Conformal Prediction CIs  │    │  - Ventilator Fleet Status   │  │
  │  └──────────────┬───────────────┘    └──────────────┬───────────────┘  │
  │                 └───────────────────┬───────────────┘                  │
  │                                     ▼                                  │
  │                 ┌───────────────────────────────────────┐              │
  │                 │    Explainable AI & Knowledge Graph   │              │
  │                 │    - SHAP Feature Attribution         │              │
  │                 │    - Semantic Clinical Graph          │              │
  │                 └───────────────────┬───────────────────┘              │
  │                                     ▼                                  │
  │                 ┌───────────────────────────────────────┐              │
  │                 │   Counterfactual Simulation Engine    │              │
  │                 │   - "What-If" Surge & Capacity Shocks │              │
  │                 │   - Bottleneck Hour Prediction        │              │
  │                 └───────────────────┬───────────────────┘              │
  │                                     ▼                                  │
  │                 ┌───────────────────────────────────────┐              │
  │                 │ Constrained Multi-Objective Optimizer │              │
  │                 │ - Mixed-Integer Linear Program (MILP) │              │
  │                 │ - Clinical Safety Boundaries          │              │
  └─────────────────┴───────────────────┬───────────────────┴──────────────┘
                                        ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   Cyber-Clinical Decision Dashboard                    │
  │    Interactive Glassmorphism UI • Canvas Trajectory Charts • WebGL/SVG  │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Modern HTML5, ES6+ Modules, Cyber-Clinical Glassmorphism CSS, Dynamic Canvas Trajectory Engine, Physics Knowledge Graph |
| **Tooling & Dev** | Node.js, Vite, npm |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **AI / ML & Modeling** | XGBoost & Temporal Sequence Baselines, Conformal Prediction Bounds, Gradient SHAP |
| **Simulation & Graph** | Discrete-Event Simulator, NetworkX Heterogeneous Medical Ontology |
| **Optimization** | Mixed-Integer Linear Programming (MILP) Formulation / OR-Tools formulation |

---

## 6. Project Structure

```bash
caregraph/
├── backend/                        # Python FastAPI Digital Twin Backend
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic data contracts (Patient, Vitals, Trajectory)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── patient_service.py     # Trajectory forecasting & SHAP attribution
│   │   ├── hospital_service.py    # Operational unit capacity & telemetry
│   │   ├── simulation_service.py  # Counterfactual discrete-event simulator
│   │   ├── optimizer_service.py   # Constrained multi-objective MILP solver
│   │   └── graph_service.py       # Clinical knowledge graph builder
│   ├── __init__.py
│   ├── main.py                    # REST API application entry point
│   └── requirements.txt           # Python backend dependencies
│
├── frontend/                       # Interactive Web Application
│   ├── css/
│   │   └── caregraph.css          # Master cyber-clinical glassmorphic styling
│   ├── js/
│   │   ├── data.js                # Digital twin cohort state & clinical telemetry
│   │   ├── trajectory_chart.js    # Canvas multi-horizon trajectory chart w/ CIs
│   │   ├── knowledge_graph.js     # Physics-based interactive force-directed graph
│   │   ├── counterfactual.js      # What-if simulation engine & timeline comparison
│   │   ├── optimizer.js           # Decision support constrained solver
│   │   └── app.js                 # Master application controller & judge tour
│   ├── index.html                 # Main dashboard UI
│   ├── package.json               # Vite development configuration
│   └── vite.config.js
│
├── data/
│   └── synthetic_patients.json    # De-identified clinical test cohort
│
├── docs/
│   ├── ARCHITECTURE.md            # Detailed mathematical formulation & pipelines
│   └── JUDGE_DEMO_SCRIPT.md       # 3-5 minute hackathon presentation script
│
├── .gitignore
├── LICENSE                        # MIT License
├── README.md                      # Project documentation
└── index.html                     # Root redirect entry point
```

---

## 7. Quick Start Guide

### Option A: Instant Run (Zero Setup Required)
You can explore CareGraph immediately in your browser without installing heavy dependencies:
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/caregraph.git
   cd caregraph
   ```
2. Double-click or open `frontend/index.html` (or `index.html`) in any modern web browser (Chrome, Edge, Firefox, Safari).
3. Click the **"Judge Walkthrough Mode"** button in the top right to start the interactive guided tour!

---

### Option B: Run with Python FastAPI Backend
```bash
# 1. Navigate to repository root
cd caregraph

# 2. Create virtual environment & install requirements
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt

# 3. Launch the FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- CareGraph Dashboard: [http://localhost:8000/](http://localhost:8000/)

---

### Option C: Run Frontend via Vite
```bash
cd caregraph/frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Mathematical Formulation

### 1. Conformal Prediction Uncertainty Bounds
For risk estimate $\hat{y}_t$ at horizon $t \in \{6, 12, 24, 48\}$, the conformal prediction interval is constructed with nonconformity scores $\alpha_i = |y_i - \hat{y}_i|$ evaluated over a calibration cohort:
$$\mathcal{C}_{1-\alpha}(t) = \left[ \hat{y}_t - q_{1-\alpha}(t), \quad \hat{y}_t + q_{1-\alpha}(t) \right]$$
where $q_{1-\alpha}(t)$ expands monotonically with the forecast horizon to capture temporal uncertainty.

### 2. Multi-Objective Constrained Allocation
$$\min_{x} \quad \sum_{t=1}^{H} \left( w_1 \cdot \text{ICU\_Deficit}_t + w_2 \cdot \text{Staff\_Stress}_t + w_3 \cdot \text{Cancelled\_Electives} \right)$$
**Subject to:**
1. **ICU Nurse-to-Patient Ratio:**
   $$\frac{\text{Beds}_{\text{ICU}}}{\text{Nurses}_{\text{ICU}}} \le 2.0$$
2. **Clinical Safety Step-Down Bound:**
   $$\text{Transfer}(p) = 1 \implies \text{NEWS2}(p) \le 5 \quad \land \quad \text{Lactate}(p) \le 2.0 \text{ mmol/L}$$
3. **Emergency Ventilator Fleet Reserve:**
   $$\text{Ventilators}_{\text{Available}} \ge 2$$

---

## 9. Important Scientific & Safety Disclaimers

1. **Decision Support, Not Autonomous Physician:** CareGraph is an investigational clinical and operational decision-support prototype. It does not issue autonomous medical orders or prescription changes. All clinical transfers, medication titrations, and surgical deferrals remain strictly the responsibility of licensed medical personnel.
2. **Attribution vs. Causation:** Feature attributions (SHAP scores) represent statistical associations derived by temporal models across clinical time series. They do not constitute proven biological causality.
3. **De-Identification & Privacy:** Demonstration datasets are synthetic and inspired by public de-identified datasets (PhysioNet MIMIC-IV / eICU). No protected health information (PHI) is present.

---

## 10. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed for **VJ Hackathon 2026 — National Level 24-Hour Hackathon**.
