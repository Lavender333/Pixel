import { DrawPoint, PixelFrame } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const indexOf = (width: number, x: number, y: number) => y * width + x;

export class ToolEngine {
  static applyLineStroke(params: {
    frame: PixelFrame;
    from: DrawPoint;
    to: DrawPoint;
    colorIndex: number;
    brushSize?: number;
    mirrorX?: boolean;
  }) {
    const { frame, from, to, colorIndex, brushSize = 1, mirrorX = false } = params;
    const next = new Uint16Array(frame.pixels);

    const plot = (x: number, y: number) => {
      for (let oy = 0; oy < brushSize; oy += 1) {
        for (let ox = 0; ox < brushSize; ox += 1) {
          const px = clamp(x + ox, 0, frame.width - 1);
          const py = clamp(y + oy, 0, frame.height - 1);
          next[indexOf(frame.width, px, py)] = colorIndex;
          if (mirrorX) {
            const mx = frame.width - 1 - px;
            next[indexOf(frame.width, mx, py)] = colorIndex;
          }
        }
      }
    };

    let x0 = from.x;
    let y0 = from.y;
    const x1 = to.x;
    const y1 = to.y;

    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
      plot(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }

    return next;
  }

  static floodFill(frame: PixelFrame, start: DrawPoint, replacementColorIndex: number) {
    const { width, height } = frame;
    const next = new Uint16Array(frame.pixels);
    const startIndex = indexOf(width, start.x, start.y);
    const targetColorIndex = next[startIndex];
    if (targetColorIndex === replacementColorIndex) return next;

    const stack: DrawPoint[] = [start];

    while (stack.length) {
      const point = stack.pop()!;
      const idx = indexOf(width, point.x, point.y);
      if (next[idx] !== targetColorIndex) continue;

      next[idx] = replacementColorIndex;

      if (point.x > 0) stack.push({ x: point.x - 1, y: point.y });
      if (point.x < width - 1) stack.push({ x: point.x + 1, y: point.y });
      if (point.y > 0) stack.push({ x: point.x, y: point.y - 1 });
      if (point.y < height - 1) stack.push({ x: point.x, y: point.y + 1 });
    }

    return next;
  }

  static replaceColor(frame: PixelFrame, sourceColorIndex: number, targetColorIndex: number) {
    if (sourceColorIndex === targetColorIndex) return new Uint16Array(frame.pixels);
    const next = new Uint16Array(frame.pixels);
    for (let i = 0; i < next.length; i += 1) {
      if (next[i] === sourceColorIndex) {
        next[i] = targetColorIndex;
      }
    }
    return next;
  }

  static outline(frame: PixelFrame, outlineColorIndex: number, transparentIndex = 0) {
    const next = new Uint16Array(frame.pixels);

    for (let y = 0; y < frame.height; y += 1) {
      for (let x = 0; x < frame.width; x += 1) {
        const idx = indexOf(frame.width, x, y);
        if (frame.pixels[idx] !== transparentIndex) continue;

        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];

        const touchingPaint = neighbors.some(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= frame.width || ny >= frame.height) return false;
          return frame.pixels[indexOf(frame.width, nx, ny)] !== transparentIndex;
        });

        if (touchingPaint) {
          next[idx] = outlineColorIndex;
        }
      }
    }

    return next;
  }

  static shadeAssist(frame: PixelFrame, delta: number, maxPaletteIndex: number) {
    const next = new Uint16Array(frame.pixels);
    for (let i = 0; i < next.length; i += 1) {
      const value = next[i];
      if (value === 0) continue;
      next[i] = clamp(value + delta, 0, maxPaletteIndex);
    }
    return next;
  }
}
