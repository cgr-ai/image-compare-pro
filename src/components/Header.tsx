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
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>Image Compare Pro - Help</h2>
          <button className="help-close" onClick={onClose}>&times;</button>
        </div>
        <div className="help-body">
          <section>
            <h3>Pixel Diff</h3>
            <p>Per-pixel comparison between the two images.</p>
            <h4>Threshold</h4>
            <p>Compares the max channel difference (R, G, B) of each pixel against a tolerance value.</p>
            <ul>
              <li><span className="color-swatch" style={{background:'rgb(128,128,128)'}} /> <strong>Gray</strong> — Pixels are identical (diff = 0)</li>
              <li><span className="color-swatch" style={{background:'rgb(0,0,200)'}} /> <strong>Blue</strong> — Difference is within tolerance</li>
              <li><span className="color-swatch" style={{background:'rgb(220,0,0)'}} /> <strong>Red</strong> — Difference exceeds tolerance</li>
            </ul>
            <p>Use the <strong>Tolerance</strong> slider to adjust sensitivity. At 0, any difference shows red.</p>

            <h4>Heatmap</h4>
            <p>Visualizes difference magnitude as a heat map.</p>
            <ul>
              <li><strong>Black</strong> — Identical pixels</li>
              <li><strong>Yellow</strong> (brighter = larger diff) — Pixels that differ</li>
            </ul>

            <h4>Overlay</h4>
            <p>Weighted blend of both images. Use the <strong>Opacity</strong> slider to control the mix ratio.</p>
          </section>

          <section>
            <h3>Edge Diff</h3>
            <p>Structural edge comparison using Laplacian edge detection.</p>
            <ul>
              <li>Applies a 3x3 Laplacian kernel <code>[-1,-1,-1, -1,8,-1, -1,-1,-1]</code> to both images</li>
              <li>Converts pixels to grayscale, convolves with kernel</li>
              <li>Thresholds at |edge| &gt; 100 to classify edge vs non-edge</li>
            </ul>
            <p>Output:</p>
            <ul>
              <li><span className="color-swatch" style={{background:'rgb(255,255,0)'}} /> <strong>Yellow</strong> — Edge structure differs between images</li>
              <li><strong>Grayscale</strong> — Edge structure matches (shows original luminance)</li>
            </ul>
            <p>Catches structural changes (moved edges, shape changes) but ignores subtle color/brightness shifts.</p>
          </section>

          <section>
            <h3>Color Dist.</h3>
            <p>Global color distribution comparison using Bhattacharyya distance.</p>
            <ul>
              <li>Builds an 8-bin RGB histogram per image (8 bins x 3 channels = 24 values)</li>
              <li>Normalizes by pixel count</li>
              <li>Computes distance: <code>1 - &Sigma;&radic;(h1[i] x h2[i])</code></li>
            </ul>
            <p>Output: Image 1 with a uniform blue tint proportional to the histogram distance. More blue = more different overall color distribution.</p>
          </section>

          <section>
            <h3>Controls</h3>
            <ul>
              <li><strong>Zoom</strong> — Scale all panels (10%-500%). Use +/- for 10% steps.</li>
              <li><strong>Tools</strong> — Toggle the editing panel (Brush, Eraser, Clone, Select).</li>
              <li><strong>Inspection Grid</strong> — Shows a zoomed 13x13 pixel window around the cursor with RGBA values and per-pixel diff.</li>
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

  const handleModeChange = (mode: string) => {
    setComparisonMode(mode);
  };

  const handleSubModeChange = (mode: string) => {
    setPixelSubMode(mode);
  };

  const handleToleranceChange = (val: number) => {
    setToleranceValue(val);
  };

  const handleTransparencyChange = (val: number) => {
    setTransparencyValue(val);
  };

  return (
    <>
      <header>
        <div className="header-bar">
          <span className="app-title">Image Compare Pro</span>
          <div className="header-divider" />
          <div className="tool-controls">
            <div className="comparison-controls">
              <div className="main-controls">
                <div className="control-group">
                  <label htmlFor="comparisonMode">Mode</label>
                  <select
                    id="comparisonMode"
                    value={comparisonMode}
                    onChange={(e) => handleModeChange(e.target.value)}
                  >
                    <option value="pixel">Pixel Diff</option>
                    <option value="structural">Edge Diff</option>
                    <option value="histogram">Color Dist.</option>
                  </select>
                </div>

                {comparisonMode === 'pixel' && (
                  <div className="control-group">
                    <label htmlFor="pixelSubMode">Method</label>
                    <select
                      id="pixelSubMode"
                      value={pixelSubMode}
                      onChange={(e) => handleSubModeChange(e.target.value)}
                    >
                      <option value="tolerance">Threshold</option>
                      <option value="range">Heatmap</option>
                      <option value="blend">Overlay</option>
                    </select>
                  </div>
                )}

                {comparisonMode === 'pixel' && pixelSubMode === 'tolerance' && (
                  <div className="control-group">
                    <label htmlFor="toleranceSlider">Tolerance</label>
                    <button className="zoom-step-btn" onClick={() => handleToleranceChange(Math.max(0, toleranceValue - 1))}>-</button>
                    <input
                      type="range"
                      id="toleranceSlider"
                      min="0"
                      max="100"
                      value={toleranceValue}
                      onChange={(e) => handleToleranceChange(parseInt(e.target.value))}
                    />
                    <button className="zoom-step-btn" onClick={() => handleToleranceChange(Math.min(100, toleranceValue + 1))}>+</button>
                    <span className="range-value">{toleranceValue}</span>
                  </div>
                )}

                {comparisonMode === 'pixel' && pixelSubMode === 'blend' && (
                  <div className="control-group">
                    <label htmlFor="transparencySlider">Opacity</label>
                    <input
                      type="range"
                      id="transparencySlider"
                      min="0"
                      max="100"
                      value={transparencyValue}
                      onChange={(e) => handleTransparencyChange(parseInt(e.target.value))}
                    />
                    <span className="range-value">{transparencyValue}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="header-divider" />

            <div className="zoom-control">
              <label htmlFor="zoomSlider">Zoom</label>
              <button className="zoom-step-btn" onClick={() => updateState({ zoomFactor: Math.max(0.1, zoomFactor - 0.1) })}>-</button>
              <input
                type="range"
                id="zoomSlider"
                min="10"
                max="500"
                step="5"
                value={Math.round(zoomFactor * 100)}
                onChange={handleZoom}
              />
              <button className="zoom-step-btn" onClick={() => updateState({ zoomFactor: Math.min(5, zoomFactor + 0.1) })}>+</button>
              <span className="range-value">{Math.round(zoomFactor * 100)}%</span>
            </div>

            <div className="header-divider" />

            <button className="tools-expand-btn" onClick={onToggleTools}>
              {toolsVisible ? 'Tools ▸' : 'Tools ◂'}
            </button>

            <button className="help-btn" onClick={() => setShowHelp(true)} title="Help">?</button>
          </div>
        </div>
      </header>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  );
}
