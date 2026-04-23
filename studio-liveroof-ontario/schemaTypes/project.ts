import { defineField, defineType } from 'sanity';

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
      validation: (r) => r.max(10),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
    }),
    defineField({
      name: 'projectSize',
      title: 'Project Size (sq m)',
      type: 'number',
    }),
    defineField({
      name: 'installationDate',
      title: 'Installation Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM-DD' },
    }),
    defineField({
      name: 'grower',
      title: 'Grower',
      type: 'string',
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
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'province',
      media: 'image',
    },
  },
});
