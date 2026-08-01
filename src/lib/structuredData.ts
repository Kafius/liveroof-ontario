// JSON-LD builders. Kept out of the components so the breadcrumb shape is
// defined once and the business details are not retyped per page.
//
// Emitted as <script type="application/ld+json">. That is a data block, not
// executable JS, so the strict script-src 'self' CSP does not apply to it.

export const SITE_URL = 'https://www.liveroofontario.ca';

/** Stable @id so other nodes can reference the organisation instead of repeating it. */
export const ORG_ID = `${SITE_URL}/#organization`;

/**
 * The business itself. Only facts that appear on the site are included —
 * no opening hours, no social profiles, no ratings, because we do not have
 * them and inventing them would be worse than omitting them.
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': ORG_ID,
    name: 'LiveRoof Ontario',
    description:
      'Canada’s largest producer of pre-vegetated modular green roof systems, grown on our southwestern Ontario nursery farm and delivered to the roof fully mature.',
    url: SITE_URL,
    logo: `${SITE_URL}/logo-no-tagline.svg`,
    image: `${SITE_URL}/images/wildflower-roof-cityview.jpg`,
    telephone: '+1-519-671-5777',
    email: 'kees@liveroofontario.ca',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '23078 Adelaide Road',
      addressLocality: 'Mt. Brydges',
      addressRegion: 'ON',
      postalCode: 'N0L 1W0',
      addressCountry: 'CA',
    },
    areaServed: {
      '@type': 'State',
      name: 'Ontario',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'LiveRoof Global, LLC',
      url: 'https://liveroof.com',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'LiveRoof Ontario',
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-CA',
  };
}

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail. The final crumb is the current page and carries no href,
 * which matches how PageHero renders it.
 */
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: new URL(crumb.href, SITE_URL).href } : {}),
    })),
  };
}
