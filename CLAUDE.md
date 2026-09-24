# CLAUDE.md — @arraypress/waveform-player-react

React wrapper for `@arraypress/waveform-player`. Passes constructor options to the
core and manages its lifecycle.

## Commands
- `npm test` — vitest + jsdom (run before committing).
- `npm run build` — bundles to `dist/`. `prepublishOnly` runs it. `dist/` is gitignored.

## The rule that matters: two edits per option, both manual

`src/WaveformPlayer.tsx`. A new option needs **both**:
1. `if (props.<key> !== undefined) opts.<key> = props.<key>;` in `buildLibraryOptions`.
2. `props.<key>,` added to the remount `useEffect` deps array.

Skip (1) and the option never reaches the player. Skip (2) and it works on first
render but **changing it at runtime does nothing** — the player never remounts.
The second failure is the one that survives a shallow test.

`test/forwarding-drift.test.tsx` enumerates the installed core's option surface
and fails on either miss. A deliberately unforwarded option goes in its
`NOT_FORWARDED` map with a reason; a new option with a `null` default needs a
sample value in `test/core-options.ts` (the test says so).

## Conventions
- Prop **types** derive from core's `WaveformPlayerOptions` via `Omit<>` — never
  re-declare the option surface. Type inheritance forwards nothing at runtime;
  `buildLibraryOptions` is the real contract.
- `style` stays React's CSS prop — the visual style prop is `waveformStyle`.
- Add a mirror test under `test/` + a `CHANGELOG.md` entry.

## Cross-repo
One of 15 packages that must change together — load the `waveform-release` skill.
