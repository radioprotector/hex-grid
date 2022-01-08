import { useMemo } from 'react';
import { Hex } from 'honeycomb-grid';

import { clamp } from '../store';
import { useAppSelector } from '../hooks';

function Cell(props: { hex: Hex<any> }): JSX.Element {
  // const gridDimensions = useAppSelector((state) => state.hexGrid.gridDimensions);
  // const cellDimensions = useAppSelector((state) => state.hexGrid.cellDimensions); // Only used for debugging
  const centerCoord = useAppSelector((state) => state.hexGrid.centerCoord);
  const centerCoordCube = useAppSelector((state) => state.hexGrid.centerCoordCube);
  const pointString = useAppSelector((state) => state.hexGrid.cellPointsString);
  const colorScaling = useAppSelector((state)  => state.hexGrid.colorScaling);
  const baseHue = useAppSelector((state) => state.color.hue);
  const baseSaturation = useAppSelector((state) => state.color.saturation);
  const baseLightness = useAppSelector((state) => state.color.lightness); 

  // Scale hue along the cubic "q" dimension (upper-left to lower-right)
  const scaledHue = useMemo(() => {
    return clamp(baseHue - (colorScaling.hue * (props.hex.q - centerCoordCube.q)), 0, 360);
  }, [baseHue, colorScaling, centerCoordCube, props.hex]);

  // Scale saturation along the cubic "s" dimension (up to down)
  const scaledSaturation = useMemo(() => {
    return clamp(baseSaturation + (colorScaling.saturation * (props.hex.s - centerCoordCube.s)), 0, 100);
  }, [baseSaturation, colorScaling, centerCoordCube, props.hex]);

  // Scale lightness along the cubic "r" dimension in reverse (lower-left to upper-right)
  const scaledLightness = useMemo(() => {
    return clamp(baseLightness - (colorScaling.lightness * (props.hex.r - centerCoordCube.r)), 0, 100);
  }, [baseLightness, colorScaling, centerCoordCube, props.hex]);

  const scaledColorString = useMemo(() => {
    return `hsl(${scaledHue}, ${scaledSaturation}%, ${scaledLightness}%)`;
  }, [scaledHue, scaledSaturation, scaledLightness]);

  let stroke = scaledColorString;

  // Change the stroke based on whether this is the "central" hex
  let strokeWidth = 1;
  let strokeOpacity = 0.15;

  if (props.hex.equals(centerCoord)) {
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
      {/* Only include debugging information in dev builds */}
      {/* {process.env.NODE_ENV !== 'production'
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
        </text>} */}
    </g> 
  );
}

export default Cell;
