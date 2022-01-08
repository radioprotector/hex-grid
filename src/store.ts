import { configureStore } from '@reduxjs/toolkit';

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

/**
 * Scales a numeric value from one range to another.
 * @param fromValue The source value to scale.
 * @param fromRange The minimum/maximum expected range of the source value.
 * @param toRange The minimum/maximum range of the destination value.
 * @returns The resulting scaled value.
 */
export function scaleNumericValue(fromValue: number, fromRange: [number, number], toRange: [number, number]): number {
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
export function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}
