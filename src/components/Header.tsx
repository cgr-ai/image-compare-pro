import { useCallback, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface HeaderProps {
  comparisonMode: string;
  setComparisonMode: (mode: string) => void;
  pixelSubMode: string;
  setPixelSubMode: (mode: string) => void;
  toleranceValue: number;
  setToleranceValue: (val: number) => void;
  transparencyValue: number;
  setTransparencyValue: (val: number) => void;
  toolsVisible: boolean;
  onToggleTools: () => void;
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-[580px] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700">
          <h2 className="text-base text-sky-400 m-0">Image Compare Pro - Help</h2>
          <button className="bg-transparent border-none text-slate-500 text-xl cursor-pointer px-1 leading-none hover:text-slate-200 hover:bg-transparent" onClick={onClose}>&times;</button>
        </div>
        <div className="px-4 py-3 text-sm">
          <section className="mb-4">
            <h3 className="text-[0.85rem] text-sky-400 mb-1 border-b border-slate-700 pb-1">Pixel Diff</h3>
            <p className="text-slate-400 mb-1 leading-relaxed">Per-pixel comparison between the two images.</p>
            <h4 className="text-[0.8rem] text-slate-200 mt-2 mb-0.5">Threshold</h4>
            <p className="text-slate-400 mb-1 leading-relaxed">Compares the max channel difference (R, G, B) of each pixel against a tolerance value.</p>
            <ul className="list-none pl-2 my-1 space-y-1">
              <li className="text-slate-400 flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{background:'rgb(128,128,128)'}} /> <strong className="text-slate-200">Gray</strong> — Pixels are identical (diff = 0)</li>
              <li className="text-slate-400 flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{background:'rgb(0,0,200)'}} /> <strong className="text-slate-200">Blue</strong> — Difference is within tolerance</li>
              <li className="text-slate-400 flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{background:'rgb(220,0,0)'}} /> <strong className="text-slate-200">Red</strong> — Difference exceeds tolerance</li>
            </ul>
            <p className="text-slate-400 mb-1 leading-relaxed">Use the <strong className="text-slate-200">Tolerance</strong> slider to adjust sensitivity. At 0, any difference shows red.</p>

            <h4 className="text-[0.8rem] text-slate-200 mt-2 mb-0.5">Heatmap</h4>
            <p className="text-slate-400 mb-1 leading-relaxed">Visualizes difference magnitude as a heat map.</p>
            <ul className="list-none pl-2 my-1 space-y-1">
              <li className="text-slate-400 flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{background:'rgb(0,0,0)'}} /> <strong className="text-slate-200">Black</strong> — Identical pixels</li>
              <li className="text-slate-400 flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{background:'rgb(255,255,0)'}} /> <strong className="text-slate-200">Yellow</strong> (brighter = larger diff) — Pixels that differ</li>
            </ul>

            <h4 className="text-[0.8rem] text-slate-200 mt-2 mb-0.5">Overlay</h4>
            <p className="text-slate-400 mb-1 leading-relaxed">Weighted blend of both images. Use the <strong className="text-slate-200">Opacity</strong> slider to control the mix ratio.</p>
          </section>

          <section className="mb-4">
            <h3 className="text-[0.85rem] text-sky-400 mb-1 border-b border-slate-700 pb-1">Edge Diff</h3>
            <p className="text-slate-400 mb-1 leading-relaxed">Structural edge comparison using Laplacian edge detection.</p>
            <ul className="list-none pl-2 my-1 space-y-1">
              <li className="text-slate-400 flex items-center gap-1.5">Applies a 3x3 Laplacian kernel <code className="font-mono bg-slate-900 px-1 rounded text-[0.7rem] text-sky-400">[-1,-1,-1, -1,8,-1, -1,-1,-1]</code> to both images</li>
              <li className="text-slate-400 flex items-center gap-1.5">Converts pixels to grayscale, convolves with kernel</li>
              <li className="text-slate-400 flex items-center gap-1.5">Thresholds at |edge| &gt; 100 to classify edge vs non-edge</li>
            </ul>
            <p className="text-slate-400 mb-1 leading-relaxed">Output:</p>
            <ul className="list-none pl-2 my-1 space-y-1">
              <li className="text-slate-400 flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border border-white/20 shrink-0" style={{background:'rgb(255,255,0)'}} /> <strong className="text-slate-200">Yellow</strong> — Edge structure differs between images</li>
              <li className="text-slate-400 flex items-center gap-1.5"><strong className="text-slate-200">Grayscale</strong> — Edge structure matches (shows original luminance)</li>
            </ul>
            <p className="text-slate-400 mb-1 leading-relaxed">Catches structural changes (moved edges, shape changes) but ignores subtle color/brightness shifts.</p>
          </section>

          <section className="mb-4">
            <h3 className="text-[0.85rem] text-sky-400 mb-1 border-b border-slate-700 pb-1">Color Dist.</h3>
            <p className="text-slate-400 mb-1 leading-relaxed">Global color distribution comparison using Bhattacharyya distance.</p>
            <ul className="list-none pl-2 my-1 space-y-1">
              <li className="text-slate-400 flex items-center gap-1.5">Builds an 8-bin RGB histogram per image (8 bins x 3 channels = 24 values)</li>
              <li className="text-slate-400 flex items-center gap-1.5">Normalizes by pixel count</li>
              <li className="text-slate-400 flex items-center gap-1.5">Computes distance: <code className="font-mono bg-slate-900 px-1 rounded text-[0.7rem] text-sky-400">1 - &Sigma;&radic;(h1[i] x h2[i])</code></li>
            </ul>
            <p className="text-slate-400 mb-1 leading-relaxed">Output: Image 1 with a subtle blue tint. The tint increases R/G reduction and B boost proportional to the histogram distance. Effect is subtle for similar images — shows the original image nearly unchanged when distributions match closely.</p>
          </section>

          <section>
            <h3 className="text-[0.85rem] text-sky-400 mb-1 border-b border-slate-700 pb-1">Controls</h3>
            <ul className="list-none pl-2 my-1 space-y-1">
              <li className="text-slate-400 flex items-center gap-1.5"><strong className="text-slate-200">Zoom</strong> — Scale all panels (10%-500%). Use +/- for 10% steps. Ctrl+Wheel also works.</li>
              <li className="text-slate-400 flex items-center gap-1.5"><strong className="text-slate-200">Tools</strong> — Toggle the editing panel (Brush, Eraser, Clone, Select).</li>
              <li className="text-slate-400 flex items-center gap-1.5"><strong className="text-slate-200">Inspection Grid</strong> — Shows a zoomed 13x13 pixel window around the cursor with RGBA values and per-pixel diff.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Header({
  comparisonMode,
  setComparisonMode,
  pixelSubMode,
  setPixelSubMode,
  toleranceValue,
  setToleranceValue,
  transparencyValue,
  setTransparencyValue,
  toolsVisible,
  onToggleTools,
}: HeaderProps) {
  const zoomFactor = useAppStore((s) => s.zoomFactor);
  const updateState = useAppStore((s) => s.updateState);
  const [showHelp, setShowHelp] = useState(false);

  const handleZoom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const zoom = parseInt(e.target.value);
      updateState({ zoomFactor: zoom / 100 });
    },
    [updateState]
  );

  return (
    <>
      <header className="bg-primary sticky top-0 z-50 border-b border-slate-700">
        <div className="flex items-center h-[38px] px-2">
          <span className="text-[0.8rem] font-bold text-sky-400 whitespace-nowrap tracking-wide px-2">Image Compare Pro</span>
          <div className="w-px h-5 bg-slate-700 shrink-0 mx-1" />
          <div className="flex flex-wrap gap-2 items-center flex-1 px-1">
            <div className="flex items-center flex-wrap">
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <label className="text-slate-400 text-[0.7rem] uppercase tracking-wide font-medium">Mode</label>
                  <select
                    value={comparisonMode}
                    onChange={(e) => setComparisonMode(e.target.value)}
                    className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-200 text-xs cursor-pointer outline-none hover:border-sky-400 focus:border-sky-400 transition-colors duration-150"
                  >
                    <option value="pixel">Pixel Diff</option>
                    <option value="structural">Edge Diff</option>
                    <option value="histogram">Color Dist.</option>
                  </select>
                </div>

                {comparisonMode === 'pixel' && (
                  <div className="flex items-center gap-1 text-xs">
                    <label className="text-slate-400 text-[0.7rem] uppercase tracking-wide font-medium">Method</label>
                    <select
                      value={pixelSubMode}
                      onChange={(e) => setPixelSubMode(e.target.value)}
                      className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-200 text-xs cursor-pointer outline-none hover:border-sky-400 focus:border-sky-400 transition-colors duration-150"
                    >
                      <option value="tolerance">Threshold</option>
                      <option value="range">Heatmap</option>
                      <option value="blend">Overlay</option>
                    </select>
                  </div>
                )}

                {comparisonMode === 'pixel' && pixelSubMode === 'tolerance' && (
                  <div className="flex items-center gap-1 text-xs">
                    <label className="text-slate-400 text-[0.7rem] uppercase tracking-wide font-medium">Tolerance</label>
                    <button className="step-btn" onClick={() => setToleranceValue(Math.max(0, toleranceValue - 1))}>-</button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={toleranceValue}
                      onChange={(e) => setToleranceValue(parseInt(e.target.value))}
                    />
                    <button className="step-btn" onClick={() => setToleranceValue(Math.min(100, toleranceValue + 1))}>+</button>
                    <span className="text-[0.7rem] text-sky-400 font-mono min-w-[28px] text-right">{toleranceValue}</span>
                  </div>
                )}

                {comparisonMode === 'pixel' && pixelSubMode === 'blend' && (
                  <div className="flex items-center gap-1 text-xs">
                    <label className="text-slate-400 text-[0.7rem] uppercase tracking-wide font-medium">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={transparencyValue}
                      onChange={(e) => setTransparencyValue(parseInt(e.target.value))}
                    />
                    <span className="text-[0.7rem] text-sky-400 font-mono min-w-[28px] text-right">{transparencyValue}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-px h-5 bg-slate-700 shrink-0 mx-1" />

            <div className="flex items-center ml-auto text-xs gap-1">
              <label className="text-slate-400 text-[0.7rem] uppercase tracking-wide font-medium">Zoom</label>
              <button className="step-btn" onClick={() => updateState({ zoomFactor: Math.max(0.1, zoomFactor - 0.1) })}>-</button>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={Math.round(zoomFactor * 100)}
                onChange={handleZoom}
                className="w-[120px]"
              />
              <button className="step-btn" onClick={() => updateState({ zoomFactor: Math.min(5, zoomFactor + 0.1) })}>+</button>
              <span className="text-[0.7rem] text-sky-400 font-mono min-w-[28px] text-right">{Math.round(zoomFactor * 100)}%</span>
            </div>

            <div className="w-px h-5 bg-slate-700 shrink-0 mx-1" />

            <button
              className="bg-transparent border border-slate-700 text-slate-500 px-2 py-0.5 rounded text-[0.7rem] cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-white/[0.08] hover:text-slate-50 hover:border-sky-400"
              onClick={onToggleTools}
            >
              {toolsVisible ? 'Tools ▸' : 'Tools ◂'}
            </button>

            <button
              className="step-btn w-[22px] h-[22px] font-bold ml-1"
              onClick={() => setShowHelp(true)}
              title="Help"
            >?</button>
          </div>
        </div>
      </header>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  );
}
