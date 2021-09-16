import { configureStore } from '@reduxjs/toolkit';
import { Hex, PointLike } from 'honeycomb-grid';

import colorReducer from './state/colorSlice';
import hexGridReducer, { Size } from './state/hexGridSlice';

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

export const selectIsCenter = (centerHex: PointLike, hex: Hex<any>): boolean => {
  return hex.x === centerHex.x
    && hex.y === centerHex.y;
};

export const selectScaledHue = (baseHue: number, gridDimensions: Size, hex: Hex<any>): number => {
  // Q = 0 to the maximum number of columns
  return scaleNumericValue(
    hex.q,
    [0, gridDimensions.width],
    [baseHue - 36, baseHue + 36]);
};

export const selectScaledSaturation = (baseSaturation: number, gridDimensions: Size, hex: Hex<any>): number => {
  // S = negative number of rows to positive number of rows
  const percentage = scaleNumericValue(
    hex.s,
    [-gridDimensions.height, gridDimensions.height],
    [baseSaturation - 10, baseSaturation + 10]);

  return Math.max(0, Math.min(100, percentage));
};

export const selectScaledLightness = (baseLightness: number, gridDimensions: Size, hex: Hex<any>): number => {
  // R = negative number of rows to positive number of rows
  // Map this in reverse
  const percentage = scaleNumericValue(
    hex.r,
    [-gridDimensions.height, gridDimensions.height],
    [baseLightness + 10, baseLightness - 10]);

  return Math.max(0, Math.min(100, percentage));
};
