# praDeep Web (Frontend)

Next.js frontend for the praDeep system.

## Project overview

This app provides the browser UI for praDeep (dashboard + modules like knowledge, solver, question generation, research, notebook, and settings). It is built using the Next.js App Router under `app/` and a shared component layer under `components/`.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS (v4)
- UI/UX: Framer Motion, Lucide icons
- Content: `react-markdown` + `remark-*`/`rehype-*` (GFM + math/KaTeX)
- Editors/Diagrams: Monaco, Mermaid, MathLive
- E2E tests: Playwright

## Design system

The UI follows a “Liquid Glass” aesthetic with a light/dark theme:

- Tokens live in `tailwind.config.js` (surfaces, text hierarchy, accents, semantic colors, glass/shadows, radii).
- Global CSS lives in `app/globals.css` and defines core CSS variables (e.g. `--glass-*`, `--radius`, focus rings, and base resets).
- Dark mode is class-based (`darkMode: 'class'`) and is initialized before hydration via `components/ThemeScript.tsx`.

## Component library

The internal component library lives in `components/ui/` and is exported via `components/ui/index.ts`. It provides primitives and building blocks used across feature components:

- Primitives: `Button`/`IconButton`, `Input`/`Textarea`, `Card`, `Modal`, `Toast`, `LoadingState`, `PageWrapper`
- Conventions: Tailwind-first styling and class composition via `cn()` (`lib/utils.ts` uses `clsx` + `tailwind-merge`)
- Feature components live in `components/` (e.g. dashboards, editors, and module-specific UI)

## Getting started

### 1) Install

```bash
npm install
```

### 2) Configure environment

This frontend requires `NEXT_PUBLIC_API_BASE` to be set (see `lib/api.ts`). The recommended path is to start the full stack from the repo root, which generates `web/.env.local` automatically:

```bash
python scripts/start_web.py
```

If you’re running the backend separately, create `web/.env.local` with:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:<backend-port>
```

### 3) Run dev server

```bash
npm run dev
```

## Available scripts

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm start` — start production server (after build)
- `npm run lint` — run Next.js/ESLint linting
