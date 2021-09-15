import React from 'react';
import { connect } from 'react-redux';

import { selectScaledHue, selectScaledSaturation, selectScaledLightness, selectIsCenter } from './store';


class Cell extends React.Component {
  render() {
    const scaledHue = selectScaledHue(this.props.baseHue, this.props.gridDimensions, this.props.hex);
    const scaledSaturation = selectScaledSaturation(this.props.baseSaturation, this.props.gridDimensions, this.props.hex);
    const scaledLightness = selectScaledLightness(this.props.baseLightness, this.props.gridDimensions, this.props.hex);
    const fill = `hsl(${scaledHue}, ${scaledSaturation}%, ${scaledLightness}%)`;
    let stroke = fill;

    // Change the stroke based on whether this is the "central" hex
    let strokeWidth = 1;
    let strokeOpacity = 0.15;

    if (selectIsCenter(this.props.centerHex, this.props.hex)) {
      strokeWidth = 2;
      strokeOpacity = 0.5;
      stroke = 'black';
    }

    // Use x/y coords to translate the polygon
    const {x, y} = this.props.hex.toPoint();
    const transform = `translate(${x}, ${y})`;

    return (
      <g
        transform={transform}
      >
        <polygon
          points={this.props.pointString}
          fill={fill}
          stroke={stroke}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
        />
        {/* <text
          fill="#fff"
          textAnchor="middle"
          x="60"
          y="60"
        >
          {this.props.hex.q}, {this.props.hex.r}, {this.props.hex.s}
        </text> */}
      </g> 
    );
  }
}

function mapStateToProps(state) {
  return {
    pointString: state.hexGrid.cellPointsString,
    gridDimensions: state.hexGrid.gridDimensions,
    centerHex: state.hexGrid.centerCoord,
    baseHue: state.color.hue,
    baseSaturation: state.color.saturation,
    baseLightness: state.color.lightness,
  }
}

export default connect(mapStateToProps, null)(Cell);