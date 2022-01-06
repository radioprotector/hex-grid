import { scaleNumericValue, clamp } from './store';

/**
 * Describes a collection of waveform-specific nodes, all of a particular type.
 */
interface WaveformNodes<NodeType extends AudioNode> {
  square: NodeType;
  
  sawtooth: NodeType;
  
  sine: NodeType;
}

/**
 * Creates a batch of waveform-specific oscillator nodes.
 * @param context The audio context to use.
 * @param semitones The number of semitones to detune the oscillators by. Optional.
 * @returns The resulting waveform-specific oscillator nodes.
 */
function createOscillators(context: AudioContext, semitones: number | undefined = undefined): WaveformNodes<OscillatorNode> {
  const square = new OscillatorNode(context, { type: 'square' });
  const sawtooth = new OscillatorNode(context, { type: 'sawtooth' });
  const sine = new OscillatorNode(context, { type: 'sine' });

  square.frequency.setValueAtTime(440, context.currentTime);
  sawtooth.frequency.setValueAtTime(440, context.currentTime);
  sine.frequency.setValueAtTime(440, context.currentTime);

  if (semitones !== undefined) {
    const centsPerSemitone = Math.pow(2, 1/12);

    square.detune.setValueAtTime(centsPerSemitone * semitones, context.currentTime);
    sawtooth.detune.setValueAtTime(centsPerSemitone * semitones, context.currentTime);
    sine.detune.setValueAtTime(centsPerSemitone * semitones, context.currentTime);
  }

  return {
    square,
    sawtooth,
    sine
  };
}

/**
 * Creates a batch of gain nodes for specific waveform oscillators.
 * @param context The audio context to use.
 * @param oscillators The waveform-specific oscillator nodes to use.
 * @returns The resulting oscillator-specific gain nodes.
 */
function createOscillatorGains(context: AudioContext, oscillators: WaveformNodes<OscillatorNode>): WaveformNodes<GainNode> {
  const square = new GainNode(context);
  const sawtooth = new GainNode(context);
  const sine = new GainNode(context);

  // Set the gain
  square.gain.setValueAtTime(1, context.currentTime);
  sawtooth.gain.setValueAtTime(1, context.currentTime);
  sine.gain.setValueAtTime(1, context.currentTime);

  // Wire the oscillators up to the corresponding gain nodes
  oscillators.square.connect(square);
  oscillators.sawtooth.connect(sawtooth);
  oscillators.sine.connect(sine);

  return {
    square,
    sawtooth,
    sine
  };
}

/**
 * Creates a merger for a collection of oscillator-specific gain nodes.
 * @param context The audio context to use.
 * @param oscillatorGains The oscillator-specific gain nodes to use.
 * @returns The resulting channel merger.
 */
function createOscillatorsMixer(context: AudioContext, oscillatorGains: WaveformNodes<GainNode>): ChannelMergerNode {
  const merger = new ChannelMergerNode(context, { numberOfInputs: 3, channelCount: 1 });

  // Wire the gain nodes for the oscillators into the merger
  oscillatorGains.square.connect(merger);
  oscillatorGains.sawtooth.connect(merger);
  oscillatorGains.sine.connect(merger);

  return merger;
}

export class SoundManager {

  constructor(
    private hue: number,
    private saturation: number,
    private lightness: number
  ) {
    // No body necessary
  } 

  /**
   * Tracks whether the overall audio processing structure has been initialized.
   */
  private structureInitialized: boolean = false;

  /**
   * The audio context to use.
   */
  private audioContext: AudioContext | null = null;

  /**
   * The oscillator nodes that are tuned to the base frequency.
   * Adjusted based on the lightness.
   */
  private baseFrequencyOscillators: OscillatorNode[] = [];

  /**
   * The oscillator nodes that are tuned to a major third of the base frequency.
   * Adjusted based on the lightness.
   */
  private thirdFrequencyOscillators: OscillatorNode[] = [];

  /**
   * The oscillator nodes that are tuned to a perfect fifth of the base frequency.
   * Adjusted based on the lightness.
   */
  private fifthFrequencyOscillators: OscillatorNode[] = [];

  /**
   * The gain nodes that control the output of all square oscillators.
   * Adjusted based on the hue.
   */
  private squareWaveformGains: GainNode[] = [];

  /**
   * The gain nodes that control the output of all sawtooth oscillators.
   * Adjusted based on the hue.
   */
  private sawWaveformGains: GainNode[] = [];

  /**
   * The gain nodes that control the output of all sine oscillators.
   * Adjusted based on the hue.
   */
  private sineWaveformGains: GainNode[] = [];

