# Moon

Phase 0 local implementation for Full Moon.

## Run

```bash
npm install
npm run dev
```

Open `/setup`, create a pair, then use `/sky`.

Useful checks:

- Add `?as=B` to view as user B.
- Add `?t=2026-08-15T20:00` to simulate time.
- Press `D` on `/sky` to show the time slider.
- Click `Catch latest` to test the mock daily-star rule.

## Phase 0 Scope

- Local Git repo scaffold.
- Frozen `CONTRACT.md`.
- Supabase schema draft in `supabase/schema.sql`.
- Static constellation and task data.
- Mock API implementing the shared contract.
- Setup page, sky page, time hook, and three-layer CSS parallax background.

Supabase project creation, Vercel linking, and real API keys are external account actions and are intentionally left as next steps.
