import { useEffect, useState } from 'react';
import { SetupPage } from './ui/SetupPage.jsx';
import { SkyPage } from './sky/SkyPage.jsx';
import { useMoonStore } from './store.js';
import { useTime } from './time/useTime.js';
import { TimeDebugger } from './time/TimeDebugger.jsx';

function getRoute() {
  return window.location.pathname === '/sky' ? 'sky' : 'setup';
}

export function App() {
  const [route, setRoute] = useState(getRoute);
  const pairId = useMoonStore((state) => state.pairId);
  const time = useTime();

  useEffect(() => {
    const onPopState = () => setRoute(getRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!pairId && route === 'sky') {
      window.history.replaceState({}, '', '/setup');
      setRoute('setup');
    }
  }, [pairId, route]);

  const navigate = (nextRoute) => {
    window.history.pushState({}, '', `/${nextRoute}${window.location.search}`);
    setRoute(nextRoute);
  };

  return (
    <>
      {route === 'sky' && pairId ? (
        <SkyPage time={time} navigate={navigate} />
      ) : (
        <SetupPage time={time} navigate={navigate} />
      )}
      <TimeDebugger time={time} />
    </>
  );
}
