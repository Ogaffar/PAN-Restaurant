# PAN Restaurant — Launch Checklist

Work through this list top-to-bottom before going live. Check each item off in a PR so the sign-off is in the git history.

---

## Content & copy

- [ ] All `TODO(owner):` comments in the codebase are resolved (run `grep -r "TODO(owner)" src/`)
- [ ] Menu prices filled in (`src/content/menu/*.mdx` — every item has a `price` field)
- [ ] Catering tier prices confirmed and updated (`src/pages/catering/index.astro`)
- [ ] Hours double-checked against current operating schedule (`src/lib/hours.ts`)
- [ ] Forty Under Forty award year confirmed and link added (`src/pages/press.astro`)
- [ ] All 5 Google Reviews replaced with verbatim text + reviewer first names (`src/pages/press.astro`)
- [ ] Press kit placeholder links replaced with real CDN asset URLs (`src/pages/press.astro`)
- [ ] Hero and interior photos replaced with final pro photography (`src/assets/images/`)
- [ ] Story portrait photos replaced with final pro photography (`src/assets/images/`)

---

## Technical — Cloudflare Pages setup

- [ ] Cloudflare Pages project created with name `pan-fayetteville`
- [ ] GitHub repository connected to Cloudflare Pages
- [ ] Build settings confirmed in Pages dashboard:
  - Build command: `npm run build`
  - Build output directory: `dist/client`
  - Node.js version: `22`
  - Compatibility flag: `nodejs_compat`
- [ ] Environment variables set in Pages dashboard → Settings → Environment variables → **Production**:
  - `RESEND_API_KEY`
  - `RESEND_AUDIENCE_ID`
  - `OWNER_EMAIL`
- [ ] KV namespace `SESSION` created (`wrangler kv namespace create SESSION`) and IDs set in `wrangler.toml` and Pages dashboard
- [ ] Resend sending domain `panfayetteville.com` verified (DNS records added)
- [ ] `form@panfayetteville.com` and `hello@panfayetteville.com` DNS records added for email sending

---

## Domain & SSL

- [ ] Custom domain `panfayetteville.com` added in Cloudflare Pages → Custom domains
- [ ] DNS A/CNAME records point to Cloudflare Pages
- [ ] SSL certificate issued and active (Cloudflare provisions automatically)
- [ ] `www.panfayetteville.com` → `panfayetteville.com` redirect configured
- [ ] HSTS header verified live: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

---

## SEO & social validation

- [ ] OG image (`/og-default.jpg`) renders correctly in [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] OG image renders correctly in [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] Google Search Console: property verified for `panfayetteville.com`
- [ ] Sitemap submitted in Search Console: `https://panfayetteville.com/sitemap-index.xml`
- [ ] `robots.txt` confirms `Sitemap:` directive is present

---

## Local listings & profiles

- [ ] Google Business Profile URL updated to `https://panfayetteville.com`
- [ ] Yelp profile URL updated
- [ ] Tripadvisor profile URL updated
- [ ] Instagram bio link updated (`@pansandwiches`)
- [ ] Facebook page website field updated (`@panfaync`)

---

## End-to-end functional tests

- [ ] Catering form: submit a real test inquiry — verify owner receives notification email and submitter receives confirmation email
- [ ] Newsletter signup: subscribe with a real email — verify contact appears in Resend Audiences
- [ ] Order Online button: confirm link opens correct Toast ordering page
- [ ] Phone number link: tap on mobile — confirm dialler opens with correct number
- [ ] Google Maps and Apple Maps links: verify they open the correct 105 Hay St address
- [ ] All nav links tested on mobile (hamburger menu opens/closes, focus trap works)

---

## Performance & quality

- [ ] Lighthouse audit run against the **production URL** (not localhost):
  - Performance ≥ 95
  - Accessibility ≥ 98
  - Best Practices = 100
  - SEO = 100
  - Scores recorded here: `Perf: ___ / A11y: ___ / BP: ___ / SEO: ___`
- [ ] LCP < 1.5 s, CLS < 0.05, INP < 200 ms verified on production
- [ ] `npm run a11y:dev` reports zero errors on all routes against production preview
- [ ] [securityheaders.com](https://securityheaders.com) grade ≥ A for `https://panfayetteville.com`

---

## Analytics & monitoring

- [ ] Plausible property `panfayetteville.com` created and script is receiving pageviews on production
- [ ] Plausible Goals created for all five custom events:
  - `order_toast_click`
  - `directions_click`
  - `catering_submit`
  - `newsletter_subscribe`
  - `phone_click`
- [ ] Uptime monitor configured (Cloudflare Notifications or [BetterUptime](https://betterstack.com/better-uptime)) pinging `/` every 5 minutes with alert to owner email

---

## Owner handoff

- [ ] Owner can navigate to `github.com/[org]/pan-restaurant` and edit a menu item using the GitHub web editor (pen icon on any file)
- [ ] Owner has confirmed they can trigger a redeploy by committing a change via the GitHub UI
- [ ] README has been reviewed by the owner — they understand the content editing workflow
- [ ] Owner has Cloudflare Pages dashboard access
- [ ] Owner has Resend dashboard access (to view subscriber list and email logs)
- [ ] Owner has Plausible dashboard access

---

*Last updated: 2026-05-13*
