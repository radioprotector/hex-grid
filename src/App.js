import React from 'react';
import { connect } from 'react-redux';

import Cell from './Cell';
import { selectGridHexes } from './state/hexGridSlice';

function hexToKey(hex) {
  // Use the QRS cubic coordinates to map this
  return `${hex.q}~${hex.r}~${hex.s}`;
}

class App extends React.Component {
  constructor(props) {
    super(props);

    // Proxy event handlers
    this.handleResize = this.handleResize.bind(this);
    this.handleKey = this.handleKey.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKey);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKey);
  }

  handleResize() {
    this.props.dispatch({ type: 'hexGrid/resize' });
  }

  handleKey(event) {
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

function mapStateToProps(state) {
  return {
    screenDimensions: state.hexGrid.screenDimensions,
    gridDimensions: state.hexGrid.gridDimensions,
    cellDimensions: state.hexGrid.cellDimensions,
    baseHexSize: state.hexGrid.baseHexSize
  }
}

export default connect(mapStateToProps)(App);
