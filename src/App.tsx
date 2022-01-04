import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";

import './App.css';
import Grid from './Grid';
import ColorChangeHandler from './ColorChangeHandler';
import DragGuideIcon from "./DragGuideIcon";

function App(): JSX.Element {
  const dispatch = useAppDispatch();
  const baseHexSize = useAppSelector((state) => state.hexGrid.baseHexSize);
  const [isPanning, setIsPanning] = useState(false);
  const [helpOverlayX, setHelpOverlayX] = useState(0);
  const [helpOverlayY, setHelpOverlayY] = useState(0);
  const lastPannedClientX = useRef(0);
  const lastPannedClientY = useRef(0);

  // Ensure that we resize the grid when the window resizes
  useEffect(() => {
    const handleResize = (): void => {
      setIsPanning(false);
      dispatch({ type: 'hexGrid/resize' });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize)
    };
  }, [dispatch]);
  
  // Listen to keyboard events to scale color values
  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      // Numpad left/right and arrow left/right control hue
      // Numpad up/down and arrow up/down control saturation    
      // Plus and minus control luminance
      const scaleFactor = 1;
  
      switch(event.code) {
        case 'Numpad8':
        case 'ArrowUp':
          dispatch({ type: 'color/adjustSaturation', payload: scaleFactor });
          break;
  
        case 'Numpad2':
        case 'ArrowDown':
          dispatch({ type: 'color/adjustSaturation', payload: -scaleFactor });
          break;
  
        case 'Numpad6':
        case 'ArrowRight':
          dispatch({ type: 'color/adjustHue', payload: scaleFactor });
          break;
  
        case 'Numpad4':
        case 'ArrowLeft':
          dispatch({ type: 'color/adjustHue', payload: -scaleFactor });
          break;
  
        case 'NumpadAdd':
        case 'Equal':
          dispatch({ type: 'color/adjustLightness', payload: scaleFactor });
          break;
  
        case 'NumpadSubtract':
        case 'Minus':
          dispatch({ type: 'color/adjustLightness', payload: -scaleFactor });
          break;
  
        default:
          // no-op
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [dispatch]);

  // Listen to when we start panning and store the initial coordinates
  // so we can get relative values
  useEffect(() => {
    const handlePanStart = (event: TouchEvent | MouseEvent): void => {
      // Skip when we're already panning
      // XXX: Investigate whether we can use this to prevent creating the event handler in the first place
      if (isPanning) {
        return;
      }
  
      // Switch based on whether this is a touch or mouse event
      let currentClientX: number;
      let currentClientY: number;

      if (event.type === 'touchstart') {
        const touchEvent = event as TouchEvent;
  
        // Don't do anything with multi-touch
        if (touchEvent.touches.length !== 1) {
          return;
        }
  
        currentClientX = touchEvent.touches[0].clientX;
        currentClientY = touchEvent.touches[0].clientY;
      }
      else if (event.type === 'mousedown') {
        const mouseEvent = event as MouseEvent;
  
        currentClientX = mouseEvent.clientX;
        currentClientY = mouseEvent.clientY;
      }
      else {
        return;
      }

      setIsPanning(true);
      lastPannedClientX.current = currentClientX;
      lastPannedClientY.current = currentClientY;

      // Also update the help overlay position
      setHelpOverlayX(currentClientX);
      setHelpOverlayY(currentClientY);
  
      console.log(`pan start: (${currentClientX}, ${currentClientY})`);
    }

    // Handle both touch/mouse events for panning
    window.addEventListener('touchstart', handlePanStart);
    window.addEventListener('mousedown', handlePanStart);

    return () => {
      window.removeEventListener('touchstart', handlePanStart);
      window.removeEventListener('mousedown', handlePanStart);
    }
  }, [dispatch, isPanning]);

  // Add an effect that will start to change colors as we drag far enough
  useEffect(() => {
    const handlePanMove = (event: TouchEvent | MouseEvent): void => {
      // Make sure we're panning
      // XXX: Investigate whether we can use this to prevent creating the event handler in the first place
      if (!isPanning) {
        return;
      }
  
      let currentClientX: number;
      let currentClientY: number;
  
      // Switch based on whether this is a touch or mouse event
      if (event.type === 'touchmove') {
        const touchEvent = event as TouchEvent;
  
        // Don't do anything with multi-touch
        if (touchEvent.touches.length !== 1) {
          return;
        }
  
        // Determine the "current" panning values to use
        currentClientX = touchEvent.touches[0].clientX;
        currentClientY = touchEvent.touches[0].clientY;
      }
      else if (event.type === 'mousemove') {
        const mouseEvent = event as MouseEvent;
        
        currentClientX = mouseEvent.clientX;
        currentClientY = mouseEvent.clientY;
      }
      else {
        return;
      }
  
      // Determine the distance between the click and our "last panned" value.
      // If it's larger than our base hex size, we want to shift one of the colors
      const scaleFactor = 6;
      const distanceX = currentClientX - lastPannedClientX.current;
      const distanceY = currentClientY - lastPannedClientY.current;
      const distanceTotal = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

      // Periodically update the hex guide
      if (distanceTotal >= baseHexSize / 2) {
        setHelpOverlayX(currentClientX);
        setHelpOverlayY(currentClientY);
      }
  
      if (distanceTotal >= 2 * baseHexSize) {
        // When calculating atan2, invert the y-distance because HTML coordinates are in reverse
        const atan = Math.atan2(-distanceY / distanceTotal, distanceX / distanceTotal);
        let angle = atan * 180 / Math.PI;
  
        // Normalize the angle to 0-360 to simplify
        if (angle < 0) {
          angle += 360;
        }
  
        console.log(`pan threshold met (angle: ${angle})`);
  
        // Now map the different axes (assuming 6 "chunks")
        if (angle <= 60) {
          // Right and up - adjust lightness
          dispatch({ type: 'color/adjustLightness', payload: -scaleFactor });
        }
        else if (angle <= 120) {
          // Straight up - adjust saturation downward
          dispatch({ type: 'color/adjustSaturation', payload: -scaleFactor });
        }
        else if (angle <= 180) {
          // Left and up - adjust hue
          dispatch({ type: 'color/adjustHue', payload: scaleFactor });
        }
        else if (angle <= 240) {
          // Left and down - adjust lightness
          dispatch({ type: 'color/adjustLightness', payload: scaleFactor });
        }
        else if (angle <= 300) {
          // Straight down - adjust saturation upward
          dispatch({ type: 'color/adjustSaturation', payload: scaleFactor });
        }
        else {
          // Right and down - adjust hue
          dispatch({ type: 'color/adjustHue', payload: -scaleFactor });
        }
  
        // Update our "last panned" value
        lastPannedClientX.current = currentClientX;
        lastPannedClientY.current = currentClientY;

        // Add a minor click
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    };
    
    // Handle both touch/mouse events for panning
    window.addEventListener('touchmove', handlePanMove);
    window.addEventListener('mousemove', handlePanMove);

    return () => {
      window.removeEventListener('touchmove', handlePanMove);
      window.removeEventListener('mousemove', handlePanMove);
    }
  }, [dispatch, baseHexSize, isPanning]);

  // Add an effect to handle when we want to stop panning
  useEffect(() => {
    const handlePanEnd = (): void => {
      if (isPanning) {
        console.log('pan end');
      }
  
      setIsPanning(false);
    };

    // Handle both touch/mouse events for panning
    window.addEventListener('touchend', handlePanEnd);
    window.addEventListener('touchcancel', handlePanEnd);
    window.addEventListener('mouseup', handlePanEnd);

    return () => {
      window.removeEventListener('touchend', handlePanEnd);
      window.removeEventListener('touchcancel', handlePanEnd);
      window.removeEventListener('mouseup', handlePanEnd);
    }
  }, [isPanning]);

  return (
    <div
      style={{'cursor': isPanning ? 'grabbing' : 'grab'}}
    >
      <div
        className="dragGuide"
        style={{
          'display': isPanning ? 'block' : 'none',
          'top': helpOverlayY,
          'left': helpOverlayX
        }}
      >
        <DragGuideIcon />
      </div>
      <Grid />
      <ColorChangeHandler />
    </div>
  );
}

export default App;
