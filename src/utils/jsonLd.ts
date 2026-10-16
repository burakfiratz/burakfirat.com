export interface SchemaContext {
	siteUrl: string;
	title: string;
	description: string;
	canonicalUrl: string;
	imageUrl: string;
	lang?: string;
	type?: 'website' | 'article';
	publishedTime?: Date;
	modifiedTime?: Date;
	author?: string;
	tags?: string[];
	breadcrumbs?: { name: string; url: string }[];
	customSchema?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const PERSON_SCHEMA = {
	'@type': 'Person',
	'@id': 'https://burakfirat.com/#person',
	name: 'Burak Fırat',
	url: 'https://burakfirat.com',
	jobTitle: 'Team Lead & Software Engineer',
	description:
		'Yazılım mühendisi. E-ticaret, dağıtık sistemler ve backend mimarileri üzerine çalışıyor.',
	sameAs: [
		'https://github.com/burakfiratz',
		'https://linkedin.com/in/burakfiratz',
	],
	knowsAbout: [
		'Software Engineering',
		'Backend Development',
		'System Architecture',
		'E-commerce',
		'Distributed Systems',
		'TypeScript',
		'Astro',
	],
};

export const WEBSITE_SCHEMA = {
	'@type': 'WebSite',
	'@id': 'https://burakfirat.com/#website',
	url: 'https://burakfirat.com/',
	name: 'Burak Fırat',
	description: 'Burak Fırat — yazılım, sistemler, projeler ve öğrendiklerim.',
	publisher: {
		'@id': 'https://burakfirat.com/#person',
	},
	inLanguage: 'tr-TR',
};

export function createBreadcrumbSchema(
	items: { name: string; url: string }[],
	siteUrl = 'https://burakfirat.com',
) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url.startsWith('http')
				? item.url
				: new URL(item.url, siteUrl).toString(),
		})),
	};
}

export function createArticleSchema(ctx: SchemaContext) {
	const publishedIso = ctx.publishedTime
		? ctx.publishedTime.toISOString()
		: new Date().toISOString();
	const modifiedIso = ctx.modifiedTime
		? ctx.modifiedTime.toISOString()
		: publishedIso;

	return {
		'@type': 'BlogPosting',
		'@id': `${ctx.canonicalUrl}#article`,
		isPartOf: {
			'@id': 'https://burakfirat.com/#website',
		},
		headline: ctx.title.replace(/\s*—\s*Burak Fırat$/, ''),
		description: ctx.description,
		url: ctx.canonicalUrl,
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': ctx.canonicalUrl,
		},
		image: [ctx.imageUrl],
		datePublished: publishedIso,
		dateModified: modifiedIso,
		inLanguage: ctx.lang === 'en' ? 'en-US' : 'tr-TR',
		author: {
			'@type': 'Person',
			name: ctx.author || 'Burak Fırat',
			url: 'https://burakfirat.com',
		},
		publisher: {
			'@id': 'https://burakfirat.com/#person',
		},
		...(ctx.tags && ctx.tags.length > 0
			? { keywords: ctx.tags.join(', ') }
			: {}),
	};
}

export function createProjectSchema(
	ctx: SchemaContext,
	extra?: {
		stack?: string[];
		role?: string;
		links?: { label: string; url: string }[];
	},
) {
	return {
		'@type': 'CreativeWork',
		'@id': `${ctx.canonicalUrl}#project`,
		name: ctx.title.replace(/\s*—\s*Burak Fırat$/, ''),
		description: ctx.description,
		url: ctx.canonicalUrl,
		image: [ctx.imageUrl],
		author: {
			'@id': 'https://burakfirat.com/#person',
		},
		creator: {
			'@id': 'https://burakfirat.com/#person',
		},
		...(extra?.stack && extra.stack.length > 0
			? { keywords: extra.stack.join(', ') }
			: {}),
		...(extra?.links && extra.links.length > 0
			? { sameAs: extra.links.map((link) => link.url) }
			: {}),
	};
}

export function generatePageGraph(ctx: SchemaContext) {
	const graph: Record<string, unknown>[] = [WEBSITE_SCHEMA, PERSON_SCHEMA];

	if (ctx.breadcrumbs && ctx.breadcrumbs.length > 0) {
		graph.push(createBreadcrumbSchema(ctx.breadcrumbs, ctx.siteUrl));
	}

	if (ctx.type === 'article') {
		graph.push(createArticleSchema(ctx));
	}

	if (ctx.customSchema) {
		if (Array.isArray(ctx.customSchema)) {
			graph.push(...ctx.customSchema);
		} else {
			graph.push(ctx.customSchema);
		}
	}

	return {
		'@context': 'https://schema.org',
		'@graph': graph,
	};
}
