/**
 * test/WaveformPlayer.test.tsx
 * ----------------------------
 *
 * Tests for the React wrapper. The core
 * `@arraypress/waveform-player` library is mocked at the module
 * boundary because it reaches for browser APIs (Web Audio, Canvas,
 * Fetch) that jsdom does not implement. With the module mocked,
 * tests can verify the wrapper's responsibilities — mount /
 * unmount lifecycle, option pass-through, ref forwarding,
 * re-mount on identity-prop change — without needing a real audio
 * runtime.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { WaveformPlayer } from '../src/WaveformPlayer';
import type { WaveformPlayerHandle } from '../src/types';

/**
 * Stub instance the mocked constructor returns. Each method records
 * its calls so tests can assert behaviour.
 */
const makeStub = () => {
	const stub = {
		destroy: vi.fn(),
		play: vi.fn(() => Promise.resolve()),
		pause: vi.fn(),
		togglePlay: vi.fn(),
		seekTo: vi.fn(),
		seekToPercent: vi.fn(),
		setVolume: vi.fn(),
		setPlaybackRate: vi.fn(),
		setPlayingState: vi.fn(),
		setProgress: vi.fn(),
		loadTrack: vi.fn(() => Promise.resolve()),
	};
	return stub;
};

/**
 * Module-level mock. Every test sees the same `WaveformPlayerCtor`
 * spy so we can introspect what was constructed.
 *
 * The constructor records the element it was given and the options
 * object so tests can assert option pass-through, then returns the
 * latest `stub` so destroy() / play() etc. are observable.
 */
const ctorCalls: Array<{ el: HTMLElement; opts: Record<string, unknown>; stub: ReturnType<typeof makeStub> }> = [];

vi.mock('@arraypress/waveform-player', () => {
	const WaveformPlayerCtor = vi.fn(function (this: unknown, el: HTMLElement, opts: Record<string, unknown>) {
		const stub = makeStub();
		ctorCalls.push({ el, opts, stub });
		// Mutate `this` so the `new` call sees the stub's methods.
		Object.assign(this as object, stub);
	}) as unknown as new (el: HTMLElement, opts: Record<string, unknown>) => unknown;

	return {
		default: WaveformPlayerCtor,
		WaveformPlayer: WaveformPlayerCtor,
	};
});

beforeEach(() => {
	ctorCalls.length = 0;
	cleanup();
});

/**
 * Wait for the component's dynamic `import('@arraypress/waveform-player')`
 * to resolve and the constructor mock to fire.
 *
 * `vi.mock()` replaces the module statically, but the component still
 * does `await import(...)` inside `useEffect`. The whole chain (effect
 * run → import → .then callback) is microtask-scheduled, so we use
 * testing-library's `waitFor` which keeps polling the assertion until
 * it passes (or times out at 1 s).
 */
async function waitForMount(expectedCount = 1): Promise<void> {
	await waitFor(() => expect(ctorCalls.length).toBeGreaterThanOrEqual(expectedCount));
}

// ─── Mount + container ───────────────────────────────────────────────────

describe('<WaveformPlayer> — mount', () => {
	it('renders a host div with the wfp-host class', () => {
		const { container } = render(<WaveformPlayer url="/audio/a.mp3" />);
		const host = container.querySelector('div');
		expect(host).not.toBeNull();
		expect(host!.className).toContain('wfp-host');
	});

	it('forwards className and id to the host div', () => {
		const { container } = render(
			<WaveformPlayer url="/audio/a.mp3" id="my-player" className="extra-class" />
		);
		const host = container.querySelector('div')!;
		expect(host.id).toBe('my-player');
		expect(host.className).toContain('wfp-host');
		expect(host.className).toContain('extra-class');
	});

	it('forwards inline style to the host div', () => {
		const { container } = render(
			<WaveformPlayer url="/audio/a.mp3" style={{ minHeight: 64 }} />
		);
		const host = container.querySelector('div')!;
		expect(host.style.minHeight).toBe('64px');
	});

	it('constructs the library instance on mount with the right element + options', async () => {
		render(<WaveformPlayer url="/audio/a.mp3" title="My Track" waveformStyle="bars" />);
		await waitForMount();

		expect(ctorCalls).toHaveLength(1);
		const { el, opts } = ctorCalls[0];
		expect(el).toBeInstanceOf(HTMLDivElement);
		expect(opts.url).toBe('/audio/a.mp3');
		expect(opts.title).toBe('My Track');
		expect(opts.waveformStyle).toBe('bars');
	});

	it('does not pass options for props the consumer omitted', async () => {
		render(<WaveformPlayer url="/audio/a.mp3" />);
		await waitForMount();
		const { opts } = ctorCalls[0];

		// `url` is present (required), but optional fields like these
		// must NOT be in the options bag — so the library's own
		// defaults apply.
		expect('audioMode' in opts).toBe(false);
		expect('waveformStyle' in opts).toBe(false);
		expect('barWidth' in opts).toBe(false);
		expect('autoplay' in opts).toBe(false);
		expect('markers' in opts).toBe(false);
	});
});

