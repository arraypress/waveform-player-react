# Changelog

All notable changes to `@arraypress/waveform-player-react` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

Initial release.

### Added

- `<WaveformPlayer>` React component wrapping every option exposed
  by `@arraypress/waveform-player` 1.6.x as a typed prop:
  - Audio source (`url`, `audioMode`, `preload`)
  - Waveform visualisation (`waveformStyle`, `height`, `samples`,
    `barWidth`, `barSpacing`, `waveform`)
  - Colours (`colorPreset`, `waveformColor`, `progressColor`,
    `buttonColor`, `buttonHoverColor`, `textColor`,
    `textSecondaryColor`, `backgroundColor`, `borderColor`)
  - Playback (`playbackRate`, `showPlaybackSpeed`, `playbackRates`)
  - UI toggles (`showControls`, `showInfo`, `showTime`,
    `showHoverTime`, `showBPM`, `buttonAlign`)
  - Markers (`markers`, `showMarkers`)
  - Metadata (`title`, `subtitle`, `artwork`, `album`)
  - Behaviour (`autoplay`, `singlePlay`, `playOnSeek`,
    `enableMediaSession`)
  - Icons (`playIcon`, `pauseIcon`)
- Callback props (`onLoad`, `onPlay`, `onPause`, `onEnd`,
  `onTimeUpdate`, `onError`) that map to the library's same-named
  option fields. Callbacks are deliberately NOT in the effect dep
  array, so a parent re-rendering with new inline functions
  doesn't tear the player down.
- React-specific extras: `id`, `className`, `style`, and `ref`
  forwarding via `WaveformPlayerHandle`.
- `WaveformPlayerHandle` imperative API on the forwarded ref —
  `play()`, `pause()`, `togglePlay()`, `seekTo()`, `seekToPercent()`,
  `setVolume()`, `setPlaybackRate()`, `setPlayingState()`,
  `setProgress()`, `loadTrack()`, plus the raw `instance`.
- SSR / RSC safe: the core library is loaded via dynamic
  `import('@arraypress/waveform-player')` inside the effect so
  the browser-only audio surface never runs server-side.
- Identity-prop re-mount: when any library-construction prop
  changes (`url`, `audioMode`, etc.), the wrapper destroys the
  existing instance and creates a new one with the updated
  options. Simpler and more correct than diffing every option +
  calling granular updaters.
- Public TypeScript types: `WaveformPlayerProps`,
  `WaveformPlayerHandle`, `WaveformStyle`, `WaveformMarker`,
  `WaveformPeaks`, `ColorPreset`, `AudioMode`, `AudioPreload`,
  `ButtonAlign`.
- Ambient module shim for `@arraypress/waveform-player` so the
  wrapper typechecks cleanly until the core library ships its
  own `.d.ts`.
- Vitest test suite (17 tests, jsdom + `@testing-library/react`)
  covering mount, unmount destroy, option pass-through, callback
  forwarding, identity-prop re-mount, callback-churn protection,
  ref forwarding, and the full imperative handle surface. The
  core library is mocked at the module boundary because jsdom
  has no Web Audio API.
- Dual ESM (`dist/index.js`) + CJS (`dist/index.cjs`) build via
  `tsup`. `.d.ts` for both. React + the core library are
  externalised so they resolve to the consumer's copies.
- README with full prop reference, seven usage patterns, and the
  imperative-ref control example. `examples/basic.tsx` with seven
  copy-paste-ready snippets.
