// GET /api/news?limit=N — latest liveroof.com posts as JSON for the browser.
//
// The browser can't read liveroof.com's feed directly (no CORS headers), so
// this function fetches it server-side. The CDN caches the response for an
// hour and serves the stale copy for up to a day while it refreshes, so
// liveroof.com is hit at most about once an hour per limit value.

import { fetchArticles } from '../src/lib/feed.js';

const MAX_LIMIT = 10; // the feed only carries the 10 newest posts

export async function GET(request) {
  const requested = Number(new URL(request.url).searchParams.get('limit'));
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : 3;

  const articles = await fetchArticles(limit);

  return Response.json(
    { articles },
    {
      headers: {
        // Don't cache an empty result for long, so a liveroof.com blip
        // doesn't blank the section for a whole day.
        'Cache-Control': articles.length
          ? 'public, s-maxage=3600, stale-while-revalidate=86400'
          : 'public, s-maxage=60',
      },
    },
  );
}
