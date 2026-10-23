import { useEffect, useRef } from 'react';

// Hero background: a dot grid that lights up around the pointer, with
// "packets" sliding along random grid lines. Pauses when off screen and
// renders a single static frame for prefers-reduced-motion.

const GAP = 34;
const RADIUS = 170;

interface Packet {
  horizontal: boolean;
  line: number;
  pos: number;
  speed: number;
  color: string;
}

export default function SignalField() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let packets: Packet[] = [];

    const spawn = (): Packet => {
      const horizontal = Math.random() > 0.5;
      const lines = Math.floor((horizontal ? h : w) / GAP);
      return {
        horizontal,
        line: (1 + Math.floor(Math.random() * Math.max(lines - 1, 1))) * GAP,
        pos: -60,
        speed: 1.2 + Math.random() * 2.4,
        color: Math.random() > 0.3 ? '198,244,50' : '90,209,255',
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      packets = Array.from({ length: Math.max(4, Math.round(w / 220)) }, spawn);
      packets.forEach((p) => (p.pos = Math.random() * (p.horizontal ? w : h)));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;

      for (let x = GAP / 2; x < w; x += GAP) {
        for (let y = GAP / 2; y < h; y += GAP) {
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          const t = Math.max(0, 1 - d / RADIUS);
          // Dots near the pointer are pushed outward slightly and glow.
          const push = t * 10;
          const dx = d ? ((x - pointer.x) / d) * push : 0;
          const dy = d ? ((y - pointer.y) / d) * push : 0;
          ctx.fillStyle = t > 0 ? `rgba(198,244,50,${0.15 + t * 0.85})` : 'rgba(142,151,171,0.16)';
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, 1.1 + t * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const p of packets) {
        const len = 70;
        const [x1, y1, x2, y2] = p.horizontal
          ? [p.pos - len, p.line - GAP / 2, p.pos, p.line - GAP / 2]
          : [p.line - GAP / 2, p.pos - len, p.line - GAP / 2, p.pos];
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, `rgba(${p.color},0)`);
        g.addColorStop(1, `rgba(${p.color},0.9)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (!reduced) {
          p.pos += p.speed;
          if (p.pos > (p.horizontal ? w : h) + len) Object.assign(p, spawn());
        }
      }
    };

    const loop = () => {
      draw();
      if (visible) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.tx = e.clientX - r.left;
      pointer.ty = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.tx = pointer.ty = -9999;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    if (reduced) {
      draw();
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) loop();
    });
    io.observe(el);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}
