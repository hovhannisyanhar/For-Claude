import {continueRender, delayRender, staticFile} from 'remotion';

const LATIN =
	'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const CYRILLIC = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';

const FACES: Array<{family: string; file: string; weight: number; style?: 'normal' | 'italic'}> = [
	...[700, 800, 900].map((w) => ({family: 'Unbounded', file: 'unbounded', weight: w})),
	...[500, 600, 700, 800].map((w) => ({family: 'Manrope', file: 'manrope', weight: w})),
	// стиль «Хроника»
	...[500, 700].map((w) => ({family: 'Oswald', file: 'oswald', weight: w})),
	{family: 'PT Mono', file: 'pt-mono', weight: 400},
	...[700, 900].map((w) => ({family: 'Playfair Display', file: 'playfair-display', weight: w})),
	{family: 'Caveat', file: 'caveat', weight: 700},
	// стиль «Кино»: шрифтовая пара + рукописный
	...[500, 600, 700].flatMap((w) =>
		(['normal', 'italic'] as const).map((st) => ({family: 'Cormorant Garamond', file: 'cormorant-garamond', weight: w, style: st})),
	),
	{family: 'Great Vibes', file: 'great-vibes', weight: 400},
	{family: 'Marck Script', file: 'marck-script', weight: 400},
	// обложка для Instagram
	{family: 'Montserrat', file: 'montserrat', weight: 300},
];

let started = false;

export const loadFonts = () => {
	if (started || typeof window === 'undefined') return;
	started = true;
	const handle = delayRender('Loading fonts');
	const loads: Promise<unknown>[] = [];
	for (const f of FACES) {
		for (const [subset, range] of [
			['latin', LATIN],
			['cyrillic', CYRILLIC],
		] as const) {
			const face = new FontFace(
				f.family,
				`url(${staticFile(`fonts/${f.file}-${subset}-${f.weight}-${f.style ?? 'normal'}.woff2`)}) format('woff2')`,
				{weight: String(f.weight), style: f.style ?? 'normal', unicodeRange: range},
			);
			document.fonts.add(face);
			loads.push(face.load());
		}
	}
	Promise.all(loads)
		.catch((e) => console.error('Font load failed', e))
		.finally(() => continueRender(handle));
};
