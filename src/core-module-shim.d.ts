/**
 * @module core-module-shim
 * @description
 * Ambient declaration for `@arraypress/waveform-player`. The core
 * library ships as vanilla JS with no `.d.ts` types yet, so `tsc`
 * complains when this package imports it directly. The shim models
 * its public surface loosely enough for our wrapper to be
 * type-correct without claiming full coverage.
 *
 * Once the core library ships its own types, this file can be
 * deleted — TypeScript will pick up the real ones from the package.
 */
declare module '@arraypress/waveform-player' {
	interface WaveformPlayerInstance {
		destroy?: () => void;
		play?: () => Promise<void> | undefined;
		pause?: () => void;
		togglePlay?: () => void;
		seekTo?: (seconds: number) => void;
		seekToPercent?: (percent: number) => void;
		setVolume?: (volume: number) => void;
		setPlaybackRate?: (rate: number) => void;
		setPlayingState?: (playing: boolean) => void;
		setProgress?: (currentTime: number, duration: number) => void;
		loadTrack?: (
			url: string,
			title?: string,
			subtitle?: string,
			options?: Record<string, unknown>
		) => Promise<void>;
	}

	interface WaveformPlayerConstructor {
		new (
			container: HTMLElement,
			options: Record<string, unknown>
		): WaveformPlayerInstance;
	}

	const WaveformPlayer: WaveformPlayerConstructor;
	export default WaveformPlayer;
	export { WaveformPlayer };
}
