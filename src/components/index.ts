/**
 * UI components barrel.
 *
 * React components responsible for the visual interface live here:
 *   - Toolbar (tool selection, brush size, eraser, fill, picker)
 *   - Color picker
 *   - Frame timeline
 *   - Canvas overlay controls (zoom, pan, grid toggle, onion skinning)
 *
 * All rendering and state logic should be delegated to the engine layer
 * (`src/engine/`) rather than being embedded in components.
 */
export * from '../PixelCanvas';
