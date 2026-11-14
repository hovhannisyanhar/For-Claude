import type {Word} from '../types';

/** Нарисованные кодом «декорации» — анимированные атмосферные планы */
export type CinemaSet =
	| 'night' // звёздная ночь, гряды сосен в тумане, далёкий поезд
	| 'station' // сумерки, полустанок, паровоз в клубах пара
	| 'forest' // гигантские стволы, лучи света, пылинки
	| 'bridge' // деревянный мост-эстакада над ущельем, поезд с фарой
	| 'cabin' // хижина у реки, тёплые окна, дым, светлячки
	| 'seasons' // рельсы к горизонту, осень → зима → весна
	| 'campfire' // ночной лес, костёр, искры
	| 'reel' // проектор и киноплёнка — титры фильма
	| 'outro'; // красный фонарь последнего вагона уходит в туман

export type CinemaShot = {
	voice: string;
	audio?: string;
	duration?: number;
	words?: Word[];
	set: CinemaSet;
	/** Мелкая разрядка над заголовком: «АЙДАХО · 1893» */
	kicker?: string;
	/** Заголовок с засечками (можно \n) */
	title?: string;
	titleSize?: number;
	/** Верх текстового блока, px (по умолчанию 330) */
	textY?: number;
	/** Строка под заголовком */
	text?: string;
	/** Крупное число с подписью */
	stat?: {value: string; label: string; sub?: string};
	/** Титры: роль — имя */
	credits?: Array<{role: string; name: string}>;
	/** Призыв в финале */
	cta?: string;
	/** Доп. пауза после реплики, кадры */
	pause?: number;
};

export type CinemaProps = {
	title: string;
	style: 'cinema';
	/** Цвет акцента (тёплый янтарь по умолчанию) */
	accent?: string;
	scenes: CinemaShot[];
	music?: string;
	musicVolume?: number;
	showCaptions?: boolean;
};
