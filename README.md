# E-medic

## Overview

E-medic is an online Academy.

## Tech Stack

- React 
- TypeScript 
- Tailwind v4 
- ESLint (TypeScript/React rules)

## Quick Start

Prerequisites: Node.js 18+ (recommend 20 LTS).

```bash
# 1) Install dependencies
npm install

# 2) Start the dev server (hot reload)
npm run dev

# 3) Type-check, build, and preview
npm run build
npm run preview

# 4) Lint the project
npm run lint
```

By default, Vite will print the local/dev URL (e.g., http://localhost:5173). Use Ctrl+C to stop the dev server.

## Scripts

- `dev`: Start Vite dev server.
- `build`: Type-check (`tsc -b`) and build production assets with Vite.
- `preview`: Preview the production build locally.
- `lint`: Run ESLint across the project.

## Project Structure

```
e-medic/
├─ index.html
├─ public/              # Static assets copied as-is
├─ src/
│  ├─ main.tsx          # App bootstrap
│  ├─ App.tsx           # Root component
│  ├─ index.css         # Global styles
│  ├─ App.css           # Component styles
│  └─ assets/           # Local images/fonts, etc.
├─ eslint.config.js     # ESLint config
├─ tsconfig*.json       # TypeScript configs
├─ vite.config.ts       # Vite config (React SWC plugin)
└─ package.json
```
"I'd Update this as we go"

## Environment Variables

Vite exposes only variables prefixed with `VITE_` to your client code.

1. Create an `.env` file at the project root (you can also use `.env.local`, `.env.development`, `.env.production`).
2. Add variables like:

```
VITE_API_BASE_URL=https://api.example.com
VITE_FEATURE_FLAG=true
```

3. Read them in code via `import.meta.env.VITE_API_BASE_URL`.

Docs: https://vite.dev/guide/env-and-mode.html

## Deployment

1. Build: `npm run build` (outputs to `dist/`).
2. Host the `dist/` folder on any static host (Netlify, Vercel, GitHub Pages, S3/CloudFront, Nginx, etc.).

Notes:

- Ensure correct base path if hosting under a subpath (configure `base` in `vite.config.ts`).
- Set any required environment variables in your hosting provider.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on workflows, coding style, and PR process.