  /**
   * The gain nodes that control the output of the chord chains.
   * Adjusted based on the saturation.
   */
  private chordGains: GainNode[] = [];

  /**
   * The LFO oscillator node to use.
   */
  private lfoOscillatorNode: OscillatorNode | null = null;

  /**
   * The frequency that is used for the output volume.
   */
  private lfoFrequency: number = 15; // XXX: See if this can be better consolidated with the SoundInterface UI default

  /**
   * The gain node that controls the degree to which the LFO is "on".
   * Adjusted based on the LFO intensity.
   * Together with the lfoOffGainNode, should have an overall gain of 1.0.
   */
  private lfoOnGainNode: GainNode | null = null;

  /**
   * The gain node that controls the degree to which the LFO is "off".
   * Adjusted based on the LFO intensity.
   * Together with the lfoOnGainNode, should have an overall gain of 1.0.
   */
  private lfoOffGainNode: GainNode | null = null;

  /**
   * The gain level that is used for the LFO "on" gain node.
   * The LFO "off" gain node is 1.0 minus this value.
   */
  private overallLfoGain: number = 0.5; // XXX: See if this can be better consolidated with the SoundInterface UI default

  /**
   * The final gain node that is used to control output volume.
   */
  private overallVolumeGainNode: GainNode | null = null;

  /**
   * The gain level that is used for the output volume.
   */
  private overallVolumeGain: number = 0.1; // XXX: See if this can be better consolidated with the SoundInterface UI default

  private initializeAudioStructure(): void {
    // Don't do this more than once
    if (this.structureInitialized) {
      return;
    }

    if (this.audioContext === null) {
      this.audioContext = new AudioContext();
    }

    // Set up the base frequency chain
    const baseOscillators = createOscillators(this.audioContext);
    const baseOscillatorGains = createOscillatorGains(this.audioContext, baseOscillators);
    const baseOscillatorsMixer = createOscillatorsMixer(this.audioContext, baseOscillatorGains);
    const baseFrequencyGain = new GainNode(this.audioContext);
    baseOscillatorsMixer.connect(baseFrequencyGain);

    // Set up the third semitone frequency chain
    const thirdOscillators = createOscillators(this.audioContext, 4);
    const thirdOscillatorGains = createOscillatorGains(this.audioContext, thirdOscillators);
    const thirdOscillatorsMixer = createOscillatorsMixer(this.audioContext, thirdOscillatorGains);
    const thirdChordGain = new GainNode(this.audioContext);
    thirdOscillatorsMixer.connect(thirdChordGain);

    // Set up the fifth semitone frequency chain
    const fifthOscillators = createOscillators(this.audioContext, 7);
    const fifthOscillatorGains = createOscillatorGains(this.audioContext, fifthOscillators);
    const fifthOscillatorsMixer = createOscillatorsMixer(this.audioContext, fifthOscillatorGains);
    const fifthChordGain = new GainNode(this.audioContext);
    fifthOscillatorsMixer.connect(fifthChordGain);

    // Create an overall mixer between the base frequency and the chords
    const overallMixer = new ChannelMergerNode(this.audioContext, { numberOfInputs: 3, channelCount: 1 });
    baseFrequencyGain.connect(overallMixer);
    thirdChordGain.connect(overallMixer);
    fifthChordGain.connect(overallMixer);

    // Configure an optional LFO
    this.lfoOscillatorNode = new OscillatorNode(this.audioContext, { type: 'sine' });
    this.lfoOscillatorNode.frequency.setValueAtTime(this.lfoFrequency, this.audioContext.currentTime);

    this.lfoOnGainNode = new GainNode(this.audioContext);
    this.lfoOnGainNode.gain.setValueAtTime(this.overallLfoGain, this.audioContext.currentTime);
    this.lfoOscillatorNode.connect(this.lfoOnGainNode);

    const lfoBackupSource = new ConstantSourceNode(this.audioContext);
    this.lfoOffGainNode = new GainNode(this.audioContext);
    this.lfoOffGainNode.gain.setValueAtTime(1 - this.overallLfoGain, this.audioContext.currentTime);
    lfoBackupSource.connect(this.lfoOffGainNode);

    const lfoSourceMixer = new ChannelMergerNode(this.audioContext, { numberOfInputs: 2, channelCount: 1});
    this.lfoOnGainNode.connect(lfoSourceMixer);
    this.lfoOffGainNode.connect(lfoSourceMixer);

    // Connect the main audio chain to the gain *node*, and the mixed LFO output to its gain *level*
    const overallLfoGainNode = new GainNode(this.audioContext);
    lfoSourceMixer.connect(overallLfoGainNode.gain);
    overallMixer.connect(overallLfoGainNode);

    // Similarly, create the overall gain node so that we can control final volume
    this.overallVolumeGainNode = new GainNode(this.audioContext);
    this.overallVolumeGainNode.gain.setValueAtTime(this.overallVolumeGain, this.audioContext.currentTime);

    overallLfoGainNode.connect(this.overallVolumeGainNode);
    this.overallVolumeGainNode.connect(this.audioContext.destination);

    // Fill collections
    this.baseFrequencyOscillators.push(baseOscillators.square, baseOscillators.sawtooth, baseOscillators.sine);
    this.thirdFrequencyOscillators.push(thirdOscillators.square, thirdOscillators.sawtooth, thirdOscillators.sine);
    this.fifthFrequencyOscillators.push(fifthOscillators.square, fifthOscillators.sawtooth, fifthOscillators.sine);

    this.squareWaveformGains.push(baseOscillatorGains.square, thirdOscillatorGains.square, fifthOscillatorGains.square);
    this.sawWaveformGains.push(baseOscillatorGains.sawtooth, thirdOscillatorGains.sawtooth, fifthOscillatorGains.sawtooth);
    this.sineWaveformGains.push(baseOscillatorGains.sine, thirdOscillatorGains.sine, fifthOscillatorGains.sine);

    this.chordGains.push(thirdChordGain, fifthChordGain);

    // We're done!
    this.structureInitialized = true;
  }

