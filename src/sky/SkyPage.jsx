import { useEffect, useMemo, useState } from 'react';
import { Menu, UserRound } from 'lucide-react';
import { catchMessage, getLitStars, getMessages, getMoonState, getPair, onNewMessage } from '../api';
import { useMoonStore } from '../store.js';
import { CountdownBadge } from '../ui/CountdownBadge.jsx';
import { MessagePanel } from '../ui/MessagePanel.jsx';
import { Moon } from './Moon.jsx';
import { ParallaxBg } from './ParallaxBg.jsx';
import { StarLayer } from './StarLayer.jsx';

export function SkyPage({ time, navigate }) {
  const pairId = useMoonStore((state) => state.pairId);
  const role = useMoonStore((state) => state.role);
  const setRole = useMoonStore((state) => state.setRole);
  const [pair, setPair] = useState(null);
  const [messages, setMessages] = useState([]);
  const [litStars, setLitStars] = useState([]);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([getPair(pairId), getMessages(pairId), getLitStars(pairId)]).then(([nextPair, nextMessages, nextStars]) => {
      if (!alive) return;
      setPair(nextPair);
      setMessages(nextMessages);
      setLitStars(nextStars.map((star) => star.star_index));
    });
    return () => {
      alive = false;
    };
  }, [pairId]);

  useEffect(() => {
    const unsubscribe = onNewMessage(pairId, (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    });
    return unsubscribe;
  }, [pairId]);

  const moonState = useMemo(() => getMoonState(pair, time.simNow, messages), [pair, time.simNow, messages]);

  const toggleRole = () => {
    const nextRole = role === 'A' ? 'B' : 'A';
    setRole(nextRole);
    const params = new URLSearchParams(window.location.search);
    params.set('as', nextRole);
    window.history.replaceState({}, '', `/sky?${params.toString()}`);
  };

  const catchLatest = async () => {
    const latest = [...messages].reverse().find((message) => !message.caught_at && message.sender !== role);
    if (!latest) return;
    const result = await catchMessage(latest.id, time.simNow);
    setMessages((current) => current.map((message) => (message.id === latest.id ? result.message : message)));
    if (result.litStarIndex !== null) {
      setLitStars((current) => [...new Set([...current, result.litStarIndex])]);
    }
  };

  return (
    <main className="sky-page">
      <ParallaxBg />
      <StarLayer litStars={litStars} />
      <section className="moon-stage">
        <CountdownBadge pair={pair} simNow={time.simNow} />
        <Moon progress={moonState.progress} brightness={moonState.brightness} />
      </section>

      <header className="sky-header">
        <button type="button" className="brand-button" onClick={() => navigate('setup')}>Full Moon</button>
        <div className="sky-actions">
          <button type="button" onClick={catchLatest}>Catch latest</button>
          <button type="button" onClick={toggleRole}>
            <UserRound size={17} />
            {role}
          </button>
          <button aria-label="Toggle message panel" type="button" onClick={() => setPanelOpen((open) => !open)}>
            <Menu size={19} />
          </button>
        </div>
      </header>

      {panelOpen ? (
        <MessagePanel
          pairId={pairId}
          role={role}
          messages={messages}
          onSent={(message) => setMessages((current) => [...current, message])}
        />
      ) : null}
    </main>
  );
}
