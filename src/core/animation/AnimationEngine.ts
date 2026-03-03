import { PixelFrame } from '../types';

export type LoopMode = 'loop' | 'ping-pong' | 'once';

export interface TimelineTag {
  id: string;
  name: string;
  startFrameIndex: number;
  endFrameIndex: number;
}

export class AnimationEngine {
  private accumulatorMs = 0;
  private direction: 1 | -1 = 1;

  constructor(
    private readonly fps: number,
    private readonly loopMode: LoopMode = 'loop',
  ) {}

  reset() {
    this.accumulatorMs = 0;
    this.direction = 1;
  }

  advance(currentFrameIndex: number, deltaMs: number, frames: PixelFrame[]): number {
    if (frames.length <= 1) return 0;

    const current = frames[currentFrameIndex];
    const frameDurationMs = Math.max(1, current?.durationMs ?? Math.round(1000 / this.fps));
    this.accumulatorMs += deltaMs;

    if (this.accumulatorMs < frameDurationMs) {
      return currentFrameIndex;
    }

    this.accumulatorMs -= frameDurationMs;

    if (this.loopMode === 'once' && currentFrameIndex === frames.length - 1) {
      return currentFrameIndex;
    }

    if (this.loopMode === 'ping-pong') {
      const next = currentFrameIndex + this.direction;
      if (next >= frames.length) {
        this.direction = -1;
        return Math.max(0, frames.length - 2);
      }
      if (next < 0) {
        this.direction = 1;
        return Math.min(frames.length - 1, 1);
      }
      return next;
    }

    return (currentFrameIndex + 1) % frames.length;
  }
}
