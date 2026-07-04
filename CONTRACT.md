# Full Moon Contract

This file freezes the Phase 0 data contract. Any contract change must be agreed by both coders first, then updated here before code changes.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 18 |
| State | Zustand single store |
| Sky render | Canvas 2D + CSS parallax |
| Backend | Supabase Postgres + Realtime + Storage |
| AI | Anthropic API |
| Deploy | Vercel |

## Supabase Tables

```sql
pairs    ( id uuid pk, user_a text, user_b text,
           start_at timestamptz, reunion_at timestamptz,
           last_seen_a_at timestamptz null,              -- A 上次打开收件箱
           last_seen_b_at timestamptz null )             -- B 上次打开收件箱

messages ( id uuid pk, pair_id uuid, sender text,
           content text, image_url text null,
           created_at timestamptz default now(),
           caught_at timestamptz null )

stars    ( id uuid pk, pair_id uuid,
           star_index int,
           lit_on date,
           source text )

tasks    ( id uuid pk, pair_id uuid, prompt text,
           photo_a_url text null, photo_b_url text null,
           status text default 'open',
           ai_reason text null )
```

RLS is disabled during the hackathon prototype.

## Static Data

`src/data/constellations.json` contains 40 stars. Coordinates are relative `x/y` values from 0 to 1 and must avoid the central moon area:

```text
0.35 < x < 0.65 and 0.2 < y < 0.6
```

`src/data/tasks-pool.json` contains the Phase 0 double-person task prompts.

## API

`src/api/index.js` exports:

```js
getPair(pairId) -> Pair
createPair(userA, userB, startAt, reunionAt) -> Pair
sendMessage(pairId, sender, content, imageUrl?) -> Message
getMessages(pairId) -> Message[]
getInboxMessages(pairId, recipient, simNow) -> Message[] // 对方发来、未读、上次打开后收到
catchMessage(msgId, simNow) -> { message, litStarIndex|null }
onNewMessage(pairId, cb) -> unsubscribe
getLitStars(pairId) -> [{ star_index, lit_on, source }]
getMoonState(pair, simNow, msgs) -> { progress: 0..1, brightness: 0.5..1.2 }
getSummary(pairId) -> { scenes: [{ text, starIndex|null }] }
createTask(pairId) -> Task
uploadTaskPhoto(taskId, who, file) -> url
verifyTask(taskId) -> { passed, reason, litStarIndexes:[..] }
```

All date-sensitive behavior must use the simulated time passed by `useTime()`, not direct `Date.now()` calls inside UI components.

## Ownership

```text
src/api/      B owns
src/data/     B generates, then freezes
src/sky/      A owns
src/ui/       A owns
src/summary/  A owns
src/time/     shared
src/store.js  shared
CONTRACT.md   shared and frozen
```