  private cascadeHueToAudioNodes(): void {
    // Don't do anything if we don't have an audio context yet
    if (this.audioContext === null) {
      return;
    }

    const SCALE_UP: [number, number] = [0.0, 1.0];
    const SCALE_DOWN: [number, number] = [1.0, 0.0];
    const PURE_RED = 0;
    const PURE_YELLOW = 60;
    const PURE_GREEN = 120;
    const PURE_CYAN = 180;
    const PURE_BLUE = 240;
    const PURE_MAGENTA = 300;
    const PURE_RED_WRAP = 360;

    let redSquareComponent = 0;
    let blueSineComponent = 0;
    let greenSawComponent = 0;

    // If this is perfectly divisible by 120, we're 100% in either red/green/blue.
    // Similarly, if we're otherwise divisible by 60, we're at a 50/50 blend.
    if (this.hue % 120 === 0) {
      switch (this.hue) {
        case PURE_GREEN:
          greenSawComponent = 1;
          break;

        case PURE_BLUE:
          blueSineComponent = 1;
          break;

        case PURE_RED:
        case PURE_RED_WRAP:
          redSquareComponent = 1;
          break;
      }
    }
    else if (this.hue % 60 === 0) {
      switch (this.hue) {
        case PURE_YELLOW:
          redSquareComponent = 0.5;
          greenSawComponent = 0.5;
          break;

        case PURE_CYAN:
          greenSawComponent = 0.5;
          blueSineComponent = 0.5;
          break;

        case PURE_MAGENTA:
          blueSineComponent = 0.5;
          redSquareComponent = 0.5;
          break;
      }
    }
    else {
      // It's time to do this the hard way.
      if (this.hue < PURE_GREEN) {
        // Scale down from pure red and up to pure green
        redSquareComponent = scaleNumericValue(this.hue, [PURE_RED, PURE_GREEN], SCALE_DOWN);
        greenSawComponent = scaleNumericValue(this.hue, [PURE_RED, PURE_GREEN], SCALE_UP);
      }
      else if (this.hue < PURE_BLUE) {
        // Scale down from pure green and up to pure blue
        greenSawComponent = scaleNumericValue(this.hue, [PURE_GREEN, PURE_BLUE], SCALE_DOWN);
        blueSineComponent = scaleNumericValue(this.hue, [PURE_GREEN, PURE_BLUE], SCALE_UP);
      }
      else if (this.hue < PURE_RED_WRAP) {
        // Scale down from pure blue and up to pure red
        blueSineComponent = scaleNumericValue(this.hue, [PURE_BLUE, PURE_RED_WRAP], SCALE_DOWN);
        redSquareComponent = scaleNumericValue(this.hue, [PURE_BLUE, PURE_RED_WRAP], SCALE_UP);
      }
    }

    // Cascade the components to the relevant nodes
    this.squareWaveformGains.forEach((node) => {
      node.gain.setValueAtTime(redSquareComponent, this.audioContext!.currentTime);
    });

    this.sawWaveformGains.forEach((node) => {
      node.gain.setValueAtTime(greenSawComponent, this.audioContext!.currentTime);
    });
    
    this.sineWaveformGains.forEach((node) => {
      node.gain.setValueAtTime(blueSineComponent, this.audioContext!.currentTime);
    });
  }

