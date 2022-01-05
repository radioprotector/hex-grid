import React, { useState, useRef, useEffect } from "react";
import { useAppSelector } from "./hooks";

import './SoundInterface.css';
import { SoundManager } from "./soundManager";

function SoundInterface(): JSX.Element {
  const mainHue = useAppSelector((state) => state.color.hue);
  const mainSaturation = useAppSelector((state) => state.color.saturation);
  const mainLightness = useAppSelector((state) => state.color.lightness);
  const soundManager = useRef(new SoundManager(mainHue, mainSaturation, mainLightness));
  const [isPlaying, setIsPlaying] = useState(false);

  // Cascade color changes to the sound manager
  useEffect(() => {
    soundManager.current.changeHue(mainHue);
  }, [mainHue]);

  useEffect(() => {
    soundManager.current.changeSaturation(mainSaturation);
  }, [mainSaturation]);

  useEffect(() => {
    soundManager.current.changeLightness(mainLightness);
  }, [mainLightness]);

  // Prevent mousedown/touchstart events on the button from starting panning
  const playButtonPanInterceptor = (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
  }

  const playButtonClicked = (event: React.MouseEvent<HTMLButtonElement>): boolean => {
    if (isPlaying) {
      soundManager.current.pause();
    }
    else {
      soundManager.current.play();
    }

    setIsPlaying(!isPlaying);

    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  return (
    <button
      type="button"
      id="audioToggle"
      onMouseDown={playButtonPanInterceptor}
      onTouchStart={playButtonPanInterceptor}
      onClick={playButtonClicked}
    >
      {isPlaying ? "Pause" : "Play"}
    </button>
  );
}

export default SoundInterface;
