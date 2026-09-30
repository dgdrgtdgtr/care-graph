// Counterfactual Hospital Simulator Engine & Chart
// Evaluates "What-If" scenarios: Surge arrivals, ICU capacity shocks, elective rescheduling

class CounterfactualSimulator {
  constructor(chartContainerId) {
    this.chartContainer = document.getElementById(chartContainerId);
    this.canvas = null;
    this.ctx = null;
    this.simulationResult = null;
    this.initChart();
  }

  initChart() {
    if (!this.chartContainer) return;
    this.chartContainer.innerHTML = '';
    this.chartContainer.style.position = 'relative';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'simulation-canvas';
    this.chartContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    window.addEventListener('resize', () => this.draw());
  }

  runSimulation({ additionalEdArrivals, icuCapacityDeltaPct, rescheduleElectives, horizonHours = 24 }) {
    const baseIcuCap = 24;
    const effectiveCap = Math.max(8, Math.round(baseIcuCap * (1.0 + (icuCapacityDeltaPct / 100.0))));
    const initialOcc = 21;
    let currentOcc = initialOcc;
    let currentQueue = 14;

    const hourly = [];
    let bottleneckHour = null;
    let peakOcc = initialOcc;
    let divertedAccum = 0;

    for (let h = 0; h <= horizonHours; h++) {
      if (h === 0) {
        hourly.push({
          hour: 0,
          baseOcc: initialOcc,
          simOcc: initialOcc,
          capLimit: effectiveCap,
          queue: currentQueue,
          nurseStress: 0.78
        });
        continue;
      }

      // Surge arrivals bell-shaped in early hours
      let surgeInflow = 0;
      if (additionalEdArrivals > 0 && h <= 10) {
        const weight = Math.exp(-0.5 * Math.pow((h - 3.5) / 1.8, 2));
        surgeInflow = Math.max(0, Math.round((additionalEdArrivals / 3.5) * weight));
      }

      // 25% of acute surge requires ICU admission around hours 3-6
      const icuSurgeAdmit = (surgeInflow >= 2 && h >= 2) ? 1 : 0;
      // Internal ward deterioration (e.g. Patient B septic shock around T+4h)
      const internalDeteriorations = (h === 3 || h === 6 || h === 14) ? 1 : 0;
      // Scheduled discharges
      let discharges = (h === 5 || h === 12 || h === 20) ? 1 : 0;
      if (rescheduleElectives && (h === 2 || h === 8)) {
        discharges += 1; // Frees up elective post-op reservations
      }

      // Baseline scenario (without what-if shock)
      const baseOcc = Math.min(baseIcuCap, Math.max(16, initialOcc + ((h >= 4 && h <= 10) ? 1 : 0) - (h >= 14 ? 1 : 0)));

      // Simulated candidate occupancy
      const net = (icuSurgeAdmit + internalDeteriorations) - discharges;
      const candidateOcc = currentOcc + net;

      if (candidateOcc > effectiveCap) {
        divertedAccum += (candidateOcc - effectiveCap);
        currentOcc = effectiveCap;
        if (bottleneckHour === null) {
          bottleneckHour = Number((h - 0.5).toFixed(1));
        }
      } else {
        currentOcc = Math.max(10, candidateOcc);
      }

      peakOcc = Math.max(peakOcc, candidateOcc);
      currentQueue = Math.max(5, currentQueue + surgeInflow - 2);

      const stress = Math.min(1.0, (currentOcc / (12 * 2.0)) * 0.95 + (candidateOcc > effectiveCap ? 0.20 : 0.0));

      hourly.push({
        hour: h,
        baseOcc: baseOcc,
        simOcc: candidateOcc,
        capLimit: effectiveCap,
        queue: currentQueue,
        nurseStress: Number(stress.toFixed(2))
      });
    }

    const bottleneckDetected = peakOcc > effectiveCap;
    const bedDeficit = Math.max(0, peakOcc - effectiveCap);

    this.simulationResult = {
      effectiveCap,
      peakOcc,
      bottleneckDetected,
      bottleneckHour,
      bedDeficit,
      hourly,
      additionalEdArrivals,
      icuCapacityDeltaPct,
      rescheduleElectives
    };

    this.draw();
    return this.simulationResult;
  }

  draw() {
    if (!this.ctx || !this.chartContainer || !this.simulationResult) return;

    const rect = this.chartContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(300, rect.width);
    const h = Math.max(220, rect.height || 260);

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    const ctx = this.ctx;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const pad = { left: 45, right: 25, top: 25, bottom: 35 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const data = this.simulationResult.hourly;
    const maxHour = data[data.length - 1].hour;
    const maxBeds = 32;

    const xPos = (hour) => pad.left + (hour / maxHour) * chartW;
    const yPos = (beds) => pad.top + (1.0 - (beds / maxBeds)) * chartH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let b = 0; b <= maxBeds; b += 8) {
      const y = yPos(b);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${b} beds`, pad.left - 6, y + 3);
    }

    // Capacity Ceiling Line (Red/Orange Dash)
    const capY = yPos(this.simulationResult.effectiveCap);
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad.left, capY);
    ctx.lineTo(w - pad.right, capY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`ICU CAPACITY CEILING: ${this.simulationResult.effectiveCap} BEDS`, w - pad.right, capY - 5);

    // 1. Draw Baseline Curve (Muted Slate / Blue)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = xPos(data[i].hour);
      const y = yPos(data[i].baseOcc);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Simulated What-If Curve (Glowing Amber / Crimson)
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = xPos(data[i].hour);
      const y = yPos(data[i].simOcc);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const simGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    simGrad.addColorStop(0, '#f43f5e');
    simGrad.addColorStop(1, '#f59e0b');
    ctx.strokeStyle = simGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill under simulated curve
    ctx.lineTo(xPos(maxHour), h - pad.bottom);
    ctx.lineTo(xPos(0), h - pad.bottom);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    fillGrad.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
    fillGrad.addColorStop(1, 'rgba(245, 158, 11, 0.02)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // 3. Mark Bottleneck Point
    if (this.simulationResult.bottleneckDetected && this.simulationResult.bottleneckHour !== null) {
      const bh = this.simulationResult.bottleneckHour;
      const bx = xPos(bh);
      const by = capY;

      // Vertical alert line
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(bx, pad.top);
      ctx.lineTo(bx, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Star / beacon icon
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Badge
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`⚡ BOTTLENECK AT T+${bh}h`, bx + 10, by - 12);
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(`Deficit: ${this.simulationResult.bedDeficit} Beds`, bx + 10, by + 2);
    }

    // X-Axis labels
    for (let d of data) {
      if (d.hour % 6 === 0) {
        const x = xPos(d.hour);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`T+${d.hour}h`, x, h - pad.bottom + 16);
      }
    }
  }
}

window.CounterfactualSimulator = CounterfactualSimulator;
