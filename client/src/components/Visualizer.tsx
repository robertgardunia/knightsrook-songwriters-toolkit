import { useEffect, useRef } from "react";

const BARS = 26;

export type VizType = 'bars' | 'scope' | 'vu' | 'dots' | 'radial';

interface Props {
  type: VizType;
}

export default function Visualizer({ type }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const typeRef = useRef(type);
  const bars = useRef(
    Array.from({ length: BARS }, (_, i) => ({
      v: 0.1 + Math.random() * 0.4,
      t: 0.1 + Math.random() * 0.5,
      p: (i / BARS) * Math.PI * 3 + Math.random() * 2,
    }))
  );

  useEffect(() => { typeRef.current = type; }, [type]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let tick = 0;
    const b = bars.current;

    const draw = () => {
      tick++;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const dpr = devicePixelRatio || 1;

      if (canvas.width !== Math.round(W * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, W, H);

      b.forEach((bar) => {
        bar.t = 0.08 + 0.78 * Math.abs(Math.sin(tick * 0.022 + bar.p));
        bar.v += (bar.t - bar.v) * 0.07;
      });

      switch (typeRef.current) {
        case 'bars':   drawBars(ctx, W, H); break;
        case 'scope':  drawScope(ctx, W, H, tick); break;
        case 'vu':     drawVU(ctx, W, H); break;
        case 'dots':   drawDots(ctx, W, H); break;
        case 'radial': drawRadial(ctx, W, H); break;
      }

      raf.current = requestAnimationFrame(draw);
    };

    function drawBars(ctx: CanvasRenderingContext2D, W: number, H: number) {
      const bw = W / BARS;
      const gap = Math.max(1, bw * 0.22);
      b.forEach((bar, i) => {
        if (i < 2 || i >= BARS - 2) return;
        const x = i * bw + gap / 2;
        const h = bar.v * H;
        const y = H - h;
        const w = bw - gap;
        const hot = bar.v > 0.52;
        const g = ctx.createLinearGradient(0, y, 0, H);
        g.addColorStop(0, hot ? "rgba(0,212,200,.95)" : "rgba(245,196,48,.9)");
        g.addColorStop(1, "rgba(160,80,20,.12)");
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = hot ? "rgba(0,212,200,.65)" : "rgba(240,168,48,.55)";
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      });
    }

    function drawScope(ctx: CanvasRenderingContext2D, W: number, H: number, tick: number) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(0,212,200,.7)';
      ctx.strokeStyle = 'rgba(0,212,200,.9)';
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const t = x / W;
        const bi = Math.min(Math.floor(t * (BARS - 4)) + 2, BARS - 3);
        const amp = b[bi].v;
        const y = H / 2
          + Math.sin(t * Math.PI * 8 + tick * 0.05) * H * amp * 0.35
          + Math.sin(t * Math.PI * 3 + tick * 0.02) * H * 0.07;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawVU(ctx: CanvasRenderingContext2D, W: number, H: number) {
      const pad = 8;
      const rowH = (H - pad * 3) / 2;
      const segs = 22;
      const segW = (W - pad * 2) / segs;
      const segGap = segW * 0.12;

      for (let ch = 0; ch < 2; ch++) {
        const y = pad + ch * (rowH + pad);
        const half = Math.floor(BARS / 2);
        const [start, end] = ch === 0 ? [2, half] : [half, BARS - 2];
        const level = b.slice(start, end).reduce((s, x) => s + x.v, 0) / (end - start);

        for (let s = 0; s < segs; s++) {
          const segLevel = (s + 1) / segs;
          const active = level >= segLevel;
          const isRed = segLevel > 0.85;
          const isYellow = segLevel > 0.62;
          const color = active
            ? (isRed ? 'rgba(224,48,64,.95)' : isYellow ? 'rgba(245,196,48,.9)' : 'rgba(0,212,200,.9)')
            : (isRed ? 'rgba(224,48,64,.1)' : isYellow ? 'rgba(245,196,48,.07)' : 'rgba(0,212,200,.05)');
          ctx.save();
          if (active) { ctx.shadowBlur = 7; ctx.shadowColor = color; }
          ctx.fillStyle = color;
          ctx.fillRect(pad + s * segW, y, segW - segGap, rowH);
          ctx.restore();
        }
      }
    }

    function drawDots(ctx: CanvasRenderingContext2D, W: number, H: number) {
      const cols = 20, rows = 8;
      const dw = W / cols, dh = H / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bi = Math.min(Math.floor(c / cols * (BARS - 4)) + 2, BARS - 3);
          const active = b[bi].v > 1 - (r + 1) / rows;
          const hot = active && b[bi].v > 0.6;
          ctx.save();
          if (active) { ctx.shadowBlur = 8; ctx.shadowColor = hot ? 'rgba(0,212,200,.8)' : 'rgba(240,168,48,.6)'; }
          ctx.fillStyle = active ? (hot ? 'rgba(0,212,200,.95)' : 'rgba(245,196,48,.9)') : 'rgba(255,255,255,.04)';
          ctx.beginPath();
          ctx.arc(c * dw + dw / 2, r * dh + dh / 2, dw * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    function drawRadial(ctx: CanvasRenderingContext2D, W: number, H: number) {
      const cx = W / 2, cy = H * 1.1;
      const minR = H * 0.12, maxR = H * 0.95;
      const usable = BARS - 4;
      const lw = Math.max(2, (W / usable) * 0.55);

      for (let i = 2; i < BARS - 2; i++) {
        const t = (i - 2) / (usable - 1);
        const angle = Math.PI + t * Math.PI;
        const len = b[i].v * (maxR - minR);
        const hot = b[i].v > 0.52;
        ctx.save();
        ctx.strokeStyle = hot ? 'rgba(0,212,200,.9)' : 'rgba(245,196,48,.85)';
        ctx.lineWidth = lw;
        ctx.shadowBlur = 12;
        ctx.shadowColor = hot ? 'rgba(0,212,200,.6)' : 'rgba(240,168,48,.5)';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * minR, cy + Math.sin(angle) * minR);
        ctx.lineTo(cx + Math.cos(angle) * (minR + len), cy + Math.sin(angle) * (minR + len));
        ctx.stroke();
        ctx.restore();
      }
    }

    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return <canvas ref={ref} className="visualizer-canvas" />;
}
