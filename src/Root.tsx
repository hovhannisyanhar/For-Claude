import React from 'react';
import {Composition} from 'remotion';
import {FactVideo} from './FactVideo';
import {ChronicleVideo} from './chronicle/ChronicleVideo';
import {FPS, totalFrames} from './timing';
import type {Scene, VideoProps} from './types';
import type {ChronicleProps} from './chronicle/types';
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
	</>
);
