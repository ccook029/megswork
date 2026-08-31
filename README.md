# Meagan's Teaching Dashboard

A pale-pink teaching dashboard built with Next.js, ready to deploy on Vercel.

## What's here

- **Home** — landing page with a card for each tool (more tools coming).
- **Gradebook** — a full Ontario co-op gradebook with three linked modules,
  replicating the Excel workbook:
  - **Grade Tracker** — Pre-Placement (65%): Unit 1, Unit 2 and Quizzes;
    Hours & Journals (30%); Learning Plan (5%). Each assignment takes an
    achievement level (4+ … R, converted via the Ontario midpoint table)
    or a direct percent, never both.
  - **Final Journals** — weeks 7-15 with average % and average level.
  - **Final Co-op Marking Sheet** — weighted summary; Midterm (10%) pulls
    automatically from the Grade Tracker final grade and Journals (15%)
    from the Final Journals average.
  Plus per-module CSV export and a **student list upload** that reads
  Excel/CSV/text files — including the school system's "Student List"
  export format (`ID | Name | Grade | Gender | Birth Date`). Rosters cap
  at 30 students and names flow to all three modules automatically.

Gradebook data saves in the browser and, with **☁ Sync** turned on,
to a small cloud store so phone and laptop stay identical. Sync uses a
shared sync code (entered once per device) and stores the gradebook in
Upstash Redis, keyed by a hash of that code.

**One-time sync setup**: in the Vercel dashboard open the project →
Storage tab → Create Database → "Upstash for Redis" (free plan) →
connect it to this project (this injects the KV env vars) → redeploy.
Then in the app, click ☁ Sync, pick a code, and enter the same code on
each device. Use **Export CSV** now and then as a backup regardless.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import this repository (`ccook029/megswork`).
3. Vercel auto-detects Next.js — just click **Deploy**. No environment
   variables or settings needed.

Every push to the production branch redeploys automatically.
