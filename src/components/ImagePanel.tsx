import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { drawPlaceholder, renderImage, getContext } from '../utils/canvas';

interface ImagePanelProps {
  imageNum: 1 | 2;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewRef: React.RefObject<HTMLDivElement | null>;
  onImageLoaded: (img: HTMLImageElement, imageNum: 1 | 2) => void;
}

export default function ImagePanel({ imageNum, canvasRef, viewRef, onImageLoaded }: ImagePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCanvas = useAppStore((s) => s.activeCanvas);
  const updateState = useAppStore((s) => s.updateState);

  const isActive = activeCanvas === canvasRef.current && canvasRef.current !== null;

  useEffect(() => {
    if (canvasRef.current) {
      drawPlaceholder(canvasRef.current, `Load Image ${imageNum}`);
    }
  }, [canvasRef, imageNum]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!ev.target?.result) return;
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            renderImage(img, canvasRef.current);
          }
          onImageLoaded(img, imageNum);
        };
        img.src = ev.target.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [canvasRef, imageNum, onImageLoaded]
  );

  const handleEdit = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    if (activeCanvas === canvas) {
      canvas.style.boxShadow = 'none';
      updateState({ activeCanvas: null, activeContext: null });
    } else {
      updateState({ activeCanvas: canvas, activeContext: getContext(canvas) });
    }
  }, [canvasRef, activeCanvas, updateState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.add('drag-highlight');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-highlight');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).classList.remove('drag-highlight');

      const file = e.dataTransfer?.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!ev.target?.result) return;
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            renderImage(img, canvasRef.current);
          }
          onImageLoaded(img, imageNum);
        };
        img.src = ev.target.result as string;
      };
      reader.readAsDataURL(file);
    },
    [canvasRef, imageNum, onImageLoaded]
  );

  return (
    <div className="flex-1 min-w-0 border border-slate-700 rounded-md overflow-hidden bg-slate-800 shadow-sm flex flex-col">
      <div className="panel-header flex justify-between items-center px-2 py-0.5 border-b border-slate-700 min-h-[30px] bg-gradient-to-b from-slate-800 to-slate-900/80 text-xs">
        <h3 className="text-[0.8rem] font-semibold text-slate-400 uppercase tracking-wider m-0">Image {imageNum}</h3>
        {isActive && <span className="ml-auto mr-2 text-green-500 font-semibold text-[0.7rem] uppercase tracking-wider">[Edit Mode]</span>}
        <div className="flex gap-1 items-center">
          <button className="bg-green-500 hover:bg-green-600 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border-none cursor-pointer" onClick={handleEdit}>
            Edit
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          <button className="bg-slate-700 hover:bg-slate-600 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border border-slate-600 cursor-pointer" onClick={handleLoad}>Load</button>
        </div>
      </div>
      <div
        className="image-view flex-1 min-h-0 overflow-auto relative flex items-start transition-colors duration-150 bg-slate-900 cursor-default"
        ref={viewRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          className="block origin-top-left"
          style={{
            boxShadow: isActive ? '0 0 0 3px #22c55e' : 'none',
          }}
        />
      </div>
    </div>
  );
}
