import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const menu = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/menu' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      slug: z.string(),
      category: z.enum([
        'specialty-sandwich',
        'panini',
        'breakfast',
        'soup',
        'salad',
        'side',
        'dessert',
        'beverage',
        'retail',
      ]),
      description: z.string(),
      ingredients: z.array(z.string()),
      /** null = price TBD; render as "Market" or "Ask" */
      price: z.string().nullable(),
      /** Half/full sizing; omit when item has a single size */
      sizes: z
        .array(z.object({ label: z.string(), price: z.string() }))
        .optional(),
      dietary: z
        .array(
          z.enum([
            'vegetarian',
            'vegan',
            'gluten-free-option',
            'spicy',
            'contains-nuts',
            'contains-dairy',
          ])
        )
        .optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      availability: z
        .enum(['always', 'seasonal', 'weekends', 'limited-time'])
        .default('always'),
    }),
});

const press = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/press' }),
  schema: z.object({
    title: z.string(),
    publication: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
    excerpt: z.string(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { menu, press };
