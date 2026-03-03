import { Command, CommandContext, PaletteEntry, PixelFrame, ProjectSnapshot } from '../types';
import { CommandStack } from './CommandStack';

const createFrameId = () => `frame_${Math.random().toString(36).slice(2, 10)}`;

const cloneFrame = (frame: PixelFrame): PixelFrame => ({
  ...frame,
  pixels: new Uint16Array(frame.pixels),
});

const cloneSnapshot = (snapshot: ProjectSnapshot): ProjectSnapshot => ({
  ...snapshot,
  palette: snapshot.palette.map((entry) => ({ ...entry })),
  frames: snapshot.frames.map(cloneFrame),
});

export class ProjectStateEngine {
  private snapshot: ProjectSnapshot;
  readonly commands: CommandStack;

  constructor(params: { name: string; width: number; height: number; palette: PaletteEntry[] }) {
    const initialFrame = this.createEmptyFrame(params.width, params.height);
    this.snapshot = {
      id: `project_${Math.random().toString(36).slice(2, 10)}`,
      name: params.name,
      width: params.width,
      height: params.height,
      palette: params.palette,
      frames: [initialFrame],
      activeFrameId: initialFrame.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const context: CommandContext = {
      getSnapshot: () => cloneSnapshot(this.snapshot),
      setSnapshot: (next) => {
        this.snapshot = {
          ...cloneSnapshot(next),
          updatedAt: new Date().toISOString(),
        };
      },
    };

    this.commands = new CommandStack(context);
  }

  getSnapshot() {
    return cloneSnapshot(this.snapshot);
  }

  getActiveFrame() {
    const frame = this.snapshot.frames.find((item) => item.id === this.snapshot.activeFrameId);
    return frame ? cloneFrame(frame) : null;
  }

  setActiveFrame(frameId: string) {
    if (!this.snapshot.frames.some((frame) => frame.id === frameId)) return;
    this.snapshot.activeFrameId = frameId;
    this.snapshot.updatedAt = new Date().toISOString();
  }

  addFrame(durationMs = 100) {
    const frame = this.createEmptyFrame(this.snapshot.width, this.snapshot.height, durationMs);
    this.snapshot.frames.push(frame);
    this.snapshot.activeFrameId = frame.id;
    this.snapshot.updatedAt = new Date().toISOString();
    return cloneFrame(frame);
  }

  removeFrame(frameId: string) {
    if (this.snapshot.frames.length <= 1) return false;
    const index = this.snapshot.frames.findIndex((frame) => frame.id === frameId);
    if (index === -1) return false;

    this.snapshot.frames.splice(index, 1);
    if (this.snapshot.activeFrameId === frameId) {
      this.snapshot.activeFrameId = this.snapshot.frames[Math.max(0, index - 1)].id;
    }
    this.snapshot.updatedAt = new Date().toISOString();
    return true;
  }

  execute(command: Command) {
    this.commands.execute(command);
  }

  private createEmptyFrame(width: number, height: number, durationMs = 100): PixelFrame {
    return {
      id: createFrameId(),
      width,
      height,
      durationMs,
      pixels: new Uint16Array(width * height),
    };
  }
}
