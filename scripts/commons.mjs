// Поиск и загрузка изображений с Wikimedia Commons с сохранением лицензии.
//   Поиск:    npm run img -- search "Bill Bowerman" [--limit=8]
//   Загрузка: npm run img -- get <slug> "File:Name.jpg" [--as=bowerman] [--width=1200]
// Скачанное: public/assets/<slug>/<as>.<ext>, лицензии → public/assets/<slug>/credits.json
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, flag} from './lib.mjs';

const UA = 'FactVideoFactory/1.0 (educational short videos)';
const API = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (params, tries = 4) => {
	const url = `${API}?${new URLSearchParams({format: 'json', origin: '*', ...params})}`;
	for (let i = 0; i < tries; i++) {
		const res = await fetch(url, {headers: {'User-Agent': UA}}).catch(() => null);
		if (!res || res.status === 429) {
			await sleep(10000 * (i + 1));
			continue;
		}
		if (!res.ok) throw new Error(`Commons ${res.status}`);
		return res.json();
	}
	throw new Error('Commons: слишком много запросов, повторите позже');
};

const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const infoProps = {
	prop: 'imageinfo',
	iiprop: 'url|size|extmetadata|mime',
	iiextmetadatafilter: 'LicenseShortName|Artist|DateTimeOriginal|ImageDescription|UsageTerms|AttributionRequired',
};

const describe = (p) => {
	const ii = p.imageinfo?.[0];
	if (!ii) return null;
	const m = ii.extmetadata ?? {};
	return {
		title: p.title,
		license: strip(m.LicenseShortName?.value) || '?',
		artist: strip(m.Artist?.value).slice(0, 80),
		date: strip(m.DateTimeOriginal?.value).slice(0, 30),
		desc: strip(m.ImageDescription?.value).slice(0, 140),
		size: `${ii.width}x${ii.height}`,
		mime: ii.mime,
		url: ii.url,
		page: ii.descriptionurl,
	};
};

const [cmd, ...rest] = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (cmd === 'search') {
	const q = rest.join(' ');
	const d = await api({
		action: 'query',
		generator: 'search',
		gsrsearch: `${q} filetype:bitmap`,
		gsrnamespace: '6',
		gsrlimit: String(flag('limit', 8)),
		...infoProps,
	});
	const pages = Object.values(d.query?.pages ?? {}).sort((a, b) => a.index - b.index);
	for (const p of pages) {
		const x = describe(p);
		if (!x) continue;
		console.log(`\n${x.title}\n  ${x.license} · ${x.size} · ${x.artist} · ${x.date}\n  ${x.desc}`);
	}
	if (!pages.length) console.log('Ничего не найдено');
} else if (cmd === 'get') {
	const [slug, title] = rest;
	if (!slug || !title) {
		console.error('npm run img -- get <slug> "File:Name.jpg" --as=name');
		process.exit(1);
	}
	const width = Number(flag('width', 1400));
	const d = await api({action: 'query', titles: title, ...infoProps, iiurlwidth: String(width)});
	const p = Object.values(d.query.pages)[0];
	const x = describe(p);
	if (!x) throw new Error('Файл не найден: ' + title);
	const ii = p.imageinfo[0];
	const src = ii.thumburl && ii.width > width ? ii.thumburl : ii.url;
	const ext = (src.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
	const name = String(flag('as', title.replace(/^File:/, '').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')));
	const dir = path.join(ROOT, 'public', 'assets', slug);
	fs.mkdirSync(dir, {recursive: true});
	let res;
	for (let i = 0; i < 6; i++) {
		try {
			res = await fetch(src, {headers: {'User-Agent': UA}});
		} catch (e) {
			res = null;
		}
		if (res?.ok) break;
		const wait = 10000 * (i + 1);
		console.log(`  … ${res?.status ?? 'сеть'}: жду ${wait / 1000} с`);
		await sleep(wait);
	}
	if (!res?.ok) throw new Error(`Загрузка не удалась: ${res?.status}`);
	const file = `${name}.${ext}`;
	fs.writeFileSync(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
	const creditsFile = path.join(dir, 'credits.json');
	const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')) : {};
	credits[file] = {title: x.title, license: x.license, artist: x.artist, page: x.page};
	fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2));
	console.log(`✓ assets/${slug}/${file}  (${x.license}${x.artist ? ', ' + x.artist : ''})`);
} else {
	console.error('Команды: search <запрос> | get <slug> "File:..." --as=имя');
	process.exit(1);
}
