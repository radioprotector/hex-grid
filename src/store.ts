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

/**
 * Scales a numeric value from one range to another.
 * @param fromValue The source value to scale.
 * @param fromRange The minimum/maximum expected range of the source value.
 * @param toRange The minimum/maximum range of the destination value.
 * @returns The resulting scaled value.
 */
function scaleNumericValue(fromValue: number, fromRange: [number, number], toRange: [number, number]): number {
  const scalingFactor = (toRange[1] - toRange[0]) / (fromRange[1] - fromRange[0]);
  const valueInRange = Math.min(fromRange[1], Math.max(fromRange[0], fromValue)) - fromRange[0];

  return toRange[0] + (valueInRange * scalingFactor);
}

/**
 * Clamps a numeric value into a specific range.
 * @param value The value to clamp.
 * @param minimum The minimum value in the range.
 * @param maximum The maximum value in the range.
 * @returns The clamped value.
 */
function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

/**
 * Determines whether the specified hex refers to the hex at the center.
 * @param centerHex The center hex.
 * @param hex The hex to check.
 * @returns True if the two refer to the same coordinates; otherwise, false.
 */
export const selectIsCenter = (centerHex: PointLike, hex: Hex<any>): boolean => {
  return hex.x === centerHex.x
    && hex.y === centerHex.y;
};

/**
 * Determines a scaled hue value based on the provided hex position relative to the entire grid.
 * @param baseHue The base hue value to scale.
 * @param gridDimensions The maximum extent of the grid.
 * @param hex The hex coordinates to use for scaling the color.
 * @returns A scaled hue value.
 */
export const selectScaledHue = (baseHue: number, gridDimensions: Size, hex: Hex<any>): number => {
  // Q = 0 to the maximum number of columns
  return Math.round(scaleNumericValue(
    hex.q,
    [0, gridDimensions.width],
    [baseHue - 72, baseHue + 72]));
};

/**
 * Determines a scaled saturation value based on the provided hex position relative to the entire grid.
 * @param baseSaturation The base saturation value to scale.
 * @param gridDimensions The maximum extent of the grid.
 * @param hex The hex coordinates to use for scaling the color.
 * @returns A scaled saturation value.
 */
export const selectScaledSaturation = (baseSaturation: number, gridDimensions: Size, hex: Hex<any>): number => {
  // S = negative number of rows to positive number of rows
  const percentage = scaleNumericValue(
    hex.s,
    [-gridDimensions.height, gridDimensions.height],
    [baseSaturation - 15, baseSaturation + 15]);

  return Math.round(clamp(percentage, 0, 100));
};

/**
 * Determines a scaled lightness value based on the provided hex position relative to the entire grid.
 * @param baseLightness The base lightness value to scale.
 * @param gridDimensions The maximum extent of the grid.
 * @param hex The hex coordinates to use for scaling the color.
 * @returns A scaled lightness value.
 */
export const selectScaledLightness = (baseLightness: number, gridDimensions: Size, hex: Hex<any>): number => {
  // R = negative number of rows to positive number of rows
  // Map this in reverse
  const percentage = scaleNumericValue(
    hex.r,
    [-gridDimensions.height, gridDimensions.height],
    [baseLightness + 15, baseLightness - 15]);

  return Math.round(clamp(percentage, 0, 100));
};
