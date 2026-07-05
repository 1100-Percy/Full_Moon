import { useEffect, useRef } from 'react';
import constellations from '../data/constellations.json';

const DECORATIVE_STARS = [
  { core: '#FF6B9D', glow: 'rgba(255, 107, 157, 0.38)', fade: 'rgba(255, 107, 157, 0)' },
  { core: '#FFB347', glow: 'rgba(255, 179, 71, 0.34)', fade: 'rgba(255, 179, 71, 0)' },
];

function groupByConstellation() {
  return constellations.reduce((groups, star) => {
    groups[star.constellation] = groups[star.constellation] || [];
    groups[star.constellation].push(star);
    return groups;
  }, {});
}

function getDecorativeStar(starIndex) {
  if (starIndex % 10 !== 0) return null;
  return DECORATIVE_STARS[Math.floor(starIndex / 10) % DECORATIVE_STARS.length];
}

function drawCross(context, x, y, size, color, alpha) {
  const arm = size / 2;
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.lineCap = 'round';
  context.shadowColor = color;
  context.shadowBlur = 5;
  context.beginPath();
  context.moveTo(x - arm, y);
  context.lineTo(x + arm, y);
  context.moveTo(x, y - arm);
  context.lineTo(x, y + arm);
  context.stroke();
  context.restore();
}

export function StarLayer({ litStars }) {
  const canvasRef = useRef(null);
  const litStarsRef = useRef(new Set(litStars));
  const burstsRef = useRef(new Map());
  const previousLitRef = useRef(new Set());

  useEffect(() => {
    const nextLit = new Set(litStars);
    litStars.forEach((starIndex) => {
      if (!previousLitRef.current.has(starIndex)) {
        burstsRef.current.set(starIndex, performance.now());
      }
    });
    litStarsRef.current = nextLit;
    previousLitRef.current = nextLit;
  }, [litStars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const groups = groupByConstellation();
    let frameId = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);

      Object.values(groups).forEach((stars) => {
        context.beginPath();
        stars.forEach((star, index) => {
          const x = star.x * rect.width;
          const y = star.y * rect.height;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.strokeStyle = 'rgba(232, 220, 200, 0.18)';
        context.lineWidth = 1;
        context.stroke();
      });

      constellations.forEach((star) => {
        const x = star.x * rect.width;
        const y = star.y * rect.height;
        const lit = litStarsRef.current.has(star.index);
        const decorative = getDecorativeStar(star.index);
        const burstStart = burstsRef.current.get(star.index);
        const burstAge = burstStart ? now - burstStart : Infinity;
        const burstProgress = Math.max(0, Math.min(1, burstAge / 1500));
        const burst = burstAge <= 1500 ? Math.sin(burstProgress * Math.PI) : 0;
        const breath = lit ? (Math.sin(now / 1000 + star.index) + 1) / 2 : 0;
        const glowRadius = lit ? 18 + breath * 8 + burst * 28 : 8;
        const coreRadius = lit ? 3.8 + breath * 0.9 + burst * 3.2 : 2.2;
        const alpha = lit ? 0.82 + breath * 0.18 : 0.5;
        const gradient = context.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, lit ? `rgba(255, 244, 194, ${alpha})` : (decorative?.glow ?? 'rgba(232, 220, 200, 0.28)'));
        gradient.addColorStop(1, lit ? 'rgba(255, 244, 194, 0)' : (decorative?.fade ?? 'rgba(232, 220, 200, 0)'));
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, glowRadius, 0, Math.PI * 2);
        context.fill();
        if (decorative && !lit) {
          drawCross(context, x, y, 3, decorative.core, 0.9);
        } else {
          context.fillStyle = lit ? '#fff4c2' : 'rgba(232, 220, 200, 0.6)';
          context.beginPath();
          context.arc(x, y, coreRadius, 0, Math.PI * 2);
          context.fill();
        }

        if (burst > 0) {
          context.strokeStyle = `rgba(255, 244, 194, ${0.45 * (1 - burstProgress)})`;
          context.lineWidth = 1.4;
          context.beginPath();
          context.arc(x, y, 16 + burstProgress * 42, 0, Math.PI * 2);
          context.stroke();
        }
      });

      context.font = '8px "Press Start 2P", monospace';
      context.textAlign = 'center';
      context.fillStyle = 'rgba(232, 220, 200, 0.5)';
      Object.entries(groups).forEach(([name, stars]) => {
        let sumX = 0;
        let sumY = 0;
        stars.forEach((star) => { sumX += star.x; sumY += star.y; });
        const labelX = (sumX / stars.length) * rect.width;
        const labelY = (sumY / stars.length) * rect.height - 14;
        context.fillText(name.toUpperCase(), labelX, labelY);
      });

      frameId = requestAnimationFrame(draw);
    };

    resize();
    frameId = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas className="star-layer" ref={canvasRef} />;
}
