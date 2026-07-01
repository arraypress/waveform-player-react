/**
 * @module types
 * @description
 * Public TypeScript types for `@arraypress/waveform-player-react`.
 *
 * The shared option surface — `WaveformStyle`, `ColorPreset`,
 * `AudioMode`, `AudioPreload`, `ButtonAlign`, `WaveformMarker`,
 * `WaveformPeaks`, and the full per-option list behind
 * `WaveformPlayerProps` — is now owned by the core library and
 * re-exported / extended here rather than re-declared. The core's
 * hand-authored `index.d.ts` is the single source of truth, so this
 * wrapper can never drift out of sync with it.
 *
 * This module only adds the React-specific surface:
 *
 *   - Callback props (`onLoad`, `onPlay`, `onPause`, `onTimeUpdate`,
 *     `onEnd`, `onError`) that map to the library's same-named option
 *     fields but receive the typed `WaveformPlayer` instance.
 *   - DOM pass-through (`className`, `style`, `id`).
 *   - A `WaveformPlayerHandle` exposed via `ref` for imperative
 *     control (`loadTrack`, `seekTo`, `setVolume`, etc.).
 *
 * @see {@link https://github.com/arraypress/waveform-player} — core library
 */
import type {
	WaveformPlayer,
	WaveformPlayerOptions,
} from '@arraypress/waveform-player';

/**
 * Shared option types re-exported from the core library so existing
 * consumers importing them from this package keep working. These are
 * the single-source-of-truth definitions shipped by
 * `@arraypress/waveform-player` — not local copies.
 */
export type {
	WaveformStyle,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
	WaveformMarker,
	WaveformPeaks,
} from '@arraypress/waveform-player';

/**
 * Imperative handle exposed through `ref`. Lets consumers drive the
 * player directly — useful for "play this track when X happens"
 * flows where wiring everything through props is awkward.
 *
 * Every method is a thin pass-through to the underlying
 * `WaveformPlayer` instance; refer to the core library's docs for
 * exact behaviour. Most methods return `void`; `play()` returns the
 * native `HTMLMediaElement.play()` promise when the player owns the
 * audio (`audioMode: 'self'`), `undefined` otherwise.
 */
export interface WaveformPlayerHandle {
	/** Start playback. */
	play(): Promise<void> | undefined;
	/** Pause playback. */
	pause(): void;
	/** Toggle play / pause. */
	togglePlay(): void;
	/** Seek to a specific time in seconds. Self-mode only. */
	seekTo(seconds: number): void;
	/** Seek to a percentage of total duration (0..1). Self-mode only. */
	seekToPercent(percent: number): void;
	/** Set output volume (0..1). Self-mode only. */
	setVolume(volume: number): void;
	/** Set playback rate (0.5..2). Self-mode only. */
	setPlaybackRate(rate: number): void;
	/**
	 * External-mode only: push the play/pause state into the player so
	 * the visualisation can reflect what your own audio source is
	 * doing.
	 */
	setPlayingState(playing: boolean): void;
	/**
	 * External-mode only: push the current playback position into the
	 * player so the progress overlay can advance with your own audio
	 * source.
	 */
	setProgress(currentTime: number, duration: number): void;
	/**
	 * Load a new track without remounting the component. Resets state,
	 * fetches the new waveform / audio, then plays.
	 */
	loadTrack(
		url: string,
		title?: string,
		artist?: string,
		options?: Record<string, unknown>
	): Promise<void>;
	/**
	 * Underlying `WaveformPlayer` instance. Exposes the full core API
	 * (static helpers, `options`, `load`, `setWaveformData`, …) for the
	 * rare cases the handle methods above don't cover.
	 */
	readonly instance: WaveformPlayer;
}

/**
 * Props accepted by `<WaveformPlayer>`.
 *
 * Extends the core library's `WaveformPlayerOptions` so every library
 * option is accepted as a typed prop automatically — including
 * `accessibleSeek`, `seekLabel`, `barRadius`, and gradient-array
 * colours — and stays in sync as the core evolves. The core's `url`
 * and callback options are omitted and re-declared below with the
 * React-specific shapes (`url` is required; callbacks receive the
 * typed instance).
 *
 * React-specific extras layered on top: the callback props, plus the
 * DOM pass-throughs `id`, `className`, and `style`.
 */
export interface WaveformPlayerProps
	extends Omit<
		WaveformPlayerOptions,
		'url' | 'style' | 'onLoad' | 'onPlay' | 'onPause' | 'onEnd' | 'onError' | 'onTimeUpdate'
	> {
	// ── Audio source ───────────────────────────────────────────────────

	/**
	 * Audio file URL. Optional only because the core's `src` shorthand is
	 * an accepted alias — provide one of `url` or `src`.
	 */
	url?: string;

	// ── React-specific callbacks ───────────────────────────────────────

	/**
	 * Called once on mount after the player's `onLoad` fires. Receives
	 * the live `WaveformPlayer` instance.
	 */
	onLoad?: (instance: WaveformPlayer) => void;
	/** Called when playback starts. */
	onPlay?: (instance: WaveformPlayer) => void;
	/** Called when playback pauses. */
	onPause?: (instance: WaveformPlayer) => void;
	/** Called when the track ends. */
	onEnd?: (instance: WaveformPlayer) => void;
	/**
	 * Called on each progress frame. Fires with the same
	 * `(currentTime, duration, instance)` order in both audio modes.
	 */
	onTimeUpdate?: (currentTime: number, duration: number, instance: WaveformPlayer) => void;
	/** Called on audio load / playback error. */
	onError?: (error: Error, instance: WaveformPlayer) => void;

	// ── React-specific extras ──────────────────────────────────────────

	/**
	 * DOM id forwarded to the container `<div>`. Useful for targeting
	 * the player from external scripts.
	 */
	id?: string;
	/**
	 * Extra class names appended to the container. The base class
	 * `wfp-host` is always applied.
	 */
	className?: string;
	/**
	 * Inline style passed through to the container. Useful for
	 * setting `min-height` to reserve layout space before the
	 * waveform draws.
	 */
	style?: React.CSSProperties;
}
