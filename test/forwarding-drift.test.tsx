/// <reference types="node" />
/**
 * test/forwarding-drift.test.tsx
 * ------------------------------
 *
 * Guards the one contract types can't: that every option the installed core
 * accepts actually reaches `new WaveformPlayer(el, opts)`, and that changing
 * it remounts the player.
 *
 * `WaveformPlayerProps` derives from the core's `WaveformPlayerOptions`, so a
 * new core option type-checks here for free — and is then silently dropped,
 * because `buildLibraryOptions` and the remount deps array are hand-written
 * allowlists. This suite enumerates the core's real option surface (see
 * `core-options.ts`) and fails for any key that is neither forwarded nor
 * listed in `NOT_FORWARDED` with a reason. Adding a core option without
 * wiring it here must fail this test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { WaveformPlayer } from '../src/WaveformPlayer';
import type { WaveformPlayerProps } from '../src/types';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isCallbackKey, loadCoreOptionKeys, loadCoreThemes, sampleValues } from './core-options';

/**
 * Core options this wrapper deliberately does NOT forward, each with why.
 * Everything else the core accepts must reach the constructor.
 */
const NOT_FORWARDED: Record<string, string> = {
	// React's inline-CSS prop for the host <div>. The core's `style` is only a
	// shorthand alias for `waveformStyle`, which is forwarded under its
	// canonical name.
	style: 'React CSS prop on the host div; use waveformStyle for the visual style',
};

/** Core keys forwarded under a different option name. */
const FORWARDED_AS: Record<string, string> = {
	// `src` is the core's shorthand for `url`; the wrapper resolves it to `url`.
	src: 'url',
};

type Ctor = { opts: Record<string, unknown>; stub: { destroy: () => void } };
const ctorCalls: Ctor[] = [];

vi.mock('@arraypress/waveform-player', () => {
	throw new Error('[test] component imported the scanning entry point');
});

vi.mock('@arraypress/waveform-player/no-autoinit', () => {
	const Ctor = vi.fn(function (this: object, _el: HTMLElement, opts: Record<string, unknown>) {
		const stub = { destroy: vi.fn() };
		ctorCalls.push({ opts, stub });
		Object.assign(this, stub);
	});
	return { default: Ctor, WaveformPlayer: Ctor };
});

beforeEach(() => {
	ctorCalls.length = 0;
	cleanup();
});

/** Props that set `key` to `value`, plus a url unless `key` is the url alias. */
function propsFor(key: string, value: unknown): WaveformPlayerProps {
	return (key === 'src' || key === 'url' ? { [key]: value } : { url: '/a.mp3', [key]: value }) as WaveformPlayerProps;
}

async function mounted(count: number): Promise<boolean> {
	try {
		await waitFor(() => expect(ctorCalls.length).toBeGreaterThanOrEqual(count), { timeout: 500 });
		return true;
	} catch {
		return false;
	}
}

describe('<WaveformPlayer> — forwarding drift vs the installed core', () => {
	it('forwards every core option, or lists it in NOT_FORWARDED with a reason', async () => {
		const { keys, defaults } = await loadCoreOptionKeys();
		const dropped: string[] = [];

		for (const key of keys) {
			if (key in NOT_FORWARDED) continue;
			cleanup();
			ctorCalls.length = 0;

			if (isCallbackKey(key)) {
				const handler = vi.fn();
				render(<WaveformPlayer {...propsFor(key, handler)} />);
				if (!(await mounted(1))) throw new Error(`no mount for ${key}`);
				const cb = ctorCalls[0].opts[key];
				if (typeof cb !== 'function') {
					dropped.push(key);
					continue;
				}
				(cb as (...a: unknown[]) => void)(ctorCalls[0].stub);
				if (handler.mock.calls.length !== 1) dropped.push(`${key} (wrapper does not reach the handler)`);
				continue;
			}

			const [value] = sampleValues(key, defaults[key]);
			render(<WaveformPlayer {...propsFor(key, value)} />);
			if (!(await mounted(1))) throw new Error(`no mount for ${key}`);
			const got = ctorCalls[0].opts[FORWARDED_AS[key] ?? key];
			if (JSON.stringify(got) !== JSON.stringify(value)) dropped.push(key);
		}

		expect(dropped, 'core options silently dropped by buildLibraryOptions').toEqual([]);
	}, 60_000);

	it('remounts when any forwarded value option changes (remount deps are complete)', async () => {
		const { keys, defaults } = await loadCoreOptionKeys();
		const stale: string[] = [];

		for (const key of keys) {
			// Callbacks are routed through a ref and must NOT remount on
			// identity change — covered by the lifecycle suite instead.
			if (key in NOT_FORWARDED || isCallbackKey(key)) continue;
			cleanup();
			ctorCalls.length = 0;

			const [a, b] = sampleValues(key, defaults[key]);
			const { rerender } = render(<WaveformPlayer {...propsFor(key, a)} />);
			if (!(await mounted(1))) throw new Error(`no mount for ${key}`);
			rerender(<WaveformPlayer {...propsFor(key, b)} />);
			if (!(await mounted(2))) stale.push(key);
		}

		expect(stale, 'forwarded options missing from the remount useEffect deps').toEqual([]);
	}, 60_000);

	it('NOT_FORWARDED / FORWARDED_AS only name keys the core actually has', async () => {
		const { keys } = await loadCoreOptionKeys();
		const unknown = [...Object.keys(NOT_FORWARDED), ...Object.keys(FORWARDED_AS)].filter(
			(k) => !keys.includes(k)
		);
		expect(unknown, 'stale entries — the core no longer has these options').toEqual([]);
	});
});

describe('WaveformPlayerHandle docs vs the installed core', () => {
	it('documents the setPlaybackRate range the core actually clamps to', async () => {
		const { PLAYBACK_RATE_MIN, PLAYBACK_RATE_MAX } = await loadCoreThemes();
		const src = readFileSync(fileURLToPath(import.meta.url).replace(/test\/[^/]+$/, 'src/types.ts'), 'utf8');
		const doc = /Set playback rate \(([\d.]+)\.\.([\d.]+)\b/.exec(src);
		expect(doc, 'setPlaybackRate doc comment with a range').not.toBeNull();
		expect([Number(doc![1]), Number(doc![2])]).toEqual([PLAYBACK_RATE_MIN, PLAYBACK_RATE_MAX]);
	});
});
