// Shared helpers for pulling posts from the liveroof.com WordPress REST API.
// Used both at build time (Astro frontmatter) and at runtime (client script in
// News.astro / news.astro) so the news listing stays current between deploys.

export interface Article {
  title: string;
  link: string;
  date: string;
  excerpt: string;
  image: string;
}

export const FALLBACK_IMG = '/images/wildflower-roof-cityview.jpg';

export function newsApiUrl(limit: number): string {
  return `https://liveroof.com/wp-json/wp/v2/posts?per_page=${limit}&_embed&_fields=title,link,date,excerpt,_links,_embedded`;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
};

function decodeOnce(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** WordPress sometimes double-encodes titles (&amp;#8217;), so decode twice. */
export function decodeEntities(input: string): string {
  return decodeOnce(decodeOnce(input));
}

export function formatDate(raw: string): string {
  if (!raw) return '';
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Only let http(s) URLs through. These values come from a third-party
 * WordPress API and end up in href/src attributes; escaping stops an attribute
 * breakout but not a `javascript:` or `data:` URL, which would still be
 * clickable. Anything else falls back to a safe default.
 */
function safeUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    const { protocol } = new URL(value, 'https://liveroof.com');
    return protocol === 'http:' || protocol === 'https:' ? value : fallback;
  } catch {
    return fallback;
  }
}

export function mapPost(post: any): Article {
  const title = decodeEntities(post?.title?.rendered ?? '');
  const excerptText = decodeEntities(String(post?.excerpt?.rendered ?? '').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
  const excerpt = excerptText.replace(/[….]+$/, '').slice(0, 200);

  return {
    title,
    link: safeUrl(post?.link, 'https://liveroof.com/news/'),
    date: formatDate(post?.date ?? ''),
    excerpt: excerpt ? `${excerpt}...` : '',
    image: safeUrl(post?._embedded?.['wp:featuredmedia']?.[0]?.source_url, FALLBACK_IMG),
  };
}

/** Fetch the newest posts. Returns [] on any failure so the page still renders. */
export async function fetchArticles(limit: number): Promise<Article[]> {
  try {
    const res = await fetch(newsApiUrl(limit));
    if (!res.ok) return [];
    const posts = await res.json();
    return Array.isArray(posts) ? posts.map(mapPost) : [];
  } catch {
    return [];
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Card markup for the client-side refresh. Must stay visually identical to the
 * Astro-rendered card in News.astro / news.astro.
 */
export function renderCard(article: Article): string {
  const title = escapeHtml(article.title);
  const excerpt = article.excerpt
    ? `<p>${escapeHtml(article.excerpt)}</p>`
    : '';

  return `<a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer" class="news-card group block">
  <div class="h-[200px] overflow-hidden">
    <img src="${escapeHtml(article.image)}" alt="${title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
    const articles = await fetchArticles(limit);
    if (!articles.length) continue;

    grid.innerHTML = articles.map(renderCard).join('');
    grid.hidden = false;
    grid.parentElement?.querySelector('[data-news-fallback]')?.remove();
  }
}
