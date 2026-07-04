import { useEffect, useState } from 'react';

export function ParallaxBg() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event) => {
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div className="parallax-bg" aria-hidden="true">
      <div className="sky-layer far" style={{ transform: `translate(${pointer.x * -8}px, ${pointer.y * -5}px)` }} />
      <div className="sky-layer mid" style={{ transform: `translate(${pointer.x * -18}px, ${pointer.y * -10}px)` }} />
      <div className="sky-layer near" style={{ transform: `translate(${pointer.x * -34}px, ${pointer.y * -18}px)` }} />
    </div>
  );
}
