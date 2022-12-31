# hex-grid

hex-grid is an in-browser color and audio hexagonal-grid scroller, implemented using the following libraries:

- [React](https://reactjs.org/)
- [React Redux](https://react-redux.js.org/)
- [honeycomb-grid](https://github.com/flauwekeul/honeycomb)

This project is written in TypeScript and makes use of [the Hooks API](https://reactjs.org/docs/hooks-intro.html). All primary components use the [functional component style](https://reactjs.org/docs/components-and-props.html#function-and-class-components). It was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

The Redux store consists of two separate slices - one for the structure and layout of the hexagonal grid (`hexGridSlice`) and one for the currently-selected color (`colorSlice`).

## Grid Structure and Coloring

The [hexagonal grid](https://www.redblobgames.com/grids/hexagons/#basics) is laid out using flat-topped coordinates with an "odd-q" vertical layout. This was selected so that a pure up/down axis would be available as a scrolling dimension.

The `Grid` component renders out the structure of an SVG element, including relatively-positioning the element such that the center hex will be aligned with the center of the viewport. Individual cells in the hexagonal grid are represented using `Cell` components, which are transformed to the appropriate locations in the parent SVG based on their coordinates.

Instead of using the traditional RGB color representation for traversal, [the HSL (hue, saturation, lightness) color space](https://en.wikipedia.org/wiki/HSL_and_HSV) was selected instead. This allowed for:

- More varied displayed ranges of colors relative to the "main" color
- Easier ways to navigate out of uninteresting monochrome colors
- More intuitive differences in ranges for the scrolling axes

To help indicate how various scrolling/panning actions will change the color values, a drag overlay, complete with icon, is displayed when the user begins a mouse/touch drag event. This also has the bonus effect of intercepting touch events on mobile devices that would otherwise cause undesired effects (such as pull-to-refresh or pinch-to-zoom). The icon for this is encapsulated within `DragGuideIcon` to allow for more dynamically-generated SVG content.

The `ColorCycler` component is responsible for cycling color values on a periodic timer and providing UI to control this behavior.

The `ColorChangeHandler` component is responsible for updating the application theme color and icon based on the currently-selected color.

### Keyboard Shortcuts

The following keyboard shortcuts are supported:

- **Hue**
  - Increase: `→` or `Numpad 6`
  - Decrease: `←` or `Numpad 4`
- **Saturation**
  - Increase: `↑` or `Numpad 8`
  - Decrease: `↓` or `Numpad 2`
- **Lightness**
  - Increase: `+` or `Numpad +`
  - Decrease: `-` or `Numpad -`

## Audio Structure

The `SoundInterface` component provides the user-facing aspects of the audio behavior, but the `soundManager` class encapsulates all of the direct interaction with the Web Audio API. The overall chain created by this class is described in [the audio.dot Graphviz file](audio.dot). 

The key audio sources for this structure are provided by oscillator "chains". Each chain consists of three separate oscillators, each with a different waveform type, and three corresponding gain nodes that allow for controlling which waveforms are heard for that chain. Furthermore, each chain ultimately terminates in a chain-specific gain node which allows for controlling how much that specific chain contributes to the overall mix.

Four oscillator chains are set up. The first is tuned to the root frequency, the second is by default tuned to a major third of the root frequency (4 semitones), the third is by default tuned to a perfect fifth of the root frequency (7 semitones), and the fourth is by default not used but available for seventh chords. In addition, a sine-based LFO chain and reverb structure are applied to the combined result of these oscillator chains.

Various state properties control the output of the audio:

- The **hue** of the color controls the relative gain levels of the waveforms.
- The **saturation** of the color controls the gain levels of the third, fifth, and seventh oscillator chains. (The gain level of the root frequency oscillator chain is not affected.)
- The **lightness** of the color controls the root frequency used across all waveform oscillators.

To resolve concerns with auto-play blocking (including those that arise from async/Promise-based click handlers), as much initialization code as possible is synchronous and on-demand. While oscillator wavetables are still loaded asynchronously, placeholder "raw" oscillator types are set when the oscillators are initialized. For the reverb convolver, which also requires asynchronously loading the impulse responses, the reverb intensity is started at 0.

### Chord Progressions

When enabled, the sound manager will randomly select chord progressions to play through. When a chord progression is playing, the `detune` values of the oscillators, but not the base `frequency` values, will be modified to achieve the desired pitches.

Chord progressions are defined in the `ChordProgressions` collection. Each of these consists of a list of `Chord` values. Each `Chord` value has a set number of semitones from the root frequency (applied across all oscillator chains), as well as a collection of oscillator-specific semitone values to individually apply to the root, third, fifth, and seventh frequency oscillator chains. When a particular oscillator chain is not in use, it is set to the same number of semitones as the root frequency.

To play discrete notes without shutting off the oscillators (as oscillators cannot be re-started once stopped), the result of the mixed oscillator chains is fed through a "start/stop" gain node. When a chord is playing, its gain will be 1.0, but during rests, its gain will be 0.0.

## Assets

Where indicated, this project includes assets from the following projects:

- [Web Audio API samples](https://github.com/GoogleChromeLabs/web-audio-samples) for impulse responses and wavetables (Apache License 2.0)
- [feather](https://github.com/feathericons/feather) for iconography (MIT License)

The wave tables provided in the web audio API samples were adjusted slightly to be compatible with JSON deserialization.

