// CareGraph Master Application Controller
// Orchestrates Digital Twin Views, Trajectory Forecasting, XAI, Simulation, and Judge Mode

document.addEventListener('DOMContentLoaded', () => {
  // Global App State
  const state = {
    activeTab: 'overview',
    selectedPatientId: 'PT-2026-B', // Eleanor Vance (Patient B from PDF)
    judgeStep: 1,
    simulationParams: {
      additionalEdArrivals: 10,
      icuCapacityDeltaPct: -15,
      rescheduleElectives: true,
      horizonHours: 24
    },
    optimizerParams: {
      allowStepDown: true,
      callReserveNurses: true,
      deferElectives: true,
      safetyBuffer: 2
    },
    isLiveTelemetry: true
  };

  // Instantiate Sub-Systems
  const trajectoryChart = new TrajectoryChart('trajectory-chart-container');
  const knowledgeGraph = new ClinicalKnowledgeGraph('kg-canvas-container', (selectedNode) => {
    handleNodeSelected(selectedNode);
  });
  const simulator = new CounterfactualSimulator('simulation-chart-container');
  const optimizer = new ResourceOptimizer();

  // Initialize UI
  initLandingPage();
  initTabs();
  initPatientSelector();
  initHospitalOverview();
  renderSelectedPatient();
  initCounterfactualControls();
  initOptimizerControls();
  initHeroAndRail();
  initJudgeTour();
  startLiveTelemetryHeartbeat();

  // 0. Landing Page to Hospital Twin Transitions
  function initLandingPage() {
    const landingView = document.getElementById('landing-page-view');
    const twinView = document.getElementById('hospital-twin-view');

    const btnStartHero = document.getElementById('btn-landing-get-started');
    const btnStartNav = document.getElementById('btn-nav-get-started');
    const btnDemo = document.getElementById('btn-landing-watch-demo');
    const previewClick = document.getElementById('landing-preview-click');
    const btnBack = document.getElementById('btn-back-to-landing');
    const closeDot = document.getElementById('browser-dot-close');
    const logoRefresh = document.getElementById('logo-refresh');

    function openHospitalTwin(withTour = false) {
      if (landingView) landingView.style.display = 'none';
      if (twinView) {
        twinView.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      switchView('overview');

      if (withTour) {
        setTimeout(() => {
          const btnTour = document.getElementById('btn-open-judge-tour');
          if (btnTour) btnTour.click();
        }, 350);
      }
    }

    function openLandingPage() {
      if (twinView) twinView.style.display = 'none';
      if (landingView) {
        landingView.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    if (btnStartHero) btnStartHero.addEventListener('click', () => openHospitalTwin(false));
    if (btnStartNav) btnStartNav.addEventListener('click', () => openHospitalTwin(false));
    if (previewClick) previewClick.addEventListener('click', () => openHospitalTwin(false));
    if (btnDemo) btnDemo.addEventListener('click', () => openHospitalTwin(true));

    if (btnBack) btnBack.addEventListener('click', openLandingPage);
    if (closeDot) closeDot.addEventListener('click', openLandingPage);
    if (logoRefresh) logoRefresh.addEventListener('click', openLandingPage);

    // Nav links also route to twin
    ['product', 'service', 'activity', 'support'].forEach(id => {
      const el = document.getElementById(`nav-item-${id}`);
      if (el) {
        el.addEventListener('click', () => openHospitalTwin(false));
      }
    });

    // Check if URL hash requests direct twin view
    if (window.location.hash === '#twin' || window.location.hash === '#dashboard') {
      openHospitalTwin(false);
    }
  }

  // 1. Tab Navigation & Left Rail Routing
  function initTabs() {
    const tabSelectors = '.nav-tab, .nav-pill-btn, [data-view-target]';
    document.querySelectorAll(tabSelectors).forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.getAttribute('data-view') || tab.getAttribute('data-view-target');
        if (targetView) switchView(targetView);
      });
    });
  }

  function initHeroAndRail() {
    // Hero Banner Actions
    const btnHeroStart = document.getElementById('btn-hero-start');
    const btnHeroDemo = document.getElementById('btn-hero-demo');
    const btnCloseHero = document.getElementById('btn-close-hero');
    const heroBanner = document.getElementById('carepoint-hero-banner');

    if (btnHeroStart) {
      btnHeroStart.addEventListener('click', () => {
        const tourBtn = document.getElementById('btn-open-judge-tour');
        if (tourBtn) tourBtn.click();
      });
    }

    if (btnHeroDemo) {
      btnHeroDemo.addEventListener('click', () => {
        const tourBtn = document.getElementById('btn-open-judge-tour');
        if (tourBtn) tourBtn.click();
      });
    }

    if (btnCloseHero && heroBanner) {
      btnCloseHero.addEventListener('click', () => {
        heroBanner.style.transition = 'all 0.3s ease';
        heroBanner.style.opacity = '0';
        heroBanner.style.maxHeight = '0';
        heroBanner.style.padding = '0';
        setTimeout(() => heroBanner.style.display = 'none', 300);
      });
    }

    // Left Rail Actions
    const btnExport = document.getElementById('rail-btn-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        alert('CareGraph Clinical Digital Twin: Full Cohort Report Exported successfully (PDF/JSON format).');
      });
    }

    const btnSound = document.getElementById('rail-btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        state.isLiveTelemetry = !state.isLiveTelemetry;
        btnSound.classList.toggle('active', state.isLiveTelemetry);
        const statusMsg = state.isLiveTelemetry ? 'Enabled' : 'Paused';
        alert(`Real-Time Physiologic Telemetry Heartbeat: ${statusMsg}`);
      });
    }
  }

  function switchView(viewName) {
    state.activeTab = viewName;

    // Update nav tab and rail active classes
    document.querySelectorAll('.nav-tab, .nav-pill-btn').forEach(t => {
      const v = t.getAttribute('data-view');
      t.classList.toggle('active', v === viewName);
    });

    document.querySelectorAll('[data-view-target]').forEach(r => {
      const v = r.getAttribute('data-view-target');
      r.classList.toggle('active', v === viewName);
    });

    // Toggle view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.style.display = sec.getAttribute('id') === `view-${viewName}` ? 'flex' : 'none';
    });

    // Trigger canvas re-renders when their tab opens
    if (viewName === 'trajectory' || viewName === 'xai') {
      setTimeout(() => trajectoryChart.resizeAndDraw(), 50);
    } else if (viewName === 'graph') {
      setTimeout(() => knowledgeGraph.resize(), 50);
    } else if (viewName === 'simulator') {
      setTimeout(() => simulator.draw(), 50);
    }
  }

  // 2. Patient Selector Chips
  function initPatientSelector() {
    const container = document.getElementById('patient-chip-container');
    if (!container) return;

    container.innerHTML = '';
    CAREGRAPH_DATA.patients.forEach(pt => {
      const chip = document.createElement('div');
      chip.className = `patient-chip ${pt.id === state.selectedPatientId ? 'active' : ''}`;
      chip.setAttribute('data-id', pt.id);

      const badgeClass = pt.acuity === 'Critical' ? 'badge-critical' :
                         pt.acuity === 'Deteriorating' ? 'badge-critical' :
                         pt.acuity === 'Guarded' ? 'badge-guarded' : 'badge-stable';

      chip.innerHTML = `
        <div class="patient-avatar" style="border-color: ${pt.acuityColor}">${pt.code.replace('Patient ', '')}</div>
        <div class="patient-chip-info">
          <div class="patient-chip-name">${pt.name}</div>
          <div class="patient-chip-sub">${pt.ward} • ${pt.bed}</div>
        </div>
        <span class="badge ${badgeClass}">${pt.acuity}</span>
      `;

      chip.addEventListener('click', () => {
        selectPatient(pt.id);
      });

      container.appendChild(chip);
    });
  }

  function selectPatient(patientId) {
    state.selectedPatientId = patientId;
    document.querySelectorAll('.patient-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-id') === patientId);
    });
    renderSelectedPatient();
  }

  // 3. Render Patient Data in Trajectory, Vitals, XAI, and KG
  function renderSelectedPatient() {
    const pt = CAREGRAPH_DATA.patients.find(p => p.id === state.selectedPatientId);
    if (!pt) return;

    // Header info
    const nameEl = document.getElementById('patient-banner-name');
    if (nameEl) nameEl.textContent = `${pt.name} (${pt.code})`;

    const metaEl = document.getElementById('patient-banner-meta');
    if (metaEl) metaEl.textContent = `${pt.age}yo ${pt.gender} • ${pt.ward} • ${pt.bed} • Admitted: ${pt.admissionTime}`;

    const diagEl = document.getElementById('patient-banner-diagnosis');
    if (diagEl) diagEl.textContent = pt.diagnosis;

    const news2El = document.getElementById('patient-banner-news2');
    if (news2El) {
      news2El.textContent = `NEWS2 Score: ${pt.news2Score}`;
      news2El.className = `badge ${pt.news2Score >= 7 ? 'badge-critical' : pt.news2Score >= 5 ? 'badge-elevated' : 'badge-stable'}`;
    }

    // Trajectory Chart
    trajectoryChart.setData(pt);

    // Current Vitals Telemetry Table
    const vitalsBody = document.getElementById('patient-vitals-body');
    if (vitalsBody) {
      vitalsBody.innerHTML = `
        <tr><td>Heart Rate</td><td class="telemetry-val">${pt.vitals.hr} ${pt.vitals.hrUnit}</td><td>${pt.vitals.hrStatus}</td></tr>
        <tr><td>Blood Pressure</td><td class="telemetry-val">${pt.vitals.bp} mmHg</td><td>MAP: ${pt.vitals.map} ${pt.vitals.mapUnit} (${pt.vitals.mapStatus})</td></tr>
        <tr><td>Respiratory Rate</td><td class="telemetry-val">${pt.vitals.rr} ${pt.vitals.rrUnit}</td><td>${pt.vitals.rrStatus}</td></tr>
        <tr><td>Oxygen Saturation (SpO2)</td><td class="telemetry-val">${pt.vitals.spo2}${pt.vitals.spo2Unit}</td><td>${pt.vitals.spo2Status}</td></tr>
        <tr><td>Body Temperature</td><td class="telemetry-val">${pt.vitals.temp}${pt.vitals.tempUnit}</td><td>${pt.vitals.tempStatus}</td></tr>
      `;
    }

    // Labs Panel
    const labsBody = document.getElementById('patient-labs-body');
    if (labsBody) {
      labsBody.innerHTML = `
        <tr><td>Serum Lactate</td><td class="telemetry-val">${pt.labs.lactate.val} ${pt.labs.lactate.unit}</td><td><span class="badge badge-critical">${pt.labs.lactate.flag}</span> (Ref: ${pt.labs.lactate.normal})</td></tr>
        <tr><td>White Blood Cells (WBC)</td><td class="telemetry-val">${pt.labs.wbc.val} ${pt.labs.wbc.unit}</td><td><span class="badge badge-elevated">${pt.labs.wbc.flag}</span> (Ref: ${pt.labs.wbc.normal})</td></tr>
        <tr><td>Serum Creatinine</td><td class="telemetry-val">${pt.labs.creatinine.val} ${pt.labs.creatinine.unit}</td><td><span class="badge badge-elevated">${pt.labs.creatinine.flag}</span> (Ref: ${pt.labs.creatinine.normal})</td></tr>
        <tr><td>Platelets</td><td class="telemetry-val">${pt.labs.platelets.val} ${pt.labs.platelets.unit}</td><td><span class="badge badge-elevated">${pt.labs.platelets.flag}</span> (Ref: ${pt.labs.platelets.normal})</td></tr>
        <tr><td>C-Reactive Protein (CRP)</td><td class="telemetry-val">${pt.labs.crp.val} ${pt.labs.crp.unit}</td><td><span class="badge badge-critical">${pt.labs.crp.flag}</span> (Ref: ${pt.labs.crp.normal})</td></tr>
      `;
    }

    // Explainable AI Attribution List
    const xaiList = document.getElementById('xai-attribution-list');
    if (xaiList) {
      xaiList.innerHTML = '';
      pt.attributions.forEach(item => {
        const isElevate = item.direction === 'elevates';
        const pctWidth = Math.min(100, Math.abs(item.impact) * 220);
        const el = document.createElement('div');
        el.className = 'xai-item';
        el.innerHTML = `
          <div class="xai-header">
            <span class="xai-feature">${item.feature} (${item.value})</span>
            <span class="xai-impact ${isElevate ? 'impact-elevate' : 'impact-protect'}">
              ${isElevate ? '+' : ''}${Math.round(item.impact * 100)}% Risk Impact
            </span>
          </div>
          <div class="xai-bar-track">
            <div class="xai-bar-fill" style="width: ${pctWidth}%; background: ${isElevate ? '#ef4444' : '#10b981'};"></div>
          </div>
          <div class="xai-desc">${item.explanation}</div>
        `;
        xaiList.appendChild(el);
      });
    }

    // Knowledge Graph
    knowledgeGraph.setGraph(pt.graphNodes, pt.graphEdges);
  }

  function handleNodeSelected(node) {
    const detailBox = document.getElementById('kg-node-details');
    if (!detailBox) return;
    detailBox.innerHTML = `
      <div style="font-weight: 700; color: #ffffff; margin-bottom: 4px;">${node.label}</div>
      <div style="font-size: 11px; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">Category: ${node.group}</div>
      <div style="font-size: 12px; color: #cbd5e1;">Connected to active clinical risk pathways for Patient Digital Twin.</div>
    `;
  }

  // 4. Hospital Digital Twin Operational Overview
  function initHospitalOverview() {
    const unitsContainer = document.getElementById('hospital-units-list');
    if (!unitsContainer) return;

    unitsContainer.innerHTML = '';
    CAREGRAPH_DATA.hospital.units.forEach(unit => {
      const occPct = Math.round((unit.occupiedBeds / unit.totalBeds) * 100);
      const isCritical = occPct >= 85;
      const barColor = isCritical ? '#ef4444' : occPct >= 75 ? '#f59e0b' : '#10b981';

      const card = document.createElement('div');
      card.className = 'unit-card';
      card.innerHTML = `
        <div class="unit-header">
          <span class="unit-name">${unit.name}</span>
          <span class="badge ${isCritical ? 'badge-critical' : 'badge-stable'}">${unit.status} (${occPct}%)</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${occPct}%; background: ${barColor};"></div>
        </div>
        <div class="unit-meta">
          <span>Beds: <b>${unit.occupiedBeds} / ${unit.totalBeds}</b></span>
          <span>Nurses: <b>${unit.staffedNurses}</b> (Ratio ${unit.nurseRatio})</span>
          <span>Ventilators: <b>${unit.ventilatorsInUse} / ${unit.ventilatorsTotal}</b></span>
        </div>
      `;
      unitsContainer.appendChild(card);
    });
  }

  // 5. Counterfactual Simulator Controls
  function initCounterfactualControls() {
    const sliderArrivals = document.getElementById('slider-arrivals');
    const labelArrivals = document.getElementById('val-arrivals');
    const sliderCapacity = document.getElementById('slider-capacity');
    const labelCapacity = document.getElementById('val-capacity');
    const checkElectives = document.getElementById('check-electives');

    function updateSimulation() {
      state.simulationParams.additionalEdArrivals = parseInt(sliderArrivals.value, 10);
      state.simulationParams.icuCapacityDeltaPct = parseInt(sliderCapacity.value, 10);
      state.simulationParams.rescheduleElectives = checkElectives.checked;

      labelArrivals.textContent = `+${state.simulationParams.additionalEdArrivals} Patients`;
      labelCapacity.textContent = `${state.simulationParams.icuCapacityDeltaPct >= 0 ? '+' : ''}${state.simulationParams.icuCapacityDeltaPct}%`;

      const result = simulator.runSimulation(state.simulationParams);
      renderSimulationResults(result);
    }

    if (sliderArrivals) sliderArrivals.addEventListener('input', updateSimulation);
    if (sliderCapacity) sliderCapacity.addEventListener('input', updateSimulation);
    if (checkElectives) checkElectives.addEventListener('change', updateSimulation);

    // Preset buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = btn.getAttribute('data-preset');
        if (preset === 'ed-surge') {
          sliderArrivals.value = 10;
          sliderCapacity.value = 0;
          checkElectives.checked = false;
        } else if (preset === 'icu-drop') {
          sliderArrivals.value = 0;
          sliderCapacity.value = -15;
          checkElectives.checked = false;
        } else if (preset === 'combined') {
          sliderArrivals.value = 12;
          sliderCapacity.value = -15;
          checkElectives.checked = false;
        } else if (preset === 'reschedule') {
          sliderArrivals.value = 8;
          sliderCapacity.value = -10;
          checkElectives.checked = true;
        }
        updateSimulation();
      });
    });

    // Initial run
    updateSimulation();
  }

  function renderSimulationResults(res) {
    const bottleneckEl = document.getElementById('sim-bottleneck-badge');
    const deficitEl = document.getElementById('sim-deficit-val');
    const peakEl = document.getElementById('sim-peak-val');
    const summaryEl = document.getElementById('sim-summary-text');

    if (res.bottleneckDetected) {
      if (bottleneckEl) {
        bottleneckEl.textContent = `BOTTLENECK DETECTED AT T+${res.bottleneckHour}h`;
        bottleneckEl.className = 'badge badge-critical';
      }
      if (deficitEl) deficitEl.textContent = `${res.bedDeficit} Beds`;
    } else {
      if (bottleneckEl) {
        bottleneckEl.textContent = 'NO CRITICAL BOTTLENECK';
        bottleneckEl.className = 'badge badge-stable';
      }
      if (deficitEl) deficitEl.textContent = '0 Beds';
    }

    if (peakEl) peakEl.textContent = `${res.peakOcc} / ${res.effectiveCap}`;

    if (summaryEl) {
      summaryEl.textContent = res.bottleneckDetected
        ? `Simulated demand exceeds operational limit at T+${res.bottleneckHour}h. ${res.bedDeficit} patients face diversion or delayed critical resuscitation without proactive reallocation.`
        : `Capacity buffers remain adequate across the 24-hour simulation horizon. Operational margin maintained.`;
    }
  }

  // 6. Constrained Resource Optimizer
  function initOptimizerControls() {
    const btnSolve = document.getElementById('btn-run-optimizer');
    if (btnSolve) {
      btnSolve.addEventListener('click', runOptimizationSolver);
    }
    // Run once on load
    runOptimizationSolver();
  }

  function runOptimizationSolver() {
    const plan = optimizer.solve(state.optimizerParams);
    renderOptimizationPlan(plan);
  }

  function renderOptimizationPlan(plan) {
    const list = document.getElementById('optimizer-actions-list');
    const statRecovered = document.getElementById('opt-recovered-beds');
    const statRisk = document.getElementById('opt-risk-reduction');
    const constraintsList = document.getElementById('opt-constraints-list');

    if (statRecovered) statRecovered.textContent = `+${plan.recoveredBeds} Beds`;
    if (statRisk) statRisk.textContent = `${plan.riskMitigationPct}%`;

    if (constraintsList) {
      constraintsList.innerHTML = plan.constraintsHonored
        .map(c => `<li><span style="color: #10b981;">✓</span> ${c}</li>`)
        .join('');
    }

    if (list) {
      list.innerHTML = '';
      plan.actions.forEach(action => {
        const card = document.createElement('div');
        card.className = 'action-card';
        card.innerHTML = `
          <div class="action-header">
            <span class="badge ${action.priorityClass}">${action.priority}</span>
            <span style="font-size: 11px; color: #94a3b8; font-family: var(--font-mono);">${action.id} • ${action.category}</span>
          </div>
          <div class="action-title">${action.title}</div>
          <div class="action-detail">${action.detail}</div>
          <div class="action-impact-box">
            <span>⚡ Impact:</span>
            <b>${action.impact}</b>
          </div>
          <div class="action-constraints">Safety: ${action.constraints.join(' • ')}</div>
        `;
        list.appendChild(card);
      });
    }
  }

  // 7. Judge Interactive Walkthrough Mode (Page 3 & Page 6 from PDF)
  const judgeSteps = [
    {
      step: 1,
      targetView: 'trajectory',
      judgeQ: "Which patient needs attention?",
      systemA: "Patient B (Eleanor Vance) shows an elevated predicted deterioration trajectory. While current NEWS2 is 9, our temporal AI model forecasts acute decompensation reaching 91% risk within 12-24 hours.",
      highlight: "Notice the widening 90% conformal prediction confidence interval band reflecting uncertainty."
    },
    {
      step: 2,
      targetView: 'xai',
      judgeQ: "Why is Patient B deteriorating?",
      systemA: "Explainable AI reveals that acute Serum Lactate elevation (+0.32 SHAP impact) and refractory hypoxemia (+0.26 SHAP impact) are the dominant drivers. In the Clinical Knowledge Graph, severe urosepsis is escalating into Stage 2 AKI and impending septic shock.",
      highlight: "Model-derived signals are separated from observed clinical ground truth."
    },
    {
      step: 3,
      targetView: 'overview',
      judgeQ: "How does this affect the hospital operations?",
      systemA: "The Hospital Digital Twin indicates ICU bed occupancy is already at 87.5% (21/24 beds). With Eleanor needing an ICU transfer within 4 hours, available buffer drops to 2 beds.",
      highlight: "Connects micro patient-level clinical trajectories with macro hospital capacity."
    },
    {
      step: 4,
      targetView: 'simulator',
      judgeQ: "What if 10 emergency patients arrive and ICU capacity falls by 15%?",
      systemA: "We simulate this exact counterfactual shock. The engine recalculates queue dynamics and predicts a CRITICAL BOTTLENECK at T+4.5h, producing a deficit of 5 critical beds.",
      highlight: "Real-time what-if simulation transforms passive alerts into active scenario exploration."
    },
    {
      step: 5,
      targetView: 'optimizer',
      judgeQ: "What should the hospital do?",
      systemA: "The Resource Optimizer solves a multi-objective mixed-integer program: safely step-down Arthur Pendelton (Patient A) who has stabilized post-CABG, call in 2 on-call ICU float nurses to preserve the 1:2 ratio, and hold 3 elective post-op reservations. Mitigates 75.5% of projected risk while honoring clinical safety constraints.",
      highlight: "Complete Loop: Observe ➔ Predict ➔ Explain ➔ Simulate ➔ Optimize."
    }
  ];

  function initJudgeTour() {
    const btnOpen = document.getElementById('btn-open-judge-tour');
    const modal = document.getElementById('judge-modal');
    const btnNext = document.getElementById('judge-btn-next');
    const btnPrev = document.getElementById('judge-btn-prev');
    const btnClose = document.getElementById('judge-btn-close');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        state.judgeStep = 1;
        modal.style.display = 'flex';
        renderJudgeStep();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (state.judgeStep < judgeSteps.length) {
          state.judgeStep++;
          renderJudgeStep();
        } else {
          modal.style.display = 'none';
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.judgeStep > 1) {
          state.judgeStep--;
          renderJudgeStep();
        }
      });
    }
  }

  function renderJudgeStep() {
    const cur = judgeSteps[state.judgeStep - 1];
    if (!cur) return;

    // Switch view to match step
    switchView(cur.targetView);

    // Update indicator pills
    document.querySelectorAll('.step-circle').forEach((el, idx) => {
      el.className = `step-circle ${idx + 1 === state.judgeStep ? 'active' : idx + 1 < state.judgeStep ? 'done' : ''}`;
    });

    const qEl = document.getElementById('judge-q-text');
    const aEl = document.getElementById('judge-a-text');
    const noteEl = document.getElementById('judge-note-text');
    const btnNext = document.getElementById('judge-btn-next');

    if (qEl) qEl.textContent = cur.judgeQ;
    if (aEl) aEl.textContent = cur.systemA;
    if (noteEl) noteEl.textContent = cur.highlight;

    if (btnNext) {
      btnNext.textContent = state.judgeStep === judgeSteps.length ? 'Finish Tour' : 'Next Step ▶';
    }
  }

  // 8. Subtle Real-Time Telemetry Jitter (Simulating Live Medical Feeds)
  function startLiveTelemetryHeartbeat() {
    setInterval(() => {
      if (!state.isLiveTelemetry) return;
      const ptB = CAREGRAPH_DATA.patients.find(p => p.id === 'PT-2026-B');
      if (ptB) {
        // Subtle physiologic variability
        ptB.vitals.hr = 117 + Math.floor(Math.random() * 3);
        ptB.vitals.spo2 = 89 + (Math.random() > 0.6 ? 1 : 0);
        if (state.selectedPatientId === 'PT-2026-B') {
          const hrEl = document.querySelector('#patient-vitals-body tr:first-child .telemetry-val');
          if (hrEl) hrEl.textContent = `${ptB.vitals.hr} bpm`;
        }
      }
    }, 4000);
  }
});
