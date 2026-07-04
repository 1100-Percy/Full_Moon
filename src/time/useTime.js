import { useEffect, useMemo, useState } from 'react';

const sliderStart = new Date('2026-08-01T00:00:00+08:00').getTime();
const sliderEnd = new Date('2026-09-01T00:00:00+08:00').getTime();

function readInitialTime() {
  const params = new URLSearchParams(window.location.search);
  const queryTime = params.get('t');
  if (!queryTime) return { mode: 'live', value: Date.now() };

  const parsed = new Date(queryTime).getTime();
  if (Number.isNaN(parsed)) return { mode: 'live', value: Date.now() };
  return { mode: 'fixed', value: parsed };
}

export function useTime() {
  const [timeState, setTimeState] = useState(readInitialTime);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    if (timeState.mode !== 'live') return undefined;
    const id = window.setInterval(() => {
      setTimeState((current) => (current.mode === 'live' ? { ...current, value: Date.now() } : current));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timeState.mode]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === 'd') {
        setDebugOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const simNow = useMemo(() => new Date(timeState.value), [timeState.value]);

  return {
    simNow,
    isDebugOpen: debugOpen,
    mode: timeState.mode,
    sliderMin: sliderStart,
    sliderMax: sliderEnd,
    setSliderTime: (value) => setTimeState({ mode: 'slider', value: Number(value) }),
    useLiveTime: () => setTimeState({ mode: 'live', value: Date.now() }),
  };
}
