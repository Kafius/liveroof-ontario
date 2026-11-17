// Server-side reader for the liveroof.com news feed.
//
// liveroof.com closed its WordPress REST API to the public (wp-json/wp/v2/posts
// now answers 401 rest_forbidden), so posts come from the public RSS feed
// instead. The feed carries no featured image, so each article page is fetched
// for its og:image. The feed also sends no CORS headers, so this only runs on
// the server: at build time (Astro frontmatter) and in the /api/news function
// that the browser calls to refresh the listing between deploys.
//
// Plain JS (not TS) so the Vercel function in /api can import it as-is.

export const FEED_URL = 'https://liveroof.com/feed/';
export const NEWS_PAGE_URL = 'https://liveroof.com/news/';
export const FALLBACK_IMG = '/images/wildflower-roof-cityview.jpg';

const TIMEOUT_MS = 8000;

const NAMED_ENTITIES = {
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
  reg: '®',
  trade: '™',
  copy: '©',
};

function decodeOnce(input) {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
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

/** WordPress sometimes double-encodes text (&amp;#8217;), so decode twice. */
export function decodeEntities(input) {
  return decodeOnce(decodeOnce(String(input ?? '')));
}

export function formatDate(raw) {
  if (!raw) return '';
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Toronto',
      });
}

/**
 * Only let http(s) URLs through. These values come from a third-party site and
 * end up in href/src attributes; escaping stops an attribute breakout but not a
 * `javascript:` or `data:` URL. Anything else falls back to a safe default.
 */
export function safeUrl(value, fallback) {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    const url = new URL(value, 'https://liveroof.com');
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

/** Contents of the first <tag>…</tag> in `xml`, with any CDATA wrapper removed. */
function tagText(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return '';
  return match[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim();
}

function toExcerpt(descriptionHtml) {
  const text = decodeEntities(
    String(descriptionHtml)
      // Drop WordPress's "The post X appeared first on LiveRoof." footer.
      .replace(/<p>\s*The post [\s\S]*?appeared first on[\s\S]*?<\/p>/i, '')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .replace(/\s*\[(?:…|\.\.\.|&hellip;)\]\s*$/, '')
    .trim();
  if (!text) return '';
  // Cut on a word boundary so cards don't end mid-word.
  let cut = text.slice(0, 200);
  const space = cut.lastIndexOf(' ');
  if (text.length > 200 && space > 120) cut = cut.slice(0, space);
  return `${cut.replace(/[\s,;:….]+$/, '')}...`;
}

/** Parse an RSS 2.0 document into article records (image filled in later). */
export function parseFeed(xml) {
  const items = String(xml).match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return items
    .map((item) => {
      const title = decodeEntities(tagText(item, 'title').replace(/<[^>]*>/g, ''));
      const link = safeUrl(decodeEntities(tagText(item, 'link')), '');
      return {
        title,
        link,
        date: formatDate(tagText(item, 'pubDate')),
        excerpt: toExcerpt(tagText(item, 'description')),
        image: FALLBACK_IMG,
      };
    })
    .filter((a) => a.title && a.link);
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/rss+xml, text/html;q=0.9, */*;q=0.8' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.text();
}

/** og:image of an article page, or the fallback if it can't be read. */
export async function fetchOgImage(link) {
  try {
    const html = await fetchText(link);
    const tag =
      html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i)?.[0] ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]*>/i)?.[0];
    const content = tag?.match(/content=["']([^"']+)["']/i)?.[1];
    return safeUrl(content ? decodeEntities(content) : '', FALLBACK_IMG);
  } catch {
    return FALLBACK_IMG;
  }
}

/**
 * Newest `limit` posts with images. Returns [] on any failure so pages still
 * render. Never call this from the browser — liveroof.com sends no CORS headers.
 */
export async function fetchArticles(limit) {
  try {
    const articles = parseFeed(await fetchText(FEED_URL)).slice(0, limit);
    const images = await Promise.all(articles.map((a) => fetchOgImage(a.link)));
    return articles.map((a, i) => ({ ...a, image: images[i] }));
  } catch (err) {
    console.warn('[news] could not load the liveroof.com feed:', err?.message ?? err);
    return [];
  }
}
