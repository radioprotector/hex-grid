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
 * Describes the chain of audio nodes for implementing output at a specific frequency.
 */
interface FrequencyOscillatorChain {
  /**
   * The waveform-specific oscillator nodes.
   * The frequencies are adjusted based on the lightness.
   */
  oscillators: WaveformNodes<OscillatorNode>;

  /**
   * The waveform-specific gain nodes.
   * The gains are adjusted based on the hue.
   */
  oscillatorGains: WaveformNodes<GainNode>;

  /**
   * The final output node.
   * For chord frequencies, the gain is adjusted based on the saturation.
   */
  output: GainNode;
}

/**
 * Describes the chain of audio nodes for implementing a variable LFO.
 */
interface LfoChain {
  /**
   * The waveform oscillator.
   */
  oscillator: OscillatorNode;

  /**
   * The gain node used to weight how much the LFO is "on".
   * Together with the constantGain, should have a total gain of 1.0.
   */
  oscillatorGain: GainNode;

  /**
   * The gain node used to weight how much the LFO is "off".
   * Together with the oscillatorGain, should have a total gain of 1.0.
   */
  constantGain: GainNode;

  /**
   * The final output node whose gain is varied based on the LFO.
   */
  lfoOutput: GainNode;
}

/**
 * Describes the chain of audio nodes for implementing a variable reverb.
 */
interface ReverbChain {
  /**
   * The convolver node for applying reverb.
   */
  reverbConvolver: ConvolverNode;

  /**
   * The gain node used to weight how much the reverb is "on".
   * Together with the dryGain, should have a total gain of 1.0.
   */
  wetGain: GainNode;

  /**
   * The gain node used to weight how much the reverb is "off".
   * Together with the wetGain, should have a total gain of 1.0.
   */
  dryGain: GainNode;

  /**
   * The final output node combining both "wet" and "dry" signals.
   */
  reverbOutput: ChannelMergerNode;
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

/**
 * Creates an oscillator structure for one output frequency, culminating in a final gain node.
 * @param context The audio context to use.
 * @param semitones The number of semitones to detune the oscillators by. Optional.
 * @returns The resulting oscillator structure.
 */
function createOscillatorStructure(context: AudioContext, semitones: number | undefined = undefined): FrequencyOscillatorChain {
  const oscillators = createOscillators(context, semitones);
  const oscillatorGains = createOscillatorGains(context, oscillators);
  const oscillatorsMixer = createOscillatorsMixer(context, oscillatorGains);

  const output = new GainNode(context);
  oscillatorsMixer.connect(output);

  return {
    oscillators,
    oscillatorGains,
    output
  };
}

/**
 * Creates an LFO structure, culminating in a final gain node that can be used to modulate the output.
 * @param context The audio context to use.
 * @param frequency The frequency to use for the LFO.
 * @param gain The gain to use for the variable portion of the LFO.
 * @returns The resulting LFO chain.
 */
function createLfoStructure(context: AudioContext, frequency: number, gain: number): LfoChain {
  // Start with the oscillator
  const oscillator = new OscillatorNode(context, { type: 'sine' });
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);

  // Feed that into a variable gain node for when the LFO is "on"
  const oscillatorGain = new GainNode(context);
  oscillator.connect(oscillatorGain);

  // Create a constant gain node for when the LFO is "off"
  const constantSource = new ConstantSourceNode(context);
  const constantGain = new GainNode(context);
  constantSource.connect(constantGain);

  // Combine the on/off channels
  const gainMixer = new ChannelMergerNode(context, { numberOfInputs: 2, channelCount: 1 });
  oscillatorGain.connect(gainMixer);
  constantGain.connect(gainMixer);

  // Connect the the mixed LFO output to the final output node
  const lfoOutput = new GainNode(context);
  gainMixer.connect(lfoOutput.gain);

  // Make sure the wet/dry balance is configured
  setWetDryBalance(oscillatorGain, constantGain, gain, context.currentTime);

  return {
    oscillator,
    oscillatorGain,
    constantGain,
    lfoOutput
  }
}

/**
 * Creates a reverb structure that supports variable gain.
 * @param context The audio context to use.
 * @param gain The gain to use for the reverb.
 * @param input The incoming audio to reverb.
 * @returns The resulting reverb chain.
 */
