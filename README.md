# PAN Restaurant — panfayetteville.com

Chef-driven sandwich shop in downtown Fayetteville, NC. This repo is the production website.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Astro 6](https://astro.build) — static pages + SSR form endpoints |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) (CDN + Workers) |
| Email | [Resend](https://resend.com) — catering notifications + newsletter |
| Analytics | [Plausible](https://plausible.io) — privacy-first, no cookies |
| Fonts | [Fontsource](https://fontsource.org) — self-hosted Fraunces + Inter |
| Images | Sharp (build-time AVIF + WebP + JPEG) |

---

## Prerequisites

- **Node.js ≥ 22.12.0** — check with `node -v`
- **npm ≥ 10** — bundled with Node 22
- A [Resend](https://resend.com) account with a verified sending domain (optional for local dev — forms degrade gracefully without it)

---

## Local setup

```bash
git clone https://github.com/YOUR_ORG/pan-restaurant.git
cd pan-restaurant
npm install
cp .env.example .env
# Open .env and fill in your keys (see Environment variables below)
npm run dev
# → http://localhost:4321
```

The dev server hot-reloads on file save. Forms work without real API keys in dev mode — they skip email delivery and log a warning.

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at http://localhost:4321 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Astro + TypeScript type checking |
| `npm run a11y:dev` | pa11y audit (requires `npm run dev` in another tab) |
| `npm run a11y:axe` | axe-core audit against running dev server |

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Required in prod | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | Resend API key — [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_AUDIENCE_ID` | Yes | Resend Audience ID for the newsletter subscriber list |
| `OWNER_EMAIL` | No | Catering inquiry recipient (default: `pan@graybillhospitality.com`) |
| `PLAUSIBLE_DOMAIN` | No | Plausible tracking domain (default: `panfayetteville.com`) |

In **Cloudflare Pages** set production secrets under **Settings → Environment variables → Production**.

---

## Deployment

### Automatic via Cloudflare Pages (recommended)

1. Create a Cloudflare Pages project named **`pan-fayetteville`**
2. Connect it to this GitHub repository
3. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist/client`
   - **Node.js version:** `22`
   - **Compatibility flag:** `nodejs_compat`
4. Push to `main` → Cloudflare builds and deploys within ~60 s

Every pull request automatically gets a unique preview URL.

### KV namespace (one-time setup)

The Cloudflare adapter uses a KV namespace for session storage. Create it once:

```bash
npx wrangler kv namespace create SESSION
# Copy the returned id into wrangler.toml and the Pages dashboard

npx wrangler kv namespace create SESSION --preview
# Copy the preview_id into wrangler.toml
```

Then add the binding in **Cloudflare Pages → Settings → Functions → KV namespace bindings**: binding name `SESSION`.

### Custom domain

Add `panfayetteville.com` under **Cloudflare Pages → Custom domains**. Cloudflare issues the SSL certificate automatically. Add a redirect rule (`www` → apex) in Cloudflare Rules.

---

## Content editing

All content lives in `src/content/` as MDX files. The owner can edit via the **GitHub web editor** without any local tooling.

### Edit a menu item — step by step

1. Open [github.com/YOUR_ORG/pan-restaurant](https://github.com/YOUR_ORG/pan-restaurant) → browse to `src/content/menu/`
2. Click any `.mdx` file (e.g. `the-leclair.mdx`)
3. Click the **pencil icon** (✏ Edit this file) in the top-right corner
4. Make changes in the editor — see frontmatter reference below
5. Click **Commit changes** → write a brief message → **Commit directly to `main`**
6. Cloudflare Pages detects the push and deploys within ~60 seconds

**Menu item frontmatter:**

```yaml
---
name: The Leclair
description: One-sentence description shown on the menu and homepage.
price: "$14"
category: signature        # signature | seasonal | sides
featured: true             # true = shown on homepage (keep to 3 total)
ingredients: [prosciutto, brie, fig jam, arugula]
image: ../../assets/images/menu/leclair.jpg   # optional
imageAlt: "The Leclair sandwich on a board"   # required if image is set
---
```

### Edit press articles

Files in `src/content/press/` — one `.mdx` per article. Frontmatter:

```yaml
---
title: "PAN Named Best Sandwich Shop 2025"
publication: Up & Coming Weekly
date: 2025-03-15        # YYYY-MM-DD, used for sort order
url: https://ucweekly.com/full-url-to-article
excerpt: "Two sentences shown on the Press page."
---
```

### Update hours

Hours are defined in **two places** that must stay in sync:

- `src/lib/hours.ts` — powers the "Open now / Closed" indicator and all hours displays
- `src/layouts/Base.astro` — `openingHoursSpecification` block in the JSON-LD schema

Edit `src/lib/hours.ts` first, then update the matching entries in `Base.astro`.

---

## Replacing images

Source images live in `src/assets/images/`. Astro processes them at build time into AVIF + WebP + JPEG at multiple widths — just replace the source file and Astro handles the rest.

**Requirements:** JPEG or PNG, minimum 1400 px on the long edge, sRGB colour space.

| File | Used on |
|---|---|
| `hero-leclair.jpg` | Homepage hero |
| `interior.jpg` | Homepage story teaser |
| `story-brian.jpg` | Story page hero |
| `story-staci.jpg` | Story page |
| `visit-map.jpg` | Visit page (replace with Mapbox tile when ready) |

**OG image** (`public/og-default.jpg`) is not processed by Astro — replace with a 1200 × 630 px JPEG directly.

---

## Analytics & monitoring

### Plausible

Dashboard: [plausible.io/panfayetteville.com](https://plausible.io/panfayetteville.com)

Custom event goals tracked automatically (create matching **Event goals** in the Plausible dashboard):

| Goal | Trigger |
|---|---|
| `order_toast_click` | Click on any "Order on Toast" link |
| `phone_click` | Click on any `tel:` link |
| `directions_click` | Click on Google Maps or Apple Maps links |
| `newsletter_subscribe` | Successful newsletter signup |
| `catering_submit` | Successful catering form submission |

### Uptime monitoring

Set up a monitor pinging `https://panfayetteville.com/` every 5 minutes. Options:
- **Cloudflare Notifications** (free) — Cloudflare dashboard → Notifications → Create
- **Better Uptime** (free tier, 10 monitors) — [betterstack.com](https://betterstack.com/better-uptime)

---

## CI

Every pull request runs type-checking, a production build, and a full pa11y accessibility audit. Merging to `main` triggers automatic deployment via Cloudflare Pages — no separate deploy job is needed.

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Project structure

```
src/
  actions/        Astro server actions (catering form)
  assets/images/  Source photos (Sharp processes at build time)
  components/     Reusable components
    ui/           Design-system primitives (Button, Section, Heading…)
  content/        MDX collections
    menu/         ← owner edits these
    press/        ← owner edits these
  layouts/        Base.astro — shared <head>, header, footer
  lib/            Shared utilities (hours.ts, menu.ts)
  pages/          File-based routes
    api/          subscribe endpoint
    catering/     Catering page + thanks
    subscribe/    Newsletter thanks/error
  styles/         global.css (Tailwind theme + base styles)
public/           Static assets: favicon, og-default.jpg, _headers, robots.txt
scripts/          pa11y-audit.mjs
```

---

## Licence

Proprietary — © Graybill Hospitality Co. LLC. All rights reserved.
