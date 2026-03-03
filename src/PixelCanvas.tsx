import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Frame } from './types';

export interface PixelCanvasHandle {
  nudgeSelection: (dx: number, dy: number) => void;
  clearSelection: () => void;
}

interface SelectionState {
  active: boolean;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  dragging: boolean;
  moving: boolean;
  moveStartX: number;
  moveStartY: number;
  floatData: ImageData | null;
}

interface PixelCanvasProps {
  gridSize: number;
  frames: Frame[];
  currentFrameIndex: number;
  selectedColor: string;
  tool: 'pencil' | 'eraser' | 'fill' | 'picker' | 'select';
  mirrorMode: boolean;
  zoom: number;
  brushSize: 1 | 2 | 4;
  eraserSize: 1 | 3 | 6;
  showGrid: boolean;
  onionSkinning: boolean;
  onPixelChange: (x: number, y: number, color: string) => string[] | null;
  onStrokeComplete?: (pixels: string[] | null, action: 'draw' | 'erase' | 'fill') => void;
  onColorPick: (color: string) => void;
  onSelectionChange?: (selection: { active: boolean; x0: number; y0: number; x1: number; y1: number } | null) => void;
}

const CANVAS_SCALE = 8;

export const PixelCanvas = forwardRef<PixelCanvasHandle, PixelCanvasProps>(({
  gridSize,
  frames,
  currentFrameIndex,
  selectedColor,
  tool,
  mirrorMode,
  zoom,
  brushSize,
  eraserSize,
  showGrid,
  onionSkinning,
  onPixelChange,
  onStrokeComplete,
  onColorPick,
  onSelectionChange,
}, ref) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const onionCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  const [selection, setSelection] = useState<SelectionState>({
    active: false,
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    dragging: false,
    moving: false,
    moveStartX: 0,
    moveStartY: 0,
    floatData: null,
  });

  const lastPixelsRef = useRef<string[] | null>(null);
  const toolUsedRef = useRef<'draw' | 'erase' | 'fill'>('draw');

  const activeFrame = frames[currentFrameIndex];
  const prevFrame = currentFrameIndex > 0 ? frames[currentFrameIndex - 1] : null;

  const canvasSize = gridSize * CANVAS_SCALE;
  const scaledSize = canvasSize * zoom;

  const commitStroke = useCallback((action: 'draw' | 'erase' | 'fill') => {
    if (!lastPixelsRef.current) return;
    onStrokeComplete?.(lastPixelsRef.current, action);
    lastPixelsRef.current = null;
  }, [onStrokeComplete]);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.floor(((clientX - rect.left) * scaleX) / (canvas.width / gridSize)),
      y: Math.floor(((clientY - rect.top) * scaleY) / (canvas.height / gridSize))
    };
  }, [gridSize]);

  const stampPixel = useCallback((x: number, y: number, color: string, skipMirror = false) => {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
    const pixels = onPixelChange(x, y, color);
    if (pixels) lastPixelsRef.current = pixels;
    if (!skipMirror && mirrorMode) {
      const mirrorX = gridSize - 1 - x;
      if (mirrorX !== x) {
        stampPixel(mirrorX, y, color, true);
      }
    }
  }, [gridSize, mirrorMode, onPixelChange]);

  const drawBrush = useCallback((x: number, y: number, color: string, size: number) => {
    const half = Math.floor(size / 2);
    const startX = x - half;
    const startY = y - half;
    for (let by = 0; by < size; by++) {
      for (let bx = 0; bx < size; bx++) {
        stampPixel(startX + bx, startY + by, color);
      }
    }
  }, [stampPixel]);

  const getSelectionRect = useCallback(() => {
    const x = Math.min(selection.x0, selection.x1);
    const y = Math.min(selection.y0, selection.y1);
    const w = Math.abs(selection.x1 - selection.x0) + 1;
    const h = Math.abs(selection.y1 - selection.y0) + 1;
    return { x, y, w, h };
  }, [selection]);

  const drawSelectionOverlay = useCallback(() => {
    const selCanvas = selectionCanvasRef.current;
    if (!selCanvas) return;
    const ctx = selCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, selCanvas.width, selCanvas.height);
    if (!selection.active) return;

    const { x, y, w, h } = getSelectionRect();
    const scale = selCanvas.width / gridSize;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(x * scale - 0.5, y * scale - 0.5, w * scale + 1, h * scale + 1);

    ctx.strokeStyle = 'rgba(108,99,255,.9)';
    ctx.lineDashOffset = 2;
    ctx.strokeRect(x * scale - 0.5, y * scale - 0.5, w * scale + 1, h * scale + 1);

    ctx.setLineDash([]);
  }, [selection, gridSize, getSelectionRect]);

  const resetSelection = useCallback(() => {
    if (selection.floatData) {
      const canvas = mainCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { x, y } = getSelectionRect();
          const scale = canvas.width / gridSize;
          ctx.putImageData(selection.floatData, x * scale, y * scale);
        }
      }
    }
    setSelection({
      active: false,
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 0,
      dragging: false,
      moving: false,
      moveStartX: 0,
      moveStartY: 0,
      floatData: null,
    });
    drawSelectionOverlay();
    onSelectionChange?.(null);
  }, [selection.floatData, getSelectionRect, gridSize, drawSelectionOverlay, onSelectionChange]);

  const liftSelection = useCallback(() => {
    if (selection.floatData) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, w, h } = getSelectionRect();
    const scale = canvas.width / gridSize;
    const floatData = ctx.getImageData(x * scale, y * scale, w * scale, h * scale);
    ctx.clearRect(x * scale, y * scale, w * scale, h * scale);
    setSelection(prev => ({ ...prev, floatData }));
  }, [selection.floatData, getSelectionRect, gridSize]);

  const stampFloat = useCallback(() => {
    if (!selection.floatData) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getSelectionRect();
    const scale = canvas.width / gridSize;
    ctx.putImageData(selection.floatData, x * scale, y * scale);
    setSelection(prev => ({ ...prev, floatData: null }));
  }, [selection.floatData, getSelectionRect, gridSize]);

  const nudgeSelectionInternal = useCallback((dx: number, dy: number) => {
    if (!selection.active) return;
    liftSelection();
    setSelection(prev => {
      const { w, h } = getSelectionRect();
      const newX0 = Math.max(0, Math.min(gridSize - w, prev.x0 + dx));
      const newY0 = Math.max(0, Math.min(gridSize - h, prev.y0 + dy));
      const newX1 = newX0 + w - 1;
      const newY1 = newY0 + h - 1;
      const next = { ...prev, x0: newX0, y0: newY0, x1: newX1, y1: newY1 };
      onSelectionChange?.({ active: true, x0: newX0, y0: newY0, x1: newX1, y1: newY1 });
      return next;
    });

    if (selection.floatData) {
      const canvas = mainCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const frame = frames[currentFrameIndex];
          if (frame) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cellSize = canvas.width / gridSize;
            for (let py = 0; py < gridSize; py++) {
              for (let px = 0; px < gridSize; px++) {
                const color = frame.pixels[py * gridSize + px];
                if (color && color !== 'transparent') {
                  ctx.fillStyle = color;
                  ctx.fillRect(px * cellSize, py * cellSize, cellSize, cellSize);
                }
              }
            }
            const { x, y } = getSelectionRect();
            ctx.putImageData(selection.floatData, x * cellSize, y * cellSize);
          }
        }
      }
    }
    drawSelectionOverlay();
  }, [selection.active, selection.floatData, liftSelection, getSelectionRect, frames, currentFrameIndex, gridSize, onSelectionChange, drawSelectionOverlay]);

  useImperativeHandle(ref, () => ({
    nudgeSelection: nudgeSelectionInternal,
    clearSelection: () => {
      stampFloat();
      resetSelection();
    }
  }), [nudgeSelectionInternal, resetSelection, stampFloat]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (tool === 'select') {
      if (selection.active) {
        const { x: sx, y: sy, w, h } = getSelectionRect();
        if (x >= sx && x < sx + w && y >= sy && y < sy + h) {
          setSelection(prev => ({ ...prev, moving: true, moveStartX: x, moveStartY: y }));
          liftSelection();
          return;
        }
        stampFloat();
        resetSelection();
      }
      setSelection(prev => ({ ...prev, dragging: true, moving: false, x0: x, y0: y, x1: x, y1: y, active: true }));
      drawSelectionOverlay();
      return;
    }

    if (tool === 'picker') {
      const frame = frames[currentFrameIndex];
      if (frame) {
        const color = frame.pixels[y * gridSize + x];
        if (color && color !== 'transparent') {
          onColorPick(color);
        }
      }
      return;
    }

    if (tool === 'fill') {
      toolUsedRef.current = 'fill';
      floodFill(x, y, selectedColor);
      commitStroke('fill');
      return;
    }

    toolUsedRef.current = tool === 'eraser' ? 'erase' : 'draw';
    setIsDrawing(true);
    setLastPos({ x, y });
    const useSize = tool === 'eraser' ? eraserSize : brushSize;
    const color = tool === 'eraser' ? 'transparent' : selectedColor;
    drawBrush(x, y, color, useSize);
}, [tool, selection.active, getSelectionRect, liftSelection, stampFloat, resetSelection, drawSelectionOverlay, frames, currentFrameIndex, gridSize, onColorPick, selectedColor, commitStroke, brushSize, eraserSize, drawBrush]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (tool === 'select') {
      if (selection.moving && selection.floatData) {
        const dx = x - selection.moveStartX;
        const dy = y - selection.moveStartY;
        setSelection(prev => ({ ...prev, moveStartX: x, moveStartY: y, x0: prev.x0 + dx, x1: prev.x1 + dx, y0: prev.y0 + dy, y1: prev.y1 + dy }));
        drawSelectionOverlay();
        return;
      }
      if (selection.dragging) {
        setSelection(prev => ({ ...prev, x1: x, y1: y }));
        drawSelectionOverlay();
      }
      return;
    }

    if (!isDrawing || !lastPos) return;

    const dx = Math.abs(x - lastPos.x);
    const dy = Math.abs(y - lastPos.y);
    const sx = lastPos.x < x ? 1 : -1;
    const sy = lastPos.y < y ? 1 : -1;
    let err = dx - dy;
    let currentX = lastPos.x;
    let currentY = lastPos.y;
    const useSize = tool === 'eraser' ? eraserSize : brushSize;
    const color = tool === 'eraser' ? 'transparent' : selectedColor;

    while (true) {
      drawBrush(currentX, currentY, color, useSize);
      if (currentX === x && currentY === y) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
    }
    setLastPos({ x, y });
  }, [tool, selection.moving, selection.floatData, selection.dragging, drawSelectionOverlay, isDrawing, lastPos, eraserSize, brushSize, selectedColor, drawBrush, getCanvasCoords]);

  const handleMouseUp = useCallback(() => {
    if (tool === 'select') {
      if (selection.moving) {
        setSelection(prev => ({ ...prev, moving: false }));
        stampFloat();
        drawSelectionOverlay();
        return;
      }
      if (selection.dragging) {
        setSelection(prev => ({ ...prev, dragging: false }));
        const { w, h } = getSelectionRect();
        if (w < 1 || h < 1) {
          resetSelection();
        } else {
          onSelectionChange?.({ active: true, x0: selection.x0, y0: selection.y0, x1: selection.x1, y1: selection.y1 });
        }
        drawSelectionOverlay();
      }
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPos(null);
    commitStroke(toolUsedRef.current);
  }, [tool, selection.moving, selection.dragging, stampFloat, drawSelectionOverlay, getSelectionRect, resetSelection, onSelectionChange, selection.x0, selection.x1, selection.y0, selection.y1, isDrawing, commitStroke]);

  const getTouchCoords = useCallback((touch: Touch) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor(((touch.clientX - rect.left) * scaleX) / (canvas.width / gridSize)),
      y: Math.floor(((touch.clientY - rect.top) * scaleY) / (canvas.height / gridSize))
    };
  }, [gridSize]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const [t1, t2] = Array.from(e.touches) as [Touch, Touch];
      setPinchDistance(Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY));
      return;
    }
    if (e.touches.length !== 1) return;
    const coords = getTouchCoords(e.touches[0]);
    handleMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as React.MouseEvent<HTMLCanvasElement>);
    setLastPos(coords);
  }, [getTouchCoords, handleMouseDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchDistance !== null) {
      return;
    }
    if (e.touches.length !== 1 || !isDrawing) return;
    const { x, y } = getTouchCoords(e.touches[0]);
    setLastPos(prev => prev ? { ...prev, x, y } : { x, y });
    handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as React.MouseEvent<HTMLCanvasElement>);
  }, [getTouchCoords, pinchDistance, isDrawing, handleMouseMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length < 2) {
      setPinchDistance(null);
    }
    handleMouseUp();
  }, [handleMouseUp]);

  const floodFill = useCallback((startX: number, startY: number, newColor: string) => {
    const frame = frames[currentFrameIndex];
    if (!frame) return;
    const pixels = [...frame.pixels];
    const targetColor = pixels[startY * gridSize + startX];
    if (targetColor === newColor) return;
    const stack = [[startX, startY]] as [number, number][];
    const visited = new Set<string>();

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
      if (pixels[y * gridSize + x] !== targetColor) continue;
      pixels[y * gridSize + x] = newColor;
      stampPixel(x, y, newColor);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }, [frames, currentFrameIndex, gridSize, stampPixel]);

  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cellSize = canvas.width / gridSize;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isDark = (x + y) % 2 === 1;
        ctx.fillStyle = isDark ? '#1a1a1a' : '#111';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    if (activeFrame) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const color = activeFrame.pixels[y * gridSize + x];
          if (color && color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }, [activeFrame, gridSize]);

  useEffect(() => {
    const canvas = onionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!onionSkinning || !prevFrame) return;
    const cellSize = canvas.width / gridSize;
    ctx.globalAlpha = 0.3;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = prevFrame.pixels[y * gridSize + x];
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    ctx.globalAlpha = 1;
  }, [prevFrame, gridSize, onionSkinning]);

  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showGrid) return;
    const cellSize = canvas.width / gridSize;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
  }, [showGrid, gridSize]);

  useEffect(() => {
    const canvas = outlineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!activeFrame?.basePixels) return;
    const cellSize = canvas.width / gridSize;
    ctx.globalAlpha = 0.35;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const color = activeFrame.basePixels[y * gridSize + x];
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    ctx.globalAlpha = 1;
  }, [activeFrame, gridSize]);

  useEffect(() => {
    drawSelectionOverlay();
  }, [selection, drawSelectionOverlay]);

  return (
    <div className="relative" style={{ width: scaledSize, height: scaledSize }}>
      <canvas
        ref={onionCanvasRef}
        width={canvasSize}
        height={canvasSize}
        className="absolute inset-0 pointer-events-none"
        style={{ width: scaledSize, height: scaledSize, imageRendering: 'pixelated', opacity: onionSkinning ? 1 : 0 }}
      />
      <canvas
        ref={mainCanvasRef}
        width={canvasSize}
        height={canvasSize}
        className="relative border border-zinc-700 rounded-lg cursor-crosshair"
        style={{ width: scaledSize, height: scaledSize, imageRendering: 'pixelated', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <canvas
        ref={selectionCanvasRef}
        width={canvasSize}
        height={canvasSize}
        className="absolute inset-0 pointer-events-none"
        style={{ width: scaledSize, height: scaledSize, imageRendering: 'pixelated' }}
      />
      <canvas
        ref={gridCanvasRef}
        width={canvasSize}
        height={canvasSize}
        className="absolute inset-0 pointer-events-none"
        style={{ width: scaledSize, height: scaledSize, imageRendering: 'pixelated' }}
      />
      <canvas
        ref={outlineCanvasRef}
        width={canvasSize}
        height={canvasSize}
        className="absolute inset-0 pointer-events-none"
        style={{ width: scaledSize, height: scaledSize, imageRendering: 'pixelated', zIndex: 10 }}
      />
    </div>
  );
});

PixelCanvas.displayName = 'PixelCanvas';
