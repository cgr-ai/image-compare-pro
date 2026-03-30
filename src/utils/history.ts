import { DrawOperation, OperationType, Point, useAppStore } from '../store/useAppStore';
import { createCanvasSnapshot, replayOperations } from './canvas';

let currentOperationPoints: Point[] = [];
let sourcePoint: Point | null = null;

export function startOperation(
  type: OperationType,
  x: number,
  y: number,
  options: { color?: string; brushSize?: number; sourcePoint?: Point } = {}
): void {
  currentOperationPoints = [];
  currentOperationPoints.push({ x, y });
  if (options.sourcePoint) {
    sourcePoint = options.sourcePoint;
  }
}

export function continueOperation(x: number, y: number): void {
  currentOperationPoints.push({ x, y });
}

export function finishOperation(
  type: OperationType,
  options: {
    color?: string;
    brushSize?: number;
    selection?: { startX: number; startY: number; width: number; height: number };
  } = {}
): void {
  if (currentOperationPoints.length === 0) return;

  const operation: DrawOperation = {
    type,
    points: [...currentOperationPoints],
  };

  if (options.color) operation.color = options.color;
  if (options.brushSize) operation.brushSize = options.brushSize;
  if (sourcePoint && type === OperationType.CLONE) operation.sourcePoint = sourcePoint;
  if (options.selection && type === OperationType.SELECTION) operation.selection = options.selection;

  useAppStore.getState().addOperation(operation);
  currentOperationPoints = [];
  sourcePoint = null;
}

export function createResetOperation(ctx: CanvasRenderingContext2D): void {
  const imageData = createCanvasSnapshot(ctx);
  const operation: DrawOperation = { type: OperationType.RESET, imageData };
  useAppStore.getState().addOperation(operation);
}

export function undoHistory(ctx: CanvasRenderingContext2D): void {
  const undoneOperation = useAppStore.getState().undo();
  if (!undoneOperation) return;

  const state = useAppStore.getState();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (state.historyIndex >= 0) {
    replayOperations(state.operationHistory, ctx, state.historyIndex);
  }
}

export function redoHistory(ctx: CanvasRenderingContext2D): void {
  const redoneOperation = useAppStore.getState().redo();
  if (!redoneOperation) return;

  const state = useAppStore.getState();
  if (state.historyIndex >= 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    replayOperations(state.operationHistory, ctx, state.historyIndex);
  }
}
