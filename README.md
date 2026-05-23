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
npm run preview   # serve dist/ locally
```

Output is in `dist/` — deploy to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.).

## Project structure

```
src/
  components/   UI primitives (cards, forms, charts, onboarding)
  pages/        Route views
  utils/        Calculations, storage, validation, scenarios
  types/        Shared TypeScript types
  data/         Demo dataset
```

## Data & privacy

- All financial data is stored in **browser localStorage** only.
- Nothing is sent to a server.
- Use **Data → Export backup** to download a JSON file.
- Use **Data → Import backup** to restore on this or another device (same browser storage model).

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
