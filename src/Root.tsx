import React from 'react';
import {Composition, Still} from 'remotion';
import {FactVideo} from './FactVideo';
import {ChronicleVideo} from './chronicle/ChronicleVideo';
import {FPS, totalFrames} from './timing';
import type {Scene, VideoProps} from './types';
import type {ChronicleProps} from './chronicle/types';
import {CinemaVideo, cinemaTotal} from './cinema/CinemaVideo';
import type {CinemaProps} from './cinema/types';
import cinemaSample from '../templates/cinema.example.json';
import {InstaCover, type InstaCoverProps} from './cinema/InstaCover';
import sample from '../templates/script.example.json';
import chronicleSample from '../templates/chronicle.example.json';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="FactVideo"
			component={FactVideo}
			width={1080}
			height={1920}
			fps={FPS}
			durationInFrames={300}
			defaultProps={sample as unknown as VideoProps}
			calculateMetadata={({props}) => ({durationInFrames: totalFrames(props.scenes)})}
		/>
		<Composition
			id="ChronicleVideo"
			component={ChronicleVideo}
			width={1080}
			height={1920}
			fps={FPS}
			durationInFrames={300}
			defaultProps={chronicleSample as unknown as ChronicleProps}
			calculateMetadata={({props}) => ({durationInFrames: totalFrames(props.scenes as unknown as Scene[])})}
		/>
		<Composition
			id="CinemaVideo"
			component={CinemaVideo}
			width={1080}
			height={1920}
			fps={FPS}
			durationInFrames={300}
			defaultProps={cinemaSample as unknown as CinemaProps}
			calculateMetadata={({props}) => ({durationInFrames: cinemaTotal(props.scenes, Boolean(props.poster))})}
		/>
		<Still id="InstaCover" component={InstaCover} width={1080} height={1920} defaultProps={{top: 'Одна жизнь', main: 'Длиной\nв век'} as InstaCoverProps} />
	</>
);
