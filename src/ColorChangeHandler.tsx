import React from 'react';
import { connect } from 'react-redux';

import { RootState } from './store';

interface ColorProps {
  baseHue: number,
  baseSaturation: number,
  baseLightness: number
}

class ColorChangeHandler extends React.Component<ColorProps> {
  render() {
    const colorString = `hsl(${this.props.baseHue}, ${this.props.baseSaturation}%, ${this.props.baseLightness}%)`;

    // Update the theme-color meta tag to match our main color
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colorString);

    // Create a dummy canvas
    const canvasElem = document.createElement('canvas') as HTMLCanvasElement;
    canvasElem.setAttribute('width', '64px');
    canvasElem.setAttribute('height', '64px');

    const ctx = canvasElem.getContext('2d', { alpha: true, desynchronized: true });
    
    if (ctx) {
      const region = new Path2D();
      region.moveTo(16, 8);
      region.lineTo(48, 8);
      region.lineTo(60, 32);
      region.lineTo(48, 56);
      region.lineTo(16, 56);
      region.lineTo(4, 32);
      region.closePath();

      ctx.fillStyle = colorString;
      ctx.fill(region);

      const iconUrl = canvasElem.toDataURL('image/png');
      document.querySelector('link[rel="icon"]')?.setAttribute('href', iconUrl);
    }

    canvasElem.remove();

    return null;
  }
}

function mapStateToProps(state: RootState): ColorProps {
  return {
    baseHue: state.color.hue,
    baseSaturation: state.color.saturation,
    baseLightness: state.color.lightness,
  }
}

export default connect(mapStateToProps, null)(ColorChangeHandler);

