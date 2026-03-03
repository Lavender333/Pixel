export type PaletteIndex = number;

export interface PaletteEntry {
  hex: string;
}

export interface PixelFrame {
  id: string;
  width: number;
  height: number;
  pixels: Uint16Array;
  durationMs: number;
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  width: number;
  height: number;
  palette: PaletteEntry[];
  frames: PixelFrame[];
  activeFrameId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommandContext {
  getSnapshot: () => ProjectSnapshot;
  setSnapshot: (snapshot: ProjectSnapshot) => void;
}

export interface Command {
  id: string;
  label: string;
  apply: (context: CommandContext) => void;
  revert: (context: CommandContext) => void;
}

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DirtyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheetExportOptions {
  columns?: number;
  padding?: number;
  scale?: number;
  includeFrameMap?: boolean;
}

export interface SpriteSheetFrameMapEntry {
  frameId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  durationMs: number;
}

export interface SpriteSheetExportResult {
  blob: Blob;
  frameMap?: SpriteSheetFrameMapEntry[];
}
