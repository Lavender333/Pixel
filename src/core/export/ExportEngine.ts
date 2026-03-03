import { PaletteEntry, PixelFrame, SpriteSheetExportOptions, SpriteSheetExportResult } from '../types';

const resolveColor = (palette: PaletteEntry[], index: number) => {
  if (index === 0) return null;
  return palette[index]?.hex ?? null;
};

const drawFrameToCanvas = (frame: PixelFrame, palette: PaletteEntry[], scale: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = frame.width * scale;
  canvas.height = frame.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ExportEngine: failed to get canvas context');
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const color = resolveColor(palette, frame.pixels[y * frame.width + x]);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  return canvas;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('ExportEngine: failed to encode canvas')); 
      return;
    }
    resolve(blob);
  }, type, quality);
});

export class ExportEngine {
  static async exportPng(frame: PixelFrame, palette: PaletteEntry[], scale = 8) {
    const canvas = drawFrameToCanvas(frame, palette, scale);
    return canvasToBlob(canvas, 'image/png');
  }

  static async exportSpriteSheet(
    frames: PixelFrame[],
    palette: PaletteEntry[],
    options: SpriteSheetExportOptions = {},
  ): Promise<SpriteSheetExportResult> {
    if (frames.length === 0) {
      throw new Error('ExportEngine: no frames to export');
    }

    const scale = Math.max(1, options.scale ?? 8);
    const padding = Math.max(0, options.padding ?? 1);
    const columns = Math.max(1, options.columns ?? Math.ceil(Math.sqrt(frames.length)));
    const rows = Math.ceil(frames.length / columns);

    const width = frames[0].width * scale;
    const height = frames[0].height * scale;

    const canvas = document.createElement('canvas');
    canvas.width = columns * width + (columns + 1) * padding;
    canvas.height = rows * height + (rows + 1) * padding;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ExportEngine: failed to get sprite sheet context');
    ctx.imageSmoothingEnabled = false;

    const frameMap = [];

    for (let i = 0; i < frames.length; i += 1) {
      const frame = frames[i];
      const frameCanvas = drawFrameToCanvas(frame, palette, scale);
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = padding + col * (width + padding);
      const y = padding + row * (height + padding);

      ctx.drawImage(frameCanvas, x, y);
      frameMap.push({
        frameId: frame.id,
        x,
        y,
        width,
        height,
        durationMs: frame.durationMs,
      });
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    return {
      blob,
      frameMap: options.includeFrameMap ? frameMap : undefined,
    };
  }

  static async exportGif() {
    throw new Error('ExportEngine: GIF encoder is not wired yet. Use sprite sheet export or plug a worker-based GIF encoder.');
  }
}
