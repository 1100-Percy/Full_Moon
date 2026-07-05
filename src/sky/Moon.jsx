import moonCutout from '../assets/moon-cutout.png';

const phaseCount = 30;

function clampProgress(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function quantizeProgress(progress) {
  const clamped = clampProgress(progress);
  const phaseIndex = Math.round(clamped * (phaseCount - 1));
  return phaseIndex / (phaseCount - 1);
}

function getRevealPath(progress) {
  if (progress <= 0) return '';
  if (progress >= 1) {
    return 'M 0 -50 A 50 50 0 1 1 0 50 A 50 50 0 1 1 0 -50 Z';
  }

  if (progress <= 0.5) {
    const rx = Math.max(0.01, 50 * (1 - progress * 2));
    return `M 0 -50 A 50 50 0 0 1 0 50 A ${rx} 50 0 0 0 0 -50 Z`;
  }

  const rx = Math.max(0.01, 50 * (progress * 2 - 1));
  return `M 0 -50 A ${rx} 50 0 0 0 0 50 A 50 50 0 0 0 0 -50 Z`;
}

export function Moon({ progress, brightness }) {
  const phaseProgress = quantizeProgress(progress);
  const revealPath = getRevealPath(phaseProgress);

  return (
    <div
      className="moon-wrap"
      style={{ filter: `brightness(${brightness})`, '--moon-brightness': brightness }}
      aria-label="Moon phase revealing the full moon"
      role="img"
    >
      <div className="moon-glow" />
      <svg className="moon-disc" viewBox="-50 -50 100 100" aria-hidden="true">
        <defs>
          <clipPath id="moon-image-reveal">
            {revealPath ? <path d={revealPath} transform="scale(-1 1)" /> : null}
          </clipPath>
        </defs>
        <circle className="moon-night" cx="0" cy="0" r="50" />
        {revealPath ? (
          <image
            className="moon-image"
            href={moonCutout}
            x="-50"
            y="-50"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#moon-image-reveal)"
          />
        ) : null}
        <circle className="moon-rim" cx="0" cy="0" r="49.5" />
      </svg>
    </div>
  );
}
