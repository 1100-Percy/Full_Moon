export function TimeDebugger({ time }) {
  if (!time.isDebugOpen) return null;

  return (
    <div className="time-debugger">
      <div>
        <strong>Sim Time</strong>
        <span>{time.simNow.toLocaleString()}</span>
      </div>
      <input
        aria-label="Simulated time"
        type="range"
        min={time.sliderMin}
        max={time.sliderMax}
        step={30 * 60 * 1000}
        value={time.simNow.getTime()}
        onChange={(event) => time.setSliderTime(event.target.value)}
      />
      <button type="button" onClick={time.useLiveTime}>
        Live
      </button>
    </div>
  );
}
