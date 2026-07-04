function daysBetween(a, b) {
  const delta = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.ceil(delta / (24 * 60 * 60 * 1000)));
}

export function CountdownBadge({ pair, simNow }) {
  const days = pair ? daysBetween(simNow, pair.reunion_at) : 0;

  return (
    <div className="countdown-badge">
      <span>{days}</span>
      <small>DAYS</small>
    </div>
  );
}
