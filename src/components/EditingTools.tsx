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
    <div className="w-[180px] shrink-0 bg-slate-800 border border-slate-700 rounded-md overflow-hidden shadow-sm transition-[width] duration-250">
      <div
        className="flex items-center justify-between px-2 py-1 bg-gradient-to-b from-slate-800 to-slate-900/80 border-b border-slate-700 cursor-pointer select-none min-h-[30px] hover:from-slate-700 hover:to-slate-800/80"
        onClick={onCollapse}
      >
        <span className="text-[0.8rem] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap overflow-hidden">Tools</span>
        <button className="bg-transparent border-none text-slate-500 text-xs p-0 leading-none cursor-pointer shrink-0 hover:text-sky-400 hover:bg-transparent">▸</button>
      </div>
      <div className="p-2 overflow-hidden">
        <div className="grid grid-cols-2 gap-[3px]">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`text-center p-1 text-[0.7rem] flex flex-col items-center gap-px rounded border transition-all duration-150 cursor-pointer ${
                selectedTool === tool.id
                  ? 'bg-green-500/15 border-green-500 text-green-500 font-semibold'
                  : 'bg-white/[0.04] border-transparent hover:bg-white/[0.08] hover:border-slate-700 text-slate-200'
              }`}
              onClick={() => updateState({ selectedTool: tool.id })}
              title={tool.label}
            >
              <span className="text-sm leading-none">{tool.icon}</span>
              <span className="text-[0.7rem]">{tool.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <label className="text-[0.7rem] text-slate-500 min-w-[32px]">Size</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => updateState({ brushSize: parseInt(e.target.value) })}
            />
            <span className="text-[0.7rem] text-sky-400 font-mono min-w-[28px] text-right">{brushSize}</span>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[0.7rem] text-slate-500 min-w-[32px]">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => updateState({ color: e.target.value })}
              className="h-6 w-full p-px rounded border border-slate-700 bg-slate-900 cursor-pointer"
            />
          </div>
        </div>
        <div className="mt-2 border-t border-slate-700 pt-2 flex flex-col gap-[3px]">
          <div className="flex gap-[3px]">
            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onUndo} disabled={historyIndex <= 0} title="Undo">↶</button>
            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onRedo} disabled={redoStack.length === 0} title="Redo">↷</button>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" onClick={onReset} disabled={!hasActiveCanvas}>Reset</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" onClick={onSave} disabled={!hasActiveCanvas}>Save Image</button>
          <button className="bg-green-500 hover:bg-green-600 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border-none font-semibold disabled:opacity-40 disabled:cursor-not-allowed" onClick={onApply} disabled={!hasActiveCanvas}>Apply Changes</button>
        </div>
      </div>
    </div>
  );
}
