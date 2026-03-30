import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Pixel } from '../store/useAppStore';
import { getContext } from '../utils/canvas';

export interface InspectionGridHandle {
  updateInspection: (
    x: number,
    y: number,
    img1Ctx: CanvasRenderingContext2D,
    img2Ctx: CanvasRenderingContext2D
  ) => void;
}

const GRID_SIZE = 13;
const CELL_SIZE = 14;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const InspectionGrid = forwardRef<InspectionGridHandle>((_props, ref) => {
  const inspectionCanvas1Ref = useRef<HTMLCanvasElement>(null);
  const inspectionCanvas2Ref = useRef<HTMLCanvasElement>(null);
  const cursorPosRef = useRef<HTMLSpanElement>(null);
  const pixel1RGBRef = useRef<HTMLSpanElement>(null);
  const pixel2RGBRef = useRef<HTMLSpanElement>(null);
  const pixelDiffRGBRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    updateInspection(
      x: number,
      y: number,
      img1Ctx: CanvasRenderingContext2D,
      img2Ctx: CanvasRenderingContext2D
    ) {
      if (cursorPosRef.current) cursorPosRef.current.textContent = `${x}, ${y}`;

      const c1 = inspectionCanvas1Ref.current;
      const c2 = inspectionCanvas2Ref.current;
      if (!c1 || !c2) return;

      const ctx1 = getContext(c1);
      const ctx2 = getContext(c2);
      ctx1.clearRect(0, 0, c1.width, c1.height);
      ctx2.clearRect(0, 0, c2.width, c2.height);

      drawInspectionGrid(x, y, img1Ctx, ctx1);
      drawInspectionGrid(x, y, img2Ctx, ctx2);

      const pixel1 = getPixelAt(img1Ctx, x, y);
      const pixel2 = getPixelAt(img2Ctx, x, y);
      const diff = {
        r: Math.abs(pixel1.r - pixel2.r),
        g: Math.abs(pixel1.g - pixel2.g),
        b: Math.abs(pixel1.b - pixel2.b),
        a: Math.abs(pixel1.a - pixel2.a),
      };

      if (pixel1RGBRef.current) pixel1RGBRef.current.textContent = `${pixel1.r},${pixel1.g},${pixel1.b},${pixel1.a}`;
      if (pixel2RGBRef.current) pixel2RGBRef.current.textContent = `${pixel2.r},${pixel2.g},${pixel2.b},${pixel2.a}`;
      if (pixelDiffRGBRef.current) pixelDiffRGBRef.current.textContent = `${diff.r},${diff.g},${diff.b},${diff.a}`;
    },
  }));

  return (
    <div className="absolute left-0 top-0 bottom-0 z-2 w-[196px] bg-slate-800 border border-slate-700 rounded-md p-1 shadow-sm flex flex-col gap-[3px]">
      <div className="flex flex-col gap-px">
        <div className="flex justify-between items-center text-[0.7rem] font-mono text-sky-400 font-semibold px-0.5">
          Img 1 <span className="text-slate-200 font-normal font-mono text-[0.7rem]" ref={pixel1RGBRef}>0,0,0,0</span>
        </div>
        <canvas ref={inspectionCanvas1Ref} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block w-full h-auto border border-slate-700 bg-slate-900 [image-rendering:pixelated]" />
      </div>
      <div className="flex flex-col gap-px">
        <div className="flex justify-between items-center text-[0.7rem] font-mono text-sky-400 font-semibold px-0.5">
          Img 2 <span className="text-slate-200 font-normal font-mono text-[0.7rem]" ref={pixel2RGBRef}>0,0,0,0</span>
        </div>
        <canvas ref={inspectionCanvas2Ref} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block w-full h-auto border border-slate-700 bg-slate-900 [image-rendering:pixelated]" />
      </div>
      <div className="flex justify-between bg-slate-900 rounded px-1 py-[3px] text-[0.7rem] font-mono">
        <span className="text-slate-200 whitespace-nowrap" ref={cursorPosRef}>0, 0</span>
        <span className="text-slate-200 whitespace-nowrap">Diff: <span ref={pixelDiffRGBRef}>0,0,0,0</span></span>
      </div>
    </div>
  );
});

function drawInspectionGrid(
  x: number,
  y: number,
  sourceCtx: CanvasRenderingContext2D,
  inspectionCtx: CanvasRenderingContext2D
): void {
  const offsetX = Math.max(0, x - Math.floor(GRID_SIZE / 2));
  const offsetY = Math.max(0, y - Math.floor(GRID_SIZE / 2));

  try {
    const width = Math.min(GRID_SIZE, sourceCtx.canvas.width - offsetX);
    const height = Math.min(GRID_SIZE, sourceCtx.canvas.height - offsetY);
    if (width > 0 && height > 0) {
      const imageData = sourceCtx.getImageData(offsetX, offsetY, width, height);
      drawZoomedGrid(inspectionCtx, imageData, 0, 0, CELL_SIZE);
    }
  } catch (e) {
    console.error('Error getting image data:', e);
  }
}

function drawZoomedGrid(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  originX: number,
  originY: number,
  cellSize: number
): void {
  const w = imageData.width;
  const h = imageData.height;
  const centerX = Math.floor(w / 2);
  const centerY = Math.floor(h / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      ctx.fillRect(originX + x * cellSize, originY + y * cellSize, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.strokeRect(originX + x * cellSize, originY + y * cellSize, cellSize, cellSize);
    }
  }
  const cx = originX + centerX * cellSize;
  const cy = originY + centerY * cellSize;
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
  ctx.lineWidth = 1;
}

function getPixelAt(ctx: CanvasRenderingContext2D, x: number, y: number): Pixel {
  const defaultPixel: Pixel = { r: 0, g: 0, b: 0, a: 0 };
  if (x < 0 || x >= ctx.canvas.width || y < 0 || y >= ctx.canvas.height) return defaultPixel;
  try {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] };
  } catch {
    return defaultPixel;
  }
}

InspectionGrid.displayName = 'InspectionGrid';

export default InspectionGrid;
