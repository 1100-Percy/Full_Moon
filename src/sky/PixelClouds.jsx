import { useEffect, useRef } from 'react';

const BLOCK = 4;
const LOOP_MS = 80000;

const LAYERS = [
  {
    color: '#3D2560',
    highlight: '#5B3A7A',
    shadow: '#2A1845',
    opacity: 0.94,
    pw: 480,
    base: 0.28,
    puffs: [
      [20, 16, 100, 55], [130, 4, 130, 70], [270, 20, 90, 48],
      [370, 2, 140, 74], [480, 24, 80, 42],
    ],
  },
  {
    color: '#6B3A6A',
    highlight: '#8B5080',
    shadow: '#4A2850',
    opacity: 0.90,
    pw: 540,
    base: 0.40,
    puffs: [
      [8, 28, 120, 62], [140, 10, 150, 80], [300, 32, 100, 52],
      [420, 6, 140, 76], [560, 24, 100, 56],
    ],
  },
  {
    color: '#A8607A',
    highlight: '#CC8898',
    shadow: '#7E4860',
    opacity: 0.88,
    pw: 600,
    base: 0.52,
    puffs: [
      [12, 24, 130, 68], [160, 38, 110, 52], [290, 16, 150, 80],
      [460, 34, 120, 60], [590, 18, 105, 55],
    ],
  },
  {
    color: '#C8856B',
    highlight: '#E8B098',
    shadow: '#9A6550',
    opacity: 0.86,
    pw: 680,
    base: 0.64,
    puffs: [
      [18, 20, 140, 72], [180, 38, 100, 50], [300, 12, 160, 84],
      [480, 32, 120, 62], [620, 18, 110, 56],
    ],
  },
];

function snap(v) { return Math.round(v / BLOCK) * BLOCK; }

function drawRect(ctx, x, y, w, h) { ctx.fillRect(snap(x), snap(y), snap(w), snap(h)); }

function drawPuff(ctx, ox, ch, puff) {
  const [x, y, w, h] = puff;
  const left = snap(ox + x);
  const top = snap(y);
  const right = snap(ox + x + w);
  const bottom = snap(Math.min(ch, y + h));
  for (let bx = left; bx < right; bx += BLOCK) {
    const t = (bx - left) / Math.max(1, right - left);
    const dome = Math.sin(t * Math.PI);
    const inset = snap((1 - dome) * h * 0.48);
    drawRect(ctx, bx, top + inset, BLOCK, bottom - top - inset);
  }
}

function drawPuffHighlight(ctx, ox, puff) {
  const [x, y, w, h] = puff;
  const left = snap(ox + x);
  const right = snap(ox + x + w);
  for (let bx = left; bx < right; bx += BLOCK) {
    const t = (bx - left) / Math.max(1, right - left);
    const dome = Math.sin(t * Math.PI);
    const inset = snap((1 - dome) * h * 0.48);
    const hlH = snap(h * 0.32 * dome);
    if (hlH > 0) drawRect(ctx, bx, y + inset, BLOCK, hlH);
  }
}

function drawPuffShadow(ctx, ox, ch, puff) {
  const [x, y, w, h] = puff;
  const left = snap(ox + x);
  const right = snap(ox + x + w);
  const bottom = snap(Math.min(ch, y + h));
  for (let bx = left; bx < right; bx += BLOCK) {
    const t = (bx - left) / Math.max(1, right - left);
    const dome = Math.sin(t * Math.PI);
    const sh = snap(h * 0.22 * dome);
    if (sh > 0) drawRect(ctx, bx, bottom - sh, BLOCK, sh);
  }
}

function drawLayer(ctx, layer, width, height, elapsed) {
  const drift = ((elapsed / LOOP_MS) * layer.pw) % layer.pw;
  const layerTop = snap(height * layer.base);

  ctx.globalAlpha = layer.opacity;
  ctx.fillStyle = layer.color;
  for (let ox = -layer.pw - drift; ox < width + layer.pw; ox += layer.pw) {
    layer.puffs.forEach((p) => drawPuff(ctx, ox, height, p));
    drawRect(ctx, ox, layerTop, layer.pw + BLOCK, height - layerTop + BLOCK);
  }

  ctx.globalAlpha = layer.opacity * 0.38;
  ctx.fillStyle = layer.shadow;
  for (let ox = -layer.pw - drift; ox < width + layer.pw; ox += layer.pw) {
    layer.puffs.forEach((p) => drawPuffShadow(ctx, ox, height, p));
  }

  ctx.globalAlpha = layer.opacity * 0.42;
  ctx.fillStyle = layer.highlight;
  for (let ox = -layer.pw - drift; ox < width + layer.pw; ox += layer.pw) {
    layer.puffs.forEach((p) => drawPuffHighlight(ctx, ox, p));
  }
}

export function PixelClouds() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frameId = 0;
    let t0 = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      const rect = canvas.getBoundingClientRect();
      const elapsed = (now - t0) % LOOP_MS;
      if (now - t0 >= LOOP_MS) t0 = now - elapsed;
      ctx.clearRect(0, 0, rect.width, rect.height);
      LAYERS.forEach((layer) => drawLayer(ctx, layer, rect.width, rect.height, elapsed));
      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(draw);
    };

    resize();
    frameId = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frameId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas className="pixel-cloud-layer" ref={canvasRef} aria-hidden="true" />;
}
