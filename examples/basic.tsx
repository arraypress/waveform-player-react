/**
 * examples/basic.tsx
 * ------------------
 *
 * Reference React component demonstrating every <WaveformPlayer>
 * usage pattern this package supports. Copy/paste into your own
 * React app (Vite, Next.js, Remix, anywhere) to see the wrapper in
 * action.
 *
 * Library setup (do this ONCE in your app entry — typically `main.tsx`
 * or your root layout):
 *
 *   import '@arraypress/waveform-player/dist/waveform-player.css';
 *
 * The wrapper does NOT auto-import the CSS for you. Same rationale
 * as the Astro counterpart: you might prefer a CDN, a self-hosted
 * asset, or a different bundling strategy.
 */
import { useRef, useState } from 'react';
import {
	WaveformPlayer,
	type WaveformPlayerHandle,
	type WaveformMarker,
} from '@arraypress/waveform-player-react';

/* Example 1 — Minimal */
export function MinimalExample() {
	return <WaveformPlayer url="/audio/track.mp3" />;
}

/* Example 2 — With metadata, custom style, and event callbacks */
export function FullMetadataExample() {
	return (
		<WaveformPlayer
			url="/audio/track.mp3"
			title="Midnight Dreams"
			artist="The Wavelength"
			artwork="/img/cover.jpg"
			waveformStyle="bars"
			barWidth={3}
			barSpacing={1}
			height={80}
			onPlay={() => console.log('playing')}
			onPause={() => console.log('paused')}
			onTimeUpdate={(t, d) => console.log(`${t} / ${d}`)}
		/>
	);
}

/* Example 3 — Pre-computed peaks for instant load (recommended for catalogues) */
export function PreComputedPeaksExample() {
	return (
		<WaveformPlayer
			url="/audio/track.mp3"
			waveform="/peaks/track.json"
			title="Pre-decoded"
		/>
	);
}

/* Example 4 — Chapter markers (clickable seek points) */
export function MarkersExample() {
	const markers: WaveformMarker[] = [
		{ time: 0, label: 'Intro' },
		{ time: 60, label: 'Main topic', color: '#a855f7' },
		{ time: 600, label: 'Q&A' },
	];

	return (
		<WaveformPlayer
			url="/audio/podcast.mp3"
			title="Episode 42"
			artist="with Guest"
			markers={markers}
			height={80}
		/>
	);
}

/* Example 5 — Imperative control via ref */
export function ImperativeRefExample() {
	const playerRef = useRef<WaveformPlayerHandle>(null);

	return (
		<div>
			<WaveformPlayer ref={playerRef} url="/audio/track.mp3" title="Controlled" />
			<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
				<button onClick={() => playerRef.current?.play()}>Play</button>
				<button onClick={() => playerRef.current?.pause()}>Pause</button>
				<button onClick={() => playerRef.current?.seekTo(30)}>Skip to 0:30</button>
				<button onClick={() => playerRef.current?.setVolume(0.5)}>Vol 50%</button>
			</div>
		</div>
	);
}

/* Example 6 — Dynamic track switching */
export function DynamicTrackExample() {
	const [trackUrl, setTrackUrl] = useState('/audio/track-1.mp3');

	return (
		<div>
			{/* `key` is the URL — changing it forces React to remount
			 *  cleanly. The wrapper would also re-mount on URL change
			 *  via its effect dep array, but keying it makes the unmount
			 *  step obvious in DevTools. */}
			<WaveformPlayer
				key={trackUrl}
				url={trackUrl}
				title="Now playing"
			/>
			<select value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)}>
				<option value="/audio/track-1.mp3">Track 1</option>
				<option value="/audio/track-2.mp3">Track 2</option>
				<option value="/audio/track-3.mp3">Track 3</option>
			</select>
		</div>
	);
}

/* Example 7 — External audio mode (paired with @arraypress/waveform-bar) */
export function ExternalModeExample() {
	const playerRef = useRef<WaveformPlayerHandle>(null);

	/* When using audioMode="external", the player draws the waveform
	 * but doesn't own audio. Drive it from your own audio source by
	 * calling setProgress() + setPlayingState() on the ref. */
	return (
		<div>
			<WaveformPlayer
				ref={playerRef}
				url="/audio/track.mp3"
				audioMode="external"
				waveformStyle="seekbar"
				showInfo={false}
				height={32}
			/>
			{/* In a real app, an effect would subscribe to your bar's
			 *  events and pump setProgress() / setPlayingState() here. */}
		</div>
	);
}