function createReverbStructure(context: AudioContext, gain: number, input: AudioNode): ReverbChain {
  // Create a reverb node - the buffer will be set up later
  const reverbConvolver = new ConvolverNode(context);

  // Create a gain node for when reverb is being used
  const wetGain = new GainNode(context);
  reverbConvolver.connect(wetGain);

  // Create a gain node for when reverb is *not* being used
  const dryGain = new GainNode(context);

  // Combine the reverb nodes in a mixer
  const reverbOutput = new ChannelMergerNode(context, { numberOfInputs: 2, channelCount: 1});
  wetGain.connect(reverbOutput);
  dryGain.connect(reverbOutput);

  // Ensure the input node feeds into both the convolver and the "dry" gain
  input.connect(reverbConvolver);
  input.connect(dryGain);

  // Make sure the wet/dry balance is configured
  setWetDryBalance(wetGain, dryGain, gain, context.currentTime);

  return {
    reverbConvolver,
    wetGain,
    dryGain,
    reverbOutput
  }
}

/**
 * Starts all oscillator nodes in the provided chains.
 * @param chains The chains containing the oscillator nodes.
 */
function startOscillators(...chains: (FrequencyOscillatorChain | null)[]): void {
  for (let chain of chains) {
    // Skip over nulls
    if (chain === null) {
      continue;
    }

    chain.oscillators.square.start();
    chain.oscillators.sawtooth.start();
    chain.oscillators.sine.start();
  }
}

/**
 * Assigns a periodic wave to all oscillator nodes of a particular type.
 * @param context The audio context to use.
 * @param wavetableJson The JSON for the wavetable.
 * @param type The type of oscillator nodes to update.
 * @param chains The chains containing the oscillator nodes.
 */
function assignWaveformTable(context: AudioContext | null, wavetableJson: any, type: 'square' | 'sawtooth' | 'sine', ...chains: (FrequencyOscillatorChain | null)[]): void {
  // Make sure we have a context
  if (context === null) {
    return;
  }

  // Make sure we have JSON
  if (!wavetableJson || !Array.isArray(wavetableJson['real']) || !Array.isArray(wavetableJson['imag'])) {
    return;
  }

  // Build the wavetable from the specified JSON
  const wave = new PeriodicWave(context, { real: wavetableJson['real'], imag: wavetableJson['imag'] });

  for (let chain of chains) {
    // Skip over nulls
    if (chain === null) {
      continue;
    }

    switch (type) {
      case 'square':
        chain.oscillators.square.setPeriodicWave(wave);
        break;

      case 'sawtooth':
        chain.oscillators.sawtooth.setPeriodicWave(wave);
        break;

      case 'sine':
        chain.oscillators.sine.setPeriodicWave(wave);
        break;
    }
  }
}

/**
 * Updates all oscillator nodes in the provided chains to use the specified frequency.
 * @param frequency The frequency to use.
 * @param atTime The time at which to assign the frequency.
 * @param chains The chains containing the oscillator nodes to update.
 */
function assignWaveformFrequency(frequency: number, atTime: number, ...chains: (FrequencyOscillatorChain | null)[]): void {
  for (let chain of chains) {
    // Skip over nulls
    if (chain === null) {
      continue;
    }

    chain.oscillators.square.frequency.setValueAtTime(frequency, atTime);
    chain.oscillators.sawtooth.frequency.setValueAtTime(frequency, atTime);
    chain.oscillators.sine.frequency.setValueAtTime(frequency, atTime);
  }
}

/**
 * Updates all waveform-specific gain nodes in the provided chains to use the indicated waveform-specific gain levels.
 * @param square The gain level to use for square waveforms.
 * @param sawtooth The gain level to use for sawtooth waveforms.
 * @param sine The gain level to use for sine waveforms.
 * @param atTime The time at which to assign the gain levels.
 * @param chains The chains containing the oscillator nodes to update.
 */
function assignWaveformGains(square: number, sawtooth: number, sine: number, atTime: number, ...chains: (FrequencyOscillatorChain | null)[]): void {
  for (let chain of chains) {
    // Skip over nulls
    if (chain === null) {
      continue;
    }

    chain.oscillatorGains.square.gain.setValueAtTime(square, atTime);
    chain.oscillatorGains.sawtooth.gain.setValueAtTime(sawtooth, atTime);
    chain.oscillatorGains.sine.gain.setValueAtTime(sine, atTime);
  }
}

