import { useEffect, useRef } from 'react';

const RES = 160;

function pixelCircle(ctx, cx, cy, r) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function lcg(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

export function Moon({ progress, brightness }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = RES;
    canvas.height = RES;
    ctx.imageSmoothingEnabled = false;

    const cx = RES / 2;
    const cy = RES / 2;
    const R = RES / 2 - 3;
    const R2 = R * R;

    ctx.clearRect(0, 0, RES, RES);

    // Base disc
    ctx.fillStyle = '#ddd0b8';
    pixelCircle(ctx, cx, cy, R);

    // Light source highlight (upper-left)
    ctx.fillStyle = 'rgba(245, 238, 218, 0.32)';
    pixelCircle(ctx, cx - 14, cy - 18, R * 0.48);

    // Maria — overlapping circles for organic shapes
    const maria = [
      { c: 'rgba(155,138,110,0.28)', s: [[cx-22, cy-8, 14], [cx-28, cy+2, 11], [cx-18, cy+10, 12], [cx-15, cy-3, 16]] },
      { c: 'rgba(148,132,105,0.25)', s: [[cx-8, cy-28, 11], [cx-14, cy-24, 9], [cx-4, cy-22, 10]] },
      { c: 'rgba(150,134,108,0.22)', s: [[cx+10, cy-20, 9], [cx+6, cy-16, 8]] },
      { c: 'rgba(145,128,102,0.26)', s: [[cx+16, cy-4, 11], [cx+20, cy+4, 9], [cx+12, cy+2, 10]] },
      { c: 'rgba(152,135,108,0.22)', s: [[cx+20, cy+18, 9], [cx+14, cy+22, 8]] },
      { c: 'rgba(148,132,106,0.20)', s: [[cx-6, cy+24, 12], [cx+4, cy+28, 9], [cx-12, cy+22, 8]] },
      { c: 'rgba(142,126,100,0.24)', s: [[cx-24, cy+18, 8], [cx-20, cy+22, 7]] },
    ];
    maria.forEach(({ c, s }) => { ctx.fillStyle = c; s.forEach(([x, y, r]) => pixelCircle(ctx, x, y, r)); });

    // Crater highlights
    const craters = [
      [cx-28, cy+28, 3], [cx+24, cy+32, 2], [cx+32, cy-12, 3],
      [cx-12, cy+36, 2], [cx+8, cy-34, 2], [cx-32, cy-8, 2],
      [cx+28, cy+12, 2], [cx-6, cy+14, 2],
    ];
    craters.forEach(([x, y, r]) => {
      ctx.fillStyle = 'rgba(255,248,230,0.18)';
      pixelCircle(ctx, x, y, r);
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.fillRect(x, y - 1, 1, 1);
    });

    // Combined per-pixel pass: texture + limb darkening + shadow + edge effects
    const p = Number.isFinite(progress) ? progress : 0;
    const shadowOff = (86 - p * 172) / 100 * R * 2;
    const shadowSX = 0.62 + Math.abs(p - 0.5) * 1.35;
    const shadowRX = R * shadowSX * 1.15;
    const shadowRY = R * 1.15;
    const rand = lcg(42);

    for (let py = 0; py < RES; py++) {
      for (let px = 0; px < RES; px++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > R2) { rand(); continue; }

        const v = rand();

        // Surface texture
        if (v < 0.055) {
          ctx.fillStyle = 'rgba(120,100,75,0.10)';
          ctx.fillRect(px, py, 1, 1);
        } else if (v < 0.08) {
          ctx.fillStyle = 'rgba(255,248,230,0.06)';
          ctx.fillRect(px, py, 1, 1);
        }

        // Limb darkening
        const dist = Math.sqrt(dist2);
        const lf = dist / R;
        const dark = lf * lf * lf * 0.16;
        if (dark > 0.01) {
          ctx.fillStyle = `rgba(50,38,25,${dark})`;
          ctx.fillRect(px, py, 1, 1);
        }

        // Phase shadow + edge effects
        const sx = (px - (cx + shadowOff)) / shadowRX;
        const sy = dy / shadowRY;
        const inShadow = sx * sx + sy * sy <= 1;
        const isEdge = dist >= R - 4;

        if (inShadow) {
          ctx.fillStyle = 'rgba(8, 10, 32, 0.90)';
          ctx.fillRect(px, py, 1, 1);
          if (isEdge) {
            ctx.fillStyle = 'rgba(110, 140, 210, 0.10)';
            ctx.fillRect(px, py, 1, 1);
          }
        } else if (isEdge && dist >= R - 3) {
          ctx.fillStyle = 'rgba(255, 245, 220, 0.18)';
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }, [progress, brightness]);

  return (
    <div className="moon-wrap" style={{ filter: `brightness(${brightness})`, '--moon-brightness': brightness }}>
      <div className="moon-glow" />
      <canvas ref={canvasRef} className="moon-canvas" />
    </div>
  );
}