// ─── Option pass-through ─────────────────────────────────────────────────

describe('<WaveformPlayer> — option pass-through', () => {
	it('forwards every primitive prop into the library options bag', async () => {
		render(
			<WaveformPlayer
				url="/audio/a.mp3"
				audioMode="external"
				preload="none"
				waveformStyle="bars"
				height={80}
				samples={250}
				barWidth={3}
				barSpacing={1}
				colorPreset="dark"
				waveformColor="#abc"
				progressColor="#def"
				playbackRate={1.5}
				showPlaybackSpeed
				showBPM
				buttonAlign="center"
				title="Title"
				subtitle="Subtitle"
				artwork="/img.jpg"
				album="Album"
				autoplay={false}
				singlePlay
				playOnSeek
				enableMediaSession
			/>
		);
		await waitForMount();
		const { opts } = ctorCalls[0];

		expect(opts.audioMode).toBe('external');
		expect(opts.preload).toBe('none');
		expect(opts.waveformStyle).toBe('bars');
		expect(opts.height).toBe(80);
		expect(opts.samples).toBe(250);
		expect(opts.barWidth).toBe(3);
		expect(opts.barSpacing).toBe(1);
		expect(opts.colorPreset).toBe('dark');
		expect(opts.waveformColor).toBe('#abc');
		expect(opts.progressColor).toBe('#def');
		expect(opts.playbackRate).toBe(1.5);
		expect(opts.showPlaybackSpeed).toBe(true);
		expect(opts.showBPM).toBe(true);
		expect(opts.buttonAlign).toBe('center');
		expect(opts.title).toBe('Title');
		expect(opts.subtitle).toBe('Subtitle');
		expect(opts.artwork).toBe('/img.jpg');
		expect(opts.album).toBe('Album');
		expect(opts.autoplay).toBe(false);
		expect(opts.singlePlay).toBe(true);
		expect(opts.playOnSeek).toBe(true);
		expect(opts.enableMediaSession).toBe(true);
	});

	it('forwards arrays as-is (markers, playbackRates, waveform)', async () => {
		const markers = [{ time: 0, label: 'Intro' }];
		const rates = [0.5, 1, 2];
		const peaks = [0.1, 0.5, 0.9];

		render(
			<WaveformPlayer
				url="/audio/a.mp3"
				markers={markers}
				playbackRates={rates}
				waveform={peaks}
			/>
		);
		await waitForMount();
		const { opts } = ctorCalls[0];

		expect(opts.markers).toEqual(markers);
		expect(opts.playbackRates).toEqual(rates);
		expect(opts.waveform).toEqual(peaks);
	});

	it('passes a string waveform (URL) through verbatim', async () => {
		render(<WaveformPlayer url="/audio/a.mp3" waveform="/peaks/track.json" />);
		await waitForMount();
		expect(ctorCalls[0].opts.waveform).toBe('/peaks/track.json');
	});

	it('wires stable callback wrappers that invoke the current handlers', async () => {
		const onLoad = vi.fn();
		const onPlay = vi.fn();
		const onPause = vi.fn();
		const onTimeUpdate = vi.fn();
		const onEnd = vi.fn();
		const onError = vi.fn();

		render(
			<WaveformPlayer
				url="/audio/a.mp3"
				onLoad={onLoad}
				onPlay={onPlay}
				onPause={onPause}
				onTimeUpdate={onTimeUpdate}
				onEnd={onEnd}
				onError={onError}
			/>
		);
		await waitForMount();
		const { opts, stub } = ctorCalls[0];

		// The core receives wrapper functions (not the raw handlers), so
		// new inline callbacks on re-render don't change the reference the
		// core holds.
		expect(typeof opts.onLoad).toBe('function');
		expect(opts.onLoad).not.toBe(onLoad);

		// Calling each wrapper invokes the current handler with the same
		// arguments the core would pass.
		const err = new Error('boom');
		(opts.onLoad as (i: unknown) => void)(stub);
		(opts.onPlay as (i: unknown) => void)(stub);
		(opts.onPause as (i: unknown) => void)(stub);
		(opts.onEnd as (i: unknown) => void)(stub);
		(opts.onTimeUpdate as (c: number, d: number, i: unknown) => void)(12, 34, stub);
		(opts.onError as (e: Error, i: unknown) => void)(err, stub);

		expect(onLoad).toHaveBeenCalledWith(stub);
		expect(onPlay).toHaveBeenCalledWith(stub);
		expect(onPause).toHaveBeenCalledWith(stub);
		expect(onEnd).toHaveBeenCalledWith(stub);
		expect(onTimeUpdate).toHaveBeenCalledWith(12, 34, stub);
		expect(onError).toHaveBeenCalledWith(err, stub);
	});

	it('wrapper survives a missing handler (optional callbacks are no-ops)', async () => {
		render(<WaveformPlayer url="/audio/a.mp3" />);
		await waitForMount();
		const { opts, stub } = ctorCalls[0];

		// Even with no handlers supplied, the core always gets callable
		// wrappers — invoking them must not throw.
		expect(typeof opts.onPlay).toBe('function');
		expect(() => (opts.onPlay as (i: unknown) => void)(stub)).not.toThrow();
		expect(() =>
			(opts.onTimeUpdate as (c: number, d: number, i: unknown) => void)(0, 0, stub)
		).not.toThrow();
	});

	it('calls the LATEST callback after a re-render (no stale closure)', async () => {
		const onPlay1 = vi.fn();
		const { rerender } = render(<WaveformPlayer url="/audio/a.mp3" onPlay={onPlay1} />);
		await waitForMount();
		expect(ctorCalls).toHaveLength(1);

		// Re-render with a fresh handler — the player must NOT re-mount…
		const onPlay2 = vi.fn();
		rerender(<WaveformPlayer url="/audio/a.mp3" onPlay={onPlay2} />);
		await new Promise<void>((resolve) => setTimeout(resolve, 50));
		expect(ctorCalls).toHaveLength(1);

		// …yet the wrapper the core still holds now routes to onPlay2.
		const { opts, stub } = ctorCalls[0];
		(opts.onPlay as (i: unknown) => void)(stub);

		expect(onPlay2).toHaveBeenCalledWith(stub);
		expect(onPlay1).not.toHaveBeenCalled();
	});
});

