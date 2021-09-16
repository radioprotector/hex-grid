import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { Hex } from 'honeycomb-grid';
import { RootState } from './store';
import { selectGridHexes } from './state/hexGridSlice';
import Cell from './Cell';

/**
 * Generates a key for the provided hex element.
 * @param hex The hex element.
 * @returns The key for the hex.
 */
function hexToKey(hex: Hex<any>): string {
  // Use the QRS cubic coordinates to map this
  return `${hex.q}~${hex.r}~${hex.s}`;
}

class App extends React.Component<PropsFromRedux> {

  /**
   * Tracks whether or not the application is currently panning.
   */
  private isPanning: boolean = false;

  /**
   * The x-coordinate at which panning was last applied.
   */
  private lastPannedClientX: number = 0;

  /**
   * The y-coordinate at which panning was last applied.
   */
  private lastPannedClientY: number = 0;

  constructor(props: PropsFromRedux) {
    super(props);

    // Proxy event handlers
    this.handleResize = this.handleResize.bind(this);
    this.handleKey = this.handleKey.bind(this);
    this.handlePanStart = this.handlePanStart.bind(this);
    this.handlePanMove = this.handlePanMove.bind(this);
    this.handlePanEnd = this.handlePanEnd.bind(this);
  }

  componentDidMount(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKey);

    // Handle both touch/mouse events for panning
    window.addEventListener('touchstart', this.handlePanStart);
    window.addEventListener('mousedown', this.handlePanStart);

    window.addEventListener('touchmove', this.handlePanMove);
    window.addEventListener('mousemove', this.handlePanMove);

