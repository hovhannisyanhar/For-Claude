import React, {useMemo} from 'react';
import {
	AbsoluteFill,
	Audio,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Background} from './components/Background';
import {Captions} from './components/Captions';
import {THEMES, type Theme} from './theme';
import {AUDIO_DELAY, estimateDuration, estimateWords, sceneFrames} from './timing';
import type {Scene, VideoProps} from './types';
import {loadFonts} from './fonts';
import {Compare, Fact, Hook, List, Outro, Stat} from './scenes/Scenes';

loadFonts();

const SceneBody: React.FC<{scene: Scene; theme: Theme; frames: number}> = ({scene, theme, frames}) => {
	switch (scene.type) {
		case 'hook':
			return <Hook scene={scene} theme={theme} frames={frames} />;
		case 'stat':
			return <Stat scene={scene} theme={theme} frames={frames} />;
		case 'fact':
			return <Fact scene={scene} theme={theme} frames={frames} />;
		case 'list':
			return <List scene={scene} theme={theme} frames={frames} />;
		case 'compare':
			return <Compare scene={scene} theme={theme} frames={frames} />;
		case 'outro':
			return <Outro scene={scene} theme={theme} frames={frames} />;
	}
};

/** Плавный выход сцены: лёгкий зум + затухание */
const SceneShell: React.FC<{frames: number; children: React.ReactNode; isLast: boolean}> = ({frames, children, isLast}) => {
	const frame = useCurrentFrame();
	const out = isLast ? 1 : interpolate(frame, [frames - 7, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const zoom = interpolate(frame, [0, frames], [1, 1.035]);
	return (
		<AbsoluteFill style={{opacity: out, transform: `scale(${zoom})`}}>{children}</AbsoluteFill>
	);
};

const ProgressBar: React.FC<{theme: Theme}> = ({theme}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	return (
		<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'rgba(255,255,255,0.12)'}}>
			<div
				style={{
					height: '100%',
					width: `${(frame / durationInFrames) * 100}%`,
					background: `linear-gradient(90deg, ${theme.accent2}, ${theme.accent})`,
				}}
			/>
		</div>
	);
};

export const FactVideo: React.FC<VideoProps> = ({scenes, theme: themeName, music, musicVolume = 0.08, showCaptions = true}) => {
	const theme = THEMES[themeName] ?? THEMES.midnight;
	const timeline = useMemo(() => {
		let from = 0;
		return scenes.map((scene, i) => {
			const isLast = i === scenes.length - 1;
			const frames = sceneFrames(scene, isLast);
			const words = scene.words ?? estimateWords(scene.voice, scene.duration ?? estimateDuration(scene.voice));
			const item = {scene, from, frames, words, isLast};
			from += frames;
			return item;
		});
	}, [scenes]);

	return (
		<AbsoluteFill style={{background: theme.bg[0]}}>
			<Background theme={theme} />
			{timeline.map(({scene, from, frames, words, isLast}, i) => (
				<Sequence key={i} from={from} durationInFrames={frames} name={`${i + 1}. ${scene.type}`}>
					<SceneShell frames={frames} isLast={isLast}>
						<SceneBody scene={scene} theme={theme} frames={frames} />
					</SceneShell>
					{showCaptions && <Captions words={words} theme={theme} />}
					{scene.audio && (
						<Sequence from={AUDIO_DELAY}>
							<Audio src={staticFile(scene.audio)} />
						</Sequence>
					)}
				</Sequence>
			))}
			{music && <Audio src={staticFile(music)} volume={musicVolume} loop />}
			<ProgressBar theme={theme} />
		</AbsoluteFill>
	);
};
