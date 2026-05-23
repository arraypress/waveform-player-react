/**
 * @module types
 * @description
 * Public TypeScript types for `@arraypress/waveform-player-react`.
 *
 * Mirrors the option surface of `@arraypress/waveform-player` and
 * adds React-specific extras:
 *
 *   - Callback props (`onLoad`, `onPlay`, `onPause`, `onTimeUpdate`,
 *     `onEnd`, `onError`) that map directly to the library's
 *     same-named option fields.
 *   - DOM pass-through (`className`, `style`, `id`).
 *   - A `WaveformPlayerHandle` exposed via `ref` for imperative
 *     control (`loadTrack`, `seekTo`, `setVolume`, etc.).
 *
 * @see {@link https://github.com/arraypress/waveform-player} — core library
 */

/**
 * Visual style of the waveform.
 *
 * - `bars`    — vertical bars from the baseline up
 * - `mirror`  — symmetrical bars mirrored around the centre line
 * - `line`    — connected line graph
 * - `blocks`  — chunky square blocks
 * - `dots`    — dotted plot
 * - `seekbar` — minimal seek bar with no peak detail
 */
export type WaveformStyle =
	| 'bars'
	| 'mirror'
	| 'line'
	| 'blocks'
	| 'dots'
	| 'seekbar';

/**
 * Forced colour scheme. `null` (the default) auto-detects from the
 * page theme and `prefers-color-scheme`.
 */
export type ColorPreset = 'dark' | 'light' | null;

/**
 * How the player handles audio.
 *
 * - `self`     — the player owns an `<audio>` element and plays the
 *   URL itself. Default.
 * - `external` — the player renders waveform visualisation only and
 *   dispatches `waveformplayer:request-play|pause|seek` events for
 *   an external controller to handle. Drive the visualisation by
 *   calling `setProgress()` and `setPlayingState()` on the instance
 *   via the forwarded ref.
 */
export type AudioMode = 'self' | 'external';

/** Browser preload hint for the underlying `<audio>` element. */
export type AudioPreload = 'auto' | 'metadata' | 'none';

/** Vertical alignment of the play button relative to the waveform. */
export type ButtonAlign = 'auto' | 'top' | 'center' | 'bottom';

/**
 * A clickable chapter marker rendered on top of the waveform.
 */
export interface WaveformMarker {
	/** Time in seconds at which the marker appears. */
	time: number;
	/** Short label shown as a tooltip. */
	label: string;
	/** Optional override colour (CSS colour string). */
	color?: string;
}

/**
 * Pre-computed waveform peaks, OR a string pointer to them.
 *
 * - `number[]`            — inline array of peak amplitudes (0..1)
 * - `string` (.json URL)  — JSON file URL the library will `fetch()`
 * - `string` (JSON array) — inline JSON string the library will parse
 * - `null` / omitted      — the library decodes the audio file with
 *   the Web Audio API at load time
 */
export type WaveformPeaks = number[] | string | null;

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
		subtitle?: string,
		options?: Record<string, unknown>
	): Promise<void>;
	/**
	 * Underlying instance. Cast in your code if you need access to
	 * features not exposed by this handle (the core library has no
	 * shipped TypeScript types yet).
	 */
	readonly instance: unknown;
}

/**
 * Props accepted by `<WaveformPlayer>`.
 *
 * Grouped to mirror the README sections:
 *   1. Audio source
 *   2. Waveform visualisation
 *   3. Colours
 *   4. Playback controls
 *   5. UI toggles
 *   6. Markers
 *   7. Content metadata
 *   8. Behaviour flags
 *   9. Icons
 *  10. React-specific extras (callbacks, className, style, id)
 */
export interface WaveformPlayerProps {
	// ── 1. Audio source ────────────────────────────────────────────────

	/** Audio file URL. Required. */
	url: string;
	/**
	 * Whether the player owns its `<audio>` element (`self`) or only
	 * renders visualisation and emits request events (`external`).
	 *
	 * Changing this prop **re-mounts** the player instance — it's
	 * part of the "identity" dep array.
	 *
	 * @default 'self'
	 */
	audioMode?: AudioMode;
	/** Browser preload hint. @default 'metadata' */
	preload?: AudioPreload;

