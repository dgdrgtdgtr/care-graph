# CareGraph: Hackathon Judge Presentation Script

Use this 3-to-5 minute interactive demonstration script to showcase CareGraph during hackathon evaluations.

---

### Step 0: The Hook & Core Problem (30s)
> *"Judges, current hospital monitoring is broken because it's reactive. When an ICU alarm sounds or a bed runs out, the crisis is already underway. CareGraph is the first uncertainty-aware AI digital twin that couples individual patient clinical trajectories with hospital operational capacity."*

---

### Step 1: Patient Intelligence & Trajectory (45s)
- **Action:** Open the **Patient Trajectories** view. Select **Eleanor Vance (Patient B)**.
- **Judge Query:** *"Which patient needs attention?"*
- **Script:** *"Observe Patient B in Step-Down Ward 4B. While traditional static alerts flag her as moderate, our Temporal AI model forecasts a severe deterioration risk peaking at 91% over the next 12 to 24 hours. Notice the 90% conformal confidence interval bands."*

---

### Step 2: Explainable AI & Clinical Knowledge Graph (45s)
- **Action:** Click **Explainable AI** and inspect the **Clinical Knowledge Graph**.
- **Judge Query:** *"Why is the model predicting deterioration?"*
- **Script:** *"CareGraph doesn't operate as a black box. Our SHAP-inspired attribution shows that an acute jump in serum lactate to 4.1 mmol/L and an SpO2 drop to 89% are driving +58% of the risk. In our interactive Clinical Knowledge Graph, you see how Eleanor's urosepsis links to Stage 2 AKI, requiring vasopressors and an urgent ICU bed."*

---

### Step 3: Counterfactual "What-If" Simulation (The WOW Moment - 60s)
- **Action:** Switch to **Counterfactual Simulator**. Click the preset **"+10 Emergency Patients Surge & -15% ICU Capacity"**.
- **Judge Query:** *"What if 10 emergency patients arrive and ICU capacity drops?"*
- **Script:** *"Watch this. Instead of static dashboards, CareGraph lets us alter reality in real-time. We inject 10 trauma arrivals while reducing ICU staffing capacity by 15%. Immediately, the digital twin calculates that the hospital will hit a critical bottleneck at hour T+4.5h, resulting in a deficit of 5 critical beds."*

---

### Step 4: Constrained Resource Optimization (45s)
- **Action:** Switch to **Resource Optimizer** and click **Run Optimization Solver**.
- **Judge Query:** *"What should the hospital do?"*
- **Script:** *"We don't leave operators guessing. The mixed-integer optimizer evaluates hospital-wide constraints: it recommends safely transferring Arthur Pendelton (Patient A), who has stabilized post-CABG, down to the general cardiac ward; calling in 2 on-call float nurses to maintain a strict 1:2 ratio; and reserving Ventilator #7 on standby for Patient B. Risk is mitigated by 75.5% without compromising clinical safety."*

---

### Step 5: Summary & Safety Positioning (30s)
> *"CareGraph completes the full loop: Observe ➔ Predict ➔ Explain ➔ Simulate ➔ Optimize. It is built as a transparent, uncertainty-aware decision-support twin designed to save lives and prevent hospital gridlock. Thank you!"*
