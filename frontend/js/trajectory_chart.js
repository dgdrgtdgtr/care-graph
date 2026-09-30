// Trajectory Chart Renderer - Temporal Clinical Intelligence
// Plots observed trajectory + forecast horizon + conformal confidence bands

class TrajectoryChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.data = [];
    this.patient = null;
    this.hoverPoint = null;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'trajectory-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'chart-tooltip';
    this.tooltip.style.display = 'none';
    this.container.appendChild(this.tooltip);

    window.addEventListener('resize', () => this.resizeAndDraw());

    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverPoint = null;
      this.tooltip.style.display = 'none';
      this.draw();
    });

    this.resizeAndDraw();
  }

  setData(patient) {
    this.patient = patient;
    this.data = patient ? patient.trajectory : [];
    this.resizeAndDraw();
  }

  resizeAndDraw() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(300, rect.width);
    const height = Math.max(220, rect.height || 260);

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.ctx.scale(dpr, dpr);
    this.displayWidth = width;
    this.displayHeight = height;

    this.draw();
  }

  draw() {
    if (!this.ctx || !this.data || this.data.length === 0) return;

    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    ctx.clearRect(0, 0, w, h);

    const pad = { left: 45, right: 30, top: 25, bottom: 35 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    // Time domain: minHour to maxHour (e.g. -24 to 48)
    const minH = -24;
    const maxH = 48;
    const hourToX = (hour) => pad.left + ((hour - minH) / (maxH - minH)) * chartW;
    const riskToY = (risk) => pad.top + (1.0 - risk) * chartH;

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal risk grid lines (0%, 25%, 50%, 75%, 100%)
    for (let r = 0; r <= 1.0; r += 0.25) {
      const y = riskToY(r);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(r * 100) + '%', pad.left - 8, y + 3);
    }

    // Critical Threshold Band at 70% & 85%
    const yCrit = riskToY(0.85);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, yCrit);
    ctx.lineTo(w - pad.right, yCrit);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.font = '9px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('CRITICAL RISK (>85%)', w - pad.right, yCrit - 4);

    // Vertical Divider for T=0 (Current Time)
    const xNow = hourToX(0);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xNow, pad.top);
    ctx.lineTo(xNow, h - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shaded Past vs Future Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(pad.left, pad.top, xNow - pad.left, chartH);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.04)';
    ctx.fillRect(xNow, pad.top, w - pad.right - xNow, chartH);

    // Labels for Observed vs Forecast
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('◀ OBSERVED (Past 24h)', pad.left + 8, pad.top + 14);

    ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText('TEMPORAL AI FORECAST (+48h) ▶', w - pad.right - 8, pad.top + 14);

    // 1. Draw Confidence Interval Band (Only for Forecast points hour >= 0)
    const forecastPts = this.data.filter(p => p.hour >= 0);
    if (forecastPts.length > 0) {
      ctx.beginPath();
      // Upper band
      for (let i = 0; i < forecastPts.length; i++) {
        const p = forecastPts[i];
        const x = hourToX(p.hour);
        const yUpper = riskToY(p.ciUpper);
        if (i === 0) ctx.moveTo(x, yUpper);
        else ctx.lineTo(x, yUpper);
      }
      // Lower band back
      for (let i = forecastPts.length - 1; i >= 0; i--) {
        const p = forecastPts[i];
        const x = hourToX(p.hour);
        const yLower = riskToY(p.ciLower);
        ctx.lineTo(x, yLower);
      }
      ctx.closePath();

      const gradCi = ctx.createLinearGradient(xNow, 0, w - pad.right, 0);
      gradCi.addColorStop(0, 'rgba(168, 85, 247, 0.20)');
      gradCi.addColorStop(1, 'rgba(239, 68, 68, 0.25)');
      ctx.fillStyle = gradCi;
      ctx.fill();
    }

    // 2. Draw Trajectory Line (Observed Segment: Cyan, Forecast Segment: Neon Violet/Red)
    // Observed
    const obsPts = this.data.filter(p => p.hour <= 0);
    if (obsPts.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < obsPts.length; i++) {
        const x = hourToX(obsPts[i].hour);
        const y = riskToY(obsPts[i].risk);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Forecast
    if (forecastPts.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      for (let i = 0; i < forecastPts.length; i++) {
        const x = hourToX(forecastPts[i].hour);
        const y = riskToY(forecastPts[i].risk);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Points & Markers
    for (let p of this.data) {
      const x = hourToX(p.hour);
      const y = riskToY(p.risk);
      const isPast = p.hour <= 0;

      // Glow effect
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isPast ? 'rgba(56, 189, 248, 0.25)' : 'rgba(192, 132, 252, 0.35)';
      ctx.fill();

      // Point circle
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isPast ? '#38bdf8' : '#e879f9';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // X-axis label
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, x, h - pad.bottom + 16);
    }

    // Hover Highlight
    if (this.hoverPoint) {
      const hp = this.hoverPoint;
      const x = hourToX(hp.hour);
      const y = riskToY(hp.risk);

      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillStyle = hp.hour <= 0 ? '#38bdf8' : '#f43f5e';
      ctx.fill();
      ctx.stroke();
    }
  }

  handleMouseMove(e) {
    if (!this.data || this.data.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pad = { left: 45, right: 30, top: 25, bottom: 35 };
    const chartW = this.displayWidth - pad.left - pad.right;
    const minH = -24;
    const maxH = 48;
    const hourToX = (hour) => pad.left + ((hour - minH) / (maxH - minH)) * chartW;
    const riskToY = (risk) => pad.top + (1.0 - risk) * (this.displayHeight - pad.top - pad.bottom);

    // Find closest point
    let closest = null;
    let minDist = 40;

    for (let p of this.data) {
      const px = hourToX(p.hour);
      const py = riskToY(p.risk);
      const dist = Math.hypot(mouseX - px, mouseY - py);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }

    this.hoverPoint = closest;
    this.draw();

    if (closest) {
      const px = hourToX(closest.hour);
      const py = riskToY(closest.risk);
      const isPast = closest.hour <= 0;
      const typeLabel = isPast ? 'OBSERVED VITAL HISTORY' : 'AI TEMPORAL PROJECTION';
      const ciText = !isPast ? `<div class="tooltip-sub">90% Conformal Band: <b>${Math.round(closest.ciLower * 100)}% - ${Math.round(closest.ciUpper * 100)}%</b></div>` : '';

      this.tooltip.innerHTML = `
        <div class="tooltip-badge ${isPast ? 'badge-obs' : 'badge-pred'}">${typeLabel}</div>
        <div class="tooltip-title">${closest.label} (${closest.hour >= 0 ? '+' + closest.hour : closest.hour}h)</div>
        <div class="tooltip-metric">Deterioration Risk: <b>${Math.round(closest.risk * 100)}%</b></div>
        <div class="tooltip-sub">Composite NEWS2: <b>${closest.news2} / 20</b></div>
        ${ciText}
      `;
      this.tooltip.style.display = 'block';

      // Position tooltip safely inside container
      const tooltipW = 200;
      let leftPos = px + 12;
      if (leftPos + tooltipW > this.displayWidth) {
        leftPos = px - tooltipW - 12;
      }
      this.tooltip.style.left = leftPos + 'px';
      this.tooltip.style.top = Math.max(10, py - 30) + 'px';
    } else {
      this.tooltip.style.display = 'none';
    }
  }
}

window.TrajectoryChart = TrajectoryChart;
