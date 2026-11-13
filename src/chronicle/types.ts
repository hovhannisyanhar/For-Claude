import type {Word} from '../types';

export type BlockColor = 'red' | 'orange' | 'black' | 'olive' | 'cream' | 'blue';

/** Изображение на странице. Координаты — в пикселях кадра 1080×1920 (центр картинки). */
export type Clip = {
	/** Путь в public/, напр. "assets/nike/aj1-cut.png" */
	src: string;
	/** photo — фото в белой рамке со скотчем; sticker — вырезанный PNG с белой обводкой */
	kind?: 'photo' | 'sticker';
	tone?: 'sepia' | 'bw' | 'color';
	x: number;
	y: number;
	/** Ширина в пикселях */
	w: number;
	rotate?: number;
	/** Задержка появления, кадры от начала сцены */
	delay?: number;
	/** Подпись на бумажной полоске под фото */
	caption?: string;
};

export type ChroniclePage = {
	voice: string;
	audio?: string;
	duration?: number;
	words?: Word[];
	/** Год вырезанными буквами вверху; он же двигает линейку времени */
	year?: string;
	/** Цветная рваная бумага снизу страницы */
	block?: BlockColor | null;
	/** Верхний край цветной бумаги, px (по умолчанию 980) */
	blockTop?: number;
	clips?: Clip[];
	/** Строка «с печатной машинки» */
	label?: string;
	labelY?: number;
	/** Крупный плакатный заголовок (можно с \n) */
	headline?: string;
	headlineY?: number;
	headlineSize?: number;
	stamp?: {text: string; sub?: string; x?: number; y?: number; rotate?: number};
	stat?: {value: string; prefix?: string; suffix?: string; label?: string; y?: number};
	/** Рукописная заметка */
	note?: string;
	noteY?: number;
};

export type ChronicleProps = {
	title: string;
	style: 'chronicle';
	/** Цвет акцента (штампы, маркер в субтитрах) */
	accent?: string;
	/** Подпись внизу финала / водяной знак */
	handle?: string;
	scenes: ChroniclePage[];
	music?: string;
	musicVolume?: number;
	showCaptions?: boolean;
};
