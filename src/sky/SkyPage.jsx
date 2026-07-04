import { useEffect, useMemo, useState } from 'react';
import { Menu, MessageSquare, UserRound } from 'lucide-react';
import { catchMessage, getInboxMessages, getLitStars, getMessages, getMoonState, getPair, onNewMessage } from '../api';
import { useMoonStore } from '../store.js';
import { CountdownBadge } from '../ui/CountdownBadge.jsx';
import { MessagePanel } from '../ui/MessagePanel.jsx';
import { MeteorLayer } from './MeteorLayer.jsx';
import { Moon } from './Moon.jsx';
import { ParallaxBg } from './ParallaxBg.jsx';
import { PixelClouds } from './PixelClouds.jsx';
import { StarLayer } from './StarLayer.jsx';

export function SkyPage({ time, navigate }) {
  const pairId = useMoonStore((state) => state.pairId);
  const role = useMoonStore((state) => state.role);
  const setRole = useMoonStore((state) => state.setRole);
  const [pair, setPair] = useState(null);
  const [messages, setMessages] = useState([]);
  const [litStars, setLitStars] = useState([]);
  const [meteorMessages, setMeteorMessages] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const launchMeteors = (nextMessages, reason = 'inbox') => {
    nextMessages.forEach((message, index) => {
      window.setTimeout(() => {
        setMeteorMessages((current) => [
          ...current,
          { ...message, launchId: `${message.id}:${reason}:${Date.now()}:${index}` },
        ]);
      }, index * 850);
    });
  };

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
  }, [pairId, role]);

  useEffect(() => {
    let alive = true;
    getInboxMessages(pairId, role, time.simNow).then((inboxMessages) => {
      if (!alive || inboxMessages.length === 0) return;
      setMessages((current) => {
        const known = new Set(current.map((message) => message.id));
        return [...current, ...inboxMessages.filter((message) => !known.has(message.id))]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
      launchMeteors(inboxMessages, 'open');
    });
    return () => {
      alive = false;
    };
  }, [pairId, role]);

  useEffect(() => {
    const unsubscribe = onNewMessage(pairId, (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      if (message.sender !== role) {
        setMeteorMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      }
    });
    return unsubscribe;
  }, [pairId, role]);

  const moonState = useMemo(() => getMoonState(pair, time.simNow, messages), [pair, time.simNow, messages]);

  const toggleRole = () => {
    const nextRole = role === 'A' ? 'B' : 'A';
    setRole(nextRole);
    const params = new URLSearchParams(window.location.search);
    params.set('as', nextRole);
    window.history.replaceState({}, '', `/sky?${params.toString()}`);
  };

  const catchOneMessage = async (targetMessage) => {
    if (!targetMessage || targetMessage.caught_at) return null;
    const result = await catchMessage(targetMessage.id, time.simNow);
    setMessages((current) => current.map((message) => (message.id === targetMessage.id ? result.message : message)));
    if (result.litStarIndex !== null) {
      setLitStars((current) => [...new Set([...current, result.litStarIndex])]);
    }
    return result;
  };

  const checkInbox = async () => {
    const inboxMessages = await getInboxMessages(pairId, role, time.simNow);
    if (inboxMessages.length > 0) {
      launchMeteors(inboxMessages, 'manual');
      return;
    }
    const latestUnread = [...messages].reverse().find((message) => !message.caught_at && message.sender !== role);
    if (latestUnread) launchMeteors([latestUnread], 'retry');
  };

  return (
    <main className="sky-page">
      <ParallaxBg />
      <StarLayer litStars={litStars} />
      <MeteorLayer incomingMessages={meteorMessages} onCatch={catchOneMessage} />
      <section className="moon-stage">
        <Moon progress={moonState.progress} brightness={moonState.brightness} />
        <CountdownBadge pair={pair} simNow={time.simNow} />
      </section>
      <PixelClouds />

      <header className="sky-header">
        <button type="button" className="brand-button" onClick={() => navigate('setup')}>
          🌙 Full_Moon
        </button>
        <button type="button" className="pixel-btn-square" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          <Menu size={19} />
        </button>
      </header>

      {menuOpen ? (
        <nav className="sky-menu">
          <button type="button" onClick={() => { setPanelOpen((o) => !o); setMenuOpen(false); }}>
            <MessageSquare size={16} />
            Message
          </button>
          <button type="button" onClick={() => { checkInbox(); setMenuOpen(false); }}>
            Check Inbox
          </button>
          <button type="button" onClick={() => { toggleRole(); setMenuOpen(false); }}>
            <UserRound size={16} />
            Role {role === 'A' ? 'B' : 'A'}
          </button>
        </nav>
      ) : null}

      {panelOpen ? (
        <MessagePanel
          pairId={pairId}
          role={role}
          messages={messages}
          onSent={(message) => setMessages((current) => [...current, message])}
          onOpenMessage={(message) => launchMeteors([message], 'panel')}
        />
      ) : null}
    </main>
  );
}
