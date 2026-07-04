import { useState } from 'react';
import { Send } from 'lucide-react';
import { sendMessage } from '../api';

export function MessagePanel({ pairId, role, messages, onSent }) {
  const [content, setContent] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    const message = await sendMessage(pairId, role, trimmed);
    onSent(message);
    setContent('');
  };

  return (
    <aside className="message-panel">
      <div className="panel-header">
        <strong>Messages</strong>
        <span>{role} window</span>
      </div>
      <div className="message-list">
        {messages.map((message) => (
          <article className={`message-item ${message.sender === role ? 'mine' : ''}`} key={message.id}>
            <div>
              <strong>{message.sender}</strong>
              <time>{new Date(message.created_at).toLocaleDateString()}</time>
            </div>
            <p>{message.content}</p>
            <span className={message.caught_at ? 'caught' : 'sealed'}>{message.caught_at ? 'caught' : 'sealed'}</span>
          </article>
        ))}
      </div>
      <form className="message-form" onSubmit={submit}>
        <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Send a meteor message" />
        <button aria-label="Send message" type="submit">
          <Send size={18} />
        </button>
      </form>
    </aside>
  );
}
