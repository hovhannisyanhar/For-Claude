import React from 'react';
import {Composition} from 'remotion';
import {FactVideo} from './FactVideo';
import {FPS, totalFrames} from './timing';
import type {VideoProps} from './types';
import sample from '../templates/script.example.json';

export const RemotionRoot: React.FC = () => (
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
);
