import { defineField, defineType } from 'sanity';

// Validation policy: fields the site genuinely cannot render without are
// errors; fields that merely make a project page thin are warnings. Warnings
// surface the gap in the Studio without blocking an editor from saving an
// unrelated change to an older document — several dozen existing projects are
// missing descriptions, captions and classification fields, and hard-failing
// them would make routine edits impossible.

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Project Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'image',
              title: 'Photo',
              type: 'image',
              options: { hotspot: true },
              validation: (r) => r.required(),
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description:
                'Shown under the photo in the carousel and used as the image alt text. Without it the photo is invisible to screen readers and to image search.',
              validation: (r) =>
                r.required().warning('Add a caption — it becomes the alt text for this photo.'),
            },
            {
              name: 'isMain',
              title: 'Use as thumbnail',
              type: 'boolean',
              initialValue: false,
            },
          ],
          preview: {
            select: { media: 'image', title: 'caption', subtitle: 'isMain' },
            prepare({ media, title, subtitle }) {
              return { media, title: title || 'Photo', subtitle: subtitle ? 'Thumbnail' : '' };
            },
          },
        },
      ],
      validation: (r) => r.min(1).error('A project needs at least one photo.').max(10),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description:
        'Used on the project page and as its search-result description. Aim for at least a sentence or two — short fragments get padded with the spec fields.',
      validation: (r) =>
        r
          .required()
          .min(90)
          .warning('Under ~90 characters this gets padded with the project specs.'),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: (r) => r.required().warning('Used for the location line and the page description.'),
    }),
    defineField({
      name: 'projectSize',
      title: 'Project Size (sq m)',
      type: 'number',
      description: 'Square metres, not square feet — the site renders this value with a "sq m" suffix.',
      validation: (r) =>
        r.positive().error('Size must be greater than zero.').required().warning('Shown in the project spec table.'),
    }),
    defineField({
      name: 'installationDate',
      title: 'Installation Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM-DD' },
      description: 'Undated projects sort to the bottom of the portfolio in both directions.',
      validation: (r) =>
        r
          .max(new Date().toISOString().slice(0, 10))
          .error('Installation date cannot be in the future.')
          .required()
          .warning('Without a date this project sorts to the bottom of the portfolio.'),
    }),
    defineField({
      name: 'grower',
      title: 'Grower',
      type: 'string',
      validation: (r) => r.required().warning('Shown in the project spec table.'),
    }),
    defineField({
      name: 'province',
      title: 'Province',
      type: 'string',
      options: {
        list: [
          { title: 'Ontario', value: 'ON' },
          { title: 'New Brunswick', value: 'NB' },
          { title: 'Newfoundland & Labrador', value: 'NL' },
          { title: 'Nova Scotia', value: 'NS' },
          { title: 'Prince Edward Island', value: 'PE' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'showcaseType',
      title: 'Showcase Type',
      type: 'string',
      options: {
        list: [
          { title: 'Commercial', value: 'commercial' },
          { title: 'Educational', value: 'educational' },
          { title: 'Healthcare', value: 'healthcare' },
          { title: 'Other Institutional', value: 'other-institutional' },
          { title: 'Public', value: 'public' },
          { title: 'Residential', value: 'residential' },
        ],
        layout: 'radio',
      },
      validation: (r) =>
        r.required().warning('Without a type this project is invisible to the "Type" filter.'),
    }),
    defineField({
      name: 'moduleType',
      title: 'Module Type',
      type: 'string',
      options: {
        list: [
          { title: 'LiveRoof Deep System', value: 'deep' },
          { title: 'LiveRoof Lite System', value: 'lite' },
          { title: 'LiveRoof Maxx System', value: 'maxx' },
          { title: 'LiveRoof Standard System', value: 'standard' },
        ],
        layout: 'radio',
      },
      validation: (r) =>
        r.required().warning('Without a module type this project is invisible to the "Module" filter.'),
    }),
    defineField({
      name: 'options',
      title: 'Project Options',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Multiple Plant Mixes in Design', value: 'multiple-plant-mixes' },
          { title: 'Organic Shape Design', value: 'organic-shape' },
          { title: 'RoofStone Pavers on Project', value: 'roofstone-pavers' },
          { title: 'Sloped Roof', value: 'sloped-roof' },
        ],
        layout: 'grid',
      },
    }),
    defineField({
      name: 'leedCertified',
      title: 'LEED Certification',
      type: 'string',
      options: {
        list: [
          { title: 'LEED Certified', value: 'certified' },
          { title: 'LEED Silver', value: 'silver' },
          { title: 'LEED Gold', value: 'gold' },
          { title: 'LEED Platinum', value: 'platinum' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'publicAccess',
      title: 'Public Access',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'retrofit',
      title: 'Retrofit',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'roofBlue',
      title: 'RoofBlue',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'solaGreen',
      title: 'SolaGreen',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'hydropavers',
      title: 'Hydropavers',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'city',
      // There is no top-level `image` field — photos are an array — so the
      // previous `media: 'image'` never resolved and list items showed no
      // thumbnail.
      media: 'photos.0.image',
    },
  },
});
