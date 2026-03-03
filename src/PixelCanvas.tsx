import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PixelCanvasProps {
  gridSize: number;
  frames: any[];
  currentFrameIndex: number;
  selectedColor: string;
  tool: 'pencil' | 'eraser' | 'fill' | 'picker';
  isMouseDown: boolean;
  mirrorMode: boolean;
  zoom: number;
  onPixelChange: (x: number, y: number, color: string) => void;
  onColorPick: (color: string) => void;
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null);
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);

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
  }, [getCanvasCoords, tool, frames, currentFrameIndex, gridSize, selectedColor, floodFill, drawPixel, onColorPick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoords(e);
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
  }, [isDrawing, getCanvasCoords, lastPos, tool, selectedColor, drawPixel]);

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
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    setLastPos(null);
    if (e.touches.length < 2) {
      setPinchDistance(null);
    }
  }, []);

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

  return (
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
  );
};