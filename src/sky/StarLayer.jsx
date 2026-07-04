import { useEffect, useRef } from 'react';
import constellations from '../data/constellations.json';

function groupByConstellation() {
  return constellations.reduce((groups, star) => {
    groups[star.constellation] = groups[star.constellation] || [];
    groups[star.constellation].push(star);
    return groups;
  }, {});
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
        context.strokeStyle = 'rgba(177, 207, 218, 0.22)';
        context.lineWidth = 1;
        context.stroke();
      });

      constellations.forEach((star) => {
        const x = star.x * rect.width;
        const y = star.y * rect.height;
        const lit = litStarsRef.current.has(star.index);
        const burstStart = burstsRef.current.get(star.index);
        const burstAge = burstStart ? now - burstStart : Infinity;
        const burstProgress = Math.max(0, Math.min(1, burstAge / 1500));
        const burst = burstAge <= 1500 ? Math.sin(burstProgress * Math.PI) : 0;
        const breath = lit ? (Math.sin(now / 1000 + star.index) + 1) / 2 : 0;
        const glowRadius = lit ? 18 + breath * 8 + burst * 28 : 8;
        const coreRadius = lit ? 3.8 + breath * 0.9 + burst * 3.2 : 2.2;
        const alpha = lit ? 0.82 + breath * 0.18 : 0.5;
        const gradient = context.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, lit ? `rgba(255, 244, 194, ${alpha})` : 'rgba(178, 204, 214, .5)');
        gradient.addColorStop(1, 'rgba(255, 244, 194, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, glowRadius, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = lit ? '#fff4c2' : '#9fb6c0';
        context.beginPath();
        context.arc(x, y, coreRadius, 0, Math.PI * 2);
        context.fill();

        if (burst > 0) {
          context.strokeStyle = `rgba(255, 244, 194, ${0.45 * (1 - burstProgress)})`;
          context.lineWidth = 1.4;
          context.beginPath();
          context.arc(x, y, 16 + burstProgress * 42, 0, Math.PI * 2);
          context.stroke();
        }
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
