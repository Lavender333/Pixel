import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PixelCanvasProps {
  gridSize: number;
  frames: any[];
  currentFrameIndex: number;
  selectedColor: string;
  tool: 'pencil' | 'eraser' | 'fill' | 'picker' | 'select';
  isMouseDown: boolean;
  mirrorMode: boolean;
  zoom: number;
  onPixelChange: (x: number, y: number, color: string) => void;
  onColorPick: (color: string) => void;
  onSelectionChange?: (selection: { active: boolean; x0: number; y0: number; x1: number; y1: number } | null) => void;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  gridSize,
  frames,
  currentFrameIndex,
  selectedColor,
  tool,
  isMouseDown,
  mirrorMode,
  zoom,
  onPixelChange,
  onColorPick,
  onSelectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null);
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  
  // Selection state
  const [selection, setSelection] = useState<{
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
  }>({
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

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.floor(((e.clientX - rect.left) * scaleX) / (canvas.width / gridSize)),
      y: Math.floor(((e.clientY - rect.top) * scaleY) / (canvas.height / gridSize))
    };
  }, [gridSize]);

  const drawPixel = useCallback((x: number, y: number, color: string) => {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    onPixelChange(x, y, color);

    // Mirror mode
    if (mirrorMode) {
      const mirrorX = gridSize - 1 - x;
      onPixelChange(mirrorX, y, color);
    }
  }, [gridSize, mirrorMode, onPixelChange]);

  const floodFill = useCallback((startX: number, startY: number, newColor: string) => {
    const frame = frames[currentFrameIndex];
    if (!frame || !frame.pixels) return;

    const pixels = [...frame.pixels];
    const targetColor = pixels[startY * gridSize + startX];
    if (targetColor === newColor) return;

    const stack = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
      if (pixels[y * gridSize + x] !== targetColor) continue;

      pixels[y * gridSize + x] = newColor;
      onPixelChange(x, y, newColor);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }, [frames, currentFrameIndex, gridSize, onPixelChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (tool === 'select') {
      if (selection.active) {
        const { x: sx, y: sy, w, h } = getSelectionRect();
        if (x >= sx && x < sx + w && y >= sy && y < sy + h) {
          // Start moving selection
          setSelection(prev => ({
            ...prev,
            moving: true,
            moveStartX: x,
            moveStartY: y,
          }));
          liftSelection();
          return;
        }
        // Click outside selection - clear it
        stampFloat();
        clearSelection();
      }
      // Start new selection
      setSelection(prev => ({
        ...prev,
        dragging: true,
        moving: false,
        x0: x, y0: y, x1: x, y1: y,
        active: true,
      }));
      drawSelectionOverlay();
      return;
    }

    if (tool === 'picker') {
      const frame = frames[currentFrameIndex];
      if (frame && frame.pixels) {
        const color = frame.pixels[y * gridSize + x];
        if (color && color !== 'transparent') {
          onColorPick(color);
        }
      }
      return;
    }

    if (tool === 'fill') {
      floodFill(x, y, selectedColor);
      return;
    }

    // Pencil or eraser
    const color = tool === 'eraser' ? 'transparent' : selectedColor;
    drawPixel(x, y, color);
  }, [getCanvasCoords, tool, selection.active, getSelectionRect, liftSelection, clearSelection, stampFloat, drawSelectionOverlay, frames, currentFrameIndex, gridSize, onColorPick, floodFill, selectedColor, drawPixel]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (tool === 'select') {
      if (selection.moving && selection.floatData) {
        const dx = x - selection.moveStartX;
        const dy = y - selection.moveStartY;
        setSelection(prev => {
          const { w, h } = getSelectionRect();
          const newX0 = Math.max(0, Math.min(gridSize - w, prev.x0 + dx));
          const newY0 = Math.max(0, Math.min(gridSize - h, prev.y0 + dy));
          const newX1 = newX0 + w - 1;
          const newY1 = newY0 + h - 1;

          return {
            ...prev,
            x0: newX0, y0: newY0, x1: newX1, y1: newY1,
            moveStartX: x, moveStartY: y,
          };
        });

        // Update canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const frame = frames[currentFrameIndex];
            if (frame) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const scale = canvas.width / gridSize;
              for (let py = 0; py < gridSize; py++) {
                for (let px = 0; px < gridSize; px++) {
                  const color = frame.pixels[py * gridSize + px];
                  if (color && color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(px * scale, py * scale, scale, scale);
                  }
                }
              }
              const { x: sx, y: sy } = getSelectionRect();
              ctx.putImageData(selection.floatData, sx * scale, sy * scale);
            }
          }
        }
        drawSelectionOverlay();
        return;
      }

      if (selection.dragging) {
        setSelection(prev => ({ ...prev, x1: x, y1: y }));
        drawSelectionOverlay();
      }
      return;
    }

    if (!isDrawing) return;

    const dx = Math.abs(x - lastPos!.x);
    const dy = Math.abs(y - lastPos!.y);
    const sx = lastPos!.x < x ? 1 : -1;
    const sy = lastPos!.y < y ? 1 : -1;
    let err = dx - dy;

    let currentX = lastPos!.x;
    let currentY = lastPos!.y;

    while (true) {
      const color = tool === 'eraser' ? 'transparent' : selectedColor;
      drawPixel(currentX, currentY, color);

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
  }, [getCanvasCoords, tool, selection.moving, selection.floatData, selection.moveStartX, selection.moveStartY, selection.dragging, getSelectionRect, gridSize, frames, currentFrameIndex, drawSelectionOverlay, isDrawing, lastPos, selectedColor, drawPixel]);

  const getTouchCoords = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touch = e.touches[0];
    return {
      x: Math.floor(((touch.clientX - rect.left) * scaleX) / (canvas.width / gridSize)),
      y: Math.floor(((touch.clientY - rect.top) * scaleY) / (canvas.height / gridSize))
    };
  }, [gridSize]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Handle pinch-to-zoom
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      setPinchDistance(distance);
      return;
    }
    
    const { x, y } = getTouchCoords(e);
    setIsDrawing(true);
    setLastPos({ x, y });

    if (tool === 'picker') {
      const frame = frames[currentFrameIndex];
      if (frame && frame.pixels) {
        const color = frame.pixels[y * gridSize + x];
        if (color && color !== 'transparent') {
          onColorPick(color);
        }
      }
      return;
    }

    if (tool === 'fill') {
      floodFill(x, y, selectedColor);
      return;
    }

    // Pencil or eraser
    const color = tool === 'eraser' ? 'transparent' : selectedColor;
    drawPixel(x, y, color);
  }, [getTouchCoords, tool, frames, currentFrameIndex, gridSize, selectedColor, floodFill, drawPixel, onColorPick]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Handle pinch-to-zoom
    if (e.touches.length === 2 && pinchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      // Pinch zoom logic would go here - for now just prevent default
      return;
    }
    
    if (!isDrawing || e.touches.length !== 1) return;

    const { x, y } = getTouchCoords(e);
    if (lastPos && (lastPos.x !== x || lastPos.y !== y)) {
      // Draw line between points for smoother drawing
      const dx = Math.abs(x - lastPos.x);
      const dy = Math.abs(y - lastPos.y);
      const sx = lastPos.x < x ? 1 : -1;
      const sy = lastPos.y < y ? 1 : -1;
      let err = dx - dy;

      let currentX = lastPos.x;
      let currentY = lastPos.y;

      while (true) {
        const color = tool === 'eraser' ? 'transparent' : selectedColor;
        drawPixel(currentX, currentY, color);

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
    }

    setLastPos({ x, y });
  }, [isDrawing, getTouchCoords, lastPos, tool, selectedColor, drawPixel, pinchDistance]);

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
          clearSelection();
        } else {
          onSelectionChange?.({
            active: true,
            x0: selection.x0,
            y0: selection.y0,
            x1: selection.x1,
            y1: selection.y1,
          });
        }
        drawSelectionOverlay();
      }
      return;
    }

    setIsDrawing(false);
    setLastPos(null);
  }, [tool, selection.moving, selection.dragging, stampFloat, drawSelectionOverlay, getSelectionRect, clearSelection, onSelectionChange, selection.x0, selection.x1, selection.y0, selection.y1]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    setLastPos(null);
    if (e.touches.length < 2) {
      setPinchDistance(null);
    }
  }, []);

  // Selection utilities
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

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(x * scale - 0.5, y * scale - 0.5, w * scale + 1, h * scale + 1);

    ctx.strokeStyle = 'rgba(108,99,255,.9)';
    ctx.lineDashOffset = 2;
    ctx.strokeRect(x * scale - 0.5, y * scale - 0.5, w * scale + 1, h * scale + 1);

    ctx.setLineDash([]);
  }, [selection, gridSize, getSelectionRect]);

  const clearSelection = useCallback(() => {
    if (selection.floatData) {
      // Stamp the floating selection back
      const canvas = canvasRef.current;
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
      x0: 0, y0: 0, x1: 0, y1: 0,
      dragging: false, moving: false,
      moveStartX: 0, moveStartY: 0,
      floatData: null,
    });
    drawSelectionOverlay();
    onSelectionChange?.(null);
  }, [selection.floatData, getSelectionRect, drawSelectionOverlay, onSelectionChange]);

  const liftSelection = useCallback(() => {
    if (selection.floatData) return;

    const canvas = canvasRef.current;
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

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getSelectionRect();
    const scale = canvas.width / gridSize;
    ctx.putImageData(selection.floatData, x * scale, y * scale);
    setSelection(prev => ({ ...prev, floatData: null }));
  }, [selection.floatData, getSelectionRect, gridSize]);

  const nudgeSelection = useCallback((dx: number, dy: number) => {
    if (!selection.active) return;

    liftSelection();
    setSelection(prev => {
      const { w, h } = getSelectionRect();
      const newX0 = Math.max(0, Math.min(gridSize - w, prev.x0 + dx));
      const newY0 = Math.max(0, Math.min(gridSize - h, prev.y0 + dy));
      const newX1 = newX0 + w - 1;
      const newY1 = newY0 + h - 1;

      return {
        ...prev,
        x0: newX0, y0: newY0, x1: newX1, y1: newY1,
      };
    });

    // Update canvas with moved selection
    if (selection.floatData) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const frame = frames[currentFrameIndex];
          if (frame) {
            // Clear and redraw base frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const scale = canvas.width / gridSize;
            for (let py = 0; py < gridSize; py++) {
              for (let px = 0; px < gridSize; px++) {
                const color = frame.pixels[py * gridSize + px];
                if (color && color !== 'transparent') {
                  ctx.fillStyle = color;
                  ctx.fillRect(px * scale, py * scale, scale, scale);
                }
              }
            }
            // Draw floating selection
            const { x, y } = getSelectionRect();
            ctx.putImageData(selection.floatData, x * scale, y * scale);
          }
        }
      }
    }
    drawSelectionOverlay();
  }, [selection.active, selection.floatData, liftSelection, getSelectionRect, gridSize, frames, currentFrameIndex, drawSelectionOverlay]);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard background
    const cellSize = canvas.width / gridSize;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isDark = (x + y) % 2 === 1;
        ctx.fillStyle = isDark ? '#2a2a2a' : '#1a1a1a';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Draw pixels
    const frame = frames[currentFrameIndex];
    if (frame && frame.pixels) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const color = frame.pixels[y * gridSize + x];
          if (color && color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
  }, [frames, currentFrameIndex, gridSize]);

  // Handle selection overlay updates
  useEffect(() => {
    drawSelectionOverlay();
  }, [selection, drawSelectionOverlay]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={gridSize * 8}
        height={gridSize * 8}
        className="border border-zinc-700 rounded-lg cursor-crosshair"
        style={{
          width: `${gridSize * 8 * zoom}px`,
          height: `${gridSize * 8 * zoom}px`,
          imageRendering: 'pixelated',
          touchAction: 'none',
        }}
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
        width={gridSize * 8}
        height={gridSize * 8}
        className="absolute inset-0 pointer-events-none"
        style={{
          width: `${gridSize * 8 * zoom}px`,
          height: `${gridSize * 8 * zoom}px`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};