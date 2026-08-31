# Megan's Teaching Dashboard

A pale-pink teaching dashboard built with Next.js, ready to deploy on Vercel.

## What's here

- **Home** — landing page with a card for each tool (more tools coming).
- **Gradebook** — per-class rosters, assignments, mark entry, automatic
  averages and letter grades (Ontario scale: A ≥ 80, B ≥ 70, C ≥ 60, D ≥ 50),
  CSV export, and a **student list upload** that reads Excel/CSV/text files —
  including the school system's "Student List" export format
  (`ID | Name | Grade | Gender | Birth Date`).

All gradebook data is stored in the browser's localStorage on the device
where it's entered — nothing is sent to a server. Use **Export CSV**
regularly as a backup.

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
