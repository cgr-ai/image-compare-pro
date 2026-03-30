import { create } from 'zustand';

export interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Point {
  x: number;
  y: number;
}

export enum OperationType {
  LINE = 'line',
  ERASE = 'erase',
  CLONE = 'clone',
  SELECTION = 'selection',
  RESET = 'reset',
}

export interface DrawOperation {
  type: OperationType;
  points?: Point[];
  color?: string;
  brushSize?: number;
  sourcePoint?: Point;
  targetPoint?: Point;
  selection?: {
    startX: number;
    startY: number;
    width: number;
    height: number;
  };
  imageData?: ImageData;
}

export interface CursorState {
  canvasX: number;
  canvasY: number;
  zoomFactor: number;
  activeViewIndex: number | null;
}

export interface AppState {
  image1: HTMLImageElement | null;
  image2: HTMLImageElement | null;
  originalImage1: HTMLImageElement | null;
  originalImage2: HTMLImageElement | null;
  resultImage: ImageData | null;
  selectedTool: string | null;
  brushSize: number;
  color: string;
  operationHistory: DrawOperation[];
  historyIndex: number;
  redoStack: DrawOperation[];
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  isComparing: boolean;
  activeCanvas: HTMLCanvasElement | null;
  activeContext: CanvasRenderingContext2D | null;
  zoomFactor: number;
  cursorState: CursorState;
}

interface AppActions {
  updateState: (partial: Partial<AppState>) => void;
  addOperation: (operation: DrawOperation) => void;
  undo: () => DrawOperation | null;
  redo: () => DrawOperation | null;
  resetState: () => void;
}

const initialState: AppState = {
  image1: null,
  image2: null,
  originalImage1: null,
  originalImage2: null,
  resultImage: null,
  selectedTool: null,
  brushSize: 10,
  color: '#ff0000',
  operationHistory: [],
  historyIndex: -1,
  redoStack: [],
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  isComparing: false,
  activeCanvas: null,
  activeContext: null,
  zoomFactor: 1,
  cursorState: {
    canvasX: 0,
    canvasY: 0,
    zoomFactor: 1,
    activeViewIndex: null,
  },
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  updateState: (partial) => set(partial),

  addOperation: (operation) => {
    const { operationHistory, historyIndex } = get();
    const newHistory = [
      ...operationHistory.slice(0, historyIndex + 1),
      operation,
    ];
    set({
      operationHistory: newHistory,
      historyIndex: newHistory.length - 1,
      redoStack: [],
    });
  },

  undo: () => {
    const { historyIndex, operationHistory, redoStack } = get();
    if (historyIndex < 0) return null;
    const undoneOperation = operationHistory[historyIndex];
    set({
      historyIndex: historyIndex - 1,
      redoStack: [undoneOperation, ...redoStack],
    });
    return undoneOperation;
  },

  redo: () => {
    const { redoStack, operationHistory, historyIndex } = get();
    if (redoStack.length === 0) return null;
    const [redoneOperation, ...remaining] = redoStack;
    set({
      operationHistory: [...operationHistory, redoneOperation],
      historyIndex: historyIndex + 1,
      redoStack: remaining,
    });
    return redoneOperation;
  },

  resetState: () => set(initialState),
}));
