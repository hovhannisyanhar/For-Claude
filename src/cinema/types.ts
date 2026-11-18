import type {Word} from '../types';

/** Нарисованные кодом «декорации» — анимированные атмосферные планы */
export type CinemaSet =
	| 'station' // рассвет, полустанок, мальчик с узелком, подходит паровоз
	| 'valley' // ночная долина, луна, далёкий поезд на мосту
	| 'logging' // лесоруб рубит гигантскую сосну, лучи, падает дерево вдали
	| 'bridge' // стройка моста на багровом закате, рабочие, вороны, герой смотрит
	| 'cabin' // дом у реки, пара на крыльце, тёплые окна, светлячки
	| 'seasons' // герой идёт, осень → зима → весна
	| 'campfire' // лагерь лесорубов у костра
	| 'lake' // ночное озеро, мостки, поезд на дальнем берегу с отражением
	| 'dawn' // рассвет над долиной, герой на холме
	// «Рипли»
	| 'mirror' // зеркало: отражение Тома совпадает с Дики
	| 'nyroom' // каморка в Нью-Йорке, дождь, стук в дверь
	| 'liner' // лайнер в порту, Том поднимается по трапу
	| 'atrani' // Атрани: городок у моря
	| 'terrace' // терраса: Дики, Мардж, Том
	| 'wardrobe' // Том в рубашке Дики у зеркала
	| 'boat' // лодка на закате
	| 'stairs' // ночная лестница, тень
	| 'nightsea' // ночное море, вилла, Том на камнях
	// старые имена (алиасы)
	| 'night'
	| 'forest'
	| 'reel'
	| 'outro';

export type Sfx = {src: string; at: number; duration: number; volume: number};

export type CinemaShot = {
	voice: string;
	audio?: string;
	duration?: number;
	words?: Word[];
	/** Имя плана: нарисованная декорация из Sets.tsx или 3D-сцена из scenes3d/<slug>.js */
	set: CinemaSet | (string & {});
	/** Готовый видеоклип плана (3D-сцены: npm run scenes3d), путь от public/ */
	clip?: string;
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
	/** Слова озвучки, которые выделяются в кинетической типографике */
	emphasis?: string[];
	/** Финальный титр после реплики (только в последней сцене) */
	finalTitle?: string;
	/** Звуки сцены (заполняет npm run sound) */
	sfx?: Sfx[];
};

export type CinemaProps = {
	title: string;
	style: 'cinema';
	/** Цвет акцента (тёплый янтарь по умолчанию) */
	accent?: string;
	scenes: CinemaShot[];
	/** Финальный кадр: официальная обложка + название (рус/англ) и год */
	poster?: {src: string; titleRu: string; titleEn: string; year: string; /** Плашка-призыв под названием: «Подпишись» */ cta?: string; /** Длительность кадра с постером, с (по умолчанию 4,5) */ seconds?: number} | null;
	music?: string;
	musicVolume?: number;
	showCaptions?: boolean;
	/** Шрифты кинетического текста: пресет (classic · noir · modern · display · hand) или своя тройка. Менять от ролика к ролику */
	fonts?: import('./Kinetic').FontPreset | import('./Kinetic').KineticFonts;
	/** Старый «плёночный» вид: мерцание яркости, дрожание кадра, пылинки, живое зерно. По умолчанию выключен */
	film?: boolean;
};
