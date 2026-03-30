import { useCallback, useRef } from 'react';
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
  onCompare: () => void;
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
  onCompare,
}: HeaderProps) {
  const zoomFactor = useAppStore((s) => s.zoomFactor);
  const updateState = useAppStore((s) => s.updateState);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleZoom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const zoom = parseInt(e.target.value);
      updateState({ zoomFactor: zoom / 100 });
    },
    [updateState]
  );

  const handleModeChange = (mode: string) => {
    setComparisonMode(mode);
    onCompare();
  };

  const handleSubModeChange = (mode: string) => {
    setPixelSubMode(mode);
    onCompare();
  };

  const handleToleranceChange = (val: number) => {
    setToleranceValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(onCompare, 50);
  };

  const handleTransparencyChange = (val: number) => {
    setTransparencyValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(onCompare, 50);
  };

  return (
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
                  <input
                    type="range"
                    id="toleranceSlider"
                    min="0"
                    max="100"
                    value={toleranceValue}
                    onChange={(e) => handleToleranceChange(parseInt(e.target.value))}
                  />
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
            <input
              type="range"
              id="zoomSlider"
              min="10"
              max="500"
              value={Math.round(zoomFactor * 100)}
              onChange={handleZoom}
            />
            <span className="range-value">{Math.round(zoomFactor * 100)}%</span>
          </div>
        </div>
      </div>
    </header>
  );
}
