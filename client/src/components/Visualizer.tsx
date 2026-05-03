import { useEffect, useRef } from "react";

const BARS = 26;

export default function Visualizer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const bars = useRef(
    Array.from({ length: BARS }, (_, i) => ({
      v: 0.1 + Math.random() * 0.4,
      t: 0.1 + Math.random() * 0.5,
      p: (i / BARS) * Math.PI * 3 + Math.random() * 2,
    }))
  );

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let tick = 0;

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

      const bw = W / BARS;
      const gap = Math.max(1, bw * 0.22);

      bars.current.forEach((b, i) => {
        b.t = 0.08 + 0.78 * Math.abs(Math.sin(tick * 0.022 + b.p));
        b.v += (b.t - b.v) * 0.07;

        const x = i * bw + gap / 2;
        const h = b.v * H;
        const y = H - h;
        const w = bw - gap;
        const hot = b.v > 0.52;

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

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return <canvas ref={ref} className="visualizer-canvas" />;
}
