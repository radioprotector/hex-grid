import { useMemo } from "react";

import { Hex } from "honeycomb-grid";
import { useAppSelector } from "./hooks";
import { selectGridHexes } from "./state/hexGridSlice";

import Cell from './Cell';

/**
 * Generates a key for the provided hex element.
 * @param hex The hex element.
 * @returns The key for the hex.
 */
 function hexToKey(hex: Hex<any>): string {
  // Use the QRS cubic coordinates to map this
  return `${hex.q}~${hex.r}~${hex.s}`;
}

function Grid(): JSX.Element {
  const screenDimensions = useAppSelector((state) => state.hexGrid.screenDimensions);
  const gridDimensions = useAppSelector((state) => state.hexGrid.gridDimensions);
  const cellDimensions = useAppSelector((state) => state.hexGrid.cellDimensions);
  const centerCoord = useAppSelector((state) => state.hexGrid.centerCoord);
  const baseHexSize = useAppSelector((state) => state.hexGrid.baseHexSize);

  // Map each cell to a discrete component.
  const cellHexes = useMemo(
    () => {
      return selectGridHexes(gridDimensions, centerCoord, baseHexSize);
    },
    [gridDimensions, centerCoord, baseHexSize]);

  const cellElements = useMemo(
    () => {
      return cellHexes.map((hex) => {
          return <Cell
            key={hexToKey(hex)}
            hex={hex}
          />
        });
    },
    [cellHexes]);

  // Move the cells to the up and left in a way that will align the center.
  // At a minimum, we need to ensure that the gaps between the "offset" rows/columns aren't visible.
  let verticalOffset = -cellDimensions.height / 2.0;
  verticalOffset -= (cellDimensions.height - (screenDimensions.height % cellDimensions.height)) / 2.0;

  let horizontalOffset = cellDimensions.width * -0.75;
  horizontalOffset += 0.25 * (screenDimensions.width % cellDimensions.width);

  const style = {
    position: 'relative' as const,
    width: `calc(100vw + ${cellDimensions.width}px)`,
    height: `calc(100vh + ${cellDimensions.height}px)`,
    left: horizontalOffset,
    top: verticalOffset,
    overflow: 'visible'
  };

  return (
    <svg
      style={style}
    >
      {cellElements}
    </svg>
  );
}

export default Grid;
