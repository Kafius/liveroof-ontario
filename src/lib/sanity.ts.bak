import { createClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;

// Without this the client throws "Configuration must contain `projectId`",
// which does not say which variable is missing or where to set it. The whole
// portfolio (~87 pages) is built from Sanity, so failing here with a usable
// message beats failing later with a vague one.
if (!projectId) {
  throw new Error(
    'PUBLIC_SANITY_PROJECT_ID is not set, so the portfolio pages cannot be built. ' +
      'Locally: copy .env.example to .env and fill it in. ' +
      'On Vercel: add it under Project Settings > Environment Variables.',
  );
}

const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
});

// These unions mirror the option lists in
// studio-liveroof-ontario/schemaTypes/project.ts. The label maps below are
// keyed by them, so adding a value to the schema without adding a label is a
// build error rather than a raw enum string leaking into the page.
export type Province = 'ON' | 'NB' | 'NL' | 'NS' | 'PE';
export type ShowcaseType =
  | 'commercial'
  | 'educational'
  | 'healthcare'
  | 'other-institutional'
  | 'public'
  | 'residential';
export type ModuleType = 'deep' | 'lite' | 'maxx' | 'standard';
export type ProjectOption =
  | 'multiple-plant-mixes'
  | 'organic-shape'
  | 'roofstone-pavers'
  | 'sloped-roof';
export type LeedLevel = 'certified' | 'silver' | 'gold' | 'platinum';

export const provinceLabels: Record<Province, string> = {
  ON: 'Ontario',
  NB: 'New Brunswick',
  NL: 'Newfoundland & Labrador',
  NS: 'Nova Scotia',
  PE: 'Prince Edward Island',
};

export const showcaseLabels: Record<ShowcaseType, string> = {
  commercial: 'Commercial',
  educational: 'Educational',
  healthcare: 'Healthcare',
  'other-institutional': 'Other Institutional',
  public: 'Public',
  residential: 'Residential',
};

export const moduleLabels: Record<ModuleType, string> = {
  deep: 'LiveRoof Deep System',
  lite: 'LiveRoof Lite System',
  maxx: 'LiveRoof Maxx System',
  standard: 'LiveRoof Standard System',
};

export const leedLabels: Record<LeedLevel, string> = {
  certified: 'LEED Certified',
  silver: 'LEED Silver',
  gold: 'LEED Gold',
  platinum: 'LEED Platinum',
};

export const optionLabels: Record<ProjectOption, string> = {
  'multiple-plant-mixes': 'Multiple Plant Mixes',
  'organic-shape': 'Organic Shape Design',
  'roofstone-pavers': 'RoofStone Pavers',
  'sloped-roof': 'Sloped Roof',
};

export interface SanityProject {
  _id: string;
  name: string;
  slug: { current: string };
  photos?: { image: { asset: { url: string }; hotspot?: { x: number; y: number } }; caption?: string; isMain?: boolean }[];
  description?: string;
  city?: string;
  projectSize?: number;
  installationDate?: string;
  grower?: string;
  province: Province;
  showcaseType?: ShowcaseType;
  moduleType?: ModuleType;
  options?: ProjectOption[];
  leedCertified?: LeedLevel;
  publicAccess: boolean;
  active: boolean;
  retrofit: boolean;
  roofBlue: boolean;
  solaGreen: boolean;
  hydropavers: boolean;
}

export const PROJECTS_QUERY = `*[_type == "project"] | order(name asc) {
  _id,
  name,
  slug,
  "photos": photos[] { "image": image { "asset": asset-> { url }, hotspot }, caption, isMain },
  description,
  city,
  projectSize,
  installationDate,
  grower,
  province,
  showcaseType,
  moduleType,
  options,
  leedCertified,
  publicAccess,
  active,
  retrofit,
  roofBlue,
  solaGreen,
  hydropavers
}`;

/**
 * Fetch the project list.
 *
 * The raw client throws a bare API error here — "Dataset \"production\" not
 * found for project ID ..." with a stack trace pointing into node_modules,
 * which does not say that the *build* just lost 80 pages or what to check.
 * Failing the build is right (deploying a portfolio with zero projects would
 * be worse), but it should say why.
 */
export async function fetchProjects(): Promise<SanityProject[]> {
  try {
    return await sanityClient.fetch<SanityProject[]>(PROJECTS_QUERY);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      [
        'Could not load projects from Sanity, so the portfolio pages cannot be built.',
        `  project: ${projectId}`,
        `  dataset: ${dataset}`,
        `  cause:   ${detail}`,
        'Check the project id and dataset, and that the dataset is readable without a',
        'token — the site queries it anonymously at build time.',
      ].join('\n'),
      { cause },
    );
  }
}
