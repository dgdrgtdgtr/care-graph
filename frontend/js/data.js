// CareGraph Digital Twin State & Clinical Cohort Data
// VJ Hackathon 2026 Reference Implementation

const CAREGRAPH_DATA = {
  hospital: {
    name: "St. Jude Academic Medical Center",
    nodeId: "STJ-TWIN-01",
    totalBeds: 232,
    occupiedBeds: 203,
    overallOccupancy: 87.5,
    icuOccupancy: 87.5,
    edQueue: 14,
    avgEdWaitMin: 48,
    activeCodes: 1,
    systemAlert: "WARNING: High ICU Bed Pressure (3 beds remaining)",
    units: [
      {
        id: "icu",
        name: "Medical & Surgical ICU",
        shortName: "ICU",
        totalBeds: 24,
        occupiedBeds: 21,
        staffedNurses: 12,
        requiredNurses: 11,
        nurseRatio: "1:2",
        ventilatorsTotal: 18,
        ventilatorsInUse: 15,
        status: "Critical",
        trend: "Rapid Upward Demand",
        color: "#ef4444"
      },
      {
        id: "stepdown",
        name: "High-Dependency Step-Down",
        shortName: "HDU / Step-Down",
        totalBeds: 32,
        occupiedBeds: 29,
        staffedNurses: 8,
        requiredNurses: 8,
        nurseRatio: "1:4",
        ventilatorsTotal: 6,
        ventilatorsInUse: 4,
        status: "Elevated",
        trend: "Steady High",
        color: "#f59e0b"
      },
      {
        id: "ed",
        name: "Emergency Department",
        shortName: "ED / Trauma",
        totalBeds: 40,
        occupiedBeds: 36,
        staffedNurses: 14,
        requiredNurses: 14,
        nurseRatio: "1:3",
        ventilatorsTotal: 8,
        ventilatorsInUse: 5,
        status: "Elevated",
        trend: "Incoming Inflow High",
        color: "#f59e0b"
      },
      {
        id: "medsurg",
        name: "General Medical / Surgical",
        shortName: "Med-Surg",
        totalBeds: 120,
        occupiedBeds: 106,
        staffedNurses: 22,
        requiredNurses: 21,
        nurseRatio: "1:5",
        ventilatorsTotal: 0,
        ventilatorsInUse: 0,
        status: "Normal",
        trend: "Stable Turnover",
        color: "#10b981"
      },
      {
        id: "pacu",
        name: "Post-Anesthesia Care Unit",
        shortName: "PACU",
        totalBeds: 16,
        occupiedBeds: 11,
        staffedNurses: 6,
        requiredNurses: 6,
        nurseRatio: "1:2",
        ventilatorsTotal: 4,
        ventilatorsInUse: 2,
        status: "Normal",
        trend: "Post-Op Scheduled",
        color: "#10b981"
      }
    ]
  },

  patients: [
    {
      id: "PT-2026-B",
      code: "Patient B",
      name: "Eleanor Vance",
      age: 68,
      gender: "Female",
      ward: "High-Dependency Step-Down",
      bed: "Bed 12",
      diagnosis: "Severe Sepsis secondary to Pyelonephritis",
      acuity: "Deteriorating",
      acuityColor: "#ef4444",
      news2Score: 9,
      admissionTime: "36 hrs ago",
      highlightReason: "Elevated predicted deterioration trajectory within 6-12h",
      vitals: {
        hr: 118,
        hrUnit: "bpm",
        hrStatus: "Tachycardic",
        bp: "92/58",
        map: 69.3,
        mapUnit: "mmHg",
        mapStatus: "Borderline Low",
        rr: 26,
        rrUnit: "/min",
        rrStatus: "Tachypneic",
        spo2: 89,
        spo2Unit: "%",
        spo2Status: "Severe Hypoxemia (4L NC)",
        temp: 38.9,
        tempUnit: "°C",
        tempStatus: "Febrile"
      },
      labs: {
        lactate: { val: 4.1, unit: "mmol/L", normal: "0.5 - 2.0", flag: "CRITICAL" },
        wbc: { val: 18.4, unit: "x10³/µL", normal: "4.5 - 11.0", flag: "HIGH" },
        creatinine: { val: 2.1, unit: "mg/dL", normal: "0.6 - 1.2", flag: "HIGH" },
        platelets: { val: 112, unit: "x10³/µL", normal: "150 - 450", flag: "LOW" },
        crp: { val: 142, unit: "mg/L", normal: "< 10.0", flag: "CRITICAL" }
      },
      trajectory: [
        { hour: -24, risk: 0.15, ciLower: 0.10, ciUpper: 0.20, news2: 3, isForecast: false, label: "T-24h" },
        { hour: -18, risk: 0.22, ciLower: 0.16, ciUpper: 0.28, news2: 4, isForecast: false, label: "T-18h" },
        { hour: -12, risk: 0.38, ciLower: 0.30, ciUpper: 0.45, news2: 6, isForecast: false, label: "T-12h" },
        { hour: -6,  risk: 0.58, ciLower: 0.50, ciUpper: 0.66, news2: 7, isForecast: false, label: "T-6h" },
        { hour: 0,   risk: 0.74, ciLower: 0.68, ciUpper: 0.81, news2: 9, isForecast: false, label: "Now" },
        { hour: 6,   risk: 0.82, ciLower: 0.72, ciUpper: 0.91, news2: 10, isForecast: true, label: "T+6h" },
        { hour: 12,  risk: 0.88, ciLower: 0.76, ciUpper: 0.95, news2: 11, isForecast: true, label: "T+12h" },
        { hour: 24,  risk: 0.91, ciLower: 0.78, ciUpper: 0.98, news2: 12, isForecast: true, label: "T+24h" },
        { hour: 48,  risk: 0.85, ciLower: 0.68, ciUpper: 0.96, news2: 10, isForecast: true, label: "T+48h" }
      ],
      attributions: [
        {
          feature: "Serum Lactate Surge",
          value: "4.1 mmol/L",
          normal: "0.5 - 2.0",
          impact: +0.32,
          direction: "elevates",
          category: "Tissue Perfusion",
          explanation: "Rapid anaerobic transition; strong biomarker for impending septic shock."
        },
        {
          feature: "Refractory Hypoxemia (SpO2)",
          value: "89% on 4L NC",
          normal: "95 - 100%",
          impact: +0.26,
          direction: "elevates",
          category: "Respiratory",
          explanation: "Persistent low oxygen saturation indicates pulmonary capillary leak."
        },
        {
          feature: "Tachypnea (Resp Rate)",
          value: "26 bpm",
          normal: "12 - 20 bpm",
          impact: +0.18,
          direction: "elevates",
          category: "Respiratory",
          explanation: "Compensatory respiratory effort attempting metabolic acid clearing."
        },
        {
          feature: "Mean Arterial Pressure (MAP)",
          value: "69.3 mmHg",
          normal: "> 70 mmHg",
          impact: +0.14,
          direction: "elevates",
          category: "Hemodynamics",
          explanation: "Inadequate organ perfusion pressure; fluid responsiveness waning."
        },
        {
          feature: "WBC Systemic Inflammation",
          value: "18.4 x10³/µL",
          normal: "4.5 - 11.0",
          impact: +0.09,
          direction: "elevates",
          category: "Infection",
          explanation: "Marked neutrophilia reflecting uncontrolled source infection."
        },
        {
          feature: "Acute Renal Injury (Creatinine)",
          value: "2.1 mg/dL (Baseline 0.9)",
          normal: "0.6 - 1.2",
          impact: +0.08,
          direction: "elevates",
          category: "Renal",
          explanation: "Stage 2 Acute Kidney Injury onset due to hypoperfusion."
        }
      ],
      graphNodes: [
        { id: "pt_b", label: "Patient B (Eleanor)", group: "patient", icon: "user", x: 260, y: 180 },
        { id: "c_sepsis", label: "Severe Urosepsis", group: "condition", icon: "activity", x: 420, y: 120 },
        { id: "l_lac", label: "Lactate 4.1 mmol/L", group: "lab", icon: "droplet", x: 600, y: 80 },
        { id: "l_wbc", label: "WBC 18.4", group: "lab", icon: "shield", x: 580, y: 160 },
        { id: "c_shock", label: "Septic Shock (88%)", group: "complication", icon: "alert-triangle", x: 740, y: 120 },
        { id: "c_aki", label: "Stage 2 AKI", group: "complication", icon: "alert-circle", x: 440, y: 270 },
        { id: "m_mero", label: "IV Meropenem", group: "medication", icon: "pill", x: 140, y: 90 },
        { id: "m_norepi", label: "Norepinephrine Pressor", group: "medication", icon: "zap", x: 740, y: 220 },
        { id: "r_icu", label: "ICU Resuscitation Bed", group: "resource", icon: "home", x: 720, y: 320 },
        { id: "r_vent", label: "Mechanical Ventilator", group: "resource", icon: "wind", x: 540, y: 340 }
      ],
      graphEdges: [
        { from: "pt_b", to: "c_sepsis", label: "diagnosed with" },
        { from: "c_sepsis", to: "l_lac", label: "elevates" },
        { from: "c_sepsis", to: "l_wbc", label: "causes leukocytosis" },
        { from: "c_sepsis", to: "c_aki", label: "end-organ damage" },
        { from: "l_lac", to: "c_shock", label: "predicts onset" },
        { from: "c_sepsis", to: "m_mero", label: "treated by" },
        { from: "c_shock", to: "m_norepi", label: "requires titration" },
        { from: "c_shock", to: "r_icu", label: "requires urgent transfer" },
        { from: "c_aki", to: "r_icu", label: "CRRT standby" },
        { from: "pt_b", to: "r_vent", label: "standby for intubation" }
      ]
    },

    {
      id: "PT-2026-A",
      code: "Patient A",
      name: "Arthur Pendelton",
      age: 74,
      gender: "Male",
      ward: "Cardiothoracic Step-Down",
      bed: "Bed 04",
      diagnosis: "Post-CABG Day 3, Controlled Atrial Fibrillation",
      acuity: "Guarded",
      acuityColor: "#f59e0b",
      news2Score: 5,
      admissionTime: "72 hrs ago",
      highlightReason: "Steadily stabilizing; prime candidate for step-down to clear ICU buffer",
      vitals: {
        hr: 104,
        hrUnit: "bpm",
        hrStatus: "Controlled Afib",
        bp: "128/82",
        map: 97.3,
        mapUnit: "mmHg",
        mapStatus: "Normal Hemodynamics",
        rr: 19,
        rrUnit: "/min",
        rrStatus: "Normal",
        spo2: 96,
        spo2Unit: "%",
        spo2Status: "Room Air",
        temp: 37.3,
        tempUnit: "°C",
        tempStatus: "Afebrile"
      },
      labs: {
        lactate: { val: 1.4, unit: "mmol/L", normal: "0.5 - 2.0", flag: "NORMAL" },
        wbc: { val: 11.2, unit: "x10³/µL", normal: "4.5 - 11.0", flag: "BORDERLINE" },
        creatinine: { val: 1.1, unit: "mg/dL", normal: "0.6 - 1.2", flag: "NORMAL" },
        platelets: { val: 195, unit: "x10³/µL", normal: "150 - 450", flag: "NORMAL" },
        crp: { val: 48, unit: "mg/L", normal: "< 10.0", flag: "ELEVATED" }
      },
      trajectory: [
        { hour: -24, risk: 0.45, ciLower: 0.35, ciUpper: 0.55, news2: 6, isForecast: false, label: "T-24h" },
        { hour: -12, risk: 0.38, ciLower: 0.28, ciUpper: 0.48, news2: 5, isForecast: false, label: "T-12h" },
        { hour: 0,   risk: 0.32, ciLower: 0.24, ciUpper: 0.40, news2: 5, isForecast: false, label: "Now" },
        { hour: 6,   risk: 0.25, ciLower: 0.16, ciUpper: 0.35, news2: 4, isForecast: true, label: "T+6h" },
        { hour: 12,  risk: 0.20, ciLower: 0.12, ciUpper: 0.30, news2: 3, isForecast: true, label: "T+12h" },
        { hour: 24,  risk: 0.15, ciLower: 0.08, ciUpper: 0.24, news2: 2, isForecast: true, label: "T+24h" },
        { hour: 48,  risk: 0.10, ciLower: 0.04, ciUpper: 0.18, news2: 1, isForecast: true, label: "T+48h" }
      ],
      attributions: [
        {
          feature: "Normal Serum Lactate",
          value: "1.4 mmol/L",
          normal: "0.5 - 2.0",
          impact: -0.22,
          direction: "protects",
          category: "Perfusion",
          explanation: "Demonstrates adequate cardiac output & systemic tissue perfusion."
        },
        {
          feature: "Stable Mean Arterial Pressure",
          value: "97.3 mmHg",
          normal: "> 70 mmHg",
          impact: -0.18,
          direction: "protects",
          category: "Hemodynamics",
          explanation: "Blood pressure maintained without inotropic or vasopressor infusions."
        },
        {
          feature: "Amiodarone Rate Control",
          value: "HR 104 bpm",
          normal: "60 - 100",
          impact: +0.15,
          direction: "elevates",
          category: "Electrophysiology",
          explanation: "Residual mild sinus tachycardia with controlled rate."
        }
      ],
      graphNodes: [
        { id: "pt_a", label: "Patient A (Arthur)", group: "patient", icon: "user", x: 260, y: 180 },
        { id: "c_afib", label: "Post-CABG Afib", group: "condition", icon: "activity", x: 420, y: 140 },
        { id: "m_amio", label: "Oral Amiodarone", group: "medication", icon: "pill", x: 580, y: 120 },
        { id: "r_ward", label: "General Cardiac Bed", group: "resource", icon: "home", x: 580, y: 240 }
      ],
      graphEdges: [
        { from: "pt_a", to: "c_afib", label: "recovering from" },
        { from: "c_afib", to: "m_amio", label: "stabilized by" },
        { from: "pt_a", to: "r_ward", label: "eligible to transfer" }
      ]
    },

    {
      id: "PT-2026-C",
      code: "Patient C",
      name: "Marcus Brody",
      age: 59,
      gender: "Male",
      ward: "Medical ICU",
      bed: "Bed 03",
      diagnosis: "Severe Acute Respiratory Distress Syndrome (ARDS)",
      acuity: "Critical",
      acuityColor: "#ef4444",
      news2Score: 11,
      admissionTime: "48 hrs ago",
      highlightReason: "High-level mechanical ventilation support, prone positioning",
      vitals: {
        hr: 122,
        hrUnit: "bpm",
        hrStatus: "Tachycardic",
        bp: "102/64",
        map: 76.6,
        mapUnit: "mmHg",
        mapStatus: "Supported",
        rr: 32,
        rrUnit: "/min",
        rrStatus: "Ventilator Set",
        spo2: 86,
        spo2Unit: "%",
        spo2Status: "Critical (FiO2 70%, PEEP 14)",
        temp: 38.4,
        tempUnit: "°C",
        tempStatus: "Febrile"
      },
      labs: {
        lactate: { val: 3.6, unit: "mmol/L", normal: "0.5 - 2.0", flag: "HIGH" },
        wbc: { val: 22.1, unit: "x10³/µL", normal: "4.5 - 11.0", flag: "CRITICAL" },
        creatinine: { val: 1.8, unit: "mg/dL", normal: "0.6 - 1.2", flag: "HIGH" },
        platelets: { val: 145, unit: "x10³/µL", normal: "150 - 450", flag: "LOW" },
        crp: { val: 210, unit: "mg/L", normal: "< 10.0", flag: "CRITICAL" }
      },
      trajectory: [
        { hour: -24, risk: 0.70, ciLower: 0.62, ciUpper: 0.78, news2: 9, isForecast: false, label: "T-24h" },
        { hour: -12, risk: 0.82, ciLower: 0.74, ciUpper: 0.89, news2: 10, isForecast: false, label: "T-12h" },
        { hour: 0,   risk: 0.89, ciLower: 0.82, ciUpper: 0.96, news2: 11, isForecast: false, label: "Now" },
        { hour: 6,   risk: 0.92, ciLower: 0.85, ciUpper: 0.98, news2: 12, isForecast: true, label: "T+6h" },
        { hour: 12,  risk: 0.94, ciLower: 0.86, ciUpper: 0.99, news2: 13, isForecast: true, label: "T+12h" },
        { hour: 24,  risk: 0.91, ciLower: 0.80, ciUpper: 0.97, news2: 11, isForecast: true, label: "T+24h" },
        { hour: 48,  risk: 0.83, ciLower: 0.70, ciUpper: 0.93, news2: 9, isForecast: true, label: "T+48h" }
      ],
      attributions: [
        {
          feature: "Severe PaO2/FiO2 Ratio (145)",
          value: "145",
          normal: "> 300",
          impact: +0.38,
          direction: "elevates",
          category: "Gas Exchange",
          explanation: "Moderate-severe ARDS under Berlin definition; high shunt fraction."
        },
        {
          feature: "Ventilator Drive & PEEP 14",
          value: "PEEP 14 cmH2O",
          normal: "5 cmH2O",
          impact: +0.28,
          direction: "elevates",
          category: "Ventilator",
          explanation: "High airway pressure requirement posing barotrauma hazard."
        }
      ],
      graphNodes: [
        { id: "pt_c", label: "Patient C (Marcus)", group: "patient", icon: "user", x: 260, y: 180 },
        { id: "c_ards", label: "Severe ARDS", group: "condition", icon: "activity", x: 420, y: 140 },
        { id: "r_vent_inv", label: "Invasive Ventilator", group: "resource", icon: "wind", x: 600, y: 110 },
        { id: "r_nurse1", label: "1:1 Dedicated Nurse", group: "resource", icon: "shield", x: 600, y: 220 }
      ],
      graphEdges: [
        { from: "pt_c", to: "c_ards", label: "admitted with" },
        { from: "c_ards", to: "r_vent_inv", label: "intubated on" },
        { from: "c_ards", to: "r_nurse1", label: "mandates" }
      ]
    },

    {
      id: "PT-2026-D",
      code: "Patient D",
      name: "Sophia Martinez",
      age: 32,
      gender: "Female",
      ward: "General Medical 2A",
      bed: "Bed 08",
      diagnosis: "Diabetic Ketoacidosis (DKA) - Post-Stabilization",
      acuity: "Stable",
      acuityColor: "#10b981",
      news2Score: 2,
      admissionTime: "28 hrs ago",
      highlightReason: "Acidosis closed, normalized vitals; ready for ward discharge",
      vitals: {
        hr: 78,
        hrUnit: "bpm",
        hrStatus: "Normal",
        bp: "116/74",
        map: 88.0,
        mapUnit: "mmHg",
        mapStatus: "Normal",
        rr: 16,
        rrUnit: "/min",
        rrStatus: "Normal",
        spo2: 99,
        spo2Unit: "%",
        spo2Status: "Room Air",
        temp: 36.8,
        tempUnit: "°C",
        tempStatus: "Normal"
      },
      labs: {
        lactate: { val: 1.1, unit: "mmol/L", normal: "0.5 - 2.0", flag: "NORMAL" },
        wbc: { val: 8.9, unit: "x10³/µL", normal: "4.5 - 11.0", flag: "NORMAL" },
        creatinine: { val: 0.9, unit: "mg/dL", normal: "0.6 - 1.2", flag: "NORMAL" },
        platelets: { val: 240, unit: "x10³/µL", normal: "150 - 450", flag: "NORMAL" },
        crp: { val: 12, unit: "mg/L", normal: "< 10.0", flag: "NORMAL" }
      },
      trajectory: [
        { hour: -24, risk: 0.55, ciLower: 0.45, ciUpper: 0.65, news2: 7, isForecast: false, label: "T-24h" },
        { hour: -12, risk: 0.30, ciLower: 0.22, ciUpper: 0.38, news2: 4, isForecast: false, label: "T-12h" },
        { hour: 0,   risk: 0.12, ciLower: 0.06, ciUpper: 0.18, news2: 2, isForecast: false, label: "Now" },
        { hour: 6,   risk: 0.08, ciLower: 0.03, ciUpper: 0.14, news2: 1, isForecast: true, label: "T+6h" },
        { hour: 12,  risk: 0.05, ciLower: 0.02, ciUpper: 0.10, news2: 1, isForecast: true, label: "T+12h" },
        { hour: 24,  risk: 0.04, ciLower: 0.01, ciUpper: 0.08, news2: 0, isForecast: true, label: "T+24h" },
        { hour: 48,  risk: 0.03, ciLower: 0.01, ciUpper: 0.06, news2: 0, isForecast: true, label: "T+48h" }
      ],
      attributions: [
        {
          feature: "Closed Anion Gap & Normal pH",
          value: "pH 7.39, Gap 10",
          normal: "7.35 - 7.45",
          impact: -0.42,
          direction: "protects",
          category: "Metabolic",
          explanation: "Ketosis resolved; successful transition to subcutaneous basal-bolus insulin."
        },
        {
          feature: "Euvolemic Vitals & Urine Output",
          value: "MAP 88, HR 78",
          normal: "HR 60-100",
          impact: -0.25,
          direction: "protects",
          category: "Fluid Balance",
          explanation: "Hydration completed with balanced electrolytes."
        }
      ],
      graphNodes: [
        { id: "pt_d", label: "Patient D (Sophia)", group: "patient", icon: "user", x: 260, y: 180 },
        { id: "c_dka", label: "DKA (Resolved)", group: "condition", icon: "activity", x: 420, y: 140 },
        { id: "m_subq", label: "SubQ Insulin Glargine", group: "medication", icon: "pill", x: 580, y: 120 },
        { id: "r_home", label: "Discharge Home Plan", group: "resource", icon: "home", x: 580, y: 240 }
      ],
      graphEdges: [
        { from: "pt_d", to: "c_dka", label: "recovering from" },
        { from: "c_dka", to: "m_subq", label: "managed with" },
        { from: "pt_d", to: "r_home", label: "cleared for" }
      ]
    }
  ]
};

// Expose globally
window.CAREGRAPH_DATA = CAREGRAPH_DATA;
