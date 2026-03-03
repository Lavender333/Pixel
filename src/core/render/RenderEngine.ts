import { DirtyRect, PaletteEntry, PixelFrame } from '../types';

const hexToCss = (hex: string) => hex;

export class RenderEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private zoom = 1;
  private panX = 0;
  private panY = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('RenderEngine: failed to create 2D context');
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.syncDpr();
  }

  syncDpr() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
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

  renderFrame(frame: PixelFrame, palette: PaletteEntry[], dirtyRects?: DirtyRect[]) {
    const paint = (startX: number, startY: number, endX: number, endY: number) => {
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const idx = y * frame.width + x;
          const paletteIndex = frame.pixels[idx];
          const entry = palette[paletteIndex];
          if (!entry || paletteIndex === 0) continue;

          this.ctx.fillStyle = hexToCss(entry.hex);
          this.ctx.fillRect(
            this.panX + x * this.zoom,
            this.panY + y * this.zoom,
            this.zoom,
            this.zoom,
          );
        }
      }
    };

    if (!dirtyRects || dirtyRects.length === 0) {
      this.clear();
      paint(0, 0, frame.width, frame.height);
      return;
    }

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
      paint(startX, startY, endX, endY);
    }
  }
}
