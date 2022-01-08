import { useState, useEffect } from "react";

import { useAppDispatch } from "../hooks";

import './ColorCycler.css';

function ColorCycler(): JSX.Element {
  const dispatch = useAppDispatch();
  const [isCycling, setIsCycling] = useState(false);
  const CYCLE_FREQUENCY_MS = 200;

  // Periodically cycle through color changes
  useEffect(() => {
    if (!isCycling) {
      return;
    }

    // Create a cycler to call on an interval
    const cycler = () => {
      // Move hue by a fixed amount but cycle saturation up/down
      const timeSegment = (Date.now() / 30000) * 2 * Math.PI;
      // const hueMovement = Math.round(Math.sin(timeSegment) * 6);
      const hueMovement = 2;
      const saturationMovement = Math.round(Math.cos(timeSegment) * 2);

      dispatch({ type: 'color/adjustHue', payload: hueMovement });
      dispatch({ type: 'color/adjustSaturation', payload: saturationMovement });
    }

    const dispatchInterval = window.setInterval(cycler, CYCLE_FREQUENCY_MS);

    return () => {
      window.clearInterval(dispatchInterval);
    }
  }, [dispatch, isCycling]);

  // Prevent mousedown/touchstart events in this area from starting panning
  const panInterceptor = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  }

  const cycleButtonClicked = (event: React.MouseEvent<HTMLButtonElement>): boolean => {
    setIsCycling(!isCycling);

    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  return (
    <div
      id="cyclerPanel"
      onMouseDown={panInterceptor}
      onTouchStart={panInterceptor}
    >
      <button
        type="button"
        onClick={cycleButtonClicked}
      >
        <svg
          className="feather">
          <use href={process.env.PUBLIC_URL + '/assets/feather/feather-sprite.svg#' + ((isCycling) ? 'stop-circle' : 'play-circle')} />
        </svg>
        {isCycling ? "Stop Cycling" : "Start Cycling"}
      </button>
    </div>
  )
}

export default ColorCycler;
