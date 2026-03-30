import { useAppStore } from '../store/useAppStore';

interface EditingToolsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
  onApply: () => void;
  visible: boolean;
  onCollapse: () => void;
}

const tools = [
  { id: 'brushTool', label: 'Brush', icon: '🖌' },
  { id: 'eraserTool', label: 'Eraser', icon: '⌫' },
  { id: 'cloneTool', label: 'Clone', icon: '⎘' },
  { id: 'selectTool', label: 'Select', icon: '⬚' },
];

export default function EditingTools({ onUndo, onRedo, onReset, onSave, onApply, visible, onCollapse }: EditingToolsProps) {
  const selectedTool = useAppStore((s) => s.selectedTool);
  const brushSize = useAppStore((s) => s.brushSize);
  const color = useAppStore((s) => s.color);
  const activeCanvas = useAppStore((s) => s.activeCanvas);
  const historyIndex = useAppStore((s) => s.historyIndex);
  const redoStack = useAppStore((s) => s.redoStack);
  const updateState = useAppStore((s) => s.updateState);

  const hasActiveCanvas = activeCanvas !== null;

  if (!visible) return null;

  return (
    <div className="editing-tools">
      <div className="editing-tools-header" onClick={onCollapse}>
        <span className="editing-tools-title">Tools</span>
        <button className="collapse-toggle" aria-label="Collapse tools panel">▸</button>
      </div>
      <div className="editing-tools-body">
        <div className="tool-buttons">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-btn${selectedTool === tool.id ? ' active' : ''}`}
              onClick={() => updateState({ selectedTool: tool.id })}
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
        <div className="tool-options">
          <div className="option-row">
            <label htmlFor="brushSize">Size</label>
            <input
              type="range"
              id="brushSize"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => updateState({ brushSize: parseInt(e.target.value) })}
            />
            <span className="range-value">{brushSize}</span>
          </div>
          <div className="option-row">
            <label htmlFor="colorPicker">Color</label>
            <input
              type="color"
              id="colorPicker"
              value={color}
              onChange={(e) => updateState({ color: e.target.value })}
            />
          </div>
        </div>
        <div className="edit-actions">
          <div className="action-row">
            <button id="undoBtn" onClick={onUndo} disabled={historyIndex <= 0} title="Undo">↶</button>
            <button id="redoBtn" onClick={onRedo} disabled={redoStack.length === 0} title="Redo">↷</button>
          </div>
          <button id="resetBtn" onClick={onReset} disabled={!hasActiveCanvas}>Reset</button>
          <button id="saveBtn" onClick={onSave} disabled={!hasActiveCanvas}>Save Image</button>
          <button id="applyBtn" onClick={onApply} disabled={!hasActiveCanvas}>Apply Changes</button>
        </div>
      </div>
    </div>
  );
}
