import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

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
  province: 'ON' | 'NB' | 'NL' | 'NS' | 'PE';
  showcaseType?: 'commercial' | 'educational' | 'healthcare' | 'other-institutional' | 'public' | 'residential';
  moduleType?: 'deep' | 'lite' | 'maxx' | 'standard';
  options?: ('multiple-plant-mixes' | 'organic-shape' | 'roofstone-pavers' | 'sloped-roof')[];
  leedCertified?: 'certified' | 'silver' | 'gold' | 'platinum';
  publicAccess: boolean;
  active: boolean;
  retrofit: boolean;
  roofBlue: boolean;
  solaGreen: boolean;
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
  solaGreen
}`;
