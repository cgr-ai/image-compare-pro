import { useRef, useState, useCallback, useEffect } from 'react';
import { useAppStore, OperationType, Point } from './store/useAppStore';
import { getContext, applyZoom, renderImage, createImageFromCanvas, drawPlaceholder } from './utils/canvas';
import { runComparison } from './utils/comparison';
import {
  startOperation,
  continueOperation,
  finishOperation,
  createResetOperation,
  undoHistory,
  redoHistory,
} from './utils/history';
import { getCanvasPixelPosition } from './utils/canvas';
import Header from './components/Header';
import ImagePanel from './components/ImagePanel';
import ResultPanel from './components/ResultPanel';
import EditingTools from './components/EditingTools';
import { InspectionGridHandle } from './components/InspectionGrid';
import './App.css';

export default function App() {
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const fullResultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const view1Ref = useRef<HTMLDivElement>(null);
  const view2Ref = useRef<HTMLDivElement>(null);
  const resultViewRef = useRef<HTMLDivElement>(null);
  const inspectionRef = useRef<InspectionGridHandle>(null);
  const viewportOffsetRef = useRef({ x: 0, y: 0 });

  // Comparison settings as local state (not needed in global store)
  const [comparisonMode, setComparisonMode] = useState('pixel');
  const [pixelSubMode, setPixelSubMode] = useState('tolerance');
  const [toleranceValue, setToleranceValue] = useState(10);
  const [transparencyValue, setTransparencyValue] = useState(50);

  // Drawing refs (not state - imperative canvas ops)
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const pendingComparisonRef = useRef(false);
  const scrollSyncRef = useRef(false);

  const store = useAppStore;

  // --- Result viewport rendering ---
  const updateResultViewport = useCallback(() => {
    const view1 = view1Ref.current;
    const fullResult = fullResultCanvasRef.current;
    const resultCanvas = resultCanvasRef.current;
    if (!view1 || !fullResult || !resultCanvas || fullResult.width <= 1) return;

    const zf = store.getState().zoomFactor;

    // Visible region in original image pixels
    const srcX = Math.floor(view1.scrollLeft / zf);
    const srcY = Math.floor(view1.scrollTop / zf);
    const srcW = Math.min(Math.ceil(view1.clientWidth / zf), fullResult.width - srcX);
    const srcH = Math.min(Math.ceil(view1.clientHeight / zf), fullResult.height - srcY);

    if (srcW <= 0 || srcH <= 0) return;

    // Store offset for mouse position mapping
    viewportOffsetRef.current = { x: srcX, y: srcY };

    // Size result canvas to the visible region in image pixels
    resultCanvas.width = srcW;
    resultCanvas.height = srcH;

    // CSS size = image pixels * zoom to visually match the image panels
    resultCanvas.style.width = `${srcW * zf}px`;
    resultCanvas.style.height = `${srcH * zf}px`;
    // Clear any CSS transform from applyZoom
    resultCanvas.style.transform = '';

    // Draw only the visible sub-region from the offscreen canvas
    const ctxResult = resultCanvas.getContext('2d');
    if (!ctxResult) return;
    ctxResult.drawImage(
      fullResult,
      srcX, srcY, srcW, srcH,
      0, 0, srcW, srcH
    );
  }, [store]);

  // --- Comparison ---
  const doCompare = useCallback(() => {
    const { image1, image2, isComparing } = store.getState();
    if (!image1 || !image2 || isComparing) return;
    if (!canvas1Ref.current || !canvas2Ref.current) return;

    // Create offscreen canvas lazily
    if (!fullResultCanvasRef.current) {
      fullResultCanvasRef.current = document.createElement('canvas');
    }

    store.getState().updateState({ isComparing: true });
    const result = runComparison(
      canvas1Ref.current,
      canvas2Ref.current,
      fullResultCanvasRef.current,
      comparisonMode,
      pixelSubMode,
      toleranceValue,
      transparencyValue
    );
    store.getState().updateState({ resultImage: result, isComparing: false });

    // Render visible portion to on-screen result canvas
    updateResultViewport();
  }, [comparisonMode, pixelSubMode, toleranceValue, transparencyValue, store, updateResultViewport]);

  // --- Image loading ---
  const handleImageLoaded = useCallback(
    (img: HTMLImageElement, imageNum: 1 | 2) => {
      const originalImg = new Image();
      originalImg.src = img.src;

      if (imageNum === 1) {
        store.getState().updateState({ image1: img, originalImage1: originalImg });
      } else {
        store.getState().updateState({ image2: img, originalImage2: originalImg });
      }

      const state = store.getState();
      if (state.image1 && state.image2) {
        // Delay to ensure canvases are ready
        requestAnimationFrame(() => doCompare());
      }
    },
    [store, doCompare]
  );

  // --- Zoom effect (exclude result canvas) ---
  const zoomFactor = useAppStore((s) => s.zoomFactor);
  useEffect(() => {
    const canvases = [canvas1Ref.current, canvas2Ref.current].filter(
      Boolean
    ) as HTMLCanvasElement[];
    applyZoom(canvases, zoomFactor);
    // Result canvas uses CSS width/height for zoom, not transform
    updateResultViewport();
  }, [zoomFactor, updateResultViewport]);

  // --- Synchronized cursors & scroll ---
  useEffect(() => {
    const views = [view1Ref.current, view2Ref.current, resultViewRef.current];
    const canvases = [canvas1Ref.current, canvas2Ref.current, resultCanvasRef.current];

    // Create cursor followers
    const followers: HTMLDivElement[] = [];
    views.forEach((view, i) => {
      if (!view) return;
      let follower = view.querySelector('.cursor-follower') as HTMLDivElement;
      if (!follower) {
        follower = document.createElement('div');
        follower.className = 'cursor-follower';
        follower.style.display = 'none';
        view.appendChild(follower);
      }
      followers[i] = follower;
    });

    function updateFollowers(canvasX: number, canvasY: number, activeIdx: number) {
      const fullW = fullResultCanvasRef.current?.width ?? 0;
      const fullH = fullResultCanvasRef.current?.height ?? 0;

      canvases.forEach((canvas, idx) => {
        if (idx === activeIdx || !canvas || canvas.width <= 1) return;
        const f = followers[idx];
        const v = views[idx];
        if (!f || !v) return;

        // For result view, check bounds against full image size
        const boundsW = idx === 2 ? fullW : canvas.width;
        const boundsH = idx === 2 ? fullH : canvas.height;

        if (canvasX >= 0 && canvasX < boundsW && canvasY >= 0 && canvasY < boundsH) {
          const canvasRect = canvas.getBoundingClientRect();
          const viewRect = v.getBoundingClientRect();
          // Use actual display ratio (handles CSS max-width, transform, CSS sizing)
          const displayScaleX = canvasRect.width / canvas.width;
          const displayScaleY = canvasRect.height / canvas.height;
          let xPos: number, yPos: number;

          if (idx === 2) {
            // Result view: canvas shows only the visible sub-region
            const offset = viewportOffsetRef.current;
            const localX = canvasX - offset.x;
            const localY = canvasY - offset.y;

            if (localX < 0 || localX >= canvas.width || localY < 0 || localY >= canvas.height) {
              f.style.display = 'none';
              return;
            }

            xPos = localX * displayScaleX + canvasRect.left - viewRect.left;
            yPos = localY * displayScaleY + canvasRect.top - viewRect.top;
          } else {
            // Image views: use display ratio + scroll offset
            xPos = canvasX * displayScaleX + v.scrollLeft + canvasRect.left - viewRect.left;
            yPos = canvasY * displayScaleY + v.scrollTop + canvasRect.top - viewRect.top;
          }

          f.className = 'cursor-follower inactive';
          f.style.left = `${xPos}px`;
          f.style.top = `${yPos}px`;
          f.style.display = 'block';
        } else {
          f.style.display = 'none';
        }
      });
    }

    const mouseMoveHandlers: ((e: MouseEvent) => void)[] = [];
    const mouseLeaveHandlers: (() => void)[] = [];

    canvases.forEach((canvas, idx) => {
      if (!canvas) return;

      const moveHandler = (e: MouseEvent) => {
        const zf = store.getState().zoomFactor;
        let pos = getCanvasPixelPosition(e, canvas, zf);

        // If result canvas, map local coords back to full-image coords
        if (idx === 2) {
          const offset = viewportOffsetRef.current;
          pos = { x: pos.x + offset.x, y: pos.y + offset.y };
        }

        store.getState().updateState({
          cursorState: { canvasX: pos.x, canvasY: pos.y, zoomFactor: zf, activeViewIndex: idx },
        });
        updateFollowers(pos.x, pos.y, idx);

        // Update inspection
        if (inspectionRef.current && canvas1Ref.current && canvas2Ref.current) {
          inspectionRef.current.updateInspection(
            pos.x,
            pos.y,
            getContext(canvas1Ref.current),
            getContext(canvas2Ref.current)
          );
        }

        // Drawing
        handleDrawMove(e, canvas);
      };

      const leaveHandler = () => {
        followers.forEach((f) => {
          if (f) f.style.display = 'none';
        });
      };

      canvas.addEventListener('mousemove', moveHandler);
      canvas.addEventListener('mouseleave', leaveHandler);
      mouseMoveHandlers[idx] = moveHandler;
      mouseLeaveHandlers[idx] = leaveHandler;
    });

    // Scroll sync — only between image views, not result view
    const imageViews = [view1Ref.current, view2Ref.current];
    const scrollHandlers: ((this: HTMLElement) => void)[] = [];
    imageViews.forEach((view, idx) => {
      if (!view) return;
      const handler = function (this: HTMLElement) {
        if (scrollSyncRef.current) return;
        scrollSyncRef.current = true;
        const sl = this.scrollLeft;
        const st = this.scrollTop;
        imageViews.forEach((other, otherIdx) => {
          if (otherIdx !== idx && other) {
            other.scrollLeft = sl;
            other.scrollTop = st;
          }
        });
        // Update result viewport on scroll
        updateResultViewport();
        setTimeout(() => (scrollSyncRef.current = false), 10);
      };
      view.addEventListener('scroll', handler);
      scrollHandlers[idx] = handler;
    });

    // ResizeObserver to update result when container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateResultViewport();
    });
    if (view1Ref.current) resizeObserver.observe(view1Ref.current);

    return () => {
      canvases.forEach((canvas, idx) => {
        if (!canvas) return;
        if (mouseMoveHandlers[idx]) canvas.removeEventListener('mousemove', mouseMoveHandlers[idx]);
        if (mouseLeaveHandlers[idx]) canvas.removeEventListener('mouseleave', mouseLeaveHandlers[idx]);
      });
      imageViews.forEach((view, idx) => {
        if (!view || !scrollHandlers[idx]) return;
        view.removeEventListener('scroll', scrollHandlers[idx]);
      });
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Drawing handlers ---
  function handleDrawMove(e: MouseEvent, canvas: HTMLCanvasElement) {
    const state = store.getState();
    if (!isDrawingRef.current || !state.selectedTool || state.activeCanvas !== canvas || !state.activeContext) return;
    const lp = lastPointRef.current;
    if (!lp) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const ctx = state.activeContext;

    switch (state.selectedTool) {
      case 'brushTool':
        ctx.beginPath();
        ctx.moveTo(lp.x, lp.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        continueOperation(cx, cy);
        break;
      case 'eraserTool':
        ctx.beginPath();
        ctx.moveTo(lp.x, lp.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = state.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        continueOperation(cx, cy);
        break;
      case 'cloneTool': {
        const sx = lp.x + 20;
        const sy = lp.y + 20;
        if (sx < canvas.width && sy < canvas.height) {
          const imgData = ctx.getImageData(sx, sy, 1, 1);
          ctx.putImageData(imgData, cx, cy);
        }
        continueOperation(cx, cy);
        break;
      }
      case 'selectTool':
        continueOperation(cx, cy);
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeRect(lp.x, lp.y, cx - lp.x, cy - lp.y);
        ctx.restore();
        break;
    }
    lastPointRef.current = { x: cx, y: cy };
    scheduleComparisonUpdate();
  }

  // mousedown on canvases
  useEffect(() => {
    const canvases = [canvas1Ref.current, canvas2Ref.current];
    const handlers: ((e: MouseEvent) => void)[] = [];

    canvases.forEach((canvas, idx) => {
      if (!canvas) return;
      const handler = (e: MouseEvent) => {
        const state = store.getState();
        if (!state.selectedTool || state.activeCanvas !== canvas || !state.activeContext) return;

        isDrawingRef.current = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        lastPointRef.current = { x, y };

        switch (state.selectedTool) {
          case 'brushTool':
            startOperation(OperationType.LINE, x, y, { color: state.color, brushSize: state.brushSize });
            break;
          case 'eraserTool':
            startOperation(OperationType.ERASE, x, y, { color: '#ffffff', brushSize: state.brushSize });
            break;
          case 'cloneTool':
            startOperation(OperationType.CLONE, x, y, {
              brushSize: state.brushSize,
              sourcePoint: { x: x + 20, y: y + 20 },
            });
            break;
          case 'selectTool':
            startOperation(OperationType.SELECTION, x, y);
            break;
        }
      };
      canvas.addEventListener('mousedown', handler);
      handlers[idx] = handler;
    });

    return () => {
      canvases.forEach((canvas, idx) => {
        if (canvas && handlers[idx]) canvas.removeEventListener('mousedown', handlers[idx]);
      });
    };
  }, [store]);

  // mouseup/mouseout
  useEffect(() => {
    function finishDraw(e?: MouseEvent) {
      if (!isDrawingRef.current) return;
      const state = store.getState();
      if (!state.selectedTool || !state.activeCanvas || !state.activeContext) return;

      const lp = lastPointRef.current;
      switch (state.selectedTool) {
        case 'brushTool':
          finishOperation(OperationType.LINE, { color: state.color, brushSize: state.brushSize });
          break;
        case 'eraserTool':
          finishOperation(OperationType.ERASE, { color: '#ffffff', brushSize: state.brushSize });
          break;
        case 'cloneTool':
          finishOperation(OperationType.CLONE);
          break;
        case 'selectTool':
          if (lp && e) {
            const rect = state.activeCanvas.getBoundingClientRect();
            const scaleX = state.activeCanvas.width / rect.width;
            const scaleY = state.activeCanvas.height / rect.height;
            const endX = (e.clientX - rect.left) * scaleX;
            const endY = (e.clientY - rect.top) * scaleY;
            finishOperation(OperationType.SELECTION, {
              selection: { startX: lp.x, startY: lp.y, width: endX - lp.x, height: endY - lp.y },
            });
          }
          break;
      }

      isDrawingRef.current = false;
      lastPointRef.current = null;
      scheduleComparisonUpdate();
    }

    const mouseUpHandler = (e: MouseEvent) => finishDraw(e);
    window.addEventListener('mouseup', mouseUpHandler);
    return () => window.removeEventListener('mouseup', mouseUpHandler);
  }, [store]);

  function scheduleComparisonUpdate() {
    const state = store.getState();
    if (
      (state.activeCanvas === canvas1Ref.current || state.activeCanvas === canvas2Ref.current) &&
      state.image1 &&
      state.image2
    ) {
      if (!pendingComparisonRef.current) {
        pendingComparisonRef.current = true;
        requestAnimationFrame(() => {
          if (state.activeCanvas) {
            createImageFromCanvas(state.activeCanvas).then((img) => {
              if (state.activeCanvas === canvas1Ref.current) {
                store.getState().updateState({ image1: img });
              } else {
                store.getState().updateState({ image2: img });
              }
              doCompare();
            });
          }
          pendingComparisonRef.current = false;
        });
      }
    }
  }

  // --- Edit actions ---
  const handleUndo = useCallback(() => {
    const state = store.getState();
    if (!state.activeContext) return;
    undoHistory(state.activeContext);
    scheduleComparisonUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const handleRedo = useCallback(() => {
    const state = store.getState();
    if (!state.activeContext) return;
    redoHistory(state.activeContext);
    scheduleComparisonUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const handleReset = useCallback(() => {
    const state = store.getState();
    if (!state.activeCanvas || !state.activeContext) return;

    if (state.activeCanvas === canvas1Ref.current && state.originalImage1) {
      renderImage(state.originalImage1, state.activeCanvas);
      const newImg = new Image();
      newImg.src = state.originalImage1.src;
      store.getState().updateState({ image1: newImg });
    } else if (state.activeCanvas === canvas2Ref.current && state.originalImage2) {
      renderImage(state.originalImage2, state.activeCanvas);
      const newImg = new Image();
      newImg.src = state.originalImage2.src;
      store.getState().updateState({ image2: newImg });
    }

    createResetOperation(state.activeContext);
    scheduleComparisonUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const handleSave = useCallback(() => {
    const state = store.getState();
    if (!state.activeCanvas) return;
    const link = document.createElement('a');
    link.download = state.activeCanvas === canvas1Ref.current ? 'image1-edited.png' : 'image2-edited.png';
    link.href = state.activeCanvas.toDataURL('image/png');
    link.click();
  }, [store]);

  const handleApply = useCallback(() => {
    const state = store.getState();
    if (!state.activeCanvas || !state.activeContext) return;

    createImageFromCanvas(state.activeCanvas).then((img) => {
      if (state.activeCanvas === canvas1Ref.current) {
        store.getState().updateState({ image1: img });
      } else {
        store.getState().updateState({ image2: img });
      }
      createResetOperation(state.activeContext!);
      doCompare();
    });
  }, [store, doCompare]);

  // Save full comparison result (from offscreen canvas, not viewport)
  const handleSaveResult = useCallback(() => {
    const canvas = fullResultCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'comparison-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // Init result canvas placeholder
  useEffect(() => {
    if (resultCanvasRef.current) {
      drawPlaceholder(resultCanvasRef.current, 'Comparison Result');
    }
  }, []);

  // Set up active canvas reset operation when it changes
  const activeCanvas = useAppStore((s) => s.activeCanvas);
  useEffect(() => {
    if (activeCanvas) {
      const ctx = getContext(activeCanvas);
      createResetOperation(ctx);
    }
  }, [activeCanvas]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        pixelSubMode={pixelSubMode}
        setPixelSubMode={setPixelSubMode}
        toleranceValue={toleranceValue}
        setToleranceValue={setToleranceValue}
        transparencyValue={transparencyValue}
        setTransparencyValue={setTransparencyValue}
        onCompare={doCompare}
      />

      <main>
        <div className="main-layout">
          <div className="left-content">
            <div className="images-row">
              <ImagePanel
                imageNum={1}
                canvasRef={canvas1Ref}
                viewRef={view1Ref}
                onImageLoaded={handleImageLoaded}
              />
              <ImagePanel
                imageNum={2}
                canvasRef={canvas2Ref}
                viewRef={view2Ref}
                onImageLoaded={handleImageLoaded}
              />
            </div>

            <ResultPanel
              resultCanvasRef={resultCanvasRef}
              resultViewRef={resultViewRef}
              inspectionRef={inspectionRef}
              onSaveResult={handleSaveResult}
            />
          </div>

          <EditingTools
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            onSave={handleSave}
            onApply={handleApply}
          />
        </div>
      </main>
    </div>
  );
}
