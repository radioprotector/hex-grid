import React, { useState, useRef, useEffect } from "react";
import { useAppSelector } from "./hooks";

import './SoundInterface.css';
import { SoundManager } from "./soundManager";

function SoundInterface(): JSX.Element {
  const mainHue = useAppSelector((state) => state.color.hue);
  const mainSaturation = useAppSelector((state) => state.color.saturation);
  const mainLightness = useAppSelector((state) => state.color.lightness);
  const soundManager = useRef(new SoundManager(mainHue, mainSaturation, mainLightness));

  const [isInterfaceExpanded, setInterfaceExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(10);
  const [currentReverbIntensity, setCurrentReverbIntensity] = useState(0);
  const [currentLfoIntensity, setCurrentLfoIntensity] = useState(25);
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

  const panelButtonClicked = (event: React.MouseEvent<HTMLButtonElement>): boolean => {
    setInterfaceExpanded(!isInterfaceExpanded);

    event.preventDefault();
    event.stopPropagation();
    return false;
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
      className={mainLightness <= 30 ? 'dark-contrast' : 'light-contrast'}
      onMouseDown={panInterceptor}
      onTouchStart={panInterceptor}
    >     
      {/* We want the audio toggle to always be visible, but play/pause can be hidden. */}
      <div
        className="settingBlock"
      >
        {isInterfaceExpanded &&
          <button
            type="button"
            onClick={playButtonClicked}
          >
            <svg
              className="feather">
              <use href={process.env.PUBLIC_URL + '/assets/feather/feather-sprite.svg#' + ((isPlaying) ? 'pause' : 'play')} />
            </svg>
            {isPlaying ? "Pause" : "Play"}
          </button>
        }

        <button
          type="button"
          onClick={panelButtonClicked}
        >
          <svg
            className="feather">
            <use href={process.env.PUBLIC_URL + '/assets/feather/feather-sprite.svg#' + ((isInterfaceExpanded) ? 'minimize-2' : 'maximize-2')} />
          </svg>
          {isInterfaceExpanded ? "Hide Audio" : "Show Audio"}
        </button>
      </div>
      {/* Start collapsible settings block */}
      {isInterfaceExpanded &&
      <div>
        <div
          className="settingBlock"
        >
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
        <div
          className="settingBlock"
        >
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
        <div
          className="settingBlock"
        >
          <label htmlFor="audioLfoIntensity">
            LFO Intensity
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
        <div
          className="settingBlock"
        >
          <label htmlFor="audioLfoFrequency">
            LFO Frequency
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
      </div>}
      {/* End of collapsible settings block */}
    </div>
  );
}

export default SoundInterface;
