import { useEffect, useRef, useState } from 'react';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createMeteor(message, width, height) {
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -90 : width + 90;
  const startY = randomBetween(40, height * 0.34);
  const endX = fromLeft ? width + 120 : -120;
  const endY = randomBetween(height * 0.55, height * 0.9);

  return {
    id: message.id,
    message,
    startTime: performance.now(),
    duration: randomBetween(6000, 8000),
    startX,
    startY,
    endX,
    endY,
    x: startX,
    y: startY,
    caught: false,
  };
}

function easeOutSine(value) {
  return Math.sin((Math.max(0, Math.min(1, value)) * Math.PI) / 2);
}

function makeParticles(x, y) {
  return Array.from({ length: 34 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 34 + randomBetween(-0.18, 0.18);
    const speed = randomBetween(0.8, 3.2);
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: randomBetween(520, 980),
      bornAt: performance.now(),
      size: randomBetween(1, 3.4),
    };
  });
}

export function MeteorLayer({ incomingMessages, onCatch }) {
  const canvasRef = useRef(null);
  const meteorsRef = useRef([]);
  const particlesRef = useRef([]);
  const launchedRef = useRef(new Set());
  const [caughtCard, setCaughtCard] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    incomingMessages.forEach((message) => {
      if (launchedRef.current.has(message.id)) return;
      launchedRef.current.add(message.id);
      meteorsRef.current.push(createMeteor(message, rect.width, rect.height));
    });
  }, [incomingMessages]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frameId = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawMeteor = (meteor, now) => {
      const progress = Math.max(0, Math.min(1, (now - meteor.startTime) / meteor.duration));
      const eased = easeOutSine(progress);
      meteor.x = meteor.startX + (meteor.endX - meteor.startX) * eased;
      meteor.y = meteor.startY + (meteor.endY - meteor.startY) * eased;

      const angle = Math.atan2(meteor.endY - meteor.startY, meteor.endX - meteor.startX);
      const tailLength = 160;
      const tailX = meteor.x - Math.cos(angle) * tailLength;
      const tailY = meteor.y - Math.sin(angle) * tailLength;
      const trail = context.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
      trail.addColorStop(0, 'rgba(255, 244, 194, 0)');
      trail.addColorStop(0.54, 'rgba(183, 225, 222, 0.2)');
      trail.addColorStop(1, 'rgba(255, 244, 194, 0.95)');

      context.strokeStyle = trail;
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(meteor.x, meteor.y);
      context.stroke();

      const glow = context.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, 28);
      glow.addColorStop(0, 'rgba(255, 244, 194, 1)');
      glow.addColorStop(1, 'rgba(255, 244, 194, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(meteor.x, meteor.y, 28, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#fff2c8';
      context.beginPath();
      context.arc(meteor.x, meteor.y, 5.5, 0, Math.PI * 2);
      context.fill();

      return progress < 1;
    };

    const drawParticles = (now) => {
      particlesRef.current = particlesRef.current.filter((particle) => {
        const age = now - particle.bornAt;
        if (age > particle.life) return false;
        const progress = age / particle.life;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.015;
        context.fillStyle = `rgba(255, 244, 194, ${1 - progress})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * (1 - progress * 0.4), 0, Math.PI * 2);
        context.fill();
        return true;
      });
    };

    const draw = (now) => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      meteorsRef.current = meteorsRef.current.filter((meteor) => drawMeteor(meteor, now));
      drawParticles(now);
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

  const handlePointerDown = async (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = meteorsRef.current.find((meteor) => Math.hypot(meteor.x - x, meteor.y - y) <= 40);
    if (!hit || hit.caught) return;

    hit.caught = true;
    meteorsRef.current = meteorsRef.current.filter((meteor) => meteor.id !== hit.id);
    particlesRef.current.push(...makeParticles(hit.x, hit.y));
    const result = await onCatch(hit.message);
    setCaughtCard({
      message: hit.message,
      litStarIndex: result?.litStarIndex ?? null,
    });
    window.setTimeout(() => setCaughtCard(null), 5200);
  };

  return (
    <>
      <canvas className="meteor-layer" ref={canvasRef} onPointerDown={handlePointerDown} />
      {caughtCard ? (
        <aside className="meteor-card">
          <span>{caughtCard.message.sender}</span>
          <p>{caughtCard.message.content}</p>
          <small>
            {caughtCard.litStarIndex === null
              ? 'Message opened. Today already has a star.'
              : `Star ${caughtCard.litStarIndex} lit for today.`}
          </small>
        </aside>
      ) : null}
    </>
  );
}
