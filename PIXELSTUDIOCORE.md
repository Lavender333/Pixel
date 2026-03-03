# PixelStudioCore Implementation (Phase 1)

This repository now includes a modular engine foundation under `src/core`:

- `state/ProjectStateEngine.ts` — authoritative project state (frames, palette, active frame)
- `state/CommandStack.ts` — command-based undo/redo execution
- `tools/ToolEngine.ts` — low-level brush/fill/replace/outline/shade operations
- `render/RenderEngine.ts` — pixel-perfect canvas rendering with dirty-rect support
- `animation/AnimationEngine.ts` — timeline advancement with loop/ping-pong/once behavior
- `export/ExportEngine.ts` — PNG and sprite-sheet export pipeline
- `types.ts` — engine-level types/contracts
- `index.ts` — public barrel

## Design Principles

- Palette-indexed typed arrays (`Uint16Array`) for memory and speed
- Command stack for deterministic undo/redo
- Pixel-safe renderer (`imageSmoothingEnabled = false`, integer pan)
- Tool algorithms detached from UI
- Export logic detached from React components

## Integration Roadmap

### Step 1 (safe)
Use `ExportEngine` from UI actions while keeping existing frame model.

### Step 2
Introduce an adapter layer:

- existing `Frame` (`string[]`) ⇄ core `PixelFrame` (`Uint16Array`)
- existing palette strings ⇄ core `PaletteEntry[]`

### Step 3
Move editing operations to `ToolEngine` and state transitions to `ProjectStateEngine` commands.

### Step 4
Swap canvas draw path to `RenderEngine` with dirty rect tracking.

### Step 5
Move playback scheduler to `AnimationEngine` for deterministic frame stepping.

## Notes

- GIF export is intentionally a stub in `ExportEngine` and should be wired to a worker-based encoder in production.
- This phase is production-safe scaffolding: additive, no risky rewrites to current app behavior.
