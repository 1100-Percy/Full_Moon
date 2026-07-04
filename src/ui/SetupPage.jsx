import { useState } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import { createPair } from '../api';
import { useMoonStore } from '../store.js';

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

export function SetupPage({ time, navigate }) {
  const setPairId = useMoonStore((state) => state.setPairId);
  const setRole = useMoonStore((state) => state.setRole);
  const [userA, setUserA] = useState('Aster');
  const [userB, setUserB] = useState('Luna');
  const [reunionDate, setReunionDate] = useState(formatDateInput(new Date(time.simNow.getTime() + 18 * 24 * 60 * 60 * 1000)));
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!userA.trim() || !userB.trim() || !reunionDate) {
      setError('请先填好双方名字和团聚日期。');
      return;
    }

    const startAt = time.simNow.toISOString();
    const reunionAt = new Date(`${reunionDate}T20:00:00+08:00`).toISOString();
    const pair = await createPair(userA.trim(), userB.trim(), startAt, reunionAt);
    setPairId(pair.id);
    setRole('A');
    navigate('sky');
  };

  return (
    <main className="setup-page">
      <section className="setup-hero">
        <div className="setup-copy">
          <span className="eyebrow">
            <Sparkles size={16} />
            Phase 0 local mock
          </span>
          <h1>Full Moon</h1>
          <p>把等待变成一片两个人共同点亮的星空。先创建一组演示关系,然后进入 /sky 调试月相、身份和视差背景。</p>
        </div>

        <form className="setup-form" onSubmit={onSubmit}>
          <div className="form-title">
            <Moon size={20} />
            <span>新建 pair</span>
          </div>
          <label>
            <span>A 的名字</span>
            <input value={userA} onChange={(event) => setUserA(event.target.value)} />
          </label>
          <label>
            <span>B 的名字</span>
            <input value={userB} onChange={(event) => setUserB(event.target.value)} />
          </label>
          <label>
            <span>团聚日期</span>
            <input type="date" value={reunionDate} onChange={(event) => setReunionDate(event.target.value)} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit">进入星空</button>
        </form>
      </section>
    </main>
  );
}
