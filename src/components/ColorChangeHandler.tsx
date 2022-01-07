import { useEffect } from 'react';

import { useAppSelector } from '../hooks';

function ColorChangeHandler(): null {
  const mainHue = useAppSelector((state) => state.color.hue);
  const mainSaturation = useAppSelector((state) => state.color.saturation);
  const mainLightness = useAppSelector((state) => state.color.lightness);

  useEffect(() => {
    // Convert the color into the equivalent HSL CSS declaration
    const colorString = `hsl(${mainHue}, ${mainSaturation}%, ${mainLightness}%)`;

    // Update the theme-color meta tag to match our main color
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colorString);

    // Create a dummy canvas
    const canvasElem = document.createElement('canvas') as HTMLCanvasElement;
    canvasElem.setAttribute('width', '64px');
    canvasElem.setAttribute('height', '64px');

    // Try to get a 2D rendering context
    const ctx = canvasElem.getContext('2d', { alpha: true, desynchronized: true });
    
    if (ctx) {
      // Draw a hexagon with the color
      const region = new Path2D();
      region.moveTo(16, 8);
      region.lineTo(48, 8);
      region.lineTo(60, 32);
      region.lineTo(48, 56);
      region.lineTo(16, 56);
      region.lineTo(4, 32);
      region.closePath();

      ctx.fillStyle = colorString;
      ctx.fill(region);

      // Convert to a data URL and use it to generate the favicon
      const iconUrl = canvasElem.toDataURL('image/png');
      document.querySelector('link[rel="icon"]')?.setAttribute('href', iconUrl);
    }

    canvasElem.remove();
  }, [mainHue, mainSaturation, mainLightness]);

  return null;
}

export default ColorChangeHandler;
