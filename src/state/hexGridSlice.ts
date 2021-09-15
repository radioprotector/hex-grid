import { createSlice } from "@reduxjs/toolkit";
import { defineGrid, extendHex, Grid, GridFactory, Hex, HexFactory, PointLike } from "honeycomb-grid";

/**
 * THe arguments used to customize the hex factory and propagated throughout the stack.
 */
export interface HexArgs {
  orientation: 'flat',
  size: number,
  offset: number
}

export interface Size {
  width: number,
  height: number
}

export interface HexGridState {
  screen: Size,
  grid: Size,
  cell: Size,
  cellSize: number,
  cellPointsString: string,
  centerCoord: PointLike
}

/**
 * Gets a string of points suitable for use in defining each SVG hexagon.
 */
function getCornerPointsString(hexFactory: HexFactory<HexArgs>): string {
  return hexFactory()
    .corners()
    .map(({x, y}) => `${x}, ${y}`)
    .join(' ');
}

/**
 * Gets the state to use for the current grid screen.
 */
function getStateForScreen(): HexGridState {
  // Determine the available width/height and use that to determine the constraining direction
  const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  const minDimension = Math.min(screenWidth, screenHeight);

  // Map the smallest dimension to a hex size
  let cellSize = 72;

  if (minDimension <= 768) {
    cellSize = 48;
  }
  else if (minDimension <= 1024) {
    cellSize = 60;
  }

  // Construct a hex factory just so we can get the corner string
  const hexFactory = extendHex({
    orientation: 'flat',
    size: cellSize,
    offset: 1
  });
  
  // Calculate the correct number of columns and rows using flat-topped coordinates:
  // https://www.redblobgames.com/grids/hexagons/#basics
  // Cell columns: the screen width / 0.75 cell width, plus two for overlap
  // Cell rows: the screen height / cell height, plus two for the top and bottom edges
  const cellHeight = cellSize * Math.sqrt(3);
  const cellWidth = cellSize * 2;
  const cellColumns = Math.floor(screenWidth / (cellWidth * 0.75)) + 2;
  const cellRows = Math.floor(screenHeight / cellHeight) + 2;

  // Calculate the center coordinate
  const centerCoord: PointLike = {
    x: Math.round(cellColumns / 2.0) - 1,
    y: Math.round(cellRows / 2.0) - 1
  };

  // Generate the state and log
  const state: HexGridState = {
    screen: {
      height: screenHeight,
      width: screenWidth
    },
    grid: {
      height: cellRows,
      width: cellColumns
    },
    cell: {
      height: cellHeight,
      width: cellWidth
    },
    cellPointsString: getCornerPointsString(hexFactory),
    cellSize,
    centerCoord
  }

  console.debug(`Calculated grid dimensions`, state.screen, state.grid, state.cell);
  return state;
}

export const hexGridSlice = createSlice({
  name: 'hexGrid',
  initialState: getStateForScreen(),
  reducers: {
    resize: (state) => {
      const newState = getStateForScreen();

      state.screen = newState.screen;
      state.grid = newState.grid;
      state.cell = newState.cell;
      state.cellPointsString = newState.cellPointsString;
      state.centerCoord = newState.centerCoord;
      state.cellSize = newState.cellSize;
    }
  }
});

export const { resize } = hexGridSlice.actions;
export default hexGridSlice.reducer;

export const selectGridHexes = (state: HexGridState) => {
  // Construct the hex/grid factories
  const hexFactory = extendHex({
    orientation: 'flat',
    size: state.cellSize,
    offset: 1
  });

  const gridFactory = defineGrid(hexFactory);

  // Generate the equivalent hexes
  const gridHexes = gridFactory.rectangle({
    width: state.cell.width,
    height: state.cell.height
  });

  // Extract the center item from the list and put it at the end so it gets SVG rendering priority
  const centerIndex = gridHexes.indexOf(state.centerCoord);

  if (centerIndex !== -1) {
    const centerHex = gridHexes.splice(centerIndex, 1)[0];
    gridHexes.push(centerHex);
  }

  return gridHexes;
}