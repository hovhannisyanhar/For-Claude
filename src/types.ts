export type Word = {
	text: string;
	/** Секунды от начала озвучки сцены */
	start: number;
	end: number;
};

type SceneCommon = {
	/** Текст, который произносит голос. Из него же строятся субтитры. */
	voice: string;
	/** Заполняется автоматически шагом TTS */
	audio?: string;
	duration?: number;
	words?: Word[];
};

export type HookScene = SceneCommon & {
	type: 'hook';
	/** Короткий текст на экране, 2–6 слов */
	text: string;
	/** Слово из text, которое подсвечивается акцентом */
	accent?: string;
};

export type StatScene = SceneCommon & {
	type: 'stat';
	/** Число для анимации счётчика: "86 000 000 000", "3,5", "70" */
	value: string;
	prefix?: string;
	suffix?: string;
	label: string;
};

export type FactScene = SceneCommon & {
	type: 'fact';
	/** Маленькая плашка сверху, напр. "ФАКТ №2" */
	tag?: string;
	title: string;
	text?: string;
};

export type ListScene = SceneCommon & {
	type: 'list';
	title: string;
	items: string[];
};

export type CompareScene = SceneCommon & {
	type: 'compare';
	title?: string;
	left: {label: string; value: string};
	right: {label: string; value: string};
};

export type OutroScene = SceneCommon & {
	type: 'outro';
	text: string;
	cta?: string;
};

export type Scene =
	| HookScene
	| StatScene
	| FactScene
	| ListScene
	| CompareScene
	| OutroScene;

export type ThemeName = 'midnight' | 'sunset' | 'ocean' | 'forest' | 'mono';

export type VideoProps = {
	title: string;
	theme: ThemeName;
	scenes: Scene[];
	/** Путь в public/, напр. "music/calm.mp3" */
	music?: string;
	musicVolume?: number;
	showCaptions?: boolean;
};
