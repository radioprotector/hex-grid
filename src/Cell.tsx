import { useMemo } from 'react';

import { Hex } from 'honeycomb-grid';
import { selectScaledHue, selectScaledSaturation, selectScaledLightness, selectIsCenter } from './store';
import { useAppSelector } from './hooks';

function Cell(props: { hex: Hex<any> }): JSX.Element {
  const gridDimensions = useAppSelector((state) => state.hexGrid.gridDimensions);
  const cellDimensions = useAppSelector((state) => state.hexGrid.cellDimensions);
  const centerHexCoord = useAppSelector((state) => state.hexGrid.centerCoord);
  const pointString = useAppSelector((state) => state.hexGrid.cellPointsString);
  const baseHue = useAppSelector((state) => state.color.hue);
  const baseSaturation = useAppSelector((state) => state.color.saturation);
  const baseLightness = useAppSelector((state) => state.color.lightness); 

  const scaledHue = useMemo(() => {
    return selectScaledHue(baseHue, gridDimensions, props.hex)
  }, [baseHue, gridDimensions, props.hex]);

  const scaledSaturation = useMemo(() => {
    return selectScaledSaturation(baseSaturation, gridDimensions, props.hex)
  }, [baseSaturation, gridDimensions, props.hex]);

  const scaledLightness = useMemo(() => {
    return selectScaledLightness(baseLightness, gridDimensions, props.hex)
  }, [baseLightness, gridDimensions, props.hex]);

  const scaledColorString = useMemo(() => {
    return `hsl(${scaledHue}, ${scaledSaturation}%, ${scaledLightness}%)`;
  }, [scaledHue, scaledSaturation, scaledLightness]);

  let stroke = scaledColorString;

  // Change the stroke based on whether this is the "central" hex
  let strokeWidth = 1;
  let strokeOpacity = 0.15;

  if (selectIsCenter(centerHexCoord, props.hex)) {
    strokeWidth = 2;
    strokeOpacity = 0.5;
    stroke = 'black';
  }

  // Use x/y coords to translate the polygon
  const {x, y} = props.hex.toPoint();
  const transform = `translate(${x}, ${y})`;

  return (
    <g
      transform={transform}
    >
      <polygon
        points={pointString}
        fill={scaledColorString}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
      />
      {/* Only include debugging information in dev builds */
        process.env.NODE_ENV !== 'production'
        &&
        <text
          fill="#fff"
          x={cellDimensions.width / 2}
          y={cellDimensions.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          textLength={cellDimensions.width * 0.66}
        >
          {props.hex.q}, {props.hex.r}, {props.hex.s}
        </text>}
    </g> 
  );
}

export default Cell;
