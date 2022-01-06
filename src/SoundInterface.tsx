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
  const [currentVolume, setCurrentVolume] = useState(10);
  const [currentReverbIntensity, setCurrentReverbIntensity] = useState(0);
  const [currentLfoIntensity, setCurrentLfoIntensity] = useState(50);
  const [currentLfoFrequency, setCurrentLfoFrequency] = useState(15);

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

  // Prevent mousedown/touchstart events in this area from starting panning
  const panInterceptor = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>): void => {
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

  const volumeSliderChanged = (event: React.FormEvent<HTMLInputElement>): void => {
    const wholeVolume = parseInt((event.target as HTMLInputElement).value, 10);

    setCurrentVolume(wholeVolume)
    soundManager.current.changeVolume(wholeVolume / 100);
  };

  const reverbIntensityChanged = (event: React.FormEvent<HTMLInputElement>): void => {
    const wholeIntensity = parseInt((event.target as HTMLInputElement).value, 10);

    setCurrentReverbIntensity(wholeIntensity)
    soundManager.current.changeReverbIntensity(wholeIntensity / 100);
  };

  const lfoIntensityChanged = (event: React.FormEvent<HTMLInputElement>): void => {
    const wholeIntensity = parseInt((event.target as HTMLInputElement).value, 10);

    setCurrentLfoIntensity(wholeIntensity)
    soundManager.current.changeLfoIntensity(wholeIntensity / 100);
  };

  const lfoFrequencyChanged = (event: React.FormEvent<HTMLInputElement>): void => {
    const wholeFrequency = parseInt((event.target as HTMLInputElement).value, 10);

    setCurrentLfoFrequency(wholeFrequency)
    soundManager.current.changeLfoFrequency(wholeFrequency);
  };

  return (
    <div
      id="audioPanel"
      onMouseDown={panInterceptor}
      onTouchStart={panInterceptor}
    >
      <button
        type="button"
        id="audioToggle"
        onClick={playButtonClicked}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <div>
        <label htmlFor="audioVolume">
          Volume
        </label>
        <input
          type="range"
          id="audioVolume"
          min="0"
          max="100"
          step="1"
          value={currentVolume}
          onInput={volumeSliderChanged}
        />
      </div>
      <div>
        <label htmlFor="audioReverb">
          Reverb
        </label>
        <input
          type="range"
          id="audioReverb"
          min="0"
          max="100"
          step="1"
          value={currentReverbIntensity}
          onInput={reverbIntensityChanged}
        />
      </div>
      <fieldset>
        <legend>
          LFO
        </legend>
        <div>
          <label htmlFor="audioLfoIntensity">
            Intensity
          </label>
          <input
            type="range"
            id="audioLfoIntensity"
            min="0"
            max="100"
            step="1"
            value={currentLfoIntensity}
            onInput={lfoIntensityChanged}
          />
        </div>
        <div>
          <label htmlFor="audioLfoFrequency">
            Frequency
          </label>
          <input
            type="range"
            id="audioLfoFrequency"
            min="1"
            max="30"
            step="1"
            value={currentLfoFrequency}
            onInput={lfoFrequencyChanged}
          />
        </div>
      </fieldset>
    </div>
  );
}

export default SoundInterface;
