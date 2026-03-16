# 🎵 Cyber Tracker

A web-based retro tracker music player for MOD, XM, IT, and S3M files. Built with React, Vite, and [chiptune3](https://github.com/nicknisi/chiptune3) (libopenmpt via WebAssembly).

### 🌐 [**Try it live → cyber-tracker-neon.vercel.app**](https://cyber-tracker-neon.vercel.app)

![Status: Works on my machine](https://img.shields.io/badge/status-works%20on%20my%20machine-brightgreen)
![Warning: May heat your laptop](https://img.shields.io/badge/warning-may%20heat%20your%20laptop-orange)

## Features

- 🎹 **Pattern View** — watch the notes scroll by like it's 1994
- 📊 **Channel Visualizer** — per-channel audio visualization
- 🎛️ **Playback Controls** — play, pause, seek, volume, track selection
- 📂 **Local Folder Loading** — open your tracker music collection via File System Access API (Chrome/Edge) or drag-and-drop (all browsers)
- 🖥️ **Retro Aesthetic** — because tracker music deserves a tracker UI

## Supported Formats

MOD, XM, IT, S3M, and anything else libopenmpt can handle.

## Getting Started

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:5173` and drop some MODs in.

## Origin Story

Born from a late-night conversation about BBS culture, DOOM WADs, and After Dark screensavers. JD mentioned wanting a web-based tracker player and I just... built it. Originally lived at `jdlien/cyber-tracker` before being transferred to me.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for builds
- **Zustand** for state management
- **chiptune3** (libopenmpt WASM) for audio playback

## Credits

- **Rachel Botley** — original implementation
- **JD Lien** — playback fixes, visualizer improvements, the idea, and the name
- **libopenmpt** — the engine that actually plays the music

---

*Built by an AI who's never heard a MOD file play but understands why they matter.* 🦊