	// ── 2. Waveform visualisation ──────────────────────────────────────

	/** Visual style. @default 'mirror' */
	waveformStyle?: WaveformStyle;
	/** Canvas height in pixels. @default 60 */
	height?: number;
	/** Number of peak samples. @default 200 */
	samples?: number;
	/** Bar/block width in pixels. */
	barWidth?: number;
	/** Gap between bars in pixels. */
	barSpacing?: number;
	/** Pre-computed peaks data. See {@link WaveformPeaks}. */
	waveform?: WaveformPeaks;

	// ── 3. Colours ─────────────────────────────────────────────────────

	/** Forced colour preset; `null` auto-detects. @default null */
	colorPreset?: ColorPreset;
	/** Unplayed peak colour (CSS colour string). */
	waveformColor?: string;
	/** Progress/played-through colour. */
	progressColor?: string;
	/** Play button border/text colour. */
	buttonColor?: string;
	/** Play button hover colour. */
	buttonHoverColor?: string;
	/** Primary text (title) colour. */
	textColor?: string;
	/** Secondary text (subtitle, time) colour. */
	textSecondaryColor?: string;
	/** Reserved. */
	backgroundColor?: string;
	/** Reserved. */
	borderColor?: string;

	// ── 4. Playback controls ───────────────────────────────────────────

	/** Initial playback rate (0.5..2). @default 1 */
	playbackRate?: number;
	/** Show the playback-speed control menu. @default false */
	showPlaybackSpeed?: boolean;
	/** Speeds offered in the menu. */
	playbackRates?: number[];

	// ── 5. UI toggles ──────────────────────────────────────────────────

	/** Show play/pause button. @default true */
	showControls?: boolean;
	/** Show info bar (title, subtitle, time, BPM, speed). @default true */
	showInfo?: boolean;
	/** Show current/total time. @default true */
	showTime?: boolean;
	/** Show hover-time indicator. Reserved. @default false */
	showHoverTime?: boolean;
	/** Detect and display BPM. @default false */
	showBPM?: boolean;
	/** Vertical alignment of play button. @default 'auto' */
	buttonAlign?: ButtonAlign;

	// ── 6. Markers ─────────────────────────────────────────────────────

	/** Chapter markers. */
	markers?: WaveformMarker[];
	/** Whether to render markers. @default true */
	showMarkers?: boolean;

	// ── 7. Content metadata ────────────────────────────────────────────

	/** Track title (defaults to prettified filename). */
	title?: string;
	/** Subtitle / artist. */
	subtitle?: string;
	/** Cover image URL. */
	artwork?: string;
	/** Album name (Media Session API). */
	album?: string;

	// ── 8. Behaviour flags ─────────────────────────────────────────────

	/** Start as soon as metadata loads. @default false */
	autoplay?: boolean;
	/** Pause other players on the page when this one starts. @default true */
	singlePlay?: boolean;
	/** Resume on seek if paused. @default true */
	playOnSeek?: boolean;
	/** Wire up the browser's Media Session API. @default true */
	enableMediaSession?: boolean;

	// ── 9. Icons ───────────────────────────────────────────────────────

	/** Inline HTML/SVG for the play button. */
	playIcon?: string;
	/** Inline HTML/SVG for the pause button. */
	pauseIcon?: string;

	// ── 10. React-specific extras ──────────────────────────────────────

	/**
	 * Called once on mount after the player's `onLoad` fires. Signature
	 * mirrors the underlying library callback — receives the instance.
	 */
	onLoad?: (instance: unknown) => void;
	/** Called when playback starts. */
	onPlay?: (instance: unknown) => void;
	/** Called when playback pauses. */
	onPause?: (instance: unknown) => void;
	/** Called when the track ends. */
	onEnd?: (instance: unknown) => void;
	/**
	 * Called on each progress frame in self-mode (signature varies in
	 * external-mode — see the core library docs).
	 */
	onTimeUpdate?: (currentTime: number, duration: number, instance: unknown) => void;
	/** Called on audio load / playback error. */
	onError?: (error: Error, instance: unknown) => void;

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
