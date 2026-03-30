import { Point, DrawOperation, OperationType } from '../store/useAppStore';

export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  return context;
}

export function drawPlaceholder(canvas: HTMLCanvasElement, text: string): void {
  const ctx = getContext(canvas);
  canvas.width = 400;
  canvas.height = 300;
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

export function renderImage(img: HTMLImageElement, canvas: HTMLCanvasElement): void {
  const ctx = getContext(canvas);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
}

export function getCanvasPixelPosition(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  _zoomFactor?: number
): Point {
  const rect = canvas.getBoundingClientRect();
  // Use actual display ratio to handle CSS max-width, transform scale, and CSS width/height
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: Math.floor((event.clientX - rect.left) * scaleX),
    y: Math.floor((event.clientY - rect.top) * scaleY),
  };
}

export function applyZoom(canvases: HTMLCanvasElement[], zoomFactor: number): void {
  canvases.forEach((canvas) => {
    if (canvas) {
      canvas.style.transform = `scale(${zoomFactor})`;
      canvas.style.transformOrigin = 'left top';
    }
  });
}

export function executeOperation(
  operation: DrawOperation,
  ctx: CanvasRenderingContext2D
): void {
  ctx.save();
  switch (operation.type) {
    case OperationType.LINE:
      if (operation.points && operation.points.length >= 2 && operation.color && operation.brushSize) {
        ctx.beginPath();
        ctx.strokeStyle = operation.color;
        ctx.lineWidth = operation.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(operation.points[0].x, operation.points[0].y);
        for (let i = 1; i < operation.points.length; i++) {
          ctx.lineTo(operation.points[i].x, operation.points[i].y);
        }
        ctx.stroke();
      }
      break;
    case OperationType.ERASE:
      if (operation.points && operation.points.length >= 2 && operation.brushSize) {
        ctx.beginPath();
        ctx.strokeStyle = operation.color || 'white';
        ctx.lineWidth = operation.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(operation.points[0].x, operation.points[0].y);
        for (let i = 1; i < operation.points.length; i++) {
          ctx.lineTo(operation.points[i].x, operation.points[i].y);
        }
        ctx.stroke();
      }
      break;
    case OperationType.CLONE:
      if (operation.points && operation.sourcePoint && operation.brushSize) {
        for (const point of operation.points) {
          const sourceX = operation.sourcePoint.x + (point.x - operation.points[0].x);
          const sourceY = operation.sourcePoint.y + (point.y - operation.points[0].y);
          try {
            const imgData = ctx.getImageData(sourceX, sourceY, 1, 1);
            ctx.putImageData(imgData, point.x, point.y);
          } catch (e) {
            console.error('Clone operation failed:', e);
          }
        }
      }
      break;
    case OperationType.SELECTION:
      if (operation.selection) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          operation.selection.startX,
          operation.selection.startY,
          operation.selection.width,
          operation.selection.height
        );
      }
      break;
    case OperationType.RESET:
      if (operation.imageData) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.putImageData(operation.imageData, 0, 0);
      }
      break;
  }
  ctx.restore();
}

export function replayOperations(
  operations: DrawOperation[],
  ctx: CanvasRenderingContext2D,
  upToIndex: number
): void {
  let lastResetIndex = -1;
  let lastResetOperation: DrawOperation | null = null;

  for (let i = 0; i <= upToIndex; i++) {
    if (operations[i].type === OperationType.RESET) {
      lastResetIndex = i;
      lastResetOperation = operations[i];
    }
  }

  if (lastResetOperation && lastResetOperation.imageData) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.putImageData(lastResetOperation.imageData, 0, 0);
    for (let i = lastResetIndex + 1; i <= upToIndex; i++) {
      executeOperation(operations[i], ctx);
    }
  } else {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let i = 0; i <= upToIndex; i++) {
      executeOperation(operations[i], ctx);
    }
  }
}

export function createImageFromCanvas(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL('image/png');
  });
}

export function createCanvasSnapshot(ctx: CanvasRenderingContext2D): ImageData {
  return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
}