    window.addEventListener('touchend', this.handlePanEnd);
    window.addEventListener('touchcancel', this.handlePanEnd);
    window.addEventListener('mouseup', this.handlePanEnd);
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKey);

    // Handle both touch/mouse events for panning
    window.removeEventListener('touchstart', this.handlePanStart);
    window.removeEventListener('mousedown', this.handlePanStart);

    window.removeEventListener('touchmove', this.handlePanMove);
    window.removeEventListener('mousemove', this.handlePanMove);

    window.removeEventListener('touchend', this.handlePanEnd);
    window.removeEventListener('touchcancel', this.handlePanEnd);
    window.removeEventListener('mouseup', this.handlePanEnd);
  }

  handleResize(): void {
    this.isPanning = false;
    this.props.dispatch({ type: 'hexGrid/resize' });
  }

  handleKey(event: KeyboardEvent): void {
    // Numpad left/right and arrow left/right control hue
    // Numpad up/down and arrow up/down control saturation    
    // Plus and minus control luminance
    const scaleFactor = 1;

    switch(event.code) {
      case 'Numpad8':
      case 'ArrowUp':
        this.props.dispatch({ type: 'color/adjustSaturation', payload: scaleFactor });
        break;

      case 'Numpad2':
      case 'ArrowDown':
        this.props.dispatch({ type: 'color/adjustSaturation', payload: -scaleFactor });
        break;

      case 'Numpad6':
      case 'ArrowRight':
        this.props.dispatch({ type: 'color/adjustHue', payload: scaleFactor });
        break;

      case 'Numpad4':
      case 'ArrowLeft':
        this.props.dispatch({ type: 'color/adjustHue', payload: -scaleFactor });
        break;

      case 'NumpadAdd':
      case 'Equal':
        this.props.dispatch({ type: 'color/adjustLightness', payload: scaleFactor });
        break;

      case 'NumpadSubtract':
      case 'Minus':
        this.props.dispatch({ type: 'color/adjustLightness', payload: -scaleFactor });
        break;

      default:
        // no-op
    }
  }

  handlePanStart(event: TouchEvent | MouseEvent): void {
    // Skip when we're already panning
    if (this.isPanning) {
      return;
    }

    // Switch based on whether this is a touch or mouse event
    if (event.type === 'touchstart') {
      const touchEvent = event as TouchEvent;

      // Don't do anything with multi-touch
      if (touchEvent.touches.length !== 1) {
        return;
      }

      this.isPanning = true;
      this.lastPannedClientX = touchEvent.touches[0].clientX;
      this.lastPannedClientY = touchEvent.touches[0].clientY;
    }
    else if (event.type === 'mousedown') {
      const mouseEvent = event as MouseEvent;

      this.isPanning = true;
      this.lastPannedClientX = mouseEvent.clientX;
      this.lastPannedClientY = mouseEvent.clientY;
    }

    if (this.isPanning) {
      console.log(`pan start: (${this.lastPannedClientX}, ${this.lastPannedClientY})`);
    }
  }

  handlePanMove(event: TouchEvent | MouseEvent): void {
    // Make sure we're panning
    if (!this.isPanning) {
      return;
    }

    let currentClientX: number;
    let currentClientY: number;

    // Switch based on whether this is a touch or mouse event
    if (event.type === 'touchmove') {
      const touchEvent = event as TouchEvent;

      // Don't do anything with multi-touch
      if (touchEvent.touches.length !== 1) {
        return;
      }

      // Determine the "current" panning values to use
      currentClientX = touchEvent.touches[0].clientX;
      currentClientY = touchEvent.touches[0].clientY;
    }
    else if (event.type === 'mousemove') {
      const mouseEvent = event as MouseEvent;
      
      currentClientX = mouseEvent.clientX;
      currentClientY = mouseEvent.clientY;
    }
    else {
      return;
    }

    // Determine the distance between the click and our "last panned" value.
    // If it's larger than our base hex size, we want to shift one of the colors
    const scaleFactor = 6;
    const distanceX = currentClientX - this.lastPannedClientX;
    const distanceY = currentClientY - this.lastPannedClientY;
    const distanceTotal = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

    if (distanceTotal >= 2 * this.props.baseHexSize) {
      // When calculating atan2, invert the y-distance because HTML coordinates are in reverse
      const atan = Math.atan2(-distanceY / distanceTotal, distanceX / distanceTotal);
      let angle = atan * 180 / Math.PI;

      // Normalize the angle to 0-360 to simplify
      if (angle < 0) {
        angle += 360;
      }

      console.log(`pan threshold met (angle: ${angle})`);

      // Now map the different axes (assuming 6 "chunks")
      if (angle <= 60) {
        // Right and up - adjust lightness
        this.props.dispatch({ type: 'color/adjustLightness', payload: -scaleFactor });
      }
      else if (angle <= 120) {
        // Straight up - adjust saturation downward
        this.props.dispatch({ type: 'color/adjustSaturation', payload: -scaleFactor });
      }
      else if (angle <= 180) {
        // Left and up - adjust hue
        this.props.dispatch({ type: 'color/adjustHue', payload: scaleFactor });
      }
      else if (angle <= 240) {
        // Left and down - adjust lightness
        this.props.dispatch({ type: 'color/adjustLightness', payload: scaleFactor });
      }
      else if (angle <= 300) {
        // Straight down - adjust saturation upward
        this.props.dispatch({ type: 'color/adjustSaturation', payload: scaleFactor });
      }
      else {
        // Right and down - adjust hue
        this.props.dispatch({ type: 'color/adjustHue', payload: -scaleFactor });
      }

      // Update our "last panned" value
      this.lastPannedClientX = currentClientX;
      this.lastPannedClientY = currentClientY;
    }
  }

  handlePanEnd(): void {
    if (this.isPanning) {
      console.log('pan end');
    }

    this.isPanning = false;
  }

  render() {
    // Map each cell to a discrete component.
    const cellElements = selectGridHexes(this.props.gridDimensions, this.props.baseHexSize).map((hex) => {
      return <Cell
        key={hexToKey(hex)}
        hex={hex}
      />
    });

    const style = {
      width: this.props.screenDimensions.width + this.props.cellDimensions.width,
      height: this.props.screenDimensions.height + this.props.cellDimensions.height,
      marginLeft: -(this.props.cellDimensions.width / 2.0),
      marginTop: -(this.props.cellDimensions.height / 2.0),
      cursor: 'all-scroll'
    };

    return (
      <svg
        style={style}
      >
        {cellElements}
      </svg>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  screenDimensions: state.hexGrid.screenDimensions,
  gridDimensions: state.hexGrid.gridDimensions,
  cellDimensions: state.hexGrid.cellDimensions,
  baseHexSize: state.hexGrid.baseHexSize
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>
export default connector(App);
