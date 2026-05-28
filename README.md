# Dealirious

A static-first game deal dashboard demo for GitHub and Vercel.

The app can run as a no-backend demo by reading weekly refreshed deal data from `public/data/deals.json`. The original Express scraper server is still available for local/full API experiments, but it is no longer required for the public demo.

## Static Demo

```bash
npm install
npm run dev
```

Build the Vercel/GitHub-friendly static app:

```bash
npm run build
```

Refresh demo data manually:

```bash
npm run data:update
```

## Weekly Updates

`.github/workflows/update-demo-data.yml` runs every Sunday and refreshes `public/data/deals.json` from public deal data. When the file changes, GitHub Actions commits the update back to `main`, which can trigger a new Vercel deploy.

## Vercel

Use the default Vercel project settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci`

The included `vercel.json` sets these values and adds an SPA rewrite.

## Optional Full API Mode

The old Express backend is still available:

```bash
npm run dev:server
npm run build:server
npm start
```

To point the frontend at a live API, set:

```env
VITE_API_URL=https://your-api.example.com
```

Without `VITE_API_URL`, the frontend uses the static demo adapter.
