export function Moon({ progress, brightness }) {
  const maskOffset = 84 - progress * 168;

  return (
    <div className="moon-wrap" style={{ filter: `brightness(${brightness})` }}>
      <div className="moon-glow" />
      <div className="moon-disc">
        <div className="moon-shadow" style={{ transform: `translateX(${maskOffset}%)` }} />
      </div>
    </div>
  );
}
