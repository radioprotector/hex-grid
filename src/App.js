import { extendHex, defineGrid } from 'honeycomb-grid'
import React from 'react';
import Cell from './Cell';

function clampPercentage(value) {
  return Math.min(100, Math.max(0, value));
}

function getGridForScreen() {
  const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  const minDimension = Math.min(screenWidth, screenHeight);

  // Map the smallest dimension to a hex size
  let size = 72;

  if (minDimension <= 600) {
    size = 36;
  }
  else if (minDimension <= 768) {
    size = 48;
  }
  else if (minDimension <= 1024) {
    size = 60;
  }

  // Construct the hex/grid factories
  const hexFactory = extendHex({
    orientation: 'flat',
    size: size,
    offset: 1
  });

  const gridFactory = defineGrid(hexFactory);
  
  // Calculate the correct number of columns and rows using flat-topped coordinates:
  // https://www.redblobgames.com/grids/hexagons/#basics
  // Cell columns: the screen width / 0.75 cell width, plus one for overlap
  // Cell rows: the screen height / cell height, plus two for the top and bottom edges
  const cellHeight = size * Math.sqrt(3);
  const cellWidth = size * 2;
  const cellColumns = Math.floor(screenWidth / (cellWidth * 0.75)) + 2;
  const cellRows = Math.floor(screenHeight / cellHeight) + 2;

  console.debug(`Calculated grid dimensions`, {
    screenWidth,
    screenHeight,
    size,
    cellColumns,
    cellRows,
  });

  return {
    hexFactory,
    gridFactory,
    size,
    screenWidth,
    screenHeight,
    cellColumns,
    cellRows,
    cellWidth,
    cellHeight
  }
}

function hexToKey(hex) {
  // Use the QRS cubic coordinates to map this
  return `${hex.q}~${hex.r}~${hex.s}`;
}

class App extends React.Component {
  constructor(props) {
    super(props);

    const gridParams = getGridForScreen();

    this.state = {
      color: {
        hue: 300,
        saturation: 50,
        lightness: 35
      },
      cells: gridParams.gridFactory.rectangle({
        width: gridParams.cellColumns,
        height: gridParams.cellRows
      }),
      gridParams
    };

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
    // Redraw the grid for the screen
    const newGridParams = getGridForScreen();
    const newCells = newGridParams.gridFactory.rectangle({
      width: newGridParams.cellColumns,
      height: newGridParams.cellRows
    });

    this.setState(prevState => ({
      gridParams: newGridParams,
      cells: newCells
    }));
  }

  handleKey(event) {
    // Numpad left/right and arrow left/right control hue
    // Numpad up/down and arrow up/down control saturation    
    // Plus and minus control luminance

    switch(event.code) {
      case 'Numpad8':
      case 'ArrowUp':
        this.setState(prevState => {
          return {
            color: {
              hue: prevState.color.hue,
              saturation: clampPercentage(prevState.color.saturation + 1),
              lightness: prevState.color.lightness
            }
          };
        });
        break;

      case 'Numpad2':
      case 'ArrowDown':
        this.setState(prevState => {
          return {
            color: {
              hue: prevState.color.hue,
              saturation: clampPercentage(prevState.color.saturation - 1),
              lightness: prevState.color.lightness
            }
          };
        });
        break;

      case 'Numpad6':
      case 'ArrowRight':
        this.setState(prevState => {
          return {
            color: {
              hue: (prevState.color.hue + 1) % 360,
              saturation: prevState.color.saturation,
              lightness: prevState.color.lightness
            }
          };
        });
        break;

      case 'Numpad4':
      case 'ArrowLeft':
        this.setState(prevState => {
          return {
            color: {
              hue: (prevState.color.hue - 1) % 360,
              saturation: prevState.color.saturation,
              lightness: prevState.color.lightness
            }
          };
        });
        break;

      case 'NumpadAdd':
      case 'Equal':
        this.setState(prevState => {
          return {
            color: {
              hue: prevState.color.hue,
              saturation: prevState.color.saturation,
              lightness: clampPercentage(prevState.color.lightness + 1)
            }
          };
        });
        break;

      case 'NumpadSubtract':
      case 'Minus':
        this.setState(prevState => {
          return {
            color: {
              hue: prevState.color.hue,
              saturation: prevState.color.saturation,
              lightness: clampPercentage(prevState.color.lightness - 1)
            }
          };
        });
        break;

      default:
        // no-op
    }
  }

  render() {
    // Map the corners of a sample hexagon to the equivalent SVG polygonal points.
    const pointString = this.state.gridParams.hexFactory().corners()
      .map(({x, y}) => {
        return `${x}, ${y}`;
      })
      .join(' ');

    // // Determine the range of the cubic coordinates to use
    // const minExtents = this.state.gridParams.hexFactory().toCube({
    //   x: this.state.gridParams.cellColumns,
    //   y: 0
    // })

    // const maxExtents = this.state.gridParams.hexFactory().toCube({
    //   x: 0,
    //   y: this.state.gridParams.cellRows
    // });

    // console.debug('extents', minExtents, maxExtents);

    // Map each cell to a discrete component.
    const cellElements = this.state.cells.map((hex) => {
      return <Cell
        key={hexToKey(hex)}
        points={pointString}
        // minExtents={minExtents}
        // maxExtents={maxExtents}
        hex={hex}
        color={this.state.color}
        grid={this.state.gridParams}
      />
    });

    const style = {
      width: this.state.gridParams.screenWidth + this.state.gridParams.cellWidth,
      height: this.state.gridParams.screenHeight + this.state.gridParams.cellHeight,
      marginLeft: -(this.state.gridParams.cellWidth / 2),
      marginTop: -(this.state.gridParams.cellHeight / 2)
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

export default App;
