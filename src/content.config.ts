import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			lang: z.enum(['tr', 'en']),
			heroImage: image().optional(),
			heroImageAlt: z.string().optional(),
			tags: z.array(z.string()).default([]),
			author: z.string().default('Burak Fırat'),
			draft: z.boolean().default(false),
			featured: z.boolean().default(false),
			canonicalUrl: z.string().url().optional(),
		}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			summary: z.string().optional(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date().optional(),
			ongoing: z.boolean().default(false),
			cover: image(),
			coverAlt: z.string(),
			stack: z.array(z.string()).default([]),
			role: z.string().optional(),
			links: z
				.array(
					z.object({
						label: z.string(),
						url: z.string().url(),
					}),
				)
				.default([]),
			featured: z.boolean().default(false),
			order: z.number().optional(),
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog, projects };
