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
| `PUBLIC_SANITY_PROJECT_ID` | Sanity project id |
| `PUBLIC_SANITY_DATASET` | Defaults to `production` if unset |

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

## Scripts

| Command | Purpose |
|---|---|
| `npm run optimize:images` | Resize + re-encode `public/images` in place |
| `npm run seed:projects` | Seed portfolio projects into Sanity |
| `npm run generate:pdfs` | Render PDFs via Puppeteer |

## Notes

- `.npmrc` sets `legacy-peer-deps=true` to unblock installs on Vercel. This
  masks an unresolved peer-dependency conflict rather than fixing it.
