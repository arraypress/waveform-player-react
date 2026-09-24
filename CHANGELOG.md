# Changelog

All notable changes to `@arraypress/waveform-player-react` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Forwarding-drift test.** `test/forwarding-drift.test.tsx` enumerates the
  installed core's option surface (`DEFAULT_OPTIONS` plus the
  `WaveformPlayerOptions` keys) and fails for any option that isn't forwarded,
  doesn't remount on change, or isn't listed in `NOT_FORWARDED` with a reason —
  so the next core option can't be dropped the way the ones above were.
  Test-only; adds `@types/node` as a dev dependency.

### Fixed

- **`waveformGradient` and `seekHandle` now reach the player.** Both have been
  typed props since the core added them (1.18.0 / 1.17.0), because the props
  derive from `WaveformPlayerOptions` — but `buildLibraryOptions` is a
  hand-written allowlist that never listed them, so they type-checked and were
  silently dropped.
- **`onNextTrack` / `onPreviousTrack` now reach the player**, so the lock-screen
  / system media controls show skip buttons when you supply them. They were
  typed but never forwarded. They're passed only when set: the core registers
  the Media Session action whenever the option is a function, so an
  unconditional wrapper would show buttons that do nothing. Like the other
  callbacks they're routed through a ref — a fresh inline handler doesn't
  remount — but adding or removing one does, since the core reads it at
  construction.
- **Changing `layout`, `buttonStyle` or `bpm` at runtime now remounts the
  player.** They were forwarded on first mount but missing from the remount
  `useEffect` deps, so later changes did nothing.
- **`WaveformPlayerHandle.setPlaybackRate` documents the real range** —
  `0.25..4`, what the core clamps to — instead of `0.5..2`.

## [0.8.0] — 2026-09-22

### Changed

- **Loads `@arraypress/waveform-player/no-autoinit` instead of the package
  root.** Importing the root scans the whole document for
  `[data-waveform-player]` markup and builds a player for every match. This
  component constructs its own player on its own ref and wants none of that.
  In a pure React app the scan found nothing and merely cost a
  `querySelectorAll`; as an island on a page that *does* carry such markup — a
  CMS page, a WordPress template, an Astro or Rails view — mounting this
  component silently mounted players the React tree never asked for, and owned
  them for the rest of the page's life. Same class, same options, same
  behaviour for everything this component builds; the only thing that changes
  is that nothing else on the page gets touched.

### Breaking

- **Peer floor raised to `@arraypress/waveform-player@^1.27.0`**, the release
  that added the `/no-autoinit` entry point. This is the first hard floor in
  the family rather than the usual soft one: on an older core the subpath does
  not exist, so it fails at mount, in the browser. Bump the core alongside this
  package.

## [0.7.0] — 2026-07-22

### Added

- **`crossOrigin` prop.** Exposes the option added in
  `@arraypress/waveform-player@1.23.0`: sets the CORS mode of the underlying
  `<audio>` (`'anonymous'` | `'use-credentials'`). Omitted from the options bag
  by default so the player behaves like a native `<audio>` and never forces a
  CORS request that would break CDN media without `Access-Control-Allow-Origin`.

## [0.6.0] — 2026-07-17

### Added

- **`buttonRadius` and `artworkPosition` props.** Exposes the two options added
  in `@arraypress/waveform-player` 1.22.0: `buttonRadius` sets the play button's
  corner radius (`0` for square, or any CSS length), and `artworkPosition`
  (`'info'` | `'button'`) chooses whether the cover renders in the info row or
  becomes the play button itself.

  Both prop *types* already flowed through automatically, since the props derive
  from the core's `WaveformPlayerOptions` — but the options bag is written by hand, so
  until now they would have type-checked and then silently done nothing. Tests
  now cover the mapping for exactly that reason.

  The peer range stays `^1.20.0`: the props only appear once the consumer's own
  core is on 1.22.0, so nothing breaks on an older one.

## [0.5.0] — 2026-07-05

### Added

- Forward the core player's new localizable UI-string options —
  `seekValueText`, `playPauseLabel`, `speedLabel`, `artworkAlt`, and
  `unknownTrackText` — through to the underlying player. Requires
  `@arraypress/waveform-player@^1.20.0`.

### Changed

- Public types are now adopted from the core
  `@arraypress/waveform-player` (v1.8.0+), which ships a hand-authored
  `index.d.ts`. The shared option surface (`WaveformStyle`,
  `ColorPreset`, `AudioMode`, `AudioPreload`, `ButtonAlign`,
  `WaveformMarker`, `WaveformPeaks`) is re-exported from the core, and
  `WaveformPlayerProps` now `extends` the core's `WaveformPlayerOptions`
  instead of re-declaring every field. The core is the single source of
  truth, so the wrapper's types can no longer drift out of sync. Bumped
  the `@arraypress/waveform-player` peer (and dev) dependency to
  `^1.8.0`.
- Callback props (`onLoad`, `onPlay`, `onPause`, `onEnd`,
  `onTimeUpdate`, `onError`) and the `WaveformPlayerHandle.instance`
  accessor are now typed with the core's `WaveformPlayer` class instead
  of `unknown`.

### Added

- `accessibleSeek`, `seekLabel`, `barRadius`, and gradient-array
  waveform / progress colours (`string[]`) are now exposed as typed
  props — picked up for free by extending the core options and wired
  through to the underlying player.

### Removed

- Deleted `src/core-module-shim.d.ts`, the loose ambient
  `declare module '@arraypress/waveform-player'` shim that only existed
  while the core had no shipped types.

## [0.1.1] — 2026-06-27

### Changed

- Bumped the `@arraypress/waveform-player` peer (and dev) dependency to
  `^1.7.2`. Consumers now get the native accessible keyboard / ARIA seek
  slider by default. No component API changes.

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
  - Metadata (`title`, `artist`, `artwork`, `album`)
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