// ─── Lifecycle: unmount + re-mount on prop change ────────────────────────

describe('<WaveformPlayer> — lifecycle', () => {
	it('calls destroy() on unmount', async () => {
		const { unmount } = render(<WaveformPlayer url="/audio/a.mp3" />);
		await waitForMount();
		const { stub } = ctorCalls[0];

		unmount();
		expect(stub.destroy).toHaveBeenCalledTimes(1);
	});

	it('re-mounts when url changes (destroys old, constructs new)', async () => {
		const { rerender } = render(<WaveformPlayer url="/audio/a.mp3" />);
		await waitForMount();
		expect(ctorCalls).toHaveLength(1);

		rerender(<WaveformPlayer url="/audio/b.mp3" />);
		await waitForMount(2);

		expect(ctorCalls).toHaveLength(2);
		// First instance got destroyed during the re-mount
		expect(ctorCalls[0].stub.destroy).toHaveBeenCalled();
		// Second instance got the new URL
		expect(ctorCalls[1].opts.url).toBe('/audio/b.mp3');
	});

	it('re-mounts when waveformStyle changes', async () => {
		const { rerender } = render(<WaveformPlayer url="/audio/a.mp3" waveformStyle="bars" />);
		await waitForMount();

		rerender(<WaveformPlayer url="/audio/a.mp3" waveformStyle="line" />);
		await waitForMount(2);

		expect(ctorCalls).toHaveLength(2);
		expect(ctorCalls[1].opts.waveformStyle).toBe('line');
	});

	it('does NOT re-mount when only callback props change (callback churn protection)', async () => {
		const onPlay1 = vi.fn();
		const { rerender } = render(<WaveformPlayer url="/audio/a.mp3" onPlay={onPlay1} />);
		await waitForMount();
		expect(ctorCalls).toHaveLength(1);

		const onPlay2 = vi.fn();
		rerender(<WaveformPlayer url="/audio/a.mp3" onPlay={onPlay2} />);
		/* Wait a microtask to give any spurious re-mount a chance to
		 * happen, then confirm it didn't. */
		await new Promise<void>((resolve) => setTimeout(resolve, 50));

		// Still only one ctor call — passing a new inline callback
		// on a parent re-render must not tear the player down.
		expect(ctorCalls).toHaveLength(1);
	});
});

