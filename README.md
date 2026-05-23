# FinancePlanner

A **local-first** personal finance planner built with React, TypeScript, and Vite. Plan income, expenses, debt payoff, savings goals, and 12-month cashflow — with no backend, accounts, or bank connections.

Your data stays in your browser via `localStorage`. Export a JSON backup anytime.

## Features

- **Dashboard** — Budget overview, safe weekly spending, 12-month cashflow forecast, recommendations
- **Income & Expenses** — Track sources and categories (fixed vs variable)
- **Debt Planner** — Snowball, avalanche, and custom payoff strategies with comparison charts
- **Savings Goals** — Targets, progress bars, and monthly contribution estimates
- **Scenarios** — Compare current plan vs aggressive debt payoff, higher savings, lower spending, or custom sliders
- **Data controls** — Export/import JSON backups, demo data, reset with confirmation
- **Dark mode** — Light, dark, or system theme (persisted locally)
- **Undo** — Reversible deletes, deposits, reset, import, and demo load

## Screenshots

<!-- Add screenshots after deployment, e.g.:
![Dashboard](./docs/screenshots/dashboard.png)
![Debt Planner](./docs/screenshots/debt.png)
-->

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- npm 10+

### Install & run

```bash
cd finance_planner
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production build

```bash
npm run build
npm run preview   # serve dist/ locally at http://localhost:4173
```

Output is in `dist/` — deploy to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.).

## Deploy to Vercel

This app is a **static SPA** (no server, no API routes). Vercel’s Vite preset works out of the box — **`vercel.json` is not required** for root deployment.

### Routing & refresh

Navigation uses in-app state (not URL paths like `/debt`). Every visit loads `/` → `index.html` → the app. **Hard refresh always works** on the deployed URL. No SPA rewrite rules are needed unless you add client-side URL routing later.

### Option A — Vercel dashboard (recommended)

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the repository.
3. Confirm project settings (Vercel usually auto-detects Vite):

   | Setting | Value |
   | -------- | ----- |
   | **Framework Preset** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `npm install` |
   | **Root Directory** | `.` (repo root) |

4. **Environment variables:** none required.
5. Click **Deploy**.

After deploy, open your `*.vercel.app` URL. Use **Data → Export backup** before switching browsers or clearing site data.

### Option B — Vercel CLI

```bash
npm i -g vercel
cd finance_planner
npm run build          # optional local check
vercel                 # first deploy — follow prompts
vercel --prod          # production deploy
```

### Post-deploy checklist

- [ ] App loads at your production URL
- [ ] Favicon and page title look correct
- [ ] Dark / light / system theme persists after reload
- [ ] Add income/expense → refresh → data still present (`localStorage`)
- [ ] Export JSON → import JSON works
- [ ] Undo after a delete works
- [ ] Charts and mobile layout look acceptable

### Custom domain

In the Vercel project: **Settings → Domains** → add your domain and follow DNS instructions. No code changes needed for a root domain.

### Subpath deployment (advanced)

Only if you host under a path (e.g. `https://example.com/finance/`):

1. Set `base: '/finance/'` in `vite.config.ts`.
2. Rebuild and redeploy.
3. Add a `vercel.json` rewrite to serve `index.html` for that subpath.

Default config uses `base: '/'` for root Vercel URLs.

## Project structure

```
src/
  components/   UI primitives (cards, forms, charts, onboarding)
  pages/        Route views
  utils/        Calculations, storage, validation, scenarios
  types/        Shared TypeScript types
  data/         Demo dataset
public/
  favicon.svg   App icon (copied to dist/ on build)
```

## Data & privacy

- All financial data is stored in **browser localStorage** only.
- Nothing is sent to a server.
- Use **Data → Export backup** to download a JSON file.
- Use **Data → Import backup** to restore on this or another device (same browser storage model).
- Clearing site data or using a private window starts fresh — export backups before that.

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Start dev server           |
| `npm run build`   | Typecheck + production build |
| `npm run preview` | Preview production build   |
| `npm run lint`    | Run ESLint                 |

## Tech stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Recharts

## License

Private / personal use — adjust as needed for your deployment.
