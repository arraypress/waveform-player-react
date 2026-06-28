/**
 * WaveformPlayer.tsx
 * ------------------
 *
 * React wrapper around `@arraypress/waveform-player`. Mounts a player
 * instance into a `<div>` on first render, tears it down on unmount,
 * and re-mounts when any "identity" prop changes (the props whose
 * change requires the library to start over from scratch — `url`,
 * `audioMode`).
 *
 * For non-identity props, this component currently re-creates the
 * instance as well, which is simpler than diffing every option and
 * calling the right granular updater. The trade-off is acceptable
 * because:
 *
 *   - The library re-uses any cached waveform data keyed by URL, so
 *     re-mounts on the same URL are cheap.
 *   - Per-render churn on a player widget is rare in practice.
 *
 * If you need finer control — imperative `loadTrack()`, `seekTo()`,
 * `setVolume()`, etc. — grab the instance through a `ref`:
 *
 * ```tsx
 * import { useRef, useEffect } from 'react';
 * import { WaveformPlayer, type WaveformPlayerHandle } from '@arraypress/waveform-player-react';
 *
 * function MyPlayer() {
 *   const ref = useRef<WaveformPlayerHandle>(null);
 *   return (
 *     <>
 *       <WaveformPlayer ref={ref} url="/audio/track.mp3" />
 *       <button onClick={() => ref.current?.seekTo(60)}>Jump to 1:00</button>
 *     </>
 *   );
 * }
 * ```
 *
 * ## Library setup
 *
 * This component does **not** load the core library's CSS for you.
 * Import it once at your app entry:
 *
 * ```ts
 * import '@arraypress/waveform-player/dist/waveform-player.css';
 * ```
 *
 * The library's JS is imported dynamically inside `useEffect` so it
 * only loads on the client (SSR-safe).
 *
 * @module WaveformPlayer
 */
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	type ForwardedRef,
} from 'react';
// Aliased to avoid colliding with this file's own `WaveformPlayer`
// component export. This is the core library's player class type.
import type { WaveformPlayer as WaveformPlayerInstance } from '@arraypress/waveform-player';
import type { WaveformPlayerHandle, WaveformPlayerProps } from './types';

/**
 * Convert a `WaveformPlayerProps` object into the option shape the
 * core library accepts. Most fields pass straight through; this
 * helper exists so the option-building logic is testable on its own
 * and the component body stays focused on lifecycle.
 *
 * @param props - The component's resolved props.
 * @returns An options object to pass into `new WaveformPlayer(el, …)`.
 */
