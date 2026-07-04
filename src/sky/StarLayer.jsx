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
  const litSet = new Set(litStars);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const groups = groupByConstellation();

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        const lit = litSet.has(star.index);
        const radius = lit ? 4.5 : 2.2;
        const gradient = context.createRadialGradient(x, y, 0, x, y, lit ? 18 : 8);
        gradient.addColorStop(0, lit ? 'rgba(255, 244, 194, 1)' : 'rgba(178, 204, 214, .65)');
        gradient.addColorStop(1, 'rgba(255, 244, 194, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, lit ? 18 : 8, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = lit ? '#fff4c2' : '#9fb6c0';
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [litStars.join('|')]);

  return <canvas className="star-layer" ref={canvasRef} />;
}
