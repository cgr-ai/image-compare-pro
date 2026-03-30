import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
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

const InspectionGrid = forwardRef<InspectionGridHandle>((_props, ref) => {
  const inspectionCanvas1Ref = useRef<HTMLCanvasElement>(null);
  const inspectionCanvas2Ref = useRef<HTMLCanvasElement>(null);
  const cursorPosRef = useRef<HTMLSpanElement>(null);
  const pixel1RGBRef = useRef<HTMLSpanElement>(null);
  const pixel1AlphaRef = useRef<HTMLSpanElement>(null);
  const pixel2RGBRef = useRef<HTMLSpanElement>(null);
  const pixel2AlphaRef = useRef<HTMLSpanElement>(null);
  const pixelDiffRGBRef = useRef<HTMLSpanElement>(null);
  const pixelDiffAlphaRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    updateInspection(
      x: number,
      y: number,
      img1Ctx: CanvasRenderingContext2D,
      img2Ctx: CanvasRenderingContext2D
    ) {
      if (cursorPosRef.current) cursorPosRef.current.textContent = `X: ${x}, Y: ${y}`;

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

      if (pixel1RGBRef.current) pixel1RGBRef.current.textContent = `${pixel1.r},${pixel1.g},${pixel1.b}`;
      if (pixel1AlphaRef.current) pixel1AlphaRef.current.textContent = String(pixel1.a);
      if (pixel2RGBRef.current) pixel2RGBRef.current.textContent = `${pixel2.r},${pixel2.g},${pixel2.b}`;
      if (pixel2AlphaRef.current) pixel2AlphaRef.current.textContent = String(pixel2.a);
      if (pixelDiffRGBRef.current) pixelDiffRGBRef.current.textContent = `${diff.r},${diff.g},${diff.b}`;
      if (pixelDiffAlphaRef.current) pixelDiffAlphaRef.current.textContent = String(diff.a);
    },
  }));

  return (
    <div className="inspection-container">
      <div className="inspection-grids">
        <div className="inspection-grid">
          <canvas ref={inspectionCanvas1Ref} width={156} height={156} />
          <div className="pixel-data">
            <div>RGB: <span ref={pixel1RGBRef}>0,0,0</span></div>
            <div>A: <span ref={pixel1AlphaRef}>0</span></div>
          </div>
        </div>
        <div className="inspection-grid">
          <canvas ref={inspectionCanvas2Ref} width={156} height={156} />
          <div className="pixel-data">
            <div>RGB: <span ref={pixel2RGBRef}>0,0,0</span></div>
            <div>A: <span ref={pixel2AlphaRef}>0</span></div>
          </div>
        </div>
      </div>
      <div className="info-container">
        <div className="position-info">
          <span>Position: </span>
          <span ref={cursorPosRef}>X: 0, Y: 0</span>
        </div>
        <div className="diff-info">
          <span className="diff-label">Diff:</span>
          <div className="diff-values">
            <div>RGB: <span ref={pixelDiffRGBRef}>0,0,0</span></div>
            <div>A: <span ref={pixelDiffAlphaRef}>0</span></div>
          </div>
        </div>
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
  const gridSize = 11;
  const cellSize = 12;
  const origin = {
    x: inspectionCtx.canvas.width / 2 - (gridSize * cellSize) / 2,
    y: inspectionCtx.canvas.height / 2 - (gridSize * cellSize) / 2,
  };

  const offsetX = Math.max(0, x - Math.floor(gridSize / 2));
  const offsetY = Math.max(0, y - Math.floor(gridSize / 2));

  try {
    const width = Math.min(gridSize, sourceCtx.canvas.width - offsetX);
    const height = Math.min(gridSize, sourceCtx.canvas.height - offsetY);
    if (width > 0 && height > 0) {
      const imageData = sourceCtx.getImageData(offsetX, offsetY, width, height);
      drawZoomedGrid(inspectionCtx, imageData, origin.x, origin.y, cellSize);
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
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      ctx.fillRect(originX + x * cellSize, originY + y * cellSize, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.strokeRect(originX + x * cellSize, originY + y * cellSize, cellSize, cellSize);
    }
  }
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