function buildLibraryOptions(props: WaveformPlayerProps): Record<string, unknown> {
	const opts: Record<string, unknown> = {};

	/* Audio source — `src` is the core's shorthand alias for `url`. */
	if (props.url !== undefined) opts.url = props.url;
	else if (props.src !== undefined) opts.url = props.src;
	if (props.audioMode !== undefined) opts.audioMode = props.audioMode;
	if (props.preload !== undefined) opts.preload = props.preload;

	/* Waveform visualisation */
	if (props.waveformStyle !== undefined) opts.waveformStyle = props.waveformStyle;
	if (props.height !== undefined) opts.height = props.height;
	if (props.samples !== undefined) opts.samples = props.samples;
	if (props.barWidth !== undefined) opts.barWidth = props.barWidth;
	if (props.barSpacing !== undefined) opts.barSpacing = props.barSpacing;
	if (props.barRadius !== undefined) opts.barRadius = props.barRadius;
	if (props.waveform !== undefined && props.waveform !== null) {
		opts.waveform = props.waveform;
	}

	/* Colours */
	if (props.colorPreset !== undefined) opts.colorPreset = props.colorPreset;
	if (props.waveformColor !== undefined) opts.waveformColor = props.waveformColor;
	if (props.progressColor !== undefined) opts.progressColor = props.progressColor;
	if (props.buttonColor !== undefined) opts.buttonColor = props.buttonColor;
	if (props.buttonHoverColor !== undefined) opts.buttonHoverColor = props.buttonHoverColor;
	if (props.textColor !== undefined) opts.textColor = props.textColor;
	if (props.textSecondaryColor !== undefined) opts.textSecondaryColor = props.textSecondaryColor;
	if (props.backgroundColor !== undefined) opts.backgroundColor = props.backgroundColor;
	if (props.borderColor !== undefined) opts.borderColor = props.borderColor;

	/* Playback controls */
	if (props.playbackRate !== undefined) opts.playbackRate = props.playbackRate;
	if (props.showPlaybackSpeed !== undefined) opts.showPlaybackSpeed = props.showPlaybackSpeed;
	if (props.playbackRates !== undefined) opts.playbackRates = props.playbackRates;

	/* UI toggles */
	if (props.showControls !== undefined) opts.showControls = props.showControls;
	if (props.showInfo !== undefined) opts.showInfo = props.showInfo;
	if (props.showTime !== undefined) opts.showTime = props.showTime;
	if (props.showHoverTime !== undefined) opts.showHoverTime = props.showHoverTime;
	if (props.showBPM !== undefined) opts.showBPM = props.showBPM;
	if (props.bpm !== undefined) opts.bpm = props.bpm;
	if (props.buttonAlign !== undefined) opts.buttonAlign = props.buttonAlign;
	if (props.layout !== undefined) opts.layout = props.layout;
	if (props.buttonStyle !== undefined) opts.buttonStyle = props.buttonStyle;
	if (props.buttonSize !== undefined) opts.buttonSize = props.buttonSize;

	/* Accessibility */
	if (props.accessibleSeek !== undefined) opts.accessibleSeek = props.accessibleSeek;
	if (props.seekLabel !== undefined) opts.seekLabel = props.seekLabel;

	/* Error UI */
	if (props.errorText !== undefined) opts.errorText = props.errorText;

	/* Markers */
	if (props.markers !== undefined) opts.markers = props.markers;
	if (props.showMarkers !== undefined) opts.showMarkers = props.showMarkers;

	/* Content metadata */
	if (props.title !== undefined) opts.title = props.title;
	if (props.subtitle !== undefined) opts.subtitle = props.subtitle;
	if (props.artwork !== undefined) opts.artwork = props.artwork;
	if (props.album !== undefined) opts.album = props.album;

	/* Behaviour */
	if (props.autoplay !== undefined) opts.autoplay = props.autoplay;
	if (props.singlePlay !== undefined) opts.singlePlay = props.singlePlay;
	if (props.playOnSeek !== undefined) opts.playOnSeek = props.playOnSeek;
	if (props.enableMediaSession !== undefined) opts.enableMediaSession = props.enableMediaSession;

	/* Icons */
	if (props.playIcon !== undefined) opts.playIcon = props.playIcon;
	if (props.pauseIcon !== undefined) opts.pauseIcon = props.pauseIcon;

	/* Callbacks are intentionally NOT mapped here. They are wired in
	 * the mount effect as *stable* wrapper functions that read the
	 * latest handlers from `callbacksRef` at call time. That way a
	 * parent re-render passing fresh inline callbacks is always seen
	 * by the core without re-creating the player — and the callbacks
	 * never capture stale first-mount state (stale-closure bug). */

	return opts;
}

/**
 * `WaveformPlayer` — React component wrapping
 * `@arraypress/waveform-player`.
 *
 * Render at the spot you want a waveform-driven audio player to
 * appear. The container `<div>` is rendered immediately for layout;
 * the actual player UI hydrates in once the library loads
 * client-side.
 *
 * @example Basic
 *   <WaveformPlayer url="/audio/track.mp3" title="My Track" />
 *
 * @example With ref for imperative control
 *   const ref = useRef<WaveformPlayerHandle>(null);
 *   <WaveformPlayer ref={ref} url={url} />
 *   <button onClick={() => ref.current?.togglePlay()}>Play/Pause</button>
 */
