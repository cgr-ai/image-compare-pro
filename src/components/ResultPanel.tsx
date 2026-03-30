import InspectionGrid, { InspectionGridHandle } from './InspectionGrid';

interface ResultPanelProps {
  resultCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  resultViewRef: React.RefObject<HTMLDivElement | null>;
  inspectionRef: React.RefObject<InspectionGridHandle | null>;
  onSaveResult: () => void;
}

export default function ResultPanel({
  resultCanvasRef,
  resultViewRef,
  inspectionRef,
  onSaveResult,
}: ResultPanelProps) {
  return (
    <div className="bottom-row flex justify-center w-full flex-1 min-h-0 relative">
      <InspectionGrid ref={inspectionRef} />
      <div className="w-[calc(50%-0.25rem)] shrink-0 flex flex-col border border-slate-700 rounded-md overflow-hidden bg-slate-800 shadow-sm">
        <div className="panel-header flex justify-between items-center px-2 py-0.5 border-b border-slate-700 min-h-[30px] bg-gradient-to-b from-slate-800 to-slate-900/80 text-xs">
          <h3 className="text-[0.8rem] font-semibold text-slate-400 uppercase tracking-wider m-0">Comparison</h3>
          <button className="bg-slate-700 hover:bg-slate-600 text-slate-50 text-[0.7rem] px-2 py-0.5 rounded border border-slate-600 cursor-pointer" onClick={onSaveResult}>Save Result</button>
        </div>
        <div className="result-view flex-1 h-full overflow-auto relative flex justify-start items-start bg-slate-900 cursor-default" ref={resultViewRef}>
          <canvas ref={resultCanvasRef} className="block relative origin-top-left" />
        </div>
      </div>
    </div>
  );
}
