import { DirtyRect, PaletteEntry, PixelFrame } from '../types';

/** Internal pixel buffer entry: RGBA components packed per pixel. */
interface PixelGridEntry {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parse a CSS hex color string (#rrggbb or #rrggbbaa) into RGBA components. */
const parseHex = (hex: string): PixelGridEntry => {
  const h = hex.replace('#', '');
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 255,
    };
  }
  if (h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16),
    };
  }
  return { r: 0, g: 0, b: 0, a: 0 };
};

export class RenderEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private zoom = 1;
  private panX = 0;
  private panY = 0;

  /**
   * Internal pixel buffer decoupling data from rendering.
   * Stores resolved RGBA values for the current frame at 1:1 scale before
   * being scaled/transferred to the visible canvas.
   */
  private pixelGrid: ImageData | null = null;

  /** Offscreen canvas used as an intermediate rendering target. */
  private offscreen: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('RenderEngine: failed to create 2D context');
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.syncDpr();
  }

  /**
   * Synchronise the canvas backing-store size with the current device pixel
   * ratio so pixels map 1-to-1 on high-DPI (Retina) screens.
   */
  syncDpr() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const width = Math.max(1, Math.floor(cssWidth * dpr));
    const height = Math.max(1, Math.floor(cssHeight * dpr));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      // Scale the drawing context so all coordinates can be expressed in CSS
      // pixels while the underlying backing store uses physical pixels.
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  setView(zoom: number, panX: number, panY: number) {
    this.zoom = Math.max(0.25, zoom);
    this.panX = Math.round(panX);
    this.panY = Math.round(panY);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  /**
   * Ensure the offscreen canvas and pixelGrid buffer match the given frame
   * dimensions.  Creates or resizes them as needed.
   */
  private ensureOffscreen(width: number, height: number) {
    if (!this.offscreen || this.offscreen.width !== width || this.offscreen.height !== height) {
      this.offscreen = document.createElement('canvas');
      this.offscreen.width = width;
      this.offscreen.height = height;
      const ctx = this.offscreen.getContext('2d', { alpha: true });
      if (!ctx) throw new Error('RenderEngine: failed to create offscreen 2D context');
      this.offscreenCtx = ctx;
      this.offscreenCtx.imageSmoothingEnabled = false;
    }
    if (!this.pixelGrid || this.pixelGrid.width !== width || this.pixelGrid.height !== height) {
      this.pixelGrid = this.offscreenCtx!.createImageData(width, height);
    }
  }

  /**
   * Write palette-resolved RGBA values into the pixelGrid buffer for the
   * region [startX, endX) × [startY, endY).
   */
  private updatePixelGrid(
    frame: PixelFrame,
    palette: PaletteEntry[],
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) {
    if (!this.pixelGrid) return;
    const data = this.pixelGrid.data;
    const fw = frame.width;

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const srcIdx = y * fw + x;
        const dstIdx = (y * fw + x) * 4;
        const paletteIndex = frame.pixels[srcIdx];
        const entry = palette[paletteIndex];

        if (!entry || paletteIndex === 0) {
          data[dstIdx] = 0;
          data[dstIdx + 1] = 0;
          data[dstIdx + 2] = 0;
          data[dstIdx + 3] = 0;
        } else {
          const { r, g, b, a } = parseHex(entry.hex);
          data[dstIdx] = r;
          data[dstIdx + 1] = g;
          data[dstIdx + 2] = b;
          data[dstIdx + 3] = a;
        }
      }
    }
  }

  /**
   * Flush the pixelGrid buffer to the offscreen canvas and then scale/blit
   * the result onto the visible canvas via the current zoom/pan transform.
   */
  private flushOffscreen(frame: PixelFrame) {
    if (!this.offscreen || !this.offscreenCtx || !this.pixelGrid) return;

    this.offscreenCtx.putImageData(this.pixelGrid, 0, 0);

    this.ctx.drawImage(
      this.offscreen,
      0,
      0,
      frame.width,
      frame.height,
      this.panX,
      this.panY,
      frame.width * this.zoom,
      frame.height * this.zoom,
    );
  }

  renderFrame(frame: PixelFrame, palette: PaletteEntry[], dirtyRects?: DirtyRect[]) {
    this.ensureOffscreen(frame.width, frame.height);

    if (!dirtyRects || dirtyRects.length === 0) {
      this.clear();
      this.updatePixelGrid(frame, palette, 0, 0, frame.width, frame.height);
      this.flushOffscreen(frame);
      return;
    }

    // Clear only the dirty regions on the visible canvas then repaint via the
    // offscreen buffer for each rectangle.
    for (const rect of dirtyRects) {
      const startX = Math.max(0, rect.x);
      const startY = Math.max(0, rect.y);
      const endX = Math.min(frame.width, rect.x + rect.width);
      const endY = Math.min(frame.height, rect.y + rect.height);

      this.ctx.clearRect(
        this.panX + startX * this.zoom,
        this.panY + startY * this.zoom,
        (endX - startX) * this.zoom,
        (endY - startY) * this.zoom,
      );

      this.updatePixelGrid(frame, palette, startX, startY, endX, endY);
    }

    this.flushOffscreen(frame);
  }

  /**
   * Render an onion-skin overlay from a neighbouring frame below or above
   * the current frame at the specified opacity (0–1).
   *
   * @param frame   The neighbouring frame to use as the onion skin source.
   * @param palette Palette shared with the project.
   * @param opacity Translucency of the onion skin layer (default 0.3).
   */
  renderOnionSkin(frame: PixelFrame, palette: PaletteEntry[], opacity = 0.3) {
    this.ensureOffscreen(frame.width, frame.height);
    this.updatePixelGrid(frame, palette, 0, 0, frame.width, frame.height);

    const prevAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    this.flushOffscreen(frame);
    this.ctx.globalAlpha = prevAlpha;
  }
}