// ─── forwardRef + imperative handle ──────────────────────────────────────

describe('<WaveformPlayer> — imperative ref', () => {
	it('exposes play / pause / togglePlay / seekTo on the ref', async () => {
		const ref = createRef<WaveformPlayerHandle>();
		render(<WaveformPlayer ref={ref} url="/audio/a.mp3" />);
		await waitForMount();
		const { stub } = ctorCalls[0];

		ref.current?.play();
		ref.current?.pause();
		ref.current?.togglePlay();
		ref.current?.seekTo(30);

		expect(stub.play).toHaveBeenCalledTimes(1);
		expect(stub.pause).toHaveBeenCalledTimes(1);
		expect(stub.togglePlay).toHaveBeenCalledTimes(1);
		expect(stub.seekTo).toHaveBeenCalledWith(30);
	});

	it('forwards setVolume / setPlaybackRate / setProgress / setPlayingState', async () => {
		const ref = createRef<WaveformPlayerHandle>();
		render(<WaveformPlayer ref={ref} url="/audio/a.mp3" />);
		await waitForMount();
		const { stub } = ctorCalls[0];

		ref.current?.setVolume(0.5);
		ref.current?.setPlaybackRate(1.25);
		ref.current?.setProgress(10, 100);
		ref.current?.setPlayingState(true);

		expect(stub.setVolume).toHaveBeenCalledWith(0.5);
		expect(stub.setPlaybackRate).toHaveBeenCalledWith(1.25);
		expect(stub.setProgress).toHaveBeenCalledWith(10, 100);
		expect(stub.setPlayingState).toHaveBeenCalledWith(true);
	});

	it('forwards loadTrack with title / subtitle / options', async () => {
		const ref = createRef<WaveformPlayerHandle>();
		render(<WaveformPlayer ref={ref} url="/audio/a.mp3" />);
		await waitForMount();
		const { stub } = ctorCalls[0];

		await ref.current?.loadTrack('/audio/b.mp3', 'New Title', 'New Artist', {
			markers: [{ time: 0, label: 'Intro' }],
		});

		expect(stub.loadTrack).toHaveBeenCalledWith(
			'/audio/b.mp3',
			'New Title',
			'New Artist',
			{ markers: [{ time: 0, label: 'Intro' }] }
		);
	});

	it('exposes the raw instance on ref.current.instance', async () => {
		const ref = createRef<WaveformPlayerHandle>();
		render(<WaveformPlayer ref={ref} url="/audio/a.mp3" />);
		await waitForMount();

		expect(ref.current?.instance).toBeTruthy();
	});
});
