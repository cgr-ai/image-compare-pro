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
    <div className="bottom-row">
      <InspectionGrid ref={inspectionRef} />
      <div className="image-panel result-panel">
        <div className="panel-header">
          <h3>Comparison</h3>
          <button onClick={onSaveResult}>Save Result</button>
        </div>
        <div className="result-view" ref={resultViewRef}>
          <canvas ref={resultCanvasRef} />
        </div>
      </div>
      <div className="bottom-spacer" />
    </div>
  );
}
