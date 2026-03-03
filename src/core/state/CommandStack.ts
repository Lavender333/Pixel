import { Command, CommandContext } from '../types';

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
