import { configureStore } from '@reduxjs/toolkit';
import { Hex } from 'honeycomb-grid';

import colorReducer from './state/colorSlice';
import hexGridReducer from './state/hexGridSlice';

const store = configureStore({
  reducer: {
    color: colorReducer,
    hexGrid: hexGridReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Scale JS value https://gist.github.com/fpillet/993002
function scaleNumericValue(fromValue: number, fromRange: [number, number], toRange: [number, number]): number {
  const scalingFactor = (fromRange[1] - fromRange[0]) / (toRange[1] - toRange[0]);
  const valueInRange = Math.min(fromRange[1], Math.max(fromRange[0], fromValue)) - fromRange[0];
  return Math.round(scalingFactor * valueInRange + toRange[0]);
}

export const selectIsCenter = (state: RootState, hex: Hex<any>): boolean => {
  return hex.x === state.hexGrid.centerCoord.x
    && hex.y === state.hexGrid.centerCoord.y;
};

export const selectScaledHue = (state: RootState, hex: Hex<any>): number => {
  // Q = 0 to the maximum number of columns
  return scaleNumericValue(
    hex.q,
    [0, state.hexGrid.grid.width],
    [state.color.hue - 36, state.color.hue + 36]);
};

export const selectScaledSaturation = (state: RootState, hex: Hex<any>): number => {
  // S = negative number of rows to positive number of rows
  const percentage = scaleNumericValue(
    hex.s,
    [-state.hexGrid.grid.height, state.hexGrid.grid.height],
    [state.color.saturation - 10, state.color.saturation + 10]);

  return Math.max(0, Math.min(100, percentage));
};

export const selectScaledLightness = (state: RootState, hex: Hex<any>): number => {
  // R = negative number of rows to positive number of rows
  // Map this in reverse
  const percentage = scaleNumericValue(
    hex.r,
    [-state.hexGrid.grid.height, state.hexGrid.grid.height],
    [state.color.lightness + 10, state.color.lightness - 10]);

  return Math.max(0, Math.min(100, percentage));
};
