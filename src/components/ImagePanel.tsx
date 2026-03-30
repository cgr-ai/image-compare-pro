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
      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [canvasRef, imageNum, onImageLoaded]
  );

  const handleEdit = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    if (activeCanvas === canvas) {
      // Deactivate
      canvas.style.boxShadow = 'none';
      updateState({ activeCanvas: null, activeContext: null });
    } else {
      // Activate
      updateState({ activeCanvas: canvas, activeContext: getContext(canvas) });
    }
  }, [canvasRef, activeCanvas, updateState]);

  // Handle drag and drop
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
    <div className="image-panel">
      <div className="panel-header">
        <h3>Image {imageNum}</h3>
        {isActive && <span className="edit-indicator">[Edit Mode]</span>}
        <div className="button-group">
          <button className="edit-btn" onClick={handleEdit}>
            Edit
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          <button onClick={handleLoad}>Load</button>
        </div>
      </div>
      <div
        className="image-view"
        ref={viewRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          style={{
            boxShadow: isActive ? '0 0 0 3px #28a745' : 'none',
          }}
        />
      </div>
    </div>
  );
}
