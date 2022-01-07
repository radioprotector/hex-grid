
import './DebugDialog.css';
import { useAppSelector } from '../hooks';

function DebugDialog(): JSX.Element {
  const screenDimensions = useAppSelector((state) => state.hexGrid.screenDimensions);
  const gridDimensions = useAppSelector((state) => state.hexGrid.gridDimensions);
  const centerCoord = useAppSelector((state) => state.hexGrid.centerCoord);
  const fontScale = parseFloat(window.getComputedStyle(document.body).fontSize) / 16.0;
  const pixelRatio = window.devicePixelRatio;

  return (
    <div
      id="debugState"
    >
      <dl>
        <dt>Screen</dt>
        <dd>{screenDimensions.width}x{screenDimensions.height}</dd>
        <dt>Font/DPR</dt>
        <dd>{fontScale.toFixed(2)}/{pixelRatio.toFixed(2)}</dd>
        <dt>Grid</dt>
        <dd>{gridDimensions.width}x{gridDimensions.height}</dd>
        <dt>Center</dt>
        <dd>({centerCoord.x},{centerCoord.y})</dd>
      </dl>
    </div>
  );
}

export default DebugDialog;