/**
 * Updates the provided pair of wet/dry gain nodes to reflect the specified "wet" gain.
 * @param wetNode The gain node controlling the "wet" processed signal.
 * @param dryNode The gain node controlling the "dry" unprocessed signal.
 * @param wetGain The amount of gain to apply to the "wet" signal, on a 0.0-1.0 scale.
 * @param atTime The time at which to assign the gain levels.
 */
function setWetDryBalance(wetNode: GainNode, dryNode: GainNode, wetGain: number, atTime: number) {
  wetNode.gain.setValueAtTime(wetGain, atTime);
  dryNode.gain.setValueAtTime(1.0 - wetGain, atTime);
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
   * The node chain to use for the base frequency.
   */
  private baseFrequencyChain: FrequencyOscillatorChain | null = null;

  /**
   * The node chain to use for the major third frequency.
   */
  private thirdFrequencyChain: FrequencyOscillatorChain | null = null;

  /**
   * The node chain to use for the perfect fifth frequency.
   */
  private fifthFrequencyChain: FrequencyOscillatorChain | null = null;

  /**
   * The node chain to use for the LFO effect.
   */
  private lfoChain: LfoChain | null = null;

  /**
   * The node chain to use for the reverb effect.
   */
  private reverbChain: ReverbChain | null = null;

  /**
   * The frequency that is used for the output volume.
   */
  private lfoFrequency: number = 15; // XXX: See if this can be better consolidated with the SoundInterface UI default

  /**
   * The gain level that is used for the LFO "on" gain node.
   * The LFO "off" gain node is 1.0 minus this value.
   */
  private lfoGain: number = 0.25; // XXX: See if this can be better consolidated with the SoundInterface UI default
 
   /**
    * The gain level that is used for the reverb "on" gain node.
    * The reverb "off" gain node is 1.0 minus this value.
    */
   private reverbGain: number = 0.0; // XXX: See if this can be better consolidated with the SoundInterface UI default

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

    // Set up the frequency chains
    this.baseFrequencyChain = createOscillatorStructure(this.audioContext);
    this.thirdFrequencyChain = createOscillatorStructure(this.audioContext, 4);
    this.fifthFrequencyChain = createOscillatorStructure(this.audioContext, 7);

    // Create an overall mixer between the various frequency chains
    const chainsMixer = new ChannelMergerNode(this.audioContext, { numberOfInputs: 3, channelCount: 1 });
    this.baseFrequencyChain.output.connect(chainsMixer);
    this.thirdFrequencyChain.output.connect(chainsMixer);
    this.fifthFrequencyChain.output.connect(chainsMixer);

    // Create the LFO chain and ensure the mixed frequency chains funnel into it
    this.lfoChain = createLfoStructure(this.audioContext, this.lfoFrequency, this.lfoGain);
    chainsMixer.connect(this.lfoChain.lfoOutput);

    // Feed the LFO output into the reverb structure
    this.reverbChain = createReverbStructure(this.audioContext, this.reverbGain, this.lfoChain.lfoOutput);

    // Create an overall gain node so that we can control final volume
    this.overallVolumeGainNode = new GainNode(this.audioContext);
    this.overallVolumeGainNode.gain.setValueAtTime(this.overallVolumeGain, this.audioContext.currentTime);

    this.reverbChain.reverbOutput.connect(this.overallVolumeGainNode);
    this.overallVolumeGainNode.connect(this.audioContext.destination);

    // We're done!
    this.structureInitialized = true;

    // Switch oscillators over to use wavetables
    fetch(process.env.PUBLIC_URL + '/assets/google/wavetable_08_Warm_Square')
      .then((response) => response.json())
      .then((tableJson) => {
        assignWaveformTable(this.audioContext, tableJson, 'square', this.baseFrequencyChain, this.thirdFrequencyChain, this.fifthFrequencyChain);
      })
      .catch((reason) => {
        console.error('error retrieving square wavetable', reason);
      });

    fetch(process.env.PUBLIC_URL + '/assets/google/wavetable_06_Warm_Saw')
      .then((response) => response.json())
      .then((tableJson) => {
        assignWaveformTable(this.audioContext, tableJson, 'sawtooth', this.baseFrequencyChain, this.thirdFrequencyChain, this.fifthFrequencyChain);
      })
      .catch((reason) => {
        console.error('error retrieving saw wavetable', reason);
      });

    fetch(process.env.PUBLIC_URL + '/assets/google/wavetable_Celeste')
      .then((response) => response.json())
      .then((tableJson) => {
        assignWaveformTable(this.audioContext, tableJson, 'sine', this.baseFrequencyChain, this.thirdFrequencyChain, this.fifthFrequencyChain);
      })
      .catch((reason) => {
        console.error('error retrieving sine wavetable', reason);
      });

    // Ensure that we have an impulse response for the reverb
    fetch(process.env.PUBLIC_URL + '/assets/google/impulse-responses_matrix-reverb6.wav')
      .then((response) => response.arrayBuffer())
      .then((buffer) => this.audioContext!.decodeAudioData(buffer))
      .then((audioData) => {
        if (this.reverbChain) {
          console.debug('reverb chain initialized');
          this.reverbChain.reverbConvolver.buffer = audioData;
        }
      })
      .catch((reason) => {
        console.error('error retrieving reverb data', reason);
      });
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
    assignWaveformGains(
      redSquareComponent,
      greenSawComponent,
      blueSineComponent,
      this.audioContext!.currentTime,
      this.baseFrequencyChain,
      this.thirdFrequencyChain,
      this.fifthFrequencyChain);
  }

  private cascadeSaturationToAudioNodes(): void {
    // Don't do anything if we don't have an audio context yet
    if (this.audioContext === null) {
      return;
    }

    // Apply the saturation as a gain value to all chord nodes
    const chordGains = clamp(this.saturation, 0, 100) / 100.0;

    this.thirdFrequencyChain?.output.gain.setValueAtTime(chordGains, this.audioContext!.currentTime);
    this.fifthFrequencyChain?.output.gain.setValueAtTime(chordGains, this.audioContext!.currentTime);
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

    assignWaveformFrequency(
      frequency,
      this.audioContext!.currentTime,
      this.baseFrequencyChain,
      this.thirdFrequencyChain,
      this.fifthFrequencyChain);
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

      // Start all of the oscillators in the frequency chain
      startOscillators(this.baseFrequencyChain, this.thirdFrequencyChain, this.fifthFrequencyChain);

      // Ensure the LFO chain is also initialized
      if (this.lfoChain !== null) {
        this.lfoChain.oscillator.start();
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
   * Changes the reverb intensity.
   * @param intensity The reverb intensity, on a 0.0-1.0 scale.
   */
   public changeReverbIntensity(intensity: number) {
    this.reverbGain = clamp(intensity, 0.0, 1.0);

    // Don't do anything else if we don't have audio in place yet
    if (this.audioContext === null || this.reverbChain === null || !this.structureInitialized) {
      return;
    }

    setWetDryBalance(this.reverbChain.wetGain, this.reverbChain.dryGain, this.reverbGain, this.audioContext.currentTime);
  }

  /**
   * Changes the LFO intensity.
   * @param intensity The LFO intensity, on a 0.0-1.0 scale.
   */
  public changeLfoIntensity(intensity: number) {
    this.lfoGain = clamp(intensity, 0.0, 1.0);

    // Don't do anything else if we don't have audio in place yet
    if (this.audioContext === null || this.lfoChain === null || !this.structureInitialized) {
      return;
    }

    setWetDryBalance(this.lfoChain.oscillatorGain, this.lfoChain.constantGain, this.lfoGain, this.audioContext.currentTime);
  }

  /**
   * Changes the LFO frequency.
   * @param frequency The LFO frequency, on a 1-30 Hz scale.
   */
  public changeLfoFrequency(frequency: number) {
    this.lfoFrequency = clamp(frequency, 1, 30);

    // Don't do anything else if we don't have audio in place yet
    if (this.audioContext === null || this.lfoChain === null || !this.structureInitialized) {
      return;
    }

    this.lfoChain.oscillator.frequency.setValueAtTime(this.lfoFrequency, this.audioContext.currentTime);
  }
}
