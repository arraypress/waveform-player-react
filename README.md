<div align="center">

# Waveform Player for React

**A React component wrapper for [`@arraypress/waveform-player`](https://www.npmjs.com/package/@arraypress/waveform-player).**
Typed props for every option, an imperative ref handle, and SSR-safe dynamic loading.

[![npm version](https://img.shields.io/npm/v/@arraypress/waveform-player-react?style=flat-square&labelColor=09090b&color=3f3f46)](https://www.npmjs.com/package/@arraypress/waveform-player-react)
[![license](https://img.shields.io/npm/l/@arraypress/waveform-player-react?style=flat-square&labelColor=09090b&color=3f3f46)](https://github.com/arraypress/waveform-player-react/blob/main/LICENSE)

**[Documentation](https://docs.waveformplayer.com/)** · [npm](https://www.npmjs.com/package/@arraypress/waveform-player-react)

</div>

---

## Install

```bash
npm install @arraypress/waveform-player-react @arraypress/waveform-player react
```

Import the core CSS once in your app entry, then render the component:

```tsx
import '@arraypress/waveform-player/dist/waveform-player.css';
import { WaveformPlayer } from '@arraypress/waveform-player-react';

<WaveformPlayer url="/track.mp3" title="My Song" artist="The Artist" waveformStyle="mirror" />
```

## Documentation

Full props, the imperative API, colours, markers and SSR notes live in the docs.

### -> [docs.waveformplayer.com](https://docs.waveformplayer.com/)

[React guide](https://docs.waveformplayer.com/frameworks/react/) — install, props, the imperative API, and SSR notes. All four React wrappers (player / bar / playlist) are on that page.

## License

MIT © [ArrayPress](https://github.com/arraypress)
