import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
	generateOgImage,
	type OgImageOptions,
} from '../../utils/generateOgImage';

export async function getStaticPaths() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	const projects = await getCollection('projects', ({ data }) => !data.draft);

	const postRoutes = posts.map((post) => {
		const readingMinutes = Math.max(
			1,
			Math.round((post.body ?? '').split(/\s+/).length / 200),
		);

		return {
			params: { slug: `blog/${post.id}` },
			props: {
				title: post.data.title,
				description: post.data.description,
				badge: 'BLOG YAZISI',
				tags: post.data.tags,
				metaText: `${readingMinutes} dk okuma`,
			} satisfies OgImageOptions,
		};
	});

	const projectRoutes = projects.map((project) => ({
		params: { slug: `projects/${project.id}` },
		props: {
			title: project.data.title,
			description: project.data.description,
			badge: 'PROJE',
			tags: project.data.stack,
			metaText: project.data.ongoing
				? 'Devam ediyor'
				: `${project.data.startDate.getFullYear()}`,
		} satisfies OgImageOptions,
	}));

	const staticRoutes = [
		{
			params: { slug: 'index' },
			props: {
				title: 'Burak Fırat — Yazılım Mühendisi',
				description:
					'Yazılım mimarileri, açık kaynak projeler, dağıtık sistemler ve öğrendiklerim.',
				badge: 'BURAK FIRAT',
				tags: ['Software', 'Architecture', 'TypeScript', 'Web'],
				metaText: 'burakfirat.com',
			} satisfies OgImageOptions,
		},
		{
			params: { slug: 'default' },
			props: {
				title: 'Burak Fırat — Yazılım Mühendisi',
				description:
					'Yazılım mimarileri, açık kaynak projeler, dağıtık sistemler ve öğrendiklerim.',
				badge: 'BURAK FIRAT',
				tags: ['Software', 'Architecture', 'TypeScript', 'Web'],
				metaText: 'burakfirat.com',
			} satisfies OgImageOptions,
		},
		{
			params: { slug: 'blog' },
			props: {
				title: 'Yazılar & Notlar',
				description:
					'Yazılım mimarisi, mühendislik pratikleri ve modern web teknolojileri üzerine yazılar.',
				badge: 'BLOG',
				tags: ['Mühendislik', 'Mimari', 'Rehber'],
				metaText: 'burakfirat.com/blog',
			} satisfies OgImageOptions,
		},
		{
			params: { slug: 'projects' },
			props: {
				title: 'Projeler & Çalışmalar',
				description:
					'Geliştirdiğim açık kaynak kütüphaneler, araçlar ve mühendislik projeleri.',
				badge: 'PROJELER',
				tags: ['Açık Kaynak', 'Araçlar', 'Sistemler'],
				metaText: 'burakfirat.com/projects',
			} satisfies OgImageOptions,
		},
		{
			params: { slug: 'about' },
			props: {
				title: 'Hakkımda — Burak Fırat',
				description:
					'Yazılım mühendisliği kariyerim, tecrübelerim ve ilgi alanlarım.',
				badge: 'HAKKIMDA',
				tags: ['Kariyer', 'Mühendislik', 'Biyografi'],
				metaText: 'burakfirat.com/about',
			} satisfies OgImageOptions,
		},
	];

	return [...postRoutes, ...projectRoutes, ...staticRoutes];
}

export const GET: APIRoute = async ({ props }) => {
	const pngBuffer = await generateOgImage(props as OgImageOptions);

	return new Response(new Uint8Array(pngBuffer), {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
};
