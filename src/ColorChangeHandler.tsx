import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from './store';

class ColorChangeHandler extends React.Component<PropsFromRedux> {
  render() {
    const colorString = `hsl(${this.props.baseHue}, ${this.props.baseSaturation}%, ${this.props.baseLightness}%)`;

    // Update the theme-color meta tag to match our main color
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colorString);

    // Create a dummy canvas
    const canvasElem = document.createElement('canvas') as HTMLCanvasElement;
    canvasElem.setAttribute('width', '64px');
    canvasElem.setAttribute('height', '64px');

    // Try to get a 2D rendering context
    const ctx = canvasElem.getContext('2d', { alpha: true, desynchronized: true });
    
    if (ctx) {
      // Draw a hexagon with the color
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

      // Convert to a data URL and use it to generate the favicon
      const iconUrl = canvasElem.toDataURL('image/png');
      document.querySelector('link[rel="icon"]')?.setAttribute('href', iconUrl);
    }

    canvasElem.remove();

    return null;
  }
}

const mapStateToProps = (state: RootState) => ({
  baseHue: state.color.hue,
  baseSaturation: state.color.saturation,
  baseLightness: state.color.lightness,
});

// HACK: We don't need dispatch here but passing mapDispatchToProps=null will break the typings generation
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>
export default connector(ColorChangeHandler);
