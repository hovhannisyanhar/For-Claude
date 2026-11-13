import type {ThemeName} from './types';

export type Theme = {
	bg: [string, string];
	blobs: [string, string, string];
	accent: string;
	accent2: string;
	text: string;
	muted: string;
	card: string;
	cardBorder: string;
};

export const THEMES: Record<ThemeName, Theme> = {
	midnight: {
		bg: ['#07061a', '#151040'],
		blobs: ['#5b3cff', '#ff3d9a', '#00c2ff'],
		accent: '#ffd23f',
		accent2: '#7c5cff',
		text: '#ffffff',
		muted: 'rgba(255,255,255,0.72)',
		card: 'rgba(255,255,255,0.07)',
		cardBorder: 'rgba(255,255,255,0.16)',
	},
	sunset: {
		bg: ['#1a0610', '#3d0f1f'],
		blobs: ['#ff6b3d', '#ff2d6f', '#ffb13d'],
		accent: '#ffe066',
		accent2: '#ff6b3d',
		text: '#ffffff',
		muted: 'rgba(255,255,255,0.75)',
		card: 'rgba(255,255,255,0.08)',
		cardBorder: 'rgba(255,255,255,0.18)',
	},
	ocean: {
		bg: ['#021219', '#06303f'],
		blobs: ['#00d4c8', '#0077ff', '#5cffb0'],
		accent: '#5cffb0',
		accent2: '#00b4ff',
		text: '#ffffff',
		muted: 'rgba(255,255,255,0.74)',
		card: 'rgba(255,255,255,0.07)',
		cardBorder: 'rgba(255,255,255,0.16)',
	},
	forest: {
		bg: ['#06140b', '#11301b'],
		blobs: ['#3ddc84', '#c6ff3d', '#00a676'],
		accent: '#c6ff3d',
		accent2: '#3ddc84',
		text: '#ffffff',
		muted: 'rgba(255,255,255,0.74)',
		card: 'rgba(255,255,255,0.07)',
		cardBorder: 'rgba(255,255,255,0.16)',
	},
	mono: {
		bg: ['#0a0a0a', '#1c1c1c'],
		blobs: ['#ffffff', '#888888', '#444444'],
		accent: '#ff4d2e',
		accent2: '#ffffff',
		text: '#ffffff',
		muted: 'rgba(255,255,255,0.7)',
		card: 'rgba(255,255,255,0.06)',
		cardBorder: 'rgba(255,255,255,0.14)',
	},
};

export const FONT_DISPLAY = "'Unbounded', 'Inter', sans-serif";
export const FONT_BODY = "'Manrope', 'Inter', sans-serif";

/** Безопасная зона для Reels/TikTok (1080x1920): интерфейс перекрывает низ и правый край */
export const SAFE = {
	top: 220,
	left: 90,
	right: 150,
	/** Всё, что ниже этой линии, может закрыть подпись/кнопки */
	bottom: 1500,
};