  private cascadeSaturationToAudioNodes(): void {
    // Don't do anything if we don't have an audio context yet
    if (this.audioContext === null) {
      return;
    }

    // Apply the saturation as a gain value to all chord nodes
    const chordGains = clamp(this.saturation, 0, 100) / 100.0;

    this.chordGains.forEach((node) => {
      node.gain.setValueAtTime(chordGains, this.audioContext!.currentTime);
    });
  }

  private cascadeLightnessToAudioNodes(): void {
    // Don't do anything if we don't have an audio context yet
    if (this.audioContext === null) {
      return;
    }

    // Apply the frequency value to all oscillator nodes
    // Use a 2%-per-semitone scale to avoid the really aggravating frequencies
    const semitoneDistance = scaleNumericValue(clamp(this.lightness, 0, 100), [0, 100], [-25, 25]);
    const frequency = Math.pow(2, semitoneDistance/12) * 440;

    this.baseFrequencyOscillators.forEach((node) => {
      node.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);
    });

    this.thirdFrequencyOscillators.forEach((node) => {
      node.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);
    });
    
    this.fifthFrequencyOscillators.forEach((node) => {
      node.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);
    });
  }

  /**
   * Begins playing audio.
   */
  public play(): void {
    if (this.audioContext === null) {
      this.audioContext = new AudioContext();
      this.initializeAudioStructure();

      this.cascadeHueToAudioNodes();
      this.cascadeLightnessToAudioNodes();
      this.cascadeSaturationToAudioNodes();

      this.baseFrequencyOscillators.forEach((osc) => {
        osc.start();
      });

      this.thirdFrequencyOscillators.forEach((osc) => {
        osc.start();
      });

      this.fifthFrequencyOscillators.forEach((osc) => {
        osc.start();
      });

      if (this.lfoOscillatorNode) {
        this.lfoOscillatorNode.start();
      }
    }

    this.audioContext.resume();
  }

  /**
   * Pauses playing audio.
   */
  public pause(): void {
    if (this.audioContext !== null) {
      this.audioContext.suspend();
    }
  }

  /**
   * Updates the audio qualities based on the provided hue.
   * @param hue The hue to use.
   */
  public changeHue(hue: number): void {
    this.hue = hue % 360;
    this.cascadeHueToAudioNodes();
  }

  /**
   * Updates the audio qualities based on the provided saturation.
   * @param saturation The saturation to use.
   */
  public changeSaturation(saturation: number): void {
    this.saturation = saturation;
    this.cascadeSaturationToAudioNodes();
  }

  /**
   * Updates the audio qualities based on the provided lightness.
   * @param lightness The lightness to use.
   */
  public changeLightness(lightness: number): void {
    this.lightness = lightness;
    this.cascadeLightnessToAudioNodes();
  }

  /**
   * Changes the audio volume.
   * @param volume The new output volume, on a 0.0-1.0 scale.
   */
  public changeVolume(volume: number): void {
    this.overallVolumeGain = clamp(volume, 0.0, 1.0);

    // Don't do anything else if we don't have audio in place yet
    if (this.audioContext === null || this.overallVolumeGainNode === null || !this.structureInitialized) {
      return;
    }

    this.overallVolumeGainNode.gain.setValueAtTime(this.overallVolumeGain, this.audioContext.currentTime);
  }

  /**
   * Changes the LFO intensity.
   * @param intensity The LFO intensity, on a 0.0-1.0 scale.
   */
  public changeLfoIntensity(intensity: number) {
    this.overallLfoGain = clamp(intensity, 0.0, 1.0);

    // Don't do anything else if we don't have audio in place yet
    if (this.audioContext === null || this.lfoOnGainNode === null || this.lfoOffGainNode === null || !this.structureInitialized) {
      return;
    }

    this.lfoOnGainNode.gain.setValueAtTime(this.overallLfoGain, this.audioContext.currentTime);
    this.lfoOffGainNode.gain.setValueAtTime(1 - this.overallLfoGain, this.audioContext.currentTime);
  }

  /**
   * Changes the LFO frequency.
   * @param frequency The LFO frequency, on a 1-30Hz scale.
   */
  public changeLfoFrequency(frequency: number) {
    this.lfoFrequency = clamp(frequency, 1, 30);

    // Don't do anything else if we don't have audio in place yet
    if (this.audioContext === null || this.lfoOscillatorNode === null || !this.structureInitialized) {
      return;
    }

    this.lfoOscillatorNode.frequency.setValueAtTime(this.lfoFrequency, this.audioContext.currentTime);
  }
}
