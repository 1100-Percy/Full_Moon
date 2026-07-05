import { useCallback, useEffect, useMemo, useState } from 'react';

const defaultSliderStart = new Date('2026-08-01T00:00:00+08:00').getTime();
const defaultSliderEnd = new Date('2026-09-01T00:00:00+08:00').getTime();

function clampTime(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

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
  const [timeRange, setTimeRangeState] = useState({
    min: defaultSliderStart,
    max: defaultSliderEnd,
  });

  useEffect(() => {
    if (timeState.mode !== 'live') return undefined;
    const id = window.setInterval(() => {
      setTimeState((current) => (
        current.mode === 'live'
          ? { ...current, value: clampTime(Date.now(), timeRange.min, timeRange.max) }
          : current
      ));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timeRange.max, timeRange.min, timeState.mode]);

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
  const setTimeRange = useCallback((startAt, endAt) => {
    const min = new Date(startAt).getTime();
    const max = new Date(endAt).getTime();
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return;

    setTimeRangeState({ min, max });
    setTimeState((current) => {
      const nextValue = clampTime(current.value, min, max);
      return nextValue === current.value ? current : { ...current, value: nextValue };
    });
  }, []);

  const setSliderTime = useCallback((value) => {
    setTimeState({ mode: 'slider', value: clampTime(value, timeRange.min, timeRange.max) });
  }, [timeRange.max, timeRange.min]);

  return {
    simNow,
    isDebugOpen: debugOpen,
    mode: timeState.mode,
    sliderMin: timeRange.min,
    sliderMax: timeRange.max,
    setTimeRange,
    setSliderTime,
    useLiveTime: () => setTimeState({ mode: 'live', value: clampTime(Date.now(), timeRange.min, timeRange.max) }),
  };
}
