// News listing helpers. Posts come from the liveroof.com RSS feed (see
// ./feed.js): fetched at build time in Astro frontmatter, and refreshed in the
// browser through our own /api/news function, because liveroof.com's feed
// sends no CORS headers and its REST API is now closed to the public.

import { fetchArticles as fetchFeedArticles, FALLBACK_IMG } from './feed.js';

export interface Article {
  title: string;
  link: string;
  date: string;
  excerpt: string;
  image: string;
}

export { FALLBACK_IMG };

/** Build-time fetch (server only). Returns [] on any failure. */
export function fetchArticles(limit: number): Promise<Article[]> {
  return fetchFeedArticles(limit);
}

/** Browser-side fetch through /api/news. Returns [] on any failure. */
async function fetchLiveArticles(limit: number): Promise<Article[]> {
  try {
    const res = await fetch(`/api/news?limit=${limit}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.articles) ? data.articles : [];
  } catch {
    return [];
  }
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Same check as feed.js: only http(s) URLs reach href/src. */
function safeUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    const { protocol } = new URL(value, window.location.origin);
    return protocol === 'http:' || protocol === 'https:' ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Card markup for the client-side refresh. Must stay visually identical to the
 * Astro-rendered card in News.astro / news.astro.
 */
export function renderCard(article: Article): string {
  const title = escapeHtml(article.title);
  const excerpt = article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : '';
  const link = safeUrl(article.link, 'https://liveroof.com/news/');
  const image = safeUrl(article.image, FALLBACK_IMG);

  return `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="news-card group block">
  <div class="h-[200px] overflow-hidden">
    <img src="${escapeHtml(image)}" alt="${title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
  </div>
  <div class="news-card-body p-6">
    <div class="news-date">${escapeHtml(article.date)}</div>
    <h3 class="group-hover:text-blue transition-colors">${title}</h3>
    ${excerpt}
    <span class="news-read">Read Article &rarr;</span>
  </div>
</a>`;
}

/**
 * Refresh every `[data-news-grid]` on the page with live posts. Leaves the
 * build-time markup untouched if the API is unreachable.
 */
export async function refreshNewsGrids(): Promise<void> {
  const grids = document.querySelectorAll<HTMLElement>('[data-news-grid]');
  if (!grids.length) return;

  for (const grid of grids) {
    const limit = Number(grid.dataset.newsLimit) || 3;
    const articles = await fetchLiveArticles(limit);
    if (!articles.length) continue;

    grid.innerHTML = articles.map(renderCard).join('');
    grid.hidden = false;
    grid.parentElement?.querySelector('[data-news-fallback]')?.remove();
  }
}
