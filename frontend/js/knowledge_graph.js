// Interactive Clinical Knowledge Graph Visualizer
// Connects: Patient -> Condition -> Lab -> Medication -> Risk factor -> Complication -> Resource

class ClinicalKnowledgeGraph {
  constructor(containerId, onNodeSelect) {
    this.container = document.getElementById(containerId);
    this.onNodeSelect = onNodeSelect || (() => {});
    this.canvas = null;
    this.ctx = null;
    this.nodes = [];
    this.edges = [];
    this.selectedNode = null;
    this.hoverNode = null;
    this.draggedNode = null;
    this.filterCategory = 'all';
    this.animationId = null;

    this.categoryColors = {
      patient: '#38bdf8',      // Cyan
      condition: '#ec4899',    // Rose Pink
      lab: '#eab308',          // Amber
      medication: '#a855f7',   // Purple
      risk_factor: '#f97316',  // Orange
      complication: '#ef4444', // Red
      resource: '#10b981'      // Emerald
    };

    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'kg-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.setupEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setGraph(nodes, edges) {
    // Clone nodes with initial physics velocities and radius
    const w = this.displayWidth || 700;
    const h = this.displayHeight || 450;

    this.nodes = nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = 130 + (i % 3) * 45;
      return {
        ...n,
        x: n.x || (w / 2 + Math.cos(angle) * radius),
        y: n.y || (h / 2 + Math.sin(angle) * radius),
        vx: 0,
        vy: 0,
        radius: n.group === 'patient' ? 26 : 20
      };
    });

    this.edges = edges.map(e => ({ ...e }));
    this.selectedNode = null;
    this.hoverNode = null;
    this.startSimulation();
  }

  resize() {
    if (!this.container || !this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(300, rect.width);
    const h = Math.max(300, rect.height || 420);

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    this.ctx.scale(dpr, dpr);
    this.displayWidth = w;
    this.displayHeight = h;

    this.draw();
  }

  startSimulation() {
    let ticks = 0;
    const maxTicks = 120; // Stabilize quickly

    const step = () => {
      if (ticks < maxTicks || this.draggedNode) {
        this.updatePhysics();
        ticks++;
      }
      this.draw();
      this.animationId = requestAnimationFrame(step);
    };

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(step);
  }

  updatePhysics() {
    const w = this.displayWidth;
    const h = this.displayHeight;
    const center = { x: w / 2, y: h / 2 };

    // Repulsion between nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 180) {
          const force = (180 - dist) / dist * 0.45;
          if (a !== this.draggedNode) {
            a.vx -= dx * force * 0.05;
            a.vy -= dy * force * 0.05;
          }
          if (b !== this.draggedNode) {
            b.vx += dx * force * 0.05;
            b.vy += dy * force * 0.05;
          }
        }
      }
    }

    // Spring forces along edges
    for (let edge of this.edges) {
      const src = this.nodes.find(n => n.id === edge.from);
      const tgt = this.nodes.find(n => n.id === edge.to);
      if (src && tgt) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.hypot(dx, dy) || 1;
        const targetDist = 110;
        const force = (dist - targetDist) * 0.03;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (src !== this.draggedNode) {
          src.vx += fx;
          src.vy += fy;
        }
        if (tgt !== this.draggedNode) {
          tgt.vx -= fx;
          tgt.vy -= fy;
        }
      }
    }

    // Gentle centering force & boundary containment
    for (let n of this.nodes) {
      if (n === this.draggedNode) continue;
      n.vx += (center.x - n.x) * 0.005;
      n.vy += (center.y - n.y) * 0.005;

      // Friction
      n.vx *= 0.85;
      n.vy *= 0.85;

      n.x += n.vx;
      n.y += n.vy;

      // Bound inside canvas
      n.x = Math.max(n.radius + 15, Math.min(w - n.radius - 15, n.x));
      n.y = Math.max(n.radius + 15, Math.min(h - n.radius - 15, n.y));
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    ctx.clearRect(0, 0, w, h);

    // Draw background subtle grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 20; x < w; x += 40) {
      for (let y = 20; y < h; y += 40) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // 1. Draw Edges
    for (let edge of this.edges) {
      const src = this.nodes.find(n => n.id === edge.from);
      const tgt = this.nodes.find(n => n.id === edge.to);
      if (!src || !tgt) continue;

      const isHighlighted = (this.hoverNode && (this.hoverNode.id === src.id || this.hoverNode.id === tgt.id)) ||
                            (this.selectedNode && (this.selectedNode.id === src.id || this.selectedNode.id === tgt.id));

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (isHighlighted) {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw edge label if highlighted
      if (isHighlighted && edge.label) {
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(edge.label, midX, midY - 6);
      }
    }

    // 2. Draw Nodes
    for (let n of this.nodes) {
      const color = this.categoryColors[n.group] || '#38bdf8';
      const isSelected = this.selectedNode && this.selectedNode.id === n.id;
      const isHover = this.hoverNode && this.hoverNode.id === n.id;

      // Glow halo
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius + (isSelected ? 10 : isHover ? 6 : 2), 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? `${color}44` : `${color}22`;
      ctx.fill();

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fill();
      ctx.stroke();

      // Inner category dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label below node
      ctx.font = isSelected ? 'bold 11px "Inter", sans-serif' : '10px "Inter", sans-serif';
      ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + n.radius + 14);

      // Node group badge
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = `${color}cc`;
      ctx.fillText(n.group.toUpperCase(), n.x, n.y + n.radius + 26);
    }
  }

  setupEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = this.nodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.radius + 5);
      if (hit) {
        this.draggedNode = hit;
        this.selectedNode = hit;
        this.onNodeSelect(hit);
        this.draw();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.draggedNode) {
        this.draggedNode.x = Math.max(30, Math.min(this.displayWidth - 30, x));
        this.draggedNode.y = Math.max(30, Math.min(this.displayHeight - 30, y));
        this.draw();
      } else {
        const hit = this.nodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.radius + 5);
        if (hit !== this.hoverNode) {
          this.hoverNode = hit;
          this.canvas.style.cursor = hit ? 'pointer' : 'default';
          this.draw();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggedNode = null;
    });
  }
}

window.ClinicalKnowledgeGraph = ClinicalKnowledgeGraph;
