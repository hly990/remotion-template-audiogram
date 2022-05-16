import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { useEffect, useRef, useState } from 'react';
import {
	AbsoluteFill,
	Audio,
	continueRender,
	delayRender,
	Easing,
	Img,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import audioSource from './assets/audio.mp3';
import coverImg from './assets/cover.jpg';
import { LINE_HEIGHT, PaginatedSubtitles } from './Subtitles';

const AudioViz = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const audioData = useAudioData(audioSource);

	if (!audioData) {
		return null;
	}

	const allVisualizationValues = visualizeAudio({
		fps,
		frame,
		audioData,
		numberOfSamples: 256, // Use more samples to get a nicer visualisation
	});

	// Pick the low values because they look nicer than high values
	// feel free to play around :)
	const visualization = allVisualizationValues.slice(8, 30);

	const mirrored = [...visualization.slice(1).reverse(), ...visualization];

	return (
		<div className="flex flex-row h-16 items-center justify-center gap-1">
			{mirrored.map((v, i) => {
				return (
					<div
						key={i}
						className="w-1 bg-yellow-300 rounded"
						style={{
							height: `${500 * Math.sqrt(v)}%`,
						}}
					/>
				);
			})}
		</div>
	);
};

const subtitlesSource = staticFile('subtitles.srt');

export const AudiogramComposition = () => {
	const { durationInFrames } = useVideoConfig();

	const [handle] = useState(() => delayRender());
	const [subtitles, setSubtitles] = useState<string | null>(null);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetch(subtitlesSource)
			.then((res) => res.text())
			.then((text) => {
				setSubtitles(text);
				continueRender(handle);
			})
			.catch((err) => {
				console.log('Error fetching subtitles', err);
			});
	}, [handle]);

	// Change this to adjust the part of the audio to use
	// const offset = 2000;
	const offset = 1050;

	if (!subtitles) {
		return null;
	}

	return (
		<div ref={ref}>
			<AbsoluteFill>
				<Sequence from={0}>
					<Audio src={audioSource} />

					<div
						className="flex flex-col w-full h-full text-white p-4 bg-black"
						style={{
							fontFamily: 'IBM Plex Sans',
						}}
					>
						<div className="flex flex-row">
							<Img className="rounded-lg" src={coverImg} />

							<div className="ml-4 leading-tight font-extrabold text-gray-700">
								#后端开发 – 如何判断一个后端应用是否是无状态，还是有状态的？
							</div>
						</div>

						<div className="mt-4">
							<AudioViz />
						</div>

						<div
							style={{ lineHeight: `${LINE_HEIGHT}px` }}
							className="mt-2 text-2xl font-semibold"
						>
							<PaginatedSubtitles
								src={subtitles}
								startFrame={0}
								endFrame={durationInFrames}
								linesPerPage={4}
								renderSubtitleItem={(item, frame) => (
									<>
										<span
											style={{
												backfaceVisibility: 'hidden',
												display: 'inline-block',

												opacity: interpolate(
													frame,
													[item.start, item.start + 15],
													[0, 1],
													{
														extrapolateLeft: 'clamp',
														extrapolateRight: 'clamp',
													}
												),
												transform: `perspective(1000px) translateY(${interpolate(
													frame,
													[item.start, item.start + 15],
													[0.5, 0],
													{
														easing: Easing.out(Easing.quad),
														extrapolateLeft: 'clamp',
														extrapolateRight: 'clamp',
													}
												)}em)`,
											}}
										>
											{item.text}
										</span>{' '}
									</>
								)}
							/>
						</div>
					</div>
				</Sequence>
			</AbsoluteFill>
		</div>
	);
};
