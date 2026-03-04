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
    isBlocked?: (x: number, y: number) => boolean;
  }) {
    const { frame, from, to, colorIndex, brushSize = 1, mirrorX = false, isBlocked } = params;
    const next = new Uint16Array(frame.pixels);

    const plot = (x: number, y: number) => {
      for (let oy = 0; oy < brushSize; oy += 1) {
        for (let ox = 0; ox < brushSize; ox += 1) {
          const px = clamp(x + ox, 0, frame.width - 1);
          const py = clamp(y + oy, 0, frame.height - 1);
          if (isBlocked?.(px, py)) continue;
          next[indexOf(frame.width, px, py)] = colorIndex;
          if (mirrorX) {
            const mx = frame.width - 1 - px;
            if (isBlocked?.(mx, py)) continue;
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

  /**
   * Scanline flood fill.
   *
   * Processes contiguous horizontal spans instead of individual pixels,
   * which dramatically reduces the size of the work stack for large regions
   * and prevents call-stack overflow on big grids.
   *
   * Algorithm sketch:
   *   1. Seed the stack with the starting scan-span.
   *   2. Pop a span [lx, rx] at row y.
   *   3. Scan left/right from the seed column to extend the span.
   *   4. Fill the span.
   *   5. For the row above (y-1) and the row below (y+1) find contiguous
   *      sub-spans that need filling and push them onto the stack.
   */
  static floodFill(
    frame: PixelFrame,
    start: DrawPoint,
    replacementColorIndex: number,
    isBlocked?: (x: number, y: number) => boolean,
  ) {
    const { width, height } = frame;
    const next = new Uint16Array(frame.pixels);
    const startIndex = indexOf(width, start.x, start.y);
    if (isBlocked?.(start.x, start.y)) return next;
    const targetColorIndex = next[startIndex];
    if (targetColorIndex === replacementColorIndex) return next;

    const canFill = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      if (isBlocked?.(x, y)) return false;
      return next[indexOf(width, x, y)] === targetColorIndex;
    };

    // Stack entries: [leftX, rightX, y, scanDirection] where scanDirection is
    // the dy that spawned this span (used to avoid redundant parent re-scan).
    const stack: Array<[number, number, number, number]> = [];

    // Seed: extend from start column to find initial span bounds.
    let lx = start.x;
    let rx = start.x;
    while (lx > 0 && canFill(lx - 1, start.y)) lx -= 1;
    while (rx < width - 1 && canFill(rx + 1, start.y)) rx += 1;
    stack.push([lx, rx, start.y, 0]);

    while (stack.length > 0) {
      const [spanL, spanR, y, fromDy] = stack.pop()!;

      // Fill the span and scan for child spans above and below.
      let x = spanL;
      while (x <= spanR) {
        // Extend left past the original span (may have been clipped by a
        // previous sibling span that was enqueued from the opposite direction).
        let cl = x;
        while (cl > 0 && canFill(cl - 1, y)) cl -= 1;

        // Extend right.
        let cr = x;
        while (cr < width - 1 && canFill(cr + 1, y)) cr += 1;

        // Fill the run [cl, cr] on this row.
        for (let fx = cl; fx <= cr; fx += 1) {
          next[indexOf(width, fx, y)] = replacementColorIndex;
        }

        // Enqueue child spans in the upward direction (unless this span was
        // generated from above, to avoid redundant re-scanning).
        if (y > 0 && fromDy !== -1) {
          let sx = cl;
          while (sx <= cr) {
            while (sx <= cr && !canFill(sx, y - 1)) sx += 1;
            if (sx > cr) break;
            const sl = sx;
            while (sx <= cr && canFill(sx, y - 1)) sx += 1;
            stack.push([sl, sx - 1, y - 1, 1]);
          }
        }

        // Enqueue child spans in the downward direction.
        if (y < height - 1 && fromDy !== 1) {
          let sx = cl;
          while (sx <= cr) {
            while (sx <= cr && !canFill(sx, y + 1)) sx += 1;
            if (sx > cr) break;
            const sl = sx;
            while (sx <= cr && canFill(sx, y + 1)) sx += 1;
            stack.push([sl, sx - 1, y + 1, -1]);
          }
        }

        // Advance past the filled run.
        x = cr + 1;
        // Skip any already-filled cells between runs on the same row.
        while (x <= spanR && !canFill(x, y)) x += 1;
      }
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

  static applyMultiPointStroke(params: {
    frame: PixelFrame;
    points: DrawPoint[];
    colorIndex: number;
    brushSize?: number;
    mirrorX?: boolean;
    isBlocked?: (x: number, y: number) => boolean;
  }) {
    const { frame, points, colorIndex, brushSize = 1, mirrorX = false, isBlocked } = params;
    if (points.length === 0) return new Uint16Array(frame.pixels);

    const next = new Uint16Array(frame.pixels);

    const plot = (x: number, y: number) => {
      for (let oy = 0; oy < brushSize; oy += 1) {
        for (let ox = 0; ox < brushSize; ox += 1) {
          const px = clamp(x + ox, 0, frame.width - 1);
          const py = clamp(y + oy, 0, frame.height - 1);
          if (isBlocked?.(px, py)) continue;
          next[indexOf(frame.width, px, py)] = colorIndex;
          if (mirrorX) {
            const mx = frame.width - 1 - px;
            if (isBlocked?.(mx, py)) continue;
            next[indexOf(frame.width, mx, py)] = colorIndex;
          }
        }
      }
    };

    const drawSegment = (from: DrawPoint, to: DrawPoint) => {
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
    };

    if (points.length === 1) {
      plot(points[0].x, points[0].y);
    } else {
      for (let i = 0; i < points.length - 1; i += 1) {
        drawSegment(points[i], points[i + 1]);
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
