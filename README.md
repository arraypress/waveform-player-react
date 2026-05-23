# @arraypress/waveform-player-react

React component wrapper around [`@arraypress/waveform-player`](https://github.com/arraypress/waveform-player). `forwardRef`-friendly, `useEffect` lifecycle, typed props for every library option, and an imperative handle for `play() / pause() / seekTo() / loadTrack()` that mirrors the underlying instance.

The core library stays a zero-dependency vanilla-JS package that works anywhere a `<script>` tag does. This package adds the framework-native ergonomics React developers expect.

```tsx
import { WaveformPlayer } from '@arraypress/waveform-player-react';

function App() {
  return <WaveformPlayer url="/audio/track.mp3" title="My Track" />;
}
```

## Installation

```bash
npm install @arraypress/waveform-player-react @arraypress/waveform-player react
```

`react` (^18 or ^19) and `@arraypress/waveform-player` (^1.6) are peer dependencies — you bring them so you control the versions.

## Setup

Import the core library's CSS **once** in your app entry (Vite `main.tsx`, Next.js `app/layout.tsx`, Remix `root.tsx`, etc.):

```ts
import '@arraypress/waveform-player/dist/waveform-player.css';
```

The wrapper does **not** import the CSS for you — your bundler should own that decision. The library's JS is loaded dynamically inside `useEffect`, so SSR / RSC environments don't trip over the browser-only audio APIs.

## Usage

### Basic

```tsx
<WaveformPlayer url="/audio/track.mp3" />
```

### With metadata + chosen style

```tsx
<WaveformPlayer
  url="/audio/track.mp3"
  title="Midnight Dreams"
  subtitle="The Wavelength"
  artwork="/img/cover.jpg"
  waveformStyle="bars"
  barWidth={3}
  barSpacing={1}
  height={80}
/>
```

### Pre-computed peaks (recommended for catalogues)

```tsx
<WaveformPlayer url="/audio/track.mp3" waveform="/peaks/track.json" />
```

Generate the JSON at build time with [`@arraypress/waveform-gen`](https://github.com/arraypress/waveform-gen). Removes the Web Audio decode cost (~1–5 s per file) from the render path.

### Chapter markers

```tsx
<WaveformPlayer
  url="/audio/podcast.mp3"
  markers={[
    { time: 0,   label: 'Intro' },
    { time: 60,  label: 'Main topic', color: '#a855f7' },
    { time: 600, label: 'Q&A' },
  ]}
/>
```

### Event callbacks

Every event the core library exposes is a typed prop:

```tsx
<WaveformPlayer
  url="/audio/track.mp3"
  onLoad={(instance) => console.log('loaded', instance)}
  onPlay={() => console.log('playing')}
  onPause={() => console.log('paused')}
  onTimeUpdate={(currentTime, duration) => console.log(`${currentTime}s / ${duration}s`)}
  onEnd={() => console.log('finished')}
  onError={(err) => console.error('audio failed:', err)}
/>
```

Callback props **don't trigger re-mounts** — the wrapper intentionally keeps them out of its effect's dep array so a parent re-rendering with new inline functions on every render doesn't tear the player down.

### Imperative control via ref

For "play this track when X happens" flows where wiring through props is awkward:

```tsx
import { useRef } from 'react';
import { WaveformPlayer, type WaveformPlayerHandle } from '@arraypress/waveform-player-react';

function Controlled() {
  const playerRef = useRef<WaveformPlayerHandle>(null);

  return (
    <>
      <WaveformPlayer ref={playerRef} url="/audio/track.mp3" />
      <button onClick={() => playerRef.current?.togglePlay()}>Play / Pause</button>
      <button onClick={() => playerRef.current?.seekTo(30)}>Jump to 0:30</button>
      <button onClick={() => playerRef.current?.setVolume(0.5)}>Vol 50%</button>
    </>
  );
}
```

The handle methods (`play()`, `pause()`, `togglePlay()`, `seekTo()`, `seekToPercent()`, `setVolume()`, `setPlaybackRate()`, `setPlayingState()`, `setProgress()`, `loadTrack()`) pass straight through to the underlying instance. `ref.current?.instance` exposes the raw instance for anything the handle doesn't surface yet.

### External audio mode

When pairing with `@arraypress/waveform-bar` (or any other audio controller you own), the player can render visualisation only and surrender audio playback to the controller:

```tsx
<WaveformPlayer
  url={track.url}
  audioMode="external"
  waveformStyle="seekbar"
  showInfo={false}
/>
```

The player dispatches `waveformplayer:request-play | request-pause | request-seek` events instead of touching audio itself. Drive the visualisation from your controller via `playerRef.current?.setProgress(currentTime, duration)` and `setPlayingState(playing)`.

## How prop changes are handled

When **any** prop the core library uses at construction time changes (`url`, `audioMode`, `waveformStyle`, `markers`, colours, sizing, etc.), the wrapper destroys the existing instance and creates a new one with the updated options. That's simpler and more correct than diffing every option and calling the right granular updater, and the core library has built-in caches (waveform peaks keyed by URL) that make same-URL re-mounts cheap.

Callback props are deliberately **not** in the dep array — a parent re-rendering with a fresh inline `onPlay={() => …}` shouldn't tear the player down.

## Props

Every library option surfaces as a typed prop. See the full table in [`src/types.ts`](./src/types.ts) for JSDoc per prop.

### Audio source

| Prop        | Type                                  | Default      |
| ----------- | ------------------------------------- | ------------ |
| `url`       | `string` *(required)*                 | —            |
| `audioMode` | `'self' \| 'external'`                | `'self'`     |
| `preload`   | `'auto' \| 'metadata' \| 'none'`      | `'metadata'` |

### Waveform visualisation

| Prop            | Type                                                          | Default    |
| --------------- | ------------------------------------------------------------- | ---------- |
| `waveformStyle` | `'bars' \| 'mirror' \| 'line' \| 'blocks' \| 'dots' \| 'seekbar'` | `'mirror'` |
| `height`        | `number`                                                      | `60`       |
| `samples`       | `number`                                                      | `200`      |
| `barWidth`      | `number`                                                      | style-dep  |
| `barSpacing`    | `number`                                                      | style-dep  |
| `waveform`      | `number[] \| string`                                          | —          |

### Colours

All optional. `colorPreset` controls the auto theme; any individual colour wins over the preset.

| Prop                  | Type                            |
| --------------------- | ------------------------------- |
| `colorPreset`         | `'dark' \| 'light' \| null`     |
| `waveformColor`       | `string`                        |
| `progressColor`       | `string`                        |
| `buttonColor`         | `string`                        |
| `buttonHoverColor`    | `string`                        |
| `textColor`           | `string`                        |
| `textSecondaryColor`  | `string`                        |

### Playback / UI / behaviour

| Prop                | Type                                       | Default                              |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| `playbackRate`      | `number`                                   | `1`                                  |
| `showPlaybackSpeed` | `boolean`                                  | `false`                              |
| `playbackRates`     | `number[]`                                 | `[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]` |
| `showControls`      | `boolean`                                  | `true`                               |
| `showInfo`          | `boolean`                                  | `true`                               |
| `showTime`          | `boolean`                                  | `true`                               |
| `showBPM`           | `boolean`                                  | `false`                              |
| `buttonAlign`       | `'auto' \| 'top' \| 'center' \| 'bottom'`  | `'auto'`                             |
| `autoplay`          | `boolean`                                  | `false`                              |
| `singlePlay`        | `boolean`                                  | `true`                               |
| `playOnSeek`        | `boolean`                                  | `true`                               |
| `enableMediaSession`| `boolean`                                  | `true`                               |

### Markers + metadata

| Prop          | Type                                                       |
| ------------- | ---------------------------------------------------------- |
| `markers`     | `Array<{ time: number; label: string; color?: string }>`   |
| `showMarkers` | `boolean`                                                  |
| `title`       | `string`                                                   |
| `subtitle`    | `string`                                                   |
| `artwork`     | `string`                                                   |
| `album`       | `string`                                                   |

### Callbacks (DO NOT trigger re-mount)

| Prop           | Signature                                                      |
| -------------- | -------------------------------------------------------------- |
| `onLoad`       | `(instance: unknown) => void`                                  |
| `onPlay`       | `(instance: unknown) => void`                                  |
| `onPause`      | `(instance: unknown) => void`                                  |
| `onEnd`        | `(instance: unknown) => void`                                  |
| `onTimeUpdate` | `(currentTime: number, duration: number, instance: unknown) => void` |
| `onError`      | `(error: Error, instance: unknown) => void`                    |

### React-specific

| Prop        | Type                       |
| ----------- | -------------------------- |
| `id`        | `string`                   |
| `className` | `string`                   |
| `style`     | `React.CSSProperties`      |
| `ref`       | `Ref<WaveformPlayerHandle>` |

## TypeScript

```ts
import type {
  WaveformPlayerProps,
  WaveformPlayerHandle,
  WaveformStyle,
  WaveformMarker,
  WaveformPeaks,
  ColorPreset,
  AudioMode,
  AudioPreload,
  ButtonAlign,
} from '@arraypress/waveform-player-react';
```

The package ships `.d.ts` for both ESM and CJS consumers.

## Testing

```bash
npm test          # one-shot
npm run test:watch
npm run typecheck
npm run build     # emit dist/index.js, dist/index.cjs, dist/index.d.ts
```

The core library is mocked at the module boundary (jsdom has no Web Audio API). 17 tests cover mount / unmount, option pass-through, ref forwarding, identity-prop re-mount, and callback-churn protection.

## License

MIT © ArrayPress
