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
  const baseHexSize = useAppSelector((state) => state.hexGrid.baseHexSize);

  // Map each cell to a discrete component.
  const cellElements = useMemo(
    () => {
      return selectGridHexes(gridDimensions, baseHexSize)
        .map((hex) => {
          return <Cell
            key={hexToKey(hex)}
            hex={hex}
          />
        });
    },
    [gridDimensions, baseHexSize]);

  const style = {
    width: screenDimensions.width + cellDimensions.width,
    height: screenDimensions.height + cellDimensions.height,
    marginLeft: -(cellDimensions.width / 2.0),
    marginTop: -(cellDimensions.height / 2.0)
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
