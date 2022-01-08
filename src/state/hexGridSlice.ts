import { createSlice } from "@reduxjs/toolkit";
import { defineGrid, extendHex, HexFactory, PointLike, CubeCoordinates } from "honeycomb-grid";

/**
 * The arguments used to customize the hex factory and propagated throughout the stack.
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

/**
 * Describes the scaling factors that are used for different color components.
 */
export interface ColorScaling {
  /**
   * The scaling factor used for the hue component.
   */
  hue: number,

  /**
   * The scaling factor used for the saturation component.
   */
  saturation: number,

  /**
   * The scaling factor used for the lightness component.
   */
  lightness: number
}

export interface HexGridState {
  /**
   * The current screen dimensions.
   */
  screenDimensions: Size,

  /**
   * The grid dimensions.
   */
  gridDimensions: Size,

  /**
   * The dimensions of each cell in the grid.
   */
  cellDimensions: Size,
  
  /**
   * The string of points to use when rendering each SVG hexagon in the grid.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/points}
   */
  cellPointsString: string, // XXX: Good memoization candidate if it can be easily shared across all Cell component instances

  /**
   * The base size used for each hexagon in the grid.
   * This represents the distance from the center of the hex to each corner.
   * @see {@link https://www.redblobgames.com/grids/hexagons/#size-and-spacing}
   */
  baseHexSize: number,

  /**
   * The Cartesian coordinates for the hex at the center of the grid.
   */
  centerCoord: PointLike, // XXX: Good memoization candidate if it can be easily shared across all Cell component instances (and the Grid component)

  /**
   * The cubic coordinates for the hex at the center of the grid.
   */
  centerCoordCube: CubeCoordinates, // XXX: Good memoization candidate if it can be easily shared across all Cell component instances (and the Grid component)

  /**
   * The scaling to use for display and panning.
   */
  colorScaling: ColorScaling
}

/**
 * Gets a hex factory for the specified hex size.
 * @param baseHexSize The base hex size.
 * @returns The corresponding hex factory.
 */
function getHexFactory(baseHexSize: number): HexFactory<HexArgs> {
  return extendHex({
    orientation: 'flat',
    size: baseHexSize,
    offset: -1
  });
}

/**
 * Gets a string of points suitable for use in defining each SVG hexagon.
 * @param hexFactory The configured hex factory used for the grid.
 * @returns The resulting SVG points string.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/points}
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
  // HACK: Define viewport height while we're at it
  // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  
  // Determine the available width/height and use that to determine the constraining direction
  const screenWidth = window.innerWidth || document.documentElement.clientWidth;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight;
  const minDimension = Math.min(screenWidth, screenHeight);

  // Map the smallest dimension to a hex size
  let baseHexSize = 72;

  if (minDimension <= 640) {
    baseHexSize = 36;
  }
  else if (minDimension <= 768) {
    baseHexSize = 48;
  }
  else if (minDimension <= 1024) {
    baseHexSize = 60;
  }

  // Construct a hex factory so we can get the corner string and calculate coordinates for the center
  const hexFactory = getHexFactory(baseHexSize);
  
  // Calculate the correct number of columns and rows using flat-topped coordinates:
  // https://www.redblobgames.com/grids/hexagons/#basics
  // Cell columns: the screen width / 0.75 cell width, plus two for offsets/the right edge
  // Cell rows: the screen height / cell height, plus three for offsets/the bottom edge (Mobile landscape is the cause for the third)
  const cellHeight = baseHexSize * Math.sqrt(3);
  const cellWidth = baseHexSize * 2;
  const cellColumns = Math.floor(screenWidth / (cellWidth * 0.75)) + 2;
  const cellRows = Math.floor(screenHeight / cellHeight) + 3;

  // Calculate the center coordinate in both Cartesian and cubic formats
  const centerCoord: PointLike = {
    x: Math.floor(cellColumns / 2.0),
    y: Math.floor(cellRows / 2.0)
  };

  const centerCoordCube = hexFactory(centerCoord).cube();

  // Calculate the scaling factors
  const colorScaling: ColorScaling = {
    hue: 6,
    lightness: 3,
    saturation: 4
  };

  // Generate the state and log
  const state: HexGridState = {
    screenDimensions: {
      height: screenHeight,
      width: screenWidth
    },
    gridDimensions: {
      height: cellRows,
      width: cellColumns
    },
    cellDimensions: {
      height: cellHeight,
      width: cellWidth
    },
    cellPointsString: getCornerPointsString(hexFactory),
    baseHexSize,
    centerCoord,
    centerCoordCube,
    colorScaling
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug(`Calculated dimensions`, { screen: state.screenDimensions, grid: state.gridDimensions, cell: state.cellDimensions });
  }
  
  return state;
}

export const hexGridSlice = createSlice({
  name: 'hexGrid',
  initialState: getStateForScreen(),
  reducers: {
    resize: (state) => {
      const newState = getStateForScreen();

      state.screenDimensions = newState.screenDimensions;
      state.gridDimensions = newState.gridDimensions;
      state.cellDimensions = newState.cellDimensions;
      state.cellPointsString = newState.cellPointsString;
      state.centerCoord = newState.centerCoord;
      state.baseHexSize = newState.baseHexSize;
    }
  }
});

export const { resize } = hexGridSlice.actions;
export default hexGridSlice.reducer;

/**
 * Generates a hex grid using the specified dimensions, center hex coordinate, and size of each hex.
 * @param gridDimensions The grid dimensions to use.
 * @param centerCoord The coordinate of the center hex element.
 * @param baseHexSize The base size, in pixels, of each hexagon.
 * @returns A hex grid. The "center" hex element will be the last item in the collection.
 */
export const selectGridHexes = (gridDimensions: Size, centerCoord: PointLike, baseHexSize: number) => {
  // Construct the hex/grid factories
  const hexFactory = getHexFactory(baseHexSize);

  const gridFactory = defineGrid(hexFactory);

  // Generate the equivalent hexes
  const gridHexes = gridFactory.rectangle({
    width: gridDimensions.width,
    height: gridDimensions.height
  });

  // Extract the center item from the list and put it at the end so it gets SVG rendering priority
  const centerIndex = gridHexes.indexOf(centerCoord);

  if (centerIndex !== -1) {
    const centerHex = gridHexes.splice(centerIndex, 1)[0];
    gridHexes.push(centerHex);
  }

  return gridHexes;
}