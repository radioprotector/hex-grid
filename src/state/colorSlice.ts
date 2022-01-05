import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ColorState {
  hue: number,
  saturation: number,
  lightness: number
}

const initialState: ColorState = {
  hue: 300,
  saturation: 50,
  lightness: 40
};

export const colorSlice = createSlice({
  name: 'color',
  initialState,
  reducers: {
    adjustHue: (state, action: PayloadAction<number>) => {
      state.hue = (state.hue + action.payload) % 360;
    },
    adjustSaturation: (state, action: PayloadAction<number>) => {
      state.saturation = Math.min(100, Math.max(0, state.saturation + action.payload));
    },
    adjustLightness: (state, action: PayloadAction<number>) => {
      state.lightness = Math.min(100, Math.max(0, state.lightness + action.payload));
    }
  }
});

export const { adjustHue, adjustSaturation, adjustLightness } = colorSlice.actions;
export default colorSlice.reducer;
