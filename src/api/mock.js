import constellations from '../data/constellations.json';
import tasksPool from '../data/tasks-pool.json';

const storageKey = 'moon:mockDb';
const channelName = 'moon:mockRealtime';
const subscribers = new Map();
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(channelName) : null;

function uid(prefix) {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function readDb() {
  const raw = localStorage.getItem(storageKey);
  if (raw) return JSON.parse(raw);

  const db = { pairs: [], messages: [], stars: [], tasks: [] };
  localStorage.setItem(storageKey, JSON.stringify(db));
  return db;
}

function writeDb(db) {
  localStorage.setItem(storageKey, JSON.stringify(db));
}

function notify(pairId, message) {
  const set = subscribers.get(pairId);
  if (set) {
    set.forEach((cb) => cb(message));
  }
  channel?.postMessage({ type: 'message', pairId, message });
}

channel?.addEventListener('message', (event) => {
  if (event.data?.type !== 'message') return;
  const set = subscribers.get(event.data.pairId);
  if (!set) return;
  set.forEach((cb) => cb(event.data.message));
});

function toDayKey(dateLike) {
  return new Date(dateLike).toISOString().slice(0, 10);
}

export async function createPair(userA, userB, startAt, reunionAt) {
  const db = readDb();
  const pair = {
    id: uid('pair'),
    user_a: userA,
    user_b: userB,
    start_at: startAt,
    reunion_at: reunionAt,
  };

  db.pairs.push(pair);
  writeDb(db);
  seedMessages(pair.id, startAt, reunionAt);
  return pair;
}

export async function getPair(pairId) {
  const db = readDb();
  return db.pairs.find((pair) => pair.id === pairId) || null;
}

export async function sendMessage(pairId, sender, content, imageUrl = null) {
  const db = readDb();
  const message = {
    id: uid('msg'),
    pair_id: pairId,
    sender,
    content,
    image_url: imageUrl,
    created_at: new Date().toISOString(),
    caught_at: null,
  };
  db.messages.push(message);
  writeDb(db);
  window.setTimeout(() => notify(pairId, message), 350);
  return message;
}

export async function getMessages(pairId) {
  const db = readDb();
  return db.messages
    .filter((message) => message.pair_id === pairId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function catchMessage(msgId, simNow) {
  const db = readDb();
  const message = db.messages.find((item) => item.id === msgId);
  if (!message) throw new Error(`Message not found: ${msgId}`);

  message.caught_at = new Date(simNow).toISOString();

  const litOn = toDayKey(simNow);
  const alreadyLitToday = db.stars.some((star) => star.pair_id === message.pair_id && star.lit_on === litOn);
  let litStarIndex = null;

  if (!alreadyLitToday) {
    const usedIndexes = new Set(db.stars.filter((star) => star.pair_id === message.pair_id).map((star) => star.star_index));
    const nextStar = constellations.find((star) => !usedIndexes.has(star.index));
    if (nextStar) {
      litStarIndex = nextStar.index;
      db.stars.push({
        id: uid('star'),
        pair_id: message.pair_id,
        star_index: litStarIndex,
        lit_on: litOn,
        source: 'message',
      });
    }
  }

  writeDb(db);
  return { message, litStarIndex };
}

export function onNewMessage(pairId, cb) {
  const set = subscribers.get(pairId) || new Set();
  set.add(cb);
  subscribers.set(pairId, set);
  return () => {
    set.delete(cb);
    if (set.size === 0) subscribers.delete(pairId);
  };
}

export async function getLitStars(pairId) {
  const db = readDb();
  return db.stars
    .filter((star) => star.pair_id === pairId)
    .map((star) => ({ star_index: star.star_index, lit_on: star.lit_on, source: star.source }));
}

export function getMoonState(pair, simNow, msgs) {
  if (!pair) return { progress: 0, brightness: 0.5 };

  const start = new Date(pair.start_at).getTime();
  const reunion = new Date(pair.reunion_at).getTime();
  const now = new Date(simNow).getTime();
  const progress = Math.max(0, Math.min(1, (now - start) / (reunion - start || 1)));
  const twoDays = 48 * 60 * 60 * 1000;
  const recentCount = msgs.filter((message) => {
    const createdAt = new Date(message.created_at).getTime();
    return createdAt <= now && now - createdAt <= twoDays;
  }).length;

  return {
    progress,
    brightness: Math.min(1.2, 0.5 + Math.min(recentCount, 7) / 10),
  };
}

export async function getSummary(pairId) {
  const messages = await getMessages(pairId);
  const litStars = await getLitStars(pairId);
  const firstStar = litStars[0]?.star_index ?? null;
  const secondStar = litStars[1]?.star_index ?? null;

  return {
    scenes: [
      { text: '这些等待,都曾慢慢穿过夜空。', starIndex: null },
      { text: messages[0] ? `第一句「${messages[0].content.slice(0, 10)}」被星星记住。` : '第一颗星亮起时,等待有了形状。', starIndex: firstStar },
      { text: messages[1] ? `后来「${messages[1].content.slice(0, 10)}」也抵达了。` : '月亮一点点变圆,像一次安静靠近。', starIndex: secondStar },
      { text: '现在,你们已经回到同一轮月亮下。', starIndex: null },
    ],
  };
}

export async function createTask(pairId) {
  const db = readDb();
  const prompt = tasksPool[Math.floor(Math.random() * tasksPool.length)].prompt;
  const task = {
    id: uid('task'),
    pair_id: pairId,
    prompt,
    photo_a_url: null,
    photo_b_url: null,
    status: 'open',
    ai_reason: null,
  };
  db.tasks.push(task);
  writeDb(db);
  return task;
}

export async function uploadTaskPhoto(taskId, who, file) {
  const db = readDb();
  const task = db.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  const url = URL.createObjectURL(file);
  if (who === 'A') task.photo_a_url = url;
  if (who === 'B') task.photo_b_url = url;
  task.status = 'pending';
  writeDb(db);
  return url;
}

export async function verifyTask(taskId) {
  const db = readDb();
  const task = db.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  const passed = Boolean(task.photo_a_url && task.photo_b_url);
  task.status = passed ? 'passed' : 'failed';
  task.ai_reason = passed ? '双方都上传了见证照片。' : '还缺少一方照片。';
  writeDb(db);
  return { passed, reason: task.ai_reason, litStarIndexes: [] };
}

function seedMessages(pairId, startAt, reunionAt) {
  const db = readDb();
  if (db.messages.some((message) => message.pair_id === pairId)) return;

  const start = new Date(startAt).getTime();
  const reunion = new Date(reunionAt).getTime();
  const span = Math.max(1, reunion - start);
  const seeds = [
    ['A', "Xiaoyu, Mom cooked your favorite braised pork today. Did you eat well at grandma's?"],
    ['B', 'Look at the moon! Grandma said if I look at it, you are looking at it too.'],
    ['A', "I saw a toy in the store window today that you would love. I'll bring it when I come back."],
    ['B', 'I got an A on my math test today! The teacher gave me a sticker.'],
    ['A', "I'm so proud of you! Mom is working extra hours so we can go to the amusement park."],
    ['B', 'It rained really hard here today. Is it raining in Shenzhen?'],
    ['A', 'The weather is clear here. Only 15 days left until my train ticket home!'],
    ['B', "I can't wait! I drew a picture of us holding hands."],
  ];

  seeds.forEach(([sender, content], index) => {
    db.messages.push({
      id: uid('seed'),
      pair_id: pairId,
      sender,
      content,
      image_url: null,
      created_at: new Date(start + (span * (index + 1)) / 10).toISOString(),
      caught_at: null,
    });
  });

  writeDb(db);
}