export const WaveformPlayer = forwardRef<WaveformPlayerHandle, WaveformPlayerProps>(
	function WaveformPlayer(props, ref: ForwardedRef<WaveformPlayerHandle>) {
		const containerRef = useRef<HTMLDivElement | null>(null);
		const instanceRef = useRef<unknown>(null);

		/**
		 * Latest user callbacks, kept in a ref so the wrappers handed to
		 * the core (built once at mount, below) always invoke the most
		 * recent handler instead of the ones captured on first mount.
		 *
		 * Initialised from this render's props and refreshed every render
		 * by the layout effect underneath — never listed in the mount
		 * effect's deps, so updating a callback does NOT tear the player
		 * down.
		 */
		const callbacksRef = useRef<
			Pick<
				WaveformPlayerProps,
				'onLoad' | 'onPlay' | 'onPause' | 'onEnd' | 'onTimeUpdate' | 'onError'
			>
		>({
			onLoad: props.onLoad,
			onPlay: props.onPlay,
			onPause: props.onPause,
			onEnd: props.onEnd,
			onTimeUpdate: props.onTimeUpdate,
			onError: props.onError,
		});

		/* Refresh the ref on every render (before paint) so the stable
		 * wrappers below always read the latest handlers. */
		useLayoutEffect(() => {
			callbacksRef.current = {
				onLoad: props.onLoad,
				onPlay: props.onPlay,
				onPause: props.onPause,
				onEnd: props.onEnd,
				onTimeUpdate: props.onTimeUpdate,
				onError: props.onError,
			};
		});

		/**
		 * Mount / re-mount lifecycle.
		 *
		 * The dep array intentionally contains EVERY prop the library
		 * uses at construction time. When any of them change, this
		 * effect tears down the old instance and creates a new one
		 * with the updated options. That's simpler and more correct
		 * than trying to partial-update the live instance, and the
		 * library has built-in caches (waveform peaks keyed by URL)
		 * that make same-URL re-mounts cheap.
		 */
		useEffect(() => {
			let cancelled = false;
			let localInstance: { destroy?: () => void } | null = null;

			/* The library is browser-only. Defer the import until we're
			 * actually mounting client-side so SSR / RSC don't try to
			 * evaluate the audio + canvas + fetch surface on the server.
			 */
			void import('@arraypress/waveform-player')
				.then((mod) => {
					if (cancelled) return;
					const container = containerRef.current;
					if (!container) return;

					const WaveformPlayerClass = (mod.default ?? (mod as { WaveformPlayer?: unknown }).WaveformPlayer) as {
						new (el: HTMLElement, opts: Record<string, unknown>): { destroy?: () => void };
					};

					if (typeof WaveformPlayerClass !== 'function') {
						console.error(
							'[WaveformPlayerReact] Failed to resolve WaveformPlayer constructor from module.'
						);
						return;
					}

					const opts = buildLibraryOptions(props);

					/* Stable callback wrappers. Created once per player
					 * instance and never change identity, so the core holds a
					 * fixed reference, yet each call reads the *current*
					 * handler from `callbacksRef` — fixing the stale-closure
					 * bug without re-mounting on callback changes. Signatures
					 * mirror the core's option callbacks exactly. */
					opts.onLoad = (instance: WaveformPlayerInstance) => callbacksRef.current.onLoad?.(instance);
					opts.onPlay = (instance: WaveformPlayerInstance) => callbacksRef.current.onPlay?.(instance);
					opts.onPause = (instance: WaveformPlayerInstance) => callbacksRef.current.onPause?.(instance);
					opts.onEnd = (instance: WaveformPlayerInstance) => callbacksRef.current.onEnd?.(instance);
					opts.onTimeUpdate = (currentTime: number, duration: number, instance: WaveformPlayerInstance) =>
						callbacksRef.current.onTimeUpdate?.(currentTime, duration, instance);
					opts.onError = (error: Error, instance: WaveformPlayerInstance) =>
						callbacksRef.current.onError?.(error, instance);

					localInstance = new WaveformPlayerClass(container, opts);
					instanceRef.current = localInstance;
				})
				.catch((err) => {
					console.error('[WaveformPlayerReact] Failed to load library:', err);
				});

			return () => {
				cancelled = true;
				const current = localInstance ?? (instanceRef.current as { destroy?: () => void } | null);
				if (current && typeof current.destroy === 'function') {
					try {
						current.destroy();
					} catch (err) {
						console.warn('[WaveformPlayerReact] destroy() threw:', err);
					}
				}
				instanceRef.current = null;
			};
			/* Re-mount on any prop change. Listed exhaustively rather
			 * than spread to make the intent explicit and to keep the
			 * lint rule happy. Callbacks intentionally NOT in deps:
			 * a parent re-rendering with a fresh inline function
			 * shouldn't tear the player down. */
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [
			props.url,
			props.src,
			props.audioMode,
			props.preload,
			props.waveformStyle,
			props.height,
			props.samples,
			props.barWidth,
			props.barSpacing,
			props.barRadius,
			props.waveform,
			props.colorPreset,
			props.waveformColor,
			props.progressColor,
			props.buttonColor,
			props.buttonHoverColor,
			props.textColor,
			props.textSecondaryColor,
			props.backgroundColor,
			props.borderColor,
			props.playbackRate,
			props.showPlaybackSpeed,
			props.playbackRates,
			props.showControls,
			props.showInfo,
			props.showTime,
			props.showHoverTime,
			props.showBPM,
			props.buttonAlign,
			props.buttonSize,
			props.accessibleSeek,
			props.seekLabel,
			props.errorText,
			props.markers,
			props.showMarkers,
			props.title,
			props.subtitle,
			props.artwork,
			props.album,
			props.autoplay,
			props.singlePlay,
			props.playOnSeek,
			props.enableMediaSession,
			props.playIcon,
			props.pauseIcon,
		]);

		/**
		 * Expose an imperative handle on the forwarded ref. Each
		 * method is a thin pass-through to the live instance — if the
		 * instance hasn't mounted yet (still loading async), calls are
		 * no-ops (`pause`, `seekTo`, etc. return `undefined`).
		 */
		useImperativeHandle(
			ref,
			() => ({
				play() {
					const inst = instanceRef.current as { play?: () => Promise<void> | undefined } | null;
					return inst?.play?.();
				},
				pause() {
					const inst = instanceRef.current as { pause?: () => void } | null;
					inst?.pause?.();
				},
				togglePlay() {
					const inst = instanceRef.current as { togglePlay?: () => void } | null;
					inst?.togglePlay?.();
				},
				seekTo(seconds) {
					const inst = instanceRef.current as { seekTo?: (s: number) => void } | null;
					inst?.seekTo?.(seconds);
				},
				seekToPercent(percent) {
					const inst = instanceRef.current as { seekToPercent?: (p: number) => void } | null;
					inst?.seekToPercent?.(percent);
				},
				setVolume(volume) {
					const inst = instanceRef.current as { setVolume?: (v: number) => void } | null;
					inst?.setVolume?.(volume);
				},
				setPlaybackRate(rate) {
					const inst = instanceRef.current as { setPlaybackRate?: (r: number) => void } | null;
					inst?.setPlaybackRate?.(rate);
				},
				setPlayingState(playing) {
					const inst = instanceRef.current as { setPlayingState?: (p: boolean) => void } | null;
					inst?.setPlayingState?.(playing);
				},
				setProgress(currentTime, duration) {
					const inst = instanceRef.current as {
						setProgress?: (c: number, d: number) => void;
					} | null;
					inst?.setProgress?.(currentTime, duration);
				},
				async loadTrack(url, title, subtitle, options) {
					const inst = instanceRef.current as {
						loadTrack?: (
							u: string,
							t?: string,
							s?: string,
							o?: Record<string, unknown>
						) => Promise<void>;
					} | null;
					if (!inst?.loadTrack) return;
					await inst.loadTrack(url, title, subtitle, options);
				},
				get instance() {
					return instanceRef.current as WaveformPlayerInstance;
				},
			}),
			[]
		);

		return (
			<div
				ref={containerRef}
				id={props.id}
				className={['wfp-host', props.className].filter(Boolean).join(' ')}
				style={props.style}
			/>
		);
	}
);
