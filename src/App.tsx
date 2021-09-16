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
  constructor(props: PropsFromRedux) {
    super(props);

    // Proxy event handlers
    this.handleResize = this.handleResize.bind(this);
    this.handleKey = this.handleKey.bind(this);
  }

  componentDidMount(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKey);
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKey);
  }

  handleResize(): void {
    this.props.dispatch({ type: 'hexGrid/resize' });
  }

  handleKey(event: KeyboardEvent): void {
    // Numpad left/right and arrow left/right control hue
    // Numpad up/down and arrow up/down control saturation    
    // Plus and minus control luminance
    switch(event.code) {
      case 'Numpad8':
      case 'ArrowUp':
        this.props.dispatch({ type: 'color/adjustSaturation', payload: 1 });
        break;

      case 'Numpad2':
      case 'ArrowDown':
        this.props.dispatch({ type: 'color/adjustSaturation', payload: -1 });
        break;

      case 'Numpad6':
      case 'ArrowRight':
        this.props.dispatch({ type: 'color/adjustHue', payload: 1 });
        break;

      case 'Numpad4':
      case 'ArrowLeft':
        this.props.dispatch({ type: 'color/adjustHue', payload: -1 });
        break;

      case 'NumpadAdd':
      case 'Equal':
        this.props.dispatch({ type: 'color/adjustLightness', payload: 1 });
        break;

      case 'NumpadSubtract':
      case 'Minus':
        this.props.dispatch({ type: 'color/adjustLightness', payload: -1 });
        break;

      default:
        // no-op
    }
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
