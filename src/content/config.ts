import { defineCollection, z } from 'astro:content';

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string().default('root'),
    categorySlug: z.string().default('root'),
    subcategory: z.string().optional(),
    subcategorySlug: z.string().optional(),
  }),
});

export const collections = { notes };
