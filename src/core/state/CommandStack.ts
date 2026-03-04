import { Command, CommandContext, PixelFrame } from '../types';

/** Monotonically increasing counter for unique command IDs. */
let diffCommandCounter = 0;


export interface PixelChange {
  frameId: string;
  index: number;
  before: number;
  after: number;
}

/**
 * A command that stores only the changed pixels (a diff) rather than the full
 * pixel grid, significantly reducing memory overhead during long drawing
 * sessions.
 *
 * Usage:
 *   const diff = PixelDiffCommand.record(frameId, beforePixels, afterPixels);
 *   commandStack.execute(diff);
 */
export class PixelDiffCommand implements Command {
  readonly id: string;
  readonly label: string;
  private readonly changes: PixelChange[];

  private constructor(id: string, label: string, changes: PixelChange[]) {
    this.id = id;
    this.label = label;
    this.changes = changes;
  }

  /**
   * Create a `PixelDiffCommand` by diffing two pixel arrays for a given frame.
   * Only the indices that differ between `before` and `after` are stored.
   *
   * @param frameId  ID of the frame being edited.
   * @param before   Pixel array state before the edit.
   * @param after    Pixel array state after the edit.
   * @param label    Human-readable label for the undo history entry.
   */
  static record(
    frameId: string,
    before: Uint16Array,
    after: Uint16Array,
    label = 'paint',
  ): PixelDiffCommand {
    const changes: PixelChange[] = [];
    const len = Math.min(before.length, after.length);
    for (let i = 0; i < len; i += 1) {
      if (before[i] !== after[i]) {
        changes.push({ frameId, index: i, before: before[i], after: after[i] });
      }
    }
    return new PixelDiffCommand(`diff_${(diffCommandCounter += 1).toString(36)}`, label, changes);
  }

  apply(context: CommandContext) {
    const snapshot = context.getSnapshot();
    let mutated = false;
    for (const change of this.changes) {
      const frame = snapshot.frames.find((f: PixelFrame) => f.id === change.frameId);
      if (frame && frame.pixels[change.index] !== change.after) {
        frame.pixels[change.index] = change.after;
        mutated = true;
      }
    }
    if (mutated) context.setSnapshot(snapshot);
  }

  revert(context: CommandContext) {
    const snapshot = context.getSnapshot();
    let mutated = false;
    for (const change of this.changes) {
      const frame = snapshot.frames.find((f: PixelFrame) => f.id === change.frameId);
      if (frame && frame.pixels[change.index] !== change.before) {
        frame.pixels[change.index] = change.before;
        mutated = true;
      }
    }
    if (mutated) context.setSnapshot(snapshot);
  }

  /** Number of changed pixels recorded in this diff. */
  get changeCount() {
    return this.changes.length;
  }
}

export class CommandStack {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];

  constructor(private readonly context: CommandContext, private readonly maxDepth = 200) {}

  execute(command: Command) {
    command.apply(this.context);
    this.undoStack.push(command);
    this.redoStack.length = 0;

    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
  }

  undo() {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.revert(this.context);
    this.redoStack.push(command);
    return true;
  }

  redo() {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.apply(this.context);
    this.undoStack.push(command);
    return true;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  get depth() {
    return this.undoStack.length;
  }
}
