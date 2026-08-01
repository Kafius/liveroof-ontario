# LiveRoof Ontario — Website

Marketing site for LiveRoof Ontario, Canada's largest producer of pre-vegetated
modular green roof systems. Static Astro site deployed on Vercel to
<https://www.liveroofontario.ca>.

## Stack

| | |
|---|---|
| Framework | [Astro](https://astro.build) 7 — static output, no adapter |
| Styling | Tailwind CSS 3 via `@astrojs/tailwind`, plus `src/styles/global.css` |
| CMS | [Sanity](https://sanity.io) — portfolio projects only |
| Sitemap | `@astrojs/sitemap` |

## Repository layout

This repo holds **two** npm projects. They are installed and run separately —
there is no workspace configuration.

```
.                          # the Astro website
├── src/
│   ├── components/        # presentational .astro components
│   ├── layouts/Layout.astro   # <head>, SEO meta, external-link interstitial
│   ├── lib/
│   │   ├── sanity.ts      # Sanity client + PROJECTS_QUERY + SanityProject type
│   │   └── news.ts        # liveroof.com WordPress REST helpers
│   ├── pages/             # file-based routes
│   └── styles/global.css
├── public/images/         # served verbatim — see "Images" below
├── scripts/               # one-off maintenance scripts
└── studio-liveroof-ontario/   # ← separate project: the Sanity Studio
```

## Getting started

```bash
npm install
cp .env.example .env      # then fill in the Sanity project id
npm run dev               # http://localhost:4321
```

### Environment variables

Both are `PUBLIC_`-prefixed because the Sanity CDN is queried directly. See
`.env.example`.

| Variable | Notes |
|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Sanity project id — **required**, the build fails without it |
| `PUBLIC_SANITY_DATASET` | Defaults to `production` if unset |
| `PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 id. Optional — analytics is skipped entirely when unset. See [Analytics](#analytics) |

## Routes

Local pages: `/`, `/about`, `/benefits`, `/contact`, `/faq`, `/news`,
`/portfolio`, `/privacy`, `/products`, `/products/hydropavers`, `/technical`,
plus `/portfolio/[slug]` generated from Sanity (~87 pages) and a `/404`.

**Product and technical detail pages live on the LiveRoof Global site**
(`liveroof.com`), not here. The Header and Footer link out to them, and
`Layout.astro` intercepts clicks to `liveroof.com` / `hydropavers.ca` with a
"you are leaving this site" interstitial. When adding a nav item, check whether
the destination exists locally before writing a relative href.

## Sanity Studio

The Studio is a standalone project in `studio-liveroof-ontario/`:

```bash
cd studio-liveroof-ontario
npm install
npm run dev       # local studio
npm run deploy    # deploy to Sanity's hosted studio
```

The `project` schema in `studio-liveroof-ontario/schemaTypes/` is the single
source of truth. The website consumes it through the hand-written
`SanityProject` interface and `PROJECTS_QUERY` in `src/lib/sanity.ts` — **if you
change a schema field, update that file to match.**

## Images

Everything in `public/` is copied to the build verbatim; it does **not** pass
through Astro's image pipeline. Source photos arrive at 5000–6000px and 8–15 MB,
so they must be optimized before committing.

```bash
npm run optimize:images:dry   # report what would change
npm run optimize:images       # resize to max 2400px + re-encode, in place
```

The script is idempotent (it keeps the original whenever re-encoding would make
a file larger) and preserves each file's extension so existing
`src="/images/…"` references keep working.

**Add `loading="lazy"` to any new content image.** No hero on this site contains
an `<img>`, so the only image that should load eagerly is the header logo.

## Video

The homepage hero loop is re-encoded by `npm run optimize:video` (720p, CRF 32,
24fps, audio stripped — the element is muted). It also writes
`media1-poster.jpg`, which the `<video>` uses as its `poster` so the hero paints
before the clip downloads. Run it with `--replace` to overwrite the original;
without the flag it writes alongside so you can compare first.

## Caching

`vercel.json` sets `Cache-Control` for `public/` assets. They are **not**
content-hashed, so they can't be cached immutably — `stale-while-revalidate`
serves instantly from cache while refreshing in the background. Astro's own
`/_astro/` bundles are hashed and Vercel already gives them a year.

## Scripts

| Command | Purpose |
|---|---|
| `npm run optimize:images` | Resize + re-encode `public/images` in place |
| `npm run seed:projects` | Seed portfolio projects into Sanity |
| `npm run generate:pdfs` | Render PDFs via Puppeteer |

## Structured data

JSON-LD is built in `src/lib/structuredData.ts` and emitted as
`<script type="application/ld+json">`. That is a *data block*, never executed,
so the strict `script-src 'self'` CSP does not apply to it (verified in a
browser with the policy active).

| Schema | Where | Count |
|---|---|---|
| `LocalBusiness` + `WebSite` | homepage only; other pages reference it by `@id` | 1 each |
| `BreadcrumbList` | `PageHero` (9 pages), the About page, and every project page | 90 |

`PageHero` emits its own breadcrumb markup from the same `breadcrumbs` prop it
renders visibly, so the two cannot drift apart. The About page and
`portfolio/[slug].astro` build their trails by hand and declare their JSON-LD
locally — **if you change those visible trails, update the JSON-LD beside
them.**

The business details are deliberately limited to facts that appear on the site.
There are no opening hours, `sameAs` social profiles, or ratings, because the
site does not have them — inventing them would be worse than omitting them. If
the client provides social profiles or hours, add them in
`structuredData.ts`.

## Analytics

Google Analytics 4, wired up in `src/components/Analytics.astro` and rendered
from `Layout.astro`.

Set `PUBLIC_GA_MEASUREMENT_ID` (e.g. `G-XXXXXXXXXX`) to enable it. **With the
variable unset nothing is loaded at all** — no script tag, no `dataLayer`, no
requests — so local dev and preview deploys stay untracked without any extra
configuration. Set it in Vercel under Project Settings → Environment Variables,
scoped to Production only if you want previews to remain untracked.

Two things differ from Google's copy-paste snippet:

- The `dataLayer` bootstrap lives in a **bundled** script, not an inline one.
  The CSP uses `script-src 'self'`, which blocks inline scripts; Vite
  substitutes `import.meta.env.PUBLIC_GA_MEASUREMENT_ID` at build time so the
  ID still reaches the client.
- The CSP already allows the origins GA needs — `googletagmanager.com` in
  `script-src`, and `google-analytics.com` / `*.analytics.google.com` in
  `connect-src` and `img-src`. Swapping to a different analytics vendor means
  updating those.

### Consent

`ConsentBanner.astro` implements **Google Consent Mode v2**. Everything starts
denied, so GA cannot write cookies before the visitor chooses; the banner sends
the `consent update` and stores the answer in `localStorage` under
`lr-consent`. Reject is given equal visual weight to Accept, which GDPR
requires. The banner only renders when `PUBLIC_GA_MEASUREMENT_ID` is set —
with no analytics there is nothing to consent to.

**Ordering matters here.** The `gtag.js` loader is injected by the bundled
script *after* the consent defaults are queued, rather than sitting in the
markup as an async tag. An async tag in the head can evaluate before a deferred
module, and when it does GA writes `_ga` cookies before consent is declared —
this was verified failing, then fixed. If you ever move the loader back into
the markup, that bug returns.

Verified end to end in a browser: no cookies at all while denied, cookies only
after Accept, none after Reject, and the choice persists across pages without
re-prompting.

## Security headers

`vercel.json` sets a Content-Security-Policy alongside the usual hardening
headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`).

The CSP uses a plain `script-src 'self'`, which only works because
`astro.config.mjs` sets `vite.build.assetsInlineLimit: 0`. Otherwise Astro
inlines small bundled scripts into the HTML, and the policy would need
per-build `sha256` hashes that go stale silently whenever a script changes.
**If you re-enable script inlining, the CSP will start blocking the site's own
JavaScript.**

Origins the policy allows:

| Origin | Why |
|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` | webfonts |
| `cdn.sanity.io` | portfolio project photos |
| `liveroof.com` | news feed images, and the API the client-side refresh fetches |
| `googletagmanager.com` | the GA4 loader (`script-src`) |
| `google-analytics.com`, `*.analytics.google.com` | GA4 hit collection (`connect-src`, `img-src`) |
| `formspree.io` | `form-action` for the contact form |

Adding a new third-party service means adding it here too, or the browser will
block it.

## Notes

- `.npmrc` sets `legacy-peer-deps=true` to unblock installs on Vercel. This
  masks an unresolved peer-dependency conflict rather than fixing it.
