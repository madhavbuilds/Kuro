# Kuro website

Marketing site for [Kuro](https://github.com/madhavbuilds/Kuro) — Next.js App Router + Tailwind CSS.

## Develop

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

The live hero cat and feature cards use the same procedural drawing logic as the desktop app (`src/lib/catdraw.ts`).

## Vercel

Production: [https://kuro-mauve.vercel.app](https://kuro-mauve.vercel.app)

This app lives in the `website/` folder of the Kuro repo (Electron app at the repo root). In the Vercel project settings, set **Root Directory** to `website` so git deploys build the Next.js site instead of the Electron root (which produces an empty/404 deployment).
