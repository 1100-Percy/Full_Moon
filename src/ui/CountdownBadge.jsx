function daysBetween(a, b) {
  const delta = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.ceil(delta / (24 * 60 * 60 * 1000)));
}

export function CountdownBadge({ pair, simNow }) {
  const days = pair ? daysBetween(simNow, pair.reunion_at) : 0;
  const padded = String(days).padStart(2, '0');

  return (
    <div className="countdown-badge">
      <small>✦ NEW MOON IN ✦</small>
      <span>{padded}</span>
      <small>✦ DAYS ✦</small>
    </div>
  );
}
