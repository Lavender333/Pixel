# PixelStudioCore Implementation (Phase 2)

This repository includes a modular engine foundation under `src/core` (exposed via `src/engine/`),
and React UI components in `src/` (transitioning to `src/components/`).

## Directory Structure

```
src/
  engine/           ← public barrel re-exporting the core engine layer
  components/       ← React UI components (toolbar, color picker, frame timeline)
  core/
    animation/AnimationEngine.ts   — timeline advancement (loop / ping-pong / once)
    export/ExportEngine.ts         — PNG and sprite-sheet export pipeline
    render/RenderEngine.ts         — pixel-perfect rendering (offscreen canvas + DPR)
    state/CommandStack.ts          — command-based undo/redo with pixel-diff support
    state/ProjectStateEngine.ts    — authoritative project state (frames, palette)
    tools/ToolEngine.ts            — brush / scanline-fill / replace / outline / shade
    types.ts                       — engine-level types / contracts
    index.ts                       — public barrel
```

## Design Principles

- Palette-indexed typed arrays (`Uint16Array`) for memory and speed
- Command stack for deterministic undo/redo (pixel-diff commands reduce memory overhead)
- Pixel-safe renderer (`imageSmoothingEnabled = false`, integer pan, offscreen canvas)
- High-DPI (Retina) support via `RenderEngine.syncDpr()` — scales the canvas backing
  store by `window.devicePixelRatio` and applies a matching CSS-pixel transform
- Onion-skin rendering via `RenderEngine.renderOnionSkin()` with adjustable opacity
- Tool algorithms detached from UI state
- Export logic detached from React components

## Key Features (Phase 2 additions)

### Offscreen Canvas Rendering (`RenderEngine`)
An internal `pixelGrid` (`ImageData`) buffer decouples data manipulation from
rendering.  Pixel changes are written to the buffer first; the buffer is then
flushed to a private offscreen `<canvas>` and scaled/blitted to the visible
canvas using `ctx.drawImage`.  This avoids per-pixel `fillRect` calls on the
visible canvas and makes dirty-rect partial redraws cheap.

### Device Pixel Ratio Support (`RenderEngine.syncDpr`)
`syncDpr()` sizes the canvas backing store to `cssWidth × dpr` × `cssHeight × dpr`
and applies `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so all drawing coordinates
remain in CSS pixels.  Call this on `resize` events and after mount.

### Onion Skin Support (`RenderEngine.renderOnionSkin`)
`renderOnionSkin(frame, palette, opacity?)` renders a neighbouring frame at
reduced `globalAlpha` onto the current canvas, suitable for animation preview.
The method reuses the same offscreen canvas pipeline for consistency.

### Scanline Flood Fill (`ToolEngine.floodFill`)
The previous 4-directional pixel stack has been replaced with a **scanline
algorithm** that processes entire horizontal spans at a time.  The stack stores
`[leftX, rightX, y, fromDirection]` tuples instead of individual pixels,
reducing peak stack depth from O(n²) to O(n) for an n×n grid and eliminating
stack-overflow risk on large canvases.

### Pixel-Diff Undo/Redo (`PixelDiffCommand`)
`PixelDiffCommand.record(frameId, before, after, label?)` diffs two pixel
arrays and stores only the changed indices, dramatically reducing per-command
memory vs. storing full grid snapshots.  Use with `CommandStack.execute()`.

## Integration Roadmap

### Step 1 (done)
Engine scaffolding — `RenderEngine`, `ToolEngine`, `CommandStack`, `ProjectStateEngine`,
`AnimationEngine`, `ExportEngine`.

### Step 2 (done)
Offscreen canvas pipeline, DPR support, onion-skin API, scanline fill,
pixel-diff undo, `src/engine/` + `src/components/` directory structure.

### Step 3
Introduce an adapter layer:

- existing `Frame` (`string[]`) ⇄ core `PixelFrame` (`Uint16Array`)
- existing palette strings ⇄ core `PaletteEntry[]`

### Step 4
Move editing operations to `ToolEngine` and state transitions to `ProjectStateEngine` commands.
Wire `PixelDiffCommand` to the existing undo/redo buttons in the React UI.

### Step 5
Swap canvas draw path to `RenderEngine` with dirty rect tracking.
Move playback scheduler to `AnimationEngine` for deterministic frame stepping.

## Notes

- GIF export is intentionally a stub in `ExportEngine` and should be wired to a worker-based encoder in production.
- Import from `src/engine` (not `src/core`) in new code to respect the layered architecture.
