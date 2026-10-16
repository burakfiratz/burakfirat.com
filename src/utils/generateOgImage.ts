import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Cache font buffers in memory
let frauncesFont: Buffer | null = null;
let interFont: Buffer | null = null;
let jetbrainsMonoFont: Buffer | null = null;

function loadFonts() {
	if (!frauncesFont) {
		frauncesFont = fs.readFileSync(
			path.resolve(
				'./node_modules/@fontsource/fraunces/files/fraunces-latin-ext-600-normal.woff',
			),
		);
	}
	if (!interFont) {
		interFont = fs.readFileSync(
			path.resolve(
				'./node_modules/@fontsource/inter/files/inter-latin-ext-400-normal.woff',
			),
		);
	}
	if (!jetbrainsMonoFont) {
		jetbrainsMonoFont = fs.readFileSync(
			path.resolve(
				'./node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-ext-400-normal.woff',
			),
		);
	}

	return [
		{
			name: 'Fraunces',
			data: frauncesFont,
			weight: 600 as const,
			style: 'normal' as const,
		},
		{
			name: 'Inter',
			data: interFont,
			weight: 400 as const,
			style: 'normal' as const,
		},
		{
			name: 'JetBrains Mono',
			data: jetbrainsMonoFont,
			weight: 400 as const,
			style: 'normal' as const,
		},
	];
}

export interface OgImageOptions {
	title: string;
	description?: string;
	badge?: string;
	tags?: string[];
	metaText?: string;
}

export async function generateOgImage({
	title,
	description,
	badge = 'BURAK FIRAT',
	tags = [],
	metaText,
}: OgImageOptions): Promise<Buffer> {
	const fonts = loadFonts();

	// Truncate long descriptions for aesthetic balance
	const cleanDescription =
		description && description.length > 150
			? `${description.slice(0, 147)}...`
			: description;

	// Pick up to 4 tags
	const displayTags = tags.slice(0, 4);

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					width: '100%',
					height: '100%',
					padding: '52px',
					backgroundColor: '#17181B',
					backgroundImage:
						'radial-gradient(circle at 10% 20%, rgba(226, 105, 79, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(226, 105, 79, 0.05) 0%, transparent 40%)',
					color: '#EDEBE6',
					fontFamily: 'Inter',
				},
				children: [
					// Outer framed card
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
								width: '100%',
								height: '100%',
								padding: '44px 48px',
								borderRadius: '20px',
								border: '1px solid #303236',
								backgroundColor: 'rgba(28, 29, 33, 0.85)',
							},
							children: [
								// Top Header Row
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											width: '100%',
										},
										children: [
											{
												type: 'div',
												props: {
													style: {
														display: 'flex',
														alignItems: 'center',
														gap: '12px',
													},
													children: [
														{
															type: 'div',
															props: {
																style: {
																	width: '12px',
																	height: '12px',
																	borderRadius: '50%',
																	backgroundColor: '#E2694F',
																},
															},
														},
														{
															type: 'span',
															props: {
																style: {
																	fontFamily: 'JetBrains Mono',
																	fontSize: '17px',
																	fontWeight: 600,
																	letterSpacing: '0.08em',
																	textTransform: 'uppercase',
																	color: '#EDEBE6',
																},
																children: badge,
															},
														},
													],
												},
											},
											metaText
												? {
														type: 'span',
														props: {
															style: {
																fontFamily: 'JetBrains Mono',
																fontSize: '15px',
																color: '#9A9BA3',
															},
															children: metaText,
														},
													}
												: {
														type: 'span',
														props: {
															style: {
																fontFamily: 'JetBrains Mono',
																fontSize: '15px',
																color: '#9A9BA3',
															},
															children: 'burakfirat.com',
														},
													},
										],
									},
								},

								// Middle Content (Title + Description)
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											flexDirection: 'column',
											gap: '20px',
											marginTop: 'auto',
											marginBottom: 'auto',
											paddingTop: '20px',
											paddingBottom: '20px',
										},
										children: [
											{
												type: 'h1',
												props: {
													style: {
														fontFamily: 'Fraunces',
														fontSize: title.length > 50 ? '48px' : '56px',
														fontWeight: 600,
														lineHeight: 1.15,
														letterSpacing: '-0.02em',
														color: '#EDEBE6',
														margin: 0,
													},
													children: title,
												},
											},
											cleanDescription
												? {
														type: 'p',
														props: {
															style: {
																fontFamily: 'Inter',
																fontSize: '22px',
																lineHeight: 1.45,
																color: '#9A9BA3',
																margin: 0,
															},
															children: cleanDescription,
														},
													}
												: null,
										].filter(Boolean),
									},
								},

								// Bottom Footer Row
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											width: '100%',
											paddingTop: '20px',
											borderTop: '1px solid #303236',
										},
										children: [
											// Tags list
											{
												type: 'div',
												props: {
													style: {
														display: 'flex',
														alignItems: 'center',
														gap: '10px',
													},
													children:
														displayTags.length > 0
															? displayTags.map((tag) => ({
																	type: 'span',
																	props: {
																		style: {
																			display: 'flex',
																			alignItems: 'center',
																			padding: '5px 12px',
																			borderRadius: '6px',
																			backgroundColor: '#25272C',
																			border: '1px solid #383A40',
																			color: '#EDEBE6',
																			fontFamily: 'JetBrains Mono',
																			fontSize: '13px',
																			letterSpacing: '0.02em',
																		},
																		children: `#${tag}`,
																	},
																}))
															: [
																	{
																		type: 'span',
																		props: {
																			style: {
																				color: '#9A9BA3',
																				fontFamily: 'Inter',
																				fontSize: '15px',
																			},
																			children:
																				'Yazılım, Sistemler ve Tasarım',
																		},
																	},
																],
												},
											},

											// Site URL indicator
											{
												type: 'div',
												props: {
													style: {
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														fontFamily: 'JetBrains Mono',
														fontSize: '15px',
														color: '#E2694F',
													},
													children: 'burakfirat.com',
												},
											},
										],
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: 1200,
			height: 630,
			fonts,
		},
	);

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: 'width',
			value: 1200,
		},
	});

	const pngData = resvg.render();
	return pngData.asPng();
}
