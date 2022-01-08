
import './DebugDialog.css';
import { useAppSelector } from '../hooks';

function DebugDialog(): JSX.Element {
  const mainHue = useAppSelector((state) => state.color.hue);
  const mainSaturation = useAppSelector((state) => state.color.saturation);
  const mainLightness = useAppSelector((state) => state.color.lightness);
  const screenDimensions = useAppSelector((state) => state.hexGrid.screenDimensions);
  const gridDimensions = useAppSelector((state) => state.hexGrid.gridDimensions);
  const centerCoord = useAppSelector((state) => state.hexGrid.centerCoord);
  const centerCoordCube = useAppSelector((state) => state.hexGrid.centerCoordCube);
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
        <dd>
          Cart: ({centerCoord.x},{centerCoord.y})<br />
          Cube: ({centerCoordCube.q},{centerCoordCube.r},{centerCoordCube.s})
        </dd>
        <dt>Color</dt>
        <dd>({mainHue},{mainSaturation}%,{mainLightness}%)</dd>
      </dl>
    </div>
  );
}

export default DebugDialog;
