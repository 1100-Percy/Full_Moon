export function Moon({ progress, brightness }) {
  const shadowOffset = 86 - progress * 172;
  const shadowScale = 0.62 + Math.abs(progress - 0.5) * 1.35;

  return (
    <div className="moon-wrap" style={{ filter: `brightness(${brightness})`, '--moon-brightness': brightness }}>
      <div className="moon-glow" />
      <div className="moon-disc">
        <div
          className="moon-shadow"
          style={{
            transform: `translateX(${shadowOffset}%) scaleX(${shadowScale})`,
          }}
        />
      </div>
    </div>
  );
}
