// Scale JS value https://gist.github.com/fpillet/993002
function scaleValue(value, from, to) {
	const scale = (to[1] - to[0]) / (from[1] - from[0]);
	const capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
	return Math.round(capped * scale + to[0]);
}

function scaleColorValue(value, absVariance, curDimension, minDimension, maxDimension) {
  return scaleValue(curDimension, [minDimension, maxDimension], [value - absVariance, value + absVariance]);
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, value));
}

function Cell(props) {
  // Use cube coords to map color values - scale everything by up to 10% in either direction
  // Q = 0 to the maximum number of columns
  // R, S = -number of rows to positive number of rows
  const hue = scaleColorValue(props.color.hue, 36, props.hex.q, 0, props.grid.cellColumns);
  const saturation = clampPercentage(scaleColorValue(props.color.saturation, 10, props.hex.s, -props.grid.cellRows, props.grid.cellRows));
  const lightness = clampPercentage(scaleColorValue(props.color.lightness, -10, props.hex.r, -props.grid.cellRows, props.grid.cellRows));
  const fill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // Change the stroke based on whether this is the "central" hex
  let strokeWidth = 1;
  let strokeOpacity = 0.15;

  if (props.hex.x + 1 === Math.round(props.grid.cellColumns / 2) && props.hex.y + 1 === Math.round(props.grid.cellRows / 2)) {
    strokeWidth = 10;
    strokeOpacity = 1;
  }

  // Use x/y coords to translate the polygon
  const {x, y} = props.hex.toPoint();
  const transform = `translate(${x}, ${y})`;

  return (
    <g
      transform={transform}
    >
      <polygon
        points={props.points}
        fill={fill}
        stroke={fill}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
      />
      {/* <text
        fill="#fff"
        textAnchor="middle"
        x="60"
        y="60"
      >
        {props.hex.q}, {props.hex.r}, {props.hex.s}
      </text> */}
   </g> 
  );
}

export default Cell;